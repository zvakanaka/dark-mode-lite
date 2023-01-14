/* TODO: CODE COPIED FROM popup.js - MAKE CODE DRY */
const icons = {
  active: {
    48: '../icons/icon-48.png',
    96: '../icons/icon-96.png',
    128: '../icons/icon-128.png',
  },
  inactive: {
    48: '../icons/icon-light-48.png',
    96: '../icons/icon-light-96.png',
    128: '../icons/icon-light-128.png',
  },
}

if (typeof browser === "undefined") {
  var browser = chrome;
}
async function getDarkMode() {
  // https://github.com/mdn/webextensions-examples/blob/master/stored-credentials/storage.js
  const storedObj = await browser.storage.local.get();
  if (storedObj === null || typeof storedObj === 'undefined') {
    await setDarkMode(true);
    return true;
  }
  return storedObj.darkMode;
}

async function setDarkMode(value, cb = () => { }) {
  await chrome.storage.local.set({ darkMode: value });

  browser.browserAction.setIcon({
    path: icons[value ? 'active' : 'inactive'],
  });

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
/* END COPIED CODE */

// https://developer.chrome.com/docs/extensions/reference/commands/
chrome.commands.onCommand.addListener((command) => {
  if (command === 'keyboard-toggle-dark-mode') {
    getDarkMode().then((isDark) => {
      messageDarkMode(!isDark);
      setDarkMode(!isDark);
    })
  }
});
