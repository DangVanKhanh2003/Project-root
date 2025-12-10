# PHASE 1: Tích Hợp HTML Mới Với TypeScript Logic

**Mục tiêu:** Clone HTML structure từ `demo_ytmp3_dark_v1.html` và tích hợp vào project TypeScript hiện tại, đảm bảo tất cả features hoạt động.

**Scope:** Chỉ làm Phase 1 (HTML integration). CHƯA refactor CSS.

---

## 📚 FILES CẦN ĐỌC

Đọc theo thứ tự để hiểu context:

1. **`/Users/macos/Documents/work/downloader/Project-root/CLAUDE.md`** - Project overview, tech stack
2. **`HTML-REQUIREMENTS.md`** - Danh sách IDs/containers BẮT BUỘC phải có
3. **`REFACTOR-PLAN.md`** - Workflow Phase 1 (Days 1-4), chỉ đọc Phase 1
4. **`demo_ytmp3_dark_v1.html`** - HTML template cần clone
5. **`index.html`** - HTML hiện tại (để compare)
6. **`src/main.ts`** & **`src/features/downloader/downloader-ui.ts`** - TypeScript entry points

---

## 🎯 NHIỆM VỤ

### 1. Tích Hợp HTML Structure

**Làm gì:**
- Copy HTML structure từ `demo_ytmp3_dark_v1.html` sang `index.html`
- Map demo IDs → required IDs (theo `HTML-REQUIREMENTS.md`)
- Thêm missing containers mà demo không có
- Merge paste/clear buttons thành 1 toggle button

**Đảm bảo:**
- Tất cả IDs trong `HTML-REQUIREMENTS.md` table "BẮT BUỘC PHẢI CÓ" phải có
- `#format-selector-container` BÊN TRONG `#downloadForm`
- `#content-area` PHẢI tồn tại (CRITICAL - nếu thiếu form sẽ reload page)
- `#search-results-section` + `#search-results-container` phải có
- Class `suggesstion-list` giữ nguyên (typo cố ý)

### 2. Implement View Switching Logic

**Làm gì:**
- Tạo `src/features/downloader/ui-render/view-switcher.ts`
- Functions: `initViewSwitcher()`, `showSearchView()`, `showResultView()`
- Integrate vào `ui-renderer.ts` (call khi render preview)
- Wire up vào `downloader-ui.ts` (init + "Next" button)

**Đảm bảo:**
- Toggle class `hidden` trên `#search-view` và `#result-view`
- Default: search view visible, result view hidden
- Smooth transitions, no flash/flicker

### 3. Testing

**Test tất cả features:**
- Form submit (no page reload)
- Paste/Clear button toggle
- Format selector renders
- Suggestions dropdown
- YouTube preview renders vào `#content-area`
- Search results render vào `#search-results-container`
- View switching (search ↔ result)
- Mobile menu

**Đảm bảo:**
- No console errors
- No TypeScript errors
- `npm run build` succeeds
- All features work như trước refactor

---

## ⚠️ CONSTRAINTS (BẮT BUỘC)

### Critical IDs - KHÔNG XÓA/ĐỔI TÊN

```
#downloadForm
#videoUrl
#input-action-button
#format-selector-container
#suggestion-container
#content-area              ← CRITICAL! Thiếu = form reload page
#search-results-section
#search-results-container
#mobileMenuToggle
#mobileMenuOverlay
#mobileCloseBtn
```

### Structure Requirements

- `#format-selector-container` PHẢI inside `#downloadForm`
- `#content-area` PHẢI exist (dù có thể empty)
- Paste/Clear buttons merge thành 1 button với 2 states (toggle via `data-action` attribute)

---

## 🚫 KHÔNG LÀM (Phase 2)

- ❌ Refactor CSS colors/themes
- ❌ Glassmorphism effects
- ❌ Theme switcher
- ❌ Google Fonts
- ❌ Ambient backgrounds

**Chỉ focus:** HTML structure + TypeScript integration

---

## 💬 COMMUNICATION

### Quy tắc

**NẾU không chắc chắn hoặc gặp conflict:**
- DỪNG lại
- HỎI user
- KHÔNG tự ý quyết định

**Ví dụ khi cần hỏi:**
- Demo không có element X nhưng requirements nói CRITICAL
- TypeScript query element Y nhưng không biết đặt ở đâu
- Conflict giữa demo structure và requirements
- Build errors không hiểu nguyên nhân

### Report Format

**Bắt đầu:**
```
Tôi đã đọc: [list files]
Nhiệm vụ: [tóm tắt hiểu như thế nào]
Có thể bắt đầu không?
```

**Progress:**
```
Completed: [tasks done]
Issues: [nếu có]
Next: [task tiếp theo]
```

**Blockers:**
```
Blocker: [mô tả]
Context: [đang làm gì]
Options: [các lựa chọn]
Bạn chọn gì?
```

**Hoàn thành:**
```
Phase 1 completed ✅
Checklist: [pass/fail items]
Ready for Phase 2?
```

---

## ✅ COMPLETION CRITERIA

Phase 1 hoàn thành khi:

- [ ] All required IDs present
- [ ] HTML structure từ demo integrated
- [ ] View switching works smooth
- [ ] All TypeScript features work (form, format selector, suggestions, preview, search)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] Mobile menu works
- [ ] Ready for Phase 2 (CSS refactor)

---

## 📌 REFERENCE

**Key Files:**
- Requirements: `HTML-REQUIREMENTS.md`
- Plan: `REFACTOR-PLAN.md` (Days 1-4)
- Demo: `demo_ytmp3_dark_v1.html`
- Target: `index.html`

**Verify Commands:**
```bash
npm run build
npm run dev
```

---

**Expected Outcome:** HTML mới với TypeScript logic hoạt động 100%, no bugs, no errors, ready for CSS refactor.

---

**Created:** 2025-12-10
**Scope:** Phase 1 Only
