không áp dụng cho apps/y2matepro
chỉ áp dụng cho các site còn lại thôi


# GIAI ĐOẠN 4 - MẪU REVIEW CHO AI CODE REVIEWER

> **Giai đoạn:** Giai đoạn 4 - Thành phần giao diện
> **Loại Review:** Code Review
> **Vai trò:** AI Code Reviewer

---

## 📚 PHẢI ĐỌC TRƯỚC KHI REVIEW

**BẮT BUỘC đọc (theo thứ tự):**
1. `/docs/refactor/MASTER_REFACTOR_DOC.md` - Context project
2. `/docs/refactor/REVIEWER_PROMPT.md` - Hướng dẫn review chung
3. `/docs/refactor/prompts/PHASE_4_UI_COMPONENTS.md` - Yêu cầu Phase 4
4. PR description và tất cả files thay đổi

---

## 🎯 MỤC TIÊU PHASE 4 CẦN VERIFY

### **Phase 4 cần đạt được:**

1. ✅ Extract base UI components vào `packages/ui-components/`:
   - Button components
   - Progress components (circular, linear, spinner)
   - Input components
   - Display components (result, error, success)

2. ✅ Customization system:
   - CSS Custom Properties cho theming
   - Props-based customization
   - Class name override capability
   - Complete override possible

3. ✅ I18n integration:
   - Component text translatable
   - 19 ngôn ngữ support
   - RTL layout works

4. ✅ Migrate ytmp3-clone-4:
   - Sử dụng base components
   - UI identical với trước
   - No visual regressions

5. ✅ Apps khác KHÔNG bị ảnh hưởng

---

## ✅ PHASE 4 REVIEW CHECKLIST

### **1. PACKAGE STRUCTURE**

#### **1.1 Component Files Exist**

Check files tồn tại trong packages/ui-components/:
- [ ] `src/Button/` directory
- [ ] `src/Progress/` directory
- [ ] `src/Input/` directory
- [ ] `src/Display/` directory
- [ ] `src/theme/variables.css`
- [ ] `src/index.ts` (barrel export)
- [ ] `tests/` directory
- [ ] `package.json`
- [ ] `README.md`

#### **1.2 Component Organization**

Mỗi component folder nên có:
- [ ] Component file (`.tsx` hoặc `.ts`)
- [ ] Styles file (`.css` hoặc `.module.css`)
- [ ] Types file (nếu cần)
- [ ] Test file
- [ ] index.ts export

**Ví dụ structure:**
```
Button/
├── Button.tsx
├── Button.css
├── Button.types.ts
├── Button.test.tsx
└── index.ts
```

#### **1.3 Package Configuration**

Check `packages/ui-components/package.json`:
- [ ] Package name đúng: `@downloader/ui-components`
- [ ] Exports field configured
- [ ] Dependencies minimal (không có heavy libs)
- [ ] Scripts (build, test)
- [ ] TypeScript types exported

---

### **2. CUSTOMIZATION SYSTEM**

#### **2.1 CSS Custom Properties**

Check `src/theme/variables.css`:
- [ ] Color variables defined
- [ ] Spacing variables defined
- [ ] Component-specific variables
- [ ] Sensible default values
- [ ] Well-documented

**Minimum variables expected:**
- Primary/secondary colors
- Success/error colors
- Text/background colors
- Spacing scale
- Component-specific (button-bg, progress-color, etc.)

#### **2.2 Props-Based Customization**

Cho mỗi component, verify:
- [ ] `className` prop để add custom classes
- [ ] `style` prop cho inline styles
- [ ] Component-specific props (variant, size, etc.)
- [ ] Props properly typed
- [ ] Props documented

**Example check for Button:**
- [ ] `variant` prop (primary, secondary, etc.)
- [ ] `size` prop (small, medium, large)
- [ ] `disabled` prop
- [ ] `loading` prop
- [ ] `onClick` handler
- [ ] `className` và `style` props

#### **2.3 Override Capability**

Verify apps CÓ THỂ:
- [ ] Override CSS vars trong app-level CSS
- [ ] Add custom classes
- [ ] Pass inline styles
- [ ] Wrap/extend components
- [ ] Completely replace nếu cần

**Test:**
- Tìm examples trong ytmp3-clone-4 đã override
- Verify overrides hoạt động

---

### **3. COMPONENTS EXTRACTED**

#### **3.1 Button Components**

Check Button components:
- [ ] Base Button exists
- [ ] Download Button exists (nếu có)
- [ ] Props complete (onClick, disabled, loading, etc.)
- [ ] Variants work (primary, secondary, etc.)
- [ ] Sizes work (small, medium, large)
- [ ] Loading state displays correctly
- [ ] Disabled state works
- [ ] Custom styling applies

**Visual check:**
- [ ] Default button looks reasonable
- [ ] Variants visually distinct
- [ ] Responsive sizing

#### **3.2 Progress Components**

Check Progress components:
- [ ] Circular Progress exists
- [ ] Linear Progress exists
- [ ] Spinner exists
- [ ] Percentage display works
- [ ] Status text renders
- [ ] Animations smooth
- [ ] Colors customizable via CSS vars
- [ ] Updates correctly when % changes

**Critical for conversion:**
- [ ] Progress component integrates với conversion strategies
- [ ] Phase transitions work (processing → merging)
- [ ] Fake progress displays correctly

#### **3.3 Input Components**

Check Input components:
- [ ] Text Input exists
- [ ] Format Selector exists
- [ ] Validation states work
- [ ] Error display works
- [ ] Placeholder renders
- [ ] Value updates correctly
- [ ] onChange handlers work

**I18n check:**
- [ ] Placeholder text translatable
- [ ] Labels translatable
- [ ] Error messages translatable

#### **3.4 Display Components**

Check Display components:
- [ ] Result Card exists
- [ ] Error Display exists
- [ ] Success Display exists
- [ ] Data renders correctly
- [ ] Icons display (nếu có)
- [ ] Responsive layout

---

### **4. I18N INTEGRATION**

#### **4.1 Translation Keys Added**

Check locale files updated:
- [ ] Component translation keys added
- [ ] Keys in all 19 locale files
- [ ] English complete
- [ ] Key structure consistent

**Example keys to look for:**
```
components.button.download
components.button.convert
components.error.network
components.success.ready
components.input.placeholder
```

#### **4.2 Components Use I18n**

Verify components import và sử dụng i18n:
- [ ] Import từ `@downloader/i18n`
- [ ] Text wrapped với translation calls
- [ ] Translation keys match locale files
- [ ] No hardcoded user-facing text

**Check pattern:**
- Components nhận translation keys hoặc use translation hook
- Button labels translated
- Error messages translated
- Placeholder text translated

#### **4.3 RTL Support**

Test với Arabic (ar) hoặc Urdu (ur):
- [ ] Layout mirrors correctly
- [ ] Text direction correct
- [ ] Icons positioned correctly
- [ ] No visual bugs in RTL

---

### **5. TEST QUALITY**

#### **5.1 Test Coverage**

Check coverage report:
- [ ] Overall coverage ≥ 70%
- [ ] Button components ≥ 70%
- [ ] Progress components ≥ 70%
- [ ] Input components ≥ 70%
- [ ] Display components ≥ 70%

**Run:** `pnpm test:coverage` trong packages/ui-components

**Note:** 70% OK cho UI (khó test 80% với visual components)

#### **5.2 Component Tests**

Cho mỗi component, verify tests cover:

**Button tests:**
- [ ] Renders với different props
- [ ] Click handler called
- [ ] Disabled state prevents click
- [ ] Loading state displays
- [ ] Custom className applied
- [ ] Variants render differently

**Progress tests:**
- [ ] Renders với different percentages
- [ ] Updates when percentage changes
- [ ] Status text renders
- [ ] Custom colors apply

**Input tests:**
- [ ] Value updates on change
- [ ] Validation works
- [ ] Error states display
- [ ] Placeholder renders

**Display tests:**
- [ ] Data renders correctly
- [ ] Conditional rendering works

#### **5.3 Visual Regression Tests**

Ask implementer cho evidence:
- [ ] Screenshots before/after migration
- [ ] Visual comparison passing
- [ ] No unintended styling changes

---

### **6. YTMP3-CLONE-4 MIGRATION**

#### **6.1 Dependency Added**

Check `apps/ytmp3-clone-4/package.json`:
- [ ] `@downloader/ui-components` dependency added
- [ ] Version: `workspace:*`

#### **6.2 Old Components Deleted**

Check files DELETED từ clone-4:
- [ ] Old Button components deleted
- [ ] Old Progress components deleted
- [ ] Old Input components deleted
- [ ] Old Display components deleted

**Search để verify:**
```bash
# Should find NOTHING in clone-4 ui-components/
ls apps/ytmp3-clone-4/src/ui-components/
```

#### **6.3 New Imports Added**

Check imports updated:
- [ ] Import từ `@downloader/ui-components`
- [ ] No relative imports to old components

**Pattern to find:**
```bash
# Should find new imports
grep -r "@downloader/ui-components" apps/ytmp3-clone-4/src/

# Should find NOTHING
grep -r "from.*'\.\..*ui-components" apps/ytmp3-clone-4/src/
```

#### **6.4 Customization Applied**

If clone-4 has custom styling:
- [ ] CSS vars overridden trong app CSS
- [ ] Custom classes added qua className prop
- [ ] Customization works correctly

---

### **7. BEHAVIOR VERIFICATION**

#### **7.1 UI Identical**

**CRITICAL CHECK:**

Compare clone-3 (original) vs clone-4 (migrated):
- [ ] Layout identical
- [ ] Colors same (unless intentionally changed)
- [ ] Spacing same
- [ ] Typography same
- [ ] Animations same
- [ ] Interactions same

**Visual comparison:**
- [ ] Screenshots match
- [ ] Pixel-perfect hoặc explain differences

#### **7.2 Functionality Unchanged**

Test all features trong clone-4:
- [ ] Buttons clickable
- [ ] Inputs accept text
- [ ] Format selector works
- [ ] Progress bars animate
- [ ] Error displays show
- [ ] Success states work
- [ ] Everything behaves như trước

#### **7.3 No Regressions**

- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No visual glitches
- [ ] No performance degradation
- [ ] Responsive design still works
- [ ] Cross-browser compatibility maintained

---

### **8. CODE QUALITY**

#### **8.1 Component Design**

Check component quality:
- [ ] Single Responsibility Principle
- [ ] Reusable và flexible
- [ ] Well-named props
- [ ] Proper TypeScript types
- [ ] No hardcoded values (use CSS vars)
- [ ] Accessible (a11y)

#### **8.2 TypeScript Quality**

- [ ] No `any` types
- [ ] Props properly typed
- [ ] Component types exported
- [ ] Strict mode compliant

#### **8.3 CSS Quality**

- [ ] CSS organized và maintainable
- [ ] CSS vars used correctly
- [ ] No magic numbers
- [ ] Responsive styles
- [ ] No !important (unless necessary)
- [ ] Browser compatibility

#### **8.4 Documentation**

- [ ] README explains usage
- [ ] Props documented (JSDoc hoặc README)
- [ ] Customization examples
- [ ] I18n integration explained
- [ ] CSS vars documented

---

### **9. PHASE 4 CONSTRAINTS**

Verify constraints được follow:

#### **9.1 MUST NOT (Vi phạm = Request Changes)**

- [ ] ❌ Did NOT force apps dùng same UI
- [ ] ❌ Did NOT hardcode colors/styles
- [ ] ❌ Did NOT break existing UI
- [ ] ❌ Did NOT change component behavior
- [ ] ❌ Did NOT modify apps khác (chỉ clone-4)

#### **9.2 MUST (Thiếu = Request Changes)**

- [ ] ✅ DID allow complete customization
- [ ] ✅ DID use CSS Custom Properties
- [ ] ✅ DID integrate i18n
- [ ] ✅ DID verify UI unchanged
- [ ] ✅ DID write tests (70%+)
- [ ] ✅ DID discuss approach trước

---

### **10. BACKWARD COMPATIBILITY**

#### **10.1 Apps Khác Unchanged**

Verify chỉ clone-4 modified:
- [ ] y2matepro NOT modified
- [ ] ytmp3-clone-3 NOT modified
- [ ] ytmp3-clone-darkmode-3 NOT modified
- [ ] y2mate-new-ux NOT modified

#### **10.2 No Breaking Changes**

- [ ] Existing functionality works
- [ ] No API changes trong other packages
- [ ] No forced dependencies

---

## 🚨 CRITICAL ISSUES (MUST FIX TRƯỚC KHI APPROVE)

Nếu tìm thấy BẤT KỲ issues nào sau, REQUEST CHANGES ngay:

1. **UI Changed Unintentionally**
   - Clone-4 UI khác với trước migration
   - Visual regressions
   - Layout broken
   - Colors wrong

2. **Customization Insufficient**
   - Apps không thể customize đủ
   - Hard-coded styles
   - No CSS vars cho critical properties
   - Props không đủ flexible

3. **I18n Broken**
   - Hardcoded text còn tồn tại
   - Translation keys missing
   - RTL layout broken
   - Language switching không work

4. **Components Broken**
   - Buttons không click được
   - Progress không update
   - Inputs không accept values
   - Display components không render data

5. **Tests Insufficient**
   - Coverage < 70%
   - Critical paths không test
   - No component interaction tests

6. **Migration Incomplete**
   - Old components chưa delete
   - Imports chưa update
   - Still using local components

7. **Other Apps Modified**
   - Changes ngoài clone-4
   - Breaking changes

---

## ⚠️ WARNINGS (Nên Fix, Không Blocking)

Issues nên address nhưng không block merge:

1. **Documentation**
   - Props chưa document đủ
   - Usage examples thiếu
   - Customization guide unclear

2. **Accessibility**
   - Missing ARIA labels
   - Keyboard navigation issues
   - Screen reader support poor

3. **Code Style**
   - Inconsistent formatting
   - Unclear naming
   - Could be more DRY

4. **Performance**
   - Unnecessary re-renders
   - Large bundle size
   - Animation janky

---

## ✅ APPROVAL CRITERIA

Approve PR khi:

- [ ] All critical checks passed
- [ ] All MUST constraints satisfied
- [ ] Components extracted và working
- [ ] Customization system works
- [ ] I18n integrated
- [ ] Tests passing với 70%+ coverage
- [ ] ytmp3-clone-4 UI identical
- [ ] No visual regressions
- [ ] No functionality regressions
- [ ] Other apps unchanged
- [ ] PR description complete

---

## 📝 REVIEW TEMPLATE

Sử dụng template này cho review:

```markdown
## Đánh giá mã Giai đoạn 4

### Tóm tắt
[Đánh giá ngắn gọn - Approve/Request Changes/Comment]

**Kết luận:** ✅ Approve | ⚠️ Approve with Comments | ❌ Request Changes

---

### Kết quả Checklist

**Cấu trúc Package (✅/❌):**
- Components extracted: [✅/❌] ([X] components)
- File organization: [✅/❌]
- Package config: [✅/❌]

**Hệ thống tuỳ biến (✅/❌):**
- CSS Custom Properties: [✅/❌] ([X] variables defined)
- Props-based customization: [✅/❌]
- Override capability: [✅/❌]

**Thành phần (✅/❌):**
- Button: [✅/❌]
- Progress: [✅/❌]
- Input: [✅/❌]
- Display: [✅/❌]

**I18n (✅/❌):**
- Translation keys added: [✅/❌]
- Components use i18n: [✅/❌]
- RTL support: [✅/❌]

**Kiểm thử (✅/❌):**
- Coverage: [X]% (target: 70%)
- Component tests: [assessment]
- Visual tests: [✅/❌]

**Di trú (✅/❌):**
- clone-4 migrated: [✅/❌]
- UI identical: [✅/❌]
- Old components deleted: [✅/❌]

**Chất lượng mã (✅/❌):**
- TypeScript: [✅/❌]
- CSS quality: [✅/❌]
- Documentation: [✅/❌]
- No violations: [✅/❌]

---

### Vấn đề nghiêm trọng (Phải sửa)

[List issues hoặc viết "None"]

1. [Issue với location và severity]
2. [Issue với location và severity]

---

### Cảnh báo (Nên sửa)

[List warnings hoặc viết "None"]

1. [Warning với suggestion]
2. [Warning với suggestion]

---

### Điểm tích cực

[Điều làm tốt]

- ✅ [Good practice 1]
- ✅ [Good practice 2]

---

### Câu hỏi

[Câu hỏi cho implementer]

1. [Question về design decision]
2. [Question về implementation]

---

### Xác minh đã thực hiện

**Các kiểm thử đã chạy:**
- [ ] `pnpm test` - [X] tests passing
- [ ] `pnpm test:coverage` - [Y]% coverage
- [ ] Visual comparison - [✅/❌]

**Kiểm thử thủ công:**
- [ ] Tested clone-4 UI
- [ ] Compared với clone-3
- [ ] Tested customization
- [ ] Tested i18n (multiple languages)
- [ ] Tested RTL (Arabic)

**Phân tích mã:**
- [ ] Reviewed component design
- [ ] Checked customization system
- [ ] Verified i18n integration
- [ ] Reviewed test comprehensiveness

---

### So sánh thị giác

**Ảnh chụp màn hình:**
[Include hoặc reference screenshots]

**Thay đổi ghi nhận:**
- [List any visual differences]
- [Explain if intentional]

---

### Khuyến nghị

**Phải sửa trước khi merge:**
- [ ] [Critical issue 1]
- [ ] [Critical issue 2]

**Nên sửa (khuyến nghị):**
- [ ] [Warning 1]
- [ ] [Warning 2]

**Nên có (tuỳ chọn):**
- [ ] [Suggestion 1]
- [ ] [Suggestion 2]

---

### Kết luận

[Đánh giá và khuyến nghị cuối]

**Ready to merge:** [Yes/No/After fixes]

**Next steps:**
1. [Action cho implementer]
2. [Action cho implementer]
```

---

## 🎯 REMEMBER

**Là Phase 4 Reviewer, bạn đang check:**
- ✅ Components reusable và customizable
- ✅ UI không bị break
- ✅ Customization system flexible
- ✅ I18n integrated correctly
- ✅ Visual consistency maintained

**Phase 4 là foundation cho UI consistency across apps. Components phải flexible nhưng UI phải giữ nguyên sau migration.**

---

**Review cẩn thận! UI components ảnh hưởng trực tiếp đến user experience.** 🎨
