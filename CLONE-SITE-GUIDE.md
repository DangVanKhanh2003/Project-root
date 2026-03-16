# Clone Site Guide — Tạo site mới từ site có sẵn trong monorepo

Hướng dẫn cho AI khi cần tạo một app mới (ví dụ `newsite.com`) bằng cách clone từ app có sẵn (ví dụ `ytmp4.gg`).

## Quy trình tổng quan

1. Copy thư mục app nguồn → `apps/newsite.com/`
2. Xóa files thừa trước khi rebrand
3. Rebrand toàn bộ references
4. Dọn dead links trong templates/HTML
5. Cập nhật vite.config.ts staticPages
6. Thêm app mới vào GitHub workflows
7. Rebuild templates để verify

---

## Bước 1: Copy và xóa files thừa

```bash
cp -r apps/source-site apps/newsite.com
```

**Xóa ngay:**
- `node_modules/`, `dist/`, `_11ty-output/`, `pages/` (generated outputs)
- `docs/`, `doc_important/` (tài liệu cũ của site nguồn)
- Các file `.md` ở root và trong `_templates/` (BUILD-GUIDE.md, README.md, STATUS_REPORT.md, v.v.)
- Các file `.md` trong `src/` (comparison docs, prompt docs)
- `update_data.cjs` (utility cũ)
- `.claude/`, `.agent/` (AI context cũ)
- `logs/` (SEO check logs cũ)

**Xóa pages không cần:**
- Các file HTML ở root mà site mới không dùng (about.html, contact.html, faq.html, v.v.)
- Các thư mục page data trong `_templates/_data/pages/` mà không cần (chỉ giữ `index/`)
- Các template pages trong `_templates/pages/` mà không cần

---

## Bước 2: Rebrand — Danh sách files cần sửa

### Config files
| File | Thay đổi |
|------|----------|
| `package.json` | `"name"` |
| `.eleventy.cjs` | `site.url` |
| `public/robots.txt` | Sitemap URL |
| `vite-plugin-sitemap.ts` | Fallback `baseUrl` |

### Template data (sẽ rebuild HTML)
| File | Thay đổi |
|------|----------|
| `_templates/_data/i18n/en.json` | Logo text, copyright, drawer links |
| `_templates/_data/pages/index/en.json` | SEO title/description, h1, brand name trong content |
| `_templates/_data/site.json` (nếu có) | url, name, description |

### Template files (.njk)
| File | Thay đổi |
|------|----------|
| `_templates/_includes/header.njk` | Logo text, aria-labels, dead links |
| `_templates/_includes/footer.njk` | Dead links |
| `_templates/_includes/json-ld.njk` | Organization name, logo URL, email |
| `_templates/_includes/base.njk` | localStorage key trong inline script |
| `_templates/_includes/partials/hero-form.njk` | localStorage key trong inline script |

### Source code
| File | Thay đổi |
|------|----------|
| `src/utils/storage-keys.ts` | `PREFIX` constant |
| `src/api/index.ts` | `createNamespacedKey()` namespace |
| `src/features/download-limit.ts` | `LICENSE_KEY_STORAGE_KEY` + comment header |
| `src/features/license/license-token.ts` | `INTEGRITY_SALT` + comment header + storage key comments |
| `src/features/allowed-features.ts` | Comments |
| `src/features/feature-limit-policy.ts` | Comment header |
| `src/features/paywall-popup.ts` | Comment header |
| `src/main.ts` | Comment header |
| `public/api-logger.worker.js` | IndexedDB `dbName` |
| `src/styles/features/license-page.css` | Comment header |
| `src/styles/features/reset-key.css` | Comment header |
| `src/styles/overrides/ui-components.css` | Comment header |
| `src/styles/reusable-packages/video-info-card/video-info-card.css` | Comment header |

### Static HTML (không qua template, sửa trực tiếp)
| File | Thay đổi |
|------|----------|
| `404.html` | title, logo text, aria-labels, drawer links, footer links, copyright |
| `license.html` | title, meta tags, canonical URL, OG tags, JSON-LD, logo text |
| `reset-key.html` | title, meta description, logo text |

### KHÔNG sửa (giữ nguyên)
- `src/libs/firebase/firebase-config.ts` — dùng chung Firebase project hoặc config riêng sau
- `src/features/trustpilot/` — URL Trustpilot riêng hoặc tắt feature sau
- `src/environment.ts` — API endpoints dùng chung
- `index.html` — file này được **generate từ template**, không sửa tay. Chạy `npm run 11ty:build` để regenerate

### rebrand.cjs
Cập nhật file `rebrand.cjs` với replacements mới để dùng cho tương lai. Pattern order quan trọng — specific trước, generic sau:
```js
const replacements = [
    { match: /oldsite\.gg/g, replace: 'newsite.com' },
    { match: /OLDSITE\.gg/g, replace: 'NewSite' },
    { match: /OLDSITE/g, replace: 'NewSite' },
    { match: /oldsite/g, replace: 'newsite' },
];
```

---

## Bước 3: Dọn dead links

Nếu site mới chỉ có ít pages (ví dụ chỉ có index), cần dọn:

**i18n/en.json:**
- Xóa nav links đến pages không tồn tại
- Xóa drawer links đến pages không tồn tại
- Xóa footer linksRow1 + linksRow2 nếu pages không tồn tại
- Giữ: logoText, hero (form UI), copyright, strim (nếu có video cutter)

**Template files:**
- `header.njk` — xóa drawer nav links dead
- `footer.njk` — xóa footer links dead
- `404.html` — xóa drawer + footer links dead (file này không qua template)

---

## Bước 4: vite.config.ts

Cập nhật mảng `staticPages` — chỉ giữ các pages có file HTML tương ứng ở root:

```ts
// Kiểm tra files thực tế tồn tại
const staticPages = ['404', 'license', 'reset-key'];
// Chỉ thêm vào nếu file .html tương ứng tồn tại ở root
```

Cũng kiểm tra `excludedPageNames` — xóa entries không liên quan.

---

## Bước 5: GitHub Workflows

### `.github/workflows/ci.yml`
Thêm 6 chỗ:
1. **workflow_dispatch options** — thêm app name vào dropdown `specific_app`
2. **paths-filter** — thêm filter rule: `newsite.com: - 'apps/newsite.com/**'`
3. **ALL_APPS** — thêm vào JSON array
4. **Detect changes block** — thêm if block check `steps.filter.outputs`
5. **Deploy job** — thêm job `deploy-newsite-com` (copy pattern từ job khác)
6. **Summary job** — thêm vào `needs` array + table row

### `.github/workflows/deploy-manual.yml`
Thêm 2 chỗ:
1. **workflow_dispatch options** — thêm app name
2. **case block** — thêm config (directory, filter_path, domain)

### Domain variable
Set `vars.NEWSITE_DOMAIN` trên GitHub repo settings, hoặc dùng fallback trong workflow.

---

## Bước 6: Verify

```bash
cd apps/newsite.com

# 1. Rebuild templates
npm run 11ty:build

# 2. Check index.html đã được regenerate với brand mới
grep -i "oldsite" index.html  # Không nên có kết quả

# 3. Full build
npm run build

# 4. Search toàn bộ cho references cũ (ngoại trừ firebase/trustpilot nếu skip)
grep -ri "oldsite" --include="*.ts" --include="*.json" --include="*.html" --include="*.njk" --include="*.css" --include="*.cjs" . | grep -v node_modules | grep -v firebase | grep -v trustpilot
```

---

## Checklist tóm tắt

- [ ] Copy source → target, xóa generated/docs/logs
- [ ] Xóa HTML pages + template data pages không cần
- [ ] Rebrand: package.json, .eleventy.cjs, robots.txt, vite-plugin-sitemap.ts
- [ ] Rebrand: i18n/en.json, pages/index/en.json
- [ ] Rebrand: header.njk, footer.njk, json-ld.njk, base.njk, hero-form.njk
- [ ] Rebrand: storage-keys.ts, api/index.ts, download-limit.ts, license-token.ts
- [ ] Rebrand: main.ts, allowed-features.ts, feature-limit-policy.ts, paywall-popup.ts
- [ ] Rebrand: api-logger.worker.js, CSS comment headers
- [ ] Rebrand: 404.html, license.html, reset-key.html
- [ ] Dọn dead links: i18n, header.njk, footer.njk, 404.html
- [ ] Update vite.config.ts staticPages
- [ ] Update rebrand.cjs
- [ ] Update ci.yml (6 chỗ)
- [ ] Update deploy-manual.yml (2 chỗ)
- [ ] Rebuild và verify không còn old references
