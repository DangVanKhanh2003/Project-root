# Single Comprehensive Prompt for AI CLI - 11ty Setup

Copy và paste prompt dưới đây cho AI CLI để setup toàn bộ hệ thống 11ty cho y2matevc từ đầu đến cuối.

---

## 🎯 PROMPT ĐẦY ĐỦ (Copy toàn bộ phần này)

```
Tôi cần bạn setup hoàn chỉnh hệ thống 11ty template cho project y2matevc bằng cách học hỏi từ y2matepro (project mẫu).

## CÁC BƯỚC THỰC HIỆN:

### BƯỚC 1: NGHIÊN CỨU Y2MATEPRO
Đọc và phân tích các files sau để hiểu pattern:
- f:/downloader/Project-root/apps/y2matepro/_templates/ELEVENTY-README.md
- f:/downloader/Project-root/apps/y2matepro/.eleventy.cjs
- f:/downloader/Project-root/apps/y2matepro/_templates/_includes/base.njk
- f:/downloader/Project-root/apps/y2matepro/_templates/_data/allPages.cjs
- f:/downloader/Project-root/apps/y2matepro/_templates/_data/i18n/en.json
- f:/downloader/Project-root/apps/y2matepro/_templates/_data/pages/index/en.json

### BƯỚC 2: CÀI ĐẶT 11TY
Chạy: pnpm add -D @11ty/eleventy
⚠️ BẮT BUỘC dùng pnpm, KHÔNG dùng npm

### BƯỚC 3: TẠO CẤU TRÚC THƯ MỤC
Tạo cấu trúc sau trong f:/downloader/Project-root/apps/y2matevc:
```
_templates/
├── _data/
│   ├── i18n/
│   ├── pages/
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
```

### BƯỚC 4: CẬP NHẬT PACKAGE.JSON
Thêm vào scripts:
```json
{
  "11ty:build": "eleventy --config=.eleventy.cjs --input=_templates --output=_11ty-output",
  "11ty:watch": "eleventy --config=.eleventy.cjs --input=_templates --output=_11ty-output --watch",
  "build": "npm run 11ty:build && tsc && vite build"
}
```

### BƯỚC 5: TẠO .ELEVENTY.CJS
Copy từ y2matepro's .eleventy.cjs nhưng:
- Đổi site.url: 'https://y2mate.vc'
- Giữ tất cả filters và post-build hooks
⚠️ KHÔNG thêm window.__i18n__ injection (y2matepro không dùng pattern này)

### BƯỚC 6: TẠO .ELEVENTYIGNORE
Nội dung:
```
node_modules
.git
dist
_11ty-output
src
public
```

### BƯỚC 7: CẬP NHẬT .GITIGNORE
Thêm: _11ty-output/

### BƯỚC 8: TẠO I18N BASE DATA
File: _templates/_data/i18n/en.json
Bao gồm TẤT CẢ:
- nav (home, youtubeToMp4, youtubeToMp3, youtubeShorts, language)
- hero (placeholder, pasteLabel, clearLabel, submitButton, termsText, termsLink)
- formatSelector (formats, quality, options với ĐẦY ĐỦ MP4/MP3 quality options)
- status (processing, preparing, merging, zipping, ready, completed, failed)
- buttons (download, tryAgain, cancel, seeMore, seeLess, bulkDownload)
- gallery (title, noItems, selected, selectAll, deselectAll)
- mobile (menuToggleLabel, menuCloseLabel, langButtonLabel)
- footer (copyright, about, contact, terms, privacy)
- errors (invalidUrl, networkError, processingError, timeout, downloadExpired, conversionFailed)
- messages (downloadReady, processing, pleaseWait)

⚠️ GIỮ NGUYÊN format names: MP4, MP3, WEBM, MKV, OGG, OPUS, WAV
⚠️ KHÔNG dịch quality values: 1080p, 720p, 320kbps, etc.

### BƯỚC 9: TẠO PAGINATION GENERATORS
Tạo 5 files .cjs trong _templates/_data/:
- allPages.cjs (master generator cho tất cả pages × languages)
- indexPages.cjs, youtubeToMp3Pages.cjs, youtubeToMp4Pages.cjs, youtubeShortPages.cjs

Config:
- 4 pages: index, youtube-to-mp4, youtube-to-mp3, youtube-short-downloader
- 2 languages cho MVP: en (default), vi
- Permalink: EN → /, others → /{lang}/
⚠️ Log "Skipping" khi thiếu data files

### BƯỚC 10: TẠO PAGE DATA FILES
Extract content từ HTML files hiện có:
- f:/downloader/Project-root/apps/y2matevc/index.html → _templates/_data/pages/index/en.json
- f:/downloader/Project-root/apps/y2matevc/youtube-to-mp3.html → _templates/_data/pages/youtube-to-mp3/en.json
- f:/downloader/Project-root/apps/y2matevc/youtube-to-mp4.html → _templates/_data/pages/youtube-to-mp4/en.json
- f:/downloader/Project-root/apps/y2matevc/youtube-short-downloader.html → _templates/_data/pages/youtube-short-downloader/en.json

Mỗi file có cấu trúc:
```json
{
  "seo": {
    "title": "...",           // 50-60 chars
    "description": "...",     // 150-160 chars
    "ogTitle": "...",
    "ogDescription": "...",
    "schemaName": "...",
    "schemaDescription": "..."
  },
  "hero": { "title": "..." },
  "content": {
    "sections": [
      { "title": "...", "paragraphs": ["...", "..."] }
    ]
  },
  "whyChoose": {
    "title": "...",
    "intro": "...",
    "reasons": ["...", "..."]
  },
  "instructions": {
    "title": "...",
    "steps": ["...", "..."],
    "note": "..."
  },
  "faqs": {
    "title": "...",
    "items": [
      { "question": "...", "answer": "..." }
    ]
  }
}
```

⚠️ CỰC KỲ QUAN TRỌNG - GIỮ NGUYÊN HTML:
- PHẢI giữ nguyên TẤT CẢ HTML tags: <strong>, <a>, <em>
- Ví dụ đúng: "The <strong>YouTube to MP3</strong> page from <a href=\"/\">Y2Mate</a>..."
- KHÔNG strip hay sửa bất kỳ HTML tag nào
- Escape quotes: <a href=\"/path\">
- Cross-page links phải đúng format

### BƯỚC 11: TẠO BASE LAYOUT
File: _templates/_includes/base.njk

Copy structure từ y2matepro's base.njk:
- HTML với SEO meta tags
- hreflang links cho tất cả languages
- Canonical URL
- Open Graph tags
- Include header, footer, json-ld
- Load main.ts via Vite

⚠️ QUAN TRỌNG: KHÔNG inject window.__i18n__ (y2matepro không dùng)

### BƯỚC 12: TẠO HEADER
File: _templates/_includes/header.njk
- Navigation với langPrefix
- Language switcher
- Mobile menu
Tham khảo y2matepro's header.njk

### BƯỚC 13: TẠO FOOTER
File: _templates/_includes/footer.njk
- Simple footer với links từ base.footer

### BƯỚC 14: TẠO JSON-LD
File: _templates/_includes/json-ld.njk
- Organization (root homepage only)
- WebSite (root homepage only)
- WebPage (all pages)
- SoftwareApplication (all pages)
- FAQPage (if faqs exist)
- HowTo (if instructions exist)
⚠️ Email: y2matevc@gmail.com
⚠️ Dùng | jsonString | safe filter

### BƯỚC 15: TẠO PAGE TEMPLATES
4 files trong _templates/pages/:
- index.njk (pagination: indexPages)
- youtube-to-mp3.njk (pagination: youtubeToMp3Pages)
- youtube-to-mp4.njk (pagination: youtubeToMp4Pages)
- youtube-short-downloader.njk (pagination: youtubeShortPages)

Mỗi template render:
- Hero với form
- Format selector (MP4/MP3 toggle + quality)
- Loop content.sections
- whyChoose section
- instructions section
- FAQs section (conditional)

⚠️ Dùng | localizeLinks(langPrefix) cho links
⚠️ Dùng | safe cho HTML content

### BƯỚC 16: CẬP NHẬT VITE CONFIG
File: vite.config.ts
- Auto-detect language pages từ _11ty-output/pages/{lang}/
- Generate entry points cho multi-page build

### BƯỚC 17: TEST BUILD
```bash
npm run 11ty:build
```
Verify:
- 4 HTML files trong _11ty-output/
- SEO tags present
- JSON-LD present
- hreflang tags present
- KHÔNG CÓ window.__i18n__
- HTML tags preserved

### BƯỚC 18: TEST FULL BUILD
```bash
npm run build
```
Verify build pipeline: 11ty → tsc → Vite → dist/

### BƯỚC 19: TEST DEV SERVER
```bash
npm run dev
```
Verify tất cả pages load và function

## VALIDATION CHECKLIST:
- [ ] All 4 EN pages generated
- [ ] HTML tags preserved (<strong>, <a>)
- [ ] SEO meta tags correct
- [ ] JSON-LD present
- [ ] NO window.__i18n__ injection
- [ ] Links work correctly
- [ ] Build completes without errors

## QUAN TRỌNG NHẤT:
1. ⚠️ DÙNG pnpm, KHÔNG dùng npm
2. ⚠️ GIỮ NGUYÊN HTML tags trong data
3. ⚠️ KHÔNG inject window.__i18n__
4. ⚠️ Build tuần tự: 11ty → tsc → Vite
5. ⚠️ Follow y2matepro pattern chính xác

Sau khi hoàn thành, báo cáo kết quả và danh sách files đã tạo.
```

---

## Cách Sử Dụng:

1. **Copy toàn bộ prompt** từ "Tôi cần bạn setup..." đến "...danh sách files đã tạo."
2. **Paste vào AI CLI** (Claude, ChatGPT, etc.)
3. **AI sẽ tự động thực hiện** tất cả các bước
4. **Kiểm tra kết quả** sau khi AI báo hoàn thành

Prompt này được thiết kế để AI có thể tự động:
- ✅ Đọc và học từ y2matepro
- ✅ Tạo tất cả directories và files cần thiết
- ✅ Extract content từ HTML với HTML preservation
- ✅ Setup build pipeline đúng
- ✅ Test và validate

**Lưu ý:** AI có thể cần confirm một số quyết định. Chỉ cần trả lời "yes" hoặc "proceed".
