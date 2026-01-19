/**
 * Master page generator for mp3fast.net
 * Generates all page variants (pages × languages)
 */

// Supported languages
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
  { code: 'ms', name: 'Melayu', isDefault: false },
  { code: 'my', name: 'မြန်မာ', isDefault: false },
  { code: 'pt', name: 'Português', isDefault: false },
  { code: 'ru', name: 'Русский', isDefault: false },
  { code: 'th', name: 'ไทย', isDefault: false },
  { code: 'tr', name: 'Türkçe', isDefault: false },
  { code: 'ur', name: 'اردو', isDefault: false },
  { code: 'vi', name: 'Tiếng Việt', isDefault: false }
];

// Page configurations
const pageConfigs = [
  { pageKey: 'index', slug: '' }
];

module.exports = function() {
  const pages = [];

  for (const config of pageConfigs) {
    for (const lang of languages) {
      // Build permalink
      let permalink;
      if (lang.isDefault) {
        permalink = config.slug === ''
          ? '/index.html'
          : `/${config.slug}.html`;
      } else {
        permalink = config.slug === ''
          ? `/${lang.code}/index.html`
          : `/${lang.code}/${config.slug}.html`;
      }

      pages.push({
        pageKey: config.pageKey,
        lang: lang.code,
        langName: lang.name,
        isDefaultLang: lang.isDefault,
        slug: config.slug,
        permalink: permalink
      });
    }
  }

  return pages;
};

module.exports.languages = languages;
module.exports.pageConfigs = pageConfigs;
