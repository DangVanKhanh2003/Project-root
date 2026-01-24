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
  // Load base i18n data per language (nav, footer, hero - shared across all pages)
  const i18nBaseDir = path.join(__dirname, '_templates/_data/i18n');
  const baseData = {};

  if (fs.existsSync(i18nBaseDir)) {
    const i18nFiles = fs.readdirSync(i18nBaseDir);
    i18nFiles.forEach(file => {
      if (file.endsWith('.json')) {
        const lang = file.replace('.json', '');
        const filePath = path.join(i18nBaseDir, file);
        baseData[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    });
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
    url: 'https://y2mate.vc',
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
      { code: 'vi', name: 'Tiếng Việt', isDefault: false },
    ]  });

  // Expose base i18n data per language (nav, footer, hero)
  // Access via i18nBase[lang] e.g. i18nBase['vi'], i18nBase['en']
  eleventyConfig.addGlobalData('i18nBase', baseData);

  // Expose page-specific i18n data
  eleventyConfig.addGlobalData('i18nPages', pagesData);


  // ============================================
  // 5. FILTERS (Template helpers)
  // ============================================

  // Strip HTML tags from string (for JSON-LD)
  eleventyConfig.addFilter('stripHtml', function(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '');
  });

  // Properly escape string for JSON-LD (no HTML entity encoding)
  // Use this for JSON-LD content inside <script> tags
  eleventyConfig.addFilter('jsonString', function(str) {
    if (!str) return '';
    // 1. Strip HTML tags
    let clean = str.replace(/<[^>]*>/g, '');
    // 2. Escape for JSON: backslash, quotes, newlines, tabs
    clean = clean
      .replace(/\\/g, '\\\\')      // backslashes first
      .replace(/"/g, '\\"')        // double quotes
      .replace(/\n/g, ' ')         // newlines → space
      .replace(/\r/g, '')          // carriage returns
      .replace(/\t/g, ' ');        // tabs → space
    return clean;
  });

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

  // Localize internal links with language prefix
  // Example: href="/youtube-to-mp4" → href="/vi/youtube-to-mp4" (for Vietnamese)
  eleventyConfig.addFilter('localizeLinks', function(html, langPrefix) {
    if (!html) return '';
    // Only add prefix if it exists (not empty for English)
    if (!langPrefix) return html;
    // Replace all href="/ with href="{langPrefix}/
    return html.replace(/href="\//g, `href="${langPrefix}/`);
  });


  // ============================================
  // 6. POST-BUILD: Copy output to final locations
  // ============================================
  eleventyConfig.on('eleventy.after', async () => {
    const outputDir = path.join(__dirname, '_11ty-output');
    const rootDir = __dirname;
    const pagesDir = path.join(__dirname, 'pages');

    // Ensure pages directory exists
    if (!fs.existsSync(pagesDir)) {
      fs.mkdirSync(pagesDir, { recursive: true });
    }

    // Helper: Copy directory recursively
    function copyDirSync(src, dest) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          copyDirSync(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    // Get all language codes (except 'en')
    const langCodes = ['ar', 'bn', 'de', 'es', 'fr', 'hi', 'id', 'it', 'ja', 'ko', 'my', 'ms', 'pt', 'ru', 'th', 'tr', 'ur', 'vi'];

    // Read output directory
    const items = fs.readdirSync(outputDir, { withFileTypes: true });

    for (const item of items) {
      const srcPath = path.join(outputDir, item.name);

      if (item.isDirectory() && langCodes.includes(item.name)) {
        // Language folder → copy to /pages/{lang}/
        const destPath = path.join(pagesDir, item.name);
        copyDirSync(srcPath, destPath);
        console.log(`[post-build] Copied ${item.name}/ → pages/${item.name}/`);
      } else if (item.isFile() && item.name.endsWith('.html')) {
        // English HTML files → copy to root
        const destPath = path.join(rootDir, item.name);
        fs.copyFileSync(srcPath, destPath);
        console.log(`[post-build] Copied ${item.name} → root`);
      }
    }

    console.log('[post-build] Done copying files to final locations');
  });


  // ============================================
  // 7. CONFIGURATION
  // ============================================
  return {
    dir: {
      input: "_templates",      // Source templates folder
      output: "_11ty-output",   // Build output folder (temp)
      includes: "_includes",    // Components (header, footer)
      layouts: "_includes",     // Layout files (same as includes)
      data: "_data"            // Data files (JSON, JS)
    },

    // Template formats to process
    templateFormats: ["njk"],

    // Use Nunjucks for HTML files too
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};

