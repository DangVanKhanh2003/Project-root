

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

## Bước 3h: Thêm Navigation cho tool pages (NẾU có thêm tool pages từ data folder)

Nếu data folder chứa thêm tool pages (ví dụ `save-youtube-audio/`, `save-youtube-shorts/`...), cần thêm navigation ở **3 nơi**:

### 1. Footer (`_templates/_includes/footer.njk`)
Thêm `<nav class="footer-nav">` với links đến các tool pages:
```njk
<nav class="footer-nav" aria-label="Footer navigation">
    <a href="{{ langPrefix }}/save-youtube-audio">{{ base.footer.nav.saveYoutubeAudio or 'Save YouTube Audio' }}</a>
    <!-- ... thêm các pages khác -->
</nav>
```

### 2. Mobile Drawer (`_templates/_includes/header.njk`)
Thêm drawer links trong `<nav class="drawer-nav">` sau link Home:
```njk
<a href="{{ langPrefix }}/save-youtube-audio" class="drawer-link">{{ base.drawer.links.saveYoutubeAudio or 'Save YouTube Audio' }}</a>
```

### 3. i18n data (`_templates/_data/i18n/en.json`)
Thêm labels vào `nav`, `drawer.links`, và `footer.nav`:
```json
"nav": { "saveYoutubeAudio": "Save YouTube Audio" },
"drawer": { "links": { "saveYoutubeAudio": "Save YouTube Audio" } },
"footer": { "nav": { "saveYoutubeAudio": "Save YouTube Audio" } }
```

### 4. Footer CSS (`src/styles/layout/footer.css`)
Đảm bảo có styles cho `.footer-nav`:
```css
.footer-nav { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px 20px; padding: 10px 0 0; }
.footer-nav a { color: rgba(255, 255, 255, 0.85); text-decoration: none; font-size: 14px; }
.footer-nav a:hover { color: #fff; text-decoration: underline; }
```

---

## KHÔNG SỬA (giữ nguyên)

- `src/libs/firebase/firebase-config.ts` — dùng chung Firebase project
- `src/features/trustpilot/` — config riêng sau
- `src/environment.ts` — API endpoints dùng chung
- `index.html` ở root app — **file generated từ template**, chạy `npm run 11ty:build` để regenerate

---

## Bước 4: Tạo static legal/info pages

⚠️ **Nếu data folder thiếu các trang about/contact/copyright/privacy-policy/terms-of-use, phải tạo thủ công.**

### 4a. Tạo 5 file HTML thuần ở root app:

```
about.html
contact.html
copyright.html
privacy-policy.html
terms-of-use.html
```

Pattern: copy từ `apps/ytsss.com/` rồi thay `YTSSS` → `{BRAND}`, `ytsss.com` → `{DOMAIN}`, `meta.ytsss@gmail.com` → email mới.

Cần có CSS: `src/styles/features/text-page.css` — copy từ `apps/ytsss.com/src/styles/features/text-page.css` nếu chưa có.

### 4b. Thêm legal nav vào `_templates/_includes/footer.njk`:

```njk
<nav class="footer-nav footer-nav--legal" aria-label="Legal navigation">
    <a href="/about">{{ base.footer.legal.about or 'About' }}</a>
    <a href="/contact">{{ base.footer.legal.contact or 'Contact' }}</a>
    <a href="/copyright">{{ base.footer.legal.copyright or 'Copyright &amp; DMCA' }}</a>
    <a href="/privacy-policy">{{ base.footer.legal.privacyPolicy or 'Privacy Policy' }}</a>
    <a href="/terms-of-use">{{ base.footer.legal.termsOfUse or 'Terms of Use' }}</a>
</nav>
```

Đặt **trước** dòng `<div class="copyright">`.

---

## Bước 5: vite.config.ts

Cập nhật `staticPages` — bao gồm tất cả file `.html` thực tế ở root (kể cả legal pages):

```ts
const staticPages = ['404', 'license', 'reset-key', 'about', 'contact', 'copyright', 'privacy-policy', 'terms-of-use'];
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
### Note: chú ý là nhớ xóa config trong src\libs\firebase\firebase-config.ts

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
- [ ] Tạo legal/info pages: about, contact, copyright, privacy-policy, terms-of-use (copy từ ytsss.com, thay brand/domain/email)
- [ ] Copy `src/styles/features/text-page.css` từ ytsss.com nếu chưa có
- [ ] Thêm legal nav vào footer.njk (trước dòng copyright)
- [ ] Thêm navigation: footer.njk tool links, header.njk drawer, i18n/en.json, footer.css
- [ ] Dọn dead links: i18n, header.njk, 404.html
- [ ] Update vite.config.ts staticPages (bao gồm cả 5 legal pages)
- [ ] Thêm vào ci.yml (6 chỗ) — **thảo luận trước**
- [ ] Thêm vào deploy-manual.yml (2 chỗ) — **thảo luận trước**
- [ ] Rebuild templates và verify không còn old references
