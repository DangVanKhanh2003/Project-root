# Prompt for AI: Convert HTML to Eleventy Template

Copy prompt bên dưới và gửi cho AI để convert từng file HTML.

---

## PROMPT (Copy toàn bộ phần này)

```
Tôi cần bạn convert 1 HTML file sang Eleventy template với i18n support.

**File cần convert:** [TÊN FILE - ví dụ: youtube-to-mp4.html]

**BƯỚC 1: Đọc file gốc**
Đọc file từ: `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/backup-html-originals/[TÊN FILE]`

**BƯỚC 2: Extract content và thêm vào i18n**

Từ HTML file, extract:
1. SEO metadata (title, description, og:title, og:description, schema name, schema description)
2. Hero title (h1)
3. Content section (main title, intro paragraphs)
4. Instructions section (title + steps array)
5. Why Choose section (title + reasons array)
6. Features section (title + 6 items với title & description)
7. FAQs section (title + Q&A items)

Thêm vào file: `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/_templates/_data/i18n/en.json`

Format:
```json
{
  "seo": {
    "[pageKey]": {
      "title": "...",
      "description": "...",
      "ogTitle": "...",
      "ogDescription": "...",
      "schemaName": "...",
      "schemaDescription": "..."
    }
  },
  "pages": {
    "[pageKey]": {
      "hero": {
        "title": "..."
      },
      "content": {
        "mainTitle": "...",
        "intro1": "...",
        "intro2": "..."
      },
      "instructions": {
        "title": "...",
        "steps": ["...", "...", "..."]
      },
      "whyChoose": {
        "title": "...",
        "reasons": ["...", "...", "..."]
      },
      "features": {
        "title": "...",
        "items": [
          {"title": "...", "description": "..."},
          ...
        ]
      },
      "faqs": {
        "title": "...",
        "items": [
          {"question": "...", "answer": "..."},
          ...
        ]
      }
    }
  }
}
```

**pageKey naming:**
- youtube-to-mp4.html → youtubeToMp4
- youtube-to-mp3.html → youtubeToMp3
- youtube-music-downloader.html → youtubeMusicDownloader
- youtube-short-downloader.html → youtubeShortDownloader
- youtube-to-mp3-320kbps-converter.html → youtubeToMp3320
- youtube-to-wav-converter.html → youtubeToWav
- youtube-to-ogg-converter.html → youtubeToOgg
- youtube-to-opus-converter.html → youtubeToOpus

**BƯỚC 3: Tạo template**

Tạo file: `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/_templates/pages/[TÊN FILE].njk`

Sử dụng cấu trúc từ reference template: `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/_templates/pages/index.njk`

Template structure:
```njk
---
layout: base.njk
permalink: /[filename].html
lang: en
seoKey: [pageKey]
---
{% set page = i18nData.en.pages.[pageKey] %}

<div class="container">
    <!-- Hero section với form - COPY EXACT từ index.njk -->
    <section class="y2mate-download-pro">
        <div class="y2mate-search-form-pro d-flex">
            <div class="form-wrap">
                <h1 class="y2mate_title-pro">{{ page.hero.title }}</h1>
                <!-- Copy toàn bộ form từ index.njk, giữ nguyên 100% -->
            </div>
            <div id="content-area"></div>
        </div>
    </section>

    <!-- Search results section -->
    <section id="search-results-section" class="search-results-section" style="display: none;">
        <div id="search-results-container"></div>
    </section>

    <!-- Content section -->
    <section class="y2mate-content-pro d-flex">
        <div class="col-sm-12">
            <h2>{{ page.content.mainTitle }}</h2>
            <p>{{ page.content.intro1 }}</p>
            {% if page.content.intro2 %}
            <p>{{ page.content.intro2 }}</p>
            {% endif %}
        </div>
    </section>

    <!-- Instructions section -->
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

    <!-- Features section -->
    <section class="y2mate-features-wrap">
        <h2>{{ page.features.title }}</h2>
        <div class="y2mate-features-wrap-pro first">
            {% for feature in page.features.items %}
            <div class="col-sm-4 d-flex">
                <div class="y2mate-features-pro">
                    <!-- Copy SVG icon từ backup HTML, match theo loop.index -->
                    {% if loop.index == 1 %}
                    <!-- SVG từ feature 1 -->
                    {% elif loop.index == 2 %}
                    <!-- SVG từ feature 2 -->
                    {% elif loop.index == 3 %}
                    <!-- SVG từ feature 3 -->
                    {% elif loop.index == 4 %}
                    <!-- SVG từ feature 4 -->
                    {% elif loop.index == 5 %}
                    <!-- SVG từ feature 5 -->
                    {% elif loop.index == 6 %}
                    <!-- SVG từ feature 6 -->
                    {% endif %}
                    <h3>{{ feature.title }}</h3>
                    <p>{{ feature.description }}</p>
                </div>
            </div>
            {% endfor %}
        </div>
    </section>

    <!-- FAQ section -->
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

**QUAN TRỌNG:**
- ❌ KHÔNG thêm JSON-LD scripts (file gốc đã có sẵn)
- ❌ KHÔNG thay đổi CSS classes hoặc IDs
- ❌ KHÔNG thay đổi cấu trúc HTML
- ✅ GIỮ NGUYÊN toàn bộ form structure từ index.njk
- ✅ CHỈ replace text với variables
- ✅ Copy SVG icons từ backup HTML

**BƯỚC 4: Build và verify**

```bash
# Build
npm run 11ty:build

# Check không có empty variables
grep "{{ " _11ty-output/[filename].html

# Verify title
grep "<title>" _11ty-output/[filename].html

# Copy to root
cp _11ty-output/[filename].html ./[filename].html
```

**OUTPUT yêu cầu:**

Sau khi hoàn thành, show cho tôi:
1. ✅ Confirmation đã update `en.json` với pageKey mới
2. ✅ Confirmation đã tạo template file
3. ✅ Build output (có lỗi không?)
4. ✅ Line count của file output
5. ✅ Verification results (title check, empty vars check)

**Reference files để tham khảo:**
- Template mẫu: `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/_templates/pages/index.njk`
- i18n data: `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/_templates/_data/i18n/en.json`
- Guide: `/Users/macos/Documents/work/downloader/Project-root/apps/y2matepro/AI-SIMPLE-GUIDE.md`

Bắt đầu convert ngay!
```

---

## Sử dụng prompt này cho từng file:

### File 1: youtube-to-mp4.html
```
Thay [TÊN FILE] = youtube-to-mp4.html
Thay [pageKey] = youtubeToMp4
```

### File 2: youtube-to-mp3.html
```
Thay [TÊN FILE] = youtube-to-mp3.html
Thay [pageKey] = youtubeToMp3
```

### File 3: youtube-music-downloader.html
```
Thay [TÊN FILE] = youtube-music-downloader.html
Thay [pageKey] = youtubeMusicDownloader
```

### File 4: youtube-short-downloader.html
```
Thay [TÊN FILE] = youtube-short-downloader.html
Thay [pageKey] = youtubeShortDownloader
```

### File 5: youtube-to-mp3-320kbps-converter.html
```
Thay [TÊN FILE] = youtube-to-mp3-320kbps-converter.html
Thay [pageKey] = youtubeToMp3320
```

### File 6: youtube-to-wav-converter.html
```
Thay [TÊN FILE] = youtube-to-wav-converter.html
Thay [pageKey] = youtubeToWav
```

### File 7: youtube-to-ogg-converter.html
```
Thay [TÊN FILE] = youtube-to-ogg-converter.html
Thay [pageKey] = youtubeToOgg
```

### File 8: youtube-to-opus-converter.html
```
Thay [TÊN FILE] = youtube-to-opus-converter.html
Thay [pageKey] = youtubeToOpus
```

---

## Tips:

- Convert từng file một, đừng làm hàng loạt
- Verify kỹ sau mỗi file trước khi chuyển file tiếp theo
- Nếu có lỗi, fix xong mới chuyển file tiếp
- Update `CONVERSION-PROGRESS.md` sau mỗi file

---

## Expected Time:

- Per file: 35-45 minutes
- Total: 4-6 hours for all 8 files
