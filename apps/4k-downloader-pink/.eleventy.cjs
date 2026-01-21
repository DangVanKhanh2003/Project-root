const fs = require('fs');
const path = require('path');

module.exports = function(eleventyConfig) {
  // ============================================
  // 1. PASS THROUGH STATIC ASSETS
  // ============================================
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
  eleventyConfig.addGlobalData('site', {
    url: 'https://4kvideo.pro',
    name: '4kvideo',
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

  // Expose i18n data to templates
  eleventyConfig.addGlobalData('i18nBase', baseData);
  eleventyConfig.addGlobalData('i18nPages', pagesData);


  // ============================================
  // 5. FILTERS (Template helpers)
  // ============================================

  // Strip HTML tags from string
  eleventyConfig.addFilter('stripHtml', function(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '');
  });

  // Escape string for JSON-LD
  eleventyConfig.addFilter('jsonString', function(str) {
    if (!str) return '';
    let clean = str.replace(/<[^>]*>/g, '');
    clean = clean
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .replace(/\t/g, ' ');
    return clean;
  });

  // Get alternate URL for different language
  eleventyConfig.addFilter('getAlternateUrl', function(url, targetLang) {
    const cleanUrl = url.replace(/^\/(vi|es|fr|de|ja|ar|bn|hi|id|it|ko|my|ms|pt|ru|th|tr|ur)/, '');
    if (targetLang === 'en') {
      return cleanUrl || '/';
    }
    return `/${targetLang}${cleanUrl}`;
  });

  // Dump object as JSON
  eleventyConfig.addFilter('dump', function(obj) {
    return JSON.stringify(obj, null, 2);
  });

  // Localize internal links - add language prefix to href="/" links
  // Usage: {{ content | localizeLinks(lang) | safe }}
  eleventyConfig.addFilter('localizeLinks', function(str, lang) {
    if (!str || !lang || lang === 'en') return str;

    const langCodes = ['ar', 'bn', 'de', 'es', 'fr', 'hi', 'id', 'it', 'ja', 'ko', 'my', 'ms', 'pt', 'ru', 'th', 'tr', 'ur', 'vi'];

    // Match href="/..." but not href="http" or href="mailto" or href="#"
    // Add language prefix to internal links
    return str.replace(/href="\/([^"]*?)"/g, function(match, path) {
      // Skip if external link
      if (path.startsWith('http') || path.startsWith('mailto') || path.startsWith('#')) {
        return match;
      }

      // Skip if already has language prefix
      const pathStart = path.split('/')[0];
      if (langCodes.includes(pathStart)) {
        return match;
      }

      return `href="/${lang}/${path}"`;
    });
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

    // Language codes (except 'en')
    const langCodes = ['ar', 'bn', 'de', 'es', 'fr', 'hi', 'id', 'it', 'ja', 'ko', 'my', 'ms', 'pt', 'ru', 'th', 'tr', 'ur', 'vi'];

    // Read output directory
    const items = fs.readdirSync(outputDir, { withFileTypes: true });

    for (const item of items) {
      const srcPath = path.join(outputDir, item.name);

      if (item.isDirectory() && langCodes.includes(item.name)) {
        // Language folder -> copy to /pages/{lang}/
        const destPath = path.join(pagesDir, item.name);
        copyDirSync(srcPath, destPath);
        console.log(`[post-build] Copied ${item.name}/ -> pages/${item.name}/`);
      } else if (item.isFile() && item.name.endsWith('.html')) {
        // English HTML files -> copy to root
        const destPath = path.join(rootDir, item.name);
        fs.copyFileSync(srcPath, destPath);
        console.log(`[post-build] Copied ${item.name} -> root`);
      }
    }

    console.log('[post-build] Done copying files to final locations');
  });


  // ============================================
  // 7. CONFIGURATION
  // ============================================
  // Eleventy 3.x: Explicitly set layouts directory
  eleventyConfig.setLayoutsDirectory("_includes");

  return {
    dir: {
      input: "_templates",
      output: "_11ty-output",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
