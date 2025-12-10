# Kế Hoạch Refactor UI

**Project:** ytmp3-clone-3 (TypeScript + Vite)
**Demo:** `demo_ytmp3_dark_v1.html`
**Goal:** Dark theme glassmorphism design

---

## 📊 OVERVIEW

```
Phase 1: TypeScript Integration (3-4 days)
  → Ghép HTML structure với TypeScript logic
  → Đảm bảo tất cả features hoạt động

Phase 2: CSS Refactor (2-3 days)
  → Refactor design theo demo (dark theme, glassmorphism)
  → Không phá vỡ TypeScript logic
```

---

## 🔧 PHASE 1: TypeScript Integration (3-4 ngày)

**Mục tiêu:** HTML mới tương thích 100% với TypeScript logic

### Day 1: HTML Structure Setup

**1.1 Backup files hiện tại**
- Backup `index.html` → `index.html.backup`
- Backup `src/styles/sections/hero.css` → `hero.css.backup`

**1.2 Copy demo HTML structure sang index.html**
- Copy full structure từ `demo_ytmp3_dark_v1.html`
- Giữ nguyên `<script type="module" src="/src/main.ts"></script>`
- Xóa inline CSS (sẽ refactor trong Phase 2)
- Xóa inline JavaScript (đã có TypeScript)

**1.3 Map demo IDs → TypeScript required IDs**

See `HTML-REQUIREMENTS.md` để biết IDs bắt buộc. Changes cần thực hiện:

| Demo HTML Element | Demo ID | Required ID | Action |
|-------------------|---------|-------------|--------|
| Form | `#convert-form` | `#downloadForm` | **Đổi ID** |
| Input | `#video-url` | `#videoUrl` | **Đổi ID** |
| Paste button | `#btn-paste` | Merge vào `#input-action-button` | **Merge** |
| Clear button | `#btn-clear` | Merge vào `#input-action-button` | **Merge** |
| Submit button | (giữ type="submit") | (giữ type="submit") | Keep |
| Suggestions | `#suggestion-container` | `#suggestion-container` | **Keep** |

**1.4 Thêm containers bắt buộc (demo không có)**

Thêm các elements này vào HTML:

- `#format-selector-container` - Bên trong `#downloadForm`, sau input field
- `#content-area` - Bên trong `#result-view`
- `#search-results-section` - Ngoài hero-card, với style="display:none;"
- `#search-results-container` - Bên trong `#search-results-section`

**1.5 Update paste/clear button structure**

Demo có 2 buttons riêng, TypeScript cần 1 button toggle states. Merge thành:
- 1 button với ID `#input-action-button`
- 2 spans bên trong (paste state, clear state)
- Toggle hiển thị bằng attribute `data-action="paste"` hoặc `"clear"`

**Verification Day 1:**
- [ ] All required IDs present (check `HTML-REQUIREMENTS.md`)
- [ ] `#format-selector-container` inside `#downloadForm`
- [ ] `#content-area` exists inside `#result-view`
- [ ] `#search-results-section` + container exists
- [ ] Paste/Clear button merged into single `#input-action-button`

---

### Day 2: TypeScript View Switching Logic

**2.1 Tạo view-switcher module**

Tạo file mới: `src/features/downloader/ui-render/view-switcher.ts`

Functions cần implement:
- `initViewSwitcher()` - Init default view (show search, hide result)
- `showSearchView()` - Hide result view, show search view
- `showResultView()` - Hide search view, show result view

Logic: Toggle class `hidden` trên `#search-view` và `#result-view`

**2.2 Integrate vào ui-renderer.ts**

File: `src/features/downloader/ui-render/ui-renderer.ts`

Changes:
- Import view-switcher functions
- Trong `renderYouTubePreview()`: Call `showResultView()` trước khi render
- Existing render logic vào `#content-area` giữ nguyên

**2.3 Wire up New Convert button**

File: `src/features/downloader/downloader-ui.ts`

Changes:
- Import `initViewSwitcher`, `showSearchView`
- Trong `init()`: Call `initViewSwitcher()`
- Add event listener cho `#btn-new-convert` button
- Handler: Call `showSearchView()` + clear input value

**Verification Day 2:**
- [ ] `view-switcher.ts` created với 3 functions
- [ ] Integrated vào `ui-renderer.ts`
- [ ] Integrated vào `downloader-ui.ts`
- [ ] No TypeScript errors
- [ ] Build succeeds: `npm run build`

---

### Day 3: Paste/Clear Button Integration

**3.1 Update button HTML structure**

File: `index.html`

Change từ demo structure (2 separate buttons) sang TypeScript-compatible (1 toggle button):

Button cần có:
- ID: `#input-action-button`
- Attribute: `data-action="paste"` (default state)
- 2 child spans:
  - `.btn-state--paste` - Visible khi data-action="paste"
  - `.btn-state--clear` - Visible khi data-action="clear"

**3.2 Add CSS cho button states**

File: `src/styles/sections/hero.css` (hoặc nơi styles button)

CSS rules cần thêm:
- `[data-action="paste"] .btn-state--paste` { display: inline-flex; }
- `[data-action="paste"] .btn-state--clear` { display: none; }
- `[data-action="clear"] .btn-state--paste` { display: none; }
- `[data-action="clear"] .btn-state--clear` { display: inline-flex; }

**Verification Day 3:**
- [ ] Button structure updated
- [ ] CSS rules added
- [ ] Button shows "Paste" when input empty
- [ ] Button shows "Clear" when input has text
- [ ] TypeScript logic toggles `data-action` attribute
- [ ] No JavaScript errors

---

### Day 4: Testing & Bug Fixes

**4.1 Test Form & Input**
- [ ] Form submit không reload page
- [ ] Input validation works
- [ ] Paste button pastes from clipboard
- [ ] Clear button clears input
- [ ] Input focus states work

**4.2 Test Format Selector**
- [ ] FormatSelector renders vào `#format-selector-container`
- [ ] MP3/MP4 toggle works
- [ ] Quality dropdown populates
- [ ] Auto-submit toggle works (if implemented)
- [ ] Quality changes update correctly

**4.3 Test Suggestions**
- [ ] Type keyword → Dropdown shows
- [ ] Click suggestion → Input fills + submits
- [ ] Arrow keys navigate
- [ ] Escape closes dropdown
- [ ] Dropdown positioned correctly

**4.4 Test Preview & Download**
- [ ] Submit YouTube URL → Switches to result view
- [ ] Preview card renders vào `#content-area`
- [ ] Thumbnail displays
- [ ] Title, author display
- [ ] Conversion status updates
- [ ] Download button appears when ready
- [ ] Download initiates correctly

**4.5 Test Search Results**
- [ ] Submit keyword → Results render vào `#search-results-container`
- [ ] Results grid displays
- [ ] Click card → Input fills + switches to preview
- [ ] Responsive grid layout

**4.6 Test View Switching**
- [ ] Default: Search view visible, result view hidden
- [ ] Submit URL → Smooth switch to result view
- [ ] "New Convert" button → Switch back to search view
- [ ] Input cleared when returning to search
- [ ] No flash/flicker during transition

**4.7 Test Mobile Menu**
- [ ] Hamburger button opens menu
- [ ] Overlay click closes menu
- [ ] Close button closes menu
- [ ] Menu links work

**4.8 Console & Build Check**
- [ ] No console errors
- [ ] No console warnings about missing elements
- [ ] No TypeScript errors
- [ ] Build succeeds: `npm run build`
- [ ] Dev server runs without errors

**4.9 Fix Bugs**

Common issues to watch for:
- Element query timing (ensure DOM ready)
- View switching timing (CSS transitions)
- Event listener cleanup
- Memory leaks (remove listeners when switching views)

**Completion Criteria Phase 1:**
- ✅ All features work identically to before refactor
- ✅ View switching smooth and bug-free
- ✅ No console errors
- ✅ Build succeeds
- ✅ Ready for Phase 2

---

## 🎨 PHASE 2: CSS Refactor (2-3 ngày)

**Mục tiêu:** Dark theme glassmorphism KHÔNG phá vỡ TypeScript

**Prerequisites:** Phase 1 100% complete

---

### Day 5: Design System Setup

**5.1 Add Google Fonts**

File: `index.html` - Add to `<head>`

Fonts cần:
- Inter (weights: 400, 500, 600)
- Outfit (weights: 500, 700, 800)

**5.2 Refactor base.css - Theme system**

File: `src/styles/base.css`

Backup first: `cp src/styles/base.css src/styles/base.css.backup`

Changes cần thực hiện:
- Replace color variables (red/pink → purple/blue)
- Add `:root` dark theme variables (default)
- Add `[data-theme="light"]` light theme override
- Update typography variables (Inter, Outfit)
- Add gradient variable definitions
- Update spacing/sizing variables

Reference values từ: `demo_ytmp3_dark_v1.html` lines 16-101

**5.3 Refactor common.css - Glassmorphism**

File: `src/styles/common.css`

Backup: `cp src/styles/common.css src/styles/common.css.backup`

Add effects:
- `body::before` pseudo-element - Ambient glow radial gradients
- `body::after` pseudo-element - Grid overlay với mask
- Update container max-width (1100px)
- Add `.hidden` utility class
- Add `.fade-in` animation keyframes

Reference: Demo lines 103-167

**Verification Day 5:**
- [ ] Google Fonts loaded (check DevTools Network tab)
- [ ] CSS variables accessible in DevTools
- [ ] Body background dark (#030014)
- [ ] Ambient glow visible (subtle purple/blue radials)
- [ ] Grid overlay visible (subtle grid pattern)
- [ ] No CSS errors in console

---

### Day 6: Hero Section Glassmorphism

**6.1 Refactor hero.css - Glass card**

File: `src/styles/sections/hero.css`

Backup: `cp src/styles/sections/hero.css src/styles/sections/hero.css.backup`

Elements to update:

**Hero container:**
- Add `.hero-glow` absolute positioned glow background
- Update `.hero-card` with glassmorphism:
  - `backdrop-filter: blur(20px)`
  - Semi-transparent background
  - Glass border
  - Shadow

**Hero header:**
- `.badge` - Purple tint background, pill shape
- `.hero-title` - Gradient text với `background-clip: text`
- `.hero-subtitle` - Muted color

**Form elements:**
- `.input-wrapper` - Glass background, purple glow on focus
- `.video-input` - Transparent, large font
- `.btn-paste` / `.btn-clear` - Purple tint, dark mode variations
- `.format-toggle` - Glass background, purple active state
- `.quality-select` - Glass background, custom dropdown
- `.btn-convert` - Gradient background, shine effect on hover

Reference: Demo lines 301-626

**6.2 Test responsive**
- [ ] Mobile (350px) - Single column, stacked elements
- [ ] Tablet (768px) - Wider inputs
- [ ] Desktop (1024px+) - Horizontal controls layout
- [ ] 2K/4K - Larger sizing

**Verification Day 6:**
- [ ] Hero card transparent với backdrop blur visible
- [ ] Ambient glow visible behind card
- [ ] Input focus → Purple glow effect
- [ ] Convert button → Gradient + shine on hover
- [ ] Format toggle active state purple
- [ ] Responsive layout no breaks
- [ ] Dark/light themes both work

---

### Day 7: Result View, Content Sections & Theme Switcher

**7.1 Create result-card styles**

Create new file: `src/styles/reusable-packages/result-card/result-card.css`

Styles for preview card:
- `.result-card-container` - Glass card, flex layout
- `.result-thumb` - 16:9 ratio, shadow
- `.result-details` - Flex column
- `.result-title` - Display font
- `.result-meta` - Badges, author info

Import in `src/main.ts`

Reference: Demo lines 663-729

**7.2 Update content sections glassmorphism**

File: `src/styles/sections/content.css`

Update existing styles:
- `.info-card` - Glass background, glass border
- `.section-header`, `.section-icon` - Purple tint
- `.step` - Glass background, hover gradient effects
- `.step-number` - Large, gradient on hover
- `.faq-item` - Subtle borders

Reference: Demo lines 840-1013

**7.3 Add theme switcher**

**HTML Changes:**
Add theme toggle button to header navigation:
- Icon button with ID `#theme-toggle`
- Sun icon (hidden by default)
- Moon icon (visible by default)

**TypeScript Module:**
Create: `src/ui-components/theme-switcher/theme-switcher.ts`

Functions:
- `initThemeSwitcher()` - Setup toggle logic + load saved theme
- Private helpers: Toggle icons, save to localStorage

**Integration:**
Import and call `initThemeSwitcher()` trong `downloader-ui.ts` init function

**CSS for icons:**
Toggle visibility based on `data-theme` attribute on `<html>`

**Verification Day 7:**
- [ ] Result card renders với glassmorphism
- [ ] Preview card responsive layout
- [ ] Content sections have glass effects
- [ ] Steps hover → Number gets gradient
- [ ] Theme toggle button visible in header
- [ ] Click toggle → Theme switches (dark ↔ light)
- [ ] Theme persists after page reload
- [ ] Both themes look good (colors, contrast)

---

## ✅ FINAL CHECKLIST

### Phase 1 Complete

TypeScript Integration:
- [ ] All required IDs present
- [ ] View switching works
- [ ] Form submit works (no reload)
- [ ] Format selector renders
- [ ] Suggestions work
- [ ] Preview renders
- [ ] Search results render
- [ ] Mobile menu works
- [ ] No console errors
- [ ] Build succeeds

### Phase 2 Complete

CSS Refactor:
- [ ] Theme system (dark/light)
- [ ] Glassmorphism visible
- [ ] Ambient backgrounds
- [ ] Grid overlay
- [ ] Hero glass card
- [ ] Input purple glow
- [ ] Gradient buttons
- [ ] Result card glass
- [ ] Content sections glass
- [ ] Theme switcher works
- [ ] Responsive (350px - 4K)
- [ ] No layout breaks

---

## 🎯 SUCCESS CRITERIA

**Before:**
- ☀️ Light theme only
- 📋 Single view (append)
- ❌ No glassmorphism
- ❤️ Red/pink colors

**After:**
- 🌙 Dark + light themes
- ✨ Glassmorphism design
- 🔄 2-view structure
- 💜 Purple/blue colors
- 🎨 Ambient effects
- ✅ All TypeScript preserved

---

## 📚 FILES REFERENCE

- **Demo:** `demo_ytmp3_dark_v1.html`
- **Requirements:** `HTML-REQUIREMENTS.md`
- **Current:** `index.html`
- **Entry:** `src/main.ts`
- **UI:** `src/features/downloader/downloader-ui.ts`

---

**Created:** 2025-12-10
**Updated:** 2025-12-10
**Status:** Ready to Execute 🚀
