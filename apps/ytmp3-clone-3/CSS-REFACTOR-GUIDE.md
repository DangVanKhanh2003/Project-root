# CSS Refactor Guide - Phase 2 Implementation

Chi tiết hướng dẫn extract CSS từ inline `<style>` trong `index.html` ra external files.

---

## Table of Contents

1. [Tổng Quan](#tổng-quan)
2. [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
3. [CSS Mapping Strategy](#css-mapping-strategy)
4. [Step-by-Step Guide](#step-by-step-guide)
5. [Import Order](#import-order)
6. [Common Patterns](#common-patterns)
7. [Testing Checklist](#testing-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Tổng Quan

### Mục tiêu
Extract toàn bộ CSS từ `<style>` tag trong `index.html` ra external files trong `src/styles/`, organized theo components/modules để dễ maintain.

### Nguyên tắc
- ✅ **Zero visual changes** - Giữ nguyên 100% appearance
- ✅ **Preserve functionality** - Theme toggle, animations, effects
- ✅ **Maintainable structure** - One component = One file
- ✅ **Clear organization** - Easy to find, easy to update
- ❌ **No optimization** - Không xóa/merge/refactor CSS values

---

## Cấu Trúc Thư Mục

### Current Structure (from glob)

```
src/styles/
├── base.css
├── common.css
├── reset.css
├── 404.css
├── sections/
│   ├── header.css
│   ├── footer.css
│   ├── hero.css
│   ├── content.css
│   ├── features.css
│   ├── faq.css
│   ├── instructions.css
│   └── tips.css
└── reusable-packages/
    ├── package-root.css
    ├── suggestions/suggestions.css
    ├── search-results/search-results.css
    ├── video-info-card/video-info-card.css
    ├── yt-preview-card/yt-preview-card.css
    ├── conversion-status/conversion-status.css
    ├── captcha-modal/captcha-modal.css
    ├── expire-modal/expire-modal.css
    └── skeleton/skeleton.css
```

### Proposed Structure for New CSS

```
src/styles/
├── variables.css                    # NEW - CSS custom properties
├── themes/
│   ├── dark.css                     # NEW - Dark theme (default)
│   └── light.css                    # NEW - Light theme overrides
├── layout/
│   ├── grid.css                     # NEW - Grid overlay, ambient glow
│   └── container.css                # NEW - Container utilities
├── components/
│   ├── hero-card.css                # NEW - Hero card glassmorphism
│   ├── form-input.css               # NEW - Input wrapper, video input
│   ├── buttons.css                  # NEW - All button styles
│   ├── format-toggle.css            # NEW - Format MP3/MP4 toggle
│   ├── quality-select.css           # NEW - Quality dropdown
│   ├── result-card.css              # NEW - Result/preview card
│   ├── status-bar.css               # NEW - Processing status bar
│   ├── drawer.css                   # NEW - Mobile drawer menu
│   ├── steps.css                    # NEW - How-to-use steps
│   └── badge.css                    # NEW - Badge, meta-badge
└── utilities/
    ├── animations.css               # NEW - @keyframes
    └── helpers.css                  # NEW - .hidden, .fade-in
```

---

## CSS Mapping Strategy

### Phân Loại CSS từ index.html

Đọc `<style>` tag trong `index.html` và map CSS rules vào các files:

#### 1. Variables (lines ±15-100)
**File:** `src/styles/variables.css`
- `:root { --bg-body, --bg-card, --text-main, ... }`
- All CSS custom properties

#### 2. Themes (lines ±67-101)
**File:** `src/styles/themes/light.css`
- `[data-theme="light"] { --bg-body: #f1f5f9; ... }`

**File:** `src/styles/themes/dark.css` (optional, hoặc keep in variables.css)
- Default dark values (already in `:root`)

#### 3. Reset & Base (lines ±104-150)
**File:** Merge vào `src/styles/reset.css` (existing)
- `* { box-sizing: border-box; ... }`
- `body { font-family: ...; }`
- `a`, `button`, `input`, `ul` resets

#### 4. Background Effects (lines ±119-146)
**File:** `src/styles/layout/grid.css` (new)
- `body::before` - Ambient glow
- `body::after` - Grid overlay

#### 5. Container (lines ±153-158)
**File:** `src/styles/layout/container.css` (new)
- `.container { width: 100%; max-width: ...; }`

#### 6. Header (lines ±170-300)
**File:** Merge vào `src/styles/sections/header.css` (existing)
- `.header`, `.nav-wrapper`, `.logo`, `.nav-link`
- `.icon-btn`, `.lang-btn`, `.mobile-toggle`

#### 7. Hero Section (lines ±302-388)
**File:** Merge vào `src/styles/sections/hero.css` (existing)
- `.hero`, `.hero-glow`
- `.hero-card`, `.hero-header`, `.hero-title`, `.badge`

#### 8. Form Components

**File:** `src/styles/components/form-input.css` (new)
- `.form-container`, `.input-group`, `.input-wrapper`
- `.video-input`, `.input-actions`

**File:** `src/styles/components/buttons.css` (new)
- `.btn-paste`, `.btn-clear`
- `.btn-convert` (with shine effect)
- `.btn-download`, `.btn-secondary`

**File:** `src/styles/components/format-toggle.css` (new)
- `.format-toggle`, `.format-btn`

**File:** `src/styles/components/quality-select.css` (new)
- `.quality-wrapper`, `.quality-select`, `.select-arrow`

#### 9. Suggestions (lines ±629-647)
**File:** Merge vào `src/styles/reusable-packages/suggestions/suggestions.css` (existing)
- `.suggestions-box`

#### 10. Error (lines ±650-660)
**File:** `src/styles/components/form-input.css` (same as input)
- `.error-message`

#### 11. Result View (lines ±663-838)

**File:** `src/styles/components/result-card.css` (new)
- `.result-card-container`
- `.result-thumb`, `.result-details`, `.result-title`, `.result-meta`
- `.meta-badge`

**File:** `src/styles/components/status-bar.css` (new)
- `.status`, `.status--processing`
- `.spinner`, `@keyframes spin`

**File:** Merge existing or create
- `.result-actions-bar`

#### 12. Content Section (lines ±841-1013)

**File:** Merge vào `src/styles/sections/content.css` (existing)
- `.content-section`, `.info-card`, `.section-header`

**File:** `src/styles/components/steps.css` (new)
- `.steps-container`, `.step`, `.step-number`, `.step-title`

**File:** Merge vào `src/styles/sections/features.css` (existing)
- `.features-grid`, `.feature-item`, `.feature-icon`

**File:** Merge vào `src/styles/sections/faq.css` (existing)
- `.faq-list`, `.faq-item`, `.faq-q`, `.faq-a`

#### 13. Footer (lines ±1016-1053)
**File:** Merge vào `src/styles/sections/footer.css` (existing)
- `.footer`, `.footer-content`, `.footer-links`, `.copyright`

#### 14. Mobile Drawer (lines ±1056-1117)
**File:** `src/styles/components/drawer.css` (new)
- `.drawer-overlay`, `.drawer`, `.drawer-open`
- `.drawer-header`, `.drawer-link`

#### 15. Utilities

**File:** `src/styles/utilities/animations.css` (new)
- `@keyframes fadeIn` (lines ±163-167)
- `@keyframes spin` (line ±780)
- `.fade-in { animation: fadeIn ... }`

**File:** `src/styles/utilities/helpers.css` (new)
- `.hidden { display: none !important; }`

---

## Step-by-Step Guide

### Step 1: Tạo Files Mới

```bash
# Tạo thư mục
mkdir -p src/styles/themes
mkdir -p src/styles/layout
mkdir -p src/styles/components
mkdir -p src/styles/utilities

# Tạo files
touch src/styles/variables.css
touch src/styles/themes/light.css
touch src/styles/themes/dark.css
touch src/styles/layout/grid.css
touch src/styles/layout/container.css
touch src/styles/components/hero-card.css
touch src/styles/components/form-input.css
touch src/styles/components/buttons.css
touch src/styles/components/format-toggle.css
touch src/styles/components/quality-select.css
touch src/styles/components/result-card.css
touch src/styles/components/status-bar.css
touch src/styles/components/drawer.css
touch src/styles/components/steps.css
touch src/styles/components/badge.css
touch src/styles/utilities/animations.css
touch src/styles/utilities/helpers.css
```

### Step 2: Extract Variables

**From:** `index.html` lines ±16-64

**To:** `src/styles/variables.css`

```css
/* === CSS Variables === */
:root {
    /* Default: Dark Nebula */
    --bg-body: #030014;
    --bg-card: rgba(255, 255, 255, 0.03);
    --bg-card-hover: rgba(255, 255, 255, 0.06);

    /* Copy tất cả variables từ :root {} trong index.html */

    --radius-md: 12px;
    --radius-lg: 20px;
    --radius-pill: 9999px;
}
```

### Step 3: Extract Theme Overrides

**From:** `index.html` lines ±67-101

**To:** `src/styles/themes/light.css`

```css
/* === Light Theme Override === */
[data-theme="light"] {
    --bg-body: #f1f5f9;
    --bg-card: rgba(255, 255, 255, 0.7);

    /* Copy tất cả overrides từ [data-theme="light"] {} */

    --thumb-shadow: 0 8px 20px rgba(0,0,0,0.15);
}
```

### Step 4: Extract Layout

**From:** `index.html` lines ±119-146

**To:** `src/styles/layout/grid.css`

```css
/* === Ambient Background Glow === */
body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background:
        radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.15), transparent 25%),
        radial-gradient(circle at 85% 30%, rgba(59, 130, 246, 0.15), transparent 25%);
    pointer-events: none;
    z-index: -1;
    transition: background 0.3s;
}

/* === Grid Overlay === */
body::after {
    content: "";
    position: fixed;
    inset: 0;
    background-image: var(--overlay-grid);
    background-size: 50px 50px;
    mask-image: radial-gradient(circle at center, black, transparent 80%);
    -webkit-mask-image: radial-gradient(circle at center, black, transparent 80%);
    pointer-events: none;
    z-index: -1;
    transition: background-image 0.3s;
}
```

### Step 5: Extract Components

**Ví dụ - Hero Card**

**From:** `index.html` lines ±323-340

**To:** `src/styles/components/hero-card.css`

```css
/* === Hero Card === */
.hero-card {
    background: var(--bg-card);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: var(--border-glass);
    border-radius: var(--radius-lg);
    padding: 30px 24px;
    width: 100%;
    max-width: 850px;
    position: relative;
    z-index: 10;
    box-shadow: var(--shadow-glass);
    transition: transform 0.3s ease, background 0.3s, border-color 0.3s;
}

@media (min-width: 768px) {
    .hero-card {
        padding: 50px;
    }
}
```

**Lặp lại cho tất cả components...**

### Step 6: Extract Animations

**From:** `index.html` lines ±163-167, ±780

**To:** `src/styles/utilities/animations.css`

```css
/* === Keyframes === */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* === Animation Classes === */
.fade-in {
    animation: fadeIn 0.4s ease-out forwards;
}
```

### Step 7: Create Entry File

**File:** `src/styles/index.css` (or `main.css`)

```css
/* === CSS Entry Point === */

/* 1. Variables (must be first) */
@import './variables.css';

/* 2. Reset & Base */
@import './reset.css';
@import './base.css';
@import './common.css';

/* 3. Themes (after variables) */
@import './themes/light.css';

/* 4. Layout */
@import './layout/grid.css';
@import './layout/container.css';

/* 5. Sections */
@import './sections/header.css';
@import './sections/hero.css';
@import './sections/content.css';
@import './sections/features.css';
@import './sections/faq.css';
@import './sections/footer.css';

/* 6. Components */
@import './components/hero-card.css';
@import './components/form-input.css';
@import './components/buttons.css';
@import './components/format-toggle.css';
@import './components/quality-select.css';
@import './components/result-card.css';
@import './components/status-bar.css';
@import './components/drawer.css';
@import './components/steps.css';
@import './components/badge.css';

/* 7. Reusable Packages */
@import './reusable-packages/package-root.css';
@import './reusable-packages/suggestions/suggestions.css';
@import './reusable-packages/search-results/search-results.css';
@import './reusable-packages/video-info-card/video-info-card.css';
@import './reusable-packages/yt-preview-card/yt-preview-card.css';
@import './reusable-packages/conversion-status/conversion-status.css';
@import './reusable-packages/skeleton/skeleton.css';

/* 8. Utilities (must be last) */
@import './utilities/animations.css';
@import './utilities/helpers.css';
```

### Step 8: Import vào TypeScript

**File:** `src/main.ts`

```typescript
// === CSS Import ===
import './styles/index.css'; // hoặc './styles/main.css'

// ... rest of TypeScript code
```

### Step 9: Clean up HTML

**File:** `index.html`

```html
<head>
    <!-- Meta tags, fonts, etc. -->

    <!-- XÓA toàn bộ <style>...</style> tag -->

    <!-- Vite sẽ tự inject CSS -->
    <script type="module" src="/src/main.ts"></script>
</head>
```

### Step 10: Test & Verify

```bash
# Dev mode
npm run dev
# Mở browser, check:
# - Dark theme
# - Toggle light theme
# - All components
# - Responsive
# - Hover effects

# Build
npm run build
# Check no errors
```

---

## Import Order

**CRITICAL:** Import order affects CSS cascade.

### Correct Order
```
Variables → Reset → Themes → Layout → Sections → Components → Utilities
```

### Why?
1. **Variables first** - Các file khác cần dùng `var(--*)` properties
2. **Reset second** - Override browser defaults
3. **Themes after variables** - Override default theme values
4. **Layout/Sections/Components** - Build up from general to specific
5. **Utilities last** - Override/helper classes (`.hidden`, `.fade-in`)

### ❌ Wrong Order Example
```css
@import './components/hero-card.css';  /* Uses var(--bg-card) */
@import './variables.css';             /* Defined AFTER - ERROR! */
```

---

## Common Patterns

### Pattern 1: Media Queries Stay with Component

```css
/* hero-card.css */
.hero-card {
    padding: 30px 24px;
}

/* Media query INSIDE same file */
@media (min-width: 768px) {
    .hero-card {
        padding: 50px;
    }
}
```

**Don't:** Tách media queries ra file riêng

### Pattern 2: Theme-Specific Styles

```css
/* buttons.css */
.btn-paste {
    background: rgba(139, 92, 246, 0.15);
    color: #8b5cf6;
}

/* Theme override */
[data-theme="dark"] .btn-paste {
    background: rgb(71 71 71 / 81%);
    color: #fff;
}
```

### Pattern 3: Preserve Comments

```css
/* Copy từ index.html */
/* --- Form Controls --- */
.controls {
    display: flex;
    /* ... */
}
```

**Giữ nguyên comments** để dễ maintain

### Pattern 4: Keyframes + Classes Together

```css
/* animations.css */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.fade-in {
    animation: fadeIn 0.4s ease-out forwards;
}
```

---

## Testing Checklist

### Visual Testing

- [ ] **Dark theme** - Default appearance correct
- [ ] **Light theme toggle** - Switch works, all colors change
- [ ] **Header** - Logo, nav links, theme toggle button
- [ ] **Hero card** - Glassmorphism effect visible
- [ ] **Form** - Input, paste/clear button, format toggle, quality select
- [ ] **Ambient glow** - Background gradient visible
- [ ] **Grid overlay** - Subtle grid pattern visible
- [ ] **Hover effects** - Buttons, links, cards
- [ ] **Animations** - Fade-in, spinner, shine effect on convert button
- [ ] **Result card** - Thumbnail, title, meta badges
- [ ] **Status bar** - Processing bar with purple gradient
- [ ] **Mobile drawer** - Menu slides in/out
- [ ] **Steps section** - Numbers, hover effects
- [ ] **Features grid** - Icons, layout
- [ ] **FAQ** - Q&A list styling
- [ ] **Footer** - Links, copyright

### Responsive Testing

- [ ] **Mobile (< 600px)** - Single column, mobile menu
- [ ] **Tablet (600px - 900px)** - Responsive grid
- [ ] **Desktop (> 900px)** - Full layout, desktop nav

### Functional Testing

- [ ] **Theme persistence** - Refresh page, theme saved in localStorage
- [ ] **Header scroll** - Background/shadow changes on scroll
- [ ] **Mobile menu** - Toggle open/close
- [ ] **Form interactions** - Focus, blur, input states
- [ ] **Button hovers** - All hover states work
- [ ] **Smooth transitions** - Theme switch, view switch

### Build Testing

```bash
# Dev mode
npm run dev
# No errors, hot reload works

# Production build
npm run build
# No errors, CSS minified

# Check dist/
ls -la dist/assets/
# Should see minified CSS file
```

---

## Troubleshooting

### Issue 1: CSS Not Loading

**Symptoms:** Unstyled HTML, no colors

**Solutions:**
1. Check import path in `main.ts`:
   ```typescript
   import './styles/index.css'; // Path correct?
   ```
2. Check entry file exists: `src/styles/index.css`
3. Check Vite dev server running: `npm run dev`

### Issue 2: Variables Not Working

**Symptoms:** `var(--bg-body)` not resolving

**Solutions:**
1. Check `variables.css` imported **FIRST**:
   ```css
   /* index.css */
   @import './variables.css'; /* Must be first! */
   ```
2. Check `:root {}` selector in `variables.css`
3. Check no typos in variable names

### Issue 3: Theme Toggle Not Working

**Symptoms:** Light theme doesn't apply

**Solutions:**
1. Check `themes/light.css` imported AFTER `variables.css`
2. Check selector: `[data-theme="light"]` not `[data-theme=light]`
3. Check JavaScript sets `data-theme` attribute on `<html>`

### Issue 4: Some Styles Missing

**Symptoms:** One component looks wrong

**Solutions:**
1. Check component CSS imported in entry file
2. Check no typos in file name/path
3. Check CSS copied completely from index.html
4. Check media queries copied

### Issue 5: Build Errors

**Symptoms:** `npm run build` fails

**Solutions:**
1. Check CSS syntax (missing semicolons, braces)
2. Check `@import` paths (use `./` not `/`)
3. Check no circular imports
4. Clear cache: `rm -rf node_modules/.vite && npm run build`

### Issue 6: Import Order Wrong

**Symptoms:** Some styles not applied correctly

**Solutions:**
1. Follow strict order:
   ```
   Variables → Reset → Themes → Layout → Components → Utilities
   ```
2. Check utilities imported LAST (they override)
3. Check themes imported AFTER variables

---

## Best Practices Summary

1. ✅ **One component = One file** - Easy to find and maintain
2. ✅ **Media queries with component** - Keep related code together
3. ✅ **Preserve comments** - Documentation from original CSS
4. ✅ **Import order matters** - Variables first, utilities last
5. ✅ **No changes to values** - Extract as-is, optimize later
6. ✅ **Test thoroughly** - Visual, responsive, functional
7. ✅ **Use clear names** - `hero-card.css` not `card.css`
8. ✅ **Keep specificity low** - Avoid deep nesting

---

## Next Steps After Phase 2

Once CSS extraction complete:

1. **Phase 3 (Optional):** CSS Optimization
   - Remove duplicate rules
   - Consolidate similar selectors
   - Clean up unused CSS
   - Performance optimization

2. **Future Enhancements:**
   - CSS modules for scoping
   - PostCSS for autoprefixer
   - CSS minification strategies
   - Critical CSS extraction

---

**Document Version:** 1.0
**Last Updated:** 2025-12-10
**For:** ytmp3-clone-3 Phase 2 CSS Refactor
