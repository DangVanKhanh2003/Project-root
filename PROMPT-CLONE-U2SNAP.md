# Prompt: Clone onedownloader.net → u2snap.com

## Context

Monorepo tại `F:\downloader\Project-root` chứa nhiều app trong `apps/`. App `apps/onedownloader.net` là template base đã clean sẵn (chỉ có 1 page index, không có sub-pages thừa).

Nhiệm vụ: tạo site mới `u2snap.com` bằng cách copy `apps/onedownloader.net` rồi rebrand.

**Đọc file `CLONE-SITE-GUIDE.md` ở root trước khi bắt đầu** — đó là checklist chi tiết từng file cần sửa.

---

## Copy

```bash
cp -r apps/onedownloader.net apps/u2snap.com
```

## Xóa sau khi copy
- `node_modules/`, `dist/`, `_11ty-output/`, `pages/`
- `.claude/`, `.agent/`, `logs/`

## Rebrand: OneDownloader → U2Snap

Thay thế theo thứ tự (specific trước, generic sau):
| Tìm | Thay |
|-----|------|
| `onedownloader.net` | `u2snap.com` |
| `OneDownloader` | `U2Snap` |
| `onedownloader` | `u2snap` |
| `ONEDOWNLOADER` | `U2SNAP` |

**Files cần sửa** (xem CLONE-SITE-GUIDE.md cho chi tiết):

Config:
- `package.json` → `"name": "u2snap.com"`
- `.eleventy.cjs` → `url: 'https://u2snap.com'`
- `public/robots.txt` → `Sitemap: https://u2snap.com/sitemap.xml`
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
- `src/utils/storage-keys.ts` → `PREFIX = 'u2snap'`
- `src/api/index.ts` → `createNamespacedKey('u2snap', 'downloader')`
- `src/features/download-limit.ts` → `LICENSE_KEY_STORAGE_KEY = 'u2snap:license_key'` + comment
- `src/features/license/license-token.ts` → `INTEGRITY_SALT = 'u2snap_lk_2026'` + comments
- `src/features/allowed-features.ts` → comments
- `src/features/feature-limit-policy.ts` → comment
- `src/features/paywall-popup.ts` → comment
- `src/main.ts` → comment header
- `public/api-logger.worker.js` → `dbName: 'u2snap_ApiLogsDB'`
- CSS comment headers (license-page.css, reset-key.css, ui-components.css, video-info-card.css)

Static HTML (sửa trực tiếp, không qua template):
- `404.html` → title, logo, aria-labels, copyright
- `license.html` → title, meta tags, canonical URL, OG tags, JSON-LD, logo
- `reset-key.html` → title, meta description, logo

Update `rebrand.cjs` với patterns mới cho u2snap.

## Không sửa
- `src/libs/firebase/firebase-config.ts`
- `src/features/trustpilot/`
- `src/environment.ts`
- `index.html` (generated từ template, chạy `npm run 11ty:build` để regenerate)

## GitHub Workflows

**`.github/workflows/ci.yml`** — thêm 6 chỗ:
1. `workflow_dispatch.inputs.specific_app.options` — thêm `'u2snap.com'`
2. `dorny/paths-filter filters` — thêm `u2snap.com: - 'apps/u2snap.com/**'`
3. `ALL_APPS` JSON array — thêm `"u2snap.com"`
4. Detect changes block — thêm if block cho `steps.filter.outputs['u2snap.com']`
5. Deploy job — thêm `deploy-u2snap-com` job
6. Summary job — thêm vào `needs` + table row

**`.github/workflows/deploy-manual.yml`** — thêm 2 chỗ:
1. `workflow_dispatch.inputs.app.options` — thêm `'u2snap.com'`
2. `case` block — thêm config cho `u2snap.com`

Domain variable: `vars.U2SNAP_DOMAIN` (fallback `u2snap.com`)

## Lưu ý quan trọng

1. **KHÔNG sửa bất kỳ file nào ngoài `apps/u2snap.com/` và `.github/workflows/`** — các site cũ không được ảnh hưởng
2. **`index.html` ở root app** là file generated từ template — không sửa tay, chạy `npm run 11ty:build` để regenerate
3. **Thứ tự replace quan trọng** — replace domain trước (`onedownloader.net`), rồi brand (`OneDownloader`), cuối cùng prefix (`onedownloader`)
4. **Verify cuối cùng**: grep toàn bộ app cho `onedownloader` để đảm bảo không còn sót (trừ firebase/trustpilot)
5. **SEO content** trong `_templates/_data/pages/index/en.json` — nên viết lại phù hợp với brand U2Snap, không copy y nguyên
