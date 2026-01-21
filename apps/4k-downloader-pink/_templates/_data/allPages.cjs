/**
 * Master pagination generator for all pages
 * Generates page variants for each language
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
  { code: 'my', name: 'မြန်မာ', isDefault: false },
  { code: 'ms', name: 'Melayu', isDefault: false },
  { code: 'pt', name: 'Português', isDefault: false },
  { code: 'ru', name: 'Русский', isDefault: false },
  { code: 'th', name: 'ไทย', isDefault: false },
  { code: 'tr', name: 'Türkçe', isDefault: false },
  { code: 'ur', name: 'اردو', isDefault: false },
  { code: 'vi', name: 'Tiếng Việt', isDefault: false }
];

// Page configurations
const pages = [
  { pageKey: 'index', slug: '' }
];

// Generate all page variants
const allPages = [];

pages.forEach(page => {
  languages.forEach(lang => {
    let permalink;

    if (lang.isDefault) {
      // English: /index.html or /slug.html
      permalink = page.slug === '' ? '/index.html' : `/${page.slug}.html`;
    } else {
      // Other languages: /lang/index.html or /lang/slug.html
      permalink = page.slug === ''
        ? `/${lang.code}/index.html`
        : `/${lang.code}/${page.slug}.html`;
    }

    allPages.push({
      pageKey: page.pageKey,
      lang: lang.code,
      permalink: permalink
    });
  });
});

module.exports = allPages;
