import { defineConfig } from 'cypress';
import { verifyDownloadTasks } from 'cy-verify-downloads';
import * as fs from 'fs';

interface TakeScreenshotConfig {
  name: string;
}

export default defineConfig({
  projectId: 'jxeg7b',
  e2e: {
    baseUrl: 'https://practicesoftwaretesting.com',
    specPattern: 'web/tests/**/*.cy.ts',
    supportFile: 'web/support/e2e.ts',
    videosFolder: 'web/videos',
    screenshotsFolder: 'web/reports/mocha/assets',
    downloadsFolder: 'web/downloads',
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      reporterEnabled: 'mochawesome, mocha-junit-reporter',
      mochawesomeReporterOptions: {
        reportDir: 'web/reports/mocha',
        screenshotsFolder: 'web/reports/mocha/assets',
        charts: true,
        reportPageTitle: 'Test Execution Report',
        embeddedScreenshots: true,
        inlineAssets: true,
        quiet: true,
        overwrite: true,
        html: true,
        json: true,
        attachments: true,
      },
      mochaJunitReporterReporterOptions: {
        mochaFile: 'web/reports/junit/results-[hash].xml',
      },
    },
    viewportWidth: 1280,
    viewportHeight: 1200,
    video: false,
    chromeWebSecurity: false,
    experimentalModifyObstructiveThirdPartyCode: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    setupNodeEvents(on, config) {
      const enableVideo = config.env.enableVideo; // Pass the spec name as an environment variable
      if (enableVideo && (enableVideo === 'true' || enableVideo === true)) {
        console.log('Enabling video recording for:', enableVideo);
        config.video = true; // Enable video for specific spec
        config.videoCompression = false;
      } else {
        console.log('Video recording disabled for:', enableVideo);
        config.video = false;
      }
      // Custom browser settings
      on('before:browser:launch', (browser: Cypress.Browser, launchOptions) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          launchOptions.args.push('--enable-features=CSSScrollSnapPoints');
        }
        return launchOptions;
      });

      // Custom tasks
      on('task', {
        ...verifyDownloadTasks,
        log({ message }) {
          console.log(message);
          return null;
        },
        async parsePdf({ filePath }) {
          const fs = require('fs').promises;
          const pdf = require('pdf-parse');
          const dataBuffer = await fs.readFile(filePath);
          const data = await pdf(dataBuffer);
          return data.text;
        },
        takeScreenshot({ name }: TakeScreenshotConfig) {
          const screenshotsFolder = 'web/reports/mocha/assets';
          if (!fs.existsSync(screenshotsFolder)) {
            fs.mkdirSync(screenshotsFolder, { recursive: true });
          }
          return null;
        },
        waitForRace({ elements, timeout }) {
          return new Promise((resolve) => {
            let resolved = false;
            const interval = setInterval(() => {
              if (resolved) return;
              for (const { selector, alias } of elements) {
                const element = document.querySelector(selector);
                if (element) {
                  clearInterval(interval);
                  clearTimeout(timeoutId);
                  resolved = true;
                  resolve({ alias });
                  return;
                }
              }
            }, 100);
            const timeoutId = setTimeout(() => {
              clearInterval(interval);
              if (!resolved) {
                resolved = true;
                resolve({ alias: 'timeout' });
              }
            }, timeout);
          });
        },
      } as unknown as Cypress.Tasks);

      return config;
    },
  },
});