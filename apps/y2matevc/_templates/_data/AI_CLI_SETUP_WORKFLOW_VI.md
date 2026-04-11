# Quy Trình Setup 11ty cho y2matevc - Hướng Dẫn Cho AI CLI

Tài liệu này cung cấp quy trình từng bước chi tiết để AI CLI setup hệ thống 11ty template cho y2matevc bằng cách nghiên cứu project mẫu y2matepro.

---

## 📋 Mục Lục

1. [Yêu Cầu Trước Khi Bắt Đầu](#yêu-cầu-trước-khi-bắt-đầu)
2. [Giai Đoạn 1: Nghiên Cứu & Học Hỏi](#giai-đoạn-1-nghiên-cứu--học-hỏi)
3. [Giai Đoạn 2: Setup & Cài Đặt](#giai-đoạn-2-setup--cài-đặt)
4. [Giai Đoạn 3: Cấu Hình](#giai-đoạn-3-cấu-hình)
5. [Giai Đoạn 4: Cấu Trúc Dữ Liệu](#giai-đoạn-4-cấu-trúc-dữ-liệu)
6. [Giai Đoạn 5: Templates](#giai-đoạn-5-templates)
7. [Giai Đoạn 6: Tích Hợp & Testing](#giai-đoạn-6-tích-hợp--testing)
8. [Checklist Kiểm Tra](#checklist-kiểm-tra)

---

## Yêu Cầu Trước Khi Bắt Đầu

Trước khi bắt đầu, đảm bảo:
- ✅ Có quyền truy cập cả 2 projects: `y2matepro` (mẫu) và `y2matevc` (target)
- ✅ Đã cài Node.js và pnpm
- ✅ Hiểu cấu trúc hiện tại của y2matevc

---

## Giai Đoạn 1: Nghiên Cứu & Học Hỏi

### Bước 1.1: Nghiên Cứu Cách y2matepro Implement 11ty

**Mục tiêu:** Hiểu cách y2matepro implement hệ thống 11ty templates

**Prompt cho AI CLI:**
```
Tôi cần bạn nghiên cứu cách y2matepro implement hệ thống 11ty template.

Hãy đọc và phân tích các files theo thứ tự:

1. f:/downloader/Project-root/apps/y2matepro/_templates/ELEVENTY-README.md
2. f:/downloader/Project-root/apps/y2matepro/.eleventy.cjs
3. f:/downloader/Project-root/apps/y2matepro/_templates/_includes/base.njk
4. f:/downloader/Project-root/apps/y2matepro/_templates/_data/allPages.cjs
5. f:/downloader/Project-root/apps/y2matepro/_templates/_data/i18n/en.json
6. f:/downloader/Project-root/apps/y2matepro/_templates/_data/pages/index/en.json

Sau khi đọc, hãy tóm tắt:
- Cách hệ thống i18n 2 tầng hoạt động (base i18n + page-specific data)
- Cách pagination tạo ra các pages đa ngôn ngữ
- Cách templates inject data vào HTML
- Pattern cấu trúc thư mục
```

**Kết quả mong đợi:**
AI nên tóm tắt được:
- Base i18n cho UI text chung (nav, buttons, errors)
- Page-specific data cho SEO và content
- Pattern pagination để generate pages cho mỗi ngôn ngữ
- Cấu trúc template inheritance

**⚠️ Lưu Ý Quan Trọng:**
- Project mẫu (y2matepro) KHÔNG inject `window.__i18n__` cho TypeScript
- Y2matepro dùng pure template rendering - TypeScript có hard-coded text
- Hỗ trợ đa ngôn ngữ CHỈ cho SEO content, KHÔNG phải dynamic UI

**Kiểm tra:**
```bash
# AI phải giải thích được:
- i18nBase vs i18nPages khác nhau như thế nào?
- allPages.cjs generate page variants ra sao?
- Có những filters nào? (stripHtml, localizeLinks, jsonString)
```

---

### Bước 1.2: Phân Tích Cấu Trúc Hiện Tại của y2matevc

**Mục tiêu:** Hiểu cấu trúc HTML hiện tại của y2matevc

**Prompt cho AI CLI:**
```
Tôi cần bạn phân tích cấu trúc project y2matevc hiện tại.

Hãy đọc các files:
1. f:/downloader/Project-root/apps/y2matevc/index.html
2. f:/downloader/Project-root/apps/y2matevc/youtube-to-mp3.html
3. f:/downloader/Project-root/apps/y2matevc/youtube-to-mp4.html
4. f:/downloader/Project-root/apps/y2matevc/youtube-short-downloader.html
5. f:/downloader/Project-root/apps/y2matevc/package.json
6. f:/downloader/Project-root/apps/y2matevc/vite.config.ts

Xác định:
- Cấu trúc pages hiện tại (bao nhiêu pages, nội dung gì)
- Text hard-coded cần move sang data files
- Cấu trúc SEO meta tags
- Content sections và cách tổ chức
- Build pipeline hiện tại (cách dùng Vite)
```

**Kết quả mong đợi:**
AI phải xác định được:
- 4 pages với mục đích cụ thể (index, mp3, mp4, shorts)
- SEO meta tags hard-coded
- Content sections với titles và paragraphs
- FAQ sections
- Build hiện tại chỉ có Vite (chưa có 11ty)

**⚠️ Lưu Ý Quan Trọng:**
- TẤT CẢ HTML tags (`<strong>`, `<a>`, `<em>`) phải được GIỮ NGUYÊN khi extract data
- Links giữa các pages phải giữ đúng paths
- SEO meta tags có giới hạn ký tự (title: 50-60, description: 150-160)

**Kiểm tra:**
```bash
# AI phải liệt kê được:
- 4 pages (index, youtube-to-mp3, youtube-to-mp4, youtube-short-downloader)
- Sections mỗi page (What Is..., How To..., FAQs, etc.)
- Cross-page links cần localization
```

---

## Giai Đoạn 2: Setup & Cài Đặt

### Bước 2.1: Cài Đặt 11ty

**Mục tiêu:** Thêm 11ty vào project

**Prompt cho AI CLI:**
```
Cài đặt @11ty/eleventy làm dev dependency cho project y2matevc.

QUAN TRỌNG: Project này dùng pnpm, KHÔNG phải npm. Phải dùng đúng package manager.

Chạy: pnpm add -D @11ty/eleventy

Sau khi cài, verify version phải là 3.x hoặc cao hơn.
```

**Kết quả mong đợi:**
```
✓ @11ty/eleventy@3.1.2 đã được cài đặt
```

**⚠️ Lưu Ý Quan Trọng:**
- KHÔNG dùng `npm install` - sẽ lỗi "workspace: protocol not supported"
- BẮT BUỘC dùng `pnpm add -D @11ty/eleventy`
- Version phải là 3.x (tương thích ESM)

**Kiểm tra:**
```bash
cd f:/downloader/Project-root/apps/y2matevc
pnpm list @11ty/eleventy
# Phải hiện: @11ty/eleventy 3.1.2 (hoặc cao hơn)
```

---

### Bước 2.2: Tạo Cấu Trúc Thư Mục

**Mục tiêu:** Setup thư mục cho 11ty

**Prompt cho AI CLI:**
```
Tạo cấu trúc thư mục sau trong f:/downloader/Project-root/apps/y2matevc:

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

Chỉ tạo thư mục thôi, chưa tạo files.
```

**Kết quả mong đợi:**
Tất cả thư mục đã được tạo thành công.

**⚠️ Lưu Ý Quan Trọng:**
- Phải đặt tên đúng: `_templates` (có underscore), không phải `templates`
- `_data` và `_includes` phải có underscore ở đầu (quy ước 11ty)
- `pages` subdirectory (không có underscore) chứa template files

**Kiểm tra:**
```bash
cd f:/downloader/Project-root/apps/y2matevc
ls -la _templates/
# Phải hiện: _data/, _includes/, pages/
```

---

### Bước 2.3: Cập Nhật package.json Scripts

**Mục tiêu:** Thêm build scripts cho 11ty

**Prompt cho AI CLI:**
```
Cập nhật scripts trong f:/downloader/Project-root/apps/y2matevc/package.json.

Thêm các scripts:
- "11ty:build": "eleventy --config=.eleventy.cjs --input=_templates --output=_11ty-output"
- "11ty:watch": "eleventy --config=.eleventy.cjs --input=_templates --output=_11ty-output --watch"
- Sửa "build" thành: "npm run 11ty:build && tsc && vite build"

QUAN TRỌNG: Build pipeline chạy tuần tự: 11ty trước, sau đó Vite.
```

**Kết quả mong đợi:**
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

**⚠️ Lưu Ý Quan Trọng:**
- Thứ tự build rất quan trọng: 11ty → TypeScript → Vite
- Output directory là `_11ty-output` (tạm thời, nên thêm vào gitignore)
- Config file là `.eleventy.cjs` (CommonJS, không phải ESM)

**Kiểm tra:**
```bash
cd f:/downloader/Project-root/apps/y2matevc
npm run 11ty:build
# Sẽ báo lỗi (bình thường - chưa có config file)
```

---

## Giai Đoạn 3: Cấu Hình

### Bước 3.1: Tạo .eleventy.cjs

**Mục tiêu:** Cấu hình 11ty với data loading và filters

**Prompt cho AI CLI:**
```
Tạo f:/downloader/Project-root/apps/y2matevc/.eleventy.cjs

Copy cấu hình từ y2matepro's .eleventy.cjs, nhưng thay đổi:
1. Đổi site.url từ 'https://y2matepro.com' thành 'https://y2mate.vc'
2. Giữ nguyên tất cả filters: stripHtml, jsonString, localizeLinks, dump, getAlternateUrl
3. Giữ post-build hook để copy files
4. Load i18n data từ _data/i18n/*.json
5. Load page data từ _data/pages/{pageKey}/*.json

QUAN TRỌNG:
- Đây là file .cjs (CommonJS), dùng module.exports
- Phải có post-build hook copy EN files vào root, các ngôn ngữ khác vào pages/{lang}/
```

**Kết quả mong đợi:**
File `.eleventy.cjs` được tạo với:
- Site config có URL đúng
- Data loading cho i18nBase và i18nPages
- Tất cả filters được implement
- Post-build hook copy files

**⚠️ Lưu Ý Quan Trọng:**
- BẮT BUỘC dùng CommonJS syntax (`module.exports`), không phải ESM
- `site.url` phải khớp domain (y2mate.vc)
- Filters rất quan trọng cho rendering (đặc biệt `localizeLinks` và `jsonString`)
- Post-build hook tạo cấu trúc thư mục theo ngôn ngữ

**Kiểm tra:**
```bash
cd f:/downloader/Project-root/apps/y2matevc
node -e "console.log(require('./.eleventy.cjs'))"
# Không được báo lỗi
```

---

### Bước 3.2: Tạo .eleventyignore

**Mục tiêu:** Cấu hình files cần ignore

**Prompt cho AI CLI:**
```
Tạo f:/downloader/Project-root/apps/y2matevc/.eleventyignore

Thêm các patterns:
node_modules
.git
dist
_11ty-output
src
public
```

**Kết quả mong đợi:**
File `.eleventyignore` với ignore patterns.

**⚠️ Lưu Ý Quan Trọng:**
- Ngăn 11ty xử lý các files không cần thiết
- Tăng tốc build time
- Tránh xung đột với source files

---

### Bước 3.3: Cập Nhật .gitignore

**Mục tiêu:** Ignore 11ty build output

**Prompt cho AI CLI:**
```
Thêm dòng này vào f:/downloader/Project-root/apps/y2matevc/.gitignore:

_11ty-output/

Thư mục này chứa output tạm của 11ty build và không nên commit.
```

**Kết quả mong đợi:**
`_11ty-output/` được thêm vào .gitignore.

**⚠️ Lưu Ý Quan Trọng:**
- `_11ty-output` là tạm thời - Vite đọc từ đây nhưng output cuối là `dist/`
- Không commit thư mục này

---

## Giai Đoạn 4: Cấu Trúc Dữ Liệu

### Bước 4.1: Tạo Base i18n Data (en.json)

**Mục tiêu:** Tạo shared UI translations

**Prompt cho AI CLI:**
```
Tạo f:/downloader/Project-root/apps/y2matevc/_templates/_data/i18n/en.json

File này chứa TẤT CẢ text UI của ứng dụng:
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

QUY TẮC QUAN TRỌNG:
1. Phải có ĐẦY ĐỦ quality options cho MP4 (1080p, 720p, 480p, 360p, 240p, 144p, WEBM, MKV)
2. Phải có ĐẦY ĐỦ quality options cho MP3 (320kbps, 256kbps, 192kbps, 128kbps, OGG, OPUS, WAV)
3. GIỮ NGUYÊN tên format (MP4, MP3, WEBM, etc.) - đây là technical terms
4. Dùng English tự nhiên cho button labels và UI text

Tham khảo y2matepro's _data/i18n/en.json cho cấu trúc, nhưng đảm bảo y2matevc có đủ keys cần thiết.
```

**Kết quả mong đợi:**
File `en.json` đầy đủ với all UI text được tổ chức theo sections.

**⚠️ Lưu Ý Quan Trọng:**
- Đây là file MASTER - tất cả translations sẽ dựa vào file này
- KHÔNG dịch tên format (MP4, MP3, WEBM, MKV, OGG, OPUS, WAV)
- Giá trị quality (1080p, 320kbps) không được dịch
- Tất cả text phải bằng tiếng Anh (các ngôn ngữ khác làm sau)
- JSON phải valid (check bằng JSON validator)

**Kiểm tra:**
```bash
cd f:/downloader/Project-root/apps/y2matevc/_templates/_data/i18n
node -e "const data = require('./en.json'); console.log('Keys:', Object.keys(data)); console.log('MP4 options:', data.formatSelector.options.mp4);"
# Phải hiện tất cả keys và MP4 options
```

---

### Bước 4.2: Tạo Pagination Generators

**Mục tiêu:** Tạo data files generate page variants cho mỗi ngôn ngữ

**Prompt cho AI CLI:**
```
Tạo 5 files trong f:/downloader/Project-root/apps/y2matevc/_templates/_data/:

1. allPages.cjs - Master generator
2. indexPages.cjs - Filter cho index page
3. youtubeToMp3Pages.cjs - Filter cho MP3 page
4. youtubeToMp4Pages.cjs - Filter cho MP4 page
5. youtubeShortPages.cjs - Filter cho Shorts page

Cấu hình:
- pageConfigs: 4 pages (index, youtube-to-mp4, youtube-to-mp3, youtube-short-downloader)
- languages: Bắt đầu với 2 ngôn ngữ (en là default, vi để test)
  - en: { code: 'en', name: 'English', isDefault: true }
  - vi: { code: 'vi', name: 'Tiếng Việt', isDefault: false }

Mỗi page variant phải có:
- pageKey: định danh page (vd: 'index', 'youtube-to-mp3')
- lang: mã ngôn ngữ
- permalink: URL path (EN: /page.html, khác: /{lang}/page.html)

Tham khảo y2matepro's allPages.cjs cho pattern chính xác.

QUAN TRỌNG: Log ra khi skip pages do thiếu data files.
```

**Kết quả mong đợi:**
5 files được tạo với pagination logic.

**⚠️ Lưu Ý Quan Trọng:**
- `allPages.cjs` generate TẤT CẢ page variants (pageKey × language)
- Filter files (indexPages.cjs, etc.) dùng `allPages.filter()` để lấy page cụ thể
- isDefault=true nghĩa là English pages vào root (/), các ngôn ngữ khác vào /{lang}/
- PHẢI log khi skip pages do thiếu data files (giúp debug)
- Cho MVP, bắt đầu với 2 ngôn ngữ (en, vi), mở rộng ra 19 sau

**Kiểm tra:**
```bash
cd f:/downloader/Project-root/apps/y2matevc/_templates/_data
node -e "const pages = require('./allPages.cjs'); console.log('Generated:', pages.length, 'page variants');"
# Phải hiện: Generated: 8 page variants (4 pages × 2 languages)
```

---

### Bước 4.3: Tạo Page Data Files (en.json)

**Mục tiêu:** Extract content từ HTML files và tạo structured JSON data

**Prompt cho AI CLI:**
```
Tạo page data files bằng cách extract content từ HTML files hiện có:

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

Mỗi file phải có cấu trúc:
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
  "whyChoose": {              // Lý do chọn service
    "title": "...",
    "intro": "...",
    "reasons": ["...", "..."]
  },
  "instructions": {           // Hướng dẫn sử dụng
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

QUY TẮC BẮT BUỘC ĐỂ GIỮ HTML:
1. GIỮ NGUYÊN TẤT CẢ HTML TAGS: <strong>, <a>, <em>, etc.
2. Với links: Giữ nguyên <a href="/path">text</a> - KHÔNG phá vỡ HTML
3. Escape quotes trong JSON: <a href=\"/path\">
4. Ví dụ: "The <strong>YouTube to MP3</strong> page from <a href=\"/\">Y2Mate</a>..."
5. KHÔNG strip hay sửa bất kỳ HTML tag nào từ source
6. Cross-page links phải đúng (vd: <a href="/youtube-to-mp4">YouTube to MP4</a>)

HƯỚNG DẪN SEO:
- title: 50-60 ký tự (tối ưu cho Google)
- description: 150-160 ký tự (tránh bị cắt)
- Bao gồm keywords tự nhiên
- ogTitle và ogDescription có thể hơi khác title/description

Extract tất cả content sections, FAQs, và metadata từ HTML files.
```

**Kết quả mong đợi:**
4 JSON files với page data đầy đủ, tất cả HTML tags được giữ nguyên.

**⚠️ Lưu Ý Cực Kỳ Quan Trọng:**
- **GIỮ NGUYÊN HTML LÀ QUAN TRỌNG NHẤT**: Không được strip `<strong>`, `<a>`, hay bất kỳ HTML tag nào
- Links như `<a href="/youtube-to-mp4">YouTube to MP4</a>` phải giữ nguyên
- Dùng proper JSON escaping: `<a href=\"/path\">` (backslash trước quotes)
- SEO meta tags có giới hạn ký tự - phải follow nghiêm ngặt
- FAQs phải có cả question và answer
- Content sections phải khớp với cấu trúc HTML gốc

**Lỗi Thường Gặp Cần Tránh:**
- ❌ Xóa `<strong>` tags: `YouTube to MP3` (SAI)
- ✅ Giữ `<strong>` tags: `<strong>YouTube to MP3</strong>` (ĐÚNG)
- ❌ Phá links: `YouTube to MP4 page` (SAI)
- ✅ Giữ links: `<a href="/youtube-to-mp4">YouTube to MP4</a>` (ĐÚNG)

**Kiểm tra:**
```bash
cd f:/downloader/Project-root/apps/y2matevc/_templates/_data/pages
# Validate JSON syntax
for dir in */; do
  echo "Validating ${dir}en.json"
  node -e "JSON.parse(require('fs').readFileSync('${dir}en.json', 'utf-8'))" && echo "✓ Valid" || echo "✗ Invalid"
done

# Check HTML tags được giữ nguyên
grep -r "<strong>" */en.json  # Phải tìm thấy <strong> tags
grep -r "<a href=" */en.json  # Phải tìm thấy <a> tags
```

---

## Giai Đoạn 5: Templates

### Bước 5.1: Tạo Base Layout (base.njk)

**Mục tiêu:** Tạo master layout template

**Prompt cho AI CLI:**
```
Tạo f:/downloader/Project-root/apps/y2matevc/_templates/_includes/base.njk

Template này phải:
1. Setup cấu trúc HTML với proper meta tags
2. Include SEO metadata từ pageData.seo
3. Generate hreflang tags cho multilingual SEO
4. Include canonical URLs
5. Add Open Graph và Schema.org markup
6. Include header, footer, và json-ld
7. Load main.ts qua Vite

QUAN TRỌNG - KHÔNG INJECT window.__i18n__:
- Y2matepro KHÔNG inject JavaScript i18n data
- TypeScript files dùng hard-coded text (không phải dynamic i18n)
- Chỉ text được render bởi template mới multilingual

Tham khảo y2matepro's base.njk cho cấu trúc chính xác.

Biến quan trọng:
- seo: pageData.seo (title, description, og tags)
- lang: mã ngôn ngữ hiện tại
- pageKey: định danh page hiện tại
- base: i18nBase[lang] (shared UI text, nhưng CHỈ dùng trong template)

Bao gồm các sections:
- Head với meta tags
- hreflang links cho tất cả ngôn ngữ
- Canonical URL
- Open Graph tags
- JSON-LD structured data (qua include)
- Body với header, main content, footer
```

**Kết quả mong đợi:**
File `base.njk` đầy đủ với cấu trúc SEO proper.

**⚠️ Lưu Ý Quan Trọng:**
- **KHÔNG được thêm `<script>window.__i18n__ = ...</script>`** - pattern này KHÔNG được dùng
- TypeScript files có hard-coded English text (giống y2matepro)
- Chỉ dùng i18nBase data trong TEMPLATES, không inject vào JavaScript
- hreflang tags rất quan trọng cho multilingual SEO
- FOUC prevention script optional nhưng recommended

**Kiểm tra:**
Sau khi build, check HTML không có `window.__i18n__`:
```bash
npm run 11ty:build
grep "window.__i18n__" _11ty-output/index.html
# Phải không trả về gì (không match)
```

---

### Bước 5.2: Tạo Header Template (header.njk)

**Mục tiêu:** Tạo navigation header

**Prompt cho AI CLI:**
```
Tạo f:/downloader/Project-root/apps/y2matevc/_templates/_includes/header.njk

Template này phải render:
1. Logo và site name
2. Navigation links (từ base.nav)
3. Language switcher dropdown
4. Mobile menu overlay

QUAN TRỌNG:
- Dùng langPrefix cho URL localization: '' cho EN, '/{lang}' cho các ngôn ngữ khác
- Navigation links: home, youtubeToMp4, youtubeToMp3, youtubeShorts
- Language switcher phải list tất cả ngôn ngữ available
- Mobile menu phải responsive

Tham khảo y2matepro's header.njk cho cấu trúc.
```

**Kết quả mong đợi:**
`header.njk` với responsive navigation và language switcher.

**⚠️ Lưu Ý Quan Trọng:**
- Tính langPrefix: `'' if (lang == 'en' or not lang) else '/' + lang`
- Links phải work cho cả English (/) và các ngôn ngữ khác (/vi/, /es/)
- Language switcher hiện ngôn ngữ hiện tại, dropdown hiện các ngôn ngữ khác
- Mobile menu cần JavaScript (đã có trong y2matevc)

**Kiểm tra:**
Check HTML generated có URLs đúng:
```bash
npm run 11ty:build
grep 'href="/"' _11ty-output/index.html  # EN links
grep 'href="/vi/"' _11ty-output/vi/index.html  # VI links (sau khi add vi.json)
```

---

### Bước 5.3: Tạo Footer Template (footer.njk)

**Mục tiêu:** Tạo footer với links

**Prompt cho AI CLI:**
```
Tạo f:/downloader/Project-root/apps/y2matevc/_templates/_includes/footer.njk

Bao gồm:
- Copyright text (từ base.footer.copyright)
- Footer links: About, Contact, Terms, Privacy
- Dùng langPrefix cho localized URLs

Giữ đơn giản và sạch.
```

**Kết quả mong đợi:**
Footer template đơn giản với localized links.

---

### Bước 5.4: Tạo JSON-LD Template (json-ld.njk)

**Mục tiêu:** Tạo structured data cho SEO

**Prompt cho AI CLI:**
```
Tạo f:/downloader/Project-root/apps/y2matevc/_templates/_includes/json-ld.njk

Template này generate Schema.org structured data (JSON-LD) cho:
1. Organization (chỉ cho root homepage)
2. WebSite (chỉ cho root homepage)
3. WebPage (cho tất cả pages)
4. SoftwareApplication (cho tất cả pages)
5. FAQPage (nếu page có FAQs)
6. HowTo (nếu page có instructions)

QUAN TRỌNG:
- Dùng jsonString filter để escape text trong JSON
- Organization và WebSite chỉ xuất hiện trên root EN homepage (isRootHomePage)
- Pages khác chỉ có WebPage + SoftwareApplication + optional FAQ/HowTo
- Email: y2matevc@gmail.com (không phải y2matepro)

Tham khảo y2matepro's json-ld.njk cho cấu trúc chính xác.
```

**Kết quả mong đợi:**
JSON-LD template đầy đủ với conditional sections.

**⚠️ Lưu Ý Quan Trọng:**
- BẮT BUỘC dùng `| jsonString | safe` filter cho text trong JSON-LD
- Organization schema chỉ trên root homepage (SEO best practice)
- FAQPage và HowTo schemas boost SEO rankings
- Test JSON-LD với Google's Structured Data Testing Tool

**Kiểm tra:**
```bash
npm run 11ty:build
# Check JSON-LD tồn tại
grep "application/ld+json" _11ty-output/index.html
# Phải tìm thấy <script type="application/ld+json">
```

---

### Bước 5.5: Tạo Page Templates

**Mục tiêu:** Tạo templates cho cả 4 pages

**Prompt cho AI CLI:**
```
Tạo 4 page templates trong f:/downloader/Project-root/apps/y2matevc/_templates/pages/:

1. index.njk
2. youtube-to-mp3.njk
3. youtube-to-mp4.njk
4. youtube-short-downloader.njk

Mỗi template phải:
1. Dùng layout: base.njk
2. Setup pagination từ data file tương ứng:
   - index.njk dùng indexPages
   - youtube-to-mp3.njk dùng youtubeToMp3Pages
   - youtube-to-mp4.njk dùng youtubeToMp4Pages
   - youtube-short-downloader.njk dùng youtubeShortPages
3. Render hero section với form
4. Render format selector (MP4/MP3 toggle + quality selectors)
5. Loop qua content.sections
6. Render whyChoose section
7. Render instructions section
8. Render FAQs section (nếu có)

TÍNH NĂNG QUAN TRỌNG CỦA TEMPLATE:
- Dùng {{ base.* }} cho shared UI text (buttons, placeholders)
- Dùng {{ page.* }} cho page-specific content
- Dùng | localizeLinks(langPrefix) filter cho internal links
- Dùng | safe filter cho HTML content
- Cả 4 templates gần như giống hệt nhau trừ pagination data source

Cấu trúc Front matter:
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

Tham khảo y2matepro's index.njk cho cấu trúc template chính xác.
```

**Kết quả mong đợi:**
4 page templates với cấu trúc đầy đủ.

**⚠️ Lưu Ý Quan Trọng:**
- Mỗi template dùng pagination data source KHÁC NHAU
- Filter `| localizeLinks(langPrefix)` chuyển `/path` → `/vi/path` cho non-EN
- Dùng `| safe` filter cho HTML content (nếu không sẽ bị escape)
- Format selector HTML duplicate trong tất cả templates (không dùng partial - giữ đơn giản)
- FAQs phải conditional: `{%- if page.faqs and page.faqs.items %}`

**Kiểm tra:**
```bash
npm run 11ty:build
ls _11ty-output/*.html
# Phải hiện: index.html, youtube-to-mp3.html, youtube-to-mp4.html, youtube-short-downloader.html
```

---

## Giai Đoạn 6: Tích Hợp & Testing

### Bước 6.1: Cập Nhật Vite Config

**Mục tiêu:** Làm Vite đọc từ 11ty output

**Prompt cho AI CLI:**
```
Cập nhật f:/downloader/Project-root/apps/y2matevc/vite.config.ts

Sửa rollupOptions.input để detect HTML files từ:
1. Root directory (cho EN pages từ _11ty-output)
2. pages/ directory (cho language-specific pages từ _11ty-output/pages/)

Thêm code để auto-detect language pages:
- Đọc từ _11ty-output/pages/{lang}/*.html
- Generate entry points như: { 'vi-index': 'pages/vi/index.html' }

Vite build phải:
1. Đọc HTML từ _11ty-output/ (generated bởi 11ty)
2. Bundle TypeScript và CSS
3. Output ra dist/

Tham khảo y2matepro's approach nếu họ có setup tương tự.
```

**Kết quả mong đợi:**
`vite.config.ts` updated với multi-page detection từ 11ty output.

**⚠️ Lưu Ý Quan Trọng:**
- Vite đọc từ `_11ty-output/`, không phải từ `_templates/`
- Phải detect cả root pages (EN) và pages/{lang}/ directories
- Entry point names quan trọng: dùng format `{lang}-{page}`
- Thứ tự build: 11ty SAU ĐÓ Vite (tuần tự, không parallel)

**Kiểm tra:**
```bash
npm run build
# Phải chạy: 11ty:build → tsc → vite build
ls dist/
# Phải hiện tất cả HTML files và assets
```

---

### Bước 6.2: Test 11ty Build

**Mục tiêu:** Verify 11ty generates tất cả pages đúng

**Prompt cho AI CLI:**
```
Chạy 11ty build và verify output.

Các bước:
1. Chạy: npm run 11ty:build
2. Check thư mục _11ty-output/
3. Verify files tồn tại:
   - index.html
   - youtube-to-mp3.html
   - youtube-to-mp4.html
   - youtube-short-downloader.html
4. Check HTML generated chứa:
   - SEO meta tags
   - JSON-LD structured data
   - hreflang tags
   - Navigation links đúng
   - Content với HTML tags được giữ nguyên
5. Verify KHÔNG CÓ window.__i18n__ injection

Nếu build fail, check:
- Tất cả data files có chưa?
- JSON syntax có valid không?
- Template paths có đúng không?
```

**Kết quả mong đợi:**
```
[11ty] Wrote 4 files in 0.5 seconds
```

**⚠️ Lưu Ý Quan Trọng:**
- Messages "Skipping {page}/{lang}" là bình thường khi thiếu data files
- Tất cả 4 English pages phải generate thành công
- Check có template errors hay missing data warnings không
- Validate HTML structure manually

**Kiểm tra:**
```bash
cd f:/downloader/Project-root/apps/y2matevc

# Build
npm run 11ty:build

# Đếm files generated
find _11ty-output -name "*.html" | wc -l
# Phải hiện: 4 (chỉ cho English)

# Check không có window.__i18n__
grep -r "window.__i18n__" _11ty-output/
# Phải return: (không match)

# Check HTML tags được giữ nguyên
grep "<strong>YouTube" _11ty-output/youtube-to-mp3.html
# Phải tìm thấy: <strong>YouTube to MP3</strong>

# Check links được giữ nguyên
grep '<a href="/youtube-to-mp4">' _11ty-output/youtube-to-mp3.html
# Phải tìm thấy link
```

---

### Bước 6.3: Test Dev Server

**Mục tiêu:** Test site ở development mode

**Prompt cho AI CLI:**
```
Start development server và test site.

Các bước:
1. Chạy: npm run dev
2. Mở browser vào http://localhost:5173/ (hoặc port được hiện)
3. Test:
   - Cả 4 pages load đúng
   - Navigation hoạt động
   - Format selector functions
   - Tất cả text hiển thị đúng
   - Không có console errors
   - Links đúng

Known issue: TypeScript sẽ có hard-coded English text (điều này expected, giống y2matepro)
```

**Kết quả mong đợi:**
Dev server chạy, site hoạt động đầy đủ.

**⚠️ Lưu Ý Quan Trọng:**
- Vite dev server serve từ source, không phải từ _11ty-output
- Ở dev mode, bạn đang test Vite's HMR, không phải 11ty output
- Để test đầy đủ 11ty, dùng production build (`npm run build`)
- TypeScript status messages sẽ chỉ có English (by design)

---

### Bước 6.4: Full Production Build

**Mục tiêu:** Test complete build pipeline

**Prompt cho AI CLI:**
```
Chạy full production build và verify output.

Các bước:
1. Clean previous builds: rm -rf _11ty-output dist
2. Chạy: npm run build
3. Verify build steps chạy theo thứ tự:
   - [1] 11ty build (generates _11ty-output/)
   - [2] TypeScript compilation (tsc)
   - [3] Vite build (generates dist/)
4. Check thư mục dist/ chứa:
   - Tất cả HTML files
   - Bundled JS/CSS với hashes
   - Assets copied đúng
5. Serve với: npm run preview
6. Test tất cả pages hoạt động đúng

Build phải complete không có errors.
```

**Kết quả mong đợi:**
```
✓ 11ty build complete
✓ TypeScript compilation complete
✓ Vite build complete
dist/ generated với tất cả files
```

**⚠️ Lưu Ý Quan Trọng:**
- Build BẮT BUỘC tuần tự: 11ty → tsc → Vite
- Mỗi bước phải complete trước khi bước tiếp bắt đầu (dùng `&&` trong npm script)
- dist/ là output cuối cùng để deploy
- _11ty-output/ có thể xóa sau build (tạm thời)

**Kiểm tra:**
```bash
cd f:/downloader/Project-root/apps/y2matevc

# Full build
npm run build

# Check dist/
ls dist/
# Phải hiện: index.html, youtube-to-mp3.html, youtube-to-mp4.html, youtube-short-downloader.html, assets/

# Serve và test
npm run preview
# Mở http://localhost:4173
```

---

## Checklist Kiểm Tra

Sau khi hoàn thành tất cả bước, verify:

### ✅ Kiểm Tra Cấu Trúc
- [ ] `_templates/_data/i18n/en.json` tồn tại với complete UI text
- [ ] `_templates/_data/pages/*/en.json` tồn tại cho cả 4 pages
- [ ] `_templates/_includes/*.njk` tồn tại (base, header, footer, json-ld)
- [ ] `_templates/pages/*.njk` tồn tại cho cả 4 pages
- [ ] `.eleventy.cjs` configuration đúng
- [ ] package.json có 11ty scripts

### ✅ Kiểm Tra Chất Lượng Dữ Liệu
- [ ] Tất cả JSON files có valid syntax
- [ ] HTML tags được giữ nguyên trong data (`<strong>`, `<a>`, `<em>`)
- [ ] Cross-page links đúng
- [ ] SEO meta tags trong giới hạn ký tự (title: 50-60, description: 150-160)
- [ ] Không có hard-coded text trong templates (tất cả từ data files)

### ✅ Kiểm Tra Build
- [ ] `npm run 11ty:build` thành công không có errors
- [ ] 4 HTML files generated trong `_11ty-output/`
- [ ] Generated HTML có proper SEO tags
- [ ] JSON-LD structured data present
- [ ] hreflang tags present
- [ ] KHÔNG CÓ `window.__i18n__` trong generated HTML
- [ ] Links trong content có format đúng

### ✅ Kiểm Tra Tích Hợp
- [ ] Vite config detects language pages đúng
- [ ] `npm run build` completes thành công
- [ ] dist/ chứa tất cả files
- [ ] `npm run preview` hoạt động
- [ ] Cả 4 pages load và function đúng

### ✅ Kiểm Tra SEO
- [ ] Canonical URLs đúng
- [ ] hreflang tags cho tất cả languages
- [ ] Open Graph tags present
- [ ] JSON-LD validates (dùng Google's tool)
- [ ] Meta descriptions trong limits

### ✅ Kiểm Tra Nội Dung
- [ ] Tất cả content sections rendered
- [ ] FAQs section present
- [ ] Instructions section present
- [ ] Why Choose section present
- [ ] Tất cả internal links work
- [ ] HTML formatting được giữ nguyên (bold, links, etc.)

---

## Các Vấn Đề Thường Gặp & Giải Pháp

### Vấn Đề 1: "workspace: protocol not supported"
**Nguyên nhân:** Dùng `npm install` thay vì `pnpm`
**Giải pháp:** Luôn dùng `pnpm add -D` cho monorepo này

### Vấn Đề 2: "Cannot find module '.eleventy.cjs'"
**Nguyên nhân:** File chưa tạo hoặc sai location
**Giải pháp:** Phải ở project root: `f:/downloader/Project-root/apps/y2matevc/.eleventy.cjs`

### Vấn Đề 3: Không có pages nào generated
**Nguyên nhân:** Thiếu data files hoặc pagination config error
**Giải pháp:** Check logs có messages "Skipping" không, verify data files tồn tại

### Vấn Đề 4: HTML tags bị escaped trong output
**Nguyên nhân:** Thiếu `| safe` filter trong template
**Giải pháp:** Thêm `| safe` sau variables chứa HTML: `{{ paragraph | safe }}`

### Vấn Đề 5: Links không work ở ngôn ngữ khác
**Nguyên nhân:** Thiếu `localizeLinks` filter
**Giải pháp:** Dùng `{{ paragraph | localizeLinks(langPrefix) | safe }}`

### Vấn Đề 6: window.__i18n__ xuất hiện trong HTML
**Nguyên nhân:** Thêm nhầm JavaScript injection
**Giải pháp:** Xóa script block - y2matepro pattern không dùng cái này

### Vấn Đề 7: Build order sai
**Nguyên nhân:** Scripts chạy parallel
**Giải pháp:** Dùng `&&` trong package.json: `npm run 11ty:build && vite build`

---

## Bước Tiếp Theo Sau Setup

1. **Test với Vietnamese**: Thêm `_data/pages/*/vi.json` files
2. **Generate translations**: Dùng TRANSLATION_BATCH_PROMPTS.md
3. **Thêm các ngôn ngữ còn lại**: Tạo JSON files cho cả 19 ngôn ngữ
4. **Update TypeScript**: Cân nhắc thêm runtime i18n nếu cần (optional)
5. **Deploy**: Test trên staging trước production

---

## Files Tham Khảo

Key files để tham khảo khi setup:
- `f:/downloader/Project-root/apps/y2matepro/_templates/ELEVENTY-README.md`
- `f:/downloader/Project-root/apps/y2matepro/.eleventy.cjs`
- `f:/downloader/Project-root/apps/y2matepro/_templates/_includes/base.njk`
- Tài liệu workflow này: `AI_CLI_SETUP_WORKFLOW_VI.md`

---

## Tóm Tắt

Workflow này hướng dẫn AI CLI qua:
1. ✅ Hiểu cách y2matepro implement 11ty
2. ✅ Setup cấu trúc 11ty cho y2matevc
3. ✅ Tạo data files với HTML preservation
4. ✅ Build templates theo proven patterns
5. ✅ Tích hợp với Vite build system
6. ✅ Testing và validation

**Nguyên Tắc Chính:** Follow y2matepro's pattern chính xác - không có window.__i18n__, pure template rendering, giữ nguyên HTML đúng cách.

---

**Document Version:** 1.0
**Cập Nhật Lần Cuối:** 2025-01-23
**Đã Test Với:** @11ty/eleventy v3.1.2, Node.js v18+
