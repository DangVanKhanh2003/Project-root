# PHASE 3: EXTRACT CONVERSION LOGIC - AI IMPLEMENTATION PROMPT

> **Phase:** Extract Conversion Logic (Week 5-8)
> **Objective:** Extract platform conversion strategies to @downloader/core
> **Risk Level:** 🔴 HIGH - This is CRITICAL business logic
> **Prerequisites:** Phase 1 (utilities) and Phase 2 (i18n) complete

---

## ⚠️ CRITICAL: NO CODE IN THIS DOCUMENT

**This document contains:**
- ✅ File paths to read
- ✅ Instructions on WHAT to do
- ✅ Requirements and constraints
- ❌ NO CODE EXAMPLES

**You MUST:**
- Read actual code from project files
- Analyze conversion strategies deeply
- Understand Dependency Injection pattern
- Propose your own approach
- Discuss EXTENSIVELY before implementing

---

## 🚨 CRITICAL WARNING

**Phase 3 is the MOST CRITICAL phase:**
- Contains core business logic (conversion)
- Most complex code to extract (~5,000-8,000 lines)
- High risk of breaking functionality
- Requires deep understanding of state management
- Dependency Injection pattern is MANDATORY

**DO NOT rush this phase.**
**DO NOT skip the discussion phase.**
**DO NOT assume you understand without reading all code.**

---

## 📚 REQUIRED READING (MUST READ BEFORE DISCUSSION)

### **Critical Documents:**
1. `/docs/refactor/MASTER_REFACTOR_DOC.md` - READ DEPENDENCY INJECTION SECTION CAREFULLY
2. `/docs/refactor/README.md` - Workflow guidelines
3. `/docs/refactor/prompts/PHASE_1_EXTRACT_UTILITIES.md` - Previous patterns
4. `/docs/refactor/prompts/PHASE_2_I18N_SYSTEM.md` - I18n integration
5. `/CLAUDE.md` - Project guidelines

### **Critical Architecture Document:**
Read `/docs/refactor/MASTER_REFACTOR_DOC.md` section on:
- **Dependency Injection Pattern** (MANDATORY to understand)
- Why strategies CANNOT import from state/
- How to accept StateUpdater as parameter
- Why this is critical for separation

### **Code Files to Read and Analyze:**

**Base Strategy (READ THIS FIRST):**
- `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/BaseStrategy.ts`
  - Understand base class structure
  - Identify state dependencies
  - Find where state is used
  - See how to decouple

**Platform Strategies (READ ALL):**
- `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/YouTubeStrategy.ts`
- `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/FacebookStrategy.ts`
- `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/TikTokStrategy.ts`
- `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/InstagramStrategy.ts`
- `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/TwitterStrategy.ts`

**Strategy Factory:**
- `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/StrategyFactory.ts`
  - How strategies are instantiated
  - Platform detection logic

**Compare with other apps:**
- `/apps/y2matepro/src/features/downloader/logic/conversion/` (if exists)
- `/apps/ytmp3-clone-4/src/features/downloader/logic/conversion/`
- Other clone apps

**State Management (to understand what to AVOID):**
- `/apps/ytmp3-clone-3/src/state/` (entire directory)
- Understand how state is currently used
- Identify state update calls in strategies
- Find state read calls in strategies

**API Client/Service:**
- `/apps/ytmp3-clone-3/src/services/api-client.ts` (if exists)
- How conversion API is called
- Request/response formats

---

## 🎯 PHASE OBJECTIVES

### **Primary Goals:**

1. **Extract conversion strategies to packages/core/conversion:**
   - BaseStrategy (abstract base class)
   - YouTubeStrategy
   - FacebookStrategy
   - TikTokStrategy
   - InstagramStrategy
   - TwitterStrategy
   - StrategyFactory
   - Types/interfaces

2. **Implement Dependency Injection:**
   - Strategies accept StateUpdater as parameter
   - NO direct imports from state/
   - State-independent strategies
   - Flexible for different apps

3. **Extract shared conversion logic:**
   - Format validation
   - Link parsing
   - Error handling patterns
   - Response transformation

4. **Write comprehensive tests:**
   - Unit tests for each strategy
   - Mock state updates
   - Mock API calls
   - Test error cases
   - Target: 80%+ coverage

5. **Migrate ytmp3-clone-4:**
   - Update imports
   - Pass StateUpdater to strategies
   - Verify conversion flow works
   - Delete duplicate files

### **Success Criteria:**
- [ ] All strategies extracted to packages/core/conversion/
- [ ] Dependency Injection implemented correctly
- [ ] NO state/ imports in package code
- [ ] 80%+ test coverage
- [ ] All platforms' conversions tested
- [ ] ytmp3-clone-4 conversion flow works identically
- [ ] No breaking changes to behavior

---

## 🚫 CRITICAL CONSTRAINTS

### **MUST NOT:**
- ❌ Import from state/ in package code
- ❌ Hard-code state dependencies
- ❌ Change conversion logic during extraction
- ❌ Break existing conversion flow
- ❌ Change API request/response handling
- ❌ Skip Dependency Injection pattern
- ❌ Copy code from this document (there is no code here)

### **MUST:**
- ✅ Use Dependency Injection for state updates
- ✅ Accept StateUpdater as constructor/method parameter
- ✅ Copy code exactly as-is (only change state coupling)
- ✅ Write tests with mocked state
- ✅ Verify behavior unchanged
- ✅ Test ALL platforms (YouTube, Facebook, TikTok, Instagram, Twitter)
- ✅ Discuss architecture EXTENSIVELY before coding

---

## 🔑 DEPENDENCY INJECTION PATTERN (CRITICAL)

### **The Problem:**

Current code (in apps):
```
Strategy → directly imports state → hard-coded coupling
```

This prevents strategies from being in packages/core.

### **The Solution:**

Package code:
```
Strategy → accepts StateUpdater interface → no coupling
```

Apps provide the StateUpdater implementation.

### **What You Must Understand:**

Read the Dependency Injection section in MASTER_REFACTOR_DOC.md carefully.

**Before coding, you must:**
1. Identify ALL state update calls in current strategies
2. Identify ALL state read calls in current strategies
3. Design StateUpdater interface that covers all needs
4. Propose how strategies will receive StateUpdater
5. Show example of how app will provide StateUpdater

**In discussion phase, you must explain:**
- Where state is currently used in strategies
- What state updates are needed
- Your proposed StateUpdater interface
- How this maintains flexibility

---

## 📋 DETAILED TASKS

### **Task 1: Deep Analysis of Current Strategies**

**What to do:**

1. **Read ALL strategy files completely:**
   - BaseStrategy.ts
   - All 5 platform strategies
   - StrategyFactory.ts

2. **Document for EACH strategy:**
   - What state does it read?
   - What state does it update?
   - What external dependencies exist?
   - What API calls are made?
   - What error handling exists?

3. **Compare strategies across apps:**
   - Are they identical?
   - Any differences in logic?
   - Which version is most complete?

4. **Identify patterns:**
   - Common conversion flow
   - Common error patterns
   - Common state updates
   - Common API interactions

**Output required:**
- Detailed analysis document
- List of all state dependencies per strategy
- Proposed StateUpdater interface design
- List of any differences found
- Risk assessment

**⚠️ DO NOT proceed to Task 2 without completing this analysis.**

---

### **Task 2: Design StateUpdater Interface**

**Based on Task 1 analysis:**

**What to design:**

1. **StateUpdater interface:**
   - What methods are needed?
   - What parameters for each method?
   - How to handle errors?
   - How to handle progress updates?
   - How to handle conversion results?

2. **State independence:**
   - Ensure strategies don't need to know state structure
   - Use semantic method names
   - Provide only what's needed

3. **Flexibility:**
   - Must work for apps with different state management
   - Must work for y2matepro (no state layer)
   - Must support future apps

**Output required:**
- Proposed interface design
- Explanation of each method
- Example usage in strategy
- Example implementation in app

**⚠️ This MUST be discussed and approved before Task 3.**

---

### **Task 3: Extract BaseStrategy**

**Input:** `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/BaseStrategy.ts`

**Output location:** `/packages/core/src/conversion/strategies/BaseStrategy.ts`

**What to extract:**

1. **Read BaseStrategy carefully:**
   - Abstract base class structure
   - Common methods
   - State dependencies (FIND THEM ALL)
   - Utility methods

2. **Refactor for Dependency Injection:**
   - Remove state imports
   - Accept StateUpdater in constructor or methods
   - Update state access to use StateUpdater
   - Preserve all logic unchanged

3. **Preserve:**
   - All abstract methods
   - All common logic
   - All error handling
   - All helper methods

**Test file:** `/packages/core/src/conversion/strategies/BaseStrategy.test.ts`

**Test requirements:**
- Test common methods
- Mock StateUpdater
- Verify state updates called correctly
- Test error handling

**Validation:**
- No imports from state/
- Logic unchanged
- Tests pass

---

### **Task 4: Extract Platform Strategies**

**For EACH platform (YouTube, Facebook, TikTok, Instagram, Twitter):**

**Input:** `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/[Platform]Strategy.ts`

**Output location:** `/packages/core/src/conversion/strategies/[Platform]Strategy.ts`

**What to extract:**

1. **Read strategy file completely**
2. **Identify state dependencies**
3. **Refactor for Dependency Injection**
4. **Preserve conversion logic EXACTLY**
5. **Write comprehensive tests**

**Per-platform test requirements:**

**YouTubeStrategy:**
- [ ] Test URL validation
- [ ] Test video ID extraction
- [ ] Test conversion request
- [ ] Test format selection
- [ ] Test progress updates
- [ ] Test error handling (invalid URL, API error, timeout)

**FacebookStrategy:**
- [ ] Test URL validation
- [ ] Test video/reel detection
- [ ] Test conversion request
- [ ] Test quality selection
- [ ] Test error handling

**TikTokStrategy:**
- [ ] Test URL validation
- [ ] Test video ID extraction
- [ ] Test watermark/no-watermark options
- [ ] Test conversion request
- [ ] Test error handling

**InstagramStrategy:**
- [ ] Test URL validation
- [ ] Test post/reel/story detection
- [ ] Test conversion request
- [ ] Test multiple media handling
- [ ] Test error handling

**TwitterStrategy:**
- [ ] Test URL validation
- [ ] Test tweet ID extraction
- [ ] Test video detection
- [ ] Test conversion request
- [ ] Test error handling

**Validation for each:**
- [ ] No state/ imports
- [ ] Logic unchanged
- [ ] Tests pass
- [ ] 80%+ coverage
- [ ] StateUpdater used correctly

---

### **Task 5: Extract StrategyFactory**

**Input:** `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/StrategyFactory.ts`

**Output location:** `/packages/core/src/conversion/StrategyFactory.ts`

**What to extract:**

1. **Platform detection logic:**
   - URL pattern matching
   - Platform identification
   - Error handling for unknown platforms

2. **Strategy instantiation:**
   - Factory method pattern
   - Strategy registration
   - Dependency injection to strategies

3. **Refactor for DI:**
   - Factory accepts StateUpdater
   - Passes StateUpdater to strategies
   - No state imports

**Test file:** `/packages/core/src/conversion/StrategyFactory.test.ts`

**Test requirements:**
- Test platform detection for each platform
- Test strategy instantiation
- Test unknown platform handling
- Test StateUpdater passed to strategies
- Mock each strategy

**Validation:**
- Correctly detects all platforms
- Returns correct strategy instances
- StateUpdater injected properly
- Tests pass

---

### **Task 6: Extract Conversion Types**

**Input:** Find type definitions across strategy files

**Output location:** `/packages/core/src/conversion/types/`

**What to extract:**

1. **Conversion request types:**
   - ConversionRequest
   - Format types
   - Quality types
   - Platform-specific options

2. **Conversion response types:**
   - ConversionResult
   - DownloadLink
   - Error types
   - Progress types

3. **StateUpdater interface:**
   - From Task 2 design

4. **Strategy interfaces:**
   - IStrategy
   - IStrategyFactory

**File organization:**
```
types/
├── conversion.types.ts
├── strategy.types.ts
├── state-updater.types.ts
└── index.ts (barrel export)
```

**Validation:**
- All types exported
- TypeScript compiles
- No circular dependencies

---

### **Task 7: Extract Shared Conversion Logic**

**What to find and extract:**

1. **Format validation:**
   - Valid formats per platform
   - Quality level validation
   - Format compatibility checks

2. **Link parsing:**
   - URL normalization
   - Parameter extraction
   - Validation utilities

3. **Error handling:**
   - Error classification
   - Error message formatting
   - Retry logic (if exists)

4. **Response transformation:**
   - API response parsing
   - Data normalization
   - Link expiry handling

**Output location:** `/packages/core/src/conversion/utils/`

**Validation:**
- Utilities tested
- No state dependencies
- Reusable across strategies

---

### **Task 8: Write Comprehensive Tests**

**Test structure:**

```
tests/
├── strategies/
│   ├── BaseStrategy.test.ts
│   ├── YouTubeStrategy.test.ts
│   ├── FacebookStrategy.test.ts
│   ├── TikTokStrategy.test.ts
│   ├── InstagramStrategy.test.ts
│   └── TwitterStrategy.test.ts
├── StrategyFactory.test.ts
└── utils/
    └── [utility tests]
```

**Mock requirements:**

1. **Mock StateUpdater:**
   - Track all update calls
   - Verify correct parameters
   - Allow state read mocking

2. **Mock API calls:**
   - Mock conversion API
   - Mock success responses
   - Mock error responses
   - Mock timeouts

3. **Mock utilities:**
   - Mock from @downloader/core/utils
   - Focus on testing strategy logic

**Coverage requirements:**
- Overall: 80%+
- Each strategy: 80%+
- StrategyFactory: 90%+
- Utils: 80%+

**Run:**
- `pnpm test`
- `pnpm test:coverage`

---

### **Task 9: Update Package Exports**

**Files to create/update:**

1. `/packages/core/src/conversion/index.ts`
   - Export all strategies
   - Export StrategyFactory
   - Export types
   - Export utils

2. `/packages/core/package.json`
   - Update exports field
   - Add conversion entry point
   - Ensure proper tree-shaking

3. `/packages/core/README.md`
   - Update with conversion usage
   - Document StateUpdater pattern
   - Reference actual code files

**Verify exports:**
- Can import strategies from `@downloader/core/conversion`
- Can import factory from `@downloader/core/conversion`
- Can import types from `@downloader/core/conversion/types`
- TypeScript autocomplete works

---

### **Task 10: Migrate ytmp3-clone-4**

**This is the CRITICAL validation step.**

**Why ytmp3-clone-4:**
- Test app (safe)
- Has full conversion flow
- Can verify behavior unchanged

**Steps:**

1. **Add dependency:**
   - Update `apps/ytmp3-clone-4/package.json`
   - Add `@downloader/core` dependency (already added in Phase 1, but verify)
   - Run `pnpm install`

2. **Create StateUpdater implementation:**
   - Implement StateUpdater interface
   - Use app's state management
   - Provide all required methods

3. **Update conversion initialization:**
   - Import StrategyFactory from package
   - Instantiate with StateUpdater
   - Replace old factory usage

4. **Update imports:**
   - Remove local strategy imports
   - Import from `@downloader/core/conversion`

5. **Delete old files:**
   - Delete `apps/ytmp3-clone-4/src/features/downloader/logic/conversion/`
   - Delete all strategy files
   - Keep app-specific state management

6. **Test EVERY platform:**
   - YouTube conversion
   - Facebook conversion
   - TikTok conversion
   - Instagram conversion
   - Twitter conversion

**Validation checklist:**
- [ ] App builds without errors
- [ ] YouTube conversion works
- [ ] Facebook conversion works
- [ ] TikTok conversion works
- [ ] Instagram conversion works
- [ ] Twitter conversion works
- [ ] State updates correctly
- [ ] Progress updates shown
- [ ] Error handling works
- [ ] Download links valid
- [ ] Behavior identical to before
- [ ] No console errors

---

## 🔄 WORKFLOW FOR THIS PHASE

### **Step 1: EXTENDED DISCUSSION PHASE (MANDATORY)**

**⚠️ Phase 3 requires EXTENSIVE discussion. Do NOT rush.**

Send message to human:

```
I'm starting Phase 3: Extract Conversion Logic

⚠️ THIS IS THE CRITICAL PHASE - Contains core business logic

Documents read:
- ✅ MASTER_REFACTOR_DOC.md (including Dependency Injection section)
- ✅ README.md
- ✅ PHASE_3_EXTRACT_CONVERSION.md

Code files analyzed:
- ✅ BaseStrategy.ts ([X] lines)
- ✅ YouTubeStrategy.ts ([X] lines)
- ✅ FacebookStrategy.ts ([X] lines)
- ✅ TikTokStrategy.ts ([X] lines)
- ✅ InstagramStrategy.ts ([X] lines)
- ✅ TwitterStrategy.ts ([X] lines)
- ✅ StrategyFactory.ts ([X] lines)
- ✅ State management files (to understand coupling)

DEPENDENCY ANALYSIS (CRITICAL):

Current state dependencies found:
1. BaseStrategy:
   - Imports: [list imports from state/]
   - State reads: [list where state is read]
   - State updates: [list where state is updated]

2. YouTubeStrategy:
   - State updates: [list]
   - [repeat for each strategy]

3. [Continue for all strategies...]

PROPOSED DEPENDENCY INJECTION DESIGN:

StateUpdater interface needed:
```typescript
interface StateUpdater {
  // Method 1: [purpose]
  // Method 2: [purpose]
  // ... (describe in plain text, NO code)
}
```

How strategies will use it:
- Constructor injection: Strategy receives StateUpdater
- Method calls: Use StateUpdater.methodName() instead of state.update()
- [Explain your approach]

How apps will provide it:
- Clone-4: Implement using existing state management
- y2matepro: Implement differently (explain how)
- [Explain implementation]

COMPARISON RESULTS:

Strategy files across apps:
- BaseStrategy: [Identical/Different across apps]
- YouTubeStrategy: [Identical/Different]
- [etc for each]

[If different, explain differences and which version to use]

CONVERSION FLOW ANALYSIS:

Current flow:
1. User enters URL
2. [Describe current flow step by step]
3. Strategy processes
4. [Continue...]

After extraction:
1. [Describe how flow will work]
2. [Show StateUpdater is injected]
3. [Continue...]

RISKS IDENTIFIED:

1. **State coupling risk:**
   - Current: [X] state update calls across strategies
   - Risk: Missing any state dependency breaks app
   - Mitigation: [Your plan]

2. **Conversion logic risk:**
   - Risk: Accidentally changing logic during extraction
   - Mitigation: [Your plan]

3. **Platform-specific risk:**
   - Each platform has unique logic
   - Risk: Breaking any platform conversion
   - Mitigation: [Your plan]

4. [Other risks you identified]

QUESTIONS BEFORE PROCEEDING:

1. StateUpdater interface design - Is my proposal correct?
2. Should StateUpdater be passed in constructor or methods?
3. [Your other questions]

PROPOSED IMPLEMENTATION ORDER:

1. Design and approve StateUpdater interface
2. Extract BaseStrategy with DI
3. Extract YouTubeStrategy (test DI pattern)
4. Extract remaining strategies
5. Extract StrategyFactory
6. Migrate clone-4 and test EXTENSIVELY
7. Verify all platforms work

ESTIMATED EFFORT:

This is the largest phase:
- ~5,000-8,000 lines to extract
- 6 strategy files + factory
- Complex state decoupling
- Extensive testing needed

ETA: [Your estimate - likely 2-3 weeks]

⚠️ I will NOT proceed until you approve:
1. StateUpdater interface design
2. Dependency Injection approach
3. Implementation plan
4. Risk mitigation strategy

Awaiting your approval.
```

**⚠️ WAIT FOR APPROVAL. DO NOT SKIP THIS.**

---

### **Step 2: IMPLEMENTATION PHASE**

Only after approval:

1. Create branch: `refactor/phase-3-extract-conversion`

2. Implement tasks in order:
   - Task 1: Analysis ✓ (done in discussion)
   - Task 2: Design StateUpdater ✓ (approved)
   - Task 3: Extract BaseStrategy
   - Task 4: Extract platform strategies (one by one)
   - Task 5: Extract StrategyFactory
   - Task 6: Extract types
   - Task 7: Extract utils
   - Task 8: Write tests
   - Task 9: Package exports
   - Task 10: Migrate clone-4

3. For each strategy:
   - Extract code
   - Refactor for DI
   - Write tests
   - Verify tests pass
   - Check coverage

4. **Progress updates:**
   Send updates after each strategy is complete.

---

### **Step 3: EXTENSIVE VERIFICATION PHASE**

**⚠️ This phase requires thorough testing - DO NOT rush.**

**Automated tests:**
- `pnpm test` - All tests passing
- `pnpm test:coverage` - 80%+ coverage
- `pnpm test:watch` - Run during development

**Manual testing (CRITICAL):**

Test EVERY platform in ytmp3-clone-4:

**YouTube:**
- [ ] Standard video URL
- [ ] Short URL (youtu.be)
- [ ] Playlist URL
- [ ] Video with age restriction
- [ ] Long video (> 1 hour)
- [ ] Different formats (mp4, mp3, webm)
- [ ] Different qualities (1080p, 720p, 480p, audio)

**Facebook:**
- [ ] Public video URL
- [ ] Reel URL
- [ ] Different qualities

**TikTok:**
- [ ] Standard video URL
- [ ] With watermark
- [ ] Without watermark

**Instagram:**
- [ ] Post with video
- [ ] Reel URL
- [ ] Story URL (if supported)

**Twitter:**
- [ ] Tweet with video
- [ ] Different qualities

**For each test:**
- [ ] Conversion starts
- [ ] Progress updates shown
- [ ] Conversion completes
- [ ] Download link valid
- [ ] Download works
- [ ] No console errors
- [ ] State updates correctly

**Comparison testing:**
- [ ] Test same URLs in clone-3 (original)
- [ ] Test same URLs in clone-4 (migrated)
- [ ] Verify identical behavior
- [ ] Verify same error messages
- [ ] Verify same success flow

**Error testing:**
- [ ] Invalid URL
- [ ] Unsupported platform
- [ ] Network error (disconnect during conversion)
- [ ] API timeout
- [ ] Rate limit error
- [ ] Verify error messages correct
- [ ] Verify state updates on error

---

### **Step 4: REVIEW PHASE**

**Create PR with:**

Title: `[Phase 3] Extract conversion strategies with Dependency Injection`

Description:
```markdown
## Phase 3: Extract Conversion Logic

⚠️ **CRITICAL PHASE - Core business logic**

### Summary
Extracted all conversion strategies to packages/core/conversion/ with Dependency Injection pattern for state independence.

### Changes
- ✅ Created packages/core/src/conversion/ package
- ✅ Implemented Dependency Injection pattern (StateUpdater)
- ✅ Extracted BaseStrategy with DI
- ✅ Extracted YouTubeStrategy
- ✅ Extracted FacebookStrategy
- ✅ Extracted TikTokStrategy
- ✅ Extracted InstagramStrategy
- ✅ Extracted TwitterStrategy
- ✅ Extracted StrategyFactory
- ✅ Extracted types and utils
- ✅ Migrated ytmp3-clone-4
- ✅ Written [X] unit tests
- ✅ Achieved [X]% test coverage

### Dependency Injection Pattern

**StateUpdater interface:**
[Describe the interface and its purpose]

**Why:**
- Strategies no longer import from state/
- Works with any state management
- Enables use in packages/core
- Flexible for different apps

**Implementation:**
- Apps implement StateUpdater interface
- Pass to StrategyFactory
- Factory injects into strategies
- Strategies use interface to update state

### Test Results
- Unit tests: [X] passing
- Coverage: [X]%
- Manual testing: ✅ All platforms working

### Platform Testing Results

| Platform | Tested | Working | Notes |
|----------|--------|---------|-------|
| YouTube | ✅ | ✅ | All formats tested |
| Facebook | ✅ | ✅ | Video & Reel tested |
| TikTok | ✅ | ✅ | With/without watermark |
| Instagram | ✅ | ✅ | Post & Reel tested |
| Twitter | ✅ | ✅ | Video tested |

### Verification
- clone-3 (original): ✅ Working
- clone-4 (migrated): ✅ Working identically
- All platforms: ✅ Tested thoroughly
- State updates: ✅ Correct
- Error handling: ✅ Preserved

### Files Changed

**Added:**
- packages/core/src/conversion/strategies/ (6 files, ~[X] lines)
- packages/core/src/conversion/StrategyFactory.ts
- packages/core/src/conversion/types/
- packages/core/src/conversion/utils/
- packages/core/src/conversion/tests/ ([X] tests)

**Modified:**
- apps/ytmp3-clone-4/src/ (StateUpdater implementation)
- apps/ytmp3-clone-4/src/ (updated imports)

**Deleted:**
- apps/ytmp3-clone-4/src/features/downloader/logic/conversion/ (entire directory)

### Lines Extracted
- Total: ~[X] lines
- Strategies: ~[X] lines
- Tests: ~[X] lines
- Types/Utils: ~[X] lines

### Next Steps
Ready for Phase 4: UI Components
```

Submit for review (AI Reviewer + Human)

---

## ✅ DEFINITION OF DONE

Phase 3 is complete when:

- [ ] All 6 strategies extracted to packages/core/conversion/
- [ ] Dependency Injection implemented correctly
- [ ] StateUpdater interface defined and used
- [ ] NO imports from state/ in package code
- [ ] StrategyFactory extracted
- [ ] Types and utils extracted
- [ ] 80%+ test coverage achieved
- [ ] All tests passing
- [ ] ytmp3-clone-4 migrated successfully
- [ ] All 5 platforms tested and working in clone-4
- [ ] Behavior identical to original (clone-3)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] PR created with complete description
- [ ] PR approved by reviewers
- [ ] Code merged to main branch
- [ ] Progress updated in MASTER_REFACTOR_DOC.md

---

## 🆘 TROUBLESHOOTING

### **If Dependency Injection is confusing:**

**DO NOT proceed blindly.**

1. Re-read MASTER_REFACTOR_DOC.md DI section
2. Ask human for clarification
3. Show your understanding with examples
4. Get approval before coding

### **If state dependencies are complex:**

1. Document ALL state usages
2. Map each to StateUpdater method
3. Verify nothing is missed
4. Test with mocks extensively

### **If conversion breaks after extraction:**

**This is CRITICAL - debug immediately:**

1. Compare old vs new strategy side-by-side
2. Check if logic was accidentally changed
3. Verify StateUpdater calls are correct
4. Check API requests unchanged
5. Test with console.log to trace flow

### **If a platform stops working:**

1. Test that platform in clone-3 (original)
2. Compare behavior in clone-4 (migrated)
3. Check strategy logic unchanged
4. Verify API calls identical
5. Check error handling

### **If tests are hard to write:**

1. Start with simple happy path
2. Mock StateUpdater
3. Mock API responses
4. Gradually add edge cases
5. Aim for coverage, not perfection

---

## 📞 COMMUNICATION TEMPLATES

### **At Start:**
Use extended template from Step 1 above.

### **Progress Update (send after EACH strategy):**
```
Phase 3 Progress Update:

Completed:
- ✅ Task 1: Analysis and DI design approved
- ✅ Task 3: BaseStrategy extracted ([X] lines, [Y] tests, [Z]% coverage)
- ✅ Task 4.1: YouTubeStrategy extracted ([X] lines, [Y] tests, [Z]% coverage)
- ✅ Task 4.2: FacebookStrategy extracted ([X] lines, [Y] tests, [Z]% coverage)

In Progress:
- 🟡 Task 4.3: TikTokStrategy (writing tests)

Pending:
- ⏳ Task 4.4: InstagramStrategy
- ⏳ Task 4.5: TwitterStrategy
- ⏳ Task 5: StrategyFactory
- ⏳ Tasks 6-10

Status:
- Tests passing: [X]/[total]
- Coverage: [X]%
- Issues found: [None / List issues]

ETA for completion: [Date]
```

### **When stuck:**
```
Phase 3 - Need Guidance:

I'm stuck on: [Specific issue]

What I've tried:
1. [Attempt 1]
2. [Attempt 2]

Current understanding:
[Explain your understanding]

Question:
[Specific question]

Should I:
A. [Option A]
B. [Option B]
C. Something else?
```

### **At Completion:**
```
Phase 3 Complete! 🎉

⚠️ This was the CRITICAL phase - please review carefully.

Summary:
- Extracted all 6 strategies (~[X] lines)
- Implemented Dependency Injection
- NO state/ imports in package
- Written [Y] tests
- Achieved [Z]% coverage
- All tests passing
- All 5 platforms tested and working

Dependency Injection Implementation:
- StateUpdater interface: [X] methods
- Apps provide implementation
- Strategies remain state-independent

Platform Testing:
- YouTube: ✅ [X] test cases
- Facebook: ✅ [X] test cases
- TikTok: ✅ [X] test cases
- Instagram: ✅ [X] test cases
- Twitter: ✅ [X] test cases

Verification:
- Clone-3 vs Clone-4: ✅ Identical behavior
- All conversions: ✅ Working
- Error handling: ✅ Preserved
- State updates: ✅ Correct

PR: [link]
Ready for thorough review.
```

---

## 🎓 TIPS FOR SUCCESS

### **Understanding Dependency Injection:**
- Read the pattern explanation carefully
- Think about "what" not "how"
- Strategies should not know about state structure
- StateUpdater is a contract, not implementation

### **When extracting strategies:**
- Extract ONE strategy at a time
- Test each before moving to next
- Don't batch - validate incrementally
- Compare with original frequently

### **When writing tests:**
- Mock StateUpdater thoroughly
- Verify all update calls
- Test with different platforms
- Test error cases
- Use descriptive test names

### **When migrating clone-4:**
- Implement StateUpdater carefully
- Test EVERY platform manually
- Compare with clone-3 behavior
- Don't assume it works - verify!

### **Avoiding mistakes:**
- ❌ Don't change logic "while you're at it"
- ❌ Don't add features during extraction
- ❌ Don't skip testing any platform
- ❌ Don't ignore small behavioral differences
- ✅ Extract exactly, test thoroughly

---

## 📊 EXPECTED METRICS

**After Phase 3:**
- Lines extracted: ~5,000-8,000 lines
- Strategy files: 6 strategies + factory
- Tests written: ~80-100 tests
- Coverage: 80-90%
- Apps migrated: 1 (ytmp3-clone-4)
- Platforms tested: 5 (YouTube, Facebook, TikTok, Instagram, Twitter)
- State dependencies removed: 100%

---

**Ready to start Phase 3! This is CRITICAL - take your time, discuss extensively, test thoroughly.** 🚀

**Remember: READ → ANALYZE DEEPLY → DISCUSS EXTENSIVELY → APPROVE → CODE CAREFULLY → TEST THOROUGHLY**
