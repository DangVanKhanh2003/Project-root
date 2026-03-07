const fs = require('fs');
const path = require('path');

const srcDataDir = path.join('C:', 'Users', 'khanh084', 'Downloads', 'ytmp4.gg', 'ytmp4.gg');
const pDir = __dirname;
const templatesDir = path.join(pDir, '_templates', 'pages');
const destDataDir = path.join(pDir, '_templates', '_data', 'pages');
const dataScriptDir = path.join(pDir, '_templates', '_data');

// 1. Static HTML Injection
const staticMap = {
    'about': 'about.html',
    'contact': 'contact.html',
    'copyright': 'dmca.html',
    'term': 'terms-of-use.html'
};

function jsonToHtml(jsonPath) {
    const fileStr = fs.readFileSync(jsonPath, 'utf8').trim();
    if (!fileStr) return ''; // Skip empty
    const data = JSON.parse(fileStr);
    let html = `<div class="page-header">\n  <h1 class="page-title">${data.headings.h1}</h1>\n`;
    if (data.seo && data.seo.meta_description) {
        html += `  <p class="page-subtitle">${data.seo.meta_description}</p>\n`;
    }
    html += `</div>\n<div style="margin-bottom: 32px;"></div>\n`;

    for (const key of Object.keys(data.sections).sort((a, b) => parseInt(a) - parseInt(b))) {
        const sec = data.sections[key];
        if (sec.tag === 'h2') {
            html += `<h2 class="titles">${sec.title}</h2>\n`;
            if (sec.body) {
                sec.body.forEach(p => {
                    html += `<p>${p}</p>\n`;
                });
            }
            html += `<br>\n`;
        } else if (sec.tag === 'p') {
            if (sec.content) {
                sec.content.forEach(p => {
                    html += `<p>${p}</p>\n`;
                });
            }
            html += `<br>\n`;
        }
    }
    return html;
}

for (const [folder, targetFile] of Object.entries(staticMap)) {
    const jsonPath = path.join(srcDataDir, folder, 'en.json');
    if (fs.existsSync(jsonPath)) {
        const htmlContent = jsonToHtml(jsonPath);
        const targetPath = path.join(pDir, targetFile);
        if (fs.existsSync(targetPath)) {
            let content = fs.readFileSync(targetPath, 'utf8');
            // replace content inside <section class="content-section content-section--white"><div class="container">...</div></section>
            const regex = /(<section class="content-section content-section--white">\s*<div class="container">)[\s\S]*?(<\/div>\s*<\/section>)/;
            content = content.replace(regex, `$1\n${htmlContent}\n$2`);

            // also replace title and description
            const fileStr = fs.readFileSync(jsonPath, 'utf8').trim();
            if (fileStr) {
                const data = JSON.parse(fileStr);
                if (data.seo) {
                    content = content.replace(/<title>.*?<\/title>/, `<title>${data.seo.title}</title>`);
                    content = content.replace(/<meta name="description"\s+content=".*?">/, `<meta name="description" content="${data.seo.meta_description}">`);
                }
                fs.writeFileSync(targetPath, content, 'utf8');
                console.log(`Updated HTML: ${targetFile}`);
            }
        }
    }
}

// 2. Data & Templates mapping
const pageMap = {
    'index': { template: 'index.njk', cjs: 'indexPages.cjs' },
    'download-youtube-4k-video': { template: 'download-youtube-4k-video.njk', cjs: 'downloadYoutube4kVideoPages.cjs', copyFrom: 'index.njk' },
    'download-youtube-1080p-video': { template: 'download-youtube-1080p-video.njk', cjs: 'downloadYoutube1080pVideoPages.cjs', copyFrom: 'index.njk' },
    'youtube-shorts-mp4': { template: 'youtube-shorts-mp4.njk', cjs: 'youtubeShortsMp4Pages.cjs', copyFrom: 'download-youtube-shorts.njk' },
    'download-youtube-playlist': { template: 'download-youtube-playlist.njk', cjs: 'downloadYoutubePlaylistPages.cjs', copyFrom: 'download-mp3-youtube-playlist.njk' },
    'multi-youtube-downloader': { template: 'multi-youtube-downloader.njk', cjs: 'multiYoutubeDownloaderPages.cjs', copyFrom: 'youtube-multi-downloader.njk' },
    'youtube-video-cutter': { template: 'youtube-video-cutter.njk', cjs: 'youtubeVideoCutterPages.cjs', copyFrom: 'cut-video-youtube.njk' },
    'download-youtube-channel': { template: 'download-youtube-channel.njk', cjs: 'downloadYoutubeChannelPages.cjs', copyFrom: 'download-mp3-youtube-playlist.njk' } // User requested copy from playlist
};

// First, delete old data folders
if (fs.existsSync(destDataDir)) {
    fs.rmSync(destDataDir, { recursive: true, force: true });
}
fs.mkdirSync(destDataDir, { recursive: true });

// Delete old template files if they are not in the new map or are source files being renamed
// Wait, safer to just keep old ones, but rename the ones in the map.
// Let's do the copy/rename logic.
for (const [folder, mapping] of Object.entries(pageMap)) {
    const targetTemplate = path.join(templatesDir, mapping.template);
    // Source template for copying/renaming
    if (mapping.copyFrom) {
        const srcTemplate = path.join(templatesDir, mapping.copyFrom);
        if (!fs.existsSync(targetTemplate) && fs.existsSync(srcTemplate)) {
            // Create new template from source
            let tplContent = fs.readFileSync(srcTemplate, 'utf8');

            // Update pagination data name inside frontmatter
            const dataNameRegex = /(pagination:\s*\n\s*data:\s*)([a-zA-Z0-9_]+)/;
            // We need to guess the data name (e.g. indexPages for 'index')
            const expectedDataName = mapping.cjs.replace('.cjs', '');
            tplContent = tplContent.replace(dataNameRegex, `$1${expectedDataName}`);

            fs.writeFileSync(targetTemplate, tplContent, 'utf8');
            console.log(`Created template: ${mapping.template} from ${mapping.copyFrom}`);
        }
    }

    // Copy data
    const srcJson = path.join(srcDataDir, folder, 'en.json');
    if (fs.existsSync(srcJson)) {
        const targetFolder = path.join(destDataDir, folder);
        if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });
        fs.copyFileSync(srcJson, path.join(targetFolder, 'en.json'));
        console.log(`Copied data for: ${folder}`);
    }

    // Generate CJS file
    const cjsPath = path.join(dataScriptDir, mapping.cjs);
    const dataName = mapping.cjs.replace('.cjs', '');
    const cjsContent = `const allPages = require('./allPages.cjs');

module.exports = function() {
  const pages = allPages();
  return pages.filter(p => p.pageKey === '${folder}');
};
`;
    fs.writeFileSync(cjsPath, cjsContent, 'utf8');
    console.log(`Created pagination script: ${mapping.cjs}`);
}

// 3. Update allPages.cjs
const allPagesPath = path.join(dataScriptDir, 'allPages.cjs');
let allPagesContent = fs.readFileSync(allPagesPath, 'utf8');

const newConfigs = Object.keys(pageMap).map(k => `    { pageKey: '${k}', slug: '${k === 'index' ? '' : k}' }`).join(',\n');
const configsStr = `  const pageConfigs = [\n${newConfigs}\n  ];`;

const configsRegex = /const pageConfigs = \[[\s\S]*?\];/;
allPagesContent = allPagesContent.replace(configsRegex, configsStr);

fs.writeFileSync(allPagesPath, allPagesContent, 'utf8');
console.log('Updated allPages.cjs');
