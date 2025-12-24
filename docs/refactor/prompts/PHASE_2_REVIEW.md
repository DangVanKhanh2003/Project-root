# PHASE 2 REVIEW PROMPT - FOR AI CODE REVIEWER

> **Phase:** Phase 2 - I18n System
> **Review Type:** Code Review
> **Reviewer Role:** AI Code Reviewer

---

## 📚 REQUIRED READING BEFORE REVIEW

**MUST READ (in order):**
1. `/docs/refactor/MASTER_REFACTOR_DOC.md` - Project context
2. `/docs/refactor/REVIEWER_PROMPT.md` - General review guidelines
3. `/docs/refactor/prompts/PHASE_2_I18N_SYSTEM.md` - Phase 2 requirements
4. The PR description and all changed files

---

## 🎯 PHASE 2 SPECIFIC OBJECTIVES TO VERIFY

### **What Phase 2 Should Achieve:**

1. ✅ Create i18n package at `packages/i18n/`:
   - Translation engine (SSR + CSR compatible)
   - 19 locale files
   - Translation checker tool
   - Helper functions

2. ✅ Support 19 languages:
   - All with identical key structure
   - English complete
   - RTL support (ar, ur)

3. ✅ Migrate ytmp3-clone-4:
   - Replace hardcoded strings
   - Add language switcher
   - Verify all languages work
   - Test RTL rendering

4. ✅ No changes to other apps (yet)

---

## ✅ PHASE 2 REVIEW CHECKLIST

### **1. PACKAGE STRUCTURE**

#### **1.1 Package Files Exist**

Check these files exist in packages/i18n/:
- [ ] `package.json` exists
- [ ] `src/` directory exists
- [ ] `tests/` directory exists
- [ ] `README.md` exists
- [ ] Translation engine file(s) exist
- [ ] Locale files directory exists
- [ ] Helper functions exist

#### **1.2 Package Configuration**

Check `packages/i18n/package.json`:
- [ ] Correct package name: `@downloader/i18n`
- [ ] Exports field properly configured
- [ ] Dependencies minimal (no heavy libraries)
- [ ] Scripts defined (test, check:i18n, build if needed)
- [ ] TypeScript types exported

#### **1.3 Package Exports**

Verify exports work:
- [ ] Can import engine from `@downloader/i18n`
- [ ] Can import helpers from `@downloader/i18n`
- [ ] Can import types from `@downloader/i18n`
- [ ] TypeScript autocomplete works
- [ ] No unnecessary exports

---

### **2. LOCALE FILES**

#### **2.1 All 19 Languages Present**

Check all locale files exist:
- [ ] `en.json` (or .js) - English
- [ ] `ar.json` - Arabic (RTL)
- [ ] `bn.json` - Bengali
- [ ] `de.json` - German
- [ ] `es.json` - Spanish
- [ ] `fr.json` - French
- [ ] `hi.json` - Hindi
- [ ] `id.json` - Indonesian
- [ ] `it.json` - Italian
- [ ] `ja.json` - Japanese
- [ ] `ko.json` - Korean
- [ ] `ms.json` - Malay
- [ ] `my.json` - Burmese
- [ ] `pt.json` - Portuguese
- [ ] `ru.json` - Russian
- [ ] `th.json` - Thai
- [ ] `tr.json` - Turkish
- [ ] `ur.json` - Urdu (RTL)
- [ ] `vi.json` - Vietnamese

#### **2.2 Key Structure Consistency**

Critical check - all locale files must have identical keys:
- [ ] Run translation checker tool
- [ ] All files have same keys
- [ ] No missing keys reported
- [ ] No extra keys in some files

**How to verify:**
```bash
pnpm check:i18n
# Should report 100% coverage for all keys
```

#### **2.3 English Locale Completeness**

English is the baseline:
- [ ] All keys have values (no empty strings)
- [ ] Translations are natural (not literal/robotic)
- [ ] Placeholders clearly marked: `{{variable}}`
- [ ] Pluralization keys defined if needed
- [ ] No hardcoded values (dates, numbers flexible)

#### **2.4 Key Naming Quality**

Check key organization:
- [ ] Meaningful names (not `text1`, `label2`)
- [ ] Organized by namespace/domain
- [ ] Not too deeply nested (max 3 levels)
- [ ] Consistent naming convention
- [ ] No duplicates with different names

**Good example:**
```
common.buttons.download
features.downloader.title
errors.network.timeout
```

**Bad example:**
```
text1
page.section.subsection.item.label.text
downloadButton
DownloadButton (inconsistent casing)
```

---

### **3. TRANSLATION ENGINE**

#### **3.1 Core Features Working**

Verify engine implements:
- [ ] Translation lookup by key
- [ ] Dot notation support: `t('common.buttons.download')`
- [ ] Variable interpolation: `t('welcome', { name: 'User' })`
- [ ] Pluralization (if implemented)
- [ ] Fallback to English for missing keys
- [ ] Missing key warnings (dev mode)

#### **3.2 SSR Compatibility**

Critical for y2matepro:
- [ ] Works in Node.js environment
- [ ] Can load locale files server-side
- [ ] No browser-only APIs used
- [ ] Compatible with Eleventy
- [ ] Tested in SSR environment

**Ask implementer:**
"Did you test this with Eleventy SSR? How does it work?"

#### **3.3 CSR Compatibility**

For browser apps (clone-4, etc.):
- [ ] Works in browser environment
- [ ] Can dynamically load locales
- [ ] No Node.js-only APIs used
- [ ] Bundle size reasonable
- [ ] Tested in browser

#### **3.4 Performance**

Check for performance issues:
- [ ] Translation lookup is fast (cached?)
- [ ] Locale files loaded efficiently
- [ ] No unnecessary re-parsing
- [ ] No memory leaks
- [ ] Bundle size acceptable (< 50KB for engine + 1 locale)

---

### **4. RTL SUPPORT**

#### **4.1 RTL Language Detection**

Verify RTL is properly detected:
- [ ] Arabic (ar) detected as RTL
- [ ] Urdu (ur) detected as RTL
- [ ] All other languages detected as LTR
- [ ] Engine provides RTL info
- [ ] Helper function for dir attribute exists

#### **4.2 RTL Rendering**

Test with Arabic (ar):
- [ ] `dir="rtl"` attribute set on html/body
- [ ] Text flows right-to-left
- [ ] UI elements mirror correctly
- [ ] No visual bugs in RTL mode
- [ ] Layout flips appropriately

**How to verify:**
- Set language to Arabic in clone-4
- Check HTML has `dir="rtl"`
- Manually test all pages
- Look for alignment issues

#### **4.3 Bidirectional Text**

Test mixed content:
- [ ] RTL text + LTR URLs render correctly
- [ ] RTL text + English terms handle properly
- [ ] Numbers position correctly in RTL
- [ ] Punctuation correct in RTL

---

### **5. TRANSLATION CHECKER TOOL**

#### **5.1 Tool Exists and Runs**

Verify checker tool:
- [ ] Tool file exists (e.g., `src/cli/check-translations.ts`)
- [ ] Can run via: `pnpm check:i18n`
- [ ] Runs without errors
- [ ] Produces clear output

#### **5.2 Missing Key Detection**

Test detection:
- [ ] Detects missing keys across locales
- [ ] Reports which locale is missing which key
- [ ] Shows clear error messages
- [ ] Exit code non-zero if issues found

**How to test:**
- Temporarily remove a key from one locale
- Run checker
- Should detect the missing key

#### **5.3 Unused Key Detection**

Optional but recommended:
- [ ] Finds keys in locale files not used in code
- [ ] Reports unused keys
- [ ] Suggests cleanup

#### **5.4 Coverage Report**

Verify reporting:
- [ ] Shows translation % per language
- [ ] Highlights incomplete languages
- [ ] Clear format (table/JSON)
- [ ] Actionable output

---

### **6. YTMP3-CLONE-4 MIGRATION**

#### **6.1 Dependency Added**

Check `apps/ytmp3-clone-4/package.json`:
- [ ] Has `@downloader/i18n` dependency
- [ ] Dependency version correct: `workspace:*`

#### **6.2 No Hardcoded Strings**

Critical check:
- [ ] No hardcoded user-facing strings remain
- [ ] All UI text uses translation calls
- [ ] Error messages translated
- [ ] Button labels translated
- [ ] Placeholders translated

**How to verify:**
```bash
# Search for suspicious patterns (should return minimal results)
grep -r '"[A-Z][a-z]* ' apps/ytmp3-clone-4/src/
grep -r "'[A-Z][a-z]* " apps/ytmp3-clone-4/src/

# Acceptable: console.log, comments, code strings
# Not acceptable: UI strings
```

#### **6.3 Translation Calls Correct**

Check translation usage:
- [ ] Uses correct API: `t('key.path')`
- [ ] Variable interpolation correct
- [ ] No typos in key names
- [ ] Keys exist in locale files

**Common mistakes:**
- Typo: `t('commmon.button')` (should be `common.button`)
- Wrong separator: `t('common_button')` (should use dot)
- Missing variable: `t('welcome')` but needs `{ name }`

#### **6.4 Language Switcher**

Verify switcher exists:
- [ ] UI component for language selection
- [ ] Lists all 19 languages
- [ ] Shows language names in native script (optional)
- [ ] Persists selection (localStorage/cookie)
- [ ] Updates UI when switched

**Test manually:**
- [ ] Switch to Spanish - UI updates
- [ ] Switch to Arabic - UI becomes RTL
- [ ] Refresh page - language persists
- [ ] All languages selectable

#### **6.5 Build Verification**

Verify app builds:
- [ ] `cd apps/ytmp3-clone-4 && pnpm run build` succeeds
- [ ] No TypeScript errors
- [ ] No missing translation warnings (if strict)
- [ ] Build output exists and works

---

### **7. TEST QUALITY**

#### **7.1 Test Coverage**

Check coverage report:
- [ ] Overall coverage ≥ 80%
- [ ] Engine tests coverage ≥ 80%
- [ ] Helper functions coverage ≥ 80%
- [ ] RTL detection coverage ≥ 80%

**Run:** `pnpm test:coverage` and verify output

#### **7.2 Engine Tests**

Verify tests cover:
- [ ] Translation lookup (key exists)
- [ ] Translation lookup (key missing → fallback)
- [ ] Variable interpolation
- [ ] Multiple variables
- [ ] Missing variable handling
- [ ] Pluralization (if implemented)
- [ ] Locale switching
- [ ] Fallback chain

#### **7.3 RTL Tests**

Verify tests cover:
- [ ] RTL language detection (ar, ur)
- [ ] LTR language detection (all others)
- [ ] dir attribute helper
- [ ] RTL class helper (if exists)

#### **7.4 Checker Tool Tests**

Verify tests cover:
- [ ] Missing key detection
- [ ] Unused key detection (if implemented)
- [ ] Coverage calculation
- [ ] Report generation

#### **7.5 SSR/CSR Environment Tests**

Critical for dual environment:
- [ ] Mock SSR environment (Node.js)
- [ ] Mock CSR environment (browser)
- [ ] Verify works in both
- [ ] No environment-specific errors

---

### **8. CODE QUALITY**

#### **8.1 TypeScript Quality**

- [ ] No `any` types in package code
- [ ] Proper interfaces/types for translations
- [ ] Type-safe translation keys (if using strict types)
- [ ] Exported types for consumers
- [ ] Strict mode compliant

**Advanced (optional):**
- Type-safe keys: `t('common.buttons.download')` has autocomplete
- Variable types checked: `t('welcome', { name: string })`

#### **8.2 Performance Optimizations**

Check for optimizations:
- [ ] Translation lookup cached
- [ ] Locale files loaded on demand (not all 19 upfront)
- [ ] No unnecessary re-parsing
- [ ] Efficient key lookup (O(1) or O(log n))

#### **8.3 Error Handling**

Verify proper error handling:
- [ ] Missing key → warning + fallback (not crash)
- [ ] Missing locale file → fallback to English
- [ ] Invalid interpolation → graceful handling
- [ ] Clear error messages

#### **8.4 Documentation**

- [ ] README explains usage
- [ ] API documented (JSDoc or README)
- [ ] Examples reference actual code files
- [ ] Migration guide for apps
- [ ] No code examples in docs (per project policy)

---

### **9. PHASE 2 SPECIFIC CONSTRAINTS**

Verify these constraints were followed:

#### **9.1 MUST NOT (Violations = Request Changes)**

- [ ] ❌ Did NOT use heavy i18n libraries
- [ ] ❌ Did NOT break SSR compatibility
- [ ] ❌ Did NOT hardcode translations in code
- [ ] ❌ Did NOT change app behavior (only added i18n)
- [ ] ❌ Did NOT modify other apps (besides clone-4)

#### **9.2 MUST (Missing = Request Changes)**

- [ ] ✅ DID support SSR (Eleventy compatible)
- [ ] ✅ DID support CSR (browser compatible)
- [ ] ✅ DID implement RTL (ar, ur)
- [ ] ✅ DID create all 19 locale files
- [ ] ✅ DID write translation checker
- [ ] ✅ DID achieve 80%+ coverage
- [ ] ✅ DID discuss approach before coding

---

### **10. BACKWARD COMPATIBILITY**

#### **10.1 Other Apps Unchanged**

Verify only clone-4 modified:
- [ ] y2matepro NOT modified
- [ ] ytmp3-clone-3 NOT modified
- [ ] ytmp3-clone-darkmode-3 NOT modified
- [ ] y2mate-new-ux NOT modified

#### **10.2 Clone-4 Behavior Unchanged**

Critical - app should work identically:
- [ ] Same features work
- [ ] Same UI (visually similar in English)
- [ ] Same error handling
- [ ] Same download flow
- [ ] No regressions

**Only difference:** Now translatable + language switcher

---

## 🚨 CRITICAL ISSUES (MUST FIX BEFORE APPROVE)

If you find ANY of these, REQUEST CHANGES immediately:

1. **Missing Languages**
   - Less than 19 locale files
   - Key structure inconsistent across files

2. **SSR Broken**
   - Doesn't work in Node.js
   - Uses browser-only APIs
   - Can't be used with Eleventy

3. **RTL Not Working**
   - Arabic/Urdu don't render RTL
   - Layout doesn't mirror
   - Visual bugs in RTL mode

4. **Tests Insufficient**
   - Coverage < 80%
   - Missing critical test cases
   - Tests don't verify SSR/CSR

5. **Hardcoded Strings Remain**
   - User-facing strings not translated
   - Clone-4 still has hardcoded text
   - Error messages in English only

6. **Translation Checker Missing/Broken**
   - Tool doesn't exist
   - Doesn't detect issues
   - Reports incorrect results

7. **Other Apps Modified**
   - Changes beyond clone-4
   - Breaking changes to other apps

---

## ⚠️ WARNINGS (Should Fix, Not Blocking)

These should be addressed but won't block merge:

1. **Documentation**
   - Incomplete README
   - Missing usage examples
   - No migration guide

2. **Performance**
   - Large bundle size (> 50KB)
   - Slow translation lookup
   - All locales loaded upfront

3. **Type Safety**
   - Using `any` types
   - No autocomplete for keys
   - Missing type exports

4. **Translation Quality**
   - English translations unclear
   - Inconsistent tone/voice
   - Poor placeholder naming

5. **Developer Experience**
   - No clear error messages
   - Hard to debug missing keys
   - No development helpers

---

## ✅ APPROVAL CRITERIA

Approve PR when:

- [ ] All critical checks passed
- [ ] All MUST constraints satisfied
- [ ] 19 locale files with identical keys
- [ ] SSR and CSR both working
- [ ] RTL rendering correct (ar, ur)
- [ ] Translation checker working
- [ ] Tests passing with 80%+ coverage
- [ ] ytmp3-clone-4 migrated successfully
- [ ] No hardcoded strings in clone-4
- [ ] Behavior unchanged (only added i18n)
- [ ] No breaking changes to other apps
- [ ] PR description complete

---

## 📝 REVIEW TEMPLATE

Use this template for your review:

```markdown
## Phase 2 Code Review

### Summary
[Brief assessment - Approve/Request Changes/Comment]

**Verdict:** ✅ Approve | ⚠️ Approve with Comments | ❌ Request Changes

---

### Checklist Results

**Package Structure (✅/❌):**
- Package exists: [✅/❌]
- Exports configured: [✅/❌]
- Dependencies minimal: [✅/❌]

**Locale Files (✅/❌):**
- All 19 languages: [✅/❌] ([X]/19 found)
- Identical key structure: [✅/❌]
- English complete: [✅/❌]
- Key naming quality: [assessment]

**Translation Engine (✅/❌):**
- Core features: [✅/❌]
- SSR compatible: [✅/❌]
- CSR compatible: [✅/❌]
- Performance: [assessment]

**RTL Support (✅/❌):**
- Arabic (ar): [✅/❌]
- Urdu (ur): [✅/❌]
- Layout mirroring: [✅/❌]
- Bidirectional text: [✅/❌]

**Translation Checker (✅/❌):**
- Tool exists: [✅/❌]
- Detects issues: [✅/❌]
- Clear output: [✅/❌]

**Migration (✅/❌):**
- Clone-4 migrated: [✅/❌]
- No hardcoded strings: [✅/❌]
- Language switcher: [✅/❌]
- Behavior unchanged: [✅/❌]

**Tests (✅/❌):**
- Coverage: [X]% (target: 80%)
- Engine tests: [assessment]
- RTL tests: [assessment]
- SSR/CSR tests: [assessment]

**Code Quality (✅/❌):**
- TypeScript quality: [✅/❌]
- Error handling: [✅/❌]
- Documentation: [✅/❌]
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
- [ ] `pnpm check:i18n` - ✅ No issues / ❌ [X] issues
- [ ] `cd apps/ytmp3-clone-4 && pnpm run build` - ✅ Success

**Manual testing:**
- [ ] Tested language switching in clone-4
- [ ] Tested Arabic (RTL)
- [ ] Tested Urdu (RTL)
- [ ] Tested [X] other languages
- [ ] Verified no hardcoded strings

**Code analysis:**
- [ ] Reviewed engine implementation
- [ ] Checked all 19 locale files
- [ ] Verified key consistency
- [ ] Reviewed test comprehensiveness

---

### Language Testing Results

| Language | Code | Working | RTL | Notes |
|----------|------|---------|-----|-------|
| English | en | ✅ | - | Complete |
| Arabic | ar | ✅/❌ | ✅/❌ | [Notes] |
| Urdu | ur | ✅/❌ | ✅/❌ | [Notes] |
| [Others] | [code] | ✅/❌ | - | [Notes] |

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
- [ ] [Suggestion 2]

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

**As Phase 2 Reviewer, you are checking:**
- ✅ I18n system works (SSR + CSR)
- ✅ All 19 languages supported
- ✅ RTL rendering correct (ar, ur)
- ✅ Translation checker working
- ✅ No hardcoded strings
- ✅ Foundation solid for Phase 3

**This is CRITICAL:** All future apps will use this i18n system. If Phase 2 has issues, every app will be affected.

---

**Review carefully! Phase 2 is the i18n foundation.** 🔍
