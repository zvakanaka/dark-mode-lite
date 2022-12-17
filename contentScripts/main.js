function addDarkModeStyle() {
  const style = document.createElement('style');
  style.id = 'dark-mode-lite';
  style.textContent = `
  :root {
    filter: invert(100%) hue-rotate(180deg);
    background: white;
  }
  img,
  video,
  picture,
  canvas,
  [style*="background-image"] {
    filter: invert(100%) hue-rotate(180deg);
  }`;
  document.querySelector('head').appendChild(style);
}
function removeDarkModeStyle() {
  const style = document.querySelector('#dark-mode-lite')
  if (style) {
    style.remove();
  }
}
function setDarkMode(value) {
  if (value) {
    addDarkModeStyle();
  } else {
    removeDarkModeStyle()
  }
}

function alreadyDark() {
  const colorSets = Array.from(document.elementsFromPoint(0, 0)).map(el => {
    const bg = getComputedStyle(el).background
    const rgb = bg.startsWith('rgb') ? bg?.split("(")[1].split(")")[0].split(",").map(colorStr => parseInt(colorStr, 10)) : null
    return rgb
  }).filter(Boolean)
  // console.log('colorSets', colorSets)
  const luminosity = colorSets?.[0]?.reduce((acc, cur) => {
    acc += cur
    return acc
  }, 0)
  // console.log('luminosity', luminosity, luminosity < 255)
  return luminosity && luminosity < 255
}

async function getDarkMode() {
  const storedObj = await chrome.storage.local.get('darkMode');
  if (storedObj === null || typeof storedObj === 'undefined') {
    setDarkMode(true);
    return true && !alreadyDark();
  }
  const isDarkMode = storedObj.darkMode && !alreadyDark()

  return isDarkMode;
}

(async () => {
  const isDarkMode = await getDarkMode();
  setDarkMode(isDarkMode);
})();

// Listen for messages from the background script (popup.js)
chrome.runtime.onMessage.addListener((message) => {
  if (message.command === 'set-dark-mode') {
    setDarkMode(message.isDarkMode && !alreadyDark());
  }
});
