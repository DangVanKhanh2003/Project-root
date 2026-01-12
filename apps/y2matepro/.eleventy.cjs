const fs = require('fs');
const path = require('path');

module.exports = function(eleventyConfig) {
  // ============================================
  // 1. PASS THROUGH STATIC ASSETS
  // ============================================
  // Copy static files that don't need processing
  eleventyConfig.addPassthroughCopy("public");


  // ============================================
  // 2. WATCH TARGETS (Auto-rebuild on change)
  // ============================================
  eleventyConfig.addWatchTarget("_templates/_data/");


  // ============================================
  // 3. LOAD i18n DATA (MODULAR STRUCTURE)
  // ============================================
  // Load base i18n data (nav, footer, hero - shared across all pages)
  const i18nBaseDir = path.join(__dirname, '_templates/_data/i18n');
  const baseData = {};

  if (fs.existsSync(i18nBaseDir)) {
    const baseFile = path.join(i18nBaseDir, 'base.json');
    if (fs.existsSync(baseFile)) {
      baseData.base = JSON.parse(fs.readFileSync(baseFile, 'utf-8'));
    }
  }

  // Load page-specific i18n data
  const pagesData = {};
  const pagesDir = path.join(__dirname, '_templates/_data/pages');

  if (fs.existsSync(pagesDir)) {
    const pageFolders = fs.readdirSync(pagesDir);

    pageFolders.forEach(pageFolder => {
      const pagePath = path.join(pagesDir, pageFolder);

      // Skip if not a directory
      if (!fs.statSync(pagePath).isDirectory()) return;

      pagesData[pageFolder] = {};

      // Load all language files for this page (en.json, vi.json, etc.)
      const pageFiles = fs.readdirSync(pagePath);
      pageFiles.forEach(file => {
        if (file.endsWith('.json')) {
          const lang = file.replace('.json', '');
          const filePath = path.join(pagePath, file);
          pagesData[pageFolder][lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
      });
    });
  }


  // ============================================
  // 4. GLOBAL DATA
  // ============================================
  // Make site config and i18n data available to all templates
  eleventyConfig.addGlobalData('site', {
    url: 'https://y2matepro.com',
    languages: [
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
      { code: 'vi', name: 'Tiếng Việt', isDefault: false }
    ]
  });

  // Expose base i18n data (nav, footer, hero)
  eleventyConfig.addGlobalData('i18nBase', baseData.base || {});

  // Expose page-specific i18n data
  eleventyConfig.addGlobalData('i18nPages', pagesData);


  // ============================================
  // 5. FILTERS (Template helpers)
  // ============================================

  // Get alternate URL for different language
  // Example: /youtube-to-mp4/ → /vi/youtube-to-mp4/ (for Vietnamese)
  eleventyConfig.addFilter('getAlternateUrl', function(url, targetLang) {
    // Remove any existing language prefix
    const cleanUrl = url.replace(/^\/(vi|es|fr|de|ja)/, '');

    // Add target language prefix (except for English = default)
    if (targetLang === 'en') {
      return cleanUrl || '/';
    }
    return `/${targetLang}${cleanUrl}`;
  });

  // Dump object as JSON (for inline <script> tags)
  eleventyConfig.addFilter('dump', function(obj) {
    return JSON.stringify(obj, null, 2);
  });


  // ============================================
  // 6. CONFIGURATION
  // ============================================
  return {
    dir: {
      input: "_templates",      // Source templates folder
      output: "_11ty-output",   // Build output folder (temp)
      includes: "_includes",    // Components (header, footer)
      data: "_data"            // Data files (JSON, JS)
    },

    // Template formats to process
    templateFormats: ["njk"],

    // Use Nunjucks for HTML files too
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
