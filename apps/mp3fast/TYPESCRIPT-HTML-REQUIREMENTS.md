# TypeScript → HTML Requirements

**Mục đích:** Liệt kê **CHÍNH XÁC** các containers/IDs mà HTML phải có để TypeScript modules hoạt động.

**Cách dùng:** Khi tích hợp UI mới, đảm bảo HTML có đầy đủ các IDs/containers trong danh sách này.

---

## 🎯 CRITICAL CONTAINERS (BẮT BUỘC)

### 1. Form & Input Elements

| Element | ID/Selector | TypeScript Module | Purpose |
|---------|-------------|-------------------|---------|
| Form | `#downloadForm` | `ui-renderer.ts`, `input-form.ts` | Form submission handler |
| Input Field | `#videoUrl` | `ui-renderer.ts`, `input-form.ts` | User input (URL/keyword) |
| Paste/Clear Button | `#input-action-button` | `ui-renderer.ts`, `input-form.ts` | Toggle paste/clear |
| Submit Button | `button[type="submit"]` inside form | `input-form.ts` | Submit handler |

**Minimal HTML:**
```html
<form id="downloadForm">
  <input id="videoUrl" type="text" />
  <button id="input-action-button" type="button">Paste/Clear</button>
  <button type="submit">Download</button>
</form>
```

---

### 2. Format Selector Container

| Element | ID | TypeScript Module | Purpose |
|---------|-----|-------------------|---------|
| Format Selector Container | `#format-selector-container` | `downloader-ui.ts` | Mount point for FormatSelector component |

**Minimal HTML:**
```html
<form id="downloadForm">
  <!-- input elements -->
  <div id="format-selector-container"></div>
</form>
```

**⚠️ IMPORTANT:** Must be INSIDE `#downloadForm`

**What gets rendered here:**
```html
<!-- FormatSelector component creates this structure -->
<div class="format-selector">
  <div class="format-quality-group">
    <button class="format-toggle-btn" data-toggle-format>
      <span class="toggle-side active" data-format="mp4">MP4</span>
      <span class="toggle-side" data-format="mp3">MP3</span>
    </button>
    <div class="quality-selector">
      <select id="quality-select" class="quality-select"></select>
    </div>
  </div>
  <div class="auto-submit-toggle">
    <input type="checkbox" id="auto-submit-checkbox" />
  </div>
</div>
```

---

### 3. Suggestions Dropdown Container

| Element | ID | TypeScript Module | Purpose |
|---------|-----|-------------------|---------|
| Suggestions Container | `#suggestion-container` | `suggestion-renderer.ts` | Autocomplete dropdown |

**Minimal HTML:**
```html
<div id="suggestion-container" class="suggesstion-list suggesstion-box"></div>
```

**⚠️ NOTE:** Class `suggesstion-list` is intentional (typo in codebase, keep for compatibility)

**What gets rendered here:**
```html
<!-- Suggestion items created dynamically -->
<ul class="suggestion-list" role="listbox">
  <li class="suggestion-item" data-suggestion-index="0">...</li>
  <li class="suggestion-item" data-suggestion-index="1">...</li>
</ul>
```

---

### 4. Content Area (CRITICAL!)

| Element | ID | TypeScript Module | Purpose |
|---------|-----|-------------------|---------|
| Content Area | `#content-area` | `content-renderer.ts` | **CRITICAL** - Video preview/detail renderer |

**Minimal HTML:**
```html
<div id="content-area"></div>
```

**⚠️ CRITICAL:**
- `content-renderer.ts` checks if this element exists during init
- If missing → `initContentRenderer()` returns `false` → `setupInputForm()` exits early
- Result: **Form doesn't work** (submits and reloads page)

**What gets rendered here:**

**Option A: YouTube Preview Card**
```html
<div class="yt-preview-card">
  <div class="yt-preview-thumbnail">
    <img src="..." alt="..." />
  </div>
  <div class="yt-preview-details">
    <h3 class="yt-preview-title">...</h3>
    <div class="yt-preview-meta">
      <div class="yt-preview-format">
        <span class="format-badge">MP4</span>
        <span class="quality-info">720p</span>
      </div>
      <p class="yt-preview-author">...</p>
    </div>
  </div>
</div>
<div class="conversion-status-wrapper" id="conversion-status-wrapper">
  <!-- Status bar -->
</div>
```

**Option B: Gallery View (Multi-item downloads)**
```html
<div class="gallery-container">
  <div class="gallery-header">...</div>
  <div class="gallery-bulk-controls">...</div>
  <div class="gallery-grid">
    <div class="gallery-item">...</div>
    <!-- More items -->
  </div>
</div>
```

---

### 5. Search Results Section

| Element | ID | TypeScript Module | Purpose |
|---------|-----|-------------------|---------|
| Search Results Section | `#search-results-section` | `content-renderer.ts` | Wrapper for show/hide |
| Search Results Container | `#search-results-container` | `content-renderer.ts` | Grid container |

**Minimal HTML:**
```html
<section id="search-results-section" style="display: none;">
  <div id="search-results-container"></div>
</section>
```

**⚠️ NOTE:** Default `display: none` - shown when user searches by keyword

**What gets rendered here:**
```html
<!-- Inside #search-results-container -->
<div class="search-results">
  <div class="search-results-grid">
    <!-- Search result cards -->
    <div class="search-result-card">...</div>
    <div class="search-result-card">...</div>
    <!-- ... -->
  </div>
</div>
```

---

### 6. Mobile Menu (Optional)

| Element | ID | TypeScript Module | Purpose |
|---------|-----|-------------------|---------|
| Menu Toggle Button | `#mobileMenuToggle` | `main.ts` | Open mobile menu |
| Menu Overlay | `#mobileMenuOverlay` | `main.ts` | Menu container |
| Close Button | `#mobileCloseBtn` | `main.ts` | Close menu (optional) |

**Minimal HTML:**
```html
<button id="mobileMenuToggle">Menu</button>
<div class="mobile-menu-overlay" id="mobileMenuOverlay">
  <button id="mobileCloseBtn">×</button>
  <nav class="mobile-menu">
    <a href="/">Home</a>
    <!-- More links -->
  </nav>
</div>
```

---

## 📋 COMPLETE MINIMAL HTML TEMPLATE

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Y2mate - YouTube Downloader</title>
  <script type="module" src="/src/main.ts"></script>
</head>
<body>

  <!-- ============================================ -->
  <!-- MOBILE MENU (Optional) -->
  <!-- ============================================ -->
  <button id="mobileMenuToggle">Menu</button>
  <div class="mobile-menu-overlay" id="mobileMenuOverlay">
    <button id="mobileCloseBtn">×</button>
    <nav class="mobile-menu">
      <a href="/">Home</a>
    </nav>
  </div>

  <!-- ============================================ -->
  <!-- MAIN DOWNLOAD FORM (REQUIRED) -->
  <!-- ============================================ -->
  <form id="downloadForm" method="POST" action="/search/">

    <!-- Input Field (REQUIRED) -->
    <input id="videoUrl"
           type="text"
           placeholder="Search or paste link..."
           autocomplete="off" />

    <!-- Paste/Clear Button (REQUIRED) -->
    <button id="input-action-button"
            type="button"
            data-action="paste">
      Paste/Clear
    </button>

    <!-- Submit Button (REQUIRED) -->
    <button type="submit">Download</button>

    <!-- Format Selector Container (REQUIRED) -->
    <div id="format-selector-container"></div>

    <!-- Suggestions Dropdown (REQUIRED) -->
    <div id="suggestion-container"
         class="suggesstion-list suggesstion-box"></div>
  </form>

  <!-- ============================================ -->
  <!-- CONTENT AREA (CRITICAL - REQUIRED!) -->
  <!-- ============================================ -->
  <div id="content-area"></div>

  <!-- ============================================ -->
  <!-- SEARCH RESULTS (REQUIRED for keyword search) -->
  <!-- ============================================ -->
  <section id="search-results-section" style="display: none;">
    <div id="search-results-container"></div>
  </section>

</body>
</html>
```

---

## 🎨 TÍCH HỢP VỚI UI MỚI (2-View Structure)

Nếu bạn muốn dùng **2-view structure** như demo (search view ↔ result view):

### HTML Structure

```html
<body>
  <!-- Mobile Menu -->
  <button id="mobileMenuToggle">Menu</button>
  <div id="mobileMenuOverlay">...</div>

  <div class="hero-card">

    <!-- ========================================== -->
    <!-- VIEW 1: SEARCH VIEW (Default visible) -->
    <!-- ========================================== -->
    <div id="search-view">
      <div class="hero-header">
        <h1 class="hero-title">YouTube to <span>MP3</span></h1>
      </div>

      <!-- FORM - Keep exact structure above -->
      <form id="downloadForm">
        <input id="videoUrl" type="text" />
        <button id="input-action-button" type="button">Paste/Clear</button>
        <button type="submit">Convert</button>
        <div id="format-selector-container"></div>
        <div id="suggestion-container" class="suggesstion-list"></div>
      </form>
    </div>

    <!-- ========================================== -->
    <!-- VIEW 2: RESULT VIEW (Hidden by default) -->
    <!-- ========================================== -->
    <div id="result-view" class="hidden">
      <!-- Preview card will be injected into #content-area -->
      <div id="content-area"></div>

      <!-- Action buttons (download, Next) -->
      <div id="result-actions" class="hidden">
        <button id="btn-download">Download</button>
        <button id="btn-new-convert">Next</button>
      </div>
    </div>

  </div>

  <!-- SEARCH RESULTS - Keep outside hero-card -->
  <section id="search-results-section" style="display: none;">
    <div id="search-results-container"></div>
  </section>
</body>
```

### TypeScript Integration

**Cần thêm view switching logic:**

```typescript
// src/features/downloader/ui-render/view-switcher.ts (NEW FILE)
export function showSearchView() {
  document.getElementById('search-view')?.classList.remove('hidden');
  document.getElementById('result-view')?.classList.add('hidden');
}

export function showResultView() {
  document.getElementById('search-view')?.classList.add('hidden');
  document.getElementById('result-view')?.classList.remove('hidden');
}
```

**Update `ui-renderer.ts`:**

```typescript
import { showResultView } from './view-switcher';

// When rendering YouTube preview
export function renderYouTubePreview(data) {
  showResultView(); // Switch to result view

  // Existing render logic...
  const contentArea = document.getElementById('content-area');
  contentArea.innerHTML = createPreviewCard(data);
}
```

**Wire up "Next" button in `downloader-ui.ts`:**

```typescript
import { showSearchView } from './ui-render/view-switcher';

export async function init() {
  // ... existing init code ...

  // Wire up Next button
  const btnNewConvert = document.getElementById('btn-new-convert');
  btnNewConvert?.addEventListener('click', () => {
    showSearchView();
    // Clear input
    const input = document.getElementById('videoUrl') as HTMLInputElement;
    if (input) input.value = '';
  });
}
```

---

## ⚠️ COMMON MISTAKES

### ❌ Mistake 1: Thiếu `#content-area`

```html
<!-- ❌ WRONG - Missing #content-area -->
<div id="result-view">
  <div class="preview-card">...</div>
</div>
```

**Result:** `content-renderer.ts` init fails → Form doesn't work

```html
<!-- ✅ CORRECT -->
<div id="result-view">
  <div id="content-area"></div>
</div>
```

---

### ❌ Mistake 2: `#format-selector-container` ngoài form

```html
<!-- ❌ WRONG - Outside form -->
<form id="downloadForm">
  <input id="videoUrl" />
</form>
<div id="format-selector-container"></div>
```

**Result:** Format selector renders nhưng không submit cùng form

```html
<!-- ✅ CORRECT - Inside form -->
<form id="downloadForm">
  <input id="videoUrl" />
  <div id="format-selector-container"></div>
</form>
```

---

### ❌ Mistake 3: Đổi tên IDs

```html
<!-- ❌ WRONG - Changed IDs -->
<form id="youtubeForm"> <!-- Changed from downloadForm -->
<input id="urlInput"> <!-- Changed from videoUrl -->
```

**Result:** TypeScript không tìm thấy elements → Features break

```html
<!-- ✅ CORRECT - Keep exact IDs -->
<form id="downloadForm">
<input id="videoUrl">
```

---

### ❌ Mistake 4: Xóa class `suggesstion-list`

```html
<!-- ❌ WRONG - Missing class -->
<div id="suggestion-container"></div>
```

**Result:** CSS styling missing (typo in codebase but used)

```html
<!-- ✅ CORRECT - Keep class -->
<div id="suggestion-container" class="suggesstion-list"></div>
```

---

## 📊 VERIFICATION CHECKLIST

### Before Integration

- [ ] All critical IDs present (`#downloadForm`, `#videoUrl`, `#content-area`, etc.)
- [ ] `#format-selector-container` inside `#downloadForm`
- [ ] `#content-area` exists (even if empty)
- [ ] `#search-results-section` with `#search-results-container` inside

### After Integration

- [ ] Form submits without page reload
- [ ] Paste/Clear button works
- [ ] Format selector renders (MP3/MP4 toggle + quality dropdown)
- [ ] Suggestions dropdown shows when typing
- [ ] YouTube preview renders in `#content-area`
- [ ] Search results render in `#search-results-container`
- [ ] No console errors about missing elements

### TypeScript Compatibility

- [ ] No TypeScript errors
- [ ] `npm run build` succeeds
- [ ] All imports resolve
- [ ] No `getElementById()` returning null

---

## 🎯 SUMMARY

**ABSOLUTE MINIMUM REQUIRED:**

1. ✅ `#downloadForm` - Form element
2. ✅ `#videoUrl` - Input field
3. ✅ `#input-action-button` - Paste/Clear button
4. ✅ `button[type="submit"]` - Submit button
5. ✅ `#format-selector-container` - Format selector mount (inside form)
6. ✅ `#suggestion-container` - Suggestions dropdown
7. ✅ `#content-area` - **CRITICAL** - Preview/detail renderer
8. ✅ `#search-results-section` + `#search-results-container` - Search results

**OPTIONAL (for mobile):**
- `#mobileMenuToggle`
- `#mobileMenuOverlay`
- `#mobileCloseBtn`

**Everything else is flexible** - styles, wrappers, extra divs can be changed freely.

---

**Created:** 2025-12-10
**Purpose:** TypeScript → HTML mapping for UI integration
**Status:** Complete ✅
