const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, '../reports');

if (fs.existsSync(reportsDir)) {
    fs.rmSync(reportsDir, { recursive: true, force: true });
}
fs.mkdirSync(path.join(reportsDir, 'mocha'), { recursive: true });