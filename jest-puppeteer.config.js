/** @type {import('jest-environment-puppeteer').JestPuppeteerConfig} */
const skipServer =
  process.env.PUPPETEER_SKIP_SERVER === "1" || process.env.PUPPETEER_SKIP_SERVER === "true";

// Local runs used to be headed (`headless: CI === "true"`). Puppeteer is normally headless;
// set `PUPPETEER_HEADED=1` when you need a visible Chromium (debugging, flaky WebGL, etc.).
const headed =
  process.env.PUPPETEER_HEADED === "1" || process.env.PUPPETEER_HEADED === "true";

const config = {
  launch: {
    headless: !headed,
    args: [
      // https://chromium.googlesource.com/chromium/src/+/main/docs/security/apparmor-userns-restrictions.md#what-if-i-dont-have-root-access-to-the-machine-and-cant-install-anything
      '--no-sandbox',
      // Production builds register a Workbox service worker; in CI `serve dist/` + SW can
      // intercept navigations and prevent the app from booting far enough for e2e selectors.
      ...(process.env.CI === "true" ? ["--disable-features=ServiceWorker"] : []),
    ],
  },
  ...(skipServer
    ? {}
    : {
        server: {
          command: `npm run start:${process.env.NODE_ENV || "test"}`,
          port: process.env.NODE_ENV === "production" ? 3000 : 4000,
          launchTimeout: 180000,
        },
      }),
};

export default config;
