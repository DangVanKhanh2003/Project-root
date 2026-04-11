const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname);
const excludePaths = ['node_modules', 'dist', '.git', '_11ty-output', 'logs', '.claude', '.agent', 'doc_important', 'docs'];

const replacements = [
    // URLs: domain with https
    { match: /https:\/\/ytbdownloader\.com/g, replace: 'https://ytbdownloader.com' },
    // Email addresses
    { match: /support@ytbdownloader\.com/g, replace: 'support@ytbdownloader.com' },
    { match: /meta\.ytbdownloader@/g, replace: 'meta.ytbdownloader@' },
    // Brand name (PascalCase)
    { match: /Ytbdownloader\b/g, replace: 'YTBDown' },
    // Uppercase
    { match: /YTBDOWNLOADER/g, replace: 'YTBDOWNLOADER' },
    // Remaining lowercase (storage keys, comments, namespaces)
    { match: /ytbdownloader\b/g, replace: 'ytbdownloader' },
    // With underscore suffix (storage prefixes like ytbdownloader_)
    { match: /ytbdownloader_/g, replace: 'ytbdownloader_' },
];

function processFile(filePath) {
    const ext = path.extname(filePath);
    if (!['.html', '.json', '.js', '.ts', '.cjs', '.mjs', '.njk', '.md', '.css', '.scss'].includes(ext)) {
        return;
    }

    try {
        const data = fs.readFileSync(filePath, 'utf8');
        let modifiedData = data;

        let replaced = false;
        for (const r of replacements) {
            if (modifiedData.match(r.match)) {
                modifiedData = modifiedData.replace(r.match, r.replace);
                replaced = true;
            }
        }

        if (replaced) {
            fs.writeFileSync(filePath, modifiedData, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    } catch (err) {
        console.error(`Error reading/writing file ${filePath}:`, err);
    }
}

function walkDir(dir) {
    try {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            if (excludePaths.includes(file)) continue;

            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                walkDir(fullPath);
            } else {
                processFile(fullPath);
            }
        }
    } catch (err) {
        console.error(`Error processing directory ${dir}:`, err);
    }
}

console.log('Starting string replacement process...');
walkDir(directoryPath);
console.log('Finished.');
