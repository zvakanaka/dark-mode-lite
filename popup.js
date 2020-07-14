async function getDarkMode() {
  // https://github.com/mdn/webextensions-examples/blob/master/stored-credentials/storage.js
  const storedObj = await browser.storage.local.get();
  if (storedObj === null || typeof storedObj === 'undefined') {
    await setDarkMode(true);
    return true;
  }
  return storedObj.darkMode;
}

async function setDarkMode(value, cb = () => {}) {
  await chrome.storage.local.set({ darkMode: value });
  cb();
}

function tabDarkModeSet(_tabs, isDarkMode) {
  // https://developer.chrome.com/extensions/tabs#method-query
  chrome.tabs.query({}, (queryTabs) => {
    queryTabs.forEach(tab => {
      if (tab.url.startsWith('about:')) {
        return;
      }
      chrome.tabs.sendMessage(tab.id, {
        command: 'set-dark-mode',
        isDarkMode
      });
    });
  })
}

function reportError(err) {
  console.error(`Failed to set dark mode on tab: ${err}`);
}

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_second_WebExtension
function messageDarkMode(isDarkMode) {
  browser.tabs.query({ active: true, currentWindow: true })
    .then(tabs => tabDarkModeSet(tabs, isDarkMode))
    .catch(reportError);
}

(async () => {
  const isDarkModeCheckbox = document.querySelector('input[type="checkbox"]#is-dark-mode');
  const isDarkMode = await getDarkMode();
  document.body.setAttribute('dark-mode', isDarkMode);

  if (isDarkMode) {
    isDarkModeCheckbox.checked = true;
  }
  isDarkModeCheckbox.addEventListener('change', async () => {
    setDarkMode(isDarkModeCheckbox.checked, () => {
      messageDarkMode(isDarkModeCheckbox.checked);
      document.body.setAttribute('dark-mode', isDarkModeCheckbox.checked);
    });
  });
})();
