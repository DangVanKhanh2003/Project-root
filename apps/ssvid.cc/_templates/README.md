# SSVID Template System

Hệ thống template cho SSVID.cc sử dụng Eleventy (11ty) để generate static HTML pages với hỗ trợ đa ngôn ngữ.

## Cấu trúc đã tạo

```
_templates/
├── _data/
│   ├── i18n/
│   │   └── en.json                          # Base translations (nav, footer, hero)
│   ├── pages/
│   │   ├── index/
│   │   │   └── en.json                      # Index page content
│   │   ├── youtube-to-mp3/
│   │   │   └── en.json                      # YouTube to MP3 page content
│   │   ├── youtube-to-mp4/
│   │   │   └── en.json                      # YouTube to MP4 page content
│   │   └── youtube-shorts-downloader/
│   │       └── en.json                      # YouTube Shorts page content
│   ├── allPages.cjs                         # Master page generator
│   ├── indexPages.cjs                       # Filter for index page
│   ├── youtubeToMp3Pages.cjs               # Filter for MP3 page
│   ├── youtubeToMp4Pages.cjs               # Filter for MP4 page
│   ├── youtubeShortsDownloaderPages.cjs    # Filter for Shorts page
│   └── site.json                            # Site configuration
├── _includes/                               # Layouts & components (chưa tạo)
└── pages/                                   # Page templates (chưa tạo)
```

## Files đã tạo

### 1. Base i18n (`_data/i18n/en.json`)
Chứa translations chung cho:
- **nav**: Navigation links (Home, About, YouTube to MP3/MP4/Shorts, FAQ, Contact, Terms, Privacy, DMCA)
- **hero**: Hero section (placeholder, buttons)
- **footer**: Footer links và copyright

### 2. Page-specific data (`_data/pages/{pageKey}/en.json`)

Mỗi page có structure như sau:

```json
{
  "seo": {
    "title": "...",
    "description": "...",
    "ogTitle": "...",
    "ogDescription": "...",
    "schemaName": "...",
    "schemaDescription": "..."
  },
  "hero": {
    "title": "...",
    "subtitle": "..."
  },
  "overview": {
    "badge": "...",
    "title": "...",
    "description": "..."
  },
  "howTo": {
    "title": "...",
    "steps": [...]
  },
  "whatCanDownload": {
    "title": "...",
    "sections": [...]
  },
  "faqs": {
    "title": "...",
    "items": [...]
  }
}
```

**4 pages đã được tạo:**
- ✅ `index` - Homepage
- ✅ `youtube-to-mp3` - YouTube to MP3 converter
- ✅ `youtube-to-mp4` - YouTube to MP4 downloader
- ✅ `youtube-shorts-downloader` - YouTube Shorts downloader

### 3. Page Generation System

**allPages.cjs**
- Generate tất cả page variants (mỗi page × mỗi ngôn ngữ)
- Hiện tại: 4 pages × 1 language (English) = 4 variants
- Output permalink: `/index.html`, `/youtube-to-mp3.html`, `/download-youtube-mp4.html`, `/download-youtube-shorts.html`

**Filter files**
- `indexPages.cjs` - Filter ra index page variants
- `youtubeToMp3Pages.cjs` - Filter ra MP3 page variants
- `youtubeToMp4Pages.cjs` - Filter ra MP4 page variants
- `youtubeShortsDownloaderPages.cjs` - Filter ra Shorts page variants

### 4. Site Config (`site.json`)
```json
{
  "url": "https://ssvid.cc",
  "name": "SSVID",
  "description": "Free online YouTube video downloader..."
}
```

## Các bước tiếp theo

### Option 1: Tích hợp với y2matepro (Khuyến nghị)

Nếu muốn sử dụng hệ thống tương tự y2matepro:

1. **Copy config files từ y2matepro:**
   ```bash
   cp ../y2matepro/.eleventy.cjs .
   cp ../y2matepro/package.json .  # Copy scripts phần 11ty
   ```

2. **Tạo các file template .njk** (copy từ y2matepro và chỉnh sửa):
   - `_templates/_includes/base.njk` - Base layout
   - `_templates/_includes/header.njk` - Header component
   - `_templates/_includes/footer.njk` - Footer component
   - `_templates/pages/index.njk` - Index template
   - `_templates/pages/youtube-to-mp3.njk` - MP3 template
   - `_templates/pages/download-youtube-mp4.njk` - MP4 template
   - `_templates/pages/download-youtube-shorts.njk` - Shorts template

3. **Cài đặt dependencies:**
   ```bash
   npm install --save-dev @11ty/eleventy
   ```

4. **Build:**
   ```bash
   npm run 11ty:build
   ```

### Option 2: Sử dụng data trực tiếp (Không dùng Eleventy)

Nếu không muốn dùng Eleventy, bạn có thể:
1. Import JSON files trực tiếp vào JavaScript/TypeScript
2. Render content bằng vanilla JS hoặc framework khác
3. Files JSON đã structured rõ ràng, dễ sử dụng

## Thêm ngôn ngữ mới

Khi cần thêm ngôn ngữ (ví dụ: Tiếng Việt):

1. **Update `allPages.cjs`:**
   ```javascript
   const languages = [
     { code: 'en', name: 'English', isDefault: true },
     { code: 'vi', name: 'Tiếng Việt', isDefault: false }
   ];
   ```

2. **Tạo i18n file:**
   ```bash
   cp _templates/_data/i18n/en.json _templates/_data/i18n/vi.json
   # Sau đó dịch nội dung
   ```

3. **Tạo page data files:**
   ```bash
   cp _templates/_data/pages/index/en.json _templates/_data/pages/index/vi.json
   # Dịch content cho từng page
   ```

4. **Build lại:**
   ```bash
   npm run 11ty:build
   ```

Output sẽ là:
- `/index.html` (EN)
- `/vi/index.html` (VI)
- `/youtube-to-mp3.html` (EN)
- `/vi/youtube-to-mp3.html` (VI)
- ...

## Notes

- **Data structure** được thiết kế tương tự y2matepro để dễ maintain
- **Chỉ English** được implement hiện tại (dễ mở rộng sau)
- **Content** được extract từ 4 HTML files hiện có
- **SEO data** đầy đủ cho mỗi page (title, description, OG tags, schema)
- **Structure rõ ràng**: Mỗi section có riêng key để dễ render

## Content đã extract

Tất cả nội dung đã được extract từ các HTML files hiện có:
- ✅ SEO metadata (title, description, OG tags)
- ✅ Hero sections (title, subtitle)
- ✅ Overview sections (badge, title, description)
- ✅ How-to steps (3 steps cho mỗi page)
- ✅ What can download sections (3 subsections)
- ✅ Quality/Why download sections
- ✅ FAQs (6 items cho mỗi page)

Tất cả content giữ nguyên HTML tags (`<strong>`, `<a>`) để dễ render.
