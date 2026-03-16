# Prompt: Clone onedownloader.net → y2save.com

## Context

Monorepo tại `F:\downloader\Project-root` chứa nhiều app trong `apps/`. App `apps/onedownloader.net` là template base đã clean sẵn (chỉ có 1 page index, không có sub-pages thừa).

Nhiệm vụ: tạo site mới `y2save.com` bằng cách copy `apps/onedownloader.net` rồi rebrand.

**Đọc file `CLONE-SITE-GUIDE.md` ở root trước khi bắt đầu** — đó là checklist chi tiết từng file cần sửa.

---

## Copy

```bash
cp -r apps/onedownloader.net apps/y2save.com
```

## Xóa sau khi copy
- `node_modules/`, `dist/`, `_11ty-output/`, `pages/`
- `.claude/`, `.agent/`, `logs/`

## Rebrand: OneDownloader → Y2Save

Thay thế theo thứ tự (specific trước, generic sau):
| Tìm | Thay |
|-----|------|
| `onedownloader.net` | `y2save.com` |
| `OneDownloader` | `Y2Save` |
| `onedownloader` | `y2save` |
| `ONEDOWNLOADER` | `Y2SAVE` |

**Files cần sửa** (xem CLONE-SITE-GUIDE.md cho chi tiết):

Config:
- `package.json` → `"name": "y2save.com"`
- `.eleventy.cjs` → `url: 'https://y2save.com'`
- `public/robots.txt` → `Sitemap: https://y2save.com/sitemap.xml`
- `vite-plugin-sitemap.ts` → fallback baseUrl

Template data:
- `_templates/_data/i18n/en.json` → logoText, copyright
- `_templates/_data/pages/index/en.json` → SEO title/description, h1, brand trong content

Template files (.njk):
- `_templates/_includes/header.njk` → logo text, aria-labels
- `_templates/_includes/json-ld.njk` → org name, logo URL, email
- `_templates/_includes/base.njk` → localStorage key inline script
- `_templates/_includes/partials/hero-form.njk` → localStorage key inline script

Source code:
- `src/utils/storage-keys.ts` → `PREFIX = 'y2save'`
- `src/api/index.ts` → `createNamespacedKey('y2save', 'downloader')`
- `src/features/download-limit.ts` → `LICENSE_KEY_STORAGE_KEY = 'y2save:license_key'` + comment
- `src/features/license/license-token.ts` → `INTEGRITY_SALT = 'y2save_lk_2026'` + comments
- `src/features/allowed-features.ts` → comments
- `src/features/feature-limit-policy.ts` → comment
- `src/features/paywall-popup.ts` → comment
- `src/main.ts` → comment header
- `public/api-logger.worker.js` → `dbName: 'y2save_ApiLogsDB'`
- CSS comment headers (license-page.css, reset-key.css, ui-components.css, video-info-card.css)

Static HTML (sửa trực tiếp, không qua template):
- `404.html` → title, logo, aria-labels, copyright
- `license.html` → title, meta tags, canonical URL, OG tags, JSON-LD, logo
- `reset-key.html` → title, meta description, logo

Update `rebrand.cjs` với patterns mới cho y2save.

## Không sửa
- `src/libs/firebase/firebase-config.ts`
- `src/features/trustpilot/`
- `src/environment.ts`
- `index.html` (generated từ template, chạy `npm run 11ty:build` để regenerate)

## GitHub Workflows

**`.github/workflows/ci.yml`** — thêm 6 chỗ:
1. `workflow_dispatch.inputs.specific_app.options` — thêm `'y2save.com'`
2. `dorny/paths-filter filters` — thêm `y2save.com: - 'apps/y2save.com/**'`
3. `ALL_APPS` JSON array — thêm `"y2save.com"`
4. Detect changes block — thêm if block cho `steps.filter.outputs['y2save.com']`
5. Deploy job — thêm `deploy-y2save-com` job
6. Summary job — thêm vào `needs` + table row

**`.github/workflows/deploy-manual.yml`** — thêm 2 chỗ:
1. `workflow_dispatch.inputs.app.options` — thêm `'y2save.com'`
2. `case` block — thêm config cho `y2save.com`

Domain variable: `vars.Y2SAVE_DOMAIN` (fallback `y2save.com`)

## Lưu ý quan trọng

1. **KHÔNG sửa bất kỳ file nào ngoài `apps/y2save.com/` và `.github/workflows/`** — các site cũ không được ảnh hưởng
2. **`index.html` ở root app** là file generated từ template — không sửa tay, chạy `npm run 11ty:build` để regenerate
3. **Thứ tự replace quan trọng** — replace domain trước (`onedownloader.net`), rồi brand (`OneDownloader`), cuối cùng prefix (`onedownloader`)
4. **Verify cuối cùng**: grep toàn bộ app cho `onedownloader` để đảm bảo không còn sót (trừ firebase/trustpilot)
5. **SEO content** trong `_templates/_data/pages/index/en.json` — nên viết lại phù hợp với brand Y2Save, không copy y nguyên
