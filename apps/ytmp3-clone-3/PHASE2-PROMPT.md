# PHASE 2: CSS Refactor - Extract Inline CSS to External Files

**Mục tiêu:** Extract toàn bộ CSS từ inline `<style>` tag trong `index.html` ra external files, tổ chức theo module, maintain theme switching và all effects.

**Scope:** Chỉ làm Phase 2 (CSS extraction). KHÔNG thay đổi design/UI/functionality.

---

## 📖 CONTEXT - Project Refactor Journey

### Tình trạng Project

Project **ytmp3-clone-3** đang trong quá trình **REFACTOR TOÀN BỘ UI** từ light theme cũ sang dark theme glassmorphism design mới.

### Phase 1: HTML Integration (✅ ĐÃ HOÀN THÀNH)

**Đã làm gì:**
- ✅ Clone toàn bộ HTML structure từ `demo_ytmp3_dark_v1.html` sang `index.html`
- ✅ Map IDs để tương thích TypeScript:
  - `#convert-form` → `#downloadForm`
  - `#video-url` → `#videoUrl`
  - Tất cả IDs critical đã có đủ
- ✅ Thêm missing containers:
  - `#format-selector-container`
  - `#content-area`
  - `#suggestion-container`
  - `#search-results-section`
- ✅ Implement 2-view design: `#search-view` ↔ `#result-view`
- ✅ Merge paste/clear buttons thành 1 toggle button
- ✅ Tạo `view-switcher.ts` module
- ✅ Integrate với TypeScript logic
- ✅ Test all features work

**Kết quả Phase 1:**
- HTML structure mới hoàn toàn từ demo
- CSS hiện đang **INLINE** trong `<style>` tag của `index.html`
- All TypeScript features hoạt động bình thường
- Theme toggle works (dark/light)
- Build succeeds, no errors

### Phase 2: CSS Extraction (🔄 ĐANG LÀM - NHIỆM VỤ CỦA BẠN)

**Current State:**
```
index.html:
  <head>
    <style>
      /* ±1000+ lines CSS inline */
      :root { --bg-body: ...; }
      [data-theme="light"] { ... }
      .hero-card { ... }
      .form-container { ... }
      /* ... tất cả CSS */
    </style>
  </head>
```

**Nhiệm vụ của bạn:**
- Extract toàn bộ CSS ra external files
- Organize theo modules (variables, themes, layout, components, utilities)
- Maintain 100% functionality
- Zero visual changes

**Tại sao cần làm Phase 2:**
- Hiện tại CSS quá dài (1000+ lines) trong 1 `<style>` tag
- Khó maintain, khó tìm kiếm
- Không tái sử dụng được
- Cần organize cho Phase 3 (optimization)

### Phase 3: CSS Optimization (⏳ SAU NÀY)

**Chưa làm, Phase 2 xong mới làm:**
- Remove duplicate CSS
- Consolidate selectors
- Performance optimization
- Critical CSS extraction

---

## 🎯 CURRENT STATE - Trước khi bắt đầu Phase 2

### File Structure Hiện Tại

```
index.html
  → Có <style> tag với ±1000 lines CSS
  → HTML structure đã refactor xong (Phase 1)
  → TypeScript logic hoạt động tốt

src/styles/
  → Có existing CSS files (từ version cũ)
  → Cần ADD files mới cho design mới
  → Cần MERGE vào existing files nếu phù hợp

src/main.ts
  → Import existing CSS: import './styles/base.css'
  → Cần UPDATE để import CSS mới
```

### What's Working Now

- ✅ HTML structure mới (2-view design)
- ✅ Theme toggle (dark ↔ light)
- ✅ View switching (search ↔ result)
- ✅ TypeScript features (form, format selector, suggestions, preview, search)
- ✅ Glassmorphism effects
- ✅ Animations (fade-in, spin, shine)
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Mobile drawer menu
- ✅ All hover effects

### What Needs to Be Done (Your Task)

- 🔲 Extract CSS từ `<style>` tag
- 🔲 Organize vào files trong `src/styles/`
- 🔲 Create/update entry file
- 🔲 Import vào `src/main.ts`
- 🔲 Remove `<style>` tag
- 🔲 Test everything still works
- 🔲 Verify zero visual changes

---

## 📚 FILES CẦN ĐỌC

Đọc theo thứ tự để hiểu context:

1. **`/Users/macos/Documents/work/downloader/Project-root/docs/task-workflow.md`** - Workflow chuẩn (đọc 1 lần/conversation)
2. **`CSS-REFACTOR-GUIDE.md`** - Hướng dẫn chi tiết cách extract và organize CSS
3. **`index.html`** - **SOURCE CSS** cần extract (đọc `<style>` tag - ±1000 lines)
4. **`src/styles/`** - Existing CSS structure (để hiểu merge strategy)
5. **`src/main.ts`** - Entry point hiện tại (xem CSS imports)
6. **`PHASE1-PROMPT.md`** (optional) - Để hiểu Phase 1 đã làm gì

---

## 🎯 NHIỆM VỤ

### ⚠️ BEFORE YOU START - MANDATORY

**Trước khi viết bất kỳ code nào, BẮT BUỘC phải:**

1. **Đọc đầy đủ files** trong "FILES CẦN ĐỌC"
2. **Phân tích current state:**
   - Existing CSS files trong `src/styles/`
   - CSS trong `<style>` tag của `index.html`
   - Current imports trong `src/main.ts`
3. **Tạo extraction strategy:**
   - List files cần CREATE
   - List files cần MERGE
   - Estimate lines cho mỗi file
   - Import order plan
4. **Report strategy** và xin approval từ user
5. **CHỈ KHI được approve** mới bắt đầu code

**KHÔNG được:**
- ❌ Bắt đầu extract ngay lập tức
- ❌ Tự quyết định merge strategy
- ❌ Tạo files mà chưa report plan
- ❌ Xóa CSS cũ mà chưa backup

---

### 1. Phân Tích CSS Hiện Tại & Existing Structure

**Làm gì:**
- Đọc toàn bộ `<style>` tag trong `index.html` (source CSS)
- Identify các nhóm CSS:
  - CSS Variables (`:root`, `[data-theme="light"]`)
  - Reset & Base styles
  - Layout (header, footer, container)
  - Components (hero-card, form, buttons, result-card, status, drawer, steps, features, faq)
  - Utilities (animations, helper classes)
- **QUAN TRỌNG:** Đọc `src/styles/` để hiểu existing structure:
  - Existing files: `base.css`, `reset.css`, `common.css`, `sections/header.css`, etc.
  - Cần quyết định: CREATE new files vs MERGE vào existing files
  - Ví dụ: Header CSS có thể MERGE vào `sections/header.css` existing

**Đảm bảo:**
- Hiểu đầy đủ CSS structure trước khi extract
- Không bỏ sót bất kỳ rule nào
- **Có strategy rõ ràng:** file nào create mới, file nào merge
- **HỎI user nếu không chắc:** "CSS X nên merge vào existing file Y hay tạo file mới Z?"

### 2. Extract & Organize CSS

**Strategy: CREATE NEW + MERGE EXISTING**

**Files cần CREATE (không tồn tại):**
- `src/styles/variables.css` - CSS custom properties từ demo
- `src/styles/themes/light.css` - Light theme overrides
- `src/styles/themes/dark.css` (optional)
- `src/styles/layout/grid.css` - Grid overlay, ambient glow
- `src/styles/components/hero-card.css` - New glassmorphism hero
- `src/styles/components/form-input.css` - New input styles
- `src/styles/components/buttons.css` - New button styles
- `src/styles/components/format-toggle.css` - MP3/MP4 toggle
- `src/styles/components/quality-select.css` - Quality dropdown
- `src/styles/components/result-card.css` - Result/preview card
- `src/styles/components/status-bar.css` - Processing status
- `src/styles/components/drawer.css` - Mobile drawer
- `src/styles/components/steps.css` - How-to steps
- `src/styles/components/badge.css` - Badges
- `src/styles/utilities/animations.css` - Keyframes
- `src/styles/utilities/helpers.css` - Helper classes

**Files cần MERGE (đã tồn tại):**
- Merge header CSS → `src/styles/sections/header.css` (existing)
- Merge footer CSS → `src/styles/sections/footer.css` (existing)
- Merge hero CSS → `src/styles/sections/hero.css` (existing)
- Merge features CSS → `src/styles/sections/features.css` (existing)
- Merge FAQ CSS → `src/styles/sections/faq.css` (existing)
- Merge base styles → `src/styles/base.css` (existing)
- Merge reset → `src/styles/reset.css` (existing)

**Làm gì:**
- Copy CSS từ `<style>` tag vào đúng files
- **NẾU file existing:** Append CSS mới vào cuối file, thêm comment `/* === New Design - Phase 2 === */`
- **NẾU file mới:** Create file với structure rõ ràng
- Giữ nguyên comments và structure
- Maintain media queries trong component files

**Đảm bảo:**
- Import order đúng trong entry file
- No duplicate CSS between old and new
- Media queries ở đúng component
- Comments rõ ràng phân biệt old vs new CSS
- **NẾU conflict:** HỎI user trước khi overwrite

### 3. Integration

**Làm gì:**
- **UPDATE existing entry** (có thể là `src/main.ts` hoặc tạo `src/styles/index.css`)
- Import tất cả CSS files theo đúng order:
  1. Variables (NEW)
  2. Reset (EXISTING + merge)
  3. Base (EXISTING + merge)
  4. Common (EXISTING)
  5. Themes (NEW)
  6. Layout (NEW)
  7. Sections (EXISTING + merge)
  8. Components (NEW)
  9. Reusable packages (EXISTING)
  10. Utilities (NEW)
- **CRITICAL:** Đọc `src/main.ts` hiện tại để xem CSS imports hiện có
- **Strategy:** Append new imports hoặc refactor toàn bộ import structure?
- Xóa `<style>` tag khỏi `index.html` SAU KHI verify everything works

**Đảm bảo:**
- Import order đúng (Variables → ... → Utilities)
- Existing imports không bị break
- Vite build không errors
- Hot reload works trong dev
- Production build minifies CSS
- No CSS missing

### 4. Testing

**Test đầy đủ:**
- Dark theme hiển thị đúng
- Light theme toggle works smooth
- All components render correctly
- Responsive design works (mobile, tablet, desktop)
- Hover effects work
- Animations work (fade-in, spin, shine effect)
- Glassmorphism effects work (backdrop-filter)
- Ambient background glows
- Grid overlay
- Mobile drawer
- Header scroll effect
- Theme persistence (localStorage)

**Đảm bảo:**
- No visual differences trước/sau refactor
- No console errors
- No missing styles
- Theme switcher works
- `npm run dev` works
- `npm run build` succeeds

---

## ⚠️ CONSTRAINTS (BẮT BUỘC)

### CSS Features - KHÔNG XÓA

```
- CSS Variables (all --* properties)
- Dark theme (default)
- Light theme ([data-theme="light"])
- Glassmorphism (backdrop-filter)
- Animations (@keyframes fadeIn, spin)
- Gradient effects
- Ambient background glows (body::before)
- Grid overlay (body::after)
- Hover effects
- Transitions
- Media queries
- Theme toggle logic (via data-theme attribute)
```

### Import Order - CRITICAL

```
1. variables.css      ← Must be FIRST
2. reset.css
3. themes/*.css       ← After variables
4. layout/*.css
5. components/*.css
6. utilities/*.css    ← Must be LAST
```

### File Organization Rules

- One component = One file (dễ maintain)
- Media queries TRONG component file, KHÔNG tách riêng
- Comments giữ nguyên từ original CSS
- Naming convention: kebab-case (hero-card.css, not heroCard.css)

---

## 🚫 KHÔNG LÀM

- ❌ Thay đổi CSS values (colors, spacing, fonts)
- ❌ Thay đổi class names hoặc IDs
- ❌ Xóa CSS rules (dù nghĩ là unused)
- ❌ Thêm CSS mới (optimization sau)
- ❌ Thay đổi media query breakpoints
- ❌ Refactor selectors (keep as-is)
- ❌ Merge CSS files tùy ý (follow structure)

**Chỉ focus:** Extract và organize, giữ nguyên 100% functionality

---

## 💬 COMMUNICATION

### Quy tắc

**NẾU không chắc chắn:**
- CSS rule này nên vào file nào?
- Component này đã có file CSS chưa?
- Import order có đúng không?
- Build error không hiểu?
- Visual difference sau khi extract?

→ **DỪNG** và **HỎI** user

### Report Format

**Bắt đầu:**
```
✅ Đã đọc:
  - task-workflow.md
  - CSS-REFACTOR-GUIDE.md
  - index.html (<style> tag - X lines CSS)
  - src/styles/ structure
  - src/main.ts (current CSS imports)

📊 Current State Analysis:
  - Existing CSS files: [list key files]
  - CSS in <style> tag: [summary - variables, components, etc.]

📋 Extraction Strategy:
  CREATE NEW:
    - variables.css (±50 lines - CSS custom properties)
    - themes/light.css (±35 lines - theme overrides)
    - [list other new files with estimated lines]

  MERGE EXISTING:
    - sections/header.css (add ±100 lines new header styles)
    - sections/footer.css (add ±40 lines new footer)
    - [list other merges]

  IMPORT STRATEGY:
    Option A: Create src/styles/index.css as new entry
    Option B: Update imports in src/main.ts directly
    → Tôi đề xuất: [A or B with reason]

⚠️ Conflicts Detected:
  - [list any potential conflicts, or "None"]

❓ Questions:
  - [any unclear items, or "Ready to proceed"]

Có thể bắt đầu không?
```

**Progress:**
```
✅ Completed:
  - variables.css created (50 lines)
  - themes/light.css created (35 lines)
  - Merged header.css (+120 lines)
  - [list done items]

🔄 In Progress:
  - Creating components/hero-card.css
  - Extracting lines 323-340 from index.html

⏭️ Next:
  - components/form-input.css
  - [remaining items - X/Y total]

📊 Progress: 30% (6/20 files)
```

**Blockers:**
```
Issue: [CSS rule X không biết đặt đâu]
Context: [đang extract component Y]
Options:
  A. Tạo file mới Z.css
  B. Merge vào file existing W.css
Bạn chọn gì?
```

**Hoàn thành:**
```
🎉 Phase 2 Completed ✅

📁 Files Created:
  - src/styles/variables.css (50 lines)
  - src/styles/themes/light.css (35 lines)
  - [list all new files with line counts]

📝 Files Merged:
  - src/styles/sections/header.css (+120 lines)
  - src/styles/sections/footer.css (+40 lines)
  - [list all merged files with added line counts]

✅ Verification:
  - Visual check: PASS (no differences)
  - Dark theme: PASS
  - Light theme toggle: PASS
  - Responsive: PASS
  - Animations: PASS
  - Build: PASS (npm run build)
  - Dev mode: PASS (npm run dev)

📊 Stats:
  - Total CSS extracted: X lines
  - Files created: Y
  - Files merged: Z
  - <style> tag removed: YES
  - Zero visual changes: CONFIRMED

🔗 Next Steps:
  - Phase 3: CSS Optimization (optional)
  - Or: Consider Phase 2 complete, ready for production

Ready for Phase 3?
```

---

## ✅ COMPLETION CRITERIA

Phase 2 hoàn thành khi:

- [ ] Tất cả CSS extracted từ `<style>` tag
- [ ] Files organized theo structure rõ ràng
- [ ] Entry file với đúng import order
- [ ] Imported vào `src/main.ts`
- [ ] `<style>` tag đã xóa khỏi `index.html`
- [ ] Dark theme works
- [ ] Light theme toggle works
- [ ] All components render correctly
- [ ] Responsive design works
- [ ] Hover effects work
- [ ] Animations work
- [ ] Glassmorphism works
- [ ] No visual differences
- [ ] No console errors
- [ ] `npm run dev` works
- [ ] `npm run build` succeeds
- [ ] Ready for optimization (optional Phase 3)

---

## 📌 REFERENCE

**Key Files:**
- Source CSS: `index.html` (inline `<style>` tag)
- Target: `src/styles/` directory
- Entry: `src/main.ts`
- Guide: `CSS-REFACTOR-GUIDE.md`

**Verify Commands:**
```bash
npm run dev     # Check hot reload
npm run build   # Check production build
```

**Visual Check:**
- Compare before/after screenshots
- Toggle theme multiple times
- Test all breakpoints
- Check all hover states

---

**Expected Outcome:** CSS extracted, organized, maintainable. Zero visual differences. Theme switching works. Build succeeds. Ready for future CSS optimization.

---

**Created:** 2025-12-10
**Scope:** Phase 2 Only
**Prerequisite:** Phase 1 completed
