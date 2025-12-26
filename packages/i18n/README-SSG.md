# SSG-Based i18n (HTML lang attribute)

## Architecture Overview

This i18n system uses **HTML-based language detection** - each language has its own static HTML page with the correct `<html lang>` attribute. No localStorage, no dynamic language switching.

### Key Principles

1. **Single Source of Truth**: `<html lang="vi">` attribute determines the language
2. **No Client State**: No localStorage, sessionStorage, or cookies
3. **Static Pages**: Each language variant is a separate HTML file
4. **Navigation-based Switching**: Changing language = navigating to different page

---

## File Structure

```
apps/ytmp3-clone-4/
├── index.html              → <html lang="en">  (default)
├── vi/
│   └── index.html          → <html lang="vi">
├── ar/
│   └── index.html          → <html lang="ar">
├── es/
│   └── index.html          → <html lang="es">
└── ... (19 languages total)
```

---

## How It Works

### 1. Page Load Flow

```
User visits: /vi/index.html
     ↓
[1] HTML loads with <html lang="vi">
     ↓
[2] main.ts executes
     ↓
[3] initI18n() reads document.documentElement.getAttribute('lang')
     ↓
[4] currentLanguage = 'vi'
     ↓
[5] All t() calls use Vietnamese translations
     ↓
[6] UI renders in Vietnamese
```

### 2. Language Detection

```typescript
// packages/i18n/src/engine.ts:292
function detectLanguage(): LanguageCode | null {
  // Read from <html lang="vi"> attribute ONLY
  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement.getAttribute('lang');
    if (htmlLang && LANGUAGES[htmlLang as LanguageCode]) {
      return htmlLang as LanguageCode;
    }
  }
  return null;
}
```

**Priority:** `<html lang>` → default language ('en')

**Removed:**
- ❌ localStorage detection
- ❌ URL parameter detection (?lang=vi)
- ❌ Browser language detection

### 3. Language Switching

When user selects a language from dropdown:

```typescript
// language-switcher.ts:44
select.addEventListener('change', (e) => {
  const newLang = e.target.value;
  navigateToLanguage(newLang); // ← Redirects to /vi/
});
```

**Navigation Logic:**
```typescript
// engine.ts:113
export function navigateToLanguage(lang: LanguageCode): void {
  const currentPath = window.location.pathname;
  const pathWithoutLang = currentPath.replace(/^\/[a-z]{2}\//, '/');

  let newPath: string;
  if (lang === 'en') {
    newPath = pathWithoutLang; // /index.html
  } else {
    newPath = `/${lang}${pathWithoutLang}`; // /vi/index.html
  }

  window.location.href = newPath;
}
```

**Examples:**
- `/` + select 'vi' → redirects to `/vi/`
- `/vi/` + select 'en' → redirects to `/`
- `/ar/search?v=123` + select 'vi' → redirects to `/vi/search?v=123`

---

## Building Multi-Language Pages

### Option A: Manual HTML Files (Simple)

Create HTML files manually for each language:

```bash
# Copy index.html for each language
cp index.html vi/index.html
cp index.html ar/index.html
cp index.html es/index.html
# ... etc
```

Update `<html lang>` in each file:

```html
<!-- vi/index.html -->
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>YTMP3 – Tải YouTube sang MP3</title>
  <script type="module" src="/src/main.ts"></script>
</head>
...
```

### Option B: Vite Plugin (Automated)

Create a Vite plugin to generate language pages:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

const LANGUAGES = ['en', 'vi', 'ar', 'es', 'fr', 'de', 'hi', 'id', 'it', 'ja', 'ko', 'ms', 'my', 'pt', 'ru', 'th', 'tr', 'ur'];

export default defineConfig({
  plugins: [
    // Multi-language HTML generation plugin
    {
      name: 'multi-lang-html',
      transformIndexHtml: {
        enforce: 'pre',
        transform(html, ctx) {
          // Detect language from path
          const match = ctx.path.match(/^\/([a-z]{2})\//);
          const lang = match ? match[1] : 'en';

          // Replace lang attribute
          return html.replace(
            /<html lang="[^"]*">/,
            `<html lang="${lang}">`
          );
        }
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        ...Object.fromEntries(
          LANGUAGES.filter(l => l !== 'en').map(lang => [
            lang,
            `${lang}/index.html`
          ])
        )
      }
    }
  }
});
```

### Option C: 11ty/Eleventy (SSG)

Use Eleventy to generate pages from templates:

```js
// .eleventy.js
const LANGUAGES = ['en', 'vi', 'ar', ...];

module.exports = function(eleventyConfig) {
  // Generate a page for each language
  eleventyConfig.addGlobalData('languages', LANGUAGES);

  // Create permalink for each language
  eleventyConfig.addFilter('langPermalink', function(lang) {
    return lang === 'en' ? '/' : `/${lang}/`;
  });
};
```

```njk
<!-- index.njk -->
---
permalink:
  - /
  - /vi/
  - /ar/
  - /es/
---
<!DOCTYPE html>
<html lang="{{ lang }}">
...
```

---

## SEO Optimization

### 1. Hreflang Tags

Add to each page's `<head>`:

```html
<!-- index.html (English) -->
<link rel="alternate" hreflang="en" href="https://ytmp3.gg/" />
<link rel="alternate" hreflang="vi" href="https://ytmp3.gg/vi/" />
<link rel="alternate" hreflang="ar" href="https://ytmp3.gg/ar/" />
<link rel="alternate" hreflang="x-default" href="https://ytmp3.gg/" />
```

### 2. Language-Specific Metadata

```html
<!-- vi/index.html -->
<html lang="vi" dir="ltr">
<head>
  <meta charset="utf-8" />
  <title>YTMP3 – Chuyển đổi YouTube sang MP3 miễn phí</title>
  <meta name="description" content="Công cụ chuyển đổi YouTube sang MP3 & MP4 miễn phí, nhanh, an toàn." />
  ...
</head>
```

### 3. Sitemap with Languages

```xml
<!-- sitemap.xml -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://ytmp3.gg/</loc>
    <xhtml:link rel="alternate" hreflang="vi" href="https://ytmp3.gg/vi/" />
    <xhtml:link rel="alternate" hreflang="ar" href="https://ytmp3.gg/ar/" />
  </url>
  <url>
    <loc>https://ytmp3.gg/vi/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://ytmp3.gg/" />
    <xhtml:link rel="alternate" hreflang="ar" href="https://ytmp3.gg/ar/" />
  </url>
</urlset>
```

---

## Testing

### Test Language Detection

```bash
# Test English (default)
curl -I http://localhost:5173/
# Should see: <html lang="en">

# Test Vietnamese
curl -I http://localhost:5173/vi/
# Should see: <html lang="vi">

# Test Arabic (RTL)
curl -I http://localhost:5173/ar/
# Should see: <html lang="ar" dir="rtl">
```

### Test Language Switcher

1. Open browser DevTools → Console
2. Select Vietnamese from dropdown
3. Should see: Navigation to `/vi/`
4. Page should reload with Vietnamese UI
5. Check HTML: `<html lang="vi" dir="ltr">`

---

## Migration Checklist

- [x] Remove localStorage logic from `engine.ts`
- [x] Update `detectLanguage()` to only read HTML lang
- [x] Rename `setLanguage()` → `navigateToLanguage()`
- [x] Update `language-switcher.ts` to use navigation
- [ ] Create HTML files for all 19 languages
- [ ] Add hreflang tags to all pages
- [ ] Update build process to generate language pages
- [ ] Update sitemap.xml with language variants
- [ ] Test language detection on all pages
- [ ] Test language switcher navigation
- [ ] Verify SEO metadata per language

---

## Benefits of This Approach

### ✅ Advantages
- **SEO-friendly**: Each language has unique URL
- **No client state**: Works without JavaScript
- **Fast**: No localStorage reads/writes
- **Clean**: Simple, predictable behavior
- **Cacheable**: Each page can be cached separately
- **Shareable**: Users can share language-specific URLs

### ⚠️ Considerations
- **Build complexity**: Need to generate 19 HTML files
- **Navigation**: Language change = page reload (not SPA-like)
- **Duplicate HTML**: More files to maintain

---

## API Changes

### Removed Functions
- ❌ `setLanguage()` - replaced with `navigateToLanguage()`
- ❌ localStorage detection in `detectLanguage()`

### New Functions
- ✅ `navigateToLanguage(lang)` - redirects to language page

### Unchanged Functions
- ✅ `initI18n()` - still initializes i18n
- ✅ `t(key, vars)` - still translates keys
- ✅ `getLanguage()` - still returns current language
- ✅ `getDirection()` - still returns 'ltr' or 'rtl'
