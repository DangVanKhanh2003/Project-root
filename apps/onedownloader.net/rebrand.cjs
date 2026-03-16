const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname);
const excludePaths = ['node_modules', 'dist', '.git', '_11ty-output', 'logs', '.claude', '.agent', 'doc_important', 'docs'];

const replacements = [
    { match: /ytmp4\.gg/g, replace: 'onedownloader.net' },
    { match: /YTMP4\.gg/g, replace: 'OneDownloader' },
    { match: /YTMP4/g, replace: 'OneDownloader' },
    { match: /ytmp4/g, replace: 'onedownloader' },
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
