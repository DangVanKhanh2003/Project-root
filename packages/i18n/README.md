# @downloader/i18n

Internationalization system for downloader apps - supports 19 languages with SSR and CSR compatibility.

## Features

- 19 language support (en, ar, bn, de, es, fr, hi, id, it, ja, ko, ms, my, pt, ru, th, tr, ur, vi)
- RTL support for Arabic and Urdu
- SSR compatible (Eleventy)
- CSR compatible (vanilla JavaScript)
- Variable interpolation
- Fallback to English for missing translations
- Language detection (localStorage → URL param → browser language)
- Translation validation tool

## Installation

```bash
pnpm add @downloader/i18n
```

## Quick Start

### CSR (Client-Side Rendering)

```typescript
import { initI18n, loadTranslations, locales, t, setLanguage } from '@downloader/i18n';

// Initialize i18n
initI18n({
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
  debug: true
});

// Load locale data
Object.entries(locales).forEach(([lang, data]) => {
  loadTranslations(lang, data);
});

// Use translations
const buttonText = t('common.buttons.convert'); // "Convert"
const statusText = t('status.processingProgress', { progress: 45 }); // "Processing… 45%"

// Change language
setLanguage('vi'); // Switches to Vietnamese
```

### SSR (Server-Side Rendering - Eleventy)

```javascript
// In .eleventy.js
const { createSSRTranslator } = require('@downloader/i18n');
const enTranslations = require('@downloader/i18n/locales/en.json');

const t = createSSRTranslator('en', enTranslations);

// Use in templates
const title = t('features.downloader.title');
```

## Translation Keys

All translation keys use dot notation with maximum 3 levels:

- `common.*` - Shared UI elements (buttons, labels, actions)
- `status.*` - Conversion status messages
- `formats.*` - Media formats and quality options
- `errors.*` - Error messages
- `features.*` - Feature-specific text
- `aria.*` - Accessibility labels

## API Reference

### Core Functions

**`initI18n(config?: I18nConfig)`**
Initialize the i18n system (CSR only).

**`loadTranslations(lang: LanguageCode, data: TranslationObject)`**
Load translation data for a language.

**`t(key: string, variables?: object, lang?: LanguageCode)`**
Translate a key with optional variable interpolation.

**`setLanguage(lang: LanguageCode)`**
Change the current language (CSR only).

**`getLanguage()`**
Get the current language code.

**`getDirection(lang?: LanguageCode)`**
Get text direction ('ltr' or 'rtl').

**`isRTL(lang?: LanguageCode)`**
Check if language is right-to-left.

**`onLanguageChange(listener: (lang) => void)`**
Subscribe to language changes (CSR only).

### Utilities

**`getLanguageInfo(lang?: LanguageCode)`**
Get language metadata (name, native name, direction).

**`getSupportedLanguages()`**
Get array of all supported languages.

**`createSSRTranslator(lang, data)`**
Create a translation function for SSR (Eleventy).

## Translation Validation

Check locale files for missing/extra keys:

```bash
cd packages/i18n
pnpm run check
```

Output:
- Coverage percentage for each language
- Missing keys (compared to English)
- Extra keys (not in English)
- Empty values

## Supported Languages

| Code | Language | Direction | Native Name |
|------|----------|-----------|-------------|
| en | English | LTR | English |
| ar | Arabic | RTL | العربية |
| bn | Bengali | LTR | বাংলা |
| de | German | LTR | Deutsch |
| es | Spanish | LTR | Español |
| fr | French | LTR | Français |
| hi | Hindi | LTR | हिन्दी |
| id | Indonesian | LTR | Bahasa Indonesia |
| it | Italian | LTR | Italiano |
| ja | Japanese | LTR | 日本語 |
| ko | Korean | LTR | 한국어 |
| ms | Malay | LTR | Bahasa Melayu |
| my | Burmese | LTR | မြန်မာဘာသာ |
| pt | Portuguese | LTR | Português |
| ru | Russian | LTR | Русский |
| th | Thai | LTR | ไทย |
| tr | Turkish | LTR | Türkçe |
| ur | Urdu | RTL | اردو |
| vi | Vietnamese | LTR | Tiếng Việt |

## Variable Interpolation

Use curly braces for variables:

```typescript
// In locale file:
{
  "status": {
    "downloadProgress": "Converting... {loaded} MB / {total} MB"
  }
}

// In code:
t('status.downloadProgress', { loaded: 12, total: 26 });
// Output: "Converting... 12 MB / 26 MB"
```

## RTL Support

Arabic and Urdu are RTL languages. The engine automatically:
- Sets `<html dir="rtl">` when RTL language is active
- Provides `getDirection()` and `isRTL()` helpers for CSS

```typescript
import { getDirection, isRTL } from '@downloader/i18n';

// Check direction
const dir = getDirection(); // 'ltr' or 'rtl'

// Check if RTL
if (isRTL()) {
  // Apply RTL-specific styles
}
```

## Language Detection Priority

1. **localStorage** - Saved user preference
2. **URL parameter** - `?lang=vi`
3. **Browser language** - `navigator.language`
4. **Default** - Falls back to English

## Debug Mode

Enable debug logging:

```typescript
initI18n({ debug: true });
```

Logs:
- Language initialization
- Translation key lookups
- Missing key warnings
- Fallback usage

## File Structure

```
packages/i18n/
├── src/
│   ├── engine.ts          # Translation engine
│   ├── types.ts           # TypeScript types
│   ├── index.ts           # Main exports
│   └── locales/
│       ├── en.json        # English (default)
│       ├── ar.json        # Arabic
│       └── ... (19 total)
├── tools/
│   └── translation-checker.js
├── package.json
├── tsconfig.json
└── README.md
```

## Adding New Translation Keys

1. Add key to `src/locales/en.json`
2. Copy structure to all 18 other locale files
3. Run `pnpm run check` to verify
4. Translate non-English values (English values are placeholders)

## Migration Guide

To migrate an existing app to use i18n:

1. Add dependency to `package.json`:
   ```json
   {
     "dependencies": {
       "@downloader/i18n": "workspace:*"
     }
   }
   ```

2. Initialize in `main.ts`:
   ```typescript
   import { initI18n, loadTranslations, locales } from '@downloader/i18n';

   initI18n({ defaultLanguage: 'en' });
   Object.entries(locales).forEach(([lang, data]) => {
     loadTranslations(lang, data);
   });
   ```

3. Replace hardcoded strings:
   ```typescript
   // Before
   statusText = 'Converting...';

   // After
   import { t } from '@downloader/i18n';
   statusText = t('status.converting');
   ```

## License

MIT
