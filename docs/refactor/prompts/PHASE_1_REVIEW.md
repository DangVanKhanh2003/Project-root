# PHASE 1 REVIEW PROMPT - FOR AI CODE REVIEWER

> **Phase:** Phase 1 - Extract Utilities
> **Review Type:** Code Review
> **Reviewer Role:** AI Code Reviewer

---

## 📚 REQUIRED READING BEFORE REVIEW

**MUST READ (in order):**
1. `/docs/refactor/MASTER_REFACTOR_DOC.md` - Project context
2. `/docs/refactor/REVIEWER_PROMPT.md` - General review guidelines
3. `/docs/refactor/prompts/PHASE_1_EXTRACT_UTILITIES.md` - Phase 1 requirements
4. The PR description and all changed files

---

## 🎯 PHASE 1 SPECIFIC OBJECTIVES TO VERIFY

### **What Phase 1 Should Achieve:**

1. ✅ Extract 4 utility modules to `packages/core/src/utils/`:
   - format-utils.ts
   - link-validator.ts
   - download-stream.ts
   - youtube/ (directory with helpers)

2. ✅ Write comprehensive tests:
   - 80%+ coverage
   - Unit tests for all utilities
   - Mock browser APIs where needed

3. ✅ Migrate ytmp3-clone-4:
   - Update imports
   - Delete duplicate files
   - Verify behavior unchanged

4. ✅ No changes to other apps (yet)

---

## ✅ PHASE 1 REVIEW CHECKLIST

### **1. EXTRACTION CORRECTNESS**

#### **1.1 Files Extracted**

Check these files exist in packages/core/src/utils/:
- [ ] `format-utils.ts` exists
- [ ] `link-validator.ts` exists
- [ ] `download-stream.ts` exists
- [ ] `youtube/constants.ts` exists
- [ ] `youtube/url-parser.ts` exists
- [ ] `youtube/validator.ts` exists
- [ ] `youtube/fake-data-generator.ts` exists
- [ ] `youtube/index.ts` exists (barrel export)
- [ ] `index.ts` exists (main barrel export)

#### **1.2 Code Extraction Quality**

For each extracted file, verify:
- [ ] Code copied EXACTLY from source (ytmp3-clone-3)
- [ ] No logic changes during extraction
- [ ] Function signatures unchanged
- [ ] Comments preserved
- [ ] TypeScript types preserved
- [ ] No new features added

**How to verify:**
- Compare extracted file with original: `diff packages/core/src/utils/format-utils.ts apps/ytmp3-clone-3/src/utils/format-utils.ts`
- Should be identical (or only import paths changed)

#### **1.3 Dependencies Check**

Verify extracted utilities have NO dependencies on:
- [ ] ❌ State management (no imports from state/)
- [ ] ❌ UI components (no imports from ui-components/)
- [ ] ❌ App-specific code
- [ ] ✅ Only use: browser APIs, standard library, other utilities

---

### **2. TEST QUALITY**

#### **2.1 Test Coverage**

Check coverage report:
- [ ] Overall coverage ≥ 80%
- [ ] format-utils.test.ts coverage ≥ 80%
- [ ] link-validator.test.ts coverage ≥ 80%
- [ ] download-stream.test.ts coverage ≥ 80%
- [ ] youtube helpers coverage ≥ 80%

**Run:** `pnpm test:coverage` and verify output

#### **2.2 Test Comprehensiveness**

For each utility, verify tests cover:

**format-utils.ts:**
- [ ] All exported functions tested
- [ ] Different format types tested (mp4, mp3, wav, etc.)
- [ ] Different quality levels tested
- [ ] Edge cases: null, undefined, empty strings
- [ ] Invalid inputs handled

**link-validator.ts:**
- [ ] Recent timestamps (not expired)
- [ ] Expired timestamps
- [ ] Exact TTL boundary case
- [ ] Time formatting for various durations
- [ ] Edge cases: negative time, future time

**download-stream.ts:**
- [ ] Successful download
- [ ] Network errors
- [ ] Abort signal handling
- [ ] Progress callback called
- [ ] Browser APIs mocked (fetch, Blob, URL)

**YouTube helpers:**
- [ ] Standard YouTube URLs (youtube.com/watch?v=)
- [ ] Short URLs (youtu.be/)
- [ ] Embed URLs (youtube.com/embed/)
- [ ] Mobile URLs (m.youtube.com)
- [ ] URLs with timestamps/parameters
- [ ] Invalid URLs rejected
- [ ] Playlist ID extraction
- [ ] Fake data generation produces valid structure

#### **2.3 Mock Quality**

For download-stream.ts, verify mocks:
- [ ] `global.fetch` properly mocked
- [ ] `global.URL.createObjectURL` mocked
- [ ] `global.URL.revokeObjectURL` mocked
- [ ] Mocks cleanup after tests
- [ ] No real network calls in tests

---

### **3. PACKAGE STRUCTURE**

#### **3.1 Package Exports**

Check `packages/core/package.json`:
- [ ] Has correct exports field
- [ ] Can import from `@downloader/core/utils`
- [ ] Can import from `@downloader/core/utils/youtube`
- [ ] TypeScript types exported

Check `packages/core/src/utils/index.ts`:
- [ ] Exports format-utils
- [ ] Exports link-validator
- [ ] Exports download-stream
- [ ] Exports youtube (re-export from youtube/index.ts)

Check `packages/core/src/utils/youtube/index.ts`:
- [ ] Exports all YouTube helpers
- [ ] Barrel export pattern

#### **3.2 TypeScript Configuration**

Verify:
- [ ] No TypeScript errors in packages/core
- [ ] Strict mode enabled
- [ ] No `any` types in utility code
- [ ] Proper type exports

---

### **4. MIGRATION VERIFICATION**

#### **4.1 ytmp3-clone-4 Changes**

**Files that should be DELETED:**
- [ ] `apps/ytmp3-clone-4/src/utils/format-utils.ts` deleted
- [ ] `apps/ytmp3-clone-4/src/utils/link-validator.ts` deleted
- [ ] `apps/ytmp3-clone-4/src/utils/download-stream.ts` deleted
- [ ] `apps/ytmp3-clone-4/src/constants/youtube-constants.ts` deleted

**Files that should be MODIFIED:**
- [ ] `apps/ytmp3-clone-4/package.json` - added `@downloader/core` dependency
- [ ] Files importing utilities - imports updated to `@downloader/core/utils`

**Files that should be UNCHANGED:**
- [ ] Other apps (y2matepro, clone-3, darkmode-3, new-ux) NOT modified
- [ ] ytmp3-clone-4 logic files unchanged (only imports changed)

#### **4.2 Import Updates**

Check files in ytmp3-clone-4 that import utilities:

Old pattern (SHOULD NOT EXIST):
- ❌ `from './utils/format-utils'`
- ❌ `from '../utils/format-utils'`
- ❌ `from '../../utils/format-utils'`

New pattern (SHOULD EXIST):
- ✅ `from '@downloader/core/utils'`
- ✅ `from '@downloader/core/utils/youtube'`

**How to verify:**
```bash
# Search for old imports (should return nothing)
grep -r "from.*utils/format-utils" apps/ytmp3-clone-4/src/

# Search for new imports (should find them)
grep -r "from '@downloader/core" apps/ytmp3-clone-4/src/
```

#### **4.3 Build Verification**

Verify ytmp3-clone-4 builds:
- [ ] `cd apps/ytmp3-clone-4 && pnpm run build` succeeds
- [ ] No TypeScript errors
- [ ] No missing module errors
- [ ] Build output exists

---

### **5. BEHAVIOR VERIFICATION**

#### **5.1 Manual Testing Required**

Ask implementer to provide evidence:
- [ ] Screenshot/video of ytmp3-clone-4 running
- [ ] Tested: Enter YouTube URL
- [ ] Tested: Conversion flow works
- [ ] Tested: Download works
- [ ] No console errors shown

#### **5.2 Comparison with Original**

Verify behavior identical:
- [ ] Same format options appear
- [ ] Same conversion behavior
- [ ] Same error messages
- [ ] Same download flow
- [ ] Performance similar (no regression)

**Ask implementer:**
"Did you compare ytmp3-clone-4 (migrated) with ytmp3-clone-3 (original)? Are they behaving identically?"

---

### **6. CODE QUALITY**

#### **6.1 No Code Changes**

Critical check - verify NO LOGIC CHANGES:
- [ ] Utility functions not modified (only extracted)
- [ ] No refactoring during extraction
- [ ] No "improvements" added
- [ ] No bug fixes mixed in

**If logic changed:** Request to separate into different PR

#### **6.2 TypeScript Quality**

- [ ] No `any` types in package code
- [ ] Proper interfaces/types defined
- [ ] Type exports working
- [ ] Strict mode compliant

#### **6.3 Documentation**

- [ ] JSDoc comments preserved from original
- [ ] Function documentation clear
- [ ] Package README exists (if new package)
- [ ] Usage examples provided (in PR description)

---

### **7. PHASE 1 SPECIFIC CONSTRAINTS**

Verify these constraints were followed:

#### **7.1 MUST NOT (Violations = Request Changes)**

- [ ] ❌ Did NOT change utility logic
- [ ] ❌ Did NOT add new features
- [ ] ❌ Did NOT modify other apps (besides clone-4)
- [ ] ❌ Did NOT break existing functionality
- [ ] ❌ Did NOT change function signatures

#### **7.2 MUST (Missing = Request Changes)**

- [ ] ✅ DID copy code exactly
- [ ] ✅ DID write tests (80%+ coverage)
- [ ] ✅ DID verify behavior unchanged
- [ ] ✅ DID delete duplicate files from clone-4
- [ ] ✅ DID discuss approach before coding

---

### **8. PR QUALITY**

#### **8.1 PR Description**

Check PR has:
- [ ] Title: `[Phase 1] Extract utilities to @downloader/core`
- [ ] Summary of changes
- [ ] Test results (X tests passing, Y% coverage)
- [ ] Verification steps completed
- [ ] Files changed summary
- [ ] Manual testing evidence

#### **8.2 Commit Quality**

- [ ] Clear commit messages
- [ ] Logical commit organization
- [ ] No "WIP" or "fix" commits
- [ ] No merge commits (should be squashed/rebased)

---

## 🚨 CRITICAL ISSUES (MUST FIX BEFORE APPROVE)

If you find ANY of these, REQUEST CHANGES immediately:

1. **Logic Changed**
   - Utility function behavior modified
   - Bug fixes mixed with extraction
   - "Improvements" added

2. **Other Apps Modified**
   - y2matepro, clone-3, darkmode-3, new-ux changed
   - Only clone-4 should be modified

3. **Tests Missing/Insufficient**
   - Coverage < 80%
   - Critical paths not tested
   - Browser APIs not mocked

4. **Behavior Changed**
   - ytmp3-clone-4 works differently than before
   - Console errors appear
   - Features broken

5. **Dependencies Wrong**
   - Utilities import from state/
   - Utilities import from ui-components/
   - Circular dependencies

---

## ⚠️ WARNINGS (Should Fix, Not Blocking)

These should be addressed but won't block merge:

1. **Documentation**
   - Missing JSDoc comments
   - Unclear function names
   - No usage examples

2. **Test Quality**
   - Tests passing but not comprehensive
   - Missing edge case tests
   - Test names unclear

3. **Code Style**
   - Inconsistent formatting
   - Unclear variable names
   - Long functions (> 50 lines)

---

## ✅ APPROVAL CRITERIA

Approve PR when:

- [ ] All critical checks passed
- [ ] All MUST constraints satisfied
- [ ] Tests passing with 80%+ coverage
- [ ] ytmp3-clone-4 migrated successfully
- [ ] Behavior verified unchanged
- [ ] No breaking changes
- [ ] PR description complete

---

## 📝 REVIEW TEMPLATE

Use this template for your review:

```markdown
## Phase 1 Code Review

### Summary
[Brief assessment - Approve/Request Changes/Comment]

**Verdict:** ✅ Approve | ⚠️ Approve with Comments | ❌ Request Changes

---

### Checklist Results

**Extraction (✅/❌):**
- Format-utils: [status]
- Link-validator: [status]
- Download-stream: [status]
- YouTube helpers: [status]

**Tests (✅/❌):**
- Coverage: [X]% (target: 80%)
- Comprehensiveness: [assessment]
- Mocks: [assessment]

**Migration (✅/❌):**
- Files deleted: [✅/❌]
- Imports updated: [✅/❌]
- Build passing: [✅/❌]
- Behavior unchanged: [✅/❌]

**Code Quality (✅/❌):**
- No logic changes: [✅/❌]
- TypeScript quality: [✅/❌]
- No violations: [✅/❌]

---

### Critical Issues (Must Fix)

[List any critical issues found, or write "None"]

1. [Issue with location and severity]
2. [Issue with location and severity]

---

### Warnings (Should Fix)

[List warnings, or write "None"]

1. [Warning with suggestion]
2. [Warning with suggestion]

---

### Positive Highlights

[What was done well]

- ✅ [Good practice 1]
- ✅ [Good practice 2]

---

### Questions

[Any questions for implementer]

1. [Question about design decision]
2. [Question about implementation]

---

### Verification Performed

**Tests run:**
- [ ] `pnpm test` - [X] tests passing
- [ ] `pnpm test:coverage` - [Y]% coverage
- [ ] `cd apps/ytmp3-clone-4 && pnpm run build` - ✅ Success

**Code analysis:**
- [ ] Compared extracted files with originals
- [ ] Verified no logic changes
- [ ] Checked test comprehensiveness

**Manual checks:**
- [ ] Reviewed PR description
- [ ] Checked commit quality
- [ ] Verified file changes

---

### Recommendations

**Must fix before merge:**
- [ ] [Critical issue 1]
- [ ] [Critical issue 2]

**Should fix (recommended):**
- [ ] [Warning 1]
- [ ] [Warning 2]

**Nice to have:**
- [ ] [Suggestion 1]

---

### Conclusion

[Final assessment and recommendation]

**Ready to merge:** [Yes/No/After fixes]

**Next steps:**
1. [Action for implementer]
2. [Action for implementer]
```

---

## 🎯 REMEMBER

**As Phase 1 Reviewer, you are checking:**
- ✅ Utilities extracted correctly (no logic changes)
- ✅ Tests comprehensive (80%+ coverage)
- ✅ Migration successful (clone-4 works)
- ✅ No other apps touched
- ✅ Foundation solid for Phase 2

**This is CRITICAL:** Phase 2-8 will build on these utilities. If Phase 1 has issues, everything after will be affected.

---

**Review carefully! Phase 1 is the foundation.** 🔍
