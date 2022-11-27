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

async function getDarkMode() {
  const storedObj = await chrome.storage.local.get('darkMode');
  if (storedObj === null || typeof storedObj === 'undefined') {
    setDarkMode(true);
    return true;
  }
  setBodyAttr(storedObj.darkMode);
  return storedObj.darkMode;
}

(async () => {
  const isDarkMode = await getDarkMode();
  setBodyAttr(isDarkMode);
})();

// Listen for messages from the background script (popup.js)
 chrome.runtime.onMessage.addListener((message) => {
  if (message.command === 'set-dark-mode') {
    setBodyAttr(message.isDarkMode);
  }
});