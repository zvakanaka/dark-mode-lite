let firstRun = true;

function addDarkModeStyle() {
  const style = document.createElement('style');
  style.textContent = `
  body[dark-mode-light="true"] {
    filter: invert(100%);
    background: black;
  }
  body[dark-mode-light="true"] img,
  body[dark-mode-light="true"] video,
  body[dark-mode-light="true"] picture,
  body[dark-mode-light="true"] canvas,
  body[dark-mode-light="true"] [style*="background-image"] {
    filter: invert(100%);
  }`;
  document.querySelector('head').appendChild(style);
}
function setBodyAttr(value) {
  document.body.setAttribute('dark-mode-light', value);
  if (value && firstRun) {
    addDarkModeStyle();
    firstRun = false;
  }
}

function alreadyDark() {
  const colorSets = Array.from(document.elementsFromPoint(0, 0)).map(el => {
    const bg = getComputedStyle(el).background
    console.log(bg)
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

  // setBodyAttr(storedObj.darkMode);
  return isDarkMode;
}

(async () => {
  // console.log('checking dark mode again')
  const isDarkMode = await getDarkMode();
  setBodyAttr(isDarkMode);
})();

// Listen for messages from the background script (popup.js)
chrome.runtime.onMessage.addListener((message) => {
  if (message.command === 'set-dark-mode') {
    setBodyAttr(message.isDarkMode && !alreadyDark());
  }
});
