# PHASE 7 REVIEW PROMPT - CHO AI CODE REVIEWER

> **Phase:** Phase 7 - Remaining Apps Migration
> **Loại Review:** Multi-app Migration Review
> **Vai trò:** AI Code Reviewer
> **Yêu cầu:** Phase 1-6 đã hoàn thành

---

## 🎯 TỔNG QUAN PHASE 7 REVIEW

### **Apps cần review:**

1. **ytmp3-clone-3** - Original reference app
2. **ytmp3-clone-darkmode-3** - Dark theme variant
3. **y2mate-new-ux** - New UX experiment

### **Standard Review:**

Phase 7 review dễ hơn Phase 6 vì:
- ✅ Không phải production (lower risk)
- ✅ Đã có playbook từ Phase 5
- ✅ Đã có experience từ Phase 6
- ✅ Standards tương tự Phase 5

**Nhưng vẫn phải careful:**
- Apps có thể có unique features
- Dark theme cần special attention
- new-ux có thể khác biệt nhiều

---

## 📚 PHẢI ĐỌC TRƯỚC KHI REVIEW

**BẮT BUỘC (theo thứ tự):**
1. `/docs/refactor/MASTER_REFACTOR_DOC.md`
2. `/docs/refactor/prompts/PHASE_5_PILOT_MIGRATION.md` - Migration playbook
3. `/docs/refactor/prompts/PHASE_5_REVIEW.md` - Review standards
4. `/docs/refactor/prompts/PHASE_7_REMAINING_APPS.md` - Phase 7 requirements
5. PR descriptions cho cả 3 apps
6. Migration notes cho mỗi app

---

## ✅ PHASE 7 REVIEW CHECKLIST

### **Review cho MỖI APP riêng biệt:**

Cần review 3 lần (1 lần/app) hoặc tổng hợp nếu migrate song song.

---

### **App 1: ytmp3-clone-3 Review**

#### **1.1 Migration Completion**

**Verify migration như Phase 5:**

- [ ] I18n complete (19 languages)
- [ ] UI components sử dụng packages
- [ ] Utilities sử dụng packages
- [ ] Conversion strategies từ @downloader/core
- [ ] StateUpdater pattern implemented
- [ ] Zero code duplication

#### **1.2 Reference App Status**

**Decision check:**
- [ ] Nếu migrated: Old version archived?
- [ ] Nếu kept as reference: Justification documented?
- [ ] Documentation clear về role của app này

#### **1.3 Testing**

**Same standards as Phase 5:**
- [ ] All features work
- [ ] All 4 conversion strategies work
- [ ] All 19 languages work
- [ ] No TypeScript errors
- [ ] Tests passing

---

### **App 2: ytmp3-clone-darkmode-3 Review**

#### **2.1 Base Migration**

**Same as clone-3:**
- [ ] I18n complete
- [ ] Packages used correctly
- [ ] Zero duplication
- [ ] StateUpdater implemented

#### **2.2 Dark Theme Verification**

**CRITICAL - Dark theme specific:**

- [ ] Dark theme customization working
- [ ] CSS Custom Properties overridden correctly
- [ ] Theme switching functional (if applicable)
- [ ] Both light & dark themes tested
- [ ] Visual consistency in dark mode
- [ ] No color contrast issues
- [ ] All components readable in dark mode

**Test checklist:**
```
Dark Theme Testing:
- [ ] Background colors appropriate
- [ ] Text readable (contrast)
- [ ] Buttons visible
- [ ] Progress bars clear
- [ ] Error messages visible
- [ ] Success messages visible
- [ ] All states tested (idle, loading, success, error)
```

#### **2.3 Documentation**

- [ ] Dark theme customization documented
- [ ] CSS variables override explained
- [ ] Theme usage guide clear

---

### **App 3: y2mate-new-ux Review**

#### **3.1 Deep Audit Verification**

**Vì có thể khác biệt nhiều:**

- [ ] Audit report reviewed
- [ ] Differences vs other apps documented
- [ ] Unique features identified
- [ ] Custom components analyzed

#### **3.2 Migration Approach**

**Verify approach sound:**

- [ ] Packages used where applicable
- [ ] UX-specific code kept local (justified)
- [ ] No unnecessary duplication
- [ ] Custom components well-implemented

#### **3.3 Unique Features Preserved**

**CRITICAL:**

- [ ] All unique UX elements work
- [ ] Custom features functional
- [ ] User experience intact
- [ ] Visual design preserved
- [ ] No feature regressions

#### **3.4 Testing**

**Extra thorough vì khác biệt:**

- [ ] All unique features tested
- [ ] Custom UX flows work
- [ ] No layout breaks
- [ ] Mobile experience good
- [ ] Performance acceptable

---

### **Cross-App Verification**

**After reviewing all 3 apps:**

#### **4.1 Consistency**

**All apps should:**

- [ ] Use same package versions
- [ ] Use same patterns (StateUpdater, etc.)
- [ ] Have 19 languages
- [ ] Have zero duplication
- [ ] Follow same architecture

#### **4.2 Independence**

**Each app should:**

- [ ] Have unique UI (where intended)
- [ ] Customizations work
- [ ] No conflicts with other apps
- [ ] Run independently

#### **4.3 Final Metrics**

**Collect and verify:**

```
Total Migration Metrics:
======================
Apps migrated: 5/5 (100%)
- ytmp3-clone-4 ✅
- y2matepro ✅
- ytmp3-clone-3 ✅
- ytmp3-clone-darkmode-3 ✅
- y2mate-new-ux ✅

Packages created: 3
- @downloader/core
- @downloader/i18n
- @downloader/ui-components

Code duplication:
- Before: ~20,000-25,000 lines
- After: 0 lines
- Reduction: 100%

Languages: 19 (all apps)
RTL support: Yes (ar, ur)
Test coverage: [X]%
```

#### **4.4 Documentation**

**Verify documentation complete:**

- [ ] Migration notes cho mỗi app
- [ ] Unique features documented
- [ ] Lessons learned captured
- [ ] Maintenance guide updated
- [ ] Final metrics collected

---

## 🚨 CRITICAL ISSUES (REJECT)

**Reject nếu tìm thấy:**

1. **Incomplete Migration**
   - App chưa migrate xong
   - Vẫn còn duplicate code
   - Chưa dùng packages

2. **Dark Theme Broken (darkmode-3)**
   - Theme không work
   - Colors wrong
   - Contrast issues
   - Toggle broken

3. **Unique Features Lost (new-ux)**
   - Custom UX broken
   - Features missing
   - Design changed unexpectedly

4. **Code Quality Issues**
   - TypeScript errors
   - Test failures
   - Poor implementation

5. **Inconsistency Across Apps**
   - Different patterns used
   - Different package versions
   - Architecture inconsistent

---

## ⚠️ WARNINGS (Must Address)

**Không immediate reject nhưng cần fix:**

1. **Documentation Gaps**
   - Missing migration notes
   - Unique features không documented
   - Customization không explained

2. **Minor Issues**
   - Small bugs (non-critical)
   - Performance could be better
   - Test coverage gaps

3. **Inconsistencies**
   - Naming conventions differ
   - Code style varies
   - Comments inconsistent

---

## ✅ APPROVAL CRITERIA

**Approve khi TẤT CẢ đúng:**

### **Per-App Requirements:**

**ytmp3-clone-3:**
- [ ] Fully migrated
- [ ] Reference status clear
- [ ] All features work

**ytmp3-clone-darkmode-3:**
- [ ] Base migration complete
- [ ] Dark theme perfect
- [ ] Both themes tested

**y2mate-new-ux:**
- [ ] Migration complete
- [ ] Unique features preserved
- [ ] UX intact

### **Cross-App Requirements:**

- [ ] All 5 apps migrated (100%)
- [ ] Zero duplication across all apps
- [ ] Consistent architecture
- [ ] All apps tested
- [ ] Documentation complete
- [ ] Metrics collected
- [ ] Ready for Phase 8

**Confidence level required:** 95%+

---

## 📝 REVIEW TEMPLATE

```markdown
## Phase 7 Multi-App Migration Review

### Overview

**Apps Reviewed:** ytmp3-clone-3, ytmp3-clone-darkmode-3, y2mate-new-ux

**Review Date:** [Date]

**Reviewer:** [AI/Human]

---

### App 1: ytmp3-clone-3

**Migration Status:** [✅ Complete | ⚠️ Issues | ❌ Incomplete]

**Migration Checklist:**
- I18n: [✅/❌]
- UI Components: [✅/❌]
- Utilities: [✅/❌]
- Conversion: [✅/❌]
- StateUpdater: [✅/❌]
- Zero Duplication: [✅/❌]

**Reference App Decision:** [Migrated | Kept as Reference]
- Justification: [If kept]

**Testing:**
- Features: [✅/❌]
- Strategies: [✅/❌]
- Languages: [✅/❌]
- TypeScript: [✅/❌]

**Issues:** [List hoặc None]

**Status:** [✅ Approved | ❌ Needs Work]

---

### App 2: ytmp3-clone-darkmode-3

**Migration Status:** [✅ Complete | ⚠️ Issues | ❌ Incomplete]

**Base Migration:**
- Same as clone-3: [✅/❌]

**Dark Theme:**
- Customization Working: [✅/❌]
- CSS Variables Override: [✅/❌]
- Theme Switching: [✅/❌]
- Visual Consistency: [✅/❌]
- Contrast Adequate: [✅/❌]

**Testing:**
- Light Theme: [✅/❌]
- Dark Theme: [✅/❌]
- All States: [✅/❌]
- Components: [✅/❌]

**Issues:** [List hoặc None]

**Status:** [✅ Approved | ❌ Needs Work]

---

### App 3: y2mate-new-ux

**Migration Status:** [✅ Complete | ⚠️ Issues | ❌ Incomplete]

**Audit Review:**
- Differences Documented: [✅/❌]
- Unique Features Identified: [✅/❌]
- Custom Components Analyzed: [✅/❌]

**Migration Approach:**
- Packages Used Appropriately: [✅/❌]
- UX-Specific Code Local: [✅/❌]
- No Unnecessary Duplication: [✅/❌]

**Unique Features:**
- [Feature 1]: [✅/❌]
- [Feature 2]: [✅/❌]
- [Feature 3]: [✅/❌]

**Testing:**
- Unique Features: [✅/❌]
- Custom UX: [✅/❌]
- Layout: [✅/❌]
- Performance: [✅/❌]

**Issues:** [List hoặc None]

**Status:** [✅ Approved | ❌ Needs Work]

---

### Cross-App Verification

**Consistency Check:**
- Same Package Versions: [✅/❌]
- Same Patterns: [✅/❌]
- 19 Languages All: [✅/❌]
- Zero Duplication All: [✅/❌]
- Architecture Consistent: [✅/❌]

**Independence Check:**
- Unique UI Preserved: [✅/❌]
- Customizations Work: [✅/❌]
- No Conflicts: [✅/❌]
- Run Independently: [✅/❌]

---

### Final Metrics

```
Total Migration Status:
=======================
Apps migrated: [5/5 = 100%]

Package usage:
- All apps use @downloader/core: [✅/❌]
- All apps use @downloader/i18n: [✅/❌]
- All apps use @downloader/ui-components: [✅/❌]

Code duplication:
- Duplicate lines: [0 expected]
- Reduction: [~25,000 lines = 100%]

Languages:
- All apps support 19: [✅/❌]
- RTL working: [✅/❌]

Test coverage:
- Overall: [X]%
- Packages: [Y]%
- Apps: [Z]%
```

---

### Documentation

**Per-App Docs:**
- clone-3 migration notes: [✅/❌]
- darkmode-3 migration notes: [✅/❌]
- new-ux migration notes: [✅/❌]

**Project Docs:**
- Lessons learned: [✅/❌]
- Maintenance guide: [✅/❌]
- Final metrics: [✅/❌]

---

### Critical Issues

[List hoặc "None"]

1. [Issue - MUST FIX]
2. [Issue - MUST FIX]

---

### Warnings

[List hoặc "None"]

1. [Warning - Should fix]
2. [Warning - Should fix]

---

### Recommendations

**Before Phase 8:**
1. [Action needed]
2. [Action needed]

**For Phase 8:**
1. [Optimization suggestion]
2. [Polish suggestion]

---

### Final Assessment

**All Apps Status:**
- clone-3: [✅/❌]
- darkmode-3: [✅/❌]
- new-ux: [✅/❌]

**Overall Migration:** [✅ Success | ⚠️ Partial | ❌ Failed]

**Percentage Complete:** [X]%

**Ready for Phase 8:** [YES/NO]

---

### Verdict

**[✅ APPROVE ALL | ⚠️ APPROVE WITH FIXES | ❌ REJECT]**

**Confidence:** [0-100]%

[If < 95%, explain why]

---

### Next Steps

1. [Action]
2. [Action]
3. [Action]
```

---

## 🎯 REMEMBER

**Phase 7 Review Standards:**
- ✅ Same rigor as Phase 5 (per app)
- ✅ Extra attention to unique features
- ✅ Cross-app consistency critical
- ✅ Documentation thorough
- ✅ Ready for final polish (Phase 8)

**Special Attention:**
- Dark theme (darkmode-3)
- Unique UX (new-ux)
- Reference status (clone-3)

**Success Criteria:**
- All 5 apps migrated (100%)
- Zero duplication across monorepo
- Consistent architecture
- Ready for Phase 8 polish

---

**Review kỹ lưỡng! Đây là step cuối trước polish phase.** ✨
