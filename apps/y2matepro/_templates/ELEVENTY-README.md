# Eleventy (11ty) - Project Documentation

## Quick Reference

| Item | Value |
|------|-------|
| Eleventy Version | 3.1.2 |
| Template Engine | Nunjucks (.njk) |
| Languages | 19 (en, ar, bn, de, es, fr, hi, id, it, ja, ko, my, ms, pt, ru, th, tr, ur, vi) |
| Build Command | `npm run 11ty:build` |
| Watch Command | `npm run 11ty:watch` |

## Cấu Trúc Thư Mục (Chính Xác)

```
apps/y2matepro/
├── _templates/                      # Eleventy input directory
│   ├── _data/                       # Data files
│   │   ├── i18n/                    # Base i18n (19 files)
│   │   │   ├── en.json              # nav, footer, hero (shared)
│   │   │   ├── vi.json
│   │   │   └── ... (17 more)
│   │   ├── pages/                   # Page-specific data
│   │   │   ├── index/               # Homepage data
│   │   │   │   ├── en.json          # SEO, content, FAQs
│   │   │   │   └── ... (18 more)
│   │   │   ├── youtube-to-mp4/
│   │   │   ├── youtube-to-mp3/
│   │   │   └── youtube-short-downloader/
│   │   ├── allPages.cjs             # Master pagination generator
│   │   ├── indexPages.cjs           # Filter for homepage
│   │   ├── youtubeToMp4Pages.cjs    # Filter for mp4 page
│   │   ├── youtubeToMp3Pages.cjs    # Filter for mp3 page
│   │   └── youtubeShortPages.cjs    # Filter for shorts page
│   ├── _includes/                   # Template partials
│   │   ├── base.njk                 # Main layout
│   │   ├── header.njk               # Header component
│   │   ├── footer.njk               # Footer component
│   │   └── json-ld.njk              # JSON-LD structured data
│   └── pages/                       # Page templates (4 files)
│       ├── index.njk
│       ├── youtube-to-mp4.njk
│       ├── youtube-to-mp3.njk
│       └── youtube-short-downloader.njk
├── _11ty-output/                    # Temporary output (gitignored)
├── .eleventy.cjs                    # Eleventy config
├── index.html                       # Final EN output
├── youtube-to-mp4.html
└── pages/{lang}/                    # Final other language output
```

## Cơ Chế Hoạt Động

### Pagination Flow
```
Template (.njk)
    ↓ uses pagination data
{pageKey}Pages.cjs (e.g., youtubeToMp4Pages.cjs)
    ↓ filters from
allPages.cjs
    ↓ reads
_data/pages/{pageKey}/{lang}.json
    ↓ generates
Multiple HTML files (1 per language)
```

### Data Access trong Template
```nunjucks
{%- set base = i18nBase[lang] or i18nBase['en'] -%}      {# Shared data #}
{%- set page = i18nPages[pageKey][lang] or i18nPages[pageKey].en -%}  {# Page data #}

{{ base.nav.home }}          → Navigation text
{{ base.footer.copyright }}  → Footer text
{{ page.seo.title }}         → SEO title
{{ page.hero.title }}        → H1 title
{{ page.features.items }}    → Features array
{{ page.faqs.items }}        → FAQs array
```

---

## WORKFLOW: Thêm Page Mới

### Bước 1: Tạo Data Files (19 files)

**Path**: `_templates/_data/pages/{new-page-key}/`

Tạo 19 JSON files (en.json, vi.json, ar.json, ...) với cấu trúc:

```json
{
  "seo": {
    "title": "Page Title - Y2Mate",
    "description": "Meta description...",
    "ogTitle": "OG Title",
    "ogDescription": "OG Description",
    "schemaName": "Schema Name",
    "schemaDescription": "Schema description for JSON-LD"
  },
  "hero": {
    "title": "H1 Title"
  },
  "content": {
    "mainTitle": "Section Title",
    "intro1": "First paragraph...",
    "intro2": "Second paragraph..."
  },
  "instructions": {
    "title": "How to...",
    "steps": [
      "<strong>Step 1:</strong> Description...",
      "<strong>Step 2:</strong> Description...",
      "<strong>Step 3:</strong> Description..."
    ]
  },
  "whyChoose": {
    "title": "Why Choose...",
    "reasons": [
      "<strong>Reason 1:</strong> Description...",
      "<strong>Reason 2:</strong> Description..."
    ]
  },
  "features": {
    "title": "Features",
    "items": [
      { "title": "Feature 1", "description": "Description..." },
      { "title": "Feature 2", "description": "Description..." }
    ]
  },
  "faqs": {
    "title": "FAQ",
    "items": [
      { "question": "Question 1?", "answer": "Answer 1..." },
      { "question": "Question 2?", "answer": "Answer 2..." }
    ]
  }
}
```

### Bước 2: Update allPages.cjs

**File**: `_templates/_data/allPages.cjs`

Thêm vào array `pageConfigs`:
```javascript
const pageConfigs = [
  { pageKey: 'index', slug: '' },
  { pageKey: 'youtube-to-mp4', slug: 'youtube-to-mp4' },
  { pageKey: 'youtube-to-mp3', slug: 'youtube-to-mp3' },
  { pageKey: 'youtube-short-downloader', slug: 'youtube-short-downloader' },
  { pageKey: 'new-page-key', slug: 'new-page-slug' }  // ← ADD THIS
];
```

### Bước 3: Tạo Filter File

**File**: `_templates/_data/{newPageKey}Pages.cjs`

```javascript
const allPages = require('./allPages.cjs');

/**
 * Filter allPages to only return {new-page-key} variants
 */
module.exports = function() {
  const pages = allPages();
  return pages.filter(p => p.pageKey === 'new-page-key');
};
```

### Bước 4: Tạo Template

**File**: `_templates/pages/{new-page-key}.njk`

```nunjucks
---
layout: base.njk
pagination:
  data: newPageKeyPages
  size: 1
  alias: pageInfo
eleventyComputed:
  permalink: "{{ pageInfo.permalink }}"
  lang: "{{ pageInfo.lang }}"
  pageKey: "{{ pageInfo.pageKey }}"
---
{%- set base = i18nBase[lang] or i18nBase['en'] -%}
{%- set page = i18nPages[pageKey][lang] or i18nPages[pageKey].en -%}
<div class="container">
    <section class="y2mate-download-pro">
        <!-- Copy content from existing template -->
    </section>
</div>
```

### Bước 5: Build và Verify

```bash
npm run 11ty:build

# Verify output
ls _11ty-output/new-page-slug.html         # EN version
ls _11ty-output/vi/new-page-slug.html      # VI version

# Check for unrendered variables
grep "{{ " _11ty-output/new-page-slug.html
# No output = Success
```

---

## Naming Conventions

| Item | Format | Example |
|------|--------|---------|
| Page Key | kebab-case | `youtube-to-mp4` |
| URL Slug | kebab-case | `youtube-to-mp4` |
| Data folder | Same as pageKey | `pages/youtube-to-mp4/` |
| Template file | `{pageKey}.njk` | `youtube-to-mp4.njk` |
| Filter file | `{camelCase}Pages.cjs` | `youtubeToMp4Pages.cjs` |

## URL Structure

| Language | Homepage | Tool Page |
|----------|----------|-----------|
| English (default) | `/index.html` → `/` | `/youtube-to-mp4.html` → `/youtube-to-mp4` |
| Vietnamese | `/vi/index.html` → `/vi/` | `/vi/youtube-to-mp4.html` → `/vi/youtube-to-mp4` |
| Other langs | `/{lang}/index.html` | `/{lang}/{slug}.html` |

## Whitespace Control

**LUÔN dùng `{%-` và `-%}` cho:**
- Set variables: `{%- set base = ... -%}`
- Comments: `{#- Comment -#}`
- Logic không cần spacing

**KHÔNG dùng cho:**
- Content blocks cần giữ formatting

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Empty lines at start | Nunjucks tags | Use `{%-` and `-%}` |
| `.html` in SEO URLs | Eleventy page.url | Use filter `\| replace('.html', '')` |
| Unrendered `{{ }}` | Missing data | Check pageKey matches folder name |
| Duplicate permalinks | Wrong pagination | Each page needs own filter file |

## Resources

- Eleventy Docs: https://www.11ty.dev/docs/
- Nunjucks Syntax: https://mozilla.github.io/nunjucks/templating.html
