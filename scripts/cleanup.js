const fs = require('fs');
const path = require('path');

// Function to clean a directory while keeping its structure
function cleanDirectory(directory) {
    if (fs.existsSync(directory)) {
        console.log(`Cleaning directory: ${directory}`);
        fs.rmSync(directory, { recursive: true, force: true });
        fs.mkdirSync(directory, { recursive: true });
        console.log(`Recreated directory: ${directory}`);
    }
}

// Clean all report-related directories
const directoriesToClean = [
    path.join(__dirname, '../reports'),
    path.join(__dirname, '../reports/mocha'),
    path.join(__dirname, '../api/reports/mocha'),
    path.join(__dirname, '../web/reports/mocha'),
    path.join(__dirname, '../web/screenshots'),
    path.join(__dirname, '../web/videos')
];

console.log('Starting cleanup process...');

directoriesToClean.forEach(dir => {
    cleanDirectory(dir);
});

console.log('Cleanup completed successfully!');