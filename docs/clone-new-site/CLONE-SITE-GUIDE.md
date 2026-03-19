# Clone Site Guide — Tạo site mới từ template trong monorepo

Hướng dẫn cho AI tự động clone app `apps/onedownloader.net` thành site mới, rebrand, và cấu hình CI/CD.

---

## Prompt — Copy & Paste

Chỉ cần thay **1 link** data folder. AI sẽ tự lấy domain + brand từ tên folder.

```
Đọc file hướng dẫn F:\downloader\Project-root\docs\clone-new-site\CLONE-SITE-GUIDE.md và clone site mới.

- Source template: F:\downloader\Project-root\apps\onedownloader.net
- Data folder: C:\Users\khanh084\Downloads\{tên-site}\{tên-site}

Lấy domain từ tên folder data (ví dụ folder "snackeloader.com" → domain là snackeloader.com).
Tự suy ra brand name từ domain (ví dụ snackeloader.com → SnackeLoader).
Target app: F:\downloader\Project-root\apps\{domain}

Thực hiện đầy đủ theo CLONE-SITE-GUIDE.md. Thảo luận trước khi sửa GitHub workflows.
```

**Ví dụ — bạn chỉ paste đúng 1 dòng thay đổi:**
```
Đọc file hướng dẫn F:\downloader\Project-root\docs\clone-new-site\CLONE-SITE-GUIDE.md và clone site mới.

- Source template: F:\downloader\Project-root\apps\onedownloader.net
- Data folder: C:\Users\khanh084\Downloads\snackeloader.com\snackeloader.com

Lấy domain từ tên folder data (ví dụ folder "snackeloader.com" → domain là snackeloader.com).
Tự suy ra brand name từ domain (ví dụ snackeloader.com → SnackeLoader).
Target app: F:\downloader\Project-root\apps\snackeloader.com

Thực hiện đầy đủ theo CLONE-SITE-GUIDE.md. Thảo luận trước khi sửa GitHub workflows.
```

---

## Bước 1: Copy và dọn dẹp

```bash
cp -r apps/onedownloader.net apps/{DOMAIN}
```

**Xóa ngay sau khi copy:**
- `node_modules/`, `dist/`, `_11ty-output/`, `pages/`
- `.claude/`, `.agent/`, `logs/`
- Các file `.md` thừa (BUILD-GUIDE, README, STATUS_REPORT, v.v.)
- `docs/`, `doc_important/`
- `update_data.cjs` (nếu có)

**KHÔNG xóa:** `CLAUDE.md` (nếu site mới cần), `rebrand.cjs`

---

## Bước 2: Copy assets từ Data Folder

Nếu user cung cấp data folder, copy các file sau vào `public/`:

| Từ data folder | Đến app |
|----------------|---------|
| `favicon.ico`, `favicon*.png`, `apple-touch-icon.png` | `public/` (ghi đè) |
| `favicon-*.png` (các sizes) | `public/` (ghi đè) |
| `images/` | `public/images/` (merge/ghi đè) |
| `assest/` | `public/assest/` (merge/ghi đè nếu có) |

Giữ nguyên các file khác trong `public/` (fonts, worker, BingSiteAuth, v.v.).

---

## Bước 3: Rebrand — Thay thế references

### Thứ tự replace (QUAN TRỌNG — specific trước, generic sau)

| # | Tìm | Thay |
|---|-----|------|
| 1 | `onedownloader.net` | `{DOMAIN}` |
| 2 | `OneDownloader` | `{BRAND}` |
| 3 | `onedownloader` | `{PREFIX}` (domain không có đuôi, ví dụ `snackeloader`) |
| 4 | `ONEDOWNLOADER` | `{PREFIX_UPPER}` (in hoa, ví dụ `SNACKELOADER`) |

### 3a. Config files

| File | Thay đổi |
|------|----------|
| `package.json` | `"name": "{DOMAIN}"` |
| `.eleventy.cjs` | `url: 'https://{DOMAIN}'` |
| `public/robots.txt` | `Sitemap: https://{DOMAIN}/sitemap.xml` |
| `vite-plugin-sitemap.ts` | Fallback `baseUrl` |

### 3b. Template data

| File | Thay đổi |
|------|----------|
| `_templates/_data/i18n/en.json` | `logoText`, `copyright`, xóa nav/drawer/footer links đến pages không tồn tại |
| `_templates/_data/pages/index/en.json` | SEO title/description, h1, brand trong content — **viết lại phù hợp brand mới** |
| `_templates/_data/allPages.cjs` | Kiểm tra danh sách pages, chỉ giữ pages tồn tại |

### 3c. Template files (.njk)

| File | Thay đổi |
|------|----------|
| `_templates/_includes/header.njk` | Logo text, aria-labels |
| `_templates/_includes/json-ld.njk` | Organization name, logo URL, email |
| `_templates/_includes/base.njk` | localStorage key trong inline script |
| `_templates/_includes/partials/hero-form.njk` | localStorage key trong inline script |

### 3d. Source code

| File | Thay đổi |
|------|----------|
| `src/utils/storage-keys.ts` | `PREFIX = '{PREFIX}'` |
| `src/api/index.ts` | `createNamespacedKey('{PREFIX}', 'downloader')` |
| `src/features/download-limit.ts` | `LICENSE_KEY_STORAGE_KEY = '{PREFIX}:license_key'` + comment |
| `src/features/license/license-token.ts` | `INTEGRITY_SALT = '{PREFIX}_lk_2026'` + comments |
| `src/features/allowed-features.ts` | Comments |
| `src/features/feature-limit-policy.ts` | Comment header |
| `src/features/paywall-popup.ts` | Comment header |
| `src/main.ts` | Comment header |
| `public/api-logger.worker.js` | `dbName: '{PREFIX}_ApiLogsDB'` |

### 3e. CSS comment headers

| File |
|------|
| `src/styles/features/license-page.css` |
| `src/styles/features/reset-key.css` |
| `src/styles/overrides/ui-components.css` |
| `src/styles/reusable-packages/video-info-card/video-info-card.css` |

### 3f. Static HTML (sửa trực tiếp, KHÔNG qua template)

| File | Thay đổi |
|------|----------|
| `404.html` | title, logo text, aria-labels, copyright |
| `license.html` | title, meta tags, canonical URL, OG tags, JSON-LD, logo |
| `reset-key.html` | title, meta description, logo |

### 3g. Update rebrand.cjs

Cập nhật patterns mới:
```js
const replacements = [
    { match: /onedownloader\.net/g, replace: '{DOMAIN}' },
    { match: /OneDownloader/g, replace: '{BRAND}' },
    { match: /ONEDOWNLOADER/g, replace: '{PREFIX_UPPER}' },
    { match: /onedownloader/g, replace: '{PREFIX}' },
];
```

---

## KHÔNG SỬA (giữ nguyên)

- `src/libs/firebase/firebase-config.ts` — dùng chung Firebase project
- `src/features/trustpilot/` — config riêng sau
- `src/environment.ts` — API endpoints dùng chung
- `index.html` ở root app — **file generated từ template**, chạy `npm run 11ty:build` để regenerate

---

## Bước 4: vite.config.ts

Cập nhật `staticPages` — chỉ giữ pages có file `.html` thực tế ở root:

```ts
const staticPages = ['404', 'license', 'reset-key'];
```

Kiểm tra `excludedPageNames` — xóa entries không liên quan.

---

## Bước 5: GitHub Workflows (THẢO LUẬN TRƯỚC KHI LÀM)

⚠️ **Chỉ THÊM entries mới, KHÔNG sửa/xóa bất kỳ config nào của site cũ.**

### `.github/workflows/ci.yml` — Thêm 6 chỗ:

1. **`workflow_dispatch.inputs.specific_app.options`** — thêm `'{DOMAIN}'`
2. **`dorny/paths-filter filters`** — thêm:
   ```yaml
   {DOMAIN}: - 'apps/{DOMAIN}/**'
   ```
3. **`ALL_APPS` JSON array** — thêm `"{DOMAIN}"`
4. **Detect changes block** — thêm if block:
   ```yaml
   if [[ "${{ steps.filter.outputs['{DOMAIN}'] }}" == "true" ]]; then
   ```
5. **Deploy job** — thêm job `deploy-{DOMAIN_SLUG}` (copy pattern từ job khác, thay domain + directory)
6. **Summary job** — thêm vào `needs` array + table row

### `.github/workflows/deploy-manual.yml` — Thêm 2 chỗ:

1. **`workflow_dispatch.inputs.app.options`** — thêm `'{DOMAIN}'`
2. **`case` block** — thêm config:
   ```yaml
   '{DOMAIN}')
     APP_DIR="apps/{DOMAIN}"
     FILTER_PATH="apps/{DOMAIN}/**"
     DOMAIN="${{ vars.{DOMAIN_VAR} || '{DOMAIN}' }}"
     ;;
   ```

### Domain variable
Set `vars.{DOMAIN_VAR}` trên GitHub repo settings (ví dụ `vars.SNACKELOADER_DOMAIN`).

---

## Bước 6: Verify

```bash
cd apps/{DOMAIN}

# 1. Rebuild templates
npm run 11ty:build

# 2. Verify index.html có brand mới
grep -i "onedownloader" index.html  # KHÔNG nên có kết quả

# 3. Full grep kiểm tra sót (trừ firebase/trustpilot)
grep -ri "onedownloader" --include="*.ts" --include="*.json" --include="*.html" --include="*.njk" --include="*.css" --include="*.cjs" . | grep -v node_modules | grep -v firebase | grep -v trustpilot
```

---

## Checklist tóm tắt

- [ ] Copy source → target, xóa generated/docs/logs
- [ ] Copy assets từ data folder (favicon, images)
- [ ] Rebrand: config files (package.json, .eleventy.cjs, robots.txt, vite-plugin-sitemap.ts)
- [ ] Rebrand: template data (i18n/en.json, pages/index/en.json, allPages.cjs)
- [ ] Rebrand: template files (.njk — header, json-ld, base, hero-form)
- [ ] Rebrand: source code (storage-keys, api, download-limit, license-token, main.ts, ...)
- [ ] Rebrand: CSS comment headers
- [ ] Rebrand: static HTML (404, license, reset-key)
- [ ] Rebrand: rebrand.cjs
- [ ] Dọn dead links: i18n, header.njk, 404.html
- [ ] Update vite.config.ts staticPages
- [ ] Thêm vào ci.yml (6 chỗ) — **thảo luận trước**
- [ ] Thêm vào deploy-manual.yml (2 chỗ) — **thảo luận trước**
- [ ] Rebuild templates và verify không còn old references
