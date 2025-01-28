import { defineConfig } from 'cypress';
import { verifyDownloadTasks } from 'cy-verify-downloads';
import * as fs from 'fs';
import { WEB_CONFIG } from './config/web.config';
import { API_CONFIG } from './config/api.config';

interface TakeScreenshotConfig {
  name: string;
}

export default defineConfig({
  projectId: 'jxeg7b',
  e2e: {
    baseUrl: WEB_CONFIG.baseUrl,
    supportFile: 'web/support/e2e.ts',
    videosFolder: 'web/videos',
    screenshotsFolder: 'web/reports/mocha/assets',
    downloadsFolder: 'web/downloads',
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      reporterEnabled: 'mochawesome, mocha-junit-reporter',
      mochawesomeReporterOptions: {
        reportDir: 'reports/mocha',
        overwrite: false,
        html: false,
        json: true,
        charts: true,
        embeddedScreenshots: true,
        inlineAssets: true,
        reportPageTitle: 'Test Execution Report',
        quiet: true,
      },
      mochaJunitReporterReporterOptions: {
        mochaFile: 'reports/junit/results-[hash].xml',
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
      const isApiTest = config.env.type === 'api';
      
      if (isApiTest) {
        config.baseUrl = API_CONFIG.baseUrl;
        config.specPattern = 'api/tests/**/*.cy.ts';
        config.supportFile = 'api/support/e2e.ts';
        config.fixturesFolder = 'api/fixtures';
        config.video = false;
        config.screenshotOnRunFailure = false;
        config.viewportWidth = undefined;
        config.viewportHeight = undefined;
      } else {
        config.baseUrl = WEB_CONFIG.baseUrl;
        config.specPattern = 'web/tests/**/*.cy.ts';
        config.supportFile = 'web/support/e2e.ts';
        config.fixturesFolder = 'web/fixtures';
        
        const enableVideo = config.env.enableVideo;
        if (enableVideo && (enableVideo === 'true' || enableVideo === true)) {
          config.video = true;
          config.videoCompression = false;
        }

        on('before:browser:launch', (browser: Cypress.Browser, launchOptions) => {
          if (browser.family === 'chromium' && browser.name !== 'electron') {
            launchOptions.args.push('--enable-features=CSSScrollSnapPoints');
          }
          return launchOptions;
        });
      }

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
          if (!isApiTest) {
            const screenshotsFolder = 'reports/mocha/assets';
            if (!fs.existsSync(screenshotsFolder)) {
              fs.mkdirSync(screenshotsFolder, { recursive: true });
            }
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