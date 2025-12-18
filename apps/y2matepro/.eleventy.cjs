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
  // 3. LOAD i18n DATA
  // ============================================
  // Load all JSON files from _data/i18n/ folder
  const i18nData = {};
  const i18nDir = path.join(__dirname, '_templates/_data/i18n');

  if (fs.existsSync(i18nDir)) {
    const i18nFiles = fs.readdirSync(i18nDir);

    i18nFiles.forEach(file => {
      if (file.endsWith('.json')) {
        const lang = file.replace('.json', '');
        const filePath = path.join(i18nDir, file);
        i18nData[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
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
      { code: 'vi', name: 'Tiếng Việt', isDefault: false }
    ]
  });

  eleventyConfig.addGlobalData('i18nData', i18nData);


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
