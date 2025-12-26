# Eleventy (11ty) - Tổng Quan Project

## Giới Thiệu

Project này sử dụng **Eleventy v3.1.2** - một static site generator đơn giản và mạnh mẽ để quản lý templates và i18n (internationalization).

## Tại Sao Sử Dụng Eleventy?

### Ưu Điểm
- **Zero-config**: Hoạt động ngay mà không cần cấu hình phức tạp
- **Template engine linh hoạt**: Hỗ trợ Nunjucks, Liquid, Handlebars, EJS, v.v.
- **Build nhanh**: Tạo static HTML files với tốc độ cao
- **Data cascade**: Hệ thống data hierarchy mạnh mẽ cho i18n
- **Clean URLs**: Dễ dàng tạo SEO-friendly URLs

### Nhược Điểm Cần Lưu Ý
- Whitespace control cần được quản lý cẩn thận (sử dụng `{%-` và `-%}`)
- Pagination có thể phức tạp với multilingual setup
- Debug khó hơn frameworks như Next.js

## Kiến Trúc Project

### Cấu Trúc Thư Mục

```
apps/y2matepro/
├── _templates/                    # Eleventy input directory
│   ├── _data/                     # Global data files
│   │   ├── i18n/
│   │   │   └── base.json         # Shared data (nav, footer, hero)
│   │   └── pages/                # Page-specific data
│   │       ├── index/
│   │       │   └── en.json       # Homepage English data
│   │       └── youtube-to-mp4/
│   │           └── en.json       # YouTube MP4 page English data
│   ├── _includes/                # Template partials
│   │   ├── base.njk              # Main layout
│   │   ├── header.njk            # Header component
│   │   └── footer.njk            # Footer component
│   └── pages/                    # Page templates
│       ├── index.njk             # Homepage
│       └── youtube-to-mp4.njk    # Other pages
├── _11ty-output/                 # Eleventy output (gitignored)
├── .eleventy.cjs                 # Eleventy config
├── index.html                    # Final output (copied from _11ty-output)
└── youtube-to-mp4.html           # Final output
```

### Data Flow (Data Cascade)

Eleventy sử dụng "data cascade" - dữ liệu được merge theo thứ tự ưu tiên:

1. **Global data** (`_data/`) - Lowest priority
2. **Template front matter** - Highest priority

Trong project này:
- `i18nBase` → Shared data (navigation, footer, hero form text)
- `i18nPages` → Page-specific data (SEO, content, FAQs)

## Cách Hoạt Động

### 1. Build Process

```
npm run 11ty:build
```

**Flow:**
1. Eleventy đọc config từ `.eleventy.cjs`
2. Load global data từ `_templates/_data/`
3. Process templates trong `_templates/pages/`
4. Render với layout `_templates/_includes/base.njk`
5. Output HTML vào `_11ty-output/`
6. Copy files từ `_11ty-output/` vào root

### 2. Template Rendering

Mỗi page template (ví dụ `index.njk`):

**Front matter** → Metadata (permalink, lang, pageKey)
**Variables** → Load data từ global data
**Content** → HTML với Nunjucks syntax
**Layout** → Wrap trong `base.njk`

### 3. URL Generation

- **Permalink trong template**: `/youtube-to-mp4.html`
- **SEO URLs** (canonical, hreflang, og:url): Được clean bằng filters
  - Remove `.html` extension
  - Convert `/index` thành `/`
  - Kết quả: `https://y2matepro.com/youtube-to-mp4`

## I18n Strategy (Hiện Tại: English Only)

### Modular Data Structure

**Shared Data** (`_data/i18n/base.json`):
- Navigation links
- Footer content
- Hero form text (placeholder, buttons, terms)

**Page-Specific Data** (`_data/pages/{pageName}/en.json`):
- SEO metadata (title, description, OG tags)
- Hero title (h1 của page)
- Content sections
- Features
- FAQs

### Tại Sao Tách Riêng?

1. **DRY Principle**: Shared data chỉ cần update một chỗ
2. **Scalability**: Dễ dàng thêm ngôn ngữ mới trong tương lai
3. **Maintainability**: Content editors chỉ cần edit JSON files

## Quy Chuẩn Quan Trọng

### 1. Whitespace Control

**Vấn đề**: Nunjucks tags tạo dòng trống trong HTML output

**Giải pháp**: Sử dụng `{%-` và `-%}`

**Khi nào dùng**:
- Set variables ở đầu template
- Comments không cần output
- Logic blocks không cần spacing

### 2. Clean URLs

**Internal links**: Không có `.html` extension
- Đúng: `href="/youtube-to-mp4"`
- Sai: `href="/youtube-to-mp4.html"`

**SEO URLs**: Sử dụng filters để clean
- Canonical URLs
- hreflang tags
- Open Graph URLs

### 3. Data Naming Convention

**Shared data**: `{{ base.xxx }}`
- `{{ base.nav.home }}`
- `{{ base.footer.copyright }}`
- `{{ base.hero.placeholder }}`

**Page data**: `{{ page.xxx }}`
- `{{ page.hero.title }}` (h1 của page)
- `{{ page.content.mainTitle }}`
- `{{ page.features.items }}`

### 4. Permalink Strategy

**English pages**: Root directory
- `/index.html` → Displays as `/`
- `/youtube-to-mp4.html` → Displays as `/youtube-to-mp4`

**Future multilingual**:
- `/pages/vi/index.html` → Would display as `/vi/`
- `/pages/vi/youtube-to-mp4.html` → Would display as `/vi/youtube-to-mp4`

## Build Scripts

### `11ty:build`
Full build + copy to root
- Chạy Eleventy compiler
- Copy output files vào root directory

### `11ty:watch`
Development mode với auto-reload
- Theo dõi changes trong `_templates/`
- Auto rebuild khi có thay đổi

### `11ty:copy`
Copy specific files từ `_11ty-output/` vào root
- Customizable per page
- Thêm page mới → Update script này

## Workflow Thêm Page Mới

### Bước 1: Tạo Data File
Tạo folder và file JSON trong `_templates/_data/pages/`

Ví dụ: `_templates/_data/pages/new-page/en.json`

### Bước 2: Tạo Template
Tạo file `.njk` trong `_templates/pages/`

Ví dụ: `_templates/pages/new-page.njk`

**Front matter cần có**:
- `layout: base.njk`
- `permalink: /new-page.html`
- `lang: en`
- `pageKey: new-page`

### Bước 3: Update Build Script
Thêm vào `package.json` → `11ty:copy`:

```
&& cp _11ty-output/new-page.html ./new-page.html
```

### Bước 4: Build và Verify
```
npm run 11ty:build
grep "{{ " _11ty-output/new-page.html
```

Không có output = Success (no unrendered variables)

## SEO Best Practices

### Multilingual Tags (Sẵn Sàng Cho Tương Lai)

**hreflang tags**: Báo search engines về language versions
**og:locale**: Facebook/social media language info
**canonical URLs**: Prevent duplicate content
**inLanguage**: Schema.org markup

### RTL Support

Conditional `dir` attribute:
- Chỉ thêm `dir="rtl"` cho Arabic/Hebrew
- Không hardcode `dir="ltr"` (default behavior)

## Common Issues & Solutions

### Issue 1: Empty Lines at Beginning
**Nguyên nhân**: Nunjucks tags tạo whitespace
**Giải pháp**: Dùng `{%- ... -%}` cho set variables và comments

### Issue 2: URLs with .html Extension
**Nguyên nhân**: `page.url` từ Eleventy bao gồm `.html`
**Giải pháp**: Sử dụng filter `| replace('.html', '')`

### Issue 3: Duplicate Permalinks
**Nguyên nhân**: Pagination với eleventyComputed không evaluate đúng
**Giải pháp**: Tạo separate template files thay vì dùng pagination

### Issue 4: Unrendered Variables
**Nguyên nhân**: Typo trong data path hoặc thiếu data
**Giải pháp**: Kiểm tra `pageKey` match với folder name trong `_data/pages/`

### Issue 5: Vietnamese References Still Show
**Nguyên nhân**: Quên xóa data files hoặc template files
**Giải pháp**:
- Xóa `_data/pages/{page}/vi.json`
- Xóa template files (ví dụ: `index-vi.njk`)
- Clean output: `rm -rf _11ty-output/vi _11ty-output/pages`

## Performance Tips

### 1. Minimize Data Size
Chỉ load data cần thiết cho mỗi page

### 2. Use Eleventy Filters
Custom filters cho reusable logic (ví dụ: URL cleaning)

### 3. Watch Mode for Development
Dùng `11ty:watch` khi develop, không cần rebuild toàn bộ

### 4. Cache Static Assets
Eleventy tự động copy static files (images, CSS, JS) qua passthrough

## Future Enhancements

### Multilingual Support (Khi Cần)
1. Uncomment logic trong `base.njk`
2. Tạo `vi.json` files cho Vietnamese
3. Tạo separate templates với permalink `/pages/vi/`
4. Update build scripts

### Sitemap Generation
Có thể dùng Eleventy plugins để auto-generate sitemap.xml

### RSS Feed
Eleventy có built-in support cho RSS feed generation

## Debugging Tips

### Check Rendered Output
```
head _11ty-output/index.html
```

### Find Unrendered Variables
```
grep "{{ " _11ty-output/*.html
```

### Verify URLs
```
grep -E "canonical|hreflang|og:url" _11ty-output/index.html
```

### Check Data Loading
Add debug trong `.eleventy.cjs`:
```
console.log('Loaded pages data:', pagesData);
```

## Resources

- **Eleventy Docs**: https://www.11ty.dev/docs/
- **Nunjucks Syntax**: https://mozilla.github.io/nunjucks/templating.html
- **Data Cascade**: https://www.11ty.dev/docs/data-cascade/
- **Permalinks**: https://www.11ty.dev/docs/permalinks/

## Kết Luận

Eleventy là lựa chọn tốt cho project này vì:
- ✅ Simple setup cho static HTML generation
- ✅ Powerful i18n data management
- ✅ Clean, SEO-friendly URLs
- ✅ Fast build times
- ✅ Easy to maintain và scale

Chỉ cần lưu ý whitespace control và URL cleaning để tránh các vấn đề phổ biến.
