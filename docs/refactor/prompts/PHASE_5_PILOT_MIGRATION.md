# PHASE 5: PILOT MIGRATION - HƯỚNG DẪN CHO AI

> **Phase:** Pilot Migration (Tuần 11-12)
> **Mục tiêu:** Migrate hoàn chỉnh 1 app để verify toàn bộ refactor
> **Mức độ rủi ro:** 🟡 Trung bình - Cao
> **Yêu cầu:** Phase 1-4 đã hoàn thành

---

## ⚠️ QUAN TRỌNG: TÀI LIỆU NÀY KHÔNG CHỨA CODE

**Tài liệu này chứa:**
- ✅ Đường dẫn files cần đọc
- ✅ Hướng dẫn làm GÌ
- ✅ Yêu cầu và ràng buộc
- ❌ KHÔNG CÓ CODE MẪU

**Bạn PHẢI:**
- Đọc code thực tế từ project files
- Phân tích app cần migrate
- Đề xuất migration plan chi tiết
- Thảo luận EXTENSIVELY trước khi bắt đầu

---

## 🎯 TẠI SAO CẦN PILOT MIGRATION?

### **Mục đích của Phase 5:**

Phase 1-4 đã migrate **từng phần** của ytmp3-clone-4:
- Phase 1: Utilities ✅
- Phase 2: I18n (có thể chưa full) ✅
- Phase 3: Conversion strategies ✅
- Phase 4: UI Components ✅

**Nhưng:**
- Chưa migrate TOÀN BỘ app end-to-end
- Chưa verify tất cả pieces work TOGETHER
- Chưa test full user flow
- Chưa optimize integration

**Phase 5 = Full Integration Test:**
- Migrate ytmp3-clone-4 HOÀN CHỈNH 100%
- Verify mọi thứ work together
- Find và fix integration issues
- Document lessons learned
- Create migration playbook cho Phase 6-7

---

## 📚 TÀI LIỆU BẮT BUỘC PHẢI ĐỌC

### **Tài liệu quan trọng:**
1. `/docs/refactor/MASTER_REFACTOR_DOC.md` - Context tổng quan
2. `/docs/refactor/README.md` - Workflow
3. `/docs/refactor/prompts/PHASE_1_EXTRACT_UTILITIES.md` - Utilities đã extract
4. `/docs/refactor/prompts/PHASE_2_I18N_SYSTEM.md` - I18n system
5. `/docs/refactor/prompts/PHASE_3_EXTRACT_CONVERSION.md` - Conversion strategies
6. `/docs/refactor/prompts/PHASE_4_UI_COMPONENTS.md` - UI components
7. `/CLAUDE.md` - Quy tắc project

### **Code files cần đọc:**

**App cần migrate (ytmp3-clone-4):**
- `/apps/ytmp3-clone-4/` (toàn bộ app)
- Understand toàn bộ architecture
- Identify phần nào chưa migrate
- Map dependencies

**So sánh với reference (ytmp3-clone-3):**
- `/apps/ytmp3-clone-3/` (original - source of truth)
- Compare structure
- Identify differences
- Ensure clone-4 không miss features

**Packages đã tạo:**
- `/packages/core/` - Utilities + Conversion
- `/packages/i18n/` - I18n system
- `/packages/ui-components/` - UI components

---

## 🎯 MỤC TIÊU PHASE 5

### **Mục tiêu chính:**

1. **Complete migration ytmp3-clone-4:**
   - 100% sử dụng packages
   - 0% duplicate code với packages
   - Full i18n integration
   - Full UI components usage

2. **Verify end-to-end functionality:**
   - Entire user flow works
   - All features functional
   - No regressions
   - Performance acceptable

3. **Integration testing:**
   - Utilities + Conversion + UI work together
   - I18n works across all components
   - StateUpdater pattern works correctly
   - No integration bugs

4. **Document migration process:**
   - Migration checklist
   - Issues encountered
   - Solutions applied
   - Best practices
   - Playbook cho Phase 6-7

5. **Optimize và polish:**
   - Bundle size optimization
   - Performance optimization
   - Code cleanup
   - Remove dead code

### **Tiêu chí thành công:**
- [ ] ytmp3-clone-4 migrated 100%
- [ ] 0% code duplication với packages
- [ ] All features working
- [ ] UI identical với ytmp3-clone-3
- [ ] Performance same hoặc better
- [ ] i18n works perfectly (19 languages)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Migration playbook documented

---

## 🚫 RÀNG BUỘC QUAN TRỌNG

### **KHÔNG ĐƯỢC:**
- ❌ Thay đổi functionality khi migrate
- ❌ Add new features (save for later)
- ❌ Fix bugs không liên quan (separate PR)
- ❌ Break backward compatibility
- ❌ Skip testing any feature

### **BẮT BUỘC:**
- ✅ Migrate TOÀN BỘ app (không bỏ sót)
- ✅ Verify TỪNG feature sau migration
- ✅ Test FULL user journey
- ✅ Document EVERY issue found
- ✅ Create migration playbook
- ✅ Get approval trước khi merge

---

## 📋 CÁC TASK CHI TIẾT

### **Task 1: Audit App hiện tại**

**Mục đích:** Hiểu TOÀN BỘ ytmp3-clone-4

**Cần làm:**

1. **Map toàn bộ code:**
   - List tất cả files trong app
   - Categorize: Features, State, UI, Utils, Types
   - Identify đã migrate vs chưa migrate

2. **Identify remaining duplications:**
   - So sánh với packages
   - Find code nào còn duplicate
   - Prioritize extraction

3. **List tất cả features:**
   - User flows
   - Edge cases
   - Error scenarios
   - Special handling

4. **Analyze dependencies:**
   - What depends on what?
   - Circular dependencies?
   - Missing abstractions?

**Output yêu cầu:**
```
App Audit Report:
================

Total files: [X]
Migrated: [Y] files
Not migrated: [Z] files

Code duplication with packages:
- Utilities: [X] lines still duplicated
- Conversion: [X] lines
- UI: [X] lines
- Other: [X] lines

Features list:
1. URL input + validation
2. Format selection
3. Conversion flow
4. Progress display
5. Download
6. [List all features]

Dependencies map:
[Dependency graph or description]

Issues found:
1. [Issue 1]
2. [Issue 2]
```

**⚠️ KHÔNG tiếp tục Task 2 cho đến khi audit hoàn thành và approved.**

---

### **Task 2: Create Migration Plan**

**Dựa trên Task 1 audit:**

**Tạo detailed plan:**

1. **Migration order:**
   - Thứ tự migrate các phần (bottom-up hoặc top-down)
   - Dependencies considerations
   - Risk mitigation

2. **For mỗi component cần migrate:**
   - Current state
   - Target state (use package X)
   - Steps to migrate
   - Testing checklist

3. **I18n completion:**
   - Hardcoded strings còn lại
   - Translation keys cần add
   - Components chưa i18n

4. **Testing strategy:**
   - Unit tests nào cần update
   - Integration tests cần viết
   - E2E testing approach
   - Manual testing checklist

**Output:**
```
Migration Plan for ytmp3-clone-4
================================

Phase 5.1: Complete I18n Migration
- [ ] Find all hardcoded strings
- [ ] Add translation keys
- [ ] Update components to use i18n
- [ ] Test language switching

Phase 5.2: Complete UI Components Migration
- [ ] List components chưa migrate
- [ ] Migrate component X
- [ ] Migrate component Y
- [ ] Test visual consistency

Phase 5.3: Complete Utilities Migration
- [ ] Remaining utils in app
- [ ] Migrate to @downloader/core
- [ ] Update imports

Phase 5.4: State Management Cleanup
- [ ] Remove duplicate state logic
- [ ] Optimize StateUpdater
- [ ] Clean up unused state

Phase 5.5: Integration & Testing
- [ ] End-to-end user flow
- [ ] Error scenarios
- [ ] Performance testing
- [ ] Cross-browser testing

Phase 5.6: Optimization
- [ ] Bundle size analysis
- [ ] Code splitting
- [ ] Remove dead code
- [ ] Performance profiling

Testing Checklist:
==================
[Detailed test cases]

Risk Assessment:
================
[Risks and mitigation]
```

**⚠️ Plan phải được approve trước implementation.**

---

### **Task 3: Complete I18n Migration**

**Mục tiêu:** 100% i18n, 0% hardcoded strings

**Steps:**

1. **Find all hardcoded strings:**
```bash
# Search for patterns
grep -r '"[A-Z]' apps/ytmp3-clone-4/src/
grep -r "'[A-Z]" apps/ytmp3-clone-4/src/
```

2. **Categorize strings:**
   - UI text (buttons, labels, etc.)
   - Error messages
   - Success messages
   - Validation messages
   - Status text

3. **Add translation keys:**
   - Add to locale files (19 languages)
   - Organize by feature/domain
   - Use meaningful key names

4. **Update components:**
   - Import i18n
   - Replace strings với translation calls
   - Test each update

5. **Verify:**
   - No hardcoded strings remain
   - Translation checker passes
   - Language switching works
   - RTL works (Arabic, Urdu)

**Validation:**
- [ ] No hardcoded user-facing strings
- [ ] All 19 languages have translations
- [ ] Language switching smooth
- [ ] RTL layout correct

---

### **Task 4: Complete UI Components Migration**

**Mục tiêu:** 100% use base components

**Components cần check:**

1. **Identify unmigrated components:**
   - List components còn local
   - Decide: migrate hoặc keep local (nếu app-specific)

2. **For each component to migrate:**
   - Replace với base component từ packages
   - Apply customization (CSS vars, props)
   - Test visual consistency
   - Test functionality

3. **App-specific components:**
   - Nếu component quá specific cho app này
   - Keep local nhưng document why
   - Consider: có thể make reusable không?

4. **Styling consolidation:**
   - Use CSS custom properties
   - Remove duplicate styles
   - Ensure theming works

**Validation:**
- [ ] All generic components migrated
- [ ] App-specific components documented
- [ ] UI visually identical
- [ ] Styling consistent

---

### **Task 5: Complete Utilities Migration**

**Mục tiêu:** 0% duplicate utilities

**Check for remaining utilities:**

1. **Search for utility functions:**
   - Helper functions
   - Formatters
   - Validators
   - Constants

2. **For each utility:**
   - Already in packages? → Import it
   - Not in packages? → Decide:
     - Generic? → Extract to packages
     - App-specific? → Keep local

3. **Update imports:**
   - Replace local imports
   - Use `@downloader/core/utils`

**Validation:**
- [ ] No duplicate utilities với packages
- [ ] All imports from packages
- [ ] App-specific utils documented

---

### **Task 6: State Management Cleanup**

**Mục tiêu:** Optimize state, remove duplication

**Areas to clean:**

1. **StateUpdater implementation:**
   - Review implementation
   - Optimize if needed
   - Ensure covers all strategy needs

2. **Remove duplicate state logic:**
   - State logic already in strategies? → Remove
   - Consolidate redundant state

3. **Optimize state updates:**
   - Batch updates where possible
   - Reduce unnecessary re-renders
   - Profile performance

4. **Clean unused state:**
   - Remove dead code
   - Remove obsolete state fields

**Validation:**
- [ ] State clean và optimized
- [ ] No duplicate logic
- [ ] Performance good

---

### **Task 7: Integration Testing**

**Mục tiêu:** Verify everything works together

**Test full user journeys:**

1. **Happy path:**
   - [ ] User enters YouTube URL
   - [ ] URL validated
   - [ ] Format selector appears
   - [ ] User selects format
   - [ ] Conversion starts
   - [ ] Progress shows correctly
   - [ ] Phase transitions work
   - [ ] Conversion completes
   - [ ] Download link appears
   - [ ] Download works

2. **Alternative flows:**
   - [ ] Different formats (MP4, MP3, etc.)
   - [ ] Different qualities
   - [ ] Small file (StaticDirect strategy)
   - [ ] Large file (Polling strategy)
   - [ ] iOS device (IOSRam strategy)

3. **Error scenarios:**
   - [ ] Invalid URL
   - [ ] Network error
   - [ ] API timeout
   - [ ] Conversion fails
   - [ ] Error messages display correctly
   - [ ] User can retry

4. **Edge cases:**
   - [ ] Very long URLs
   - [ ] Special characters in URL
   - [ ] Multiple conversions simultaneously
   - [ ] Abort conversion
   - [ ] Browser back/forward

5. **I18n scenarios:**
   - [ ] Switch languages mid-flow
   - [ ] Test all 19 languages (at least spot check)
   - [ ] RTL languages (Arabic, Urdu)
   - [ ] Text doesn't overflow

6. **Cross-browser:**
   - [ ] Chrome
   - [ ] Firefox
   - [ ] Safari
   - [ ] Mobile browsers

7. **Performance:**
   - [ ] Page load time
   - [ ] Conversion speed
   - [ ] UI responsiveness
   - [ ] Memory usage

**Validation:**
- [ ] All journeys work
- [ ] No console errors
- [ ] No visual glitches
- [ ] Performance acceptable

---

### **Task 8: Optimization**

**Mục tiêu:** Optimize bundle và performance

**Bundle analysis:**

1. **Analyze bundle size:**
```bash
pnpm run build
# Analyze output bundle
```

2. **Identify large dependencies:**
   - Can any be replaced?
   - Tree-shaking working?
   - Code splitting opportunities?

3. **Optimize imports:**
   - Use named imports
   - Avoid importing entire libraries
   - Lazy load heavy components

**Performance optimization:**

1. **Profile performance:**
   - Chrome DevTools
   - Lighthouse
   - Find bottlenecks

2. **Optimize:**
   - Reduce re-renders
   - Memoize expensive calculations
   - Optimize images
   - Code splitting

**Code cleanup:**

1. **Remove dead code:**
   - Unused imports
   - Unused functions
   - Commented code

2. **Consolidate:**
   - Merge similar functions
   - Remove duplication

**Validation:**
- [ ] Bundle size reasonable
- [ ] Performance good (Lighthouse score)
- [ ] Code clean

---

### **Task 9: Documentation**

**Mục tiêu:** Document migration process

**Create Migration Playbook:**

```markdown
# Migration Playbook - ytmp3-clone-4

## Overview
[Migration summary]

## What Was Migrated

### Utilities
- [List utilities migrated]
- Issues: [Any issues]
- Solutions: [Solutions applied]

### Conversion Strategies
- [StateUpdater implementation]
- Issues: [Issues]
- Solutions: [Solutions]

### UI Components
- [Components migrated]
- Customization: [How customized]
- Issues: [Issues]

### I18n
- [Translation keys added]
- Coverage: [X]%
- Issues: [Issues]

## Lessons Learned

### What Went Well
1. [Success 1]
2. [Success 2]

### Challenges
1. [Challenge 1]
   - Solution: [How solved]
2. [Challenge 2]
   - Solution: [How solved]

### Best Practices
1. [Practice 1]
2. [Practice 2]

## Recommendations for Next Migrations

### Do's
- [Do 1]
- [Do 2]

### Don'ts
- [Don't 1]
- [Don't 2]

### Migration Checklist
- [ ] [Step 1]
- [ ] [Step 2]
- [Complete checklist]

## Metrics

Before migration:
- Lines of code: [X]
- Duplicate code: [Y] lines
- Bundle size: [Z] KB

After migration:
- Lines of code: [X]
- Duplicate code: 0 lines
- Bundle size: [Z] KB
- Reduction: [%]

## Next Steps
[Preparation for Phase 6]
```

---

## 🔄 WORKFLOW CHO PHASE NÀY

### **Bước 1: EXTENDED DISCUSSION (BẮT BUỘC)**

**⚠️ Phase 5 là full integration - cần thảo luận kỹ.**

**Gửi message:**

```
Tôi bắt đầu Phase 5: Pilot Migration

⚠️ ĐÂY LÀ FULL MIGRATION - End-to-end integration test

Đã đọc tài liệu:
- ✅ MASTER_REFACTOR_DOC.md
- ✅ All Phase 1-4 prompts
- ✅ PHASE_5_PILOT_MIGRATION.md

APP AUDIT RESULTS:

ytmp3-clone-4 hiện tại:
- Total files: [X]
- Đã migrate (Phase 1-4): [Y] files
- Chưa migrate: [Z] files

Code duplication còn lại:
- Utilities: [X] lines (with packages/core)
- UI components: [X] lines (with packages/ui-components)
- I18n: [X] hardcoded strings
- Other: [X] lines

Features cần verify:
1. URL input + validation
2. Format selection
3. Conversion (all 4 strategies)
4. Progress display (all phases)
5. Download
6. Error handling
7. Language switching
8. [List all]

Issues tìm thấy trong audit:
1. [Issue 1]
2. [Issue 2]

MIGRATION PLAN:

Order of migration:
1. Complete i18n (remove all hardcoded strings)
2. Complete UI components migration
3. Complete utilities migration
4. State cleanup
5. Integration testing
6. Optimization
7. Documentation

Timeline ước tính: [X] days

Risks:
1. **Integration issues:**
   - Risk: Packages không work together perfectly
   - Mitigation: Thorough testing, fix issues

2. **Performance regression:**
   - Risk: Bundle size increases
   - Mitigation: Bundle analysis, optimization

3. [Other risks]

Testing strategy:
- Full user journey testing
- Error scenario testing
- Cross-browser testing
- Performance testing
- I18n testing (19 languages)

CÂU HỎI:

1. Migration order - Có ổn không?
2. Testing coverage - Có đủ không?
3. Timeline - Realistic chưa?
4. [Other questions]

⚠️ Chờ approval trước khi bắt đầu migration.
```

**⚠️ ĐỢI APPROVAL.**

---

### **Bước 2: IMPLEMENTATION**

Sau khi approved:

1. Create branch: `refactor/phase-5-pilot-migration`

2. Implement theo plan approved

3. Commit frequently với clear messages

4. Test sau TỪNG migration step

---

### **Bước 3: EXTENSIVE TESTING**

**Test EVERYTHING:**

- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing all features
- [ ] Cross-browser testing
- [ ] Performance testing
- [ ] I18n testing
- [ ] Error scenarios
- [ ] Edge cases

**Compare với ytmp3-clone-3:**
- [ ] Feature parity
- [ ] UI consistency
- [ ] Performance similar
- [ ] No regressions

---

### **Bước 4: REVIEW & MERGE**

**Create PR:**

Title: `[Phase 5] Complete pilot migration - ytmp3-clone-4`

Description: Include migration playbook, metrics, testing results

---

## ✅ DEFINITION OF DONE

Phase 5 hoàn thành khi:

- [ ] ytmp3-clone-4 migrated 100%
- [ ] 0% code duplication với packages
- [ ] All features working perfectly
- [ ] UI identical với ytmp3-clone-3
- [ ] Performance same hoặc better
- [ ] I18n works (19 languages tested)
- [ ] RTL works (Arabic, Urdu tested)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Cross-browser tested
- [ ] Migration playbook documented
- [ ] Metrics collected
- [ ] PR approved
- [ ] Merged to main

---

## 📊 EXPECTED METRICS

**Sau Phase 5:**
- Lines migrated: ~100% of ytmp3-clone-4
- Duplicate code eliminated: ~2,000-3,000 lines
- Bundle size: Similar hoặc smaller
- Performance: Same hoặc better
- Test coverage: Comprehensive
- Apps fully migrated: 1 (clone-4)

---

**Phase 5 là CRITICAL validation - Nếu pass, Phase 6-7 sẽ smooth hơn nhiều!** 🚀

**Nhớ: ĐỌC → AUDIT → PLAN → DISCUSS → APPROVE → MIGRATE → TEST THOROUGHLY → DOCUMENT**
