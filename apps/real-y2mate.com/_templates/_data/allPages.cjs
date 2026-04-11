const fs = require('fs');
const path = require('path');

/**
 * Generate all page variants for all languages
 * This creates an array that can be used with Eleventy pagination
const fs = require('fs');
const path = require('path');

/**
 * Generate all page variants for all languages
 * This creates an array that can be used with Eleventy pagination
 * to generate multilingual pages from a single template
 */
module.exports = function () {
  const pagesDir = path.join(__dirname, 'pages');
  const allPages = [];

  // Define all supported languages
  const languages = [
    { code: 'en', name: 'English', isDefault: true },
    { code: 'ar', name: 'العربية', isDefault: false },
    { code: 'bn', name: 'বাংলা', isDefault: false },
    { code: 'de', name: 'Deutsch', isDefault: false },
    { code: 'es', name: 'Español', isDefault: false },
    { code: 'fr', name: 'Français', isDefault: false },
    { code: 'hi', name: 'हिन्दी', isDefault: false },
    { code: 'id', name: 'Indonesia', isDefault: false },
    { code: 'it', name: 'Italiano', isDefault: false },
    { code: 'ja', name: '日本語', isDefault: false },
    { code: 'ko', name: '한국어', isDefault: false },
    { code: 'my', name: 'မြန်မာ', isDefault: false },
    { code: 'ms', name: 'Melayu', isDefault: false },
    { code: 'pt', name: 'Português', isDefault: false },
    { code: 'ru', name: 'Русский', isDefault: false },
    { code: 'th', name: 'ไทย', isDefault: false },
    { code: 'tr', name: 'Türkçe', isDefault: false },
    { code: 'ur', name: 'اردو', isDefault: false },
    { code: 'vi', name: 'Tiếng Việt', isDefault: false },
    { code: 'zh-cn', name: '简体中文', isDefault: false },
    { code: 'zh-tw', name: '繁体中文', isDefault: false },
    { code: 'tl', name: 'Filipino', isDefault: false }
  ];

  // Define page configs with their URL slugs
  const pageConfigs = [
    { pageKey: 'index', slug: '' },
    { pageKey: 'download-youtube-shorts', slug: 'download-youtube-shorts' },
    { pageKey: 'download-youtube-to-mp3', slug: 'download-youtube-to-mp3' },
    { pageKey: 'download-youtube-to-mp4', slug: 'download-youtube-to-mp4' },
  ];

  // Check which pages have data files
  if (!fs.existsSync(pagesDir)) {
    console.warn('[allPages.cjs] Pages directory not found:', pagesDir);
    return allPages;
  }

  const existingPageFolders = fs.readdirSync(pagesDir).filter(folder => {
    const folderPath = path.join(pagesDir, folder);
    return fs.statSync(folderPath).isDirectory();
  });

  // Generate page variants for each page and language
  pageConfigs.forEach(pageConfig => {
    // Check if page data folder exists
    if (!existingPageFolders.includes(pageConfig.pageKey)) {
      console.warn(`[allPages.cjs] Skipping ${pageConfig.pageKey} - no data folder found`);
      return;
    }

    const pageDataDir = path.join(pagesDir, pageConfig.pageKey);
    const availableLangs = fs.readdirSync(pageDataDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));

    languages.forEach(langInfo => {
      // Only generate if language data file exists
      if (!availableLangs.includes(langInfo.code)) {
        console.warn(`[allPages.cjs] Skipping ${pageConfig.pageKey}/${langInfo.code} - no data file`);
        return;
      }

      // Determine permalink
      let permalink;
      if (langInfo.isDefault) {
        // English (default): /index.html or /youtube-to-mp3.html
        permalink = pageConfig.slug === ''
          ? '/index.html'
          : `/${pageConfig.slug}.html`;
      } else {
        // Other languages: /vi/index.html or /vi/youtube-to-mp3.html
        permalink = pageConfig.slug === ''
          ? `/${langInfo.code}/index.html`
          : `/${langInfo.code}/${pageConfig.slug}.html`;
      }

      allPages.push({
        pageKey: pageConfig.pageKey,
        slug: pageConfig.slug,
        lang: langInfo.code,
        langName: langInfo.name,
        isDefaultLang: langInfo.isDefault,
        permalink: permalink,
        // For generating alternate URLs (hreflang)
        alternates: languages.map(alt => ({
          lang: alt.code,
          url: alt.isDefault
            ? (pageConfig.slug === '' ? '/' : `/${pageConfig.slug}/`)
            : (pageConfig.slug === '' ? `/${alt.code}/` : `/${alt.code}/${pageConfig.slug}/`)
        }))
      });
    });
  });

  console.log(`[allPages.cjs] Generated ${allPages.length} page variants`);
  return allPages;
};
