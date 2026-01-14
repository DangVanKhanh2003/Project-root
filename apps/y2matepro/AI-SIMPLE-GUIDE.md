# AI Guide: Convert HTML to Eleventy Templates (Simplified)

## Mission

Convert 8 converter pages từ HTML sang Eleventy templates với i18n support.

## Files to Convert

```
✅ index.html                           (DONE - use as reference)
⏳ youtube-to-mp4.html
⏳ youtube-to-mp3.html
⏳ youtube-music-downloader.html
⏳ youtube-short-downloader.html
⏳ youtube-to-mp3-320kbps-converter.html
⏳ youtube-to-wav-converter.html
⏳ youtube-to-ogg-converter.html
⏳ youtube-to-opus-converter.html
```

**Excluded:** 404.html, about-us.html, contact.html, privacy-policy.html, terms-condition.html

---

## 4-Step Process (Per Page)

### Step 1: Read Original HTML

```bash
Read from: backup-html-originals/{filename}.html
```

**Extract these items:**
- `<title>` content
- `<meta name="description">` content
- `<meta property="og:title">` content
- `<meta property="og:description">` content
- Schema.org name (in `<meta itemprop="name">`)
- Schema.org description (in `<meta itemprop="description">`)
- Main `<h1>` (hero title)
- Intro paragraphs (2-3 paragraphs after hero)
- Instructions section (3 steps usually)
- Why Choose section (5 reasons usually)
- Features section (6 items with title + description)
- FAQs section (8-10 Q&A pairs)

---

### Step 2: Add to i18n Data

File: `_templates/_data/i18n/en.json`

**Add new sections:**

```json
{
  "seo": {
    "homepage": { ... },  // Already exists
    "{pageKey}": {        // ADD THIS - pageKey = camelCase of filename
      "title": "From <title>",
      "description": "From meta description",
      "ogTitle": "From og:title",
      "ogDescription": "From og:description",
      "schemaName": "From schema name",
      "schemaDescription": "From schema description"
    }
  },

  "pages": {
    "{pageKey}": {        // ADD THIS
      "hero": {
        "title": "From <h1>"
      },
      "content": {
        "mainTitle": "From first <h2>",
        "intro1": "First paragraph",
        "intro2": "Second paragraph (if exists)"
      },
      "instructions": {
        "title": "How to use... (from HTML)",
        "steps": [
          "Step 1 text",
          "Step 2 text",
          "Step 3 text"
        ]
      },
      "whyChoose": {
        "title": "Why choose... (from HTML)",
        "reasons": [
          "Reason 1",
          "Reason 2",
          "Reason 3",
          "Reason 4",
          "Reason 5"
        ]
      },
      "features": {
        "title": "Key Features (from HTML)",
        "items": [
          {
            "title": "Feature 1 title",
            "description": "Feature 1 description"
          },
          {
            "title": "Feature 2 title",
            "description": "Feature 2 description"
          }
          // ... total 6 items
        ]
      },
      "faqs": {
        "title": "FAQs (from HTML)",
        "items": [
          {
            "question": "Question 1?",
            "answer": "Answer 1"
          },
          {
            "question": "Question 2?",
            "answer": "Answer 2"
          }
          // ... total 8-10 items
        ]
      }
    }
  }
}
```

**pageKey naming examples:**
- `youtube-to-mp4.html` → `youtubeToMp4`
- `youtube-to-mp3.html` → `youtubeToMp3`
- `youtube-music-downloader.html` → `youtubeMusicDownloader`
- `youtube-short-downloader.html` → `youtubeShortDownloader`
- `youtube-to-mp3-320kbps-converter.html` → `youtubeToMp3320`
- `youtube-to-wav-converter.html` → `youtubeToWav`
- `youtube-to-ogg-converter.html` → `youtubeToOgg`
- `youtube-to-opus-converter.html` → `youtubeToOpus`

---

### Step 3: Create Template

File: `_templates/pages/{filename}.njk`

**Template structure:**

```njk
---
layout: base.njk
permalink: /{filename}.html
lang: en
seoKey: {pageKey}
---
{% set page = i18nData.en.pages.{pageKey} %}

<div class="container">
    <!-- Hero Section with Form -->
    <section class="y2mate-download-pro">
        <div class="y2mate-search-form-pro d-flex">
            <div class="form-wrap">
                <h1 class="y2mate_title-pro">{{ page.hero.title }}</h1>

                <!-- COPY ENTIRE FORM FROM backup-html-originals/{filename}.html -->
                <!-- Keep form structure EXACTLY as original -->
                <!-- Only replace terms text with i18n variables -->
                <form id="downloadForm" class="search_form" method="POST" action="/search/">
                    <div class="input-container">
                        <div class=" input-wrapper">
                            <input id="videoUrl" class="y2mate_query-pro keyword" type="text" name="q"
                                placeholder="{{ i18nData.en.hero.placeholder }}" autocomplete="off" autofocus="">
                            <button id="input-action-button" type="button" class="input-action-btn" data-action="paste"
                                aria-label="{{ i18nData.en.hero.pasteLabel }}">
                                <!-- Paste icon SVG -->
                                <svg class="paste-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                                    viewBox="0 0 24 24">
                                    <path fill="currentColor"
                                        d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 16H5V5h2v3h10V5h2v14z" />
                                </svg>
                                <!-- Clear icon SVG -->
                                <svg class="clear-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                                    viewBox="0 0 24 24">
                                    <path fill="currentColor"
                                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <button id="submit" type="submit" name="form_submit" class="submit-btn" aria-label="Search">
                        <div class="converter-btn">{{ i18nData.en.hero.submitButton }}</div>
                        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
                            width="14px" height="14px" fill="#fff" id="Layer_1"
                            style="enable-background:new 0 0 16 16;" version="1.1" viewBox="0 0 16 16"
                            xml:space="preserve">
                            <path
                                d="M15.375,7L10,2.54C9.695,2.287,9.461,2,9,2C8.375,2,8,2.516,8,3v3H1C0.45,6,0,6.45,0,7v2c0,0.55,0.45,1,1,1h7v3  c0,0.484,0.375,1,1,1c0.461,0,0.695-0.287,1-0.54L15.375,9C15.758,8.688,16,8.445,16,8S15.758,7.313,15.375,7z">
                            </path>
                        </svg>
                    </button>
                    <div id="suggestion-container" class="suggesstion-list suggesstion-box"></div>
                    <p class="y2mate-terms-pro">
                        {{ i18nData.en.hero.termsText }} <a href="terms-condition">{{ i18nData.en.hero.termsLink }}</a>.
                    </p>
                </form>
                <div class="spinner" style="display: none;">
                    <img id="loading_img" src="/loading.gif">
                </div>
            </div>

            <!-- Video Detail Area -->
            <div id="content-area"></div>
        </div>
    </section>

    <!-- Search Results Section -->
    <section id="search-results-section" class="search-results-section" style="display: none;">
            <div id="search-results-container"></div>
    </section>

    <!-- Content Section -->
    <section class="y2mate-content-pro d-flex">
        <div class="col-sm-12">
            <h2>{{ page.content.mainTitle }}</h2>
            <p>{{ page.content.intro1 }}</p>
            {% if page.content.intro2 %}
            <p>{{ page.content.intro2 }}</p>
            {% endif %}
        </div>
    </section>

    <!-- Instructions & Why Choose -->
    <section class="y2mate-instruction-pro">
        <div class="y2mate-in-ad-pro">
            <h3>{{ page.instructions.title }}</h3>
            <ol>
                {% for step in page.instructions.steps %}
                <li>{{ step }}</li>
                {% endfor %}
            </ol>
        </div>
        <div class="y2mate-in-ad-pro">
            <h3>{{ page.whyChoose.title }}</h3>
            <ul>
                {% for reason in page.whyChoose.reasons %}
                <li>{{ reason }}</li>
                {% endfor %}
            </ul>
        </div>
    </section>

    <!-- Features Section -->
    <section class="y2mate-features-wrap">
        <h2>{{ page.features.title }}</h2>
        <div class="y2mate-features-wrap-pro first">
            {% for feature in page.features.items %}
            <div class="col-sm-4 d-flex">
                <div class="y2mate-features-pro">
                    <!-- COPY SVG from original HTML based on loop.index -->
                    {% if loop.index == 1 %}
                    <!-- Copy first feature's SVG from original -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor"
                        class="bi bi-infinity" viewBox="0 0 16 16">
                        <path d="...copy path from original..." />
                    </svg>
                    {% elif loop.index == 2 %}
                    <!-- Copy second feature's SVG from original -->
                    <svg>...</svg>
                    {% elif loop.index == 3 %}
                    <!-- Copy third feature's SVG from original -->
                    <svg>...</svg>
                    {% elif loop.index == 4 %}
                    <!-- Copy fourth feature's SVG from original -->
                    <svg>...</svg>
                    {% elif loop.index == 5 %}
                    <!-- Copy fifth feature's SVG from original -->
                    <svg>...</svg>
                    {% elif loop.index == 6 %}
                    <!-- Copy sixth feature's SVG from original -->
                    <svg>...</svg>
                    {% endif %}
                    <h3>{{ feature.title }}</h3>
                    <p>{{ feature.description }}</p>
                </div>
            </div>
            {% endfor %}
        </div>
    </section>

    <!-- FAQ Section -->
    <section class="yt-content">
        <h2>{{ page.faqs.title }}</h2>
        <div class="download-uses">
            <p></p>
            <div class="guide-data">
                {% for faq in page.faqs.items %}
                <h3>{{ faq.question }}</h3>
                <p>{{ faq.answer }}</p>
                {% endfor %}
            </div>
        </div>
    </section>

</div>
```

**IMPORTANT NOTES:**

1. **NO Schema.org JSON-LD** - Don't add any `<script type="application/ld+json">` blocks. Original HTML files already have them and they will be preserved.

2. **Form is IDENTICAL across all converter pages** - Only hero title changes

3. **SVG icons** - Copy from original HTML, match by loop.index position

4. **CSS classes** - Keep EXACTLY as original, don't change

5. **Front matter** - Must have: `layout`, `permalink`, `lang`, `seoKey`

---

### Step 4: Build & Verify

```bash
# 1. Build
npm run 11ty:build

# 2. Check for empty variables (should return nothing)
grep "{{ " _11ty-output/{filename}.html

# 3. Verify content
head -100 _11ty-output/{filename}.html

# 4. Check title populated
grep "<title>" _11ty-output/{filename}.html

# 5. Copy to root
cp _11ty-output/{filename}.html ./{filename}.html

# 6. Done!
```

---

## Checklist (Per Page)

- [ ] Read `backup-html-originals/{filename}.html`
- [ ] Extract SEO metadata (title, description, og:*, schema)
- [ ] Extract content (hero, intro, instructions, why choose)
- [ ] Extract features (6 items with title + description)
- [ ] Extract FAQs (8-10 Q&A pairs)
- [ ] Add to `_templates/_data/i18n/en.json`:
  - [ ] `seo.{pageKey}` section
  - [ ] `pages.{pageKey}` section
- [ ] Create `_templates/pages/{filename}.njk`
- [ ] Set correct front matter (permalink, lang, seoKey)
- [ ] Copy form from original (keep exact structure)
- [ ] Copy SVG icons (match by position)
- [ ] Use loops for features & FAQs
- [ ] Build: `npm run 11ty:build`
- [ ] Verify: no `{{` in output
- [ ] Verify: title tag has content
- [ ] Copy to root folder

---

## Common Mistakes to Avoid

❌ **DON'T:**
- Add JSON-LD scripts (they're already in original HTML)
- Modify CSS classes or IDs
- Change HTML structure
- Hardcode text (use i18n variables)

✅ **DO:**
- Keep form structure exactly as original
- Use loops for repeated content
- Validate JSON before building
- Copy SVG icons from original HTML

---

## Reference Files

- **Example:** `_templates/pages/index.njk` (already converted)
- **i18n data:** `_templates/_data/i18n/en.json`
- **Originals:** `backup-html-originals/*.html`

---

## Time Estimate

- Per page: 35-45 minutes
- All 8 pages: 4-6 hours

---

**Start with `youtube-to-mp4.html` as it's most similar to `index.html`!**
