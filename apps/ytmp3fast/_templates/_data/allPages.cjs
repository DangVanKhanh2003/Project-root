/**
 * Master page generator for ytmp3fast.com
 * Generates all page variants (pages × languages)
 *
 * Total: 6 pages × 19 languages = 114 page variants
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
// pageKey: matches folder name in _data/pages/
// slug: URL path (empty for homepage)
// NOTE: 404.html, about.html, terms-of-use.html are NOT translated (static HTML)
const pageConfigs = [
  { pageKey: 'index', slug: '' },
  { pageKey: 'youtube-to-mp3-320kbps', slug: 'youtube-to-mp3-320kbps-converter' },
  { pageKey: 'youtube-to-wav', slug: 'youtube-to-wav-converter' },
  { pageKey: 'youtube-to-flac', slug: 'youtube-to-flac-converter' },
  { pageKey: 'youtube-to-m4a', slug: 'youtube-to-m4a-converter' }
];

/**
 * Generate all page variants
 * @returns {Array} Array of page info objects
 */
module.exports = function() {
  const pages = [];

  for (const config of pageConfigs) {
    for (const lang of languages) {
      // Build permalink
      let permalink;
      if (lang.isDefault) {
        // English: /index.html or /youtube-to-mp3-320kbps-converter.html
        permalink = config.slug === ''
          ? '/index.html'
          : `/${config.slug}.html`;
      } else {
        // Other languages: /vi/index.html or /vi/youtube-to-mp3-320kbps-converter.html
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

// Export languages and pageConfigs for other modules
module.exports.languages = languages;
module.exports.pageConfigs = pageConfigs;
