import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

// Function to deduplicate test suites in the report
async function deduplicateTestSuites(jsonPath: string) {
    try {
        const content = await fs.readFile(jsonPath, 'utf8');
        const report = JSON.parse(content);

        if (report.results && Array.isArray(report.results)) {
            const seenSuites = new Set();
            const uniqueResults = [];

            report.results.forEach(result => {
                if (result.suites && Array.isArray(result.suites)) {
                    const uniqueSuites = result.suites.filter(suite => {
                        if (seenSuites.has(suite.title)) {
                            console.log(`Removing duplicate suite: ${suite.title}`);
                            return false;
                        }
                        seenSuites.add(suite.title);
                        return true;
                    });

                    if (uniqueSuites.length > 0) {
                        result.suites = uniqueSuites;
                        uniqueResults.push(result);
                    }
                }
            });

            report.results = uniqueResults;
            await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
            console.log('Successfully deduplicated test suites in report');
        }
    } catch (error) {
        console.error('Error deduplicating test suites:', error.message);
        throw error;
    }
}

// Function to ensure the directory exists
async function ensureDirectoryExists(dirPath: string) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

// Function to clean a directory
async function cleanDirectory(dirPath: string) {
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
        await ensureDirectoryExists(dirPath);
        console.log(`Cleaned and recreated: ${dirPath}`);
    } catch (error) {
        console.error(`Error cleaning directory ${dirPath}:`, error.message);
    }
}

// Function to check if JSON files exist in a directory
async function checkJsonFilesExist(directory: string) {
    try {
        const files = await fs.readdir(directory);
        return files.some(file => file.endsWith('.json'));
    } catch {
        return false;
    }
}

// Function to modify the JSON report and add a suite prefix
async function modifyJsonReport(jsonPath: string, suitePrefix: string) {
    try {
        const content = await fs.readFile(jsonPath, 'utf8');
        const report = JSON.parse(content);

        if (report.results && Array.isArray(report.results)) {
            report.results.forEach(result => {
                if (result.suites && Array.isArray(result.suites)) {
                    result.suites.forEach(suite => {
                        if (!suite.title.startsWith(suitePrefix)) {
                            suite.title = `${suitePrefix} - ${suite.title}`;
                        }
                    });
                }
            });
        }

        await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
        console.log(`Modified JSON report: ${jsonPath}`);
    } catch (error) {
        console.error(`Error modifying JSON report ${jsonPath}:`, error.message);
    }
}

// Function to run web test spec(s)
async function runWebTestSpec(specFile?: string, headed: boolean = false, browser: string = '', enableVideo: boolean = false) {
    let specPath = specFile || 'web/tests/**/*.cy.ts';  // Default to all web test specs if no file is provided
    console.log(`\nRunning web tests for spec file(s): ${specPath}...`);

    try {
        const reportDir = 'web/reports/mocha';
        await cleanDirectory(reportDir);
        await ensureDirectoryExists('reports/mocha');

        let testSuccess = false;

        const command: string[] = ['npx cypress run', '--config-file cypress.config.ts', '--env type=web'];

        if (headed) {
            command.push('--headed');
        }

        if (browser) {
            command.push(`--browser ${browser}`);
        }

        if (enableVideo) {
            command.push('--config video=true,videoCompression=false');
            command.push('--env enableVideo=true');
            command.push('--config videosFolder=web/videos');
        }

        if (specFile) {
            command.push(`--spec "${specPath}"`);
        }

        try {
            execSync(command.join(' '), { stdio: 'inherit' });
            testSuccess = true;
        } catch (error) {
            console.log('Web test failed, but continuing with report generation...');
        }

        if (await checkJsonFilesExist('reports/mocha')) {
            const jsonFiles = await fs.readdir('reports/mocha');
            for (const file of jsonFiles) {
                if (file.endsWith('.json')) {
                    const jsonPath = path.join('reports/mocha', file);
                    await modifyJsonReport(jsonPath, 'Web');

                    const targetPath = path.join(reportDir, file);
                    await fs.copyFile(jsonPath, targetPath);
                    await fs.unlink(jsonPath);
                }
            }

            execSync('npm run report:merge:web && npm run report:generate:web', { stdio: 'inherit' });
        }

        return testSuccess;
    } catch (error) {
        console.error('Error running web test spec:', error.message);
        return false;
    }
}

// Function to copy a directory recursively
async function copyDirectory(src: string, dest: string) {
    try {
        if (await fs.access(src).then(() => true).catch(() => false)) {
            await ensureDirectoryExists(dest);
            const entries = await fs.readdir(src, { withFileTypes: true });

            for (const entry of entries) {
                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);

                if (entry.isDirectory()) {
                    await copyDirectory(srcPath, destPath);
                } else {
                    await fs.copyFile(srcPath, destPath);
                }
            }
            console.log(`Copied directory from ${src} to ${dest}`);
        }
    } catch (error) {
        console.error(`Error copying directory from ${src} to ${dest}:`, error.message);
    }
}

// Function to generate a combined report
async function generateCombinedReport() {
    console.log('\nGenerating combined report...');
    try {
        const hasWebReports = await checkJsonFilesExist('web/reports/mocha');

        if (!hasWebReports) {
            console.log('No test reports found to combine');
            return;
        }

        await cleanDirectory('reports');
        await ensureDirectoryExists('reports/assets');
        await copyDirectory('web/reports/mocha/assets', 'reports/assets');

        let mergeCommand = 'mochawesome-merge web/reports/mocha/*.json > reports/combined.json';

        execSync(mergeCommand, { stdio: 'inherit' });

        await deduplicateTestSuites('reports/combined.json');

        execSync('npm run report:generate:web', { stdio: 'inherit' });

        const reportPath = 'reports/combined_results.html';
        if (await fs.access(reportPath).then(() => true).catch(() => false)) {
            let htmlContent = await fs.readFile(reportPath, 'utf8');
            htmlContent = htmlContent.replace(/\.\.\/assets\//g, 'assets/');
            await fs.writeFile(reportPath, htmlContent);
            console.log('Successfully generated combined report with unique test suites');
        }
    } catch (error) {
        console.error('Error generating combined report:', error.message);
    }
}

// Main function to run the tests
async function runAllTests(specFile: string, headed: boolean, browser: string, enableVideo: boolean) {
    try {
        console.log('Running initial cleanup...');
        execSync('node scripts/cleanup.js', { stdio: 'inherit' });

        const webSuccess = await runWebTestSpec(specFile, headed, browser, enableVideo);

        await generateCombinedReport();

        console.log('\nTest Execution Summary:');
        console.log('----------------------');
        console.log(`Web Tests: ${webSuccess ? 'PASSED' : 'FAILED'}`);

        console.log('\nReports available at:');
        if (await fs.access('web/reports/mocha/index.html').then(() => true).catch(() => false)) {
            console.log('- Web Tests:     web/reports/mocha/index.html');
        }
        if (await fs.access('reports/combined_results.html').then(() => true).catch(() => false)) {
            console.log('- Combined:      reports/combined_results.html');
        }

        if (!webSuccess) {
            process.exit(1);
        }
    } catch (error) {
        console.error('\nUnhandled error:', error.message);
        process.exit(1);
    }
}

// Get the spec file and options from the command line arguments
const args = process.argv.slice(2);
let specFile = '';
let headed = false;
let browser = '';
let enableVideo = false;

args.forEach((arg, i) => {
    if (arg.endsWith('.cy.ts')) {
        specFile = arg;
    } else if (arg === '--headed') {
        headed = true;
    } else if (arg.startsWith('--browser')) {
        browser = args[i + 1] || '';
    } else if (arg.includes('enableVideo=true')) {
        enableVideo = true;
    }
});

runAllTests(specFile, headed, browser, enableVideo).catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});