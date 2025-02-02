const fs = require('fs');

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).replace(/\//g, '/');
}

function convertMochaToXray(mochaResultPath) {
    // Read Mochawesome JSON
    const mochaResults = JSON.parse(fs.readFileSync(mochaResultPath, 'utf8'));
    
    // Get the suite title from the first suite
    let suiteTitle = "Test Execution";
    if (mochaResults.results[0]?.suites[0]?.title) {
        suiteTitle = mochaResults.results[0].suites[0].title;
    }

    // Format the date from start time
    const executionDate = formatDate(mochaResults.stats.start);
    
    const xrayResults = {
        info: {
            summary: `${suiteTitle} ${executionDate}`,
            description: "Automated test execution from Cypress",
            user: "thanasornsawan varathanamongkolchai",
            startDate: mochaResults.stats.start,
            finishDate: mochaResults.stats.end,
            testPlanKey: "TP-30"
        },
        tests: []
    };

    // Convert each test result
    mochaResults.results.forEach(result => {
        result.suites.forEach(suite => {
            suite.tests.forEach(test => {
                // Extract test key from title (e.g., "TP-27" from "TP-27 should search...")
                const testKeyMatch = test.title.match(/^(TP-\d+)/);
                const testKey = testKeyMatch ? testKeyMatch[1] : null;
                
                if (!testKey) {
                    console.warn(`Warning: No test key found in title: ${test.title}`);
                    return;
                }

                const xrayTest = {
                    testKey: testKey,
                    start: mochaResults.stats.start,
                    finish: mochaResults.stats.end,
                    comment: test.fullTitle,
                    status: test.state.toUpperCase()
                };
                
                xrayResults.tests.push(xrayTest);
            });
        });
    });

    // Write Xray format JSON
    fs.writeFileSync('xray-results.json', JSON.stringify(xrayResults, null, 2));
    console.log('Conversion completed. Results written to xray-results.json');
}

// Usage
try {
    convertMochaToXray('reports/combined.json');
} catch (error) {
    console.error('Error during conversion:', error);
}