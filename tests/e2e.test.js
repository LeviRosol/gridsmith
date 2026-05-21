const longTimeout = 60000;

const isProd = process.env.NODE_ENV === 'production';
// The marketing home route (`/`) does not mount the OpenSCAD preview; baseplate builder does.
// `start:production` runs `serve -s dist`, so assets are rooted at `/` (not `/dist/...`).
const baseUrl = isProd ? 'http://localhost:3000/baseplate' : 'http://localhost:4000/baseplate';
// Waits use `window.__GRIDSMITH_TEST__` (see `Model` constructor). Local prod bundles must be built
// with `CI=true` (same as GitHub Actions) or `GRIDSMITH_TEST_HOOK=true` — e.g. `npm run build:all:e2e`.

const messages = [];

beforeAll(async () => {
  page.on('console', (msg) => messages.push({
    type: msg.type(),
    text: msg.text(),
    stack: msg.stackTrace(),
    location: msg.location(),
  }));
});

beforeEach(async () => {
  messages.length = 0;
  await page.goto('about:blank');
});

afterEach(async () => {
  // console.log('Messages:', JSON.stringify(messages, null, 2));
  const testName = expect.getState().currentTestName;
  console.log(`[${testName}] Messages:`, JSON.stringify(messages.map(({ text }) => text), null, 2));

  const errors = messages.filter((msg) => {
    if (msg.type !== 'error') return false;
    const t = msg.text;
    if (t.includes('404') && msg.stack.some((s) => s.url.indexOf('fonts/InterVariable.woff') >= 0)) {
      return false;
    }
    // Chromium/model-viewer HDR JPEG fallback noise in headless CI (still renders SDR).
    if (t.includes('HDRJPGLoader') || t.includes('Gain map metadata not found')) return false;
    if (t.includes('Automatic fallback to software WebGL has been deprecated')) return false;
    if (t.includes('GL Driver Message') || t.includes('GPU stall due to ReadPixels')) return false;
    return true;
  });
  expect(errors).toHaveLength(0);
});

function loadSrc(src) {
  return page.goto(`${baseUrl}#src=${encodeURIComponent(src)}`);
}
function loadPath(path) {
  return page.goto(`${baseUrl}#path=${encodeURIComponent(path)}`);
}
function loadUrl(url) {
  return page.goto(`${baseUrl}#url=${encodeURIComponent(url)}`);
}
async function waitForPreviewReady() {
  try {
    await page.waitForFunction(() => Boolean(window.__GRIDSMITH_TEST__?.model), { timeout: 15000 });
  } catch {
    throw new Error(
      'E2E hook missing: rebuild with CI=true (GitHub Actions default) or GRIDSMITH_TEST_HOOK=true — try npm run build:all:e2e or npm run start:production:e2e for prod e2e.',
    );
  }
  await page.waitForFunction(
    () => {
      const m = window.__GRIDSMITH_TEST__?.model;
      if (!m) return false;
      const s = m.state;
      return Boolean(
        s.output?.outFileURL && !s.previewing && !s.rendering && !s.checkingSyntax && !s.exporting,
      );
    },
    { timeout: longTimeout },
  );
}

async function waitForDetectedScadParameter(name) {
  await page.waitForFunction((paramName) => {
    const hook = window.__GRIDSMITH_TEST__;
    const params = hook?.model?.state?.parameterSet?.parameters;
    if (!Array.isArray(params)) return false;
    return params.some((p) => p && p.name === paramName);
  }, { timeout: 45000 }, name);
}
function expectMessage(messages, line) {
  const successMessage = messages.filter(msg => msg.type === 'debug' && msg.text === line);
  expect(successMessage).toHaveLength(1);
}
function expectObjectList() {
  expectMessage(messages, 'stderr: Top level object is a list of objects:');
}
function expect3DPolySet() {
  expectMessage(messages, 'stderr: Top level object is a 3D object (PolySet):');
}
function expect3DManifold() {
  expectMessage(messages, 'stderr:    Top level object is a 3D object (manifold):');
}
function waitForCustomizeButton() {
  return page.waitForFunction(() => {
    // Try multiple selectors for PrimeReact components
    // ToggleButton might render as button or input elements
    const selectors = [
      'input[role=switch]',
      'button',
      '[role=tab]',
      '.p-togglebutton',
      '.p-tabmenu-nav a'
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent || element.innerText || '';
        const parentText = element.parentElement?.textContent || element.parentElement?.innerText || '';
        if (text.includes('Customize') || parentText.includes('Customize')) {
          return element;
        }
      }
    }
    return null;
  }, { timeout: 45000 }); // Increase timeout to 45 seconds
}
function waitForLabel(text) {
  return page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('label')).find(el => el.textContent === 'myVar');
    // return Array.from(document.querySelectorAll('label')).find(el => el.textContent === text);
  });
}

describe('e2e', () => {
  test('load the default page', async () => {
    await page.goto(baseUrl);
    await waitForPreviewReady();
    // Default GridSmith baseplate template compiles to a manifold (not a top-level object list).
    expect3DManifold();
  }, longTimeout);

  test('can render cube', async () => {
    await loadSrc('cube([10, 10, 10]);');
    await waitForPreviewReady();
    expect3DPolySet();
  }, longTimeout);

  test('use BOSL2', async () => {
    await loadSrc(`
      include <BOSL2/std.scad>;
      prismoid([40,40], [0,0], h=20);
    `);
    await waitForPreviewReady();
    expect3DPolySet();
  }, longTimeout);

  test('use NopSCADlib', async () => {
    await loadSrc(`
      include <NopSCADlib/vitamins/led_meters.scad>
      meter(led_meter);
    `);
    await waitForPreviewReady();
    expect3DManifold();
  }, longTimeout);

  test('load a demo by path', async () => {
    await loadPath('/libraries/closepoints/demo_3D_art.scad');
    await waitForPreviewReady();
    expect3DPolySet();
  }, longTimeout);

  test('load a demo by url', async () => {
    await loadUrl('https://github.com/tenstad/keyboard/blob/main/keyboard.scad');
    await waitForPreviewReady();
    expect3DManifold();
  }, longTimeout);

  test('customizer & windows line endings work', async () => {
    await loadSrc([
      'myVar = 10;',
      'cube(myVar);',
    ].join('\r\n'));
    await waitForPreviewReady();
    expect3DPolySet();

    // `/baseplate` uses GridSmithPanel (not the legacy Customizer tab UI). Still validate that
    // OpenSCAD customizer parameter extraction ran by reading the live Model state via a dev/CI hook.
    await waitForDetectedScadParameter('myVar');
  }, longTimeout);
});

