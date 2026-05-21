/** @type {import('jest').Config} */
const config = {
  preset: "jest-puppeteer",
  maxWorkers: 1,
  testMatch: [
    "**/tests/**/*.js",
  ],
};

export default config;
