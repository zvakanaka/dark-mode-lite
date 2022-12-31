const DEBUG = false;
const TREAT_PAGE = false; // experimental
const IGNORE_SELECTORS = [
  'img',
  'video',
  'picture',
  'canvas',
  'iframe',
  '[aria-label$="Video Player"]',
  '[style*="background-image"]',
  '[data-dark-mode-lite-ignore]'
];

function addDarkModeStyle() {
  const style = document.createElement('style');
  style.id = 'dark-mode-lite';
  style.textContent = `
  :root {
    filter: invert(100%) hue-rotate(180deg);
    background: white;
  }
  
  ${IGNORE_SELECTORS.join(',\n')} {
    filter: invert(100%) hue-rotate(180deg);
  }

${DEBUG && `
.dark-mode-lite-sample {
  background: red;
  position: absolute;
  display: block;
  --sample-size: 4px;
  width: var(--sample-size);
  height: var(--sample-size);
}
.dark-mode-lite-sample:hover:before {
  content: attr(data-luminosity);
  background: #2345;
  color: white;
  top: -1rem;
  left: -3ch;
  position: relative;
}`}
`;
  document.querySelector('head').appendChild(style);
}
function removeDarkModeStyle() {
  const style = document.querySelector('#dark-mode-lite')
  if (style) {
    style.remove();
  }
}
// NOTE: not yet ready (experimental), and may never be used
function treatPage() {
  // bail if treatment has occured
  if (document.querySelector('[data-dark-mode-lite-ignore]')) {
    return;
  }
  const elsToTreat = document.querySelectorAll('*')
  elsToTreat.forEach(el => {
    const compStyles = window.getComputedStyle(el);
    const background = compStyles.getPropertyValue('background-image');
    if (background.startsWith('url(') && el.tagName !== 'BODY') {
      el.dataset.darkModeLiteIgnore = true
    }
  })
}

function setDarkMode(value) {
  if (value) {
    TREAT_PAGE && treatPage();
    addDarkModeStyle();
  } else {
    removeDarkModeStyle()
  }
}

function alreadyDark() {
  if (document.querySelector('html[data-dark-mode-lite-ignore]')) {
    // this site has opted out of this extension
    console.log('ignoring site because HTML tag has data-dark-mode-lite-ignore attribute')
    return true;
  }
  const luminosity = {
    samplesX: 10,
    samplesY: 10,
    useOffset: false,
    timeoutMS: 0,
    threshold: 765 / 2,
  };
  const samplePoints = [];
  // create 'samples' - a grid of points overlaying the viewport
  for (let y = 0; y < luminosity.samplesY; y++) {
    for (let x = 0; x < luminosity.samplesX; x++) {
      const offsetY = luminosity.useOffset ? window.innerHeight / luminosity.samplesY / 2 : 0;
      const offsetX = luminosity.useOffset ? window.innerWidth / luminosity.samplesX / 2 : 0;
      if (DEBUG) {
        const sampleEl = document.createElement("span");
        sampleEl.classList.add("dark-mode-lite-sample");
        document.body.appendChild(sampleEl);
        sampleEl.style.top =
          (window.innerHeight / luminosity.samplesY) * y + offsetY + "px";
        sampleEl.style.left =
          (window.innerWidth / luminosity.samplesX) * x + offsetX + "px";
      }
      samplePoints.push({
        x: (window.innerWidth / luminosity.samplesX) * x + offsetX,
        y: (window.innerHeight / luminosity.samplesY) * y + offsetY
      })
    }
  }

  const sampleEls = DEBUG && document.querySelectorAll(".dark-mode-lite-sample"); // sampleEls only exists if DEBUG is on
  const totalLuminosity = samplePoints.reduce((acc, samplePoint, i) => {
    // TODO: handle pages with large spaces filled with not found/ignored elements
    const { x, y } = samplePoint;
    const pointElementsWithColor = Array.from(document.elementsFromPoint(x, y))
      .filter((el) => !el.classList.contains(".dark-mode-lite-sample"))
      .filter((el) => IGNORE_SELECTORS?.every(selector => !el.matches(selector)))
      .map(el => ({ colorSet: getBgColor(el), el }))
      .filter(elementWithColor => Boolean(elementWithColor.colorSet));

    // fall back to assuming an element has maximum luminosity
    const fallback = 765
    const luminosity =
      pointElementsWithColor?.[0]?.colorSet?.reduce((acc, cur) => (acc += cur), 0) || fallback;

    if (DEBUG) {
      sampleEls[i].dataset.luminosity = `${luminosity}
${pointElementsWithColor[0].el.tagName}
${pointElementsWithColor[0].el?.hasAttributes() && Array.from(pointElementsWithColor[0].el?.attributes)
          ?.filter(attr => attr.name !== 'class')
          .map(attr => `${attr.name}='${attr.value}'`)} `; // sampleEls only exist if DEBUG is on
    }

    return (acc += luminosity);
  }, 0);

  const averageLuminosity = totalLuminosity / samplePoints.length;
  const isAlreadyDark = averageLuminosity && averageLuminosity < luminosity.threshold
  return isAlreadyDark
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

// listen for messages from the background script (popup.js)
chrome.runtime.onMessage.addListener((message) => {
  if (message.command === 'set-dark-mode') {
    setDarkMode(message.isDarkMode && !alreadyDark());
  }
});

function getBgColor(el) {
  const bg = getComputedStyle(el).background;
  const rgb = bg.startsWith("rgb")
    ? bg
      ?.split("(")[1]
      .split(")")[0]
      .split(",")
      .map((colorStr) => parseInt(colorStr, 10))
    : null;
  return rgb;
}

