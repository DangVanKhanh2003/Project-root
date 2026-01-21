# SEO Checker Skill

Bộ công cụ kiểm tra SEO cho project y2matepro, được viết bằng TypeScript.

## Cài đặt

```bash
cd apps/y2matepro/skills/seo-checker
npm install
```

## Cách sử dụng

### Chạy tất cả validators

```bash
# Development mode (không cần build)
npm run dev

# Hoặc build trước rồi chạy
npm run check
```

### Chạy từng validator riêng lẻ

```bash
npm run check:canonical        # Kiểm tra canonical tags
npm run check:alternate        # Kiểm tra hreflang tags
npm run check:meta             # Kiểm tra title & meta description
npm run check:jsonld           # Kiểm tra JSON-LD syntax
npm run check:sitemap          # Kiểm tra sitemap.xml
npm run check:i18n             # Kiểm tra đầy đủ ngôn ngữ
npm run check:url              # Kiểm tra URL format
npm run check:lang-dropdown    # Kiểm tra language selector
npm run check:jsonld-content   # Kiểm tra nội dung JSON-LD
```

### CLI Options

```bash
# Chạy với options
npx tsx src/index.ts [options]

# Options:
--only <slugs>      # Chỉ chạy validators cụ thể (comma-separated)
--skip <slugs>      # Bỏ qua validators cụ thể
--log-dir <path>    # Thư mục lưu logs (default: ./logs/seo-checks)
--no-console        # Tắt output console
--no-file           # Tắt ghi log ra file
-h, --help          # Hiện help

# Ví dụ:
npx tsx src/index.ts --only canonical,meta-tags
npx tsx src/index.ts --skip lang-dropdowns,i18n-completeness
```

## Danh sách Validators

| Slug | Tên | Mô tả |
|------|-----|-------|
| `canonical` | Canonical Tags | Kiểm tra `<link rel="canonical">` |
| `alternate` | Hreflang Tags | Kiểm tra `<link rel="alternate" hreflang="">` |
| `meta-tags` | Meta Tags | Kiểm tra `<title>` và `<meta name="description">` |
| `structured-data` | JSON-LD Syntax | Kiểm tra cú pháp JSON-LD |
| `sitemap` | Sitemap | Kiểm tra file sitemap.xml |
| `i18n-completeness` | i18n | Kiểm tra đầy đủ trang cho các ngôn ngữ |
| `url-format` | URL Format | Kiểm tra clean URLs (không .html, /index) |
| `lang-dropdowns` | Language Dropdown | Kiểm tra có language selector UI |
| `jsonld-content` | JSON-LD Content | Kiểm tra nội dung JSON-LD (không HTML, placeholder) |

## Log Files

Tất cả logs được lưu vào thư mục `logs/seo-checks/`:

```
logs/seo-checks/
├── errors-{timestamp}.log      # Tất cả errors từ mọi validators
├── warnings-{timestamp}.log    # Tất cả warnings từ mọi validators
├── audit-full-{timestamp}.log  # Full audit log
├── summary-{timestamp}.json    # Summary dạng JSON
├── latest-errors.log           # Symlink đến errors mới nhất
├── latest-warnings.log         # Symlink đến warnings mới nhất
└── latest-full.log             # Symlink đến full log mới nhất
```

### Format Error Log

```
────────────────────────────────────────────────────────────
┌─ ❌ ERROR #1
│ 📄 File: pages/en/index.html
│ 📍 Location: <head> section
│ 🔧 Component: Meta description
│ ❌ Issue: Missing meta description
│ ℹ️ Reason: Meta descriptions help with click-through rates
│ 💡 Fix: Add <meta name="description" content="..." />
│ ⏱️ Validator: Meta Tags
│ ⏱️ Time: 2026-01-12 10:30:00
└───────────────────────────────────────────────────────────
```

## Exit Codes

- `0` - Tất cả validators PASSED (không có errors)
- `1` - Có ít nhất 1 validator FAILED (có errors)

> **Note:** Warnings không ảnh hưởng đến exit code

## Cấu trúc thư mục

```
skills/seo-checker/
├── src/
│   ├── index.ts              # Main orchestrator
│   ├── cli.ts                # CLI wrapper
│   ├── types.ts              # TypeScript interfaces
│   ├── logger/
│   │   ├── index.ts          # CentralLogger class
│   │   └── formats.ts        # Log formatting utilities
│   ├── validators/           # 9 SEO validators
│   │   ├── index.ts
│   │   ├── canonical.ts
│   │   ├── alternate.ts
│   │   ├── meta-tags.ts
│   │   ├── structured-data.ts
│   │   ├── sitemap.ts
│   │   ├── i18n-completeness.ts
│   │   ├── url-format.ts
│   │   ├── lang-dropdowns.ts
│   │   └── jsonld-content.ts
│   └── utils/
│       ├── file-scanner.ts   # Scan HTML files
│       └── html-parser.ts    # Parse HTML với cheerio
├── logs/                     # Generated logs (git ignored)
├── dist/                     # Compiled JS (git ignored)
├── package.json
├── tsconfig.json
└── README.md
```

## Tùy chỉnh Exclude Patterns

Mặc định, các validators exclude các thư mục sau:
- `**/node_modules/**`
- `**/dist/**`
- `**/_11ty-output/**`
- `**/_templates/**`
- `**/404.html`

Để thay đổi, sửa trong từng file validator tại `src/validators/*.ts`.

## Programmatic Usage

```typescript
import { runSEOAudit, runSingleValidator } from './src/index.js';

// Chạy tất cả validators
const summary = await runSEOAudit({
  logDir: './my-logs',
  console: true,
  file: true,
});

console.log(`Passed: ${summary.passed}`);
console.log(`Errors: ${summary.totalErrors}`);
console.log(`Warnings: ${summary.totalWarnings}`);

// Chạy 1 validator
const result = await runSingleValidator('canonical');
console.log(`Canonical check passed: ${result.passed}`);
```

## Thêm Validator Mới

1. Tạo file mới trong `src/validators/`:

```typescript
// src/validators/my-validator.ts
import type { Validator, ValidatorLogger, ValidatorResult } from '../types.js';

export const myValidator: Validator = {
  name: 'My Validator',
  slug: 'my-validator',
  description: 'Description of what it checks',

  async run(logger: ValidatorLogger): Promise<ValidatorResult> {
    const startTime = Date.now();
    let filesChecked = 0;

    // Logic kiểm tra...

    // Log error
    logger.error({
      file: 'path/to/file.html',
      location: '<head>',
      component: 'Component Name',
      issue: 'What is wrong',
      reason: 'Why it matters',
      fix: 'How to fix it',
    });

    // Log warning
    logger.warning({
      file: 'path/to/file.html',
      component: 'Component Name',
      issue: 'What might be wrong',
    });

    const stats = logger.getStats();
    return {
      name: myValidator.name,
      slug: myValidator.slug,
      passed: stats.errors === 0,
      errorCount: stats.errors,
      warningCount: stats.warnings,
      filesChecked,
      duration: Date.now() - startTime,
    };
  },
};
```

2. Export trong `src/validators/index.ts`:

```typescript
export { myValidator } from './my-validator.js';

// Thêm vào allValidators array
export const allValidators: Validator[] = [
  // ... existing validators
  myValidator,
];
```

3. Thêm script trong `package.json`:

```json
{
  "scripts": {
    "check:my-validator": "npm run build && node dist/cli.js my-validator"
  }
}
```

## Dependencies

- **cheerio** - HTML parsing
- **chalk** - Terminal colors
- **fast-glob** - File pattern matching
- **tsx** - TypeScript execution
