# AI CLI Setup Workflow - 11ty Template System for y2matevc

This document provides a complete step-by-step workflow for AI CLI to set up the 11ty template system for y2matevc by studying the y2matepro reference project.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Research & Study](#phase-1-research--study)
3. [Phase 2: Setup & Installation](#phase-2-setup--installation)
4. [Phase 3: Configuration](#phase-3-configuration)
5. [Phase 4: Data Structure](#phase-4-data-structure)
6. [Phase 5: Templates](#phase-5-templates)
7. [Phase 6: Integration & Testing](#phase-6-integration--testing)
8. [Validation Checklist](#validation-checklist)

---

## Prerequisites

Before starting, ensure:
- ✅ You have access to both projects: `y2matepro` (reference) and `y2matevc` (target)
- ✅ Node.js and pnpm are installed
- ✅ You understand the current y2matevc structure

---

## Phase 1: Research & Study

### Step 1.1: Study y2matepro's 11ty Implementation

**Goal:** Understand how y2matepro implements 11ty templates

**Prompt for AI CLI:**
```
I need you to study how y2matepro implements their 11ty template system.

Please read and analyze these files in order:

1. f:/downloader/Project-root/apps/y2matepro/_templates/ELEVENTY-README.md
2. f:/downloader/Project-root/apps/y2matepro/.eleventy.cjs
3. f:/downloader/Project-root/apps/y2matepro/_templates/_includes/base.njk
4. f:/downloader/Project-root/apps/y2matepro/_templates/_data/allPages.cjs
5. f:/downloader/Project-root/apps/y2matepro/_templates/_data/i18n/en.json
6. f:/downloader/Project-root/apps/y2matepro/_templates/_data/pages/index/en.json

After reading, summarize:
- How the 2-layer i18n system works (base i18n + page-specific data)
- How pagination generates multilingual pages
- How templates inject data into HTML
- The directory structure pattern
```

**Expected Output:**
AI should provide a summary explaining:
- Base i18n for shared UI text (nav, buttons, errors)
- Page-specific data for SEO and content
- Pagination pattern for generating pages per language
- Template inheritance structure

**⚠️ Important Notes:**
- The reference project (y2matepro) does NOT inject `window.__i18n__` for TypeScript
- Y2matepro uses pure template rendering - TypeScript has hard-coded text
- Multilingual support is for SEO content only, not dynamic UI

**Validation:**
```bash
# AI should be able to explain these concepts:
- What is in i18nBase vs i18nPages?
- How does allPages.cjs generate page variants?
- What filters are available (stripHtml, localizeLinks, jsonString)?
```

---

### Step 1.2: Analyze y2matevc Current Structure

**Goal:** Understand the current y2matevc HTML structure

**Prompt for AI CLI:**
```
I need you to analyze the current y2matevc project structure.

Please read these files:
1. f:/downloader/Project-root/apps/y2matevc/index.html
2. f:/downloader/Project-root/apps/y2matevc/youtube-to-mp3.html
3. f:/downloader/Project-root/apps/y2matevc/youtube-to-mp4.html
4. f:/downloader/Project-root/apps/y2matevc/youtube-short-downloader.html
5. f:/downloader/Project-root/apps/y2matevc/package.json
6. f:/downloader/Project-root/apps/y2matevc/vite.config.ts

Identify:
- Current page structure (how many pages, what content)
- Hard-coded text that needs to be moved to data files
- SEO meta tags structure
- Content sections and their organization
- Build pipeline (Vite usage)
```

**Expected Output:**
AI should identify:
- 4 pages with specific purposes (index, mp3, mp4, shorts)
- Hard-coded SEO meta tags
- Content sections with titles and paragraphs
- FAQ sections
- Current Vite-only build (no 11ty yet)

**⚠️ Important Notes:**
- All HTML tags (`<strong>`, `<a>`, `<em>`) must be preserved in data extraction
- Links between pages must maintain correct paths
- SEO meta tags have specific character limits (title: 50-60, description: 150-160)

**Validation:**
```bash
# AI should list:
- 4 pages (index, youtube-to-mp3, youtube-to-mp4, youtube-short-downloader)
- Sections per page (What Is..., How To..., FAQs, etc.)
- Cross-page links that need localization
```

---

## Phase 2: Setup & Installation

### Step 2.1: Install 11ty

**Goal:** Add 11ty to the project

**Prompt for AI CLI:**
```
Install @11ty/eleventy as a dev dependency in the y2matevc project.

IMPORTANT: This project uses pnpm, not npm. Use the correct package manager.

Run: pnpm add -D @11ty/eleventy

After installation, verify the version is 3.x or higher.
```

**Expected Output:**
```
✓ @11ty/eleventy@3.1.2 installed
```

**⚠️ Important Notes:**
- DO NOT use `npm install` - will cause "workspace: protocol not supported" error
- MUST use `pnpm add -D @11ty/eleventy`
- Version should be 3.x (compatible with ESM)

**Validation:**
```bash
cd f:/downloader/Project-root/apps/y2matevc
pnpm list @11ty/eleventy
# Should show: @11ty/eleventy 3.1.2 (or higher)
```

---

### Step 2.2: Create Directory Structure

**Goal:** Set up the 11ty directories

**Prompt for AI CLI:**
```
Create the following directory structure in f:/downloader/Project-root/apps/y2matevc:

_templates/
├── _data/
│   ├── i18n/           # Base UI translations
│   ├── pages/          # Page-specific content
│   │   ├── index/
│   │   ├── youtube-to-mp3/
│   │   ├── youtube-to-mp4/
│   │   └── youtube-short-downloader/
│   ├── allPages.cjs
│   ├── indexPages.cjs
│   ├── youtubeToMp3Pages.cjs
│   ├── youtubeToMp4Pages.cjs
│   └── youtubeShortPages.cjs
├── _includes/
│   ├── base.njk
│   ├── header.njk
│   ├── footer.njk
│   └── json-ld.njk
└── pages/
    ├── index.njk
    ├── youtube-to-mp3.njk
    ├── youtube-to-mp4.njk
    └── youtube-short-downloader.njk

Create only the directories, not the files yet.
```

**Expected Output:**
All directories created successfully.

**⚠️ Important Notes:**
- Use exact naming: `_templates` (with underscore), not `templates`
- `_data` and `_includes` must start with underscore (11ty convention)
- `pages` subdirectory (no underscore) contains template files

**Validation:**
```bash
cd f:/downloader/Project-root/apps/y2matevc
ls -la _templates/
# Should show: _data/, _includes/, pages/
```

---

### Step 2.3: Update package.json Scripts

**Goal:** Add 11ty build scripts

**Prompt for AI CLI:**
```
Update f:/downloader/Project-root/apps/y2matevc/package.json scripts section.

Add these scripts:
- "11ty:build": "eleventy --config=.eleventy.cjs --input=_templates --output=_11ty-output"
- "11ty:watch": "eleventy --config=.eleventy.cjs --input=_templates --output=_11ty-output --watch"
- Update "build" to: "npm run 11ty:build && tsc && vite build"

IMPORTANT: The build pipeline is sequential: 11ty first, then Vite.
```

**Expected Output:**
```json
{
  "scripts": {
    "11ty:build": "eleventy --config=.eleventy.cjs --input=_templates --output=_11ty-output",
    "11ty:watch": "eleventy --config=.eleventy.cjs --input=_templates --output=_11ty-output --watch",
    "build": "npm run 11ty:build && tsc && vite build",
    ...
  }
}
```

**⚠️ Important Notes:**
- Build order matters: 11ty → TypeScript → Vite
- Output directory is `_11ty-output` (temporary, should be gitignored)
- Config file is `.eleventy.cjs` (CommonJS, not ESM)

**Validation:**
```bash
cd f:/downloader/Project-root/apps/y2matevc
npm run 11ty:build
# Should show error (expected - no config file yet)
```

---

## Phase 3: Configuration

### Step 3.1: Create .eleventy.cjs

**Goal:** Configure 11ty with data loading and filters

**Prompt for AI CLI:**
```
Create f:/downloader/Project-root/apps/y2matevc/.eleventy.cjs

Copy the configuration from y2matepro's .eleventy.cjs, but make these changes:
1. Change site.url from 'https://y2matepro.com' to 'https://y2matevc.com'
2. Keep all filters: stripHtml, jsonString, localizeLinks, dump, getAlternateUrl
3. Keep post-build hook for copying files
4. Load i18n data from _data/i18n/*.json
5. Load page data from _data/pages/{pageKey}/*.json

IMPORTANT:
- This is a .cjs file (CommonJS), use module.exports
- Include the post-build hook that copies EN files to root, others to pages/{lang}/
```

**Expected Output:**
`.eleventy.cjs` file created with:
- Site config with correct URL
- Data loading for i18nBase and i18nPages
- All filters implemented
- Post-build hook for file copying

**⚠️ Important Notes:**
- MUST use CommonJS syntax (`module.exports`), not ESM
- `site.url` must match your domain (y2matevc.com)
- Filters are critical for template rendering (especially `localizeLinks` and `jsonString`)
- Post-build hook creates language-specific directory structure

**Validation:**
```bash
cd f:/downloader/Project-root/apps/y2matevc
node -e "console.log(require('./.eleventy.cjs'))"
# Should not throw errors
```

---

### Step 3.2: Create .eleventyignore

**Goal:** Configure files to ignore

**Prompt for AI CLI:**
```
Create f:/downloader/Project-root/apps/y2matevc/.eleventyignore

Add these patterns:
node_modules
.git
dist
_11ty-output
src
public
```

**Expected Output:**
`.eleventyignore` file with ignore patterns.

**⚠️ Important Notes:**
- Prevents 11ty from processing unnecessary files
- Speeds up build time
- Avoids conflicts with source files

---

### Step 3.3: Update .gitignore

**Goal:** Ignore 11ty build output

**Prompt for AI CLI:**
```
Add this line to f:/downloader/Project-root/apps/y2matevc/.gitignore:

_11ty-output/

This directory contains temporary 11ty build output and should not be committed.
```

**Expected Output:**
`_11ty-output/` added to .gitignore.

**⚠️ Important Notes:**
- `_11ty-output` is temporary - Vite reads from it but final output is `dist/`
- Do not commit this directory

---

## Phase 4: Data Structure

### Step 4.1: Create Base i18n Data (en.json)

**Goal:** Create shared UI translations

**Prompt for AI CLI:**
```
Create f:/downloader/Project-root/apps/y2matevc/_templates/_data/i18n/en.json

This file contains ALL UI text for the application:
- nav: navigation links
- hero: input placeholder, buttons
- formatSelector: format options (MP4/MP3), quality options, auto-submit
- status: processing states
- buttons: download, try again, cancel, see more/less, bulk download
- gallery: gallery UI text
- mobile: mobile menu labels
- footer: footer links
- errors: error messages
- messages: success/info messages

IMPORTANT RULES:
1. Include ALL quality options for MP4 (1080p, 720p, 480p, 360p, 240p, 144p, WEBM, MKV)
2. Include ALL quality options for MP3 (320kbps, 256kbps, 192kbps, 128kbps, OGG, OPUS, WAV)
3. Keep format names as-is (MP4, MP3, WEBM, etc.) - these are technical terms
4. Use natural English for button labels and UI text

Reference y2matepro's _data/i18n/en.json for structure, but ensure y2matevc has all needed keys.
```

**Expected Output:**
Complete `en.json` file with all UI text organized by section.

**⚠️ Important Notes:**
- This is the MASTER file - all translations will be based on this
- DO NOT translate format names (MP4, MP3, WEBM, MKV, OGG, OPUS, WAV)
- Quality values (1080p, 320kbps) should not be translated
- All text must be in English (other languages come later)
- JSON must be valid (check with JSON validator)

**Validation:**
```bash
cd f:/downloader/Project-root/apps/y2matevc/_templates/_data/i18n
node -e "const data = require('./en.json'); console.log('Keys:', Object.keys(data)); console.log('MP4 options:', data.formatSelector.options.mp4);"
# Should show all keys and MP4 options
```

---

### Step 4.2: Create Pagination Generators

**Goal:** Create data files that generate page variants for each language

**Prompt for AI CLI:**
```
Create these 5 files in f:/downloader/Project-root/apps/y2matevc/_templates/_data/:

1. allPages.cjs - Master generator
2. indexPages.cjs - Filter for index page
3. youtubeToMp3Pages.cjs - Filter for MP3 page
4. youtubeToMp4Pages.cjs - Filter for MP4 page
5. youtubeShortPages.cjs - Filter for Shorts page

Configuration:
- pageConfigs: 4 pages (index, youtube-to-mp4, youtube-to-mp3, youtube-short-downloader)
- languages: Start with 2 languages (en as default, vi for testing)
  - en: { code: 'en', name: 'English', isDefault: true }
  - vi: { code: 'vi', name: 'Tiếng Việt', isDefault: false }

Each page variant should have:
- pageKey: identifies the page (e.g., 'index', 'youtube-to-mp3')
- lang: language code
- permalink: URL path (EN: /page.html, others: /{lang}/page.html)

Reference y2matepro's allPages.cjs for the exact pattern.

IMPORTANT: Log skipped pages when data files are missing.
```

**Expected Output:**
5 files created with pagination logic.

**⚠️ Important Notes:**
- `allPages.cjs` generates ALL page variants (pageKey × language)
- Filter files (indexPages.cjs, etc.) use `allPages.filter()` to get specific page
- isDefault=true means English pages go to root (/), others go to /{lang}/
- MUST log when skipping pages due to missing data files (helps debugging)
- For MVP, start with 2 languages (en, vi), expand to 19 later

**Validation:**
```bash
cd f:/downloader/Project-root/apps/y2matevc/_templates/_data
node -e "const pages = require('./allPages.cjs'); console.log('Generated:', pages.length, 'page variants');"
# Should show: Generated: 8 page variants (4 pages × 2 languages)
```

---

### Step 4.3: Create Page Data Files (en.json)

**Goal:** Extract content from HTML files and create structured JSON data

**Prompt for AI CLI:**
```
Create page data files by extracting content from existing HTML files:

Source Files:
- f:/downloader/Project-root/apps/y2matevc/index.html
- f:/downloader/Project-root/apps/y2matevc/youtube-to-mp3.html
- f:/downloader/Project-root/apps/y2matevc/youtube-to-mp4.html
- f:/downloader/Project-root/apps/y2matevc/youtube-short-downloader.html

Target Files:
- f:/downloader/Project-root/apps/y2matevc/_templates/_data/pages/index/en.json
- f:/downloader/Project-root/apps/y2matevc/_templates/_data/pages/youtube-to-mp3/en.json
- f:/downloader/Project-root/apps/y2matevc/_templates/_data/pages/youtube-to-mp4/en.json
- f:/downloader/Project-root/apps/y2matevc/_templates/_data/pages/youtube-short-downloader/en.json

Each file should have this structure:
{
  "seo": {
    "title": "...",           // <title> tag (50-60 chars)
    "description": "...",     // <meta name="description"> (150-160 chars)
    "ogTitle": "...",         // <meta property="og:title">
    "ogDescription": "...",   // <meta property="og:description">
    "schemaName": "...",      // Schema.org name
    "schemaDescription": "..." // Schema.org description
  },
  "hero": {
    "title": "..."            // <h1> page title
  },
  "content": {
    "sections": [             // Array of content sections
      {
        "title": "...",
        "paragraphs": ["...", "..."]
      }
    ]
  },
  "whyChoose": {              // Why choose this service
    "title": "...",
    "intro": "...",
    "reasons": ["...", "..."]
  },
  "instructions": {           // How-to guide
    "title": "...",
    "steps": ["...", "..."],
    "note": "..."
  },
  "faqs": {                   // FAQs section
    "title": "...",
    "items": [
      {
        "question": "...",
        "answer": "..."
      }
    ]
  }
}

CRITICAL RULES FOR HTML PRESERVATION:
1. PRESERVE ALL HTML TAGS: <strong>, <a>, <em>, etc.
2. For links: Keep <a href="/path">text</a> intact - do not break the HTML
3. Escape quotes in JSON: <a href=\"/path\">
4. Example: "The <strong>YouTube to MP3</strong> page from <a href=\"/\">Y2Mate</a>..."
5. Do NOT strip or modify any HTML tags from the source
6. Cross-page links must be correct (e.g., <a href="/youtube-to-mp4">YouTube to MP4</a>)

SEO GUIDELINES:
- title: 50-60 characters (optimal for Google)
- description: 150-160 characters (avoid truncation)
- Include relevant keywords naturally
- ogTitle and ogDescription can be slightly different from title/description

Extract all content sections, FAQs, and metadata from the HTML files.
```

**Expected Output:**
4 JSON files with complete page data, all HTML tags preserved.

**⚠️ Important Notes:**
- **HTML PRESERVATION IS CRITICAL**: Do not strip `<strong>`, `<a>`, or any HTML tags
- Links like `<a href="/youtube-to-mp4">YouTube to MP4</a>` must stay intact
- Use proper JSON escaping: `<a href=\"/path\">` (backslash before quotes)
- SEO meta tags have character limits - follow them strictly
- FAQs must include both question and answer
- Content sections should match the original HTML structure

**Common Mistakes to Avoid:**
- ❌ Removing `<strong>` tags: `YouTube to MP3` (WRONG)
- ✅ Keeping `<strong>` tags: `<strong>YouTube to MP3</strong>` (CORRECT)
- ❌ Breaking links: `YouTube to MP4 page` (WRONG)
- ✅ Preserving links: `<a href="/youtube-to-mp4">YouTube to MP4</a>` (CORRECT)

**Validation:**
```bash
cd f:/downloader/Project-root/apps/y2matevc/_templates/_data/pages
# Validate JSON syntax
for dir in */; do
  echo "Validating ${dir}en.json"
  node -e "JSON.parse(require('fs').readFileSync('${dir}en.json', 'utf-8'))" && echo "✓ Valid" || echo "✗ Invalid"
done

# Check HTML tags are preserved
grep -r "<strong>" */en.json  # Should find <strong> tags
grep -r "<a href=" */en.json  # Should find <a> tags
```

---

## Phase 5: Templates

### Step 5.1: Create Base Layout (base.njk)

**Goal:** Create the master layout template

**Prompt for AI CLI:**
```
Create f:/downloader/Project-root/apps/y2matevc/_templates/_includes/base.njk

This template should:
1. Set up HTML structure with proper meta tags
2. Include SEO metadata from pageData.seo
3. Generate hreflang tags for multilingual SEO
4. Include canonical URLs
5. Add Open Graph and Schema.org markup
6. Include header, footer, and json-ld
7. Load main.ts via Vite

IMPORTANT - DO NOT INJECT window.__i18n__:
- Y2matepro does NOT inject JavaScript i18n data
- TypeScript files use hard-coded text (not dynamic i18n)
- Only template-rendered text is multilingual

Reference y2matepro's base.njk for the exact structure.

Key variables:
- seo: pageData.seo (title, description, og tags)
- lang: current language code
- pageKey: current page identifier
- base: i18nBase[lang] (shared UI text, but only for template use)

Include these sections:
- Head with meta tags
- hreflang links for all languages
- Canonical URL
- Open Graph tags
- JSON-LD structured data (via include)
- Body with header, main content, footer
```

**Expected Output:**
Complete `base.njk` with proper SEO structure.

**⚠️ Important Notes:**
- **DO NOT add `<script>window.__i18n__ = ...</script>`** - this pattern is NOT used
- TypeScript files have hard-coded English text (same as y2matepro)
- Only use i18nBase data in TEMPLATES, not injected to JavaScript
- hreflang tags are critical for multilingual SEO
- FOUC prevention script is optional but recommended

**Validation:**
After building, check generated HTML does not have `window.__i18n__`:
```bash
npm run 11ty:build
grep "window.__i18n__" _11ty-output/index.html
# Should return nothing (no match)
```

---

### Step 5.2: Create Header Template (header.njk)

**Goal:** Create navigation header

**Prompt for AI CLI:**
```
Create f:/downloader/Project-root/apps/y2matevc/_templates/_includes/header.njk

This template should render:
1. Logo and site name
2. Navigation links (from base.nav)
3. Language switcher dropdown
4. Mobile menu overlay

IMPORTANT:
- Use langPrefix for URL localization: '' for EN, '/{lang}' for others
- Navigation links: home, youtubeToMp4, youtubeToMp3, youtubeShorts
- Language switcher should list all available languages
- Mobile menu should be responsive

Reference y2matepro's header.njk for structure.
```

**Expected Output:**
`header.njk` with responsive navigation and language switcher.

**⚠️ Important Notes:**
- langPrefix calculation: `'' if (lang == 'en' or not lang) else '/' + lang`
- Links must work for both English (/) and other languages (/vi/, /es/)
- Language switcher shows current language, dropdown shows others
- Mobile menu requires JavaScript (already in y2matevc)

**Validation:**
Check generated HTML has correct URLs:
```bash
npm run 11ty:build
grep 'href="/"' _11ty-output/index.html  # EN links
grep 'href="/vi/"' _11ty-output/vi/index.html  # VI links (after adding vi.json)
```

---

### Step 5.3: Create Footer Template (footer.njk)

**Goal:** Create footer with links

**Prompt for AI CLI:**
```
Create f:/downloader/Project-root/apps/y2matevc/_templates/_includes/footer.njk

Include:
- Copyright text (from base.footer.copyright)
- Footer links: About, Contact, Terms, Privacy
- Use langPrefix for localized URLs

Keep it simple and clean.
```

**Expected Output:**
Simple footer template with localized links.

---

### Step 5.4: Create JSON-LD Template (json-ld.njk)

**Goal:** Create structured data for SEO

**Prompt for AI CLI:**
```
Create f:/downloader/Project-root/apps/y2matevc/_templates/_includes/json-ld.njk

This template generates Schema.org structured data (JSON-LD) for:
1. Organization (for root homepage only)
2. WebSite (for root homepage only)
3. WebPage (for all pages)
4. SoftwareApplication (for all pages)
5. FAQPage (if page has FAQs)
6. HowTo (if page has instructions)

IMPORTANT:
- Use jsonString filter for escaping text in JSON
- Organization and WebSite only appear on root EN homepage (isRootHomePage)
- Other pages just get WebPage + SoftwareApplication + optional FAQ/HowTo
- Email: y2matevc@gmail.com (not y2matepro)

Reference y2matepro's json-ld.njk for exact structure.
```

**Expected Output:**
Complete JSON-LD template with conditional sections.

**⚠️ Important Notes:**
- MUST use `| jsonString | safe` filter for text in JSON-LD
- Organization schema only on root homepage (SEO best practice)
- FAQPage and HowTo schemas boost SEO rankings
- Test JSON-LD with Google's Structured Data Testing Tool

**Validation:**
```bash
npm run 11ty:build
# Check JSON-LD exists
grep "application/ld+json" _11ty-output/index.html
# Should find <script type="application/ld+json">
```

---

### Step 5.5: Create Page Templates

**Goal:** Create templates for all 4 pages

**Prompt for AI CLI:**
```
Create 4 page templates in f:/downloader/Project-root/apps/y2matevc/_templates/pages/:

1. index.njk
2. youtube-to-mp3.njk
3. youtube-to-mp4.njk
4. youtube-short-downloader.njk

Each template should:
1. Use layout: base.njk
2. Set up pagination from respective data file:
   - index.njk uses indexPages
   - youtube-to-mp3.njk uses youtubeToMp3Pages
   - youtube-to-mp4.njk uses youtubeToMp4Pages
   - youtube-short-downloader.njk uses youtubeShortPages
3. Render hero section with form
4. Render format selector (MP4/MP3 toggle + quality selectors)
5. Loop through content.sections
6. Render whyChoose section
7. Render instructions section
8. Render FAQs section (if exists)

IMPORTANT TEMPLATE FEATURES:
- Use {{ base.* }} for shared UI text (buttons, placeholders)
- Use {{ page.* }} for page-specific content
- Use | localizeLinks(langPrefix) filter for internal links
- Use | safe filter for HTML content
- All 4 templates are nearly identical except pagination data source

Front matter structure:
---
layout: base.njk
pagination:
  data: [DATA_SOURCE]  # indexPages, youtubeToMp3Pages, etc.
  size: 1
  alias: pageInfo
eleventyComputed:
  permalink: "{{ pageInfo.permalink }}"
  lang: "{{ pageInfo.lang }}"
  pageKey: "{{ pageInfo.pageKey }}"
---

Reference y2matepro's index.njk for exact template structure.
```

**Expected Output:**
4 page templates with complete structure.

**⚠️ Important Notes:**
- Each template uses a DIFFERENT pagination data source
- The `| localizeLinks(langPrefix)` filter converts `/path` → `/vi/path` for non-EN
- Use `| safe` filter for HTML content (otherwise tags will be escaped)
- Format selector HTML is duplicated in all templates (not a partial - keep it simple)
- FAQs should be conditional: `{%- if page.faqs and page.faqs.items %}`

**Validation:**
```bash
npm run 11ty:build
ls _11ty-output/*.html
# Should show: index.html, youtube-to-mp3.html, youtube-to-mp4.html, youtube-short-downloader.html
```

---

## Phase 6: Integration & Testing

### Step 6.1: Update Vite Config

**Goal:** Make Vite read from 11ty output

**Prompt for AI CLI:**
```
Update f:/downloader/Project-root/apps/y2matevc/vite.config.ts

Modify the rollupOptions.input to detect HTML files from:
1. Root directory (for EN pages from _11ty-output)
2. pages/ directory (for language-specific pages from _11ty-output/pages/)

Add code to auto-detect language pages:
- Read from _11ty-output/pages/{lang}/*.html
- Generate entry points like: { 'vi-index': 'pages/vi/index.html' }

The Vite build should:
1. Read HTML from _11ty-output/ (generated by 11ty)
2. Bundle TypeScript and CSS
3. Output to dist/

Reference y2matepro's approach if they have similar setup.
```

**Expected Output:**
Updated `vite.config.ts` with multi-page detection from 11ty output.

**⚠️ Important Notes:**
- Vite reads from `_11ty-output/`, not from `_templates/`
- Must detect both root pages (EN) and pages/{lang}/ directories
- Entry point names matter: use `{lang}-{page}` format
- Build order: 11ty THEN Vite (sequential, not parallel)

**Validation:**
```bash
npm run build
# Should run: 11ty:build → tsc → vite build
ls dist/
# Should show all HTML files and assets
```

---

### Step 6.2: Test 11ty Build

**Goal:** Verify 11ty generates all pages correctly

**Prompt for AI CLI:**
```
Run the 11ty build and verify output.

Steps:
1. Run: npm run 11ty:build
2. Check _11ty-output/ directory
3. Verify files exist:
   - index.html
   - youtube-to-mp3.html
   - youtube-to-mp4.html
   - youtube-short-downloader.html
4. Check generated HTML contains:
   - SEO meta tags
   - JSON-LD structured data
   - hreflang tags
   - Proper navigation links
   - Content with preserved HTML tags
5. Verify NO window.__i18n__ injection

If build fails, check:
- Are all data files present?
- Is JSON syntax valid?
- Are template paths correct?
```

**Expected Output:**
```
[11ty] Wrote 4 files in 0.5 seconds
```

**⚠️ Important Notes:**
- "Skipping {page}/{lang}" messages are normal when data files missing
- All 4 English pages should generate successfully
- Check for any template errors or missing data warnings
- Validate HTML structure manually

**Validation:**
```bash
cd f:/downloader/Project-root/apps/y2matevc

# Build
npm run 11ty:build

# Count generated files
find _11ty-output -name "*.html" | wc -l
# Should show: 4 (for English only)

# Check for window.__i18n__ (should not exist)
grep -r "window.__i18n__" _11ty-output/
# Should return: (no matches)

# Check HTML tags preserved
grep "<strong>YouTube" _11ty-output/youtube-to-mp3.html
# Should find: <strong>YouTube to MP3</strong>

# Check links preserved
grep '<a href="/youtube-to-mp4">' _11ty-output/youtube-to-mp3.html
# Should find the link
```

---

### Step 6.3: Test Dev Server

**Goal:** Test the site in development mode

**Prompt for AI CLI:**
```
Start the development server and test the site.

Steps:
1. Run: npm run dev
2. Open browser to http://localhost:5173/ (or shown port)
3. Test:
   - All 4 pages load correctly
   - Navigation works
   - Format selector functions
   - All text displays correctly
   - No console errors
   - Links are correct

Known issue: TypeScript will have hard-coded English text (this is expected, same as y2matepro)
```

**Expected Output:**
Dev server running, site fully functional.

**⚠️ Important Notes:**
- Vite dev server serves from source, not from _11ty-output
- In dev mode, you're testing Vite's HMR, not 11ty output
- For full 11ty testing, use production build (`npm run build`)
- TypeScript status messages will be English-only (by design)

---

### Step 6.4: Full Production Build

**Goal:** Test complete build pipeline

**Prompt for AI CLI:**
```
Run the full production build and verify output.

Steps:
1. Clean previous builds: rm -rf _11ty-output dist
2. Run: npm run build
3. Verify build steps executed in order:
   - [1] 11ty build (generates _11ty-output/)
   - [2] TypeScript compilation (tsc)
   - [3] Vite build (generates dist/)
4. Check dist/ directory contains:
   - All HTML files
   - Bundled JS/CSS with hashes
   - Assets copied correctly
5. Serve with: npm run preview
6. Test all pages work correctly

Build should complete without errors.
```

**Expected Output:**
```
✓ 11ty build complete
✓ TypeScript compilation complete
✓ Vite build complete
dist/ generated with all files
```

**⚠️ Important Notes:**
- Build MUST be sequential: 11ty → tsc → Vite
- Each step must complete before next starts (use `&&` in npm script)
- dist/ is the final output for deployment
- _11ty-output/ can be deleted after build (temporary)

**Validation:**
```bash
cd f:/downloader/Project-root/apps/y2matevc

# Full build
npm run build

# Check dist/
ls dist/
# Should show: index.html, youtube-to-mp3.html, youtube-to-mp4.html, youtube-short-downloader.html, assets/

# Serve and test
npm run preview
# Open http://localhost:4173
```

---

## Validation Checklist

After completing all steps, verify:

### ✅ Structure Validation
- [ ] `_templates/_data/i18n/en.json` exists with complete UI text
- [ ] `_templates/_data/pages/*/en.json` exist for all 4 pages
- [ ] `_templates/_includes/*.njk` exist (base, header, footer, json-ld)
- [ ] `_templates/pages/*.njk` exist for all 4 pages
- [ ] `.eleventy.cjs` configuration is correct
- [ ] package.json has 11ty scripts

### ✅ Data Quality Validation
- [ ] All JSON files have valid syntax
- [ ] HTML tags preserved in data (`<strong>`, `<a>`, `<em>`)
- [ ] Cross-page links are correct
- [ ] SEO meta tags within character limits (title: 50-60, description: 150-160)
- [ ] No hard-coded text in templates (all from data files)

### ✅ Build Validation
- [ ] `npm run 11ty:build` succeeds without errors
- [ ] 4 HTML files generated in `_11ty-output/`
- [ ] Generated HTML has proper SEO tags
- [ ] JSON-LD structured data present
- [ ] hreflang tags present
- [ ] NO `window.__i18n__` in generated HTML
- [ ] Links in content have correct format

### ✅ Integration Validation
- [ ] Vite config detects language pages correctly
- [ ] `npm run build` completes successfully
- [ ] dist/ contains all files
- [ ] `npm run preview` works
- [ ] All 4 pages load and function correctly

### ✅ SEO Validation
- [ ] Canonical URLs correct
- [ ] hreflang tags for all languages
- [ ] Open Graph tags present
- [ ] JSON-LD validates (use Google's tool)
- [ ] Meta descriptions within limits

### ✅ Content Validation
- [ ] All content sections rendered
- [ ] FAQs section present
- [ ] Instructions section present
- [ ] Why Choose section present
- [ ] All internal links work
- [ ] HTML formatting preserved (bold, links, etc.)

---

## Common Issues & Solutions

### Issue 1: "workspace: protocol not supported"
**Cause:** Used `npm install` instead of `pnpm`
**Solution:** Always use `pnpm add -D` for this monorepo

### Issue 2: "Cannot find module '.eleventy.cjs'"
**Cause:** File not created or wrong location
**Solution:** Must be in project root: `f:/downloader/Project-root/apps/y2matevc/.eleventy.cjs`

### Issue 3: No pages generated
**Cause:** Missing data files or pagination config error
**Solution:** Check logs for "Skipping" messages, verify data files exist

### Issue 4: HTML tags escaped in output
**Cause:** Missing `| safe` filter in template
**Solution:** Add `| safe` after variables containing HTML: `{{ paragraph | safe }}`

### Issue 5: Links don't work in other languages
**Cause:** Missing `localizeLinks` filter
**Solution:** Use `{{ paragraph | localizeLinks(langPrefix) | safe }}`

### Issue 6: window.__i18n__ appears in HTML
**Cause:** Incorrectly added JavaScript injection
**Solution:** Remove script block - y2matepro pattern doesn't use this

### Issue 7: Build order wrong
**Cause:** Scripts running in parallel
**Solution:** Use `&&` in package.json: `npm run 11ty:build && vite build`

---

## Next Steps After Setup

1. **Test with Vietnamese**: Add `_data/pages/*/vi.json` files
2. **Generate translations**: Use TRANSLATION_BATCH_PROMPTS.md
3. **Add remaining languages**: Create JSON files for all 19 languages
4. **Update TypeScript**: Consider adding runtime i18n if needed (optional)
5. **Deploy**: Test on staging before production

---

## Reference Files

Key files to reference during setup:
- `f:/downloader/Project-root/apps/y2matepro/_templates/ELEVENTY-README.md`
- `f:/downloader/Project-root/apps/y2matepro/.eleventy.cjs`
- `f:/downloader/Project-root/apps/y2matepro/_templates/_includes/base.njk`
- This workflow document: `AI_CLI_SETUP_WORKFLOW.md`

---

## Summary

This workflow guides AI CLI through:
1. ✅ Understanding y2matepro's 11ty implementation
2. ✅ Setting up y2matevc's 11ty structure
3. ✅ Creating data files with HTML preservation
4. ✅ Building templates following proven patterns
5. ✅ Integrating with Vite build system
6. ✅ Testing and validation

**Key Principle:** Follow y2matepro's pattern exactly - no window.__i18n__, pure template rendering, proper HTML preservation.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-23
**Tested With:** @11ty/eleventy v3.1.2, Node.js v18+
