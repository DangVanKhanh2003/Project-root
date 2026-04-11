
const fs = require('fs');
const path = require('path');

const rootDir = 'f:/downloader/Project-root/apps';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.njk')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(rootDir);
console.log(`Found ${files.length} files to process.`);

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        let original = content;

        // 1. Remove from QUALITY_PRIORITY or qualities array
        // Replace '240p', or "240p", (with optional space)
        content = content.replace(/'240p',\s*/g, '');
        content = content.replace(/"240p",\s*/g, '');

        // 2. Remove option tags from HTML/NJK
        // Matches <option value="mp4-240">...</option> with optional leading spaces and newline
        content = content.replace(/^\s*<option value=["']mp4-240["']>.*?<\/option>\s*?\r?\n/gm, '');
        // Also catch ones that might not be at start of line
        content = content.replace(/<option value=["']mp4-240["']>.*?<\/option>/g, '');

        // 3. Change default quality in input-form.ts
        content = content.replace(/quality: '240p'/g, "quality: '720p'");
        content = content.replace(/quality: "240p"/g, 'quality: "720p"');

        // 4. Case where it's videoQuality: '240'
        content = content.replace(/videoQuality: '240'/g, "videoQuality: '720'");
        content = content.replace(/videoQuality: "240"/g, 'videoQuality: "720"');

        if (content !== original) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Modified: ${file}`);
        }
    } catch (e) {
        console.error(`Error processing ${file}: ${e.message}`);
    }
});

console.log('Cleanup complete!');
