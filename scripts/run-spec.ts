import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

// Define our parameter structure with clear types for test configuration
interface TestParameters {
    spec: string | null;
    headed: boolean;
    browser: string | null;
    enableVideo: boolean;
}

// Helper function to copy directories recursively while maintaining structure
async function copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
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
}

// Create all necessary directories before test execution
async function ensureDirectoriesExist(): Promise<void> {
    const directories = [
        'web/videos',
        'web/reports/mocha/assets',
        'reports/assets'
    ];

    for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
}

// Parse command line arguments while respecting npm run argument passing
function parseArguments(): TestParameters {
    // Get all arguments as an array
    const args = process.argv.slice(2);
    console.log('\nReceived command line arguments:', args.join(' '));
    
    const params: TestParameters = {
        spec: null,
        headed: false,
        browser: null,
        enableVideo: false
    };
    
    // Process each argument carefully to respect all configurations
    for (let i = 0; i < args.length; i++) {
        const arg = args[i].trim();
        
        // Handle spec file path
        if (arg.endsWith('.cy.ts')) {
            params.spec = arg;
            continue;
        }
        
        // Handle headed mode flag
        if (arg === '--headed') {
            params.headed = true;
            continue;
        }
        
        // Handle browser selection with proper argument spacing
        if (arg === '--browser' && i + 1 < args.length) {
            params.browser = args[i + 1].trim();
            i++; // Skip the next argument since we've used it
            continue;
        }
        
        // Handle video recording flag
        if (arg.includes('enableVideo=true')) {
            params.enableVideo = true;
            continue;
        }
    }
    
    console.log('\nParsed test parameters:', {
        spec: params.spec,
        headed: params.headed,
        browser: params.browser,
        enableVideo: params.enableVideo
    });
    
    return params;
}

// Build the Cypress command respecting all provided configurations
function buildCommand(params: TestParameters): string {
    const command: string[] = ['cypress run'];
    
    // Add headed mode if specified
    if (params.headed) {
        command.push('--headed');
    }
    
    // Add browser if specified
    if (params.browser) {
        command.push(`--browser ${params.browser}`);
    }
    
    // Add basic configuration
    command.push('--config-file cypress.config.ts');
    command.push('--env type=web');
    
    // Add spec file if provided
    if (params.spec) {
        command.push(`--spec "${params.spec}"`);
    }
    
    // Add video configuration if enabled
    if (params.enableVideo) {
        command.push('--config video=true,videoCompression=false');
        command.push('--env enableVideo=true');
        command.push('--config videosFolder=web/videos');
    }
    
    const finalCommand = command.join(' ');
    console.log('\nConstructed Cypress command:', finalCommand);
    return finalCommand;
}

// Main execution function with proper error handling
async function runSpec(): Promise<void> {
    try {
        console.log('Starting test execution...');
        
        // Run cleanup first
        console.log('\nRunning cleanup...');
        execSync('node scripts/cleanup.js', { stdio: 'inherit' });
        
        // Prepare directories
        console.log('\nCreating necessary directories...');
        await ensureDirectoriesExist();
        
        // Parse and validate arguments
        const params = parseArguments();
        if (!params.spec) {
            throw new Error('No spec file provided');
        }
        
        // Build and execute the command
        const command = buildCommand(params);
        console.log('\nExecuting Cypress command...');
        execSync(command, { stdio: 'inherit' });
        
        // Add delay for file system operations
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate and handle reports with proper error handling
        console.log('\nGenerating test report...');
        try {
            // First ensure the report directory exists
            await fs.mkdir('web/reports/mocha', { recursive: true });
            
            // Merge JSON reports
            execSync('npx mochawesome-merge "web/reports/mocha/*.json" > web/reports/mocha/combined.json', 
                    { stdio: 'inherit' });
            
            // Generate HTML report
            execSync('npx marge web/reports/mocha/combined.json --reportDir web/reports/mocha --reportFilename index --inline --charts --reportTitle "Web UI Test Results"', 
                    { stdio: 'inherit' });
            
            // Copy and process reports and assets
            console.log('\nCopying report and assets...');
            const sourceAssetsDir = 'web/reports/mocha/assets';
            const targetAssetsDir = 'reports/assets';
            await copyDirectory(sourceAssetsDir, targetAssetsDir);
            
            let htmlContent = await fs.readFile('web/reports/mocha/index.html', 'utf8');
            htmlContent = htmlContent.replace(/mocha\/assets\//g, 'assets/');
            await fs.writeFile('reports/index.html', htmlContent);
        } catch (reportError) {
            console.error('Error generating reports:', reportError);
            throw reportError;
        }
        
        console.log('\nTest execution completed successfully!');
        
    } catch (error) {
        console.error('\nError running spec:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}

// Execute with proper error handling for the Promise chain
runSpec().catch((error: unknown) => {
    console.error('\nUnhandled error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
});