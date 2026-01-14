# 📘 HƯỚNG DẪN CLONE PROJECT MỚI - NO CODE VERSION

## MỤC LỤC

1. [Tổng Quan Chiến Lược](#1-tổng-quan-chiến-lược)
2. [Chuẩn Bị Trước Khi Clone](#2-chuẩn-bị-trước-khi-clone)
3. [Các File Cần Copy](#3-các-file-cần-copy)
4. [Các File Cần Tạo Mới](#4-các-file-cần-tạo-mới)
5. [HTML Structure Requirements](#5-html-structure-requirements)
6. [CSS Organization](#6-css-organization)
7. [Customization Points](#7-customization-points)
8. [Step-by-Step Workflow](#8-step-by-step-workflow)
9. [Testing Checklist](#9-testing-checklist)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. TỔNG QUAN CHIẾN LƯỢC

### 1.1 Nguyên Tắc Copy Tối Đa

**Mục Tiêu**: Copy 85% download core logic, chỉ customize 15% theme và sections

**Tỉ Lệ Phân Chia**:
```
┌─────────────────────────────────────┐
│ COPY 100% (Không đổi)      → 70%   │
│ COPY + CUSTOMIZE           → 15%   │
│ VIẾT MỚI                   → 15%   │
└─────────────────────────────────────┘
```

### 1.2 Lợi Ích

- ⚡ **Tốc độ**: 4-6 giờ thay vì 1-2 ngày
- ✅ **Chất lượng**: Download core đã tested kỹ
- 🎨 **Linh hoạt**: Theme và sections hoàn toàn tự do
- 🔒 **Bảo trì**: Bug fixes trong core tự động áp dụng cho tất cả sites

### 1.3 Chiến Lược Chống Google Duplicate

**Giống Nhau** (Ẩn trong JavaScript):
- Download logic và API calls
- State management
- Error handling
- Performance optimizations

**Khác Nhau** (Visible cho Google):
- Theme colors (primary, secondary, accents)
- Typography và spacing
- HTML structure của hero/features/FAQ
- Section layouts
- Images và assets
- SEO metadata

---

## 2. CHUẨN BỊ TRƯỚC KHI CLONE

### 2.1 Checklist Chuẩn Bị

**Design Assets**:
- [ ] Logo files (PNG, SVG)
- [ ] Favicon (multiple sizes: 16x16, 32x32, 48x48, 96x96, 180x180)
- [ ] Social preview images (Open Graph, Twitter Card)
- [ ] Section illustrations/background images
- [ ] Platform icons (nếu khác)

**Branding Guidelines**:
- [ ] Primary color (hex code)
- [ ] Secondary color
- [ ] Accent colors
- [ ] Font family (Google Fonts hoặc local)
- [ ] Border radius style (rounded/sharp)
- [ ] Spacing scale preferences

**Content**:
- [ ] Site name và tagline
- [ ] SEO metadata (title, description cho mỗi page)
- [ ] Hero section content
- [ ] Features section content
- [ ] FAQ content (questions + answers)
- [ ] Footer links và legal pages

**Technical**:
- [ ] Project name (không có spaces, lowercase)
- [ ] Domain name (nếu có)
- [ ] Subdomain cho API (nếu khác yt1s-test)

### 2.2 Tools Cần Thiết

- Terminal/Command Line
- Code editor (VS Code recommended)
- Browser DevTools
- Node.js & PNPM installed
- Git (optional)

---

## 3. CÁC FILE CẦN COPY

### 3.1 JavaScript/TypeScript Core (100% Copy)

**Thư Mục COPY NGUYÊN BẢN**:

```
apps/yt1s-test/src/
├── api/
│   └── index.ts
├── features/
│   └── downloader/
│       ├── state/           (9 files - state management)
│       ├── logic/           (6 files - controllers)
│       ├── ui-render/       (5 files - renderers)
│       └── downloader-ui.ts (orchestrator)
├── ui-components/
│   ├── modal/               (2 files)
│   ├── progress-bar/        (1 file)
│   ├── search-result-card/  (1 file)
│   └── suggestion-dropdown/ (1 file)
├── loaders/
│   └── css-loader.ts
├── utils/
│   └── (all .ts files)
├── constants/
│   └── (all .ts files)
└── main.ts
```

**Lưu Ý**:
- ⚠️ File `api/index.ts`: Chỉ cần sửa 1 dòng (namespace)
- ✅ Các file khác: KHÔNG CHẠM VÀO

### 3.2 CSS - Reusable Packages (100% Copy)

**Thư Mục COPY NGUYÊN BẢN**:

```
apps/yt1s-test/src/styles/reusable-packages/
├── skeleton/
│   └── skeleton.css
├── suggestions/
│   └── suggestions.css
├── search-results/
│   └── search-results.css
├── captcha-modal/
│   └── captcha-modal.css
├── conversion-modal/
│   └── conversion-modal.css
└── expire-modal/
    └── expire-modal.css
```

**Exception**: File `package-root.css` - COPY nhưng phải CUSTOMIZE

### 3.3 CSS - Download Core (100% Copy)

**Files PHẢI COPY**:

```
apps/yt1s-test/src/styles/
├── reset.css                     (browser normalization)
├── base.css                      (design tokens - có thể customize)
├── common.css                    (header/footer - có thể customize)
│
├── critical/
│   └── download-layout.css       (download form layout - BẮT BUỘC)
│
└── features/
    ├── content-messages.css      (error/success messages)
    ├── convert-indicator.css     (conversion status indicators)
    ├── convert-sidebar.css       (format selection sidebar)
    ├── download-options.css      (download buttons & options)
    ├── mobile-download.css       (mobile-specific UI)
    ├── gallery.css               (multi-file gallery)
    ├── smooth-progress.css       (progress bars)
    └── section-shared.css        (shared utilities)
```

**Tổng**: 11 CSS files download core

### 3.4 Build Configuration (Copy + Update)

**Files COPY**:

```
apps/yt1s-test/
├── vite.config.ts               (⚠️ update paths nếu cần)
├── vite-plugin-html-rewrite.ts  (100% copy)
├── vite-plugin-move-pages.ts    (100% copy)
├── tsconfig.json                (100% copy)
├── package.json                 (⚠️ đổi name field)
├── remove-console-logs.ts       (100% copy)
└── .env                         (⚠️ tạo mới nếu có)
```

### 3.5 Directory Structure To Copy

**Public Assets Structure** (copy cấu trúc, không copy assets):

```
apps/yt1s-test/public/
└── assest/
    ├── img-social/      (thay images mới)
    ├── section-img/     (thay images mới)
    └── social-icon/     (có thể giữ hoặc thay)
```

---

## 4. CÁC FILE CẦN TẠO MỚI

### 4.1 HTML Pages (100% Viết Mới)

**Files Cần Tạo**:

```
apps/new-project/
├── index.html                        (root landing page)
└── src/page/
    ├── youtube-downloader.html
    ├── tiktok-downloader.html
    ├── instagram-downloader.html
    ├── facebook-downloader.html
    ├── x-downloader.html
    ├── youtube-to-mp3.html
    ├── youtube-to-mp4.html
    ├── youtube-short-downloader.html
    ├── 404.html
    ├── privacy-policy.html
    └── terms-of-service.html
```

**Yêu Cầu**:
- SEO metadata khác hoàn toàn
- Hero section design khác
- Features/FAQ/How-to content khác
- **NHƯNG**: Phải chứa download core HTML anchors (xem phần 5)

### 4.2 CSS - Site-Specific (Viết Mới)

**Files Cần Tạo**:

```
apps/new-project/src/styles/
├── critical/
│   └── hero.css              (hero section above-the-fold)
│
└── features/
    ├── faq.css               (FAQ accordion)
    ├── features-section.css  (features grid/list)
    ├── footer.css            (footer styling)
    ├── how-to.css            (how-to steps)
    ├── platforms.css         (platform cards)
    └── legal-spacing.css     (legal pages - optional)
```

**Tổng**: 6-7 CSS files site-specific

### 4.3 Public Assets (Thay Mới)

**Assets Cần Tạo/Thay**:

```
apps/new-project/public/
├── favicon.ico
├── favicons/
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon-48x48.png
│   ├── favicon-96x96.png
│   └── apple-touch-icon.png
├── logo.png
└── assest/
    ├── img-social/
    │   ├── og-image.jpg          (1200x630px)
    │   └── twitter-card.jpg      (1200x600px)
    └── section-img/
        ├── intro-img.svg
        ├── who-choose-we.webp
        └── (responsive variants)
```

---

## 5. HTML STRUCTURE REQUIREMENTS

### 5.1 HTML Anchors Bắt Buộc

JavaScript cần các HTML elements với **ID CHÍNH XÁC** để render. Thiếu 1 ID sẽ khiến download không hoạt động.

**Danh Sách IDs Bắt Buộc**:

| ID | Element Type | Mục Đích | Bắt Buộc? |
|---|---|---|---|
| `downloadForm` | form | Container cho download form | ✅ CỰC KỲ QUAN TRỌNG |
| `videoUrl` | input[type="text"] | Input field nhập URL/keyword | ✅ CỰC KỲ QUAN TRỌNG |
| `input-action-button` | button | Paste/Clear button | ✅ CỰC KỲ QUAN TRỌNG |
| `suggestion-container` | div | Container cho suggestions dropdown | ✅ CỰC KỲ QUAN TRỌNG |
| `submit-button` | button | Submit button (hoặc button[type="submit"]) | ✅ CỰC KỲ QUAN TRỌNG |
| `error-message` | div | Error message display | ✅ CỰC KỲ QUAN TRỌNG |
| `content-area` | div | Dynamic content rendering area | ✅ CỰC KỲ QUAN TRỌNG |
| `search-results-section` | section | Search results section wrapper | ✅ Nếu có search |
| `search-results-container` | div | Search results grid container | ✅ Nếu có search |
| `progressBarWrapper` | div | Global progress bar wrapper | ✅ CỰC KỲ QUAN TRỌNG |

**Lưu Ý**:
- IDs phải CHÍNH XÁC, không được sai 1 ký tự
- Class names có thể thay đổi (dùng cho CSS styling)
- Thứ tự elements không quan trọng, miễn có đủ IDs

### 5.2 HTML Structure Pattern

**Minimal Required Structure** (pattern structure, không phải code):

```
BODY
  ├─ HERO SECTION (tự do design)
  │   └─ FORM#downloadForm
  │       ├─ INPUT#videoUrl
  │       ├─ DIV#suggestion-container
  │       ├─ BUTTON#input-action-button
  │       └─ BUTTON#submit-button (hoặc button[type=submit])
  │
  ├─ DIV#error-message
  ├─ DIV#content-area
  │
  ├─ SECTION#search-results-section
  │   └─ DIV#search-results-container
  │
  ├─ [CÁC SECTIONS TỰ DO - intro, platforms, features, faq, etc.]
  │
  └─ DIV#progressBarWrapper (cuối body)
```

### 5.3 HTML Attributes Bắt Buộc

**Input Field (videoUrl)**:
- `type="text"`
- `autocomplete="off"`
- `aria-expanded="false"`
- `aria-owns="suggestion-container"`
- `role="combobox"`
- `required`

**Suggestion Container**:
- `role="region"`
- `aria-label="Search suggestions"`
- `aria-live="polite"`

**Error Message**:
- `role="alert"`

**Content Area**:
- `aria-live="polite"`

**Search Results Section**:
- `style="display: none;"` (initially hidden)

**Progress Bar Wrapper**:
- `style="visibility: hidden; opacity: 0;"` (initially hidden)

### 5.4 Class Names Recommendations

Mặc dù class names không bắt buộc, nhưng nên giữ các class names này cho CSS styling:

**Form Structure**:
- `.download-form` - Form wrapper
- `.input-wrapper` - Input container
- `.input-container` - Input + buttons container
- `.download-input` - Input field
- `.input-action-btn` - Paste/Clear button
- `.download-btn` - Submit button

**Content Areas**:
- `.error-message` - Error styling
- `.content-area` - Content wrapper
- `.search-results-section` - Search section
- `.search-results-container` - Results grid

---

## 6. CSS ORGANIZATION

### 6.1 CSS Loading Strategy

**3 Loại CSS**:

```
┌────────────────────────────────────┐
│ 1. CRITICAL CSS (Inline in <head>)│
│    - Above-the-fold styles         │
│    - Hero section                  │
│    - Download form layout          │
│    - Max: 10KB                     │
├────────────────────────────────────┤
│ 2. FEATURE CSS (Lazy-loaded)      │
│    - Below-the-fold sections       │
│    - Download core UI              │
│    - Modals, progress bars         │
├────────────────────────────────────┤
│ 3. REUSABLE PACKAGES (Lazy)       │
│    - Suggestions dropdown          │
│    - Search results cards          │
│    - CAPTCHA modal                 │
│    - Conversion modal              │
└────────────────────────────────────┘
```

### 6.2 CSS File Organization Map

**Directory Structure**:

```
src/styles/
│
├─ FOUNDATION (Copy + Optional Customize)
│   ├── reset.css               [2.3 KB] Browser normalization
│   ├── base.css                [20 KB] Design tokens, typography
│   └── common.css              [24 KB] Header, footer, navbar
│
├─ CRITICAL (Inline in <head>)
│   ├── download-layout.css     [COPY] Form layout
│   └── hero.css                [NEW] Hero section
│
├─ FEATURES (Lazy-loaded)
│   │
│   ├─ DOWNLOAD CORE (Copy 100%)
│   │   ├── content-messages.css      [10.7 KB] Error/success
│   │   ├── convert-indicator.css     [4.5 KB] Status indicators
│   │   ├── convert-sidebar.css       [10.7 KB] Format selection
│   │   ├── download-options.css      [13.9 KB] Download buttons
│   │   ├── mobile-download.css       [10.3 KB] Mobile UI
│   │   ├── gallery.css               [23 KB] Multi-file gallery
│   │   ├── smooth-progress.css       [4.9 KB] Progress bars
│   │   └── section-shared.css        [4.9 KB] Utilities
│   │
│   └─ SITE-SPECIFIC (Viết mới)
│       ├── faq.css               [NEW] FAQ accordion
│       ├── features-section.css  [NEW] Features grid
│       ├── footer.css            [NEW] Footer
│       ├── how-to.css            [NEW] How-to steps
│       ├── platforms.css         [NEW] Platform cards
│       └── legal-spacing.css     [NEW] Legal pages
│
└─ REUSABLE-PACKAGES (Copy + Theme)
    ├── package-root.css          [CUSTOMIZE] Theme system
    ├── skeleton/                 [COPY] Loading skeletons
    ├── suggestions/              [COPY] Suggestions dropdown
    ├── search-results/           [COPY] Search result cards
    ├── captcha-modal/            [COPY] CAPTCHA UI
    ├── conversion-modal/         [COPY] Conversion progress
    └── expire-modal/             [COPY] Link expiration
```

**Tổng**:
- Copy: 19 files (~150 KB)
- Customize: 4 files (~50 KB)
- Viết mới: 6-7 files (~30 KB)

### 6.3 CSS Dependencies Chart

```
package-root.css (MUST LOAD FIRST)
    ↓
    ├─→ skeleton.css
    ├─→ suggestions.css
    ├─→ search-results.css
    ├─→ captcha-modal.css
    ├─→ conversion-modal.css
    └─→ expire-modal.css

base.css
    ↓
    └─→ All feature CSS files

download-layout.css (critical)
    ↓
    └─→ download-options.css
        ├─→ convert-sidebar.css
        ├─→ gallery.css
        └─→ mobile-download.css
```

**Import Order Bắt Buộc**:
1. `package-root.css` (nếu dùng packages)
2. `reset.css`
3. `base.css`
4. `common.css`
5. Critical CSS (inline)
6. Feature CSS (lazy-load)
7. Package CSS (lazy-load)

---

## 7. CUSTOMIZATION POINTS

### 7.1 Theme Customization (package-root.css)

**File**: `src/styles/reusable-packages/package-root.css`

**Variables Cần Đổi**:

| Category | Variables | Example Values |
|---|---|---|
| **Primary Colors** | `--pkg-color-primary` | `#9333ea` (purple) |
| | `--pkg-color-on-primary` | `#ffffff` |
| | `--pkg-color-primary-container` | `#e9d5ff` |
| **Spacing** | `--pkg-space-4` | `18px` (default: 16px) |
| | `--pkg-space-6` | `26px` (default: 24px) |
| **Border Radius** | `--pkg-radius-md` | `14px` (default: 12px) |
| | `--pkg-radius-lg` | `18px` (default: 16px) |
| **Typography** | `--pkg-font-size-base` | `0.9375rem` (15px) |

**Impact**: Đổi 1 file này → Tất cả packages (modals, buttons, cards) tự động update theme

### 7.2 Base CSS Customization (Optional)

**File**: `src/styles/base.css`

**Variables Có Thể Đổi**:

| Category | Variables | Purpose |
|---|---|---|
| **Colors** | `--color-primary` | Primary brand color |
| | `--color-primary-dark` | Darker variant |
| **Fonts** | `--font-family-primary` | Main font family |
| | `--font-family-display` | Heading font |
| **Spacing** | `--space-unit` | Base spacing unit |

**Lưu Ý**: Nên match với `package-root.css` để consistency

### 7.3 Namespace Customization

**File**: `src/api/index.ts`

**Dòng Cần Sửa**: Line 92

**Pattern**: Tìm dòng có `createNamespacedKey` và đổi tên project

**Ví Dụ**:
- yt1s-test → Namespace: `'yt1s-test'`
- purple-dl → Namespace: `'purple-dl'`
- site2 → Namespace: `'site2'`

**Mục Đích**: JWT storage isolation giữa các sites

### 7.4 Environment Configuration (Optional)

**File**: `src/environment.ts`

**Có Thể Đổi**:

| Function | Purpose | When to Change |
|---|---|---|
| `getApiBaseUrl()` | API V1 endpoint | Nếu dùng subdomain riêng |
| `getApiBaseUrlV2()` | API V2 endpoint | Rarely |
| `getSearchV2BaseUrl()` | Search API | Rarely |

**Default**: Dùng chung API với yt1s-test (recommended)

---

## 8. STEP-BY-STEP WORKFLOW

### Phase 1: Copy & Setup (30 phút)

**Step 1: Copy Project Structure**
- Mở terminal
- Navigate tới `apps/` directory
- Copy folder `yt1s-test` → `new-project`
- Rename folder thành tên project mới

**Step 2: Clean Site-Specific Files**
- Xóa tất cả HTML files (index.html, src/page/*.html)
- Xóa site-specific CSS:
  - `src/styles/critical/hero.css`
  - `src/styles/features/faq.css`
  - `src/styles/features/features-section.css`
  - `src/styles/features/footer.css`
  - `src/styles/features/how-to.css`
  - `src/styles/features/platforms.css`
  - `src/styles/features/legal-spacing.css`
- Xóa assets cũ:
  - `public/assest/img-social/*`
  - `public/assest/section-img/*`
  - `public/favicon.ico`
- Xóa build artifacts:
  - `node_modules/`
  - `dist/`

**Step 3: Update Configuration**
- Mở `package.json`
  - Đổi field `name` thành tên project mới
  - Verify dependencies (không thay đổi)
- Mở `src/api/index.ts`
  - Tìm dòng `createNamespacedKey`
  - Đổi tên project trong namespace

---

### Phase 2: Theme Customization (1-2 giờ)

**Step 4: Design Theme System**
- Chuẩn bị color palette:
  - Primary color (hex code)
  - Primary container color (lighter variant)
  - On-primary color (text color on primary)
- Chọn spacing scale (nếu muốn đổi)
- Chọn border radius style

**Step 5: Update package-root.css**
- Mở `src/styles/reusable-packages/package-root.css`
- Tìm section "Primary Color System"
- Thay đổi:
  - `--pkg-color-primary`
  - `--pkg-color-on-primary`
  - `--pkg-color-primary-container`
  - `--pkg-color-on-primary-container`
- (Optional) Đổi spacing/radius values
- Save file

**Step 6: Update base.css (Optional)**
- Mở `src/styles/base.css`
- Tìm `:root` CSS variables
- Match colors với package-root.css
- (Optional) Đổi font families

**Step 7: Test Theme**
- Run `pnpm install`
- Run `pnpm run dev`
- Tạo temporary HTML file để test colors
- Verify modals/buttons có màu mới

---

### Phase 3: HTML Pages (2-3 giờ)

**Step 8: Create index.html**
- Tạo file mới `index.html` ở root
- Copy HTML structure pattern từ section 5.2
- Thiết kế hero section mới
- **BẮT BUỘC**: Embed download core HTML với đúng IDs
- Thêm content areas (content-area, search-results-section)
- Thêm progressBarWrapper ở cuối body

**Step 9: Create Page Templates**
- Tạo folder `src/page/` (nếu chưa có)
- Tạo các HTML files:
  - `youtube-downloader.html`
  - `tiktok-downloader.html`
  - `instagram-downloader.html`
  - `facebook-downloader.html`
  - `x-downloader.html`
  - `youtube-to-mp3.html`
  - `youtube-to-mp4.html`
  - `youtube-short-downloader.html`
  - `404.html`
  - `privacy-policy.html`
  - `terms-of-service.html`

**Step 10: Write New Sections**
- Design intro section HTML
- Design platforms section HTML
- Design features section HTML
- Design how-to section HTML
- Design FAQ section HTML
- Design footer HTML

**Step 11: Update SEO Metadata**
- Mỗi HTML file phải có unique:
  - `<title>` tag
  - `<meta name="description">`
  - Open Graph tags
  - Twitter Card tags
  - Canonical URL
- Update structured data (Schema.org JSON-LD)

---

### Phase 4: Critical CSS (1 giờ)

**Step 12: Write hero.css**
- Tạo `src/styles/critical/hero.css`
- Write mobile-first styles cho hero section
- Include download form container styles
- Keep file size < 5KB (critical CSS budget)

**Step 13: Optimize Critical CSS**
- Chỉ include above-the-fold styles
- Remove hover effects (lazy-load)
- Remove animations (lazy-load)
- Inline trong `<head>` sau này

---

### Phase 5: Feature CSS (2-3 giờ)

**Step 14: Write Site-Specific CSS**
- Tạo `src/styles/features/faq.css`
  - Mobile-first breakpoints
  - Match theme colors từ package-root.css
- Tạo `features-section.css`
- Tạo `footer.css`
- Tạo `how-to.css`
- Tạo `platforms.css`
- Tạo `legal-spacing.css` (nếu cần)

**Step 15: Follow Mobile-First Pattern**
- Mỗi CSS file phải có header breakpoints
- Start với mobile base (0-350px)
- Progressive enhancement lên desktop/2K/4K
- Chỉ dùng `@media (min-width: ...)`, KHÔNG `max-width`

---

### Phase 6: Assets (30 phút - 1 giờ)

**Step 16: Prepare Assets**
- Optimize images:
  - Convert to WebP
  - Create responsive variants (480w, 720w, 1440w)
  - Compress với tools (TinyPNG, Squoosh)
- Generate favicons:
  - Multiple sizes (16, 32, 48, 96, 180)
  - Use favicon generator tools
- Create social preview images:
  - Open Graph: 1200x630px
  - Twitter Card: 1200x600px

**Step 17: Upload Assets**
- Copy logo files vào `public/`
- Copy favicons vào `public/favicons/`
- Copy social images vào `public/assest/img-social/`
- Copy section images vào `public/assest/section-img/`

---

### Phase 7: Testing (1-2 giờ)

**Step 18: Install Dependencies**
- Run `pnpm install` từ project root
- Verify no errors

**Step 19: Development Testing**
- Run `pnpm run dev`
- Open browser `http://localhost:5173`
- Test download form:
  - Paste YouTube URL
  - Check suggestions dropdown
  - Submit form
  - Verify results render
  - Test download buttons
- Test search functionality
- Test all pages (navigation)

**Step 20: Responsive Testing**
- Test on multiple viewports:
  - Mobile (375px - iPhone)
  - Tablet (768px - iPad)
  - Desktop (1440px)
  - 2K (1920px)
  - 4K (2560px)
- Use browser DevTools responsive mode
- Verify no horizontal scroll
- Check text readability

**Step 21: Cross-Browser Testing**
- Chrome (primary)
- Firefox
- Safari (iOS)
- Edge

---

### Phase 8: Build & Deploy (30 phút)

**Step 22: Production Build**
- Run `pnpm run build`
- Check build output:
  - No errors
  - Critical CSS < 10KB
  - Total bundle size reasonable
- Test preview: `pnpm run preview`

**Step 23: Performance Audit**
- Open Chrome DevTools Lighthouse
- Run audit (desktop + mobile)
- Check metrics:
  - LCP < 2.5s
  - CLS < 0.1
  - TBT < 200ms
- Fix issues nếu có

**Step 24: Final Checklist**
- [ ] All pages load without errors
- [ ] Download functionality works
- [ ] Theme colors applied correctly
- [ ] Responsive on all breakpoints
- [ ] SEO metadata unique per page
- [ ] Assets optimized
- [ ] Performance budgets met

---

## 9. TESTING CHECKLIST

### 9.1 Functional Testing

**Download Core**:
- [ ] Input field accepts URL paste
- [ ] Paste button works
- [ ] Clear button appears when input has value
- [ ] Suggestions dropdown shows for keywords
- [ ] Submit button triggers download flow
- [ ] Error messages display correctly
- [ ] Loading states show properly
- [ ] Results render in content-area
- [ ] Download options display (video/audio tabs)
- [ ] Download buttons work
- [ ] Progress bars show during conversion
- [ ] Multi-file gallery works (if applicable)
- [ ] Bulk download works (if applicable)

**Navigation**:
- [ ] All internal links work
- [ ] Navbar responsive menu works
- [ ] Platform navigation links work
- [ ] Footer links work

**Content**:
- [ ] All images load
- [ ] Videos/iframes work (if any)
- [ ] FAQ accordion expands/collapses
- [ ] Smooth scroll works (if implemented)

### 9.2 Visual Testing

**Theme**:
- [ ] Primary color applied to buttons
- [ ] Primary color in modals
- [ ] Primary color in progress bars
- [ ] Consistent spacing throughout
- [ ] Border radius consistent
- [ ] Typography consistent

**Responsive**:
- [ ] Layout works on 350px (extra small mobile)
- [ ] Layout works on 375px (iPhone)
- [ ] Layout works on 768px (tablet)
- [ ] Layout works on 1440px (desktop)
- [ ] Layout works on 1920px (2K)
- [ ] Layout works on 2560px (4K)
- [ ] No horizontal scroll on any breakpoint
- [ ] Images responsive (srcset working)

**Accessibility**:
- [ ] Sufficient color contrast
- [ ] Focus indicators visible
- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] Alt text on images

### 9.3 Performance Testing

**Metrics**:
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] TBT < 200ms

**Assets**:
- [ ] Critical CSS < 10KB
- [ ] Initial JS < 70KB gzip
- [ ] Images optimized (WebP)
- [ ] Fonts optimized

### 9.4 SEO Testing

**Metadata**:
- [ ] Unique title per page
- [ ] Unique description per page
- [ ] Open Graph tags present
- [ ] Twitter Card tags present
- [ ] Canonical URLs correct
- [ ] Structured data valid (Schema.org)

**Content**:
- [ ] Headings hierarchy correct (H1 → H2 → H3)
- [ ] Alt text on all images
- [ ] Internal linking structure
- [ ] No broken links

---

## 10. TROUBLESHOOTING

### 10.1 Common Issues

**Issue: Download form không hoạt động**

Possible Causes:
- Thiếu HTML IDs bắt buộc
- IDs sai chính tả
- JavaScript không load

Solutions:
1. Kiểm tra console errors (F12)
2. Verify tất cả IDs bắt buộc có trong HTML
3. Check `main.ts` imported correctly
4. Verify `pnpm install` đã chạy

---

**Issue: Suggestions dropdown không hiện**

Possible Causes:
- Thiếu `#suggestion-container`
- CSS không load
- Input missing `aria-owns` attribute

Solutions:
1. Verify element với ID `suggestion-container` exists
2. Check `suggestions.css` loaded
3. Add attribute `aria-owns="suggestion-container"` to input

---

**Issue: Theme colors không áp dụng**

Possible Causes:
- `package-root.css` không load
- CSS variable names sai
- Load order sai

Solutions:
1. Verify `package-root.css` imported FIRST
2. Check variable names chính xác (e.g., `--pkg-color-primary`)
3. Inspect element in DevTools → Computed styles

---

**Issue: Responsive không hoạt động**

Possible Causes:
- Sử dụng `max-width` thay vì `min-width`
- Breakpoints sai
- Viewport meta tag thiếu

Solutions:
1. Ensure meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
2. Check CSS chỉ dùng `@media (min-width: ...)`
3. Test với DevTools responsive mode

---

**Issue: Build errors**

Possible Causes:
- TypeScript errors
- Missing dependencies
- Vite config sai

Solutions:
1. Run `pnpm install` clean install
2. Check `tsconfig.json` paths
3. Verify `vite.config.ts` input entries
4. Run `pnpm run type-check`

---

**Issue: Images không load**

Possible Causes:
- Paths sai
- Images không trong `public/`
- Build copy failed

Solutions:
1. Check image paths start với `/` (e.g., `/assest/...`)
2. Verify images trong `public/` folder
3. Check `vite.config.ts` static copy config

---

### 10.2 Debug Workflow

**Step-by-Step Debug**:

1. **Check Console**
   - Open browser DevTools (F12)
   - Console tab
   - Look for red errors

2. **Inspect Elements**
   - Right-click element → Inspect
   - Check if IDs present
   - Verify classes applied
   - Check computed styles

3. **Network Tab**
   - DevTools → Network tab
   - Reload page
   - Check if CSS/JS files loading
   - Look for 404 errors

4. **Sources Tab**
   - DevTools → Sources tab
   - Verify JavaScript files loaded
   - Set breakpoints if needed

5. **Lighthouse Audit**
   - DevTools → Lighthouse tab
   - Run audit
   - Check diagnostics section

---

### 10.3 Getting Help

**Before Asking**:
- [ ] Checked console errors
- [ ] Verified HTML IDs bắt buộc
- [ ] Confirmed CSS files loaded
- [ ] Tested on clean browser (incognito)
- [ ] Compared với yt1s-test working version

**Information To Provide**:
- Browser + version
- Console error messages (full text)
- Screenshots của issue
- Steps to reproduce
- What you already tried

---

## 📊 TIMELINE ESTIMATE

| Phase | Tasks | Time |
|---|---|---|
| **Phase 1** | Copy & Setup | 30 min |
| **Phase 2** | Theme Customization | 1-2 hrs |
| **Phase 3** | HTML Pages | 2-3 hrs |
| **Phase 4** | Critical CSS | 1 hr |
| **Phase 5** | Feature CSS | 2-3 hrs |
| **Phase 6** | Assets | 30 min - 1 hr |
| **Phase 7** | Testing | 1-2 hrs |
| **Phase 8** | Build & Deploy | 30 min |
| **TOTAL** | | **8-13 hrs** |

**Experienced Developer**: 6-8 giờ
**First-Time Cloner**: 10-13 giờ

---

## 📋 QUICK REFERENCE

### Must-Have HTML IDs

```
✅ downloadForm
✅ videoUrl
✅ input-action-button
✅ suggestion-container
✅ submit-button (or button[type=submit])
✅ error-message
✅ content-area
✅ search-results-section
✅ search-results-container
✅ progressBarWrapper
```

### Must-Copy CSS Files (11 files)

```
✅ content-messages.css
✅ convert-indicator.css
✅ convert-sidebar.css
✅ download-options.css
✅ mobile-download.css
✅ gallery.css
✅ smooth-progress.css
✅ section-shared.css
✅ download-layout.css
✅ reset.css
✅ base.css (customize colors)
```

### Must-Copy Packages (7 packages)

```
✅ skeleton/
✅ suggestions/
✅ search-results/
✅ captcha-modal/
✅ conversion-modal/
✅ expire-modal/
⚠️ package-root.css (customize theme)
```

### Must-Change Files (4 files)

```
⚠️ package.json (name field)
⚠️ src/api/index.ts (line 92 - namespace)
⚠️ package-root.css (theme colors)
⚠️ src/environment.ts (optional - API URLs)
```

---

## ✅ FINAL NOTES

### Success Criteria

Một project clone thành công khi:
- ✅ Download functionality hoạt động 100%
- ✅ Theme mới applied toàn bộ UI
- ✅ HTML structure khác yt1s-test
- ✅ SEO metadata unique
- ✅ Performance budgets met
- ✅ Responsive trên tất cả breakpoints

### Maintenance

**Khi Core Updates**:
- Sync changes từ `packages/core` → Automatic
- Sync changes từ `packages/ui-shared` → Automatic
- Sync download CSS updates → Manual copy

**Best Practices**:
- Document custom changes trong README
- Keep track of customizations
- Test sau mỗi core update
- Maintain consistent naming conventions

---

**Document Version**: 1.0
**Last Updated**: 2024
**Maintained By**: Development Team
