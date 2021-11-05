//selectors and variables
const colorDivs = document.querySelectorAll(".color");
const generateButton = document.querySelector(".generate");
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexes = document.querySelectorAll(".color h2");
const popup = document.querySelector(".copy-container");
const adjustButton = document.querySelectorAll(".adjust");
const lockButton = document.querySelectorAll(".lock");
const closeAdjustButton = document.querySelectorAll(".close-adjustment");
const sliderContainer = document.querySelectorAll(".sliders");
let initialColors;
//localstorage
let savedPalettes = [];

//event listeners
document.addEventListener("DOMContentLoaded", randomColors);
document.addEventListener("DOMContentLoaded", getLocalStorage);
generateButton.addEventListener("click", randomColors);
sliders.forEach((slider) => {
  slider.addEventListener("input", hslControls);
});
colorDivs.forEach((div, index) => {
  div.addEventListener("change", () => {
    updateTextUI(index);
  });
});
currentHexes.forEach((hex) => {
  hex.addEventListener("click", () => {
    copytToClipboard(hex);
  });
});
popup.addEventListener("transitionend", () => {
  const popupBox = popup.children[0];
  popup.classList.remove("active");
  popupBox.classList.remove("active");
});
adjustButton.forEach((button, index) => {
  button.addEventListener("click", () => {
    openAdjustmentPanel(index);
  });
});
closeAdjustButton.forEach((button, index) => {
  button.addEventListener("click", () => {
    closeAdjustmentPanel(index);
  });
});
lockButton.forEach((button, index) => {
  button.addEventListener("click", () => {
    lockColors(index);
  });
});

//functions
function generateHex() {
  //navie way of hex generation
  //     const letters = "0123456789ABCEF";
  //   const hex = "#";
  //   for (let i = 0; i < 6; i++) {
  //     hex += letters[Math.floor(Math.random() * 16)];
  //   }
  //   return hex;

  //generation using chroma js
  const hexColor = chroma.random();
  return hexColor;
}

function randomColors() {
  initialColors = [];
  colorDivs.forEach((div, index) => {
    //get the h2 element of the color div
    const hexText = div.children[0];
    const icons = div.querySelectorAll(".controls button");
    const sliderContainer = div.querySelector(".sliders");
    const randomColor = generateHex();

    //add the color to the initaial color array
    if (div.classList.contains("locked")) {
      initialColors.push(hexText.innerText);
      return;
    } else {
      initialColors.push(chroma(randomColor).hex());
    }

    //Add the generated color to the background
    div.style.backgroundColor = randomColor;
    hexText.innerText = randomColor;

    //check the luminance and change the text
    checkTextContrast(randomColor, hexText);
    for (icon of icons) checkTextContrast(randomColor, icon);
    checkTextContrast(randomColor, sliderContainer, "slider");

    //initial colorize sliders
    const color = chroma(randomColor);
    const sliders = div.querySelectorAll(".sliders input");
    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];

    colorizeSliders(color, hue, brightness, saturation);
  });

  //reset inputs
  resetInputs();

  //alternate for checking the luminance and changing the button colors
  // adjustButton.forEach((button, index) => {
  //   checkTextContrast(initialColors[index], button);
  //   checkTextContrast(initialColors[index], lockButton[index]);
  // });
}

function checkTextContrast(color, text, type = "no-slider") {
  const luminance = chroma(color).luminance();
  if (type === "slider") {
    if (luminance > 0.5) {
      text.style.color = "white";
      text.style.backgroundColor = "black";
    } else {
      text.style.color = "black";
      text.style.backgroundColor = "white";
    }
  } else {
    if (luminance > 0.5) {
      text.style.color = "black";
    } else {
      text.style.color = "white";
    }
  }
}

function colorizeSliders(color, hue, brightness, saturation) {
  // scale the saturation
  const noSat = color.set("hsl.s", 0);
  const fullSat = color.set("hsl.s", 1);
  const satScale = chroma.scale([noSat, color, fullSat]);

  //sclae brightness
  const midBright = color.set("hsl.l", 0.5);
  const brightnessScale = chroma.scale(["black", midBright, "white"]);

  // no need to scale hue as it is same for everything

  //update the color scale to the input sliders

  //saturation
  saturation.style.backgroundImage = `linear-gradient(to right, ${satScale(
    0
  )}, ${satScale(1)})`;

  //brightness
  brightness.style.backgroundImage = `linear-gradient(to right, ${brightnessScale(
    0
  )}, ${brightnessScale(0.5)}, ${brightnessScale(1)})`;

  //hue
  hue.style.backgroundImage = `linear-gradient(to right, rgb(204,75,75), rgb(204,204,75), rgb(75,204,75), rgb(75,204,204), rgb(75, 75, 204), rgb(204,75,204), rgb(204, 75,75) )`;
}

function hslControls(e) {
  const index =
    e.target.getAttribute("data-bright") ||
    e.target.getAttribute("data-sat") ||
    e.target.getAttribute("data-hue");

  let sliders = e.target.parentElement.querySelectorAll('input[type="range"');

  const hue = sliders[0];
  const brightness = sliders[1];
  const saturation = sliders[2];

  const bgColor = initialColors[index];

  let color = chroma(bgColor)
    .set("hsl.s", saturation.value)
    .set("hsl.l", brightness.value)
    .set("hsl.h", hue.value);

  colorDivs[index].style.backgroundColor = color;

  //update slider inputs
  colorizeSliders(color, hue, brightness, saturation);
}

function updateTextUI(index) {
  const activeDiv = colorDivs[index];
  const color = chroma(activeDiv.style.backgroundColor);
  const textHex = activeDiv.querySelector("h2");
  const icons = activeDiv.querySelectorAll(".controls button");
  const sliderContainer = activeDiv.querySelector(".sliders");
  textHex.innerText = color.hex();

  //check the luminance of the text
  checkTextContrast(color, textHex);
  for (icon of icons) {
    checkTextContrast(color, icon);
  }
  checkTextContrast(color, sliderContainer, "slider");
}

function resetInputs() {
  const sliders = document.querySelectorAll(".sliders input");
  sliders.forEach((slider) => {
    if (slider.name === "hue") {
      const hueColor = initialColors[slider.getAttribute("data-hue")];
      const hueValue = Math.floor(chroma(hueColor).hsl()[0]);
      slider.value = hueValue;
    }
    if (slider.name === "brightness") {
      const brightnessColor = initialColors[slider.getAttribute("data-bright")];
      const brightnessValue =
        Math.floor(chroma(brightnessColor).hsl()[2] * 100) / 100;
      slider.value = brightnessValue;
    }
    if (slider.name === "saturation") {
      const saturationColor = initialColors[slider.getAttribute("data-sat")];
      const saturationValue =
        Math.floor(chroma(saturationColor).hsl()[1] * 100) / 100;
      slider.value = saturationValue;
    }
  });
}

function copytToClipboard(hex) {
  const ele = document.createElement("textarea");
  ele.value = hex.innerText;
  document.body.appendChild(ele);
  ele.select();
  document.execCommand("copy");
  document.body.removeChild(ele);

  //create animation for the modal
  const popupBox = popup.children[0];
  popup.classList.add("active");
  popupBox.classList.add("active");

  //alternate way to remove the popup
  //   setTimeout(() => {
  //     popup.classList.remove("active");
  //   }, 1000);
}

function openAdjustmentPanel(index) {
  sliderContainer[index].classList.toggle("active");
}

function closeAdjustmentPanel(index) {
  sliderContainer[index].classList.remove("active");
}

function lockColors(index) {
  //to toggle lock functionality
  colorDivs[index].classList.toggle("locked");
  if (lockButton[index].children[0].classList.contains("fa-lock-open")) {
    lockButton[index].children[0].classList.remove("fa-lock-open");
    lockButton[index].children[0].classList.add("fa-lock");
  } else {
    lockButton[index].children[0].classList.add("fa-lock-open");
    lockButton[index].children[0].classList.remove("fa-lock");
  }
}

//Implement save to palette and local storage

const saveButton = document.querySelector(".save");
const submitSave = document.querySelector(".submit-save");
const saveContainer = document.querySelector(".save-container");
const closeSave = document.querySelector(".close-save");
const saveInput = document.querySelector(".save-container input");
const libraryContainer = document.querySelector(".library-container");
const librarayButton = document.querySelector(".library");
const closeLibraryButton = document.querySelector(".close-library");

//event listeners
saveButton.addEventListener("click", openPalette);
closeSave.addEventListener("click", closePalette);
submitSave.addEventListener("click", savePalette);
librarayButton.addEventListener("click", openLibrary);
closeLibraryButton.addEventListener("click", closeLibrary);

function openPalette(e) {
  const popup = saveContainer.children[0];
  saveContainer.classList.add("active");
  popup.classList.add("active");
}

function closePalette(e) {
  const popup = saveContainer.children[0];
  saveContainer.classList.remove("active");
  popup.classList.remove("active");
}

function savePalette(e) {
  closePalette();
  const name = saveInput.value;
  const colors = [];
  currentHexes.forEach((hex) => {
    colors.push(hex.innerText);
  });
  //generate the object
  let paletteLength;
  if (checkLocalStorage()) paletteLength = checkLocalStorage().length;
  else paletteLength = savedPalettes.length;

  const palette = { name, colors, paletteLength };
  savedPalettes.push(palette);

  //save to local storage
  saveToLocalStorage(palette);
  saveInput.value = "";
  generateLibrary(palette);
}

function generateLibrary(palette) {
  //generate the palette for the library
  const paletteLib = document.createElement("div");
  const title = document.createElement("h4");
  paletteLib.classList.add("custom-palette");
  title.innerText = palette.name;
  const preview = document.createElement("div");
  preview.classList.add("small-preview");
  palette.colors.forEach((color) => {
    const colorDiv = document.createElement("div");
    colorDiv.style.backgroundColor = color;
    preview.appendChild(colorDiv);
  });
  const paletteButton = document.createElement("button");
  paletteButton.classList.add("palette-button");
  paletteButton.classList.add(palette.paletteLength);
  paletteButton.innerText = "Select";

  //attach an event to the button
  paletteButton.addEventListener("click", (e) => {
    closeLibrary();
    const paletteIndex = e.target.classList[1];
    initialColors = [];
    savedPalettes[paletteIndex].colors.forEach((color, index) => {
      initialColors.push(color);
      colorDivs[index].style.backgroundColor = color;
      const text = colorDivs[index].children[0];
      checkTextContrast(color, text);
      updateTextUI(index);
    });

    resetInputs();
  });

  //append to the library
  paletteLib.appendChild(title);
  paletteLib.appendChild(preview);
  paletteLib.appendChild(paletteButton);
  libraryContainer.children[0].appendChild(paletteLib);
}

function checkLocalStorage() {
  if (localStorage.getItem("palettes") === null) return [];
  else return JSON.parse(localStorage.getItem("palettes"));
}

function saveToLocalStorage(palette) {
  let localPalettes = checkLocalStorage();
  localPalettes.push(palette);
  localStorage.setItem("palettes", JSON.stringify(localPalettes));
}

function openLibrary() {
  const popup = libraryContainer.children[0];
  libraryContainer.classList.add("active");
  popup.classList.add("active");
}

function closeLibrary() {
  const popup = libraryContainer.children[0];
  libraryContainer.classList.remove("active");
  popup.classList.remove("active");
}

function getLocalStorage() {
  savedPalettes = checkLocalStorage();

  if (savedPalettes) {
    savedPalettes.forEach((palette) => {
      generateLibrary(palette);
    });
  }
}
