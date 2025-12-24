# PHASE 3 REVIEW PROMPT - FOR AI CODE REVIEWER

> **Phase:** Phase 3 - Extract Conversion Logic
> **Review Type:** Code Review
> **Reviewer Role:** AI Code Reviewer
> **⚠️ CRITICAL:** This is the MOST IMPORTANT review - core business logic

---

## 📚 REQUIRED READING BEFORE REVIEW

**MUST READ (in order):**
1. `/docs/refactor/MASTER_REFACTOR_DOC.md` - ESPECIALLY the Dependency Injection section
2. `/docs/refactor/REVIEWER_PROMPT.md` - General review guidelines
3. `/docs/refactor/prompts/PHASE_3_EXTRACT_CONVERSION.md` - Phase 3 requirements
4. The PR description and all changed files

---

## 🎯 PHASE 3 SPECIFIC OBJECTIVES TO VERIFY

### **What Phase 3 Should Achieve:**

1. ✅ Extract 6 conversion strategies to `packages/core/conversion/`:
   - BaseStrategy (abstract base)
   - YouTubeStrategy
   - FacebookStrategy
   - TikTokStrategy
   - InstagramStrategy
   - TwitterStrategy
   - StrategyFactory

2. ✅ Implement Dependency Injection:
   - StateUpdater interface defined
   - Strategies accept StateUpdater
   - NO imports from state/ in package
   - State-independent code

3. ✅ Write comprehensive tests:
   - 80%+ coverage
   - All platforms tested
   - Mocked StateUpdater
   - Mocked API calls

4. ✅ Migrate ytmp3-clone-4:
   - StateUpdater implemented
   - All platforms working
   - Behavior unchanged

5. ✅ No changes to other apps (yet)

---

## ✅ PHASE 3 REVIEW CHECKLIST

### **1. DEPENDENCY INJECTION IMPLEMENTATION (CRITICAL)**

#### **1.1 StateUpdater Interface Defined**

Check interface exists and is well-designed:
- [ ] StateUpdater interface file exists
- [ ] Interface is properly typed (TypeScript)
- [ ] Methods are semantic (not implementation-specific)
- [ ] Methods cover all strategy needs
- [ ] Interface documented (JSDoc)

**Location to check:**
- `packages/core/src/conversion/types/state-updater.types.ts` (or similar)

**Interface quality check:**
- [ ] Method names clear (e.g., `updateProgress`, not `setState`)
- [ ] Parameters well-typed
- [ ] No references to specific state structure
- [ ] Flexible enough for different apps

#### **1.2 NO State Imports in Package (CRITICAL)**

**This is THE MOST CRITICAL check:**

Search for state imports in package code:
```bash
# Run these commands - should return NOTHING
grep -r "from.*state/" packages/core/src/conversion/
grep -r "import.*state" packages/core/src/conversion/
```

**Result should be:**
- [ ] ✅ No matches found (perfect)
- [ ] ❌ Matches found (CRITICAL FAILURE - request changes immediately)

**If ANY state imports found:**
- REQUEST CHANGES immediately
- Explain why this breaks architecture
- Ask for refactoring

#### **1.3 Strategies Accept StateUpdater**

Check each strategy:
- [ ] BaseStrategy accepts StateUpdater (constructor or method)
- [ ] YouTubeStrategy uses StateUpdater from base
- [ ] FacebookStrategy uses StateUpdater from base
- [ ] TikTokStrategy uses StateUpdater from base
- [ ] InstagramStrategy uses StateUpdater from base
- [ ] TwitterStrategy uses StateUpdater from base

**How to verify:**
- Read constructor/method signatures
- Check if StateUpdater is stored and used
- Verify state updates go through StateUpdater

#### **1.4 StrategyFactory Injects StateUpdater**

Check factory implementation:
- [ ] Factory accepts StateUpdater
- [ ] Factory passes StateUpdater to strategies when creating
- [ ] No state imports in factory
- [ ] Factory properly typed

---

### **2. STRATEGY EXTRACTION CORRECTNESS**

#### **2.1 All Strategy Files Exist**

Check these files exist in packages/core/src/conversion/:
- [ ] `strategies/BaseStrategy.ts`
- [ ] `strategies/YouTubeStrategy.ts`
- [ ] `strategies/FacebookStrategy.ts`
- [ ] `strategies/TikTokStrategy.ts`
- [ ] `strategies/InstagramStrategy.ts`
- [ ] `strategies/TwitterStrategy.ts`
- [ ] `StrategyFactory.ts`
- [ ] `types/` directory
- [ ] `utils/` directory (if extracted)
- [ ] `index.ts` (barrel export)

#### **2.2 Code Extraction Quality**

**CRITICAL: Logic must be unchanged**

For each strategy, verify:
- [ ] Conversion logic copied EXACTLY from source
- [ ] Only state coupling removed (DI added)
- [ ] API calls unchanged
- [ ] Error handling unchanged
- [ ] Format validation unchanged
- [ ] URL parsing unchanged
- [ ] No "improvements" added
- [ ] No bug fixes mixed in

**How to verify:**
Compare extracted file with original:
```bash
# Compare logic (ignoring state coupling changes)
# Should be nearly identical except DI parts
diff packages/core/src/conversion/strategies/YouTubeStrategy.ts \
     apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/YouTubeStrategy.ts
```

**Acceptable differences:**
- StateUpdater usage instead of direct state imports
- Import paths changed
- Comments improved (optional)

**NOT acceptable:**
- Conversion logic changed
- API endpoints changed
- Error messages changed
- Validation rules changed

#### **2.3 BaseStrategy Abstract Class**

Verify BaseStrategy:
- [ ] Is abstract class
- [ ] Defines abstract methods for subclasses
- [ ] Contains common logic
- [ ] Uses StateUpdater for state updates
- [ ] No direct state imports
- [ ] Properly typed

#### **2.4 Platform-Specific Logic Preserved**

For each platform strategy:

**YouTubeStrategy:**
- [ ] Video ID extraction logic unchanged
- [ ] Format selection logic unchanged
- [ ] Quality mapping unchanged
- [ ] Playlist handling (if exists) unchanged

**FacebookStrategy:**
- [ ] URL parsing unchanged
- [ ] Video/Reel detection unchanged
- [ ] Quality selection unchanged

**TikTokStrategy:**
- [ ] Watermark handling unchanged
- [ ] URL parsing unchanged
- [ ] Video ID extraction unchanged

**InstagramStrategy:**
- [ ] Post/Reel/Story detection unchanged
- [ ] Multiple media handling unchanged
- [ ] URL parsing unchanged

**TwitterStrategy:**
- [ ] Tweet ID extraction unchanged
- [ ] Video detection unchanged
- [ ] Quality selection unchanged

---

### **3. TEST QUALITY (CRITICAL)**

#### **3.1 Test Coverage**

Check coverage report:
- [ ] Overall coverage ≥ 80%
- [ ] BaseStrategy coverage ≥ 80%
- [ ] YouTubeStrategy coverage ≥ 80%
- [ ] FacebookStrategy coverage ≥ 80%
- [ ] TikTokStrategy coverage ≥ 80%
- [ ] InstagramStrategy coverage ≥ 80%
- [ ] TwitterStrategy coverage ≥ 80%
- [ ] StrategyFactory coverage ≥ 90%

**Run:** `pnpm test:coverage` in packages/core

#### **3.2 StateUpdater Mocking**

Critical - tests must properly mock StateUpdater:
- [ ] StateUpdater is mocked in all strategy tests
- [ ] Mock tracks method calls
- [ ] Tests verify correct StateUpdater calls
- [ ] Tests verify correct parameters passed
- [ ] No real state used in package tests

**Check test files:**
- Look for mock implementation
- Verify expectations on mock calls
- Ensure state is fully decoupled

#### **3.3 API Mocking**

Tests must mock conversion API:
- [ ] API calls are mocked (no real network)
- [ ] Success responses mocked
- [ ] Error responses mocked
- [ ] Timeout scenarios mocked
- [ ] Different response formats mocked

#### **3.4 Per-Platform Test Comprehensiveness**

**YouTubeStrategy tests:**
- [ ] Valid URL conversion
- [ ] Invalid URL handling
- [ ] Multiple format support
- [ ] Quality selection
- [ ] Progress updates (via StateUpdater)
- [ ] Error handling
- [ ] API timeout handling

**FacebookStrategy tests:**
- [ ] Video URL conversion
- [ ] Reel URL conversion
- [ ] Invalid URL handling
- [ ] Error handling

**TikTokStrategy tests:**
- [ ] Standard URL conversion
- [ ] Watermark option handling
- [ ] Invalid URL handling
- [ ] Error handling

**InstagramStrategy tests:**
- [ ] Post with video
- [ ] Reel conversion
- [ ] Multiple media handling
- [ ] Error handling

**TwitterStrategy tests:**
- [ ] Tweet with video
- [ ] Video detection
- [ ] Invalid URL handling
- [ ] Error handling

#### **3.5 StrategyFactory Tests**

- [ ] Platform detection tested for all platforms
- [ ] Correct strategy returned per platform
- [ ] Unknown platform handling
- [ ] StateUpdater injection verified
- [ ] Factory creation tested

---

### **4. YTMP3-CLONE-4 MIGRATION**

#### **4.1 StateUpdater Implementation**

Check clone-4 implementation:
- [ ] StateUpdater interface implemented
- [ ] Implementation uses clone-4's state management
- [ ] All methods implemented correctly
- [ ] Implementation properly typed

**Location:**
- Find StateUpdater implementation in apps/ytmp3-clone-4/src/

**Verify:**
- Implementation matches interface
- State updates work correctly
- No missing methods

#### **4.2 Old Files Deleted**

Check these files are DELETED from clone-4:
- [ ] `apps/ytmp3-clone-4/src/features/downloader/logic/conversion/` (entire directory)
- [ ] All old strategy files removed
- [ ] Old factory removed

#### **4.3 New Imports Added**

Check imports updated:
- [ ] Imports from `@downloader/core/conversion`
- [ ] StrategyFactory imported from package
- [ ] Types imported from package
- [ ] No relative imports to old strategies

**Search:**
```bash
# Should find new imports
grep -r "@downloader/core/conversion" apps/ytmp3-clone-4/src/

# Should find NOTHING
grep -r "from.*'\.\..*strategies" apps/ytmp3-clone-4/src/
```

#### **4.4 Conversion Initialization**

Check how strategies are initialized:
- [ ] StrategyFactory imported from package
- [ ] StateUpdater implementation passed to factory
- [ ] Factory creates strategies correctly
- [ ] Strategies receive StateUpdater

---

### **5. BEHAVIOR VERIFICATION (CRITICAL)**

#### **5.1 Manual Testing Evidence**

Ask implementer for evidence:
- [ ] Screenshot/video of each platform working
- [ ] Test results document
- [ ] Comparison with clone-3

**Required testing evidence:**

**YouTube:**
- [ ] Video conversion tested
- [ ] Different formats tested
- [ ] Download works

**Facebook:**
- [ ] Video conversion tested
- [ ] Download works

**TikTok:**
- [ ] Video conversion tested
- [ ] Download works

**Instagram:**
- [ ] Post/Reel conversion tested
- [ ] Download works

**Twitter:**
- [ ] Tweet video conversion tested
- [ ] Download works

#### **5.2 Behavior Unchanged**

Compare clone-3 (original) vs clone-4 (migrated):
- [ ] Same conversion flow
- [ ] Same progress updates
- [ ] Same error messages
- [ ] Same success messages
- [ ] Same download behavior
- [ ] Same state updates

**Ask implementer:**
"Did you test the SAME URLs in both clone-3 and clone-4? Do they behave identically?"

#### **5.3 State Updates Correct**

Verify state updates in clone-4:
- [ ] Progress shows correctly during conversion
- [ ] Status updates correctly
- [ ] Results stored correctly
- [ ] Errors displayed correctly
- [ ] UI updates reflect state changes

#### **5.4 Error Handling Preserved**

Test error scenarios:
- [ ] Invalid URL → correct error message
- [ ] Network error → correct error handling
- [ ] API timeout → correct error handling
- [ ] Unsupported platform → correct error message
- [ ] All errors display in UI correctly

---

### **6. CODE QUALITY**

#### **6.1 No Logic Changes (CRITICAL)**

**CRITICAL CHECK:**

Verify NO conversion logic was changed:
- [ ] URL parsing logic identical
- [ ] Format validation identical
- [ ] API call logic identical
- [ ] Error handling identical
- [ ] Response parsing identical

**If ANY logic changed:**
- REQUEST CHANGES
- Ask for separate PR for logic changes
- This PR should only extract, not modify

#### **6.2 TypeScript Quality**

- [ ] No `any` types in strategies
- [ ] Proper interfaces for requests/responses
- [ ] StateUpdater properly typed
- [ ] Strategy factory properly typed
- [ ] Strict mode compliant
- [ ] No type errors

#### **6.3 Error Handling Quality**

- [ ] All errors caught appropriately
- [ ] Error messages clear and user-friendly
- [ ] Errors propagated through StateUpdater
- [ ] No silent failures
- [ ] Network errors handled
- [ ] Timeout errors handled

#### **6.4 Documentation**

- [ ] StateUpdater interface documented
- [ ] Each strategy has file-level comment
- [ ] Complex logic has comments
- [ ] README updated with conversion usage
- [ ] Migration guide exists (in PR description)

---

### **7. PACKAGE STRUCTURE**

#### **7.1 Package Organization**

Verify proper organization:
```
packages/core/src/conversion/
├── strategies/
│   ├── BaseStrategy.ts
│   ├── YouTubeStrategy.ts
│   ├── FacebookStrategy.ts
│   ├── TikTokStrategy.ts
│   ├── InstagramStrategy.ts
│   └── TwitterStrategy.ts
├── StrategyFactory.ts
├── types/
│   ├── conversion.types.ts
│   ├── strategy.types.ts
│   └── state-updater.types.ts
├── utils/ (if exists)
├── tests/
└── index.ts
```

#### **7.2 Package Exports**

Check `packages/core/src/conversion/index.ts`:
- [ ] Exports all strategies
- [ ] Exports StrategyFactory
- [ ] Exports types (StateUpdater, etc.)
- [ ] Exports utils (if any)
- [ ] Barrel export pattern

Check `packages/core/package.json`:
- [ ] Exports field includes conversion
- [ ] Can import from `@downloader/core/conversion`

#### **7.3 No Circular Dependencies**

- [ ] No circular imports
- [ ] Clean dependency graph
- [ ] Types in separate files
- [ ] No import loops

---

### **8. PHASE 3 SPECIFIC CONSTRAINTS**

Verify these constraints were followed:

#### **8.1 MUST NOT (Violations = Request Changes)**

- [ ] ❌ Did NOT import from state/ in package
- [ ] ❌ Did NOT change conversion logic
- [ ] ❌ Did NOT add new features
- [ ] ❌ Did NOT break existing functionality
- [ ] ❌ Did NOT modify other apps (besides clone-4)
- [ ] ❌ Did NOT skip Dependency Injection

#### **8.2 MUST (Missing = Request Changes)**

- [ ] ✅ DID implement Dependency Injection
- [ ] ✅ DID define StateUpdater interface
- [ ] ✅ DID extract all 6 strategies
- [ ] ✅ DID write comprehensive tests (80%+)
- [ ] ✅ DID test all 5 platforms manually
- [ ] ✅ DID verify behavior unchanged
- [ ] ✅ DID discuss architecture before coding

---

### **9. PERFORMANCE & OPTIMIZATION**

#### **9.1 No Performance Regression**

- [ ] Conversion speed similar to before
- [ ] No memory leaks
- [ ] State updates efficient
- [ ] No unnecessary re-renders (if applicable)

#### **9.2 Bundle Size**

- [ ] Package size reasonable
- [ ] No unnecessary dependencies
- [ ] Tree-shaking works
- [ ] Only needed code bundled

---

### **10. BACKWARD COMPATIBILITY**

#### **10.1 Other Apps Unchanged**

Verify only clone-4 modified:
- [ ] y2matepro NOT modified
- [ ] ytmp3-clone-3 NOT modified
- [ ] ytmp3-clone-darkmode-3 NOT modified
- [ ] y2mate-new-ux NOT modified

#### **10.2 API Compatibility**

- [ ] Conversion API calls unchanged
- [ ] Request format same
- [ ] Response parsing same
- [ ] Endpoints same

---

## 🚨 CRITICAL ISSUES (MUST FIX BEFORE APPROVE)

If you find ANY of these, REQUEST CHANGES immediately:

1. **State Imports in Package**
   - ANY import from state/ in packages/core/
   - This breaks the entire architecture
   - CRITICAL FAILURE

2. **Dependency Injection Not Implemented**
   - StateUpdater missing
   - Strategies don't accept StateUpdater
   - Still coupled to specific state

3. **Conversion Logic Changed**
   - Platform logic modified during extraction
   - API calls changed
   - Validation rules changed
   - Bug fixes mixed with extraction

4. **Platform Broken**
   - ANY platform not working in clone-4
   - Conversion fails
   - Download fails
   - State doesn't update

5. **Tests Insufficient**
   - Coverage < 80%
   - Platforms not tested
   - StateUpdater not properly mocked
   - API not mocked

6. **Behavior Changed**
   - Clone-4 behaves differently than clone-3
   - Different error messages
   - Different flow
   - Features broken

7. **Other Apps Modified**
   - Changes beyond clone-4
   - Breaking changes

---

## ⚠️ WARNINGS (Should Fix, Not Blocking)

These should be addressed but won't block merge:

1. **Documentation**
   - StateUpdater poorly documented
   - Migration guide incomplete
   - Strategy documentation missing

2. **Test Quality**
   - Tests passing but not comprehensive
   - Missing edge cases
   - Mock quality could be better

3. **Code Organization**
   - File organization could be cleaner
   - Some code could be extracted to utils
   - Naming could be clearer

4. **Type Safety**
   - Some `any` types
   - Types could be stricter
   - Missing type exports

---

## ✅ APPROVAL CRITERIA

Approve PR when:

- [ ] All critical checks passed
- [ ] Dependency Injection implemented correctly
- [ ] NO state/ imports in package
- [ ] All 6 strategies extracted
- [ ] StrategyFactory extracted
- [ ] Tests passing with 80%+ coverage
- [ ] All 5 platforms tested and working
- [ ] ytmp3-clone-4 behavior unchanged
- [ ] StateUpdater properly mocked in tests
- [ ] No breaking changes
- [ ] PR description complete

---

## 📝 REVIEW TEMPLATE

Use this template for your review:

```markdown
## Phase 3 Code Review

⚠️ **CRITICAL REVIEW - Core Business Logic**

### Summary
[Brief assessment - Approve/Request Changes/Comment]

**Verdict:** ✅ Approve | ⚠️ Approve with Comments | ❌ Request Changes

---

### Checklist Results

**Dependency Injection (✅/❌) - CRITICAL:**
- StateUpdater interface: [✅/❌]
- No state/ imports in package: [✅/❌]
- Strategies accept StateUpdater: [✅/❌]
- Factory injects StateUpdater: [✅/❌]

**Strategy Extraction (✅/❌):**
- All 6 strategies extracted: [✅/❌] ([X]/6 found)
- Logic unchanged: [✅/❌]
- BaseStrategy proper: [✅/❌]
- Platform logic preserved: [✅/❌]

**Tests (✅/❌):**
- Coverage: [X]% (target: 80%)
- StateUpdater mocked: [✅/❌]
- API mocked: [✅/❌]
- All platforms tested: [✅/❌] ([X]/5 platforms)

**Migration (✅/❌):**
- StateUpdater implemented: [✅/❌]
- Old files deleted: [✅/❌]
- Imports updated: [✅/❌]
- All platforms working: [✅/❌]

**Behavior Verification (✅/❌):**
- YouTube working: [✅/❌]
- Facebook working: [✅/❌]
- TikTok working: [✅/❌]
- Instagram working: [✅/❌]
- Twitter working: [✅/❌]
- Behavior unchanged: [✅/❌]

**Code Quality (✅/❌):**
- No logic changes: [✅/❌]
- TypeScript quality: [✅/❌]
- Error handling: [✅/❌]
- No violations: [✅/❌]

---

### Critical Issues (Must Fix)

[List any critical issues found, or write "None"]

1. [Issue with location and severity]
2. [Issue with location and severity]

---

### State Import Check Results

```bash
# Result of: grep -r "from.*state/" packages/core/src/conversion/
[Paste result here - should be empty]

# Result of: grep -r "import.*state" packages/core/src/conversion/
[Paste result here - should be empty]
```

**Status:** [✅ No state imports found | ❌ CRITICAL: State imports found]

---

### Platform Testing Results

| Platform | Tests Pass | Manual Test | Working | Notes |
|----------|-----------|-------------|---------|-------|
| YouTube | ✅/❌ | ✅/❌ | ✅/❌ | [Notes] |
| Facebook | ✅/❌ | ✅/❌ | ✅/❌ | [Notes] |
| TikTok | ✅/❌ | ✅/❌ | ✅/❌ | [Notes] |
| Instagram | ✅/❌ | ✅/❌ | ✅/❌ | [Notes] |
| Twitter | ✅/❌ | ✅/❌ | ✅/❌ | [Notes] |

---

### Dependency Injection Analysis

**StateUpdater Interface:**
- Location: [file path]
- Methods defined: [X]
- Well-designed: [✅/❌]
- Properly typed: [✅/❌]

**Usage in Strategies:**
- BaseStrategy: [How StateUpdater is used]
- Platform strategies: [How they inherit/use it]
- Properly decoupled: [✅/❌]

**Implementation in Clone-4:**
- Location: [file path]
- Methods implemented: [X]/[X]
- Correct implementation: [✅/❌]

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

**Automated tests:**
- [ ] `pnpm test` - [X] tests passing
- [ ] `pnpm test:coverage` - [Y]% coverage
- [ ] No state imports found in package

**Manual verification:**
- [ ] Reviewed StateUpdater interface design
- [ ] Checked all 6 strategy files
- [ ] Verified no logic changes
- [ ] Compared with original strategies
- [ ] Reviewed test comprehensiveness

**Clone-4 testing:**
- [ ] Tested YouTube conversion
- [ ] Tested Facebook conversion
- [ ] Tested TikTok conversion
- [ ] Tested Instagram conversion
- [ ] Tested Twitter conversion
- [ ] Verified error handling
- [ ] Compared with clone-3 behavior

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

**Risk assessment:** [Low/Medium/High - explain]

**Next steps:**
1. [Action for implementer]
2. [Action for implementer]
```

---

## 🎯 REMEMBER

**As Phase 3 Reviewer, you are checking:**
- ✅ Dependency Injection implemented correctly (CRITICAL)
- ✅ NO state/ imports in package (CRITICAL)
- ✅ All conversion logic preserved (CRITICAL)
- ✅ All platforms working (CRITICAL)
- ✅ Tests comprehensive
- ✅ Behavior unchanged

**This is THE MOST CRITICAL review:**
- Core business logic extracted
- Entire app functionality depends on this
- Future phases build on this foundation
- Bugs here affect all platforms in all apps

**Take your time. Test thoroughly. Do NOT approve with critical issues.**

---

**Review VERY carefully! This is the foundation of the entire refactor.** 🔍
