# UI Refactor - Lessons Learned & Best Practices

**Ngày tạo:** 2025-12-06
**Tiến trình:** 10% hoàn thành (Giai đoạn 1: CSS Refactoring)
**Mục tiêu:** Migrate UI từ `demo_ytmp3_v1.html` sang project chính, giữ nguyên JavaScript logic

---

## 📌 PROJECT VARIABLES (Thay đổi theo project của bạn)

```bash
# ===== CẤU HÌNH PROJECT =====
# Thay đổi các biến này khi copy sang project mới

# Project root path
PROJECT_ROOT="/Users/macos/Documents/work/downloader/ytmp3.gg_clone1"

# Template source (demo HTML file)
TEMPLATE_FILE="${PROJECT_ROOT}/demo_ytmp3_v1.html"

# Documentation directory
DOCS_DIR="${PROJECT_ROOT}/docs"

# Styles directory
STYLES_DIR="${PROJECT_ROOT}/src/styles"
STYLES_CRITICAL="${STYLES_DIR}/critical"
STYLES_FEATURES="${STYLES_DIR}/features"

# Script directory
SCRIPT_DIR="${PROJECT_ROOT}/src/script"

# Main files
INDEX_HTML="${PROJECT_ROOT}/index.html"
MAIN_JS="${SCRIPT_DIR}/main.js"

# CSS files (to refactor)
TOKENS_CSS="${STYLES_DIR}/tokens.css"
UTILITIES_CSS="${STYLES_DIR}/utilities.css"
COMMON_CSS="${STYLES_DIR}/common.css"
HERO_CSS="${STYLES_CRITICAL}/hero.css"

# Documentation files
LESSONS_LEARNED="${DOCS_DIR}/ui-refactor-lessons-learned.md"
PROMPT_TEMPLATE="${DOCS_DIR}/ui-refactor-prompt-template.md"
CLAUDE_MD="${PROJECT_ROOT}/CLAUDE.md"
TASK_WORKFLOW="${DOCS_DIR}/task-workflow.md"
CLS_GUIDELINES="${DOCS_DIR}/cls-guidelines.md"
COMMENT_GUIDELINES="${DOCS_DIR}/comment-guidelines.md"
```

**Cách sử dụng:**
1. Copy project sang thư mục mới
2. Thay đổi `PROJECT_ROOT` thành đường dẫn mới
3. Tất cả đường dẫn khác sẽ tự động update
4. Replace all trong file này: `ytmp3.gg_clone1` → `tên_project_mới`

---

## 🎯 Tổng Quan Dự Án

### Mục Tiêu
- **KHÔNG thay đổi JavaScript logic/UX** - chỉ thay đổi visual presentation layer
- Migrate design từ demo HTML sang project structure có sẵn
- Giữ backward compatibility với tất cả features hiện có
- Mobile-first responsive design với 7 breakpoints

### Nguyên Tắc Vàng
1. **REFACTOR TRỰC TIẾP**, không tạo file mới (tránh smell code)
2. **PRESERVE JavaScript hooks** - tất cả IDs, classes quan trọng
3. **MOBILE-FIRST** - base styles cho 0-350px, progressive enhancement
4. **VERIFY BROWSER CACHE** - luôn hard reload sau khi sửa CSS

---

## 🚨 SAI LẦM QUAN TRỌNG ĐÃ MẮC PHẢI

### 1. Tạo File CSS Mới Thay Vì Refactor Trực Tiếp
**❌ SAI:**
```bash
# Tạo file mới
touch src/styles/new-ui-header.css
touch src/styles/new-ui-hero-form.css
```

**✅ ĐÚNG:**
```bash
# Refactor trực tiếp file có sẵn
# Edit src/styles/common.css (header/footer section)
# Edit src/styles/critical/hero.css (hero section)
```

**Lý do:** Tạo file mới gây smell code, duplicate logic, khó maintain.

---

### 2. Không Xóa Override Font-Size Ở Breakpoints Trung Gian
**❌ SAI:** Để override font-size ở nhiều breakpoints
```css
/* Base */
h1 { font-size: 24px; }

/* 351px - OVERRIDE LỚN */
@media (min-width: 351px) {
  .video-input { font-size: 1.15rem; } /* 18.4px */
}

/* 600px - OVERRIDE CỰC LỚN */
@media (min-width: 600px) {
  .hero-title { font-size: 3rem; } /* 48px! */
  .hero-subtitle { font-size: 1.2rem; }
  .video-input { font-size: 1.2rem; }
}

/* 1240px - OVERRIDE KHỔNG LỒ */
@media (min-width: 1240px) {
  .hero-title { font-size: 3.75rem; } /* 60px!! */
  .input-wrapper { height: 68px; }
}

/* 2560px - OVERRIDE CỰC KHỦNG */
@media (min-width: 2560px) {
  .hero-title { font-size: 4.5rem; } /* 72px!!! */
  .hero-subtitle { font-size: 1.5rem; }
  .input-wrapper { height: 76px; }
}
```

**✅ ĐÚNG:** Chỉ set font-size ở base và main breakpoints
```css
/* Base (0-839px Mobile) */
h1 { font-size: 24px; }
h2 { font-size: 20px; }
h3 { font-size: 18px; }
p { font-size: 14px; }

/* 840px+ Desktop */
@media (min-width: 840px) {
  h1 { font-size: 28px; }
  h2 { font-size: 24px; }
  h3 { font-size: 20px; }
  p { font-size: 16px; }
}

/* 1920px+ 2K Display */
@media (min-width: 1920px) {
  h1 { font-size: 32px; }
  h2 { font-size: 28px; }
  h3 { font-size: 24px; }
  p { font-size: 18px; }
}

/* Breakpoints trung gian (351px, 600px, 768px, 1240px, 2560px) */
/* KHÔNG ĐƯỢC override font-size, chỉ override padding/spacing */
```

**Lý do:** Override nhiều breakpoints gây inconsistency, font quá to, khó debug.

---

### 3. Không Verify Browser Cache
**❌ SAI:** Nghĩ code sai vì UI không thay đổi
```
User: "sao tôi vẫn chưa thấy áp dụng vào code nhỉ nó vẫn rất to nhỉ"
AI: "Để tôi check code..." → Code đúng rồi nhưng browser cache!
```

**✅ ĐÚNG:** Luôn nhắc user hard reload trước khi debug
```
1. Check code → Code đúng
2. Nhắc user: "Hard reload browser (Cmd+Shift+R)"
3. Nếu vẫn sai → Mới debug tiếp
```

**Cách Hard Reload:**
- Chrome/Edge: `Cmd + Shift + R` (Mac) / `Ctrl + Shift + R` (Windows)
- Safari: `Cmd + Option + R`
- Firefox: `Cmd + Shift + R` / `Ctrl + F5`
- DevTools: Right-click Reload → "Empty Cache and Hard Reload"

---

### 4. View Switching Structure - Không Tham Khảo Code Cũ Trước Khi Refactor

**🚨 ĐÂY LÀ SAI LẦM NGHIÊM TRỌNG NHẤT - Waste 30+ phút**

**❌ SAI - Mistake #1:** Đặt `#result-content` BÊN NGOÀI `.hero-card`
```html
<!-- ❌ SAI - Results ngoài hero-card -->
<div class="hero-card">
    <div id="home-content">
        <div class="hero-header">...</div>
        <form>...</form>
    </div>
</div>

<!-- ❌ SAI - Ở ngoài! -->
<div id="result-content">
    <!-- Results ở đây -->
</div>
```

**❌ SAI - Mistake #2:** Nghĩ là không cần `#home-content` wrapper
```html
<!-- ❌ SAI - Không wrap home content -->
<div class="hero-card">
    <div class="hero-header">...</div>
    <form>...</form>

    <!-- ❌ Chỉ toggle #result-content, không toggle home -->
    <div id="result-content" class="view-content--hidden">
        ...
    </div>
</div>
```

**❌ SAI - Mistake #3:** Tạo empty `#result-content` không có sub-containers
```html
<!-- ❌ SAI - Thiếu youtube-preview-area và progress-area -->
<div id="result-content" class="view-content--hidden">
    <!-- Empty! ResultsViewController cần 2 containers -->
</div>
```

**❌ SAI - Mistake #4:** Nghĩ JavaScript sẽ tự tạo containers
```
AI: "Các elements này JavaScript sẽ tự gen nhé"
User: "Không, JavaScript chỉ QUERY elements thôi!"
```

**✅ ĐÚNG:** Phải CHECK CODE CŨ trước khi refactor!

**Bước 1: Tham khảo code cũ**
```bash
# Mở file HTML cũ để xem cấu trúc
cat /Users/macos/Documents/work/downloader/ytmp3.gg/index.html | grep -A 10 "result-content"
```

**Bước 2: Copy ĐÚNG cấu trúc**
```html
<!-- ✅ ĐÚNG - Tất cả trong hero-card -->
<div class="hero-card">

    <!-- HOME CONTENT - Form + Header + Error -->
    <div id="home-content" class="view-content view-content--active">
        <div class="hero-header">...</div>
        <form id="downloadForm">...</form>
        <div id="error-message"></div>
    </div>

    <!-- RESULTS CONTENT - Preview + Progress -->
    <div id="result-content" class="view-content view-content--hidden">
        <!-- JavaScript QUERY các elements này, không tự tạo! -->
        <div id="youtube-preview-area"></div>
        <div id="progress-area"></div>
    </div>

</div>
```

**Bước 3: Verify ViewManager logic (KHÔNG SỬA JavaScript)**
```javascript
// view-manager.js - Logic cũ đã đúng, KHÔNG cần sửa!
static showHome() {
    homeContent.classList.add('view-content--active');
    resultContent.classList.add('view-content--hidden');
}

static showResults() {
    homeContent.classList.add('view-content--hidden');
    resultContent.classList.add('view-content--active');
}
```

**Nguyên tắc:**
1. **LUÔN LUÔN tham khảo code cũ** trước khi refactor structure
2. **JavaScript chỉ QUERY elements**, không tự tạo containers
3. **ResultsViewController cần 2 containers** để render:
   - `#youtube-preview-area` - Preview card (thumbnail, title, author)
   - `#progress-area` - Progress bar, buttons, error states
4. **View containers phải nằm TRONG hero-card**, không phải ngoài
5. **Cần CẢ HAI views**: `#home-content` (form) và `#result-content` (results)

**Lý do waste time:**
- Không check code cũ → Đoán cấu trúc sai
- Sửa đi sửa lại 4 lần mới đúng
- User phải nhắc nhiều lần mới hiểu đúng
- 30+ phút lẫn quẫn có thể tránh được nếu check code cũ ngay từ đầu

---

### 5. Missing #content-area → Content Renderer Init Fail → Form Submit Reload Page

**🚨 CRITICAL BUG - Silent Failure Chain**

**Triệu chứng:**
```
User: "Sao tôi ấn submit nó cứ reload lại trang?"
Console: [main.js] ✅ Downloader UI init completed successfully
```

Trông có vẻ init thành công, NHƯNG form vẫn reload page!

**Root Cause Analysis:**

**Bước 1: Init chain**
```
main.js → initDownloaderUI()
  ↓
downloader-ui.js → setupInputForm()
  ↓
Calls: initRenderer(), initContentRenderer(), initInputForm()
```

**Bước 2: Content Renderer Init Fail**
```javascript
// content-renderer.js
export function initContentRenderer() {
    container = document.getElementById('content-area');

    if (!container) {
        return false; // ❌ FAIL SILENTLY
    }
    // ...
}
```

**Bước 3: setupInputForm() Return Early**
```javascript
// downloader-ui.js
async function setupInputForm() {
    const contentRendererInitialized = initContentRenderer();

    if (!contentRendererInitialized) {
        console.error('Content renderer not initialized!');
        return; // ❌ STOP HERE - Không gọi initInputForm()!
    }

    // ❌ NEVER REACHED - Event listeners không được attach!
    await initInputForm();
}
```

**Bước 4: Form Submit Without preventDefault**
```
User clicks Submit
  ↓
No event listener attached (initInputForm() never called)
  ↓
Browser default behavior: form.submit() → page reload
```

**Vấn đề: HTML thiếu `#content-area`**

```html
<!-- ❌ SAI - Thiếu element này -->
<main>
    <section id="home" class="hero-section">
        <!-- Form ở đây -->
    </section>

    <!-- ❌ THIẾU #content-area -->

    <section class="content-section">
        <!-- FAQ... -->
    </section>
</main>
```

**✅ ĐÚNG - Phải có #content-area**

```html
<main>
    <section id="home" class="hero-section">
        <!-- Form -->
    </section>

    <!-- ✅ CRITICAL: Content area for search results -->
    <div id="content-area" class="content-area" aria-live="polite"></div>

    <section class="content-section">
        <!-- FAQ... -->
    </section>
</main>
```

**Element `#content-area` dùng để:**
1. Render search results khi user search keywords (không phải URL)
2. Show skeleton loading states
3. Display error messages
4. **CRITICAL**: Content renderer PHẢI init thành công để setupInputForm() tiếp tục

**Nguyên tắc:**
1. ✅ **LUÔN check init status** của từng renderer
2. ✅ **KHÔNG return early** nếu renderer init fail - log error rõ ràng
3. ✅ **CHECK console logs** khi debug - tìm "FAILED" messages
4. ✅ **Verify tất cả DOM elements** được JavaScript cần
5. ✅ Test form submit ngay sau khi refactor HTML

**Debug Checklist:**
```javascript
// Paste vào console để debug init chain
console.log('Form:', document.getElementById('downloadForm'));
console.log('Content area:', document.getElementById('content-area'));
console.log('Event listeners:', getEventListeners(document.getElementById('downloadForm')));
```

**Lý do waste time:**
- Init thành công nhưng thiếu 1 element → Silent fail
- Log `✅ Init completed` gây hiểu lầm
- Không check child renderer init status
- Debug sai hướng (nghĩ là validation issue thay vì missing element)

---

## 📋 HTML STRUCTURE - CRITICAL ELEMENTS

### IDs & Classes Phải Preserve (JavaScript Hooks)

**⚠️ QUAN TRỌNG:** Những elements này được JavaScript sử dụng, KHÔNG ĐƯỢC xóa hoặc đổi tên!

```html
<!-- FORM WRAPPER -->
<form id="downloadForm" autocomplete="off">

  <!-- INPUT CONTAINER -->
  <div id="input-container">
    <div class="input-group">
      <div class="input-wrapper" id="input-wrapper">

        <!-- VIDEO INPUT -->
        <input type="text"
               id="videoUrl"
               class="video-input"
               placeholder="Paste YouTube link here..."
               autocomplete="off"
               aria-expanded="false"
               aria-owns="suggestion-container"
               role="combobox"
               required />

        <!-- SUGGESTIONS DROPDOWN -->
        <div id="suggestion-container"
             class="suggestion-container suggestions-box"
             role="region"
             aria-label="Search suggestions"
             aria-live="polite"></div>

        <!-- PASTE/CLEAR BUTTON -->
        <div class="input-actions">
          <button type="button"
                  id="input-action-button"
                  class="input-action-btn btn-paste"
                  data-action="paste">
            <!-- STATE: PASTE -->
            <span class="btn-state btn-state--paste">
              <svg class="btn-icon">...</svg>
              <span class="btn-text">Paste</span>
            </span>
            <!-- STATE: CLEAR -->
            <span class="btn-state btn-state--clear">
              <svg class="btn-icon">...</svg>
              <span class="btn-text">Clear</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- FORM ACTIONS -->
  <div class="controls-row form-actions">

    <!-- FORMAT TOGGLE (MP3/MP4) -->
    <div class="format-toggle">
      <button type="button" class="format-btn active selected" data-format="mp3">mp3</button>
      <button type="button" class="format-btn" data-format="mp4">mp4</button>
    </div>

    <!-- QUALITY SELECTOR -->
    <div id="quality-selector-container" class="quality-wrapper quality-dropdown-wrapper">
      <select id="quality-select" class="quality-select">
        <option value="320">320 kbps</option>
        <option value="256">256 kbps</option>
        <option value="192">192 kbps</option>
        <option value="128" selected>128 kbps</option>
      </select>
      <span class="select-icon">
        <svg>...</svg>
      </span>
    </div>

    <!-- CONVERT BUTTON -->
    <button type="submit"
            id="submit-button"
            class="btn-convert convert-button">
      <span class="button-text">Convert</span>
    </button>
  </div>

  <!-- ERROR MESSAGE -->
  <div id="error-message" class="error-message" role="alert"></div>
</form>

<!-- CONTENT AREA (Search Results, Download UI) -->
<div id="content-area" class="content-area"></div>
```

### Dual Classes Pattern (Legacy Support)

**Một số elements có 2 classes để backward compatibility:**
```css
/* Cả 2 đều được sử dụng */
.controls-row { }  /* Old class */
.form-actions { }  /* New class */

.btn-convert { }   /* Old class */
.convert-button { } /* New class */

.quality-wrapper { }           /* Old class */
.quality-dropdown-wrapper { }  /* New class */
```

**JavaScript có thể query bất kỳ class nào**, nên PHẢI giữ cả 2:
```html
<!-- ✅ ĐÚNG: Giữ cả 2 classes -->
<div class="controls-row form-actions">

<!-- ❌ SAI: Chỉ giữ 1 class -->
<div class="form-actions">
```

---

## 🎨 CSS ARCHITECTURE - BEST PRACTICES

### Mobile-First Typography Hierarchy

```css
/* ===== BASE (0-839px Mobile) ===== */
h1 { font-size: 24px; font-weight: 700; line-height: 1.2; }
h2 { font-size: 20px; font-weight: 700; line-height: 1.3; }
h3 { font-size: 18px; font-weight: 700; line-height: 1.4; }
p  { font-size: 14px; line-height: 1.6; }

/* Hero specific */
.hero-title { font-size: 24px; /* same as h1 */ }
.hero-subtitle { font-size: 13px; /* var(--font-size-sm) */ }

/* Form elements */
.video-input { font-size: 14px; }
.format-btn { font-size: 13px; /* var(--font-size-sm) */ }
.quality-select { font-size: 13px; }
.btn-convert { font-size: 13px; }

/* ===== DESKTOP (840px+) ===== */
@media (min-width: 840px) {
  h1 { font-size: 28px; }
  h2 { font-size: 24px; }
  h3 { font-size: 20px; }
  p  { font-size: 16px; }

  .hero-title { font-size: 28px; }
  .hero-subtitle { font-size: 15px; /* var(--font-size-base) */ }

  .video-input { font-size: 15px; }
  .format-btn { font-size: 15px; }
  .quality-select { font-size: 15px; }
  .btn-convert { font-size: 15px; }
}

/* ===== 2K DISPLAY (1920px+) ===== */
@media (min-width: 1920px) {
  h1 { font-size: 32px; }
  h2 { font-size: 28px; }
  h3 { font-size: 24px; }
  p  { font-size: 18px; }

  .hero-title { font-size: 32px; }
  .hero-subtitle { font-size: 16px; }

  .video-input { font-size: 18px; }
  .format-btn { font-size: 16px; }
  .quality-select { font-size: 16px; }
  .btn-convert { font-size: 16px; }
}
```

### Button Heights Responsive Pattern

```css
/* ===== MOBILE (0-839px) ===== */
.format-toggle { height: 40px; }
.format-btn { height: 32px; } /* Inner button */

.quality-select { height: 40px; }

.btn-convert,
.convert-button { height: 40px; }

/* ===== DESKTOP (840px+) ===== */
@media (min-width: 840px) {
  .format-toggle { height: 46px; }
  .format-btn { height: 38px; }

  .quality-select { height: 46px; }

  .btn-convert,
  .convert-button { height: 46px; }
}

/* ===== 2K DISPLAY (1920px+) ===== */
@media (min-width: 1920px) {
  /* Format toggle giữ 46px */
  .format-toggle { height: 46px; }

  /* Convert button tăng lên */
  .btn-convert,
  .convert-button { height: 48px; }
}
```

### Quality Dropdown Width Responsive

```css
/* ===== MOBILE (0-839px) ===== */
.quality-wrapper,
.quality-dropdown-wrapper {
  position: relative;
  width: 100%; /* Full width mobile */
}

/* ===== DESKTOP (840px+) ===== */
@media (min-width: 840px) {
  .quality-wrapper,
  .quality-dropdown-wrapper {
    width: 220px; /* Fixed width desktop */
    flex: initial; /* No flex grow */
  }
}
```

### Input Wrapper Heights

```css
/* ===== MOBILE (0-839px) ===== */
.input-wrapper { height: 50px; }

/* ===== DESKTOP (840px+) ===== */
@media (min-width: 840px) {
  .input-wrapper { height: 52px; }
}

/* ===== 2K DISPLAY (1920px+) ===== */
@media (min-width: 1920px) {
  .input-wrapper { height: 56px; }
}
```

### CSS Variables Usage

**Sử dụng CSS variables cho consistency:**
```css
/* Design tokens */
--font-size-sm: 13px;    /* Small text, buttons */
--font-size-base: 15px;  /* Desktop base */

--color-text-main: #0F172A;
--color-text-muted: #475569;
--color-primary: #2563EB;
--color-accent: #0F172A; /* Black for convert button */

/* Usage */
.format-btn { font-size: var(--font-size-sm); }
.video-input { font-size: var(--font-size-base); } /* Desktop */
```

---

## 🎯 COMPONENTS CẦN GIỮ LẠI

### 1. Skeleton Loading System
**File:** `src/styles/common.css` (lines 428-541)

```css
@keyframes skeleton-loading {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-title {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-thumbnail { /* ... */ }
.skeleton-text { /* ... */ }
.skeleton-badge { /* ... */ }
```

**Lý do:** Used for loading states trong search results, YouTube preview.

### 2. Ripple Effect System
**File:** `src/styles/common.css` (lines 542-591)

```css
button,
.btn-download,
.btn-convert {
  position: relative;
  overflow: hidden;
}

.ripple-silk {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: scale(0);
  animation: ripple-silk 0.6s ease-out;
}
```

**Lý do:** Material Design ripple effect cho tất cả buttons.

### 3. Suggestions Dropdown
**File:** `src/styles/features/suggestions.css`

**Lý do:** YouTube search suggestions dropdown UI.

### 4. Search Results Grid
**File:** `src/styles/features/search-results.css`

**Lý do:** Video search results rendering.

### 5. YouTube Preview
**File:** `src/styles/features/youtube-preview.css`

**Lý do:** YouTube metadata preview khi paste URL.

### 6. Download UI Components
**File:** `src/styles/features/download-ui.css`

**Lý do:** Download progress bars, status indicators.

### 7. Content Messages
**File:** `src/styles/features/content-messages.css`

**Lý do:** Error/warning/success messages UI.

---

## 📐 RESPONSIVE BREAKPOINTS

### 7-Breakpoint System (BẮT BUỘC)

```css
/* =========================================================
   Responsive Breakpoints (BẮT BUỘC CHO MỌI FILE)
   ---------------------------------------------------------
   • Extra Small Mobile (0-350px)
   • Small Mobile (351-599px)
   • Medium (Tablet) - 600-839px
   • Expanded (Desktop) - 840-1239px
   • Large (Wide Desktop) - 1240-1919px
   • Extra Large (2K) - 1920-2559px
   • Ultra Large (4K) - 2560px+
   ========================================================= */
```

### Main Breakpoints Cho Font/Size Changes

**CHỈ thay đổi font-size/heights ở 3 breakpoints chính:**

1. **Base (0-839px):** Mobile sizes
2. **840px+:** Desktop sizes
3. **1920px+:** 2K/4K sizes

**Breakpoints trung gian (351px, 600px, 768px, 1240px, 2560px):**
- CHỈ thay đổi padding, spacing, layout
- KHÔNG thay đổi font-size, button heights

---

## 🔧 DESIGN TOKENS

### Color Palette
```css
:root {
  /* Background */
  --color-bg: #F1F5F9;           /* Slate 100 - page background */
  --color-surface: #ffffff;       /* Card background */

  /* Primary */
  --color-primary: #2563EB;       /* Electric Blue */
  --color-primary-dark: #1D4ED8;
  --color-primary-light: #DBEAFE;

  /* Accent */
  --color-accent: #0F172A;        /* Black for convert button */

  /* Text */
  --color-text-main: #0F172A;     /* Slate 900 */
  --color-text-muted: #475569;    /* Slate 600 */

  /* Border */
  --color-border: #E2E8F0;        /* Slate 200 */
}
```

### Typography
```css
:root {
  /* Font Families */
  --font-main: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-display: 'Space Grotesk', sans-serif;

  /* Font Sizes */
  --font-size-sm: 13px;    /* Buttons, small text */
  --font-size-base: 15px;  /* Desktop body text */
}
```

### Spacing & Shadows
```css
:root {
  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-pill: 99px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-card: 0 0 0 1px rgba(0,0,0,0.03),
                 0 2px 8px rgba(0,0,0,0.04),
                 0 12px 24px rgba(0,0,0,0.04);
  --shadow-glow: 0 0 0 4px rgba(37, 99, 235, 0.15);
}
```

---

## 🎨 INTERACTIVE STATES

### Format Toggle Active State
```css
/* Default (unselected) */
.format-btn {
  background: transparent;
  color: var(--color-text-muted);
}

/* Active/Selected */
.format-btn.active,
.format-btn.selected {
  background: var(--color-text-main); /* Black */
  color: #fff;                         /* White text */
  box-shadow: var(--shadow-sm);
}

/* Hover (not active) */
.format-btn:not(.active):not(.selected):hover {
  color: var(--color-text-main);
}
```

### Input Wrapper Focused State
```css
.input-wrapper {
  background: #f8fafc;
  border: 2px solid var(--color-border);
  transition: all 0.3s ease;
}

.input-wrapper:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.input-wrapper.focused {
  background: #fff;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glow); /* Blue glow */
}
```

### Convert Button Hover
```css
.btn-convert,
.convert-button {
  background: var(--color-accent); /* Black */
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(15, 23, 42, 0.2);
}

.btn-convert:hover,
.convert-button:hover {
  transform: translateY(-2px); /* Lift up */
  box-shadow: 0 8px 12px rgba(37, 99, 235, 0.25); /* Deeper shadow */
  /* NO background color change */
}
```

### Paste/Clear Button State Toggle
```css
/* Default State: Show Paste, Hide Clear */
.btn-state--paste { display: inline-flex; }
.btn-state--clear { display: none; }

/* Active State (when input has text): Hide Paste, Show Clear */
#input-action-button[data-action="clear"] .btn-state--paste {
  display: none;
}

#input-action-button[data-action="clear"] .btn-state--clear {
  display: inline-flex;
}
```

**JavaScript toggle:**
```javascript
// When input has text
inputActionButton.dataset.action = 'clear';

// When input is empty
inputActionButton.dataset.action = 'paste';
```

---

## ✅ REFACTOR CHECKLIST

### Pre-Refactor (Planning Phase)

- [ ] **Đọc template source** (`demo_ytmp3_v1.html`)
- [ ] **Map IDs/classes** từ old HTML sang new structure
- [ ] **Identify JavaScript hooks** (tất cả IDs, classes được JS sử dụng)
- [ ] **List components to preserve** (skeleton, suggestions, search results, etc.)
- [ ] **Xác định breakpoints** cho font-size changes
- [ ] **Backup files** quan trọng (`.backup` extension)

### During Refactor

- [ ] **Refactor trực tiếp**, KHÔNG tạo file mới
- [ ] **Preserve JavaScript hooks** - check lại tất cả IDs/classes
- [ ] **Preserve dual classes** (`.controls-row` + `.form-actions`, etc.)
- [ ] **Mobile-first approach** - base styles cho 0-350px trước
- [ ] **Chỉ set font-size ở 3 breakpoints chính** (base, 840px, 1920px)
- [ ] **XÓA override font-size** ở breakpoints trung gian (351px, 600px, 768px, 1240px, 2560px)
- [ ] **Test responsive** ở tất cả 7 breakpoints
- [ ] **Update CSS imports** trong main.js (nếu có file mới)

### Post-Refactor (Testing Phase)

- [ ] **Hard reload browser** (Cmd+Shift+R / Ctrl+Shift+R)
- [ ] **Visual checks:**
  - [ ] Header sticky với backdrop blur
  - [ ] Logo + desktop nav (≥992px) / mobile drawer (<992px)
  - [ ] Hero gradient accent line
  - [ ] Input focused states (blue glow)
  - [ ] Paste/Clear button toggle
  - [ ] Format toggle active state (black bg, white text)
  - [ ] Quality dropdown width (100% mobile → 220px desktop)

- [ ] **JavaScript interactions:**
  - [ ] Input field: Type URL → Clear button xuất hiện
  - [ ] Input field: Clear text → Paste button quay lại
  - [ ] Format toggle: Click MP3/MP4 → Active state đúng
  - [ ] Quality selector: Dropdown hoạt động
  - [ ] Convert button: Click → Form submit
  - [ ] Suggestions dropdown: Type keyword → Dropdown hiện
  - [ ] Search results: Render grid items đúng

- [ ] **Responsive breakpoints:**
  - [ ] 350px - Extra small mobile
  - [ ] 600px - Tablet
  - [ ] 840px - Desktop
  - [ ] 1240px - Wide desktop
  - [ ] 1920px - 2K display

- [ ] **Font sizes verification:**
  - [ ] Mobile: h1=24px, h2=20px, h3=18px, p=14px
  - [ ] Desktop: h1=28px, h2=24px, h3=20px, p=16px
  - [ ] 2K: h1=32px, h2=28px, h3=24px, p=18px

- [ ] **Button heights verification:**
  - [ ] Mobile: All buttons = 40px
  - [ ] Desktop: All buttons = 46px
  - [ ] 2K: Convert button = 48px

### Code Review Checklist

- [ ] **CSS Structure:**
  - [ ] Tất cả files có responsive breakpoints header
  - [ ] Mobile-first approach (`min-width` only)
  - [ ] Design tokens được sử dụng, không hardcode values
  - [ ] Không có `!important` (trừ utilities)

- [ ] **HTML Structure:**
  - [ ] Tất cả JavaScript hooks được preserve
  - [ ] Dual classes được giữ lại
  - [ ] Semantic HTML (`form`, `button`, `input`, etc.)
  - [ ] Accessibility attributes (`role`, `aria-*`)

- [ ] **JavaScript Compatibility:**
  - [ ] Không có breaking changes trong DOM structure
  - [ ] Event handlers vẫn hoạt động
  - [ ] State management intact
  - [ ] No console errors

- [ ] **Performance:**
  - [ ] Critical CSS ≤ 10KB
  - [ ] Không có unused CSS
  - [ ] Images có width/height (prevent CLS)
  - [ ] No layout-shifting animations

---

## 🚫 ANTI-PATTERNS (TRÁNH TUYỆT ĐỐI)

### 1. Override Font-Size Everywhere
```css
/* ❌ ANTI-PATTERN: Override ở mọi breakpoint */
@media (min-width: 351px) { h1 { font-size: 1.5rem; } }
@media (min-width: 600px) { h1 { font-size: 2rem; } }
@media (min-width: 768px) { h1 { font-size: 3rem; } }
@media (min-width: 840px) { h1 { font-size: 2.5rem; } }
@media (min-width: 1240px) { h1 { font-size: 3.75rem; } }
@media (min-width: 1920px) { h1 { font-size: 4rem; } }
@media (min-width: 2560px) { h1 { font-size: 4.5rem; } }
```

### 2. Hardcode Values
```css
/* ❌ ANTI-PATTERN: Hardcoded values */
.button {
  color: #475569;
  font-size: 13px;
  border-radius: 10px;
  padding: 12px 24px;
}

/* ✅ BEST PRACTICE: Use design tokens */
.button {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md);
  padding: 12px 24px;
}
```

### 3. Duplicate Files
```css
/* ❌ ANTI-PATTERN: Tạo file mới */
src/styles/new-ui-header.css
src/styles/old-header.css  /* Duplicate! */

/* ✅ BEST PRACTICE: Refactor file có sẵn */
src/styles/common.css  /* Edit trực tiếp */
```

### 4. Remove JavaScript Hooks
```html
<!-- ❌ ANTI-PATTERN: Xóa/đổi tên IDs -->
<input type="text" class="video-input" />  <!-- Missing id="videoUrl" -->

<!-- ✅ BEST PRACTICE: Preserve tất cả hooks -->
<input type="text" id="videoUrl" class="video-input" />
```

### 5. Inline Styles
```html
<!-- ❌ ANTI-PATTERN: Inline styles -->
<button style="height: 40px; font-size: 13px;">Convert</button>

<!-- ✅ BEST PRACTICE: CSS classes -->
<button class="btn-convert">Convert</button>
```

---

## 📊 FILES STRUCTURE

### Files Đã Refactor (Giai Đoạn 1)
```
/src/styles/
  ├── tokens.css              ✅ REFACTORED - Design system mới
  ├── reset.css               ⚪ NO CHANGE
  ├── utilities.css           ✅ CREATED NEW - Utility classes
  ├── common.css              ✅ REFACTORED - Header/footer/skeleton/ripple
  ├── fonts.css               ⚪ NO CHANGE
  └── critical/
      └── hero.css            ✅ REFACTORED - Hero section + form elements

/src/script/
  └── main.js                 ✅ UPDATED - CSS imports
```

### Files Preserved (Không Thay Đổi)
```
/src/styles/features/
  ├── suggestions.css         ⚪ PRESERVED - Suggestions dropdown
  ├── search-results.css      ⚪ PRESERVED - Search results grid
  ├── youtube-preview.css     ⚪ PRESERVED - YouTube metadata preview
  ├── download-ui.css         ⚪ PRESERVED - Download progress UI
  ├── content-messages.css    ⚪ PRESERVED - Error/warning messages
  ├── quality-selector.css    ⚪ PRESERVED - Quality dropdown
  ├── section-shared.css      ⚪ PRESERVED - Shared section utilities
  └── captcha-modal.css       ⚪ PRESERVED - CAPTCHA modal
```

### Template Source
```
/Users/macos/Documents/work/downloader/ytmp3.gg_clone1/
  ├── demo_ytmp3_v1.html      📄 TEMPLATE SOURCE - New UI design
  ├── index.html              📄 TARGET - Production HTML
  └── index_new_ui.html       📄 NEW HTML STRUCTURE (before replacing index.html)
```

---

## 🎓 LESSONS LEARNED SUMMARY

### Top 5 Lessons

1. **Refactor Trực Tiếp, Không Tạo File Mới**
   - Tránh smell code
   - Dễ maintain
   - Ít conflict

2. **Chỉ Override Font-Size Ở 3 Breakpoints Chính**
   - Base (0-839px)
   - Desktop (840px+)
   - 2K (1920px+)
   - Breakpoints khác chỉ override spacing

3. **Preserve All JavaScript Hooks**
   - IDs: `#videoUrl`, `#input-action-button`, `#quality-select`, etc.
   - Classes: `.btn-convert`, `.format-btn.active`, etc.
   - Data attributes: `data-action="paste/clear"`

4. **Hard Reload Browser Before Debug**
   - CSS cache là nguyên nhân phổ biến nhất
   - Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
   - DevTools: Empty Cache and Hard Reload

5. **Mobile-First Is Not Optional**
   - Base styles cho 0-350px
   - Progressive enhancement
   - Chỉ dùng `min-width` media queries

---

## 📚 RESOURCES

### Documentation
- **Project CLAUDE.md:** `/Users/macos/Documents/work/downloader/ytmp3.gg_clone1/CLAUDE.md`
- **Task Workflow:** `docs/task-workflow.md`
- **CLS Guidelines:** `docs/cls-guidelines.md`
- **Comment Guidelines:** `docs/comment-guidelines.md`

### Template Files
- **Demo Source:** `demo_ytmp3_v1.html` (40,414 bytes)
- **Backup Files:**
  - `src/styles/common.css.backup`
  - `src/styles/critical/hero.css.backup`

### Design System Reference
- **Fonts:**
  - Body: Manrope (400, 500, 600, 700)
  - Display: Space Grotesk (500, 700)
- **Colors:**
  - Primary: #2563EB (Electric Blue)
  - Accent: #0F172A (Slate 900)
  - Background: #F1F5F9 (Slate 100)

---

## 🔮 NEXT PHASES (Remaining 90%)

### Phase 2: JavaScript Integration (20%)
- Verify all event handlers
- Test state management
- Ensure no breaking changes
- Fix any integration bugs

### Phase 3: Additional Sections (30%)
- Platforms section
- Features section
- How-to section
- FAQ section
- Footer content sections

### Phase 4: Advanced Features (20%)
- Animations (scroll reveal, etc.)
- Lazy loading
- Performance optimization
- SEO optimization

### Phase 5: Testing & QA (20%)
- Cross-browser testing
- Mobile device testing
- Accessibility audit
- Performance audit
- Final polish

---

**Last Updated:** 2025-12-06
**Version:** 1.0 (10% Complete)
**Contributors:** Claude (Sonnet 4.5)
