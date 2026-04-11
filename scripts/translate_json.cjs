const fs = require('fs');
const path = require('path');

const targetLangs = ['ar', 'bn', 'de', 'es', 'fr', 'hi', 'id', 'it', 'ja', 'ko', 'my', 'ms', 'pt', 'ru', 'th', 'tr', 'ur', 'vi', 'zh-cn', 'zh-tw', 'tl'];
const sourceFile = 'f:/downloader/Project-root/apps/onedownloader.net/_templates/_data/pages/index/en.json';
const sourceData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

const protectWords = (text) => text.replace(/OneDownloader/g, '<span class="notranslate">OneDownloader</span>');
const unprotectWords = (text) => text.replace(/<span class=["']notranslate["']>(.*?)<\/span>/gi, '$1');

async function translateText(text, targetLang) {
    if (!text || typeof text !== 'string') return text;
    if (text === 'OneDownloader - Free Video Downloader') {
        const trans = await translateText('Free Video Downloader', targetLang);
        return `OneDownloader - ${trans}`;
    }

    const preparedText = protectWords(text);
    
    let currentRetry = 0;
    while(currentRetry < 3) {
      try {
          // Add delay to prevent rate limit
          await new Promise(r => setTimeout(r, 800));
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(preparedText)}`;
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const parsed = await response.json();
          let translated = '';
          if (parsed && parsed[0]) {
              for (const item of parsed[0]) {
                  if (item[0]) translated += item[0];
              }
          }
          let finalStr = unprotectWords(translated) || text;
          return finalStr;
      } catch(e) {
          console.error(`Attempt ${currentRetry+1} failed for text: "${text.slice(0, 20)}..."`, e.message);
          currentRetry++;
          await new Promise(r => setTimeout(r, 2000 * currentRetry));
      }
    }
    return text; // fallback
}

async function translateObject(obj, targetLang) {
    if (Array.isArray(obj)) {
        const result = [];
        for (const item of obj) {
            result.push(await translateObject(item, targetLang));
        }
        return result;
    } else if (typeof obj === 'object' && obj !== null) {
        const result = {};
        for (const key of Object.keys(obj)) {
            result[key] = await translateObject(obj[key], targetLang);
        }
        return result;
    } else if (typeof obj === 'string') {
        const res = await translateText(obj, targetLang);
        return res.replace(/<\s*strong\s*>/g, '<strong>')
                  .replace(/<\s*\/\s*strong\s*>/g, '</strong>');
    }
    return obj;
}

async function main() {
    const dir = path.dirname(sourceFile);
    for (const lang of targetLangs) {
        if (fs.existsSync(path.join(dir, `${lang}.json`))) {
            console.log(`Skipping ${lang}, already exists.`);
            continue;
        }
        console.log(`Translating to ${lang}...`);
        const translatedData = await translateObject(sourceData, lang);
        fs.writeFileSync(path.join(dir, `${lang}.json`), JSON.stringify(translatedData, null, 2));
        console.log(`Done translating to ${lang}.`);
    }
}

main().catch(console.error);
