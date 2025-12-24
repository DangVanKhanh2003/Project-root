# PHASE 1: EXTRACT UTILITIES - AI IMPLEMENTATION PROMPT

> **Phase:** Extract Utilities (Week 1-2)
> **Objective:** Extract utility functions to @downloader/core package
> **Risk Level:** 🟢 Low
> **Prerequisites:** None (first phase)

---

## ⚠️ CRITICAL: NO CODE IN THIS DOCUMENT

**This document contains:**
- ✅ File paths to read
- ✅ Instructions on WHAT to do
- ✅ Requirements and constraints
- ❌ NO CODE EXAMPLES

**You MUST:**
- Read actual code from project files
- Analyze and understand the code yourself
- Propose your own approach
- Discuss before implementing

---

## 📚 REQUIRED READING (MUST READ BEFORE DISCUSSION)

### **Critical Documents:**
1. `/docs/refactor/MASTER_REFACTOR_DOC.md` - Full project context
2. `/docs/refactor/README.md` - How to use this system
3. `/CLAUDE.md` - Project guidelines

### **Code Files to Read and Analyze:**

**Source of truth (ytmp3-clone-3):**
- `/apps/ytmp3-clone-3/src/utils/format-utils.ts`
- `/apps/ytmp3-clone-3/src/utils/link-validator.ts`
- `/apps/ytmp3-clone-3/src/utils/download-stream.ts`
- `/apps/ytmp3-clone-3/src/constants/youtube-constants.ts`

**Compare with other apps:**
- `/apps/y2matepro/src/utils/` (same files)
- `/apps/ytmp3-clone-4/src/utils/` (same files)
- `/apps/ytmp3-clone-darkmode-3/src/utils/` (same files)
- `/apps/y2mate-new-ux/src/utils/` (same files)

**Purpose:** Verify files are truly identical across apps.

### **YouTube helpers (embedded in input-form.ts):**
- `/apps/ytmp3-clone-3/src/features/downloader/logic/input-form.ts`
  - Find: `isYouTubeUrl` function
  - Find: `extractYouTubeVideoId` function
  - Find: `generateFakeYouTubeData` function
  - Find: `extractPlaylistId` function

---

## 🎯 PHASE OBJECTIVES

### **Primary Goals:**

1. **Extract utilities to packages/core/utils:**
   - format-utils.ts → packages/core/src/utils/format-utils.ts
   - link-validator.ts → packages/core/src/utils/link-validator.ts
   - download-stream.ts → packages/core/src/utils/download-stream.ts
   - youtube helpers → packages/core/src/utils/youtube/

2. **Write comprehensive tests:**
   - Target: 80%+ coverage
   - Unit tests for each utility
   - Mock browser APIs where needed

3. **Migrate one app:**
   - Target: ytmp3-clone-4
   - Update imports to use @downloader/core
   - Delete duplicate files
   - Verify behavior unchanged

### **Success Criteria:**
- [ ] All 4 utility modules extracted
- [ ] 80%+ test coverage achieved
- [ ] All unit tests passing
- [ ] ytmp3-clone-4 migrated successfully
- [ ] ytmp3-clone-4 behavior identical to before
- [ ] Duplicate files deleted from clone-4

---

## 🚫 CRITICAL CONSTRAINTS

### **MUST NOT:**
- ❌ Change utility logic during extraction
- ❌ Add new features to utilities
- ❌ Break existing apps
- ❌ Change function signatures
- ❌ Copy code from this document (there is no code here)

### **MUST:**
- ✅ Copy code exactly as-is from source files
- ✅ Write tests before migration
- ✅ Verify tests pass on original code first
- ✅ Compare behavior before/after migration
- ✅ Discuss approach before coding

---

## 📋 DETAILED TASKS

### **Task 1: Analyze and Compare Files**

**What to do:**
1. Read all 4 utility files from ytmp3-clone-3
2. Compare with same files in other 4 apps
3. Document any differences found
4. Identify which version is most complete

**Files to compare:**
- `format-utils.ts` across 5 apps
- `link-validator.ts` across 5 apps
- `download-stream.ts` across 5 apps
- `youtube-constants.ts` across 5 apps

**Expected findings:**
- Files should be identical or nearly identical
- If differences exist, document them
- Choose canonical version (usually ytmp3-clone-3)

**Output:**
- Comparison report
- List of any differences
- Decision on which version to use

---

### **Task 2: Extract format-utils.ts**

**Input:** `/apps/ytmp3-clone-3/src/utils/format-utils.ts`

**Output location:** `/packages/core/src/utils/format-utils.ts`

**Functions in this file (find by reading the file):**
- Check file for all exported functions
- Understand what each function does
- Note any dependencies

**Test file:** `/packages/core/src/utils/format-utils.test.ts`

**Test requirements:**
- Test all exported functions
- Test edge cases (null, undefined, empty strings)
- Test different input types
- Achieve 80%+ coverage

**Validation:**
- Run: `pnpm test format-utils.test.ts`
- Check coverage: `pnpm test:coverage`
- All tests must pass

---

### **Task 3: Extract link-validator.ts**

**Input:** `/apps/ytmp3-clone-3/src/utils/link-validator.ts`

**Output location:** `/packages/core/src/utils/link-validator.ts`

**What to extract:**
- Read the file to find all exports
- Constants (TTL values)
- Validation functions
- Time formatting functions

**Test file:** `/packages/core/src/utils/link-validator.test.ts`

**Special test cases:**
- Test with recent timestamps
- Test with expired timestamps
- Test at exact TTL boundary
- Test time formatting for different durations

**Validation:**
- Tests pass
- Coverage ≥ 80%

---

### **Task 4: Extract download-stream.ts**

**Input:** `/apps/ytmp3-clone-3/src/utils/download-stream.ts`

**Output location:** `/packages/core/src/utils/download-stream.ts`

**Special considerations:**
- This file uses browser APIs (fetch, Blob, URL.createObjectURL)
- Tests will need to mock these APIs
- Use Vitest's `vi.mock()` for mocking

**Test file:** `/packages/core/src/utils/download-stream.test.ts`

**Mock requirements:**
- Mock `global.fetch`
- Mock `global.URL.createObjectURL`
- Mock `global.URL.revokeObjectURL`
- Test success and error cases

**Validation:**
- Tests pass with mocks
- Coverage ≥ 80%

---

### **Task 5: Extract YouTube Helpers**

**Input:**
- Constants: `/apps/ytmp3-clone-3/src/constants/youtube-constants.ts`
- Functions: `/apps/ytmp3-clone-3/src/features/downloader/logic/input-form.ts`

**Output structure:**
```
packages/core/src/utils/youtube/
├── constants.ts           # YouTube API constants
├── url-parser.ts          # Extract video ID, playlist ID
├── validator.ts           # isYouTubeUrl function
├── fake-data-generator.ts # generateFakeYouTubeData
├── index.ts               # Barrel export
└── [test files for each]
```

**What to extract from input-form.ts:**
- Find `isYouTubeUrl` function (read code to understand logic)
- Find `extractYouTubeVideoId` function
- Find `generateFakeYouTubeData` function
- Find `extractPlaylistId` function
- Extract ONLY these functions, not the entire file

**Test requirements:**
- Test URL parsing with various YouTube URL formats:
  - Standard: youtube.com/watch?v=...
  - Short: youtu.be/...
  - Embed: youtube.com/embed/...
  - Mobile: m.youtube.com/...
  - With timestamps
  - Invalid URLs
- Test playlist ID extraction
- Test fake data generation

**Validation:**
- All URL formats handled correctly
- Tests comprehensive
- Coverage ≥ 80%

---

### **Task 6: Update Package Exports**

**Files to create/update:**

1. `/packages/core/src/utils/index.ts`
   - Export all utilities
   - Barrel export pattern

2. `/packages/core/src/utils/youtube/index.ts`
   - Export all YouTube helpers
   - Barrel export pattern

3. `/packages/core/package.json`
   - Update exports field
   - Add new entry points

**Verify exports work:**
- Test importing from package
- Check TypeScript types available

---

### **Task 7: Migrate ytmp3-clone-4**

**Why ytmp3-clone-4:**
- Not production (safe to test)
- Has full architecture
- Similar to clone-3 (easy to verify)

**Steps:**

1. **Add dependency:**
   - Update `apps/ytmp3-clone-4/package.json`
   - Add `"@downloader/core": "workspace:*"`
   - Run `pnpm install`

2. **Update imports:**
   - Find all files importing from local utils
   - Change to import from `@downloader/core/utils`
   - Change YouTube constants to `@downloader/core/utils/youtube`

3. **Delete old files:**
   - Delete `apps/ytmp3-clone-4/src/utils/format-utils.ts`
   - Delete `apps/ytmp3-clone-4/src/utils/link-validator.ts`
   - Delete `apps/ytmp3-clone-4/src/utils/download-stream.ts`
   - Delete `apps/ytmp3-clone-4/src/constants/youtube-constants.ts`

4. **Test:**
   - Build: `cd apps/ytmp3-clone-4 && pnpm run build`
   - Run dev: `pnpm run dev`
   - Manual test: Enter URL, convert, download
   - Compare with clone-3 (should behave identically)

**Validation:**
- [ ] App builds without errors
- [ ] App runs without console errors
- [ ] All features work
- [ ] Behavior identical to before migration

---

## 🔄 WORKFLOW FOR THIS PHASE

### **Step 1: DISCUSSION PHASE (MANDATORY)**

**Before writing ANY code, you must discuss:**

Send message to human:

```
I'm starting Phase 1: Extract Utilities

Documents read:
- ✅ MASTER_REFACTOR_DOC.md
- ✅ README.md
- ✅ PHASE_1_EXTRACT_UTILITIES.md

Code files analyzed:
- ✅ apps/ytmp3-clone-3/src/utils/format-utils.ts ([X] lines)
- ✅ apps/ytmp3-clone-3/src/utils/link-validator.ts ([X] lines)
- ✅ apps/ytmp3-clone-3/src/utils/download-stream.ts ([X] lines)
- ✅ apps/ytmp3-clone-3/src/constants/youtube-constants.ts ([X] lines)
- ✅ apps/ytmp3-clone-3/src/features/downloader/logic/input-form.ts (YouTube helpers)

Comparison results:
- format-utils.ts: [Identical/Different] across apps
- link-validator.ts: [Identical/Different] across apps
- download-stream.ts: [Found differences - detail below]
- youtube-constants.ts: [Identical/Different] across apps

[If differences found, list them here]

Questions before proceeding:
1. [Your questions]
2. [Your questions]

Proposed approach:
1. Use ytmp3-clone-3 as source of truth
2. Extract in this order: [your order]
3. Create tests with [strategy]
4. Migrate clone-4 using [approach]

Risks identified:
- [Risk 1]
- [Risk 2]

Awaiting your approval to proceed.
```

**⚠️ WAIT FOR APPROVAL BEFORE CODING**

---

### **Step 2: IMPLEMENTATION PHASE**

Only after approval:

1. Create branch: `refactor/phase-1-extract-utilities`

2. Implement tasks in order:
   - Task 1: Analysis ✓
   - Task 2: format-utils
   - Task 3: link-validator
   - Task 4: download-stream
   - Task 5: YouTube helpers
   - Task 6: Package exports
   - Task 7: Migrate app

3. For each task:
   - Extract code
   - Write tests
   - Verify tests pass
   - Check coverage

---

### **Step 3: VERIFICATION PHASE**

**Run all tests:**
- `pnpm test` - Unit tests
- `pnpm test:coverage` - Check 80%+ coverage

**Manual testing:**
- Run ytmp3-clone-4: `cd apps/ytmp3-clone-4 && pnpm run dev`
- Test conversion flow
- Compare with clone-3 behavior

**Comparison checklist:**
- [ ] Same format options appear
- [ ] Same conversion behavior
- [ ] Same error handling
- [ ] Same download flow
- [ ] No console errors
- [ ] No TypeScript errors

---

### **Step 4: REVIEW PHASE**

**Create PR with:**

Title: `[Phase 1] Extract utilities to @downloader/core`

Description:
```markdown
## Phase 1: Extract Utilities

### Summary
Extracted 4 utility modules to packages/core/src/utils/

### Changes
- ✅ Created packages/core/src/utils/format-utils.ts
- ✅ Created packages/core/src/utils/link-validator.ts
- ✅ Created packages/core/src/utils/download-stream.ts
- ✅ Created packages/core/src/utils/youtube/
- ✅ Written [X] unit tests
- ✅ Achieved [X]% test coverage
- ✅ Migrated ytmp3-clone-4
- ✅ Deleted duplicate files from clone-4

### Test Results
- Unit tests: [X] passing
- Coverage: [X]%
- Manual testing: ✅ All flows working

### Verification
- clone-3 (original): ✅ Working
- clone-4 (migrated): ✅ Working identically

### Files Changed
**Added:**
- packages/core/src/utils/format-utils.ts ([X] lines)
- packages/core/src/utils/format-utils.test.ts ([X] lines)
- [list all new files]

**Deleted:**
- apps/ytmp3-clone-4/src/utils/format-utils.ts
- [list all deleted files]

**Modified:**
- apps/ytmp3-clone-4/package.json (added dependency)
- [list modified files with import changes]

### Next Steps
Ready for Phase 2: I18n System
```

Submit for review (AI Reviewer + Human)

---

## ✅ DEFINITION OF DONE

Phase 1 is complete when:

- [ ] All 4 utility modules extracted to packages/core/src/utils/
- [ ] 80%+ test coverage achieved
- [ ] All unit tests passing
- [ ] ytmp3-clone-4 migrated successfully
- [ ] ytmp3-clone-4 behavior verified identical
- [ ] Duplicate files deleted from clone-4
- [ ] PR created with complete description
- [ ] PR approved by reviewers
- [ ] Code merged to main branch
- [ ] Progress updated in MASTER_REFACTOR_DOC.md

---

## 🆘 TROUBLESHOOTING

### **If files are not identical across apps:**

**Do NOT proceed blindly.**

1. Document all differences
2. Analyze which version is correct
3. Ask human for decision
4. Wait for approval

### **If tests fail after extraction:**

1. Verify code was copied exactly
2. Check imports are correct
3. Verify no logic was accidentally changed
4. Compare with original file

### **If app won't build after migration:**

1. Check package.json has dependency
2. Run `pnpm install`
3. Verify import paths correct
4. Check TypeScript can resolve imports

### **If behavior changed after migration:**

**This is CRITICAL - DO NOT IGNORE**

1. Compare exact function calls
2. Verify same inputs produce same outputs
3. Check if any logic was modified
4. Revert and analyze what went wrong

---

## 📞 COMMUNICATION TEMPLATES

### **At Start:**
Use template from Step 1 above.

### **Progress Update:**
```
Phase 1 Progress Update:

Completed:
- ✅ Task 1: Analysis complete
- ✅ Task 2: format-utils extracted ([X] tests, [Y]% coverage)
- ✅ Task 3: link-validator extracted ([X] tests, [Y]% coverage)

In Progress:
- 🟡 Task 4: download-stream (writing tests)

Pending:
- ⏳ Task 5: YouTube helpers
- ⏳ Task 6: Package exports
- ⏳ Task 7: Migration

Blockers: [None / List blockers]
ETA for completion: [Date]
```

### **At Completion:**
```
Phase 1 Complete! 🎉

Summary:
- Extracted 4 utility modules
- Written [X] tests
- Achieved [Y]% coverage
- Migrated ytmp3-clone-4
- All tests passing

PR: [link]
Ready for review.
```

---

## 🎓 TIPS FOR SUCCESS

### **Before extracting:**
- Read code carefully to understand what it does
- Check for dependencies
- Look for any app-specific logic (should be rare in utils)

### **When writing tests:**
- Test happy path first
- Then test edge cases
- Then test error cases
- Use descriptive test names

### **When migrating app:**
- Test build first
- Then test runtime
- Compare behavior carefully
- Don't assume it works - verify!

---

## 📊 EXPECTED METRICS

**After Phase 1:**
- Lines extracted: ~500 lines core utils
- Tests written: ~40-50 tests
- Coverage: 80-90%
- Apps migrated: 1 (ytmp3-clone-4)
- Duplicate code reduced: ~2,000 lines (across 5 apps)

---

**Ready to start Phase 1! Remember: READ → ANALYZE → DISCUSS → APPROVE → CODE** 🚀
