export const API_CONFIG = {
    baseUrl: 'https://api.practicesoftwaretesting.com',
    specPattern: 'api/tests/**/*.cy.ts',
    supportFile: 'api/support/e2e.ts',
    reportFolder: 'api/reports',
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
        reporterEnabled: 'mochawesome, mocha-junit-reporter',
        mochawesomeReporterOptions: {
            reportDir: 'api/reports/mocha',
            charts: true,
            reportPageTitle: 'API Test Execution Report',
            inlineAssets: true,
            quiet: true,
            overwrite: true,
            html: true,
            json: true
        },
        mochaJunitReporterReporterOptions: {
            mochaFile: 'api/reports/junit/results-[hash].xml'
        }
    },
    defaultCommandTimeout: 10000,
    headers: {
        'accept': 'application/json',
        'content-type': 'application/json'
    }
};