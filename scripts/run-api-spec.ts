import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

// Function to deduplicate test suites in the report
async function deduplicateTestSuites(jsonPath: string) {
    try {
        // Read the JSON report file
        const content = await fs.readFile(jsonPath, 'utf8');
        const report = JSON.parse(content);

        if (report.results && Array.isArray(report.results)) {
            // Keep track of suite titles we've seen
            const seenSuites = new Set();
            const uniqueResults = [];

            report.results.forEach(result => {
                if (result.suites && Array.isArray(result.suites)) {
                    // Filter out duplicate suites based on their titles
                    const uniqueSuites = result.suites.filter(suite => {
                        if (seenSuites.has(suite.title)) {
                            console.log(`Removing duplicate suite: ${suite.title}`);
                            return false;
                        }
                        seenSuites.add(suite.title);
                        return true;
                    });

                    // Only keep results that have unique suites
                    if (uniqueSuites.length > 0) {
                        result.suites = uniqueSuites;
                        uniqueResults.push(result);
                    }
                }
            });

            // Update the report with deduplicated results
            report.results = uniqueResults;

            // Write the deduplicated report back to file
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

// Function to run api test spec(s)
async function runAPITestSpec(specFile?: string) {
    let specPath = specFile || 'api/tests/**/*.cy.ts';  // Default to all API test specs if no file is provided

    console.log(`\nRunning api tests for spec file(s): ${specPath}...`);

    try {
        const reportDir = 'api/reports/mocha';
        await cleanDirectory(reportDir);
        await ensureDirectoryExists('reports/mocha');

        let testSuccess = false;
        try {
            // Execute only the specific spec file(s)
            execSync(`npx cypress run --spec ${specPath} --config-file cypress.config.ts --env type=api`, { stdio: 'inherit' });
            testSuccess = true;
        } catch (error) {
            console.log('API test failed, but continuing with report generation...');
        }

        // Check if any JSON files are created and process them
        if (await checkJsonFilesExist('reports/mocha')) {
            const jsonFiles = await fs.readdir('reports/mocha');
            for (const file of jsonFiles) {
                if (file.endsWith('.json')) {
                    const jsonPath = path.join('reports/mocha', file);
                    await modifyJsonReport(jsonPath, 'API');

                    const targetPath = path.join(reportDir, file);
                    await fs.copyFile(jsonPath, targetPath);
                    await fs.unlink(jsonPath);
                }
            }

            execSync('npm run report:merge:api && npm run report:generate:api', { stdio: 'inherit' });
        }

        return testSuccess;
    } catch (error) {
        console.error('Error running api test spec:', error.message);
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
        const hasAPIReports = await checkJsonFilesExist('api/reports/mocha');

        if (!hasAPIReports) {
            console.log('No test reports found to combine');
            return;
        }

        // Clean and prepare reports directory
        await cleanDirectory('reports');
        await ensureDirectoryExists('reports/assets');

        // Copy assets
        await copyDirectory('api/reports/mocha/assets', 'reports/assets');

        // Merge all reports into a combined JSON
        let mergeCommand = 'mochawesome-merge api/reports/mocha/*.json > reports/combined.json';

        execSync(mergeCommand, { stdio: 'inherit' });

        // Deduplicate test suites in the combined report
        await deduplicateTestSuites('reports/combined.json');

        // Generate the HTML report from the api-specific merged JSON
        execSync('npm run report:generate:api', { stdio: 'inherit' });

        // Fix asset paths
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
async function runAllTests(specFile: string) {
    try {
        console.log('Running initial cleanup...');
        execSync('node scripts/cleanup.js', { stdio: 'inherit' });

        // Run the specific api test spec file passed as a parameter
        const apiSuccess = await runAPITestSpec(specFile);

        await generateCombinedReport();

        console.log('\nTest Execution Summary:');
        console.log('----------------------');
        console.log(`API Tests: ${apiSuccess ? 'PASSED' : 'FAILED'}`);

        console.log('\nReports available at:');
        if (await fs.access('api/reports/mocha/index.html').then(() => true).catch(() => false)) {
            console.log('- api Tests:     api/reports/mocha/index.html');
        }
        if (await fs.access('reports/combined_results.html').then(() => true).catch(() => false)) {
            console.log('- Combined:      reports/combined_results.html');
        }

        if (!apiSuccess) {
            process.exit(1);
        }
    } catch (error) {
        console.error('\nUnhandled error:', error.message);
        process.exit(1);
    }
}

// Get the spec file from the command line arguments
const specFile = process.argv[2]; // Pass the spec file as an argument (e.g., 'cypress/integration/testfile.spec.js')
/*
if (!specFile) {
    console.error('Please provide a spec file as an argument.');
    process.exit(1);
}*/

// If no spec file is passed, run all tests
runAllTests(specFile || 'api/tests/**/*.cy.ts').catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
