# 🚀 Hướng dẫn Build Template System

Hệ thống template đã được setup hoàn chỉnh theo chuẩn **y2matepro**. Làm theo các bước sau để build và sử dụng.

---

## ✅ Files đã tạo

### 📁 Cấu trúc hoàn chỉnh:

```
ssvid.cc/
├── .eleventy.cjs                    ✅ Eleventy config
├── _templates/
│   ├── _data/
│   │   ├── i18n/
│   │   │   └── en.json              ✅ Base i18n (nav, hero, footer)
│   │   ├── pages/
│   │   │   ├── index/en.json        ✅ Homepage data
│   │   │   ├── youtube-to-mp3/en.json       ✅
│   │   │   ├── youtube-to-mp4/en.json       ✅
│   │   │   └── youtube-shorts-downloader/en.json ✅
│   │   ├── allPages.cjs             ✅ Page generator
│   │   ├── indexPages.cjs           ✅ Filters
│   │   ├── youtubeToMp3Pages.cjs    ✅
│   │   ├── youtubeToMp4Pages.cjs    ✅
│   │   ├── youtubeShortsDownloaderPages.cjs ✅
│   │   └── site.json                ✅ Site config
│   ├── _includes/
│   │   ├── base.njk                 ✅ Base layout
│   │   ├── header.njk               ✅ Header component
│   │   └── footer.njk               ✅ Footer component
│   └── pages/
│       ├── index.njk                ✅ Index template
│       ├── youtube-to-mp3.njk       ✅
│       ├── youtube-to-mp4.njk       ✅
│       └── youtube-shorts-downloader.njk ✅
└── _11ty-output/                    (sẽ được tạo khi build)
```

---

## 📦 Bước 1: Cài đặt Dependencies

```bash
cd F:\downloader\Project-root\apps\ssvid.cc

# Cài đặt Eleventy
npm install --save-dev @11ty/eleventy
```

---

## ⚙️ Bước 2: Thêm Scripts vào package.json

Mở file `package.json` và thêm vào phần `scripts`:

```json
{
  "scripts": {
    "11ty:build": "eleventy",
    "11ty:watch": "eleventy --watch --serve",
    "11ty:serve": "eleventy --serve"
  }
}
```

---

## 🔨 Bước 3: Build lần đầu

```bash
# Build tất cả pages
npm run 11ty:build
```

**Output sẽ là:**
```
_11ty-output/
├── index.html
├── youtube-to-mp3.html
├── youtube-to-mp4.html
└── youtube-shorts-downloader.html
```

**Sau đó tự động copy ra root:**
```
ssvid.cc/
├── index.html                    ✅ Built from template
├── youtube-to-mp3.html           ✅
├── youtube-to-mp4.html           ✅
└── youtube-shorts-downloader.html ✅
```

---

## 🔄 Bước 4: Development Mode

```bash
# Auto rebuild khi có thay đổi
npm run 11ty:watch
```

Mọi thay đổi trong:
- `_templates/_data/` (JSON files)
- `_templates/_includes/` (layout/components)
- `_templates/pages/` (page templates)

Sẽ tự động rebuild.

---

## 📝 Cách chỉnh sửa content

### 1. Chỉnh sửa text chung (header, nav, footer)

**File:** `_templates/_data/i18n/en.json`

```json
{
  "nav": {
    "home": "Home",           // ← Đổi text này
    "about": "About"
  },
  "hero": {
    "placeholder": "Paste YouTube link here..."  // ← Hoặc đổi text này
  }
}
```

### 2. Chỉnh sửa content từng page

**File:** `_templates/_data/pages/{page-name}/en.json`

```json
{
  "seo": {
    "title": "Your New Title",    // ← SEO title
    "description": "New desc"
  },
  "hero": {
    "title": "New Hero Title"     // ← H1 heading
  },
  "overview": {
    "description": "New description with <a href='/link'>links</a>"  // ← Có thể dùng HTML
  }
}
```

### 3. Rebuild sau khi edit

```bash
npm run 11ty:build
```

---

## 🌍 Thêm ngôn ngữ mới (Ví dụ: Tiếng Việt)

### Step 1: Update `.eleventy.cjs`

Thêm language vào array (line 71):

```javascript
eleventyConfig.addGlobalData('site', {
  url: 'https://ssvid.cc',
  languages: [
    { code: 'en', name: 'English', isDefault: true },
    { code: 'vi', name: 'Tiếng Việt', isDefault: false }  // ← Thêm dòng này
  ]
});
```

### Step 2: Update `allPages.cjs`

Thêm language vào array (line 11):

```javascript
const languages = [
  { code: 'en', name: 'English', isDefault: true },
  { code: 'vi', name: 'Tiếng Việt', isDefault: false }  // ← Thêm dòng này
];
```

### Step 3: Tạo file i18n/vi.json

```bash
cp _templates/_data/i18n/en.json _templates/_data/i18n/vi.json
# Sau đó mở file vi.json và dịch content
```

### Step 4: Tạo page data files

```bash
cp _templates/_data/pages/index/en.json _templates/_data/pages/index/vi.json
# Dịch content trong vi.json
```

Làm tương tự cho các pages khác.

### Step 5: Build

```bash
npm run 11ty:build
```

**Output:**
```
/index.html                           (EN)
/vi/index.html                        (VI)
/youtube-to-mp3.html                  (EN)
/vi/youtube-to-mp3.html               (VI)
...
```

---

## 🔗 Internal Links trong data

Các links trong data JSON **đã tự động localize** nhờ filter `localizeLinks`:

```json
{
  "description": "Visit <a href='/youtube-to-mp3.html'>MP3 page</a>"
}
```

**Output:**
- Tiếng Anh: `<a href="/download-youtube-mp3">`
- Tiếng Việt: `<a href="/vi/download-youtube-mp3">`

---

## 🎨 Customize Layout/Design

### Thay đổi HTML structure:

Edit files trong `_templates/_includes/`:
- `base.njk` - Layout chính, SEO tags
- `header.njk` - Header & navigation
- `footer.njk` - Footer links

### Thay đổi page structure:

Edit files trong `_templates/pages/`:
- `index.njk`
- `youtube-to-mp3.njk`
- `youtube-to-mp4.njk`
- `youtube-shorts-downloader.njk`

---

## 🐛 Troubleshooting

### Lỗi: `{{ variable }}` hiển thị raw trong HTML

**Nguyên nhân:** Data file không tìm thấy hoặc sai tên

**Cách sửa:**
1. Kiểm tra `pageKey` trong `allPages.cjs` khớp với folder name
2. Kiểm tra file `{lang}.json` tồn tại trong folder page

### Lỗi: HTML tags bị escape

**Nguyên nhân:** Thiếu filter `| safe`

**Cách sửa:**
```nunjucks
{# SAI #}
<p>{{ page.description }}</p>

{# ĐÚNG #}
<p>{{ page.description | safe }}</p>
```

### Lỗi: Build không tạo file

**Nguyên nhân:** Thiếu filter file

**Cách sửa:** Tạo file `{camelCase}Pages.cjs` trong `_templates/_data/`

---

## ✨ Features đã implement

✅ **SEO hoàn chỉnh**: title, description, OG tags, hreflang, schema.org
✅ **Multilingual ready**: Dễ dàng thêm ngôn ngữ mới
✅ **Dynamic links**: Links tự động localize
✅ **HTML in data**: Hỗ trợ `<a>`, `<strong>` tags trong JSON
✅ **Post-build copy**: Tự động copy HTML ra root
✅ **Watch mode**: Auto rebuild khi có thay đổi

---

## 📚 Tham khảo

- **Eleventy Docs**: https://www.11ty.dev/docs/
- **Nunjucks Docs**: https://mozilla.github.io/nunjucks/
- **y2matepro source**: `F:\downloader\Project-root\apps\y2matepro\_templates`

---

## 🎯 Next Steps

1. ✅ Build lần đầu: `npm run 11ty:build`
2. ✅ Kiểm tra output trong `_11ty-output/`
3. ✅ Test HTML files đã được copy ra root
4. ⏭️ Thêm ngôn ngữ mới nếu cần
5. ⏭️ Customize CSS/design
6. ⏭️ Deploy lên production

Hệ thống đã sẵn sàng để sử dụng! 🚀
