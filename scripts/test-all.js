const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

async function deduplicateTestSuites(jsonPath) {
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

async function ensureDirectoryExists(dirPath) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

async function cleanDirectory(dirPath) {
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
        await ensureDirectoryExists(dirPath);
        console.log(`Cleaned and recreated: ${dirPath}`);
    } catch (error) {
        console.error(`Error cleaning directory ${dirPath}:`, error.message);
    }
}

async function checkJsonFilesExist(directory) {
    try {
        const files = await fs.readdir(directory);
        return files.some(file => file.endsWith('.json'));
    } catch {
        return false;
    }
}

async function modifyJsonReport(jsonPath, suitePrefix) {
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

async function runTestSuite(type) {
    console.log(`\nRunning ${type.toUpperCase()} tests...`);
    
    try {
        const reportDir = `${type}/reports/mocha`;
        await cleanDirectory(reportDir);
        await ensureDirectoryExists('reports/mocha');

        let testSuccess = false;
        try {
            execSync(`npm run cy:run:${type}`, { stdio: 'inherit' });
            testSuccess = true;
        } catch (error) {
            console.log(`${type.toUpperCase()} tests failed but continuing with report generation...`);
        }

        // Check if we have JSON files to process
        if (await checkJsonFilesExist('reports/mocha')) {
            const jsonFiles = await fs.readdir('reports/mocha');
            for (const file of jsonFiles) {
                if (file.endsWith('.json')) {
                    const jsonPath = path.join('reports/mocha', file);
                    await modifyJsonReport(jsonPath, type.toUpperCase());
                    
                    const targetPath = path.join(reportDir, file);
                    await fs.copyFile(jsonPath, targetPath);
                    await fs.unlink(jsonPath);
                }
            }

            // Generate the individual report
            execSync(`npm run report:merge:${type} && npm run report:generate:${type}`, 
                    { stdio: 'inherit' });
        }

        return testSuccess;
    } catch (error) {
        console.error(`Error in ${type} test suite:`, error.message);
        return false;
    }
}

async function copyDirectory(src, dest) {
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

async function generateCombinedReport() {
    console.log('\nGenerating combined report...');
    
    try {
        const hasApiReports = await checkJsonFilesExist('api/reports/mocha');
        const hasWebReports = await checkJsonFilesExist('web/reports/mocha');

        if (!hasApiReports && !hasWebReports) {
            console.log('No test reports found to combine');
            return;
        }

        // Clean and prepare reports directory
        await cleanDirectory('reports');
        await ensureDirectoryExists('reports/assets');

        // Copy assets
        await copyDirectory('web/reports/mocha/assets', 'reports/assets');
        await copyDirectory('api/reports/mocha/assets', 'reports/assets');

        // First, merge all reports into a combined JSON
        let mergeCommand = 'mochawesome-merge';
        if (hasApiReports) mergeCommand += ' api/reports/mocha/*.json';
        if (hasWebReports) mergeCommand += ' web/reports/mocha/*.json';
        mergeCommand += ' > reports/combined.json';

        execSync(mergeCommand, { stdio: 'inherit' });

        // Deduplicate test suites in the combined report
        await deduplicateTestSuites('reports/combined.json');

        // Generate the HTML report from the deduplicated JSON
        execSync('npm run report:generate:all', { stdio: 'inherit' });

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

async function runAllTests() {
    try {
        console.log('Running initial cleanup...');
        execSync('node scripts/cleanup.js', { stdio: 'inherit' });
        
        const apiSuccess = await runTestSuite('api');
        const webSuccess = await runTestSuite('web');
        
        await generateCombinedReport();
        
        console.log('\nTest Execution Summary:');
        console.log('----------------------');
        console.log(`API Tests: ${apiSuccess ? 'PASSED' : 'FAILED'}`);
        console.log(`Web Tests: ${webSuccess ? 'FAILED' : 'FAILED'}`);
        
        console.log('\nReports available at:');
        if (await fs.access('api/reports/mocha/index.html').then(() => true).catch(() => false)) {
            console.log('- API Tests:     api/reports/mocha/index.html');
        }
        if (await fs.access('web/reports/mocha/index.html').then(() => true).catch(() => false)) {
            console.log('- Web Tests:     web/reports/mocha/index.html');
        }
        if (await fs.access('reports/combined_results.html').then(() => true).catch(() => false)) {
            console.log('- Combined:      reports/combined_results.html');
        }
        
        if (!apiSuccess || !webSuccess) {
            process.exit(1);
        }
    } catch (error) {
        console.error('\nUnhandled error:', error.message);
        process.exit(1);
    }
}

runAllTests().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});