# PHASE 3: EXTRACT CONVERSION LOGIC - AI IMPLEMENTATION PROMPT

> **Phase:** Extract Conversion Logic (Week 5-8)
> **Objective:** Extract YouTube conversion strategies to @downloader/core
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
- Contains core business logic (YouTube conversion)
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

**Conversion Strategy Interface:**
- `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/IConversionStrategy.ts`
  - Understand interface contract
  - See StrategyContext structure
  - See StrategyResult structure

**Base Strategy (READ THIS FIRST):**
- `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/BaseStrategy.ts`
  - Understand base class structure
  - Identify state dependencies (imports from state/)
  - Find where state is used
  - See updateConversionTask calls
  - Understand how to decouple

**YouTube Conversion Strategies (READ ALL):**
- `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/PollingStrategy.ts`
  - Complex polling-based conversion
  - Progress mapping logic
  - Multiple phases (initial, processing, merging)

- `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/StaticDirectStrategy.ts`
  - Direct download strategy
  - Simpler flow

- `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/OtherStreamStrategy.ts`
  - Alternative stream handling

- `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/IOSRamStrategy.ts`
  - iOS-specific handling
  - RAM-based conversion

**Strategy Factory:**
- `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/StrategyFactory.ts`
  - How strategies are selected
  - Platform/format detection logic

**Supporting Components:**
- `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/polling-progress-mapper.ts`
  - Progress calculation logic
  - Phase detection

- `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/types.ts`
  - Type definitions
  - TaskState enum
  - Format types

**Concurrent Polling Manager:**
- `/apps/ytmp3-clone-3/src/features/downloader/logic/concurrent-polling.ts`
  - Polling orchestration
  - May need extraction

**Compare with other apps:**
- `/apps/y2matepro/src/features/downloader/logic/conversion/` (if exists)
- `/apps/ytmp3-clone-4/src/features/downloader/logic/conversion/`
- Other clone apps

**State Management (to understand what to AVOID):**
- `/apps/ytmp3-clone-3/src/state/` (entire directory)
- Find `conversion-state.ts`
- Understand updateConversionTask function
- Identify state update calls in strategies

---

## 🎯 PHASE OBJECTIVES

### **Primary Goals:**

1. **Extract conversion strategies to packages/core/conversion:**
   - IConversionStrategy (interface)
   - BaseStrategy (abstract base class)
   - PollingStrategy
   - StaticDirectStrategy
   - OtherStreamStrategy
   - IOSRamStrategy
   - StrategyFactory
   - Types/interfaces
   - Supporting utilities (PollingProgressMapper, etc.)

2. **Implement Dependency Injection:**
   - Strategies accept StateUpdater as parameter
   - NO direct imports from state/
   - State-independent strategies
   - Flexible for different apps

3. **Extract shared conversion logic:**
   - Progress calculation (PollingProgressMapper)
   - Concurrent polling manager
   - Format validation
   - Error handling patterns

4. **Write comprehensive tests:**
   - Unit tests for each strategy
   - Mock state updates
   - Mock polling API
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
- [ ] All conversion types tested (polling, static, iOS)
- [ ] ytmp3-clone-4 conversion flow works identically
- [ ] No breaking changes to behavior

---

## 🚫 CRITICAL CONSTRAINTS

### **MUST NOT:**
- ❌ Import from state/ in package code
- ❌ Hard-code state dependencies
- ❌ Change conversion logic during extraction
- ❌ Break existing conversion flow
- ❌ Change progress calculation logic
- ❌ Skip Dependency Injection pattern
- ❌ Copy code from this document (there is no code here)

### **MUST:**
- ✅ Use Dependency Injection for state updates
- ✅ Accept StateUpdater as constructor/method parameter
- ✅ Copy code exactly as-is (only change state coupling)
- ✅ Write tests with mocked state
- ✅ Verify behavior unchanged
- ✅ Test ALL conversion strategies
- ✅ Discuss architecture EXTENSIVELY before coding

---

## 🔑 DEPENDENCY INJECTION PATTERN (CRITICAL)

### **The Problem:**

Current code (in apps):
```
Strategy → directly imports updateConversionTask from state/ → hard-coded coupling
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
1. Identify ALL updateConversionTask calls in current strategies
2. Identify ALL state reads in current strategies (if any)
3. Design StateUpdater interface that covers all needs
4. Propose how strategies will receive StateUpdater
5. Show example of how app will provide StateUpdater

**In discussion phase, you must explain:**
- Where updateConversionTask is currently called
- What parameters are passed
- Your proposed StateUpdater interface
- How this maintains flexibility

---

## 📋 DETAILED TASKS

### **Task 1: Deep Analysis of Current Strategies**

**What to do:**

1. **Read ALL strategy files completely:**
   - IConversionStrategy.ts
   - BaseStrategy.ts
   - All 4 conversion strategies
   - StrategyFactory.ts
   - PollingProgressMapper.ts
   - concurrent-polling.ts

2. **Document for EACH strategy:**
   - What state does it update? (find updateConversionTask calls)
   - What parameters are passed to updateConversionTask?
   - What external dependencies exist?
   - What polling/API logic exists?
   - What progress calculation logic exists?

3. **Compare strategies across apps:**
   - Are they identical?
   - Any differences in logic?
   - Which version is most complete?

4. **Identify patterns:**
   - Common conversion flow
   - Common state update patterns
   - Common progress handling
   - Common error handling

**Output required:**
- Detailed analysis document
- List of all updateConversionTask calls per strategy
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
   - Based on updateConversionTask parameters
   - How to handle progress updates?
   - How to handle state changes (POLLING, SUCCESS, FAILED)?
   - How to handle status text updates?

2. **State independence:**
   - Ensure strategies don't need to know state structure
   - Use semantic method names
   - Provide only what's needed

3. **Flexibility:**
   - Must work for apps with different state management
   - Must work for y2matepro (no state layer)
   - Must support future apps

**Example questions to answer:**
- Does updateConversionTask accept formatId + update object?
- What fields are in the update object?
- Should StateUpdater have one method or multiple?

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
   - Helper methods (markSuccess, markFailed, etc.)
   - State dependencies (FIND THEM ALL)
   - updateConversionTask calls

2. **Refactor for Dependency Injection:**
   - Remove import from 'state/conversion-state'
   - Accept StateUpdater in constructor
   - Update updateTask method to use StateUpdater
   - Preserve all logic unchanged

3. **Preserve:**
   - All abstract methods
   - All helper methods
   - All error handling
   - All abort handling

**Test file:** `/packages/core/src/conversion/strategies/BaseStrategy.test.ts`

**Test requirements:**
- Test helper methods
- Mock StateUpdater
- Verify state updates called correctly
- Test abort handling

**Validation:**
- No imports from state/
- Logic unchanged
- Tests pass

---

### **Task 4: Extract Conversion Strategies**

**For EACH strategy:**

#### **Task 4.1: PollingStrategy** (MOST COMPLEX)

**Input:** `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/PollingStrategy.ts`

**Output location:** `/packages/core/src/conversion/strategies/PollingStrategy.ts`

**Special considerations:**
- This is the MOST COMPLEX strategy
- Has multi-phase progress (initial animation, processing, merging)
- Uses PollingProgressMapper
- Uses concurrent polling manager
- Many updateConversionTask calls

**What to extract:**
1. Read entire file (600+ lines)
2. Identify ALL updateConversionTask calls
3. Refactor for Dependency Injection
4. Preserve progress calculation logic EXACTLY
5. Preserve phase transitions EXACTLY
6. Preserve fake progress logic

**Dependencies:**
- Needs PollingProgressMapper (Task 6)
- Needs concurrent polling manager (Task 7)

**Test requirements:**
- [ ] Test initial animation (0→5%)
- [ ] Test no_download handling
- [ ] Test real progress updates
- [ ] Test fake progress when stuck
- [ ] Test merging phase transition
- [ ] Test status rotation
- [ ] Test completion handling
- [ ] Test abort handling
- [ ] Mock StateUpdater
- [ ] Mock polling manager

**Validation:**
- No state/ imports
- Progress logic unchanged
- Phase transitions unchanged
- Tests pass
- 80%+ coverage

---

#### **Task 4.2: StaticDirectStrategy**

**Input:** `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/StaticDirectStrategy.ts`

**Output location:** `/packages/core/src/conversion/strategies/StaticDirectStrategy.ts`

**Test requirements:**
- [ ] Test direct conversion flow
- [ ] Test progress updates
- [ ] Test error handling
- [ ] Mock StateUpdater

---

#### **Task 4.3: OtherStreamStrategy**

**Input:** `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/OtherStreamStrategy.ts`

**Output location:** `/packages/core/src/conversion/strategies/OtherStreamStrategy.ts`

**Test requirements:**
- [ ] Test stream handling
- [ ] Test error handling
- [ ] Mock StateUpdater

---

#### **Task 4.4: IOSRamStrategy**

**Input:** `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/IOSRamStrategy.ts`

**Output location:** `/packages/core/src/conversion/strategies/IOSRamStrategy.ts`

**Test requirements:**
- [ ] Test iOS-specific handling
- [ ] Test RAM conversion
- [ ] Test error handling
- [ ] Mock StateUpdater

---

### **Task 5: Extract StrategyFactory**

**Input:** `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/StrategyFactory.ts`

**Output location:** `/packages/core/src/conversion/StrategyFactory.ts`

**What to extract:**

1. **Strategy selection logic:**
   - Format/platform detection
   - Strategy instantiation
   - Dependency injection to strategies

2. **Refactor for DI:**
   - Factory accepts StateUpdater
   - Passes StateUpdater to strategies
   - No state imports

**Test file:** `/packages/core/src/conversion/StrategyFactory.test.ts`

**Test requirements:**
- Test strategy selection for each format/case
- Test strategy instantiation
- Test StateUpdater passed to strategies
- Mock each strategy

---

### **Task 6: Extract PollingProgressMapper**

**Input:** `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/polling-progress-mapper.ts`

**Output location:** `/packages/core/src/conversion/utils/PollingProgressMapper.ts`

**What to extract:**
- Progress calculation logic
- Phase detection (processing, merging)
- Status text generation
- Format-specific calculations

**Test requirements:**
- Test progress mapping for different scenarios
- Test phase detection
- Test status text generation
- Edge cases (0%, 100%, etc.)

---

### **Task 7: Extract Concurrent Polling Manager**

**Input:** `/apps/ytmp3-clone-3/src/features/downloader/logic/concurrent-polling.ts`

**Output location:** `/packages/core/src/conversion/utils/concurrent-polling.ts` (or keep in app?)

**Decision needed:**
- Should this be in core package?
- Or stay app-specific?
- Discuss in planning phase

**If extracting:**
- Remove any state dependencies
- Test polling orchestration
- Test multiple concurrent polls

---

### **Task 8: Extract Conversion Types**

**Input:** `/apps/ytmp3-clone-3/src/features/downloader/logic/conversion/types.ts`

**Output location:** `/packages/core/src/conversion/types/`

**What to extract:**

1. **Strategy types:**
   - IConversionStrategy
   - StrategyContext
   - StrategyResult

2. **Task types:**
   - TaskState enum
   - ConversionTask (if needed)

3. **Format types:**
   - FormatData
   - ExtractResult

4. **StateUpdater interface:**
   - From Task 2 design

**File organization:**
```
types/
├── strategy.types.ts
├── task.types.ts
├── format.types.ts
├── state-updater.types.ts
└── index.ts (barrel export)
```

---

### **Task 9: Update Package Exports**

**Files to create/update:**

1. `/packages/core/src/conversion/index.ts`
   - Export all strategies
   - Export StrategyFactory
   - Export types
   - Export utils (PollingProgressMapper, etc.)

2. `/packages/core/package.json`
   - Update exports field
   - Add conversion entry point

3. `/packages/core/README.md`
   - Update with conversion usage
   - Document StateUpdater pattern
   - Reference actual code files

---

### **Task 10: Migrate ytmp3-clone-4**

**This is the CRITICAL validation step.**

**Steps:**

1. **Create StateUpdater implementation:**
   - Implement StateUpdater interface
   - Use app's updateConversionTask from state/
   - Provide all required methods

2. **Update conversion initialization:**
   - Import StrategyFactory from package
   - Instantiate with StateUpdater
   - Replace old factory usage

3. **Update imports:**
   - Remove local strategy imports
   - Import from `@downloader/core/conversion`

4. **Delete old files:**
   - Delete `apps/ytmp3-clone-4/src/features/downloader/logic/conversion/application/strategies/`
   - Delete polling-progress-mapper (if extracted)
   - Keep app-specific state management

5. **Test ALL conversion flows:**
   - Polling strategy (most common)
   - Static direct strategy
   - Other stream strategy
   - iOS RAM strategy

**Validation checklist:**
- [ ] App builds without errors
- [ ] Polling conversion works
- [ ] Static direct conversion works
- [ ] Other stream conversion works
- [ ] iOS RAM conversion works
- [ ] State updates correctly
- [ ] Progress updates shown correctly
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

⚠️ THIS IS THE CRITICAL PHASE - Contains core YouTube conversion logic

Documents read:
- ✅ MASTER_REFACTOR_DOC.md (including Dependency Injection section)
- ✅ README.md
- ✅ PHASE_3_EXTRACT_CONVERSION.md

Code files analyzed:
- ✅ IConversionStrategy.ts ([X] lines)
- ✅ BaseStrategy.ts ([X] lines)
- ✅ PollingStrategy.ts ([X] lines) - MOST COMPLEX
- ✅ StaticDirectStrategy.ts ([X] lines)
- ✅ OtherStreamStrategy.ts ([X] lines)
- ✅ IOSRamStrategy.ts ([X] lines)
- ✅ StrategyFactory.ts ([X] lines)
- ✅ PollingProgressMapper.ts ([X] lines)
- ✅ concurrent-polling.ts ([X] lines)
- ✅ State management files (to understand coupling)

PROJECT CLARIFICATION:
- This is a YouTube downloader (not multi-platform social media)
- Strategies handle different YouTube conversion methods
- PollingStrategy is the most complex (multi-phase progress)

DEPENDENCY ANALYSIS (CRITICAL):

Current state dependencies found:

1. BaseStrategy:
   - Imports: `import { updateConversionTask } from '../../../../state/conversion-state'`
   - updateTask() method calls updateConversionTask(formatId, update)
   - Helper methods: markSuccess(), markFailed() use updateTask()

2. PollingStrategy:
   - Inherits from BaseStrategy
   - Calls this.updateTask() in [X] places:
     - Initial state update
     - Progress updates
     - Status text updates
     - Success/failure states
   - Parameters passed: { state, statusText, progress, downloadUrl, showProgressBar, ... }

3. [Continue for other strategies...]

4. PollingProgressMapper:
   - NO state dependencies ✅
   - Pure utility for progress calculation

5. concurrent-polling.ts:
   - [Analyze dependencies]
   - Decision: Extract to core or keep in app?

PROPOSED DEPENDENCY INJECTION DESIGN:

StateUpdater interface analysis:

Current usage pattern:
- updateConversionTask(formatId, updateObject)
- updateObject has fields: state, statusText, progress, downloadUrl, etc.

Proposed StateUpdater interface (describe in words):
- Method to update task with formatId and update fields
- [Describe your proposed design]

How strategies will use it:
- Constructor injection: BaseStrategy receives StateUpdater
- Subclasses inherit access through this.updateTask()
- [Explain your approach]

How apps will provide it:
- Clone-4: Wrapper around existing updateConversionTask
- y2matepro: Different implementation for SSR
- [Explain implementation]

COMPARISON RESULTS:

Strategy files across apps:
- BaseStrategy: [Identical/Different]
- PollingStrategy: [Identical/Different]
- [etc for each]

[If different, explain differences]

COMPLEXITY ASSESSMENT:

1. PollingStrategy: ⚠️ VERY COMPLEX
   - 600+ lines
   - Multi-phase progress logic
   - Fake progress when stuck
   - Merging phase with progressive timing
   - Must preserve EXACT behavior

2. Other strategies: Simpler
   - [Assessment of each]

RISKS IDENTIFIED:

1. **State coupling risk:**
   - [X] updateConversionTask calls across all strategies
   - Risk: Missing any call breaks app
   - Mitigation: [Your plan]

2. **PollingStrategy complexity:**
   - Complex multi-phase logic
   - Risk: Breaking progress calculation or phase transitions
   - Mitigation: Extensive testing, careful extraction

3. **Concurrent polling manager:**
   - Decision: Extract or keep in app?
   - [Your analysis]

QUESTIONS BEFORE PROCEEDING:

1. StateUpdater interface design - Is my proposal correct?
2. Should concurrent-polling.ts be extracted to core?
3. Should I extract PollingStrategy first or last (due to complexity)?
4. [Your other questions]

PROPOSED IMPLEMENTATION ORDER:

1. Design and approve StateUpdater interface
2. Extract types (IConversionStrategy, etc.)
3. Extract BaseStrategy with DI
4. Extract PollingProgressMapper (no DI needed)
5. Decide on concurrent-polling.ts
6. Extract simpler strategies first (StaticDirect, OtherStream, IOSRam)
7. Extract PollingStrategy last (most complex, learn from others)
8. Extract StrategyFactory
9. Migrate clone-4 and test EXTENSIVELY

ESTIMATED EFFORT:

This is the largest phase:
- ~5,000-8,000 lines to extract
- 4 strategies + base + factory
- Complex progress logic
- Extensive testing needed

ETA: [Your estimate - likely 2-3 weeks]

⚠️ I will NOT proceed until you approve:
1. StateUpdater interface design
2. Dependency Injection approach
3. concurrent-polling.ts decision
4. Implementation order
5. Risk mitigation strategy

Awaiting your approval.
```

**⚠️ WAIT FOR APPROVAL. DO NOT SKIP THIS.**

---

### **Step 2: IMPLEMENTATION PHASE**

Only after approval:

1. Create branch: `refactor/phase-3-extract-conversion`

2. Implement tasks in order (per approved plan)

3. Progress updates after each major component

---

### **Step 3: EXTENSIVE VERIFICATION PHASE**

**Test EVERY conversion type in ytmp3-clone-4:**

**Polling Strategy (most common):**
- [ ] MP4 large file (triggers polling)
- [ ] MP3 conversion
- [ ] Progress animates correctly
- [ ] Phase transitions work (processing → merging)
- [ ] Fake progress when stuck
- [ ] Status text rotates correctly
- [ ] Completion works

**Static Direct Strategy:**
- [ ] Small file direct download
- [ ] Progress updates
- [ ] Completion works

**Other Stream Strategy:**
- [ ] Alternative stream format
- [ ] Conversion works

**iOS RAM Strategy:**
- [ ] iOS device simulation (if possible)
- [ ] RAM conversion works

**Error testing:**
- [ ] Invalid URL
- [ ] Network error
- [ ] Timeout
- [ ] Verify error messages correct

**Comparison with clone-3:**
- [ ] Same URLs in both apps
- [ ] Identical behavior
- [ ] Same progress updates
- [ ] Same phase transitions

---

### **Step 4: REVIEW PHASE**

**Create PR with comprehensive description of all strategies tested.**

---

## ✅ DEFINITION OF DONE

Phase 3 is complete when:

- [ ] All strategies extracted to packages/core/conversion/
- [ ] Dependency Injection implemented correctly
- [ ] StateUpdater interface defined and used
- [ ] NO imports from state/ in package code
- [ ] StrategyFactory extracted
- [ ] PollingProgressMapper extracted
- [ ] Types extracted
- [ ] 80%+ test coverage achieved
- [ ] All tests passing
- [ ] ytmp3-clone-4 migrated successfully
- [ ] All 4 conversion strategies tested and working in clone-4
- [ ] Behavior identical to original (clone-3)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] PR created with complete description
- [ ] PR approved by reviewers
- [ ] Code merged to main branch
- [ ] Progress updated in MASTER_REFACTOR_DOC.md

---

## 📊 EXPECTED METRICS

**After Phase 3:**
- Lines extracted: ~5,000-8,000 lines
- Strategy files: 4 strategies + base + factory
- Tests written: ~80-100 tests
- Coverage: 80-90%
- Apps migrated: 1 (ytmp3-clone-4)
- Conversion types tested: 4 (Polling, StaticDirect, OtherStream, IOSRam)
- State dependencies removed: 100%

---

**Ready to start Phase 3! This is CRITICAL - take your time, discuss extensively, test thoroughly.** 🚀

**Remember: READ → ANALYZE DEEPLY → DISCUSS EXTENSIVELY → APPROVE → CODE CAREFULLY → TEST THOROUGHLY**
