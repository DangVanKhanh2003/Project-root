# PHASE 4: EXTRACT UI COMPONENTS - HƯỚNG DẪN CHO AI

> **Phase:** UI Components (Tuần 9-10)
> **Mục tiêu:** Extract các UI components có thể tái sử dụng
> **Mức độ rủi ro:** 🟡 Trung bình
> **Yêu cầu:** Phase 1, 2, 3 đã hoàn thành

---

## ⚠️ QUAN TRỌNG: TÀI LIỆU NÀY KHÔNG CHỨA CODE

**Tài liệu này chứa:**
- ✅ Đường dẫn files cần đọc
- ✅ Hướng dẫn làm GÌ
- ✅ Yêu cầu và ràng buộc
- ❌ KHÔNG CÓ CODE MẪU

**Bạn PHẢI:**
- Đọc code thực tế từ project files
- Phân tích UI components hiện tại
- Đề xuất approach của riêng bạn
- Thảo luận trước khi code

---

## 📚 TÀI LIỆU BẮT BUỘC PHẢI ĐỌC

### **Tài liệu quan trọng:**
1. `/docs/refactor/MASTER_REFACTOR_DOC.md` - Context tổng quan
2. `/docs/refactor/README.md` - Cách sử dụng hệ thống docs
3. `/docs/refactor/prompts/PHASE_1_EXTRACT_UTILITIES.md` - Pattern đã học
4. `/docs/refactor/prompts/PHASE_2_I18N_SYSTEM.md` - I18n integration
5. `/docs/refactor/prompts/PHASE_3_EXTRACT_CONVERSION.md` - Dependency Injection pattern
6. `/CLAUDE.md` - Quy tắc project

### **Code files cần đọc và phân tích:**

**UI Components hiện tại (ytmp3-clone-3):**
- `/apps/ytmp3-clone-3/src/ui-components/` (toàn bộ thư mục)
  - Tìm hiểu các components nào có
  - Components nào duplicated across apps
  - Components nào có thể share

**Cụ thể cần đọc:**
- Progress bar components
- Button components
- Input/form components
- Format selector components
- Download result components
- Error display components
- Loading/spinner components

**Compare với các apps khác:**
- `/apps/y2matepro/src/ui-components/` (nếu có)
- `/apps/ytmp3-clone-4/src/ui-components/`
- `/apps/ytmp3-clone-darkmode-3/src/ui-components/`
- `/apps/y2mate-new-ux/src/ui-components/`

**Styling:**
- Tìm CSS files của components
- Hiểu cách styling được implement
- CSS modules? Inline styles? CSS-in-JS?

---

## 🎯 MỤC TIÊU PHASE 4

### **Mục tiêu chính:**

1. **Extract base UI components:**
   - Progress bar component (circular/linear)
   - Button components
   - Input components
   - Format selector
   - Result display
   - Error display
   - Loading indicators

2. **Thiết kế hệ thống override:**
   - Base components với default styles
   - Các apps có thể override qua props
   - CSS custom properties cho theming
   - Class name customization

3. **Tích hợp i18n:**
   - Components sử dụng i18n từ Phase 2
   - Text có thể translate
   - RTL support

4. **Viết tests:**
   - Component rendering tests
   - Props validation tests
   - User interaction tests
   - Target: 70%+ coverage (UI thường khó test 80%)

5. **Migrate ytmp3-clone-4:**
   - Sử dụng base components
   - Customize theo UI riêng
   - Verify UI giống y hệt trước

### **Tiêu chí thành công:**
- [ ] Base components extracted vào packages/ui-components/
- [ ] Override system hoạt động tốt
- [ ] I18n integrated
- [ ] 70%+ test coverage
- [ ] ytmp3-clone-4 UI identical với trước
- [ ] Các apps khác KHÔNG bị ảnh hưởng

---

## 🚫 RÀNG BUỘC QUAN TRỌNG

### **KHÔNG ĐƯỢC:**
- ❌ Force apps dùng chung UI/UX
- ❌ Hard-code colors/styles trong components
- ❌ Break existing UI trong quá trình extract
- ❌ Thay đổi behavior của components
- ❌ Bỏ qua override capability

### **BẮT BUỘC:**
- ✅ Cho phép apps customize mọi thứ
- ✅ Base components là foundation, không phải rule
- ✅ CSS custom properties cho theming
- ✅ Class names có thể override
- ✅ Props cho customization
- ✅ Verify UI không thay đổi sau migration

---

## 🎨 CHIẾN LƯỢC UI COMPONENTS

### **Nguyên tắc thiết kế:**

**1. Base Components = Foundation**
- Cung cấp structure và functionality
- Default styling reasonable
- Dễ dàng override

**2. Customization Layers:**

**Layer 1 - Props:**
```
Component nhận props để customize:
- className (thêm custom classes)
- style (inline styles)
- variant (predefined variants)
- theme (color scheme)
```

**Layer 2 - CSS Custom Properties:**
```
Components sử dụng CSS variables:
- --primary-color
- --button-bg-color
- --progress-color
Apps override variables trong CSS
```

**Layer 3 - Complete Override:**
```
Apps có thể:
- Không dùng base component
- Wrap base component
- Extend base component
```

### **Ví dụ cách hoạt động:**

**Base Button Component:**
- Functionality: onClick, disabled, loading state
- Default: Basic button styling
- Customizable: Colors, sizes, borders qua props + CSS vars

**App sử dụng:**
- y2matepro: Override colors theo brand
- ytmp3-clone-darkmode-3: Dark theme colors
- y2mate-new-ux: Hoàn toàn khác UI nhưng dùng chung functionality

---

## 📋 CÁC TASK CHI TIẾT

### **Task 1: Phân tích UI Components hiện tại**

**Cần làm:**

1. **Inventory tất cả UI components:**
   - List toàn bộ components trong ytmp3-clone-3
   - Categorize: Input, Display, Feedback, Layout
   - Note dependencies giữa components

2. **So sánh across apps:**
   - Components nào giống nhau?
   - Differences là gì?
   - Duplicated code bao nhiêu?

3. **Identify extractable components:**
   - Components nào có thể share?
   - Components nào quá specific cho 1 app?
   - Priority order extraction

4. **Analyze styling approach:**
   - CSS modules? Plain CSS? CSS-in-JS?
   - How colors/themes được manage?
   - Responsive design approach?

**Output yêu cầu:**
- Component inventory list
- Duplication analysis
- Extraction priority list
- Styling strategy proposal

**⚠️ KHÔNG tiếp tục Task 2 cho đến khi hoàn thành phân tích này.**

---

### **Task 2: Thiết kế Component API**

**Dựa trên Task 1 analysis:**

**Cần thiết kế:**

1. **Props structure:**
   - Common props cho tất cả components
   - Specific props cho từng component
   - Optional vs required props

2. **Customization strategy:**
   - Sử dụng CSS custom properties như thế nào?
   - Class name pattern?
   - Variant system?

3. **I18n integration:**
   - Components nhận translations như thế nào?
   - Default text vs translated text?

**Output yêu cầu:**
- Component API design document
- Props interface cho từng component
- Customization examples
- I18n integration approach

**⚠️ Phải thảo luận và được approve trước Task 3.**

---

### **Task 3: Extract Button Components**

**Input:** Đọc button components từ ytmp3-clone-3

**Output location:** `/packages/ui-components/src/Button/`

**Cần extract:**

1. **Base Button:**
   - Click handling
   - Disabled state
   - Loading state
   - Variants (primary, secondary, etc.)

2. **Download Button:**
   - Button với download icon
   - Download progress state
   - Success/error states

3. **Styling:**
   - Base CSS với custom properties
   - Variants CSS
   - Responsive styles

**Test requirements:**
- [ ] Renders correctly
- [ ] Click handler works
- [ ] Disabled state works
- [ ] Loading state displays
- [ ] Custom className applied
- [ ] CSS vars can override colors

---

### **Task 4: Extract Progress Components**

**Input:** Progress bar components từ ytmp3-clone-3

**Output location:** `/packages/ui-components/src/Progress/`

**Cần extract:**

1. **Circular Progress:**
   - Percentage display
   - Status text
   - Animations
   - Phases (processing, merging)

2. **Linear Progress:**
   - Progress bar
   - Percentage indicator
   - Customizable colors

3. **Progress Spinner:**
   - Loading spinner
   - Different sizes
   - Colors customizable

**Special considerations:**
- Progress components được dùng bởi conversion strategies
- Phải work với StateUpdater pattern
- Animation performance critical

**Test requirements:**
- [ ] Renders with different percentages
- [ ] Updates smoothly
- [ ] Animations work
- [ ] Custom colors apply
- [ ] RTL layout works

---

### **Task 5: Extract Input Components**

**Input:** Input/form components từ ytmp3-clone-3

**Output location:** `/packages/ui-components/src/Input/`

**Cần extract:**

1. **Text Input:**
   - URL input field
   - Validation states
   - Error display
   - Placeholder

2. **Format Selector:**
   - Dropdown/radio for formats
   - Quality selector
   - Visual format indicators

**I18n integration:**
- Placeholder text translated
- Error messages translated
- Labels translated

**Test requirements:**
- [ ] Value updates correctly
- [ ] Validation works
- [ ] Error states display
- [ ] I18n text renders
- [ ] Custom styling applies

---

### **Task 6: Extract Display Components**

**Input:** Result/display components từ ytmp3-clone-3

**Output location:** `/packages/ui-components/src/Display/`

**Cần extract:**

1. **Result Card:**
   - Video info display
   - Thumbnail display
   - Metadata display

2. **Error Display:**
   - Error messages
   - Error icons
   - Retry button

3. **Success Display:**
   - Success message
   - Download link
   - Share buttons (if any)

**Test requirements:**
- [ ] Displays data correctly
- [ ] I18n works
- [ ] Responsive layout
- [ ] Custom styling applies

---

### **Task 7: Setup CSS Custom Properties System**

**Create theming system:**

**Base theme file:** `/packages/ui-components/src/theme/variables.css`

**Cần define:**

```
Color variables:
--primary-color
--secondary-color
--success-color
--error-color
--text-color
--bg-color

Spacing variables:
--spacing-xs
--spacing-sm
--spacing-md
--spacing-lg

Component-specific:
--button-bg
--button-text
--progress-color
--input-border
```

**Usage:**
- Components reference CSS vars
- Apps override trong app-level CSS
- Dark mode = override color vars

**Documentation:**
- List all available CSS vars
- Default values
- Override examples

---

### **Task 8: Package Configuration**

**Files cần create/update:**

1. `/packages/ui-components/package.json`
   - Dependencies (minimal)
   - Exports config
   - Scripts

2. `/packages/ui-components/src/index.ts`
   - Export all components
   - Export types
   - Export CSS

3. `/packages/ui-components/README.md`
   - Component usage guide
   - Customization guide
   - I18n integration
   - Examples (reference code, không viết code trong README)

4. `/packages/ui-components/tsconfig.json`
   - TypeScript config
   - Include CSS types

---

### **Task 9: Integrate I18n**

**Components cần i18n:**

1. **Identify text trong components:**
   - Button labels
   - Placeholder text
   - Error messages
   - Status messages

2. **Use @downloader/i18n:**
   - Import translation hook/function
   - Wrap text với translation calls
   - Provide translation keys

3. **Update locale files:**
   - Add component text keys
   - Translate cho 19 ngôn ngữ (hoặc placeholder)

**Validation:**
- [ ] Components render translated text
- [ ] Language switching works
- [ ] RTL layout works với translated text

---

### **Task 10: Migrate ytmp3-clone-4**

**Migration steps:**

1. **Add dependency:**
   ```
   Update apps/ytmp3-clone-4/package.json
   Add "@downloader/ui-components": "workspace:*"
   Run pnpm install
   ```

2. **Replace components từng cái một:**
   - Start with simplest (Button)
   - Then Progress
   - Then Input
   - Finally complex components

3. **Apply customization:**
   - Override CSS vars nếu cần
   - Add custom classes nếu cần
   - Ensure UI looks identical

4. **Delete old components:**
   - Delete local button component
   - Delete local progress component
   - Etc.

5. **Test từng component sau khi replace:**
   - Visual comparison
   - Functionality test
   - Interaction test

**Validation checklist:**
- [ ] App builds without errors
- [ ] UI looks identical với trước
- [ ] All interactions work
- [ ] No visual regressions
- [ ] Performance same hoặc better
- [ ] No console errors

---

## 🔄 WORKFLOW CHO PHASE NÀY

### **Bước 1: THẢO LUẬN (BẮT BUỘC)**

**Trước khi code, gửi message:**

```
Tôi bắt đầu Phase 4: Extract UI Components

Đã đọc tài liệu:
- ✅ MASTER_REFACTOR_DOC.md
- ✅ README.md
- ✅ PHASE_4_UI_COMPONENTS.md

Files đã phân tích:
- ✅ apps/ytmp3-clone-3/src/ui-components/ ([X] components found)
- ✅ So sánh với các apps khác
- ✅ CSS/styling approach

PHÂN TÍCH UI COMPONENTS:

Components tìm thấy trong ytmp3-clone-3:
1. Button components:
   - [List components]
   - Styling: [CSS modules/plain CSS/etc]

2. Progress components:
   - [List components]
   - Animation: [Approach used]

3. Input components:
   - [List components]

4. Display components:
   - [List components]

5. [Continue...]

SO SÁNH GIỮA CÁC APPS:

Giống nhau:
- [List similarities]
- Duplication: ~[X] lines

Khác nhau:
- y2matepro: [Differences]
- ytmp3-clone-darkmode-3: [Dark theme differences]
- y2mate-new-ux: [UX differences]

CHIẾN LƯỢC CUSTOMIZATION:

Đề xuất approach:
1. CSS Custom Properties cho colors/spacing
2. Props cho variants (primary/secondary/etc)
3. className prop cho custom styling
4. [Giải thích approach]

Ví dụ:
- Base Button: [Mô tả functionality]
- Apps override: [Cách override]

I18N INTEGRATION:

Text cần translate:
- Button labels: [List]
- Placeholders: [List]
- Error messages: [List]
- Status text: [List]

Approach:
- Components nhận translation keys
- Use @downloader/i18n from Phase 2
- [Chi tiết approach]

CÂU HỎI TRƯỚC KHI TIẾP TỤC:

1. Component API design - Có ổn không?
2. CSS Custom Properties approach - Đúng hướng chưa?
3. Nên extract components theo thứ tự nào? (simple → complex)
4. [Câu hỏi khác]

ĐỀ XUẤT THỨ TỰ IMPLEMENT:

1. Setup package structure
2. CSS Custom Properties system
3. Extract Button (đơn giản nhất)
4. Extract Progress (trung bình)
5. Extract Input
6. Extract Display components
7. I18n integration
8. Migrate clone-4

RỦI RO:

1. **UI breaking risk:**
   - Risk: UI thay đổi sau migration
   - Mitigation: Visual comparison testing

2. **Customization insufficient:**
   - Risk: Apps không customize được đủ
   - Mitigation: Flexible props + CSS vars

3. [Rủi ro khác]

⚠️ Chờ approval trước khi code.

Awaiting your approval.
```

**⚠️ ĐỢI APPROVAL. KHÔNG ĐƯỢC SKIP.**

---

### **Bước 2: IMPLEMENTATION**

Sau khi được approve:

1. Create branch: `refactor/phase-4-ui-components`

2. Implement theo thứ tự approved

3. Test từng component trước khi sang component tiếp

---

### **Bước 3: VERIFICATION**

**Automated tests:**
- `pnpm test` - Component tests passing
- `pnpm test:coverage` - 70%+ coverage

**Visual testing:**
- Run ytmp3-clone-4: `pnpm run dev`
- So sánh UI với clone-3
- Screenshot comparison
- Check responsive breakpoints

**Manual testing checklist:**
- [ ] Buttons clickable và display correct states
- [ ] Progress bars animate smoothly
- [ ] Inputs accept text và validate
- [ ] Format selector works
- [ ] Error messages display
- [ ] Success states display
- [ ] All i18n text translates
- [ ] RTL layout works (Arabic/Urdu)
- [ ] Dark mode works (nếu app có)

**Cross-browser testing:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

---

### **Bước 4: REVIEW**

**Create PR:**

Title: `[Phase 4] Extract UI components với customization system`

Description:
```markdown
## Phase 4: UI Components

### Tóm tắt
Extracted reusable UI components với flexible customization system.

### Changes
- ✅ Created packages/ui-components/
- ✅ Extracted Button components
- ✅ Extracted Progress components
- ✅ Extracted Input components
- ✅ Extracted Display components
- ✅ CSS Custom Properties theming system
- ✅ I18n integration
- ✅ Migrated ytmp3-clone-4
- ✅ Written [X] component tests
- ✅ Achieved [X]% coverage

### Components Extracted
1. Button ([X] variants)
2. Progress (circular, linear, spinner)
3. Input (text, format selector)
4. Display (result card, error, success)

### Customization System
- CSS Custom Properties: [X] variables
- Props-based customization
- Class name override
- Complete override capability

### I18n Integration
- [X] translation keys added
- All component text translatable
- RTL support verified

### Test Results
- Component tests: [X] passing
- Coverage: [X]%
- Visual testing: ✅ UI identical

### Verification
- clone-3 (original): ✅ Working
- clone-4 (migrated): ✅ UI identical
- Customization: ✅ Tested with overrides

### Files Changed
**Added:**
- packages/ui-components/src/ ([X] components)
- packages/ui-components/src/theme/variables.css
- packages/ui-components/tests/ ([X] tests)

**Modified:**
- apps/ytmp3-clone-4/src/ (using base components)
- packages/i18n/src/locales/ (component translation keys)

**Deleted:**
- apps/ytmp3-clone-4/src/ui-components/ (old components)

### Next Steps
Ready for Phase 5: Pilot Migration
```

---

## ✅ DEFINITION OF DONE

Phase 4 hoàn thành khi:

- [ ] Base UI components extracted vào packages/ui-components/
- [ ] CSS Custom Properties theming system hoạt động
- [ ] Props-based customization works
- [ ] I18n integrated cho all component text
- [ ] 70%+ test coverage achieved
- [ ] All component tests passing
- [ ] ytmp3-clone-4 migrated successfully
- [ ] ytmp3-clone-4 UI identical với original
- [ ] No visual regressions
- [ ] No performance regressions
- [ ] Apps khác KHÔNG bị ảnh hưởng
- [ ] PR created với complete description
- [ ] PR approved by reviewers
- [ ] Code merged to main
- [ ] Progress updated in MASTER_REFACTOR_DOC.md

---

## 🆘 TROUBLESHOOTING

### **Nếu UI bị thay đổi sau migration:**

**CRITICAL - phải fix ngay:**

1. Screenshot before/after comparison
2. Identify exact differences
3. Check CSS vars được apply chưa
4. Check custom classes được add chưa
5. Revert nếu cần và analyze

### **Nếu customization không đủ linh hoạt:**

1. Thêm props cần thiết
2. Thêm CSS vars
3. Thêm variant options
4. Document cách override

### **Nếu components conflict với app-specific code:**

1. Rename components nếu cần
2. Use namespacing
3. Check import paths
4. Verify no naming conflicts

### **Nếu i18n không work:**

1. Verify translation keys exist
2. Check i18n hook được import
3. Test language switching
4. Check RTL layout

---

## 📊 EXPECTED METRICS

**Sau Phase 4:**
- Components extracted: ~8-12 components
- CSS Custom Properties: ~20-30 variables
- Tests written: ~40-50 tests
- Coverage: 70-80%
- Apps migrated: 1 (ytmp3-clone-4)
- Duplicate UI code reduced: ~1,000-2,000 lines

---

**Sẵn sàng bắt đầu Phase 4! Components là foundation cho UI consistency.** 🎨

**Nhớ: ĐỌC → PHÂN TÍCH → THẢO LUẬN → APPROVE → CODE → TEST KỸ**
