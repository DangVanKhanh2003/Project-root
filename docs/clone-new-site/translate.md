I need you to translate the English JSON data from the following sources files into 21 different languages:
ar, bn, de, es, fr, hi, id, it, ja, ko, ms, my, pt, ru, th, tl, tr, ur, vi, zh-cn, zh-tw.

The source files to translate are located at:
F:\downloader\Project-root\apps\{site-name}\_templates\_data\pages

For each source file, please read its content and generate the corresponding translated JSON files (e.g., vi.json, es.json) and save them in the EXACT SAME directory as their respective source en.json file.

CRITICAL RULES:
1. ONLY translate the text values. DO NOT translate any JSON keys (e.g., "title", "description", "h1", "p", etc.).
2. You MUST keep the brand name EXACTLY as is. DO NOT translate, transliterate, or modify the brand name.
3. Keep all HTML tags intact within the text (e.g., <strong>, </strong>, <a href="...">). Do not translate the tag names or modify href attribute values.
4. The output must be valid JSON format.
5. The translations must sound natural and be optimized for SEO in the target language.

NOTE: You need create many agents to translate. It will be quicker for translating.

---

## IMPORTANT: After translating, you MUST complete these additional steps

### 1. Create sub-page templates (if they don't exist yet)

Each page folder under `_templates/_data/pages/` (e.g., `download-youtube-to-mp3`, `download-youtube-shorts`) needs:

**A. A pagination data file** in `_templates/_data/`:
```javascript
// File: _templates/_data/downloadYoutubeToMp3Pages.cjs
const allPages = require('./allPages.cjs');

module.exports = function() {
  const pages = allPages();
  return pages.filter(p => p.pageKey === 'download-youtube-to-mp3');
};
```
The `pageKey` must match the folder name in `_templates/_data/pages/`.

**B. A Nunjucks template** in `_templates/pages/`:
```njk
{# File: _templates/pages/download-youtube-to-mp3.njk #}
---
layout: base.njk
pagination:
  data: downloadYoutubeToMp3Pages
  size: 1
  alias: pageInfo
eleventyComputed:
  permalink: "{{ pageInfo.permalink }}"
  lang: "{{ pageInfo.lang }}"
  pageKey: "{{ pageInfo.pageKey }}"
---
{%- set base = i18nBase[lang] or i18nBase['en'] -%}
{%- set page = i18nPages[pageKey][lang] or i18nPages[pageKey].en -%}
{%- set langPrefix = '' if (lang == 'en' or not lang) else '/' + lang -%}

<!-- Copy the same section structure from index.njk -->
```

**C. Register the page in `allPages.cjs`**: Ensure the `pageConfigs` array includes:
```javascript
{ pageKey: 'download-youtube-to-mp3', slug: 'download-youtube-to-mp3' },
```

### 2. Ensure HTML in data values renders correctly

JSON data values may contain inline HTML like `<a href="/download-youtube-to-mp3">`. In the Nunjucks templates, all `{{ }}` outputs that may contain HTML **MUST** use the `| safe` filter, otherwise Nunjucks will escape the HTML and render it as literal text.

For internal links, also apply `| localizeLinks(langPrefix)` before `| safe` to automatically prefix links with the current language code (e.g., `/download-youtube-to-mp3` → `/vi/download-youtube-to-mp3`).

**Correct pattern:**
```njk
<h2>{{ section.h2 | localizeLinks(langPrefix) | safe }}</h2>
<h3>{{ item.h3 | localizeLinks(langPrefix) | safe }}</h3>
<p>{{ para | localizeLinks(langPrefix) | safe }}</p>
```

**Wrong (HTML will be escaped as text):**
```njk
<h2>{{ section.h2 }}</h2>
```

### 3. Rebuild and verify

After all changes, rebuild Eleventy to generate all HTML pages:
```bash
cd apps/{site-name}
npx shx rm -rf _11ty-output && npx @11ty/eleventy --config=.eleventy.cjs --input=_templates --output=_11ty-output
```

Verify:
- Total HTML files = number of pages × number of languages (e.g., 4 pages × 22 langs = 88 files)
- Internal links are localized (e.g., `/vi/download-youtube-to-mp3` for Vietnamese pages)
- HTML tags in content render as actual HTML, not escaped text
