# HTML Requirements - TypeScript Compatibility

**Mục đích:** Danh sách IDs/containers BẮT BUỘC để TypeScript hoạt động

---

## ✅ BẮT BUỘC PHẢI CÓ

### Form Elements

| ID | Element | Purpose |
|----|---------|---------|
| `#downloadForm` | `<form>` | Form submission handler |
| `#videoUrl` | `<input>` | User input (URL/keyword) |
| `#input-action-button` | `<button>` | Paste/Clear toggle |
| `button[type="submit"]` | `<button>` inside form | Submit button |

### Container Elements

| ID | Element | Purpose | File TypeScript |
|----|---------|---------|-----------------|
| `#format-selector-container` | `<div>` inside form | FormatSelector mount point | `downloader-ui.ts` |
| `#suggestion-container` | `<div>` | Suggestions dropdown | `suggestion-renderer.ts` |
| `#content-area` | `<div>` | **CRITICAL** - Preview/detail renderer | `content-renderer.ts` |
| `#search-results-section` | `<section>` | Search results wrapper | `content-renderer.ts` |
| `#search-results-container` | `<div>` inside section | Search results grid | `content-renderer.ts` |

### Mobile Menu (Optional)

| ID | Element | Purpose |
|----|---------|---------|
| `#mobileMenuToggle` | `<button>` | Open menu |
| `#mobileMenuOverlay` | `<div>` | Menu overlay |
| `#mobileCloseBtn` | `<button>` | Close menu |

---

## ⚠️ CRITICAL NOTES

### 1. `#content-area` Là CRITICAL
- Nếu thiếu → `content-renderer.ts` init fail
- → `setupInputForm()` exit early
- → **Form không hoạt động** (reload page khi submit)

### 2. `#format-selector-container` Phải Trong Form
```html
✅ ĐÚNG:
<form id="downloadForm">
  <input id="videoUrl" />
  <div id="format-selector-container"></div>
</form>

❌ SAI:
<form id="downloadForm">
  <input id="videoUrl" />
</form>
<div id="format-selector-container"></div> <!-- Ngoài form! -->
```

### 3. Class `suggesstion-list` Giữ Nguyên
```html
<div id="suggestion-container" class="suggesstion-list"></div>
```
⚠️ Note: Typo "suggesstion" là cố ý (codebase cũ), giữ lại cho CSS compatibility

---

## 🎨 DYNAMIC CONTENT (TypeScript Tạo)

Các elements này TypeScript sẽ tự tạo, **KHÔNG cần có sẵn** trong HTML:

### Rendered vào `#format-selector-container`
- Format toggle (MP3/MP4)
- Quality dropdown
- Auto-submit checkbox

### Rendered vào `#content-area`
- YouTube preview card (thumbnail, title, meta)
- Conversion status bar (progress, buttons)
- Gallery view (multi-item downloads)

### Rendered vào `#search-results-container`
- Search result cards (video grid)

### Rendered vào `#suggestion-container`
- Suggestion items (autocomplete dropdown)

---

## 📐 MINIMAL HTML TEMPLATE

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <script type="module" src="/src/main.ts"></script>
</head>
<body>

  <!-- Mobile Menu (Optional) -->
  <button id="mobileMenuToggle">Menu</button>
  <div id="mobileMenuOverlay">
    <button id="mobileCloseBtn">×</button>
  </div>

  <!-- Main Form (Required) -->
  <form id="downloadForm">
    <input id="videoUrl" type="text" />
    <button id="input-action-button" type="button">Paste</button>
    <button type="submit">Download</button>
    <div id="format-selector-container"></div>
    <div id="suggestion-container" class="suggesstion-list"></div>
  </form>

  <!-- Content Area (CRITICAL) -->
  <div id="content-area"></div>

  <!-- Search Results (Required) -->
  <section id="search-results-section" style="display:none;">
    <div id="search-results-container"></div>
  </section>

</body>
</html>
```

---

## 🆕 NẾU DÙNG 2-VIEW STRUCTURE

Nếu bạn muốn chia UI thành 2 màn hình (search view ↔ result view):

```html
<body>

  <!-- VIEW 1: Search Form (Default visible) -->
  <div id="search-view">
    <form id="downloadForm">
      <!-- Keep exact IDs above -->
    </form>
  </div>

  <!-- VIEW 2: Results (Hidden by default) -->
  <div id="result-view" class="hidden">
    <div id="content-area"></div>
    <!-- Add custom action buttons here -->
  </div>

  <!-- Search Results (Keep outside) -->
  <section id="search-results-section" style="display:none;">
    <div id="search-results-container"></div>
  </section>

</body>
```

**Cần thêm TypeScript:**
- View switching logic (`showSearchView()`, `showResultView()`)
- Wire up trong `ui-renderer.ts` khi render preview

---

## ✅ VERIFICATION CHECKLIST

Trước khi test:
- [ ] `#downloadForm` exists
- [ ] `#videoUrl` exists
- [ ] `#input-action-button` exists
- [ ] `button[type="submit"]` exists inside form
- [ ] `#format-selector-container` exists INSIDE form
- [ ] `#suggestion-container` exists with class `suggesstion-list`
- [ ] `#content-area` exists
- [ ] `#search-results-section` exists with `#search-results-container` inside

Test TypeScript hoạt động:
- [ ] Form submit không reload page
- [ ] Paste/Clear button toggle
- [ ] Format selector render (MP3/MP4 toggle)
- [ ] Suggestions dropdown show khi type
- [ ] No console errors về missing elements

---

**Created:** 2025-12-10
**Purpose:** Minimal requirements cho TypeScript compatibility
**Next:** See REFACTOR-PLAN.md
