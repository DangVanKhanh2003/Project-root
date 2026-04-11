import fs from 'fs';
import path from 'path';

const basePath = 'f:/downloader/Project-root/apps/snakeloader.com/_templates/_data/pages';
const downloaders = ['twitter-downloader', 'mp3-downloader', 'video-downloader'];
const langs = ['ar', 'bn', 'de', 'es', 'fr', 'hi', 'id', 'it', 'ja', 'ko', 'ms', 'my', 'pt', 'ru', 'th', 'tl', 'tr', 'ur', 'vi', 'zh-cn', 'zh-tw'];

function checkStructure(enData, langData, filePath) {
  let issues = [];

  const enKeywords = enData.seo.keywords.split(',').length;
  const langKeywords = langData.seo.keywords.split(',').length;
  if (langKeywords < enKeywords - 2) {
     issues.push(`Keywords short: EN=${enKeywords}, Lang=${langKeywords}`);
  }

  const enSecs = enData.content.sections;
  const langSecs = langData.content.sections;

  if (!langSecs) {
    return [`No sections found`];
  }

  for (let i = 0; i < enSecs.length; i++) {
    if (!langSecs[i]) {
       issues.push(`Missing section ${i}`);
       continue;
    }
    for (const key of ['p', 'ol', 'ul']) {
      if (enSecs[i][key] && langSecs[i][key]) {
        if (enSecs[i][key].length !== langSecs[i][key].length) {
          issues.push(`Section ${i}.${key} length mismatch: EN=${enSecs[i][key].length}, Lang=${langSecs[i][key].length}`);
        }
      }
    }
  }

  return issues;
}

for (const dl of downloaders) {
  const enPath = path.join(basePath, dl, 'en.json');
  if (!fs.existsSync(enPath)) continue;
  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  let dlIssues = 0;
  for (const lang of langs) {
    const langPath = path.join(basePath, dl, `${lang}.json`);
    if (!fs.existsSync(langPath)) {
      console.log(`[${dl}] Missing ${lang}.json`);
      continue;
    }
    const langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    const issues = checkStructure(enData, langData, langPath);
    if (issues.length > 0) {
      dlIssues++;
      console.log(`[${dl}/${lang}] Issues:`, issues.join(' | '));
    }
  }
}
