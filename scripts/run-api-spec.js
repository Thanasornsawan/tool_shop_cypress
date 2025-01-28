const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

const specFile = process.argv[2];

if (!specFile) {
    console.error('Error: No spec file provided');
    console.log('Usage: npm run test:api:spec <path-to-spec-file>');
    process.exit(1);
}

async function setupDirectories() {
    const directories = [
        'api/reports/mocha',
        'api/reports/mocha/assets',
        'reports',
        'reports/assets'
    ];

    for (const dir of directories) {
        try {
            await fs.rm(dir, { recursive: true, force: true });
            await fs.mkdir(dir, { recursive: true });
            console.log(`Prepared directory: ${dir}`);
        } catch (error) {
            console.error(`Error preparing directory ${dir}:`, error);
            throw error;
        }
    }
}

// We're now creating a complete Cypress configuration override
async function createCypressConfig() {
    const config = {
        // Maintain existing configuration
        reporter: 'cypress-multi-reporters',
        reporterOptions: {
            reporterEnabled: 'mochawesome',
            mochawesomeReporterOptions: {
                reportDir: 'api/reports/mocha',
                quiet: true,
                overwrite: false,
                html: false,
                json: true,
                charts: true
            }
        },
        // Additional Cypress configurations that ensure proper reporting
        video: false,
        screenshotOnRunFailure: true,
        screenshotsFolder: 'api/reports/screenshots'
    };

    const configPath = path.join(process.cwd(), 'cypress-report-config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log('Created Cypress configuration at:', configPath);
    return configPath;
}

function executeCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        console.log(`\nExecuting: ${command} ${args.join(' ')}`);
        
        const proc = spawn(command, args, {
            stdio: 'inherit',
            shell: true,
            ...options
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });

        proc.on('error', (err) => {
            reject(err);
        });
    });
}

async function runApiSpec() {
    let configPath;
    try {
        await setupDirectories();
        configPath = await createCypressConfig();

        // Run Cypress with configuration overrides
        await executeCommand('cypress', [
            'run',
            '--config-file', 'cypress.config.ts',
            '--env', 'type=api',
            '--spec', path.resolve(specFile),
            '--config', 'reporter=cypress-multi-reporters',
            '--config', `reporterOptions=${JSON.stringify({
                reporterEnabled: 'mochawesome',
                mochawesomeReporterOptions: {
                    reportDir: 'api/reports/mocha',
                    quiet: true,
                    overwrite: false,
                    html: false,
                    json: true
                }
            })}`
        ]);

        // Add a small delay to ensure file system operations complete
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify report generation
        const files = await fs.readdir('api/reports/mocha');
        const jsonReports = files.filter(f => f.endsWith('.json'));
        
        if (jsonReports.length === 0) {
            throw new Error('No JSON reports were generated');
        }

        // Merge the JSON reports with proper error handling
        console.log('\nMerging JSON reports...');
        try {
            // First ensure the target directory exists
            await fs.mkdir('api/reports/mocha', { recursive: true });
            
            // Then merge the reports
            await executeCommand('npx', [
                'mochawesome-merge',
                'api/reports/mocha/*.json',
                '--reportDir', 'api/reports/mocha'
            ]);

            // Generate HTML report
            console.log('\nGenerating HTML report...');
            await executeCommand('npx', [
                'marge',
                'api/reports/mocha/combined.json',
                '--reportDir', 'api/reports/mocha',
                '--reportFilename', 'index',
                '--inline',
                '--charts',
                '--reportTitle', '"API Test Results"'
            ]);
        } catch (mergeError) {
            console.error('Error merging reports:', mergeError);
            throw mergeError;
        }

    } catch (error) {
        console.error('\nError:', error.message);
        process.exit(1);
    }
}

runApiSpec().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});