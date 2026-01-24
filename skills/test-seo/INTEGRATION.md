# Hướng dẫn tích hợp SEO Checker cho Project khác

Hướng dẫn này giúp bạn tích hợp bộ SEO Checker vào các project HTML/static site khác.

## Mục lục

1. [Yêu cầu](#yêu-cầu)
2. [Cài đặt](#cài-đặt)
3. [Cấu hình](#cấu-hình)
4. [Tùy chỉnh Validators](#tùy-chỉnh-validators)
5. [Tích hợp CI/CD](#tích-hợp-cicd)
6. [Troubleshooting](#troubleshooting)

---

## Yêu cầu

- Node.js >= 18.0.0
- Project có các file HTML cần check SEO
- npm hoặc pnpm

---

## Cài đặt

### Cách 1: Copy thư mục (Recommended)

```bash
# Copy toàn bộ thư mục seo-checker vào project của bạn
cp -r path/to/seo-checker your-project/tools/seo-checker

# Vào thư mục và cài dependencies
cd your-project/tools/seo-checker
npm install
```

### Cách 2: Symlink (cho monorepo)

```bash
# Tạo symlink nếu dùng chung trong monorepo
ln -s ../../shared/seo-checker ./tools/seo-checker
```

---

## Cấu hình

### Bước 1: Cập nhật BASE_URL

Mở file `src/validators/canonical.ts` và thay đổi:

```typescript
// Đổi từ
const BASE_URL = 'https://y2matepro.com';

// Thành URL của project bạn
const BASE_URL = 'https://your-domain.com';
```

### Bước 2: Cập nhật Exclude Patterns

Mỗi validator có `exclude` array. Thêm các thư mục cần bỏ qua:

```typescript
// Trong mỗi file src/validators/*.ts
const files = await scanHtmlFiles({
  rootDir: ROOT_DIR,
  include: ['**/*.html'],
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',           // Thêm thư mục build của bạn
    '**/.next/**',           // Nếu dùng Next.js
    '**/out/**',             // Output folder
    '**/vendor/**',          // Third-party
    '**/templates/**',       // Template files
    '**/partials/**',        // Partial HTML
    '**/404.html',
  ],
});
```

### Bước 3: Cập nhật Skip Lists

#### i18n Completeness - Trang không cần dịch:

```typescript
// src/validators/i18n-completeness.ts
const SKIP_I18N_PAGES = [
  'about-us',
  'contact',
  'privacy-policy',
  'terms-condition',
  // Thêm các trang khác của bạn
  'admin',
  'login',
];
```

#### Alternate - Trang không cần hreflang:

```typescript
// src/validators/alternate.ts
const SKIP_HREFLANG_PAGES = [
  '404',
  'admin',
  'login',
  // Thêm trang khác
];
```

### Bước 4: Cấu hình Language Dropdown Selectors

Nếu project dùng selector khác cho language switcher:

```typescript
// src/utils/html-parser.ts - function hasLanguageDropdown()
const selectors = [
  '#language-dropdown',
  '.language-dropdown',
  '[data-language-dropdown]',
  '.lang-selector',
  // Thêm selectors của project bạn
  '#my-lang-switcher',
  '.i18n-menu',
];
```

---

## Tùy chỉnh Validators

### Thay đổi Meta Tags Length

```typescript
// src/validators/meta-tags.ts

// Title
const TITLE_MIN_LENGTH = 30;    // Tối thiểu
const TITLE_MAX_LENGTH = 60;    // Tối ưu
const TITLE_WARNING_MAX = 70;   // Warning nếu vượt

// Description
const DESC_MIN_LENGTH = 70;      // Tối thiểu
const DESC_OPTIMAL_MIN = 140;    // Bắt đầu optimal
const DESC_OPTIMAL_MAX = 155;    // Kết thúc optimal
const DESC_MAX_LENGTH = 160;     // Tối đa (Google cắt)
```

### Thêm Supported Languages

```typescript
// src/utils/file-scanner.ts
export const SUPPORTED_LANGUAGES = [
  'en', 'vi', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko',
  // Thêm ngôn ngữ mới
  'nl', 'pl', 'sv', 'da', 'fi',
];
```

### Tùy chỉnh Placeholder Patterns

```typescript
// src/utils/html-parser.ts - function jsonLdContainsPlaceholders()
const placeholderPatterns = [
  /\bTODO\b/,           // Chỉ uppercase
  /\bFIXME\b/,
  /\[INSERT\]/i,
  /\[YOUR/i,
  /\bPLACEHOLDER\b/i,
  /\bXXX\b/,
  /\{\{.*\}\}/,         // Template syntax
  // Thêm patterns của bạn
  /\bTBD\b/,            // To Be Determined
  /\bWIP\b/,            // Work In Progress
];
```

### Disable một Validator

Trong `src/validators/index.ts`:

```typescript
export const allValidators: Validator[] = [
  canonicalValidator,
  alternateValidator,
  metaTagsValidator,
  structuredDataValidator,
  sitemapValidator,
  // i18nCompletenessValidator,  // Comment out để disable
  urlFormatValidator,
  // langDropdownsValidator,     // Comment out để disable
  jsonldContentValidator,
];
```

Hoặc dùng CLI option:

```bash
npm run dev -- --skip i18n-completeness,lang-dropdowns
```

---

## Tích hợp CI/CD

### GitHub Actions

```yaml
# .github/workflows/seo-check.yml
name: SEO Check

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  seo-audit:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd tools/seo-checker
          npm ci

      - name: Run SEO Audit
        run: |
          cd tools/seo-checker
          npm run check

      - name: Upload SEO Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: seo-report
          path: tools/seo-checker/logs/seo-checks/
```

### GitLab CI

```yaml
# .gitlab-ci.yml
seo-check:
  stage: test
  image: node:20
  script:
    - cd tools/seo-checker
    - npm ci
    - npm run check
  artifacts:
    when: always
    paths:
      - tools/seo-checker/logs/seo-checks/
    expire_in: 1 week
  allow_failure: true  # Không block pipeline nếu có warnings
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
cd tools/seo-checker && npm run check -- --only canonical,meta-tags
```

### npm scripts trong project chính

```json
// package.json của project chính
{
  "scripts": {
    "seo": "cd tools/seo-checker && npm run dev",
    "seo:check": "cd tools/seo-checker && npm run check",
    "seo:canonical": "cd tools/seo-checker && npm run check:canonical",
    "seo:meta": "cd tools/seo-checker && npm run check:meta"
  }
}
```

---

## Troubleshooting

### Lỗi: "Cannot find module 'cheerio'"

```bash
cd tools/seo-checker
npm install
```

### Lỗi: False positive với từ tiếng nước ngoài

Ví dụ: "todo" (Spanish) bị detect là "TODO" placeholder.

**Fix**: Sửa pattern trong `src/utils/html-parser.ts`:

```typescript
// Đổi từ case-insensitive
/TODO/i

// Thành case-sensitive (chỉ UPPERCASE)
/\bTODO\b/
```

### Lỗi: Check cả thư mục không mong muốn

Thêm vào exclude pattern trong validators:

```typescript
exclude: [
  '**/your-folder/**',
]
```

### Lỗi: Không tìm thấy sitemap.xml

Validator mặc định check các vị trí:
- `public/sitemap.xml`
- `sitemap.xml` (root)
- `_11ty-output/sitemap.xml`

Thêm path mới trong `src/validators/sitemap.ts`:

```typescript
const possiblePaths = [
  path.join(ROOT_DIR, 'public', 'sitemap.xml'),
  path.join(ROOT_DIR, 'sitemap.xml'),
  path.join(ROOT_DIR, 'dist', 'sitemap.xml'),  // Thêm path mới
  path.join(ROOT_DIR, 'build', 'sitemap.xml'),
];
```

### Lỗi: JSON-LD với @graph báo missing @type

Validator đã hỗ trợ `@graph` array. Nếu vẫn lỗi, check xem mỗi item trong `@graph` có `@type` không:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",  // ← Cần có @type
      "name": "..."
    },
    {
      "@type": "Organization",  // ← Cần có @type
      "name": "..."
    }
  ]
}
```

---

## Cấu trúc thư mục sau khi tích hợp

```
your-project/
├── src/
├── public/
├── tools/
│   └── seo-checker/          # SEO Checker tool
│       ├── src/
│       │   ├── validators/   # Các validators
│       │   ├── logger/       # Logging system
│       │   ├── utils/        # Utilities
│       │   ├── index.ts      # Main entry
│       │   └── cli.ts        # CLI
│       ├── logs/             # Generated logs (gitignore)
│       ├── package.json
│       └── tsconfig.json
├── package.json
└── .github/
    └── workflows/
        └── seo-check.yml     # CI workflow
```

---

## Checklist tích hợp

- [ ] Copy thư mục seo-checker vào project
- [ ] Chạy `npm install`
- [ ] Cập nhật `BASE_URL` trong canonical.ts
- [ ] Cập nhật exclude patterns cho project
- [ ] Cập nhật `SKIP_I18N_PAGES` nếu cần
- [ ] Cập nhật `SUPPORTED_LANGUAGES` nếu cần
- [ ] Test với `npm run dev`
- [ ] Thêm scripts vào package.json chính
- [ ] (Optional) Setup CI/CD workflow
- [ ] (Optional) Setup pre-commit hook

---

## Hỗ trợ

Nếu gặp vấn đề:
1. Check logs trong `logs/seo-checks/`
2. Chạy validator riêng lẻ để debug: `npm run check:canonical`
3. Đọc error message - có hướng dẫn fix cụ thể
