# PHASE 2: I18N SYSTEM - AI IMPLEMENTATION PROMPT

> **Phase:** I18n System (Week 3-4)
> **Objective:** Create internationalization infrastructure for 19 languages
> **Risk Level:** 🟡 Medium (affects all apps)
> **Prerequisites:** Phase 1 complete (utilities extracted)

---

## ⚠️ CRITICAL: NO CODE IN THIS DOCUMENT

**This document contains:**
- ✅ File paths to read
- ✅ Instructions on WHAT to do
- ✅ Requirements and constraints
- ❌ NO CODE EXAMPLES

**You MUST:**
- Read actual code from project files
- Analyze existing i18n usage patterns
- Propose your own approach
- Discuss before implementing

---

## 📚 REQUIRED READING (MUST READ BEFORE DISCUSSION)

### **Critical Documents:**
1. `/docs/refactor/MASTER_REFACTOR_DOC.md` - Full project context
2. `/docs/refactor/README.md` - How to use this system
3. `/docs/refactor/prompts/PHASE_1_EXTRACT_UTILITIES.md` - Previous phase context
4. `/CLAUDE.md` - Project guidelines

### **Code Files to Read and Analyze:**

**Current i18n implementation (to understand pattern):**
- `/apps/y2matepro/src/i18n/en.json` (if exists)
- `/apps/y2matepro/src/i18n/` (entire directory)
- `/apps/ytmp3-clone-3/src/i18n/` (if exists)
- `/apps/ytmp3-clone-4/src/i18n/` (if exists)

**Files that use translations (to find patterns):**
- Search for: `t('`, `i18n.`, `translate(`, `__('` across all apps
- Analyze how translations are currently called
- Understand SSR vs CSR usage

**Eleventy integration (for y2matepro SSR):**
- `/apps/y2matepro/.eleventy.js` (if exists)
- Any eleventy data files with i18n
- Template files using translations

**Purpose:** Understand existing patterns before creating new system.

---

## 🎯 PHASE OBJECTIVES

### **Primary Goals:**

1. **Create i18n package:**
   - Package location: `packages/i18n/`
   - Translation engine (works in browser + SSR)
   - Language detection/switching
   - RTL support mechanism
   - Fallback chain (missing key → en)

2. **Setup 19 locale files:**
   - Languages: en, ar, bn, de, es, fr, hi, id, it, ja, ko, ms, my, pt, ru, th, tr, ur, vi
   - Structure: organized by feature/domain
   - Namespace pattern for organization
   - Placeholder for dynamic values

3. **Write i18n engine:**
   - Translation lookup with dot notation
   - Variable interpolation
   - Pluralization support
   - Date/number formatting per locale
   - Missing translation warnings

4. **Write translation checker tool:**
   - CLI tool to validate locale files
   - Detect missing keys
   - Detect unused keys
   - Generate translation coverage report

5. **Migrate one app to use i18n:**
   - Target: ytmp3-clone-4 (test app)
   - Replace hardcoded strings
   - Verify all languages work
   - Test RTL rendering

### **Success Criteria:**
- [ ] Package `@downloader/i18n` created
- [ ] All 19 locale files with identical key structure
- [ ] Engine works in both SSR and CSR
- [ ] RTL languages (ar, ur) render correctly
- [ ] Translation checker detects issues
- [ ] ytmp3-clone-4 fully internationalized
- [ ] No hardcoded strings in clone-4
- [ ] Language switcher works

---

## 🚫 CRITICAL CONSTRAINTS

### **MUST NOT:**
- ❌ Hardcode translations in engine code
- ❌ Break SSR compatibility (Eleventy needs this)
- ❌ Change app behavior during migration
- ❌ Use heavy i18n libraries (keep it lightweight)
- ❌ Copy code from this document (there is no code here)

### **MUST:**
- ✅ Support SSR (Eleventy) and CSR (vanilla JS)
- ✅ Support RTL languages (ar, ur)
- ✅ Support pluralization
- ✅ Support variable interpolation
- ✅ Provide fallback to English
- ✅ Write comprehensive tests
- ✅ Discuss approach before coding

---

## 🌍 LANGUAGE REQUIREMENTS

### **19 Languages to Support:**

| Code | Language | Direction | Notes |
|------|----------|-----------|-------|
| en | English | LTR | Default/fallback |
| ar | Arabic | **RTL** | Right-to-left |
| bn | Bengali | LTR | |
| de | German | LTR | |
| es | Spanish | LTR | |
| fr | French | LTR | |
| hi | Hindi | LTR | |
| id | Indonesian | LTR | |
| it | Italian | LTR | |
| ja | Japanese | LTR | |
| ko | Korean | LTR | |
| ms | Malay | LTR | |
| my | Burmese | LTR | |
| pt | Portuguese | LTR | |
| ru | Russian | LTR | |
| th | Thai | LTR | |
| tr | Turkish | LTR | |
| ur | Urdu | **RTL** | Right-to-left |
| vi | Vietnamese | LTR | |

**RTL Handling:**
- Arabic (ar) and Urdu (ur) require special CSS handling
- Engine should provide `dir` attribute helper
- Layout should flip for RTL languages

---

## 📋 DETAILED TASKS

### **Task 1: Analyze Existing i18n Implementation**

**What to do:**
1. Search for all translation usage across apps
2. Find patterns: How are translations called?
3. Understand SSR requirements (y2matepro + Eleventy)
4. Identify namespaces/domains needed
5. List all strings that need translation

**Files to analyze:**
- All apps in `apps/*/src/**/*.{html,js,ts}`
- Search for hardcoded user-facing strings
- Find existing i18n patterns (if any)

**Expected findings:**
- Current i18n pattern (if exists)
- List of translatable strings
- SSR vs CSR usage patterns
- Namespace organization needed

**Output:**
- Analysis report
- List of namespaces (e.g., common, errors, features, formats)
- Proposed key structure
- SSR compatibility requirements

---

### **Task 2: Design i18n System Architecture**

**Requirements to address:**

1. **Dual Environment Support:**
   - SSR: Eleventy builds (y2matepro)
   - CSR: Browser runtime (clone apps)
   - Same API for both

2. **Translation Key Structure:**
   - Dot notation: `features.downloader.title`
   - Namespace organization
   - Avoid deep nesting (max 3 levels)

3. **Features Needed:**
   - Variable interpolation: `"Welcome {{name}}"`
   - Pluralization: `"1 video" vs "5 videos"`
   - Fallback chain: es-MX → es → en
   - Missing key warnings (dev mode)

4. **RTL Support:**
   - Detect RTL languages
   - Provide dir attribute
   - CSS class for RTL

**Output:**
- Architecture design document
- API design (how to call translations)
- File structure proposal
- Build/bundle strategy

**Validation:**
- Discuss with human before implementing
- Get approval on architecture

---

### **Task 3: Create i18n Package**

**Package location:** `/packages/i18n/`

**Package structure (design yourself):**
```
packages/i18n/
├── src/
│   ├── engine/         # Translation engine
│   ├── locales/        # 19 locale files
│   ├── types/          # TypeScript types
│   └── utils/          # Helper utilities
├── tests/              # Comprehensive tests
├── package.json
└── README.md
```

**What to implement:**

1. **Translation Engine:**
   - Read from file path to understand requirements
   - Design API based on analysis
   - Support both SSR and CSR

2. **Locale Files:**
   - Create 19 JSON/JS files
   - Identical key structure
   - English as baseline (complete)
   - Others can have placeholders initially

3. **Helper Functions:**
   - Language detection
   - RTL detection
   - Locale switching
   - Fallback logic

**Test file:** `/packages/i18n/tests/`

**Test requirements:**
- Test translation lookup
- Test variable interpolation
- Test pluralization
- Test fallback chain
- Test RTL detection
- Test missing key handling
- Mock SSR environment
- Mock browser environment

**Validation:**
- Run: `pnpm test`
- Check coverage: `pnpm test:coverage`
- Target: 80%+ coverage

---

### **Task 4: Create 19 Locale Files**

**Input:** Analysis from Task 1 (list of strings to translate)

**Output location:** `/packages/i18n/src/locales/`

**File naming:**
- `en.json` (or .js if needed for SSR)
- `ar.json`
- `bn.json`
- ... (all 19 languages)

**Key structure (design based on analysis):**

Organize by domain/feature:
- `common.*` - Shared strings (buttons, labels)
- `errors.*` - Error messages
- `features.downloader.*` - Downloader feature
- `features.converter.*` - Converter feature
- `formats.*` - Format names/descriptions

**Initial translation strategy:**
1. English (en): Complete all strings
2. Other languages: Can use English temporarily with TODO marker
3. Translation can be filled later by native speakers

**Important:**
- All 19 files must have identical key structure
- Missing keys = fallback to English
- Use meaningful key names (not just numbers)

**Validation:**
- Run translation checker (Task 5)
- Verify all files have same keys
- No missing keys in English

---

### **Task 5: Write Translation Checker Tool**

**Tool location:** `/packages/i18n/src/cli/check-translations.ts`

**What the tool should do:**

1. **Key Completeness Check:**
   - Load all 19 locale files
   - Compare key structures
   - Report missing keys per language

2. **Unused Key Detection:**
   - Scan all app code for translation calls
   - Find keys in locale files not used in code
   - Report unused keys

3. **Coverage Report:**
   - Calculate translation % per language
   - Show which languages need work
   - Highlight completely untranslated strings

4. **Output Format:**
   - CLI table with colors
   - JSON export option
   - CI-friendly exit codes

**Package.json script:**
- Add script to run checker
- Should be runnable: `pnpm check:i18n`

**Validation:**
- Test with intentionally missing keys
- Test with unused keys
- Verify reports are accurate

---

### **Task 6: Update Package Exports**

**Files to create/update:**

1. `/packages/i18n/package.json`
   - Define exports
   - Add dependencies
   - Add scripts (test, check, build)

2. `/packages/i18n/src/index.ts`
   - Export translation engine
   - Export types
   - Export helper functions
   - Export locale files (if needed)

3. `/packages/i18n/README.md`
   - Usage instructions
   - API documentation
   - Examples (reference actual code files, don't write code in README)

**Verify exports work:**
- Test importing from package
- Check TypeScript types available
- Verify tree-shaking works

---

### **Task 7: Migrate ytmp3-clone-4**

**Why ytmp3-clone-4:**
- Test app (safe to experiment)
- Has full features to test
- CSR environment (simpler than y2matepro SSR)

**Steps:**

1. **Add dependency:**
   - Update `apps/ytmp3-clone-4/package.json`
   - Add `"@downloader/i18n": "workspace:*"`
   - Run `pnpm install`

2. **Initialize i18n in app:**
   - Read app entry point
   - Initialize i18n engine
   - Setup language detection
   - Add language switcher UI

3. **Replace hardcoded strings:**
   - Find all user-facing strings
   - Replace with translation calls
   - Use meaningful keys
   - Add to locale files

4. **Add RTL support:**
   - Add dir attribute to html
   - Add RTL CSS classes
   - Test with Arabic (ar)
   - Verify layout flips correctly

5. **Add language switcher:**
   - Create UI component
   - List all 19 languages
   - Persist selection (localStorage)
   - Reload content on change

**Validation:**
- [ ] App builds without errors
- [ ] All strings translatable
- [ ] Language switching works
- [ ] RTL languages render correctly
- [ ] No console errors
- [ ] No hardcoded user-facing strings

---

### **Task 8: Test RTL Languages**

**Special focus on Arabic (ar) and Urdu (ur):**

**What to test:**

1. **Text Direction:**
   - Text flows right-to-left
   - Punctuation positioned correctly
   - Numbers positioned correctly

2. **Layout Mirroring:**
   - UI elements flip (buttons, inputs)
   - Navigation reversed
   - Icons mirrored (if needed)

3. **Mixed Content:**
   - RTL text + LTR URLs
   - RTL text + English terms
   - Proper bidirectional handling

**Testing checklist:**
- [ ] Set language to Arabic
- [ ] Verify dir="rtl" on html
- [ ] Check text flows right-to-left
- [ ] Verify layout mirrors
- [ ] Test all features in RTL
- [ ] Check for visual bugs
- [ ] Test Urdu as well

---

## 🔄 WORKFLOW FOR THIS PHASE

### **Step 1: DISCUSSION PHASE (MANDATORY)**

**Before writing ANY code, you must discuss:**

Send message to human:

```
I'm starting Phase 2: I18n System

Documents read:
- ✅ MASTER_REFACTOR_DOC.md
- ✅ README.md
- ✅ PHASE_2_I18N_SYSTEM.md

Code files analyzed:
- ✅ apps/y2matepro/src/i18n/ (existing implementation)
- ✅ Searched for translation usage patterns
- ✅ Analyzed hardcoded strings across apps
- ✅ Reviewed Eleventy SSR requirements

Analysis findings:
- Current i18n pattern: [describe what you found]
- Hardcoded strings found: ~[X] strings
- Namespaces needed: [list]
- SSR requirements: [describe]

Questions before proceeding:
1. [Your questions]
2. [Your questions]

Proposed i18n architecture:
1. Engine design: [your proposal]
2. Key structure: [your proposal]
3. SSR strategy: [your approach]
4. RTL handling: [your approach]

Proposed locale key organization:
```
common.buttons.download
common.buttons.convert
errors.network.timeout
features.downloader.title
[etc]
```

Risks identified:
- [Risk 1]
- [Risk 2]

For translation content:
- English: I'll write complete strings
- Other 18 languages: Should I use English as placeholder initially?
- Native speakers: Will they review/translate later?

Awaiting your approval to proceed.
```

**⚠️ WAIT FOR APPROVAL BEFORE CODING**

---

### **Step 2: IMPLEMENTATION PHASE**

Only after approval:

1. Create branch: `refactor/phase-2-i18n-system`

2. Implement tasks in order:
   - Task 1: Analysis ✓
   - Task 2: Architecture design
   - Task 3: Create package
   - Task 4: Create locale files
   - Task 5: Translation checker
   - Task 6: Package exports
   - Task 7: Migrate app
   - Task 8: Test RTL

3. For each task:
   - Implement feature
   - Write tests
   - Verify tests pass
   - Check coverage

---

### **Step 3: VERIFICATION PHASE**

**Run all tests:**
- `pnpm test` - Unit tests
- `pnpm test:coverage` - Check 80%+ coverage
- `pnpm check:i18n` - Run translation checker

**Manual testing:**
- Run ytmp3-clone-4: `cd apps/ytmp3-clone-4 && pnpm run dev`
- Test all 19 languages
- Special focus on RTL (ar, ur)
- Verify language switching
- Check for layout issues

**Translation verification:**
- [ ] All locale files have same keys
- [ ] English is complete
- [ ] No missing keys reported
- [ ] Translation checker passes

**RTL verification:**
- [ ] Arabic renders RTL
- [ ] Urdu renders RTL
- [ ] Layout mirrors correctly
- [ ] No visual bugs
- [ ] Text direction correct

---

### **Step 4: REVIEW PHASE**

**Create PR with:**

Title: `[Phase 2] Add i18n system with 19 languages`

Description:
```markdown
## Phase 2: I18n System

### Summary
Created internationalization infrastructure supporting 19 languages with RTL support.

### Changes
- ✅ Created packages/i18n/ package
- ✅ Implemented translation engine (SSR + CSR)
- ✅ Created 19 locale files (en, ar, bn, de, es, fr, hi, id, it, ja, ko, ms, my, pt, ru, th, tr, ur, vi)
- ✅ Implemented RTL support (ar, ur)
- ✅ Written translation checker tool
- ✅ Migrated ytmp3-clone-4 to use i18n
- ✅ Written [X] unit tests
- ✅ Achieved [X]% test coverage

### Features
- Variable interpolation: `t('welcome', { name: 'User' })`
- Pluralization support
- Fallback chain (locale → en)
- RTL language support
- Missing key warnings
- Translation completeness checker

### Test Results
- Unit tests: [X] passing
- Coverage: [X]%
- Translation checker: ✅ All keys present
- Manual testing: ✅ All languages working

### Languages Tested
- ✅ English (en) - Complete
- ✅ Arabic (ar) - RTL verified
- ✅ Urdu (ur) - RTL verified
- ⏳ Other 16 languages - Placeholder (need native speaker review)

### Verification
- clone-4 (before): Hardcoded strings
- clone-4 (after): ✅ Fully internationalized
- Language switching: ✅ Working
- RTL rendering: ✅ Correct

### Files Changed
**Added:**
- packages/i18n/src/engine/ ([X] lines)
- packages/i18n/src/locales/ (19 files)
- packages/i18n/src/cli/check-translations.ts
- packages/i18n/tests/ ([X] tests)
- [list all new files]

**Modified:**
- apps/ytmp3-clone-4/package.json (added i18n dependency)
- apps/ytmp3-clone-4/src/ (replaced hardcoded strings)
- [list modified files]

### Translation Coverage
[Include output from translation checker]

### Next Steps
Ready for Phase 3: Extract Conversion Logic
```

Submit for review (AI Reviewer + Human)

---

## ✅ DEFINITION OF DONE

Phase 2 is complete when:

- [ ] Package `@downloader/i18n` created and working
- [ ] 19 locale files with identical key structure
- [ ] Translation engine works in SSR and CSR
- [ ] Variable interpolation works
- [ ] Pluralization works
- [ ] RTL languages (ar, ur) render correctly
- [ ] Translation checker tool working
- [ ] No missing keys in any locale
- [ ] ytmp3-clone-4 fully internationalized
- [ ] No hardcoded user-facing strings in clone-4
- [ ] Language switcher working
- [ ] 80%+ test coverage
- [ ] All tests passing
- [ ] PR created with complete description
- [ ] PR approved by reviewers
- [ ] Code merged to main branch
- [ ] Progress updated in MASTER_REFACTOR_DOC.md

---

## 🆘 TROUBLESHOOTING

### **If SSR compatibility breaks:**

**Do NOT ignore this - y2matepro needs SSR.**

1. Check how Eleventy loads/bundles code
2. Verify locale files are accessible at build time
3. Test translation calls in .njk/.html templates
4. Check if static JSON works vs JS modules

### **If RTL rendering has issues:**

1. Verify dir="rtl" attribute is set
2. Check CSS specificity (RTL styles need !important?)
3. Test in different browsers
4. Look for hardcoded left/right in CSS

### **If translation keys are inconsistent:**

1. Run translation checker
2. Fix missing keys
3. Verify all languages have same structure
4. Re-run checker until clean

### **If fallback chain doesn't work:**

1. Check locale loading order
2. Verify English (en) is always loaded
3. Test with missing keys intentionally
4. Check console for warnings

---

## 📞 COMMUNICATION TEMPLATES

### **At Start:**
Use template from Step 1 above.

### **Progress Update:**
```
Phase 2 Progress Update:

Completed:
- ✅ Task 1: Analysis complete
- ✅ Task 2: Architecture designed and approved
- ✅ Task 3: Package created ([X] lines, [Y] tests)

In Progress:
- 🟡 Task 4: Creating locale files (5/19 complete)

Pending:
- ⏳ Task 5: Translation checker
- ⏳ Task 6: Package exports
- ⏳ Task 7: Migration
- ⏳ Task 8: RTL testing

Blockers: [None / List blockers]
ETA for completion: [Date]
```

### **At Completion:**
```
Phase 2 Complete! 🎉

Summary:
- Created i18n package with 19 languages
- Implemented SSR + CSR support
- RTL languages working (ar, ur)
- Migrated ytmp3-clone-4
- Written [X] tests
- Achieved [Y]% coverage
- All tests passing

PR: [link]
Ready for review.
```

---

## 🎓 TIPS FOR SUCCESS

### **Before implementing engine:**
- Understand SSR requirements thoroughly
- Check how Eleventy accesses data
- Design API that works in both environments
- Keep it simple - don't over-engineer

### **When creating locale files:**
- Start with English (complete)
- Use meaningful key names
- Group by feature/domain
- Keep nesting shallow (max 3 levels)
- Document expected placeholders

### **When writing translations:**
- Use natural language (not word-for-word)
- Consider context
- Mark dynamic parts clearly: {{variable}}
- Add comments for translators if needed

### **When testing RTL:**
- Test on real RTL language (ar/ur)
- Check EVERY page/feature
- Look for alignment issues
- Test mixed RTL/LTR content
- Don't assume CSS will work perfectly

---

## 📊 EXPECTED METRICS

**After Phase 2:**
- Package code: ~800-1000 lines
- Locale files: 19 files × ~200-300 keys
- Tests written: ~50-60 tests
- Coverage: 80-90%
- Apps migrated: 1 (ytmp3-clone-4)
- Languages supported: 19
- RTL languages: 2 (ar, ur)

---

## 🌐 TRANSLATION NOTES

### **For Initial Implementation:**
- English (en): Write complete, natural translations
- Other 18 languages: OK to use English as placeholder initially
- Mark placeholders with TODO or comment

### **For Future Translation:**
- Need native speakers for each language
- Provide context for translators
- Review for cultural appropriateness
- Test UI with real translations (lengths vary!)

### **Key Translation Considerations:**
- String length varies by language (German longer, CJK shorter)
- UI must handle variable text lengths
- Numbers, dates formatted per locale
- Currency symbols if needed
- Respect cultural norms

---

**Ready to start Phase 2! Remember: READ → ANALYZE → DISCUSS → APPROVE → CODE** 🚀
