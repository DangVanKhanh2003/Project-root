# Eleventy Setup Guide - AI Quick Reference

> **Mục đích**: Hướng dẫn ngắn gọn để AI có thể thực hiện ngay các tác vụ 11ty.

---

## 1. THÊM PAGE MỚI (Copy-Paste Ready)

### Step 1: Tạo Data Folder

```bash
# Tạo folder cho page mới
mkdir _templates/_data/pages/{page-key}
```

### Step 2: Tạo 19 Language Files

**Danh sách files cần tạo:**
```
en.json, ar.json, bn.json, de.json, es.json, fr.json, hi.json,
id.json, it.json, ja.json, ko.json, ms.json, my.json, pt.json,
ru.json, th.json, tr.json, ur.json, vi.json
```

**Template JSON** (copy và dịch cho mỗi ngôn ngữ):
```json
{
  "seo": {
    "title": "[Page Title] - Y2Mate",
    "description": "[150-160 chars meta description]",
    "ogTitle": "[OG Title for social]",
    "ogDescription": "[OG Description]",
    "schemaName": "[Schema.org name]",
    "schemaDescription": "[Schema.org description for JSON-LD]"
  },
  "hero": {
    "title": "[H1 Title - main heading]"
  },
  "content": {
    "mainTitle": "[Section heading]",
    "intro1": "[First paragraph - explain what tool does]",
    "intro2": "[Second paragraph - benefits/features overview]"
  },
  "instructions": {
    "title": "How to [action]",
    "steps": [
      "<strong>Step 1:</strong> [Action description]",
      "<strong>Step 2:</strong> [Action description]",
      "<strong>Step 3:</strong> [Action description]",
      "<strong>Step 4:</strong> [Action description]"
    ]
  },
  "whyChoose": {
    "title": "Why Use [Tool Name]",
    "reasons": [
      "<strong>[Benefit 1]:</strong> [Description]",
      "<strong>[Benefit 2]:</strong> [Description]",
      "<strong>[Benefit 3]:</strong> [Description]"
    ]
  },
  "features": {
    "title": "[Tool] Features",
    "items": [
      { "title": "[Feature 1]", "description": "[Description]" },
      { "title": "[Feature 2]", "description": "[Description]" },
      { "title": "[Feature 3]", "description": "[Description]" },
      { "title": "[Feature 4]", "description": "[Description]" },
      { "title": "[Feature 5]", "description": "[Description]" },
      { "title": "[Feature 6]", "description": "[Description]" }
    ]
  },
  "faqs": {
    "title": "Frequently Asked Questions",
    "items": [
      { "question": "[Question 1]?", "answer": "[Answer 1]" },
      { "question": "[Question 2]?", "answer": "[Answer 2]" },
      { "question": "[Question 3]?", "answer": "[Answer 3]" }
    ]
  }
}
```

### Step 3: Update allPages.cjs

**File**: `_templates/_data/allPages.cjs`

Tìm `pageConfigs` array và thêm entry mới:
```javascript
const pageConfigs = [
  { pageKey: 'index', slug: '' },
  { pageKey: 'youtube-to-mp4', slug: 'youtube-to-mp4' },
  { pageKey: 'youtube-to-mp3', slug: 'youtube-to-mp3' },
  { pageKey: 'youtube-short-downloader', slug: 'youtube-short-downloader' },
  // ↓ THÊM DÒNG NÀY ↓
  { pageKey: 'new-page-key', slug: 'new-page-url-slug' }
];
```

### Step 4: Tạo Filter File

**File**: `_templates/_data/{camelCasePageKey}Pages.cjs`

```javascript
const allPages = require('./allPages.cjs');

/**
 * Filter allPages to only return {page-key} variants
 */
module.exports = function() {
  const pages = allPages();
  return pages.filter(p => p.pageKey === 'page-key');
};
```

**Ví dụ naming:**
- `youtube-to-mp4` → `youtubeToMp4Pages.cjs`
- `youtube-short-downloader` → `youtubeShortPages.cjs`
- `tiktok-downloader` → `tiktokDownloaderPages.cjs`

### Step 5: Tạo Template File

**File**: `_templates/pages/{page-key}.njk`

```nunjucks
---
layout: base.njk
pagination:
  data: camelCasePageKeyPages
  size: 1
  alias: pageInfo
eleventyComputed:
  permalink: "{{ pageInfo.permalink }}"
  lang: "{{ pageInfo.lang }}"
  pageKey: "{{ pageInfo.pageKey }}"
---
{%- set base = i18nBase[lang] or i18nBase['en'] -%}
{%- set page = i18nPages[pageKey][lang] or i18nPages[pageKey].en -%}
{%- set seo = page.seo -%}
{%- set pageData = page -%}
<div class="container">
    <section class="y2mate-download-pro">
        <div class="y2mate-search-form-pro d-flex">
            <div class="form-wrap">
                <h1 class="y2mate_title-pro">{{ page.hero.title }}</h1>
                <form id="downloadForm" class="search_form" method="POST" action="/search/">
                    <div class="input-container">
                        <div class="input-wrapper">
                            <input id="videoUrl" class="y2mate_query-pro keyword" type="text" name="q"
                                placeholder="{{ base.hero.placeholder }}" autocomplete="off" autofocus=""
                                role="combobox" aria-autocomplete="list" aria-controls="suggestion-container" aria-expanded="false">
                            <button id="input-action-button" type="button" class="input-action-btn" data-action="paste"
                                aria-label="{{ base.hero.pasteLabel }}">
                                <svg class="paste-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 16H5V5h2v3h10V5h2v14z"/>
                                </svg>
                                <svg class="clear-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <button id="submit" type="submit" name="form_submit" class="submit-btn" aria-label="Search">
                        <div class="converter-btn">{{ base.hero.submitButton }}</div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14px" height="14px" fill="#fff" viewBox="0 0 16 16">
                            <path d="M15.375,7L10,2.54C9.695,2.287,9.461,2,9,2C8.375,2,8,2.516,8,3v3H1C0.45,6,0,6.45,0,7v2c0,0.55,0.45,1,1,1h7v3c0,0.484,0.375,1,1,1c0.461,0,0.695-0.287,1-0.54L15.375,9C15.758,8.688,16,8.445,16,8S15.758,7.313,15.375,7z"/>
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    </section>

    <!-- Content Section -->
    <section class="about-section">
        <div class="about-content">
            <h2 class="section-title">{{ page.content.mainTitle }}</h2>
            <p>{{ page.content.intro1 }}</p>
            <p>{{ page.content.intro2 }}</p>
        </div>
    </section>

    <!-- Instructions Section -->
    {%- if page.instructions and page.instructions.steps %}
    <section class="instructions-section">
        <h2 class="section-title">{{ page.instructions.title }}</h2>
        <ol class="instruction-steps">
            {%- for step in page.instructions.steps %}
            <li>{{ step | safe }}</li>
            {%- endfor %}
        </ol>
    </section>
    {%- endif %}

    <!-- Why Choose Section -->
    {%- if page.whyChoose and page.whyChoose.reasons %}
    <section class="why-choose-section">
        <h2 class="section-title">{{ page.whyChoose.title }}</h2>
        <ul class="reasons-list">
            {%- for reason in page.whyChoose.reasons %}
            <li>{{ reason | safe }}</li>
            {%- endfor %}
        </ul>
    </section>
    {%- endif %}

    <!-- Features Section -->
    {%- if page.features and page.features.items %}
    <section class="features-section">
        <h2 class="section-title">{{ page.features.title }}</h2>
        <div class="row">
            {%- for feature in page.features.items %}
            <div class="col-sm-4">
                <div class="feature-box">
                    <h3>{{ feature.title }}</h3>
                    <p>{{ feature.description }}</p>
                </div>
            </div>
            {%- endfor %}
        </div>
    </section>
    {%- endif %}

    <!-- FAQ Section -->
    {%- if page.faqs and page.faqs.items %}
    <section class="faq-section">
        <h2 class="section-title">{{ page.faqs.title }}</h2>
        <div class="faq-list">
            {%- for faq in page.faqs.items %}
            <div class="faq-item">
                <h3 class="faq-question">{{ faq.question }}</h3>
                <p class="faq-answer">{{ faq.answer }}</p>
            </div>
            {%- endfor %}
        </div>
    </section>
    {%- endif %}
</div>
```

### Step 6: Build & Verify

```bash
# Build
npm run 11ty:build

# Verify files created
ls -la _11ty-output/*.html
ls -la _11ty-output/vi/*.html

# Check for errors (should return nothing)
grep "{{ " _11ty-output/{page-slug}.html
grep "{%" _11ty-output/{page-slug}.html
```

---

## 2. THÊM NGÔN NGỮ MỚI

### Step 1: Update allPages.cjs

Thêm vào array `languages`:
```javascript
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
```

### Step 2: Tạo Base i18n File

**File**: `_templates/_data/i18n/{lang-code}.json`

```json
{
  "nav": {
    "home": "[Home in new language]",
    "youtubeToMp4": "[YouTube to MP4]",
    "youtubeToMp3": "[YouTube to MP3]",
    "youtubeShorts": "[YouTube Shorts]"
  },
  "hero": {
    "placeholder": "[Paste link here...]",
    "submitButton": "[Start]",
    "pasteLabel": "[Paste]",
    "clearLabel": "[Clear]"
  },
  "footer": {
    "copyright": "© 2025 Y2Mate",
    "about": "[About]",
    "contact": "[Contact]",
    "terms": "[Terms]",
    "privacy": "[Privacy]"
  }
}
```

### Step 3: Tạo Page Data Files

Tạo `{lang-code}.json` trong mỗi folder:
- `_templates/_data/pages/index/{lang-code}.json`
- `_templates/_data/pages/youtube-to-mp4/{lang-code}.json`
- `_templates/_data/pages/youtube-to-mp3/{lang-code}.json`
- `_templates/_data/pages/youtube-short-downloader/{lang-code}.json`

---

## 3. SỬA CONTENT HIỆN TẠI

### Sửa Text Chung (nav, footer, hero)
**File**: `_templates/_data/i18n/{lang}.json`

### Sửa Content Page Cụ Thể
**File**: `_templates/_data/pages/{page-key}/{lang}.json`

### Sửa Layout/HTML Structure
**File**: `_templates/_includes/base.njk`

### Sửa Header/Footer
**Files**:
- `_templates/_includes/header.njk`
- `_templates/_includes/footer.njk`

### Sửa JSON-LD Schema
**File**: `_templates/_includes/json-ld.njk`

---

## 4. QUICK COMMANDS

```bash
# Build tất cả
npm run 11ty:build

# Watch mode (auto rebuild)
npm run 11ty:watch

# Full build (11ty + TS + Vite)
npm run build

# Xem output
cat _11ty-output/index.html | head -50

# Kiểm tra lỗi render
grep -r "{{ " _11ty-output/
grep -r "{%" _11ty-output/
```

---

## 5. TROUBLESHOOTING

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| `{{ variable }}` hiển thị raw | Thiếu data file hoặc sai path | Kiểm tra `pageKey` khớp với folder name |
| Duplicate permalink error | 2 pages cùng URL | Mỗi page cần filter file riêng |
| Empty lines đầu file | Nunjucks tags | Dùng `{%-` và `-%}` |
| Page không generate | Thiếu trong pageConfigs | Thêm vào `allPages.cjs` |
| Sai language content | Fallback về EN | Kiểm tra file `{lang}.json` tồn tại |

---

## 6. CHECKLIST TRƯỚC KHI COMMIT

- [ ] Tất cả 19 language files đã tạo
- [ ] `allPages.cjs` đã update pageConfigs
- [ ] Filter file `{name}Pages.cjs` đã tạo
- [ ] Template `.njk` đã tạo
- [ ] `npm run 11ty:build` chạy không lỗi
- [ ] Không có `{{ }}` raw trong output
- [ ] JSON-LD validate OK (dùng Google Rich Results Test)
