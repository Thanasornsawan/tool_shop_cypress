export const WEB_CONFIG = {
    baseUrl: 'https://practicesoftwaretesting.com',
    specPattern: 'web/tests/**/*.cy.ts',
    supportFile: 'web/support/e2e.ts',
    videosFolder: 'web/videos',
    screenshotsFolder: 'web/reports/mocha/assets',
    downloadsFolder: 'web/downloads',
    reportFolder: 'web/reports',
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
        reporterEnabled: 'mochawesome, mocha-junit-reporter',
        mochawesomeReporterOptions: {
            reportDir: 'web/reports/mocha',
            screenshotsFolder: 'web/reports/mocha/assets',
            charts: true,
            reportPageTitle: 'Web Test Execution Report',
            embeddedScreenshots: true,
            inlineAssets: true,
            quiet: true,
            overwrite: true,
            html: true,
            json: true,
            attachments: true
        },
        mochaJunitReporterReporterOptions: {
            mochaFile: 'web/reports/junit/results-[hash].xml'
        }
    },
    viewportWidth: 1280,
    viewportHeight: 1200,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000
};