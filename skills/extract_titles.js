
import fs from 'fs/promises';
import path from 'path';

// --- Configuration ---
const projectRoot = process.cwd();
const appsDir = path.join(projectRoot, 'apps');
const ignoreDirs = ['node_modules', 'dist', '.git', 'backup', '.claude', '.github', 'skills', '_11ty-output'];

/**
 * Recursively finds all HTML files in a directory, ignoring specified subdirectories.
 * @param {string} dir The directory to search in.
 * @returns {Promise<string[]>} A promise that resolves to an array of HTML file paths.
 */
async function findHtmlFiles(dir) {
    let htmlFiles = [];
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!ignoreDirs.includes(entry.name)) {
                    htmlFiles.push(...await findHtmlFiles(fullPath));
                }
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
                htmlFiles.push(fullPath);
            }
        }
    } catch (error) {
        // If the directory doesn't exist, return an empty array silently.
        if (error.code !== 'ENOENT') {
            console.error(`Error reading directory: ${dir}`, error);
        }
    }
    return htmlFiles;
}

/**
 * Main function to extract titles from HTML files of a specific app.
 */
async function main() {
    const appName = process.argv[2];

    if (!appName) {
        console.error('Usage: node skills/extract_titles.js <app-name>');
        console.error('Example: node skills/extract_titles.js y2matepro');
        process.exit(1);
    }

    const targetDir = path.join(appsDir, appName);

    try {
        await fs.access(targetDir);
    } catch (error) {
        console.error(`Error: Application directory not found at '${targetDir}'`);
        process.exit(1);
    }

    console.log(`--- Starting scan for app '${appName}' to extract titles ---`);

    const allHtmlFiles = await findHtmlFiles(targetDir);

    if (allHtmlFiles.length === 0) {
        console.log(`No HTML files found in '${targetDir}'.`);
        return;
    }

    console.log(`Found ${allHtmlFiles.length} HTML file(s).`);

    const reportLines = [];
    const titleRegex = /<title[^>]*>([^<]*)<\/title>/;

    for (const file of allHtmlFiles) {
        const relativePath = path.relative(projectRoot, file);
        try {
            const content = await fs.readFile(file, 'utf-8');
            const lines = content.split('\n');
            let title = '';
            let lineNumber = -1;

            for (let i = 0; i < lines.length; i++) {
                const match = lines[i].match(titleRegex);
                if (match && match[1]) {
                    title = match[1].trim();
                    lineNumber = i + 1;
                    break;
                }
            }

            if (title) {
                reportLines.push(`${title} : ${relativePath} : ${lineNumber}`);
            } else {
                console.warn(`- No title found in: ${relativePath}`);
            }
        } catch (error) {
            console.error(`Error processing file ${file}:`, error);
        }
    }

    if (reportLines.length > 0) {
        const reportContent = reportLines.join('\n');
        const reportFileName = `titles_report_${appName}.txt`;
        await fs.writeFile(reportFileName, reportContent, 'utf-8');
        console.log('\n--- Scan Complete ---');
        console.log(`Report saved to: ${reportFileName}`);
    } else {
        console.log('\n--- Scan Complete ---');
        console.log('No titles were extracted.');
    }
}

main().catch(console.error);
