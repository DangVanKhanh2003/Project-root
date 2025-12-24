# GIAI ĐOẠN 5 - MẪU REVIEW CHO AI CODE REVIEWER

> **Giai đoạn:** Giai đoạn 5 - Di trú thử nghiệm
> **Loại Review:** Code Review
> **Vai trò:** AI Code Reviewer
> **⚠️ QUAN TRỌNG:** Đây là review tích hợp toàn bộ - CỰC KỲ QUAN TRỌNG

---

## 📚 PHẢI ĐỌC TRƯỚC KHI REVIEW

**BẮT BUỘC đọc (theo thứ tự):**
1. `/docs/refactor/MASTER_REFACTOR_DOC.md` - Context project
2. `/docs/refactor/REVIEWER_PROMPT.md` - Hướng dẫn review chung
3. `/docs/refactor/prompts/PHASE_1_EXTRACT_UTILITIES.md` - Utilities
4. `/docs/refactor/prompts/PHASE_2_I18N_SYSTEM.md` - I18n
5. `/docs/refactor/prompts/PHASE_3_EXTRACT_CONVERSION.md` - Conversion
6. `/docs/refactor/prompts/PHASE_4_UI_COMPONENTS.md` - UI Components
7. `/docs/refactor/prompts/PHASE_5_PILOT_MIGRATION.md` - Yêu cầu Phase 5
8. PR description và tất cả files thay đổi
9. Migration playbook (trong PR)

---

## 🎯 MỤC TIÊU PHASE 5 CẦN VERIFY

### **Phase 5 cần đạt được:**

1. ✅ ytmp3-clone-4 migrated 100%:
   - All utilities từ packages
   - All conversion từ packages
   - All UI components từ packages
   - Full i18n integration
   - 0% code duplication

2. ✅ Full integration verified:
   - All pieces work together
   - End-to-end user flows work
   - No integration bugs
   - Performance acceptable

3. ✅ Complete testing:
   - All features tested
   - All scenarios covered
   - Cross-browser tested
   - I18n tested (19 languages)

4. ✅ Migration playbook created:
   - Lessons learned documented
   - Best practices noted
   - Checklist for Phase 6-7

---

## ✅ PHASE 5 REVIEW CHECKLIST

### **1. MIGRATION COMPLETENESS**

#### **1.1 Zero Code Duplication**

**CRITICAL CHECK:**

Search for code duplication với packages:

```bash
# Check for duplicate utilities
# Should find NOTHING duplicated
diff -r apps/ytmp3-clone-4/src/utils packages/core/src/utils

# Check for local conversion strategies
# Should NOT exist
ls apps/ytmp3-clone-4/src/features/downloader/logic/conversion/application/strategies/

# Check for local UI components (generic ones)
# App-specific OK, generic ones should be deleted
ls apps/ytmp3-clone-4/src/ui-components/
```

**Verify:**
- [ ] No duplicate utilities với packages/core
- [ ] No duplicate conversion logic
- [ ] No duplicate UI components (generic)
- [ ] Only app-specific code remains

#### **1.2 All Imports From Packages**

Check imports across app:

```bash
# Should find imports from packages
grep -r "@downloader/core" apps/ytmp3-clone-4/src/
grep -r "@downloader/i18n" apps/ytmp3-clone-4/src/
grep -r "@downloader/ui-components" apps/ytmp3-clone-4/src/

# Should NOT find old local imports
grep -r "from.*'\.\./\.\./utils" apps/ytmp3-clone-4/src/
grep -r "from.*'\.\./\.\./ui-components" apps/ytmp3-clone-4/src/
```

**Verify:**
- [ ] All utilities imported from `@downloader/core`
- [ ] All i18n from `@downloader/i18n`
- [ ] All UI components from `@downloader/ui-components`
- [ ] No local imports to duplicated code

#### **1.3 I18n Completeness**

**CRITICAL - No hardcoded strings:**

```bash
# Search for hardcoded strings (should be minimal)
grep -r '"[A-Z][a-z]* ' apps/ytmp3-clone-4/src/
grep -r "'[A-Z][a-z]* " apps/ytmp3-clone-4/src/
```

**Acceptable strings:**
- Console logs (for debugging)
- Code strings (variable names, etc.)
- Config values

**NOT acceptable:**
- User-facing text
- Error messages shown to user
- Button labels
- Placeholders

**Verify:**
- [ ] All user-facing text uses i18n
- [ ] No hardcoded UI text
- [ ] Translation keys exist in locale files
- [ ] All 19 languages have translations

#### **1.4 StateUpdater Implementation**

Check StateUpdater được implement đúng:

- [ ] StateUpdater interface implemented
- [ ] Passed to StrategyFactory
- [ ] All strategies receive StateUpdater
- [ ] State updates work correctly

---

### **2. FUNCTIONALITY VERIFICATION**

#### **2.1 Full User Journey Testing**

**CRITICAL - Test end-to-end:**

**Happy path:**
- [ ] User enters valid YouTube URL
- [ ] URL validation works
- [ ] Format selector displays
- [ ] User selects format (MP4/MP3/etc.)
- [ ] Conversion starts correctly
- [ ] Correct strategy selected
- [ ] Progress displays and updates
- [ ] Phase transitions work (processing → merging)
- [ ] Conversion completes
- [ ] Download link appears
- [ ] Download works
- [ ] File downloads correctly

**Ask implementer for evidence:**
- Screen recording of full flow
- Screenshots of each step
- Test results document

#### **2.2 All Conversion Strategies Tested**

Verify ALL 4 strategies work:

**PollingStrategy (most common):**
- [ ] Large MP4 file tested
- [ ] MP3 conversion tested
- [ ] Progress animation smooth
- [ ] Fake progress works when stuck
- [ ] Merging phase triggers correctly
- [ ] Status rotation works
- [ ] Completion works

**StaticDirectStrategy:**
- [ ] Small file direct download tested
- [ ] Progress shows correctly
- [ ] Download works

**OtherStreamStrategy:**
- [ ] Alternative stream tested
- [ ] Works correctly

**IOSRamStrategy:**
- [ ] iOS scenario tested (nếu applicable)
- [ ] RAM conversion works

#### **2.3 Error Scenarios**

Test error handling:
- [ ] Invalid URL → Shows error message
- [ ] Network error → Shows error, allows retry
- [ ] Timeout → Handles gracefully
- [ ] API error → Shows user-friendly message
- [ ] Conversion fails → Error displayed correctly
- [ ] All error messages translated

#### **2.4 Edge Cases**

- [ ] Very long URL
- [ ] URL với special characters
- [ ] Multiple simultaneous conversions
- [ ] Abort conversion mid-way
- [ ] Browser back/forward navigation
- [ ] Refresh during conversion

---

### **3. I18N VERIFICATION**

#### **3.1 Language Switching**

Test language switching:
- [ ] Language selector works
- [ ] Switching updates ALL text
- [ ] Selection persists (localStorage)
- [ ] No layout breaks when switching
- [ ] Works mid-conversion

**Test với multiple languages:**
- [ ] English (default)
- [ ] Spanish
- [ ] German
- [ ] Japanese (different script)
- [ ] Arabic (RTL)
- [ ] Urdu (RTL)
- [ ] Spot check others

#### **3.2 RTL Languages**

**Critical for Arabic & Urdu:**
- [ ] Layout mirrors correctly
- [ ] Text direction RTL
- [ ] Icons positioned correctly
- [ ] Progress bar direction correct
- [ ] No visual glitches
- [ ] Usable và readable

#### **3.3 Translation Quality**

Check translations:
- [ ] Text doesn't overflow containers
- [ ] Long translations don't break layout
- [ ] Short translations don't look weird
- [ ] Context appropriate

---

### **4. UI/UX VERIFICATION**

#### **4.1 Visual Consistency**

**Compare với ytmp3-clone-3 (reference):**

- [ ] Layout identical
- [ ] Colors same (unless intentionally different)
- [ ] Spacing consistent
- [ ] Typography same
- [ ] Animations smooth
- [ ] Overall look & feel maintained

**Ask for:**
- Side-by-side screenshots
- Visual diff tools results

#### **4.2 Responsive Design**

Test different viewports:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Large mobile (414x896)

**Verify:**
- [ ] Layout adapts correctly
- [ ] All elements visible
- [ ] Touch targets adequate (mobile)
- [ ] No horizontal scroll

#### **4.3 Cross-Browser**

Test browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

**Verify:**
- [ ] Works in all browsers
- [ ] No browser-specific bugs
- [ ] Consistent behavior

---

### **5. PERFORMANCE**

#### **5.1 Bundle Size**

Check bundle analysis:
- [ ] Bundle size reasonable
- [ ] Not significantly larger than before
- [ ] Tree-shaking working
- [ ] No duplicate dependencies

**Compare:**
```
Before migration: [X] KB
After migration: [Y] KB
Change: [+/-Z] KB ([%])
```

**Acceptable:**
- Small increase OK (packages overhead)
- Large increase → investigate

#### **5.2 Runtime Performance**

Test performance:
- [ ] Page load fast (<3s)
- [ ] Conversion starts quickly
- [ ] UI responsive (no lag)
- [ ] Animations smooth (60fps)
- [ ] Memory usage reasonable

**Metrics:**
- [ ] Lighthouse score ≥ 80
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s

#### **5.3 No Regressions**

Compare với before migration:
- [ ] Performance same hoặc better
- [ ] No slowdowns
- [ ] No memory leaks
- [ ] No performance red flags

---

### **6. CODE QUALITY**

#### **6.1 Clean Code**

- [ ] No dead code
- [ ] No commented code
- [ ] No unused imports
- [ ] No console.log (except intentional)
- [ ] No TODOs (or documented)

#### **6.2 TypeScript**

- [ ] No TypeScript errors
- [ ] No `any` types (minimal)
- [ ] Types properly imported
- [ ] Strict mode compliant

#### **6.3 Structure**

- [ ] Code organized logically
- [ ] Clear separation of concerns
- [ ] No circular dependencies
- [ ] Import paths clean

---

### **7. TESTING**

#### **7.1 Automated Tests**

- [ ] All existing tests still pass
- [ ] New tests added (nếu cần)
- [ ] Integration tests (nếu có)
- [ ] No skipped tests

**Run:**
```bash
cd apps/ytmp3-clone-4
pnpm test
```

#### **7.2 Test Coverage**

Check coverage:
- [ ] Coverage maintained hoặc improved
- [ ] Critical paths covered
- [ ] Edge cases tested

---

### **8. MIGRATION PLAYBOOK**

#### **8.1 Playbook Exists**

Check PR includes Migration Playbook:
- [ ] Document exists
- [ ] Complete và detailed
- [ ] Lessons learned noted
- [ ] Best practices listed
- [ ] Issues và solutions documented

#### **8.2 Playbook Quality**

Verify playbook includes:

**What Was Migrated:**
- [ ] Utilities migration detailed
- [ ] Conversion migration detailed
- [ ] UI components migration detailed
- [ ] I18n migration detailed

**Issues Encountered:**
- [ ] Problems listed
- [ ] Solutions documented
- [ ] Workarounds noted

**Lessons Learned:**
- [ ] What went well
- [ ] What was challenging
- [ ] Recommendations

**Migration Checklist:**
- [ ] Step-by-step process
- [ ] Can be used for Phase 6-7
- [ ] Complete và actionable

**Metrics:**
- [ ] Before/after comparison
- [ ] Code reduction numbers
- [ ] Performance metrics

---

### **9. DOCUMENTATION**

#### **9.1 Code Documentation**

- [ ] Complex logic commented
- [ ] StateUpdater usage clear
- [ ] Customization documented
- [ ] App-specific code explained

#### **9.2 README Updated**

If app has README:
- [ ] Updated với new structure
- [ ] Package dependencies listed
- [ ] Development setup current

---

## 🚨 CRITICAL ISSUES (MUST FIX)

Nếu tìm thấy BẤT KỲ issues sau, REQUEST CHANGES:

1. **Incomplete Migration**
   - Code duplication còn tồn tại
   - Không dùng packages
   - Local duplicates chưa xóa

2. **Features Broken**
   - Conversion không work
   - Strategies fail
   - Download broken
   - UI không hoạt động đúng

3. **Integration Issues**
   - Packages không work together
   - StateUpdater issues
   - Component integration broken

4. **I18n Incomplete**
   - Hardcoded strings còn
   - Languages missing
   - RTL broken
   - Translation errors

5. **Performance Regression**
   - Significantly slower
   - Bundle too large
   - Memory leaks
   - UI lag

6. **Visual Regressions**
   - UI looks different
   - Layout broken
   - Animations janky
   - Responsive issues

7. **No Playbook**
   - Migration playbook missing
   - Playbook incomplete
   - No lessons learned

8. **Testing Insufficient**
   - Critical paths not tested
   - No cross-browser testing
   - No error scenario testing
   - No evidence of testing

---

## ✅ APPROVAL CRITERIA

Approve PR khi:

- [ ] Migration 100% complete
- [ ] 0% code duplication
- [ ] All features working perfectly
- [ ] All 4 strategies tested
- [ ] End-to-end flows verified
- [ ] I18n working (19 languages)
- [ ] RTL working (Arabic, Urdu)
- [ ] UI identical với ytmp3-clone-3
- [ ] Performance acceptable
- [ ] Cross-browser tested
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Migration playbook excellent
- [ ] Lessons learned documented
- [ ] Ready to replicate in Phase 6-7

---

## 📝 REVIEW TEMPLATE

```markdown
## Đánh giá mã Giai đoạn 5 - Di trú thử nghiệm

### Tóm tắt
⚠️ **FULL INTEGRATION REVIEW - Most Critical**

[Assessment]

**Kết luận:** ✅ Approve | ⚠️ Approve with Comments | ❌ Request Changes

---

### Migration Completeness (✅/❌)

**Code Duplication:**
- Utilities: [✅ 0% | ❌ [X] lines remain]
- Conversion: [✅ 0% | ❌ [X] lines remain]
- UI Components: [✅ 0% | ❌ [X] lines remain]
- Other: [Status]

**Package Usage:**
- @downloader/core: [✅/❌]
- @downloader/i18n: [✅/❌]
- @downloader/ui-components: [✅/❌]

**I18n:**
- Hardcoded strings: [✅ None | ❌ [X] found]
- Languages: [✅ 19/19 | ❌ [X]/19]
- RTL: [✅/❌]

---

### Functionality Testing (✅/❌)

**User Journeys:**
- Happy path: [✅/❌]
- Error scenarios: [✅/❌]
- Edge cases: [✅/❌]

**Conversion Strategies:**
- PollingStrategy: [✅/❌]
- StaticDirectStrategy: [✅/❌]
- OtherStreamStrategy: [✅/❌]
- IOSRamStrategy: [✅/❌]

**Features:**
- URL input: [✅/❌]
- Format selection: [✅/❌]
- Conversion flow: [✅/❌]
- Progress display: [✅/❌]
- Download: [✅/❌]
- Error handling: [✅/❌]

---

### I18n Verification (✅/❌)

**Languages Tested:**
- English: [✅/❌]
- Spanish: [✅/❌]
- Arabic (RTL): [✅/❌]
- Urdu (RTL): [✅/❌]
- Others spot-checked: [✅/❌] ([X]/19)

**Language Switching:** [✅/❌]

**RTL Layout:** [✅/❌]

---

### UI/UX Verification (✅/❌)

**Visual Consistency:**
- vs ytmp3-clone-3: [✅ Identical | ⚠️ Minor diffs | ❌ Different]
- Layout: [✅/❌]
- Colors: [✅/❌]
- Animations: [✅/❌]

**Responsive:** [✅/❌]

**Cross-Browser:**
- Chrome: [✅/❌]
- Firefox: [✅/❌]
- Safari: [✅/❌]
- Mobile: [✅/❌]

---

### Performance (✅/❌)

**Bundle Size:**
- Before: [X] KB
- After: [Y] KB
- Change: [+/-Z] KB ([%])
- Assessment: [✅ Acceptable | ❌ Too large]

**Runtime:**
- Page load: [✅ <3s | ❌ [X]s]
- Lighthouse: [Score: [X]]
- Assessment: [✅/❌]

**No Regressions:** [✅/❌]

---

### Migration Playbook (✅/❌)

**Exists:** [✅/❌]

**Quality:**
- Completeness: [✅/❌]
- Lessons learned: [✅/❌]
- Best practices: [✅/❌]
- Checklist usable: [✅/❌]

**Metrics Provided:** [✅/❌]

---

### Critical Issues (Must Fix)

[List hoặc "None"]

1. [Issue]
2. [Issue]

---

### Warnings (Should Fix)

[List hoặc "None"]

1. [Warning]
2. [Warning]

---

### Positive Highlights

- ✅ [Good thing 1]
- ✅ [Good thing 2]

---

### Testing Evidence Reviewed

**Provided by implementer:**
- [ ] Screen recording: [✅/❌]
- [ ] Screenshots: [✅/❌]
- [ ] Test results: [✅/❌]
- [ ] Performance metrics: [✅/❌]

**Verified by reviewer:**
- [ ] Built app locally: [✅/❌]
- [ ] Tested features: [✅/❌]
- [ ] Checked code: [✅/❌]

---

### Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Lines of code | [X] | [Y] | [Z] |
| Duplicate code | [X] | 0 | -[X] |
| Bundle size | [X] KB | [Y] KB | [Z] |
| Dependencies | [X] | [Y] | [Z] |

---

### Recommendations

**Must fix before merge:**
- [ ] [Critical 1]
- [ ] [Critical 2]

**Should fix:**
- [ ] [Warning 1]

**Nice to have:**
- [ ] [Suggestion 1]

---

### Conclusion

[Final assessment]

**Ready to merge:** [Yes/No/After fixes]

**Confidence for Phase 6-7:** [High/Medium/Low]

[Explain confidence level]

**Next steps:**
1. [Action]
2. [Action]
```

---

## 🎯 REMEMBER

**Là Phase 5 Reviewer, bạn đang verify:**
- ✅ 100% migration complete
- ✅ Everything works together
- ✅ No regressions
- ✅ Playbook excellent
- ✅ **Ready to replicate in Phase 6-7**

**Phase 5 là validation test cho TOÀN BỘ refactor. Nếu pass → refactor đúng hướng. Nếu fail → cần rethink approach.**

---

**Review RẤT CẨN THẬN! Đây là checkpoint quan trọng nhất.** 🔍
