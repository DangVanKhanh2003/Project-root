# MASTER REFACTOR DOCUMENTATION

> **Tài liệu tổng quan cho Downloader Monorepo Refactoring Project**
> Version: 2.0 (NO CODE VERSION)
> Last Updated: 2025-12-24
> Status: Planning Phase

---

## ⚠️ QUAN TRỌNG: NGUYÊN TẮC TÀI LIỆU

**Tài liệu này KHÔNG CHỨA CODE.**

**Lý do:**
1. AI PHẢI đọc code từ project thực tế, không copy từ docs
2. Code examples trong docs có thể outdated
3. Docs chỉ hướng dẫn **CÁI GÌ** và **TẠI SAO**, không phải **CODE NHƯ THẾ NÀO**

**Nhiệm vụ của AI:**
- Đọc tài liệu này để hiểu context
- Đọc code từ files được chỉ định
- Phân tích và đề xuất approach
- THẢO LUẬN với human trước khi code

---

## 📌 MỤC ĐÍCH TÀI LIỆU

Tài liệu này cung cấp **TOÀN BỘ CONTEXT** cho AI assistants thực hiện refactor project.

**Đối tượng sử dụng:**
- AI Implementation Agents (thực hiện code)
- AI Code Reviewers (review code)
- Human Developers (tham khảo)

**Yêu cầu:**
- PHẢI đọc toàn bộ tài liệu này trước khi bắt đầu bất kỳ task nào
- PHẢI đọc phase-specific prompt
- PHẢI thảo luận approach trước khi code

---

## 🎯 TÓM TẮT DỰ ÁN

### **Vấn đề hiện tại:**
- Monorepo chứa 5 apps
- ~25,000 lines code duplicate
- Mỗi app copy toàn bộ conversion logic, utilities, UI components
- Khó maintain: sửa bug phải sửa 5 lần

### **Mục tiêu refactor:**
1. Extract shared code vào packages
2. Giữ UI/UX independence (mỗi app tự do customize)
3. Hỗ trợ 19 ngôn ngữ (i18n)
4. Maintain backward compatibility
5. 80%+ test coverage cho packages

### **Nguyên tắc vàng:**
- ✅ Share CORE logic (conversion strategies, utilities, API)
- ✅ Share BASE UI components (có thể override per app)
- ✅ Support 19 languages với RTL
- ❌ KHÔNG force apps dùng cùng UI/UX
- ❌ KHÔNG gom state management vào core (app-specific)
- ❌ KHÔNG hard-code dependencies trong core packages

### **Timeline:** 18 tuần (8 phases)

---

## 📂 CẤU TRÚC PROJECT

### **Apps hiện tại (5 apps):**

1. **y2matepro** (Production)
   - Location: `/apps/y2matepro/`
   - Tech: Eleventy SSG
   - Special: Thiếu state layer, thiếu UI render layer
   - Deploy: GitHub Actions

2. **ytmp3-clone-3** (Test/Reference)
   - Location: `/apps/ytmp3-clone-3/`
   - Tech: SPA, full architecture
   - Has: State layer, UI render layer, format selector
   - Purpose: Source of truth cho architecture

3. **ytmp3-clone-4** (Test variant)
   - Similar to clone-3
   - Purpose: Will be pilot migration target

4. **ytmp3-clone-darkmode-3** (Dark theme)
   - Similar to clone-3 + dark theme CSS

5. **y2mate-new-ux** (New UX experiment)
   - Similar to clone-3

### **Packages hiện tại (2 packages):**

1. **@downloader/core**
   - Location: `/packages/core/`
   - Contains: Backend services, HTTP client, API factory
   - Will expand: Add conversion, utilities

2. **@downloader/ui-shared**
   - Location: `/packages/ui-shared/`
   - Contains: Minimal (scroll manager, captcha modal)
   - Will expand: Add base UI components

### **Apps Architecture Comparison:**

**Files y2matepro THIẾU (so với clone apps):**
- `src/features/downloader/state/*` (entire directory)
- `src/features/downloader/ui-render/*` (entire directory)
- `src/ui-components/format-selector/`
- `src/features/downloader/logic/cleanup.ts`
- `src/loaders/` (CSS/asset lazy loading)

**Files y2matepro CÓ (clone apps không có):**
- `src/ui-components/modal/conversion-modal.ts`
- `_templates/` (Eleventy templates)
- `_11ty-output/` (generated static HTML)

**Hệ quả:**
- Không thể migrate y2matepro theo cách giống clone apps
- Cần special handling cho y2matepro (Phase 6)

---

## 🔍 CODE DUPLICATION ANALYSIS

### **Duplicate Code Summary:**

| Category | Lines | Files Count | Apps | Risk Level |
|----------|-------|-------------|------|------------|
| Conversion Logic | ~2,500 | 15+ | All 5 | 🔴 High |
| State Management | ~2,000 | 11 | 4 (not y2matepro) | 🔴 High |
| UI Rendering | ~2,500 | 5 | 4 (not y2matepro) | 🟡 Medium |
| UI Components | ~1,500 | 10+ | All 5 | 🟢 Low |
| Utilities | ~500 | 4 | All 5 | 🟢 Low |
| Constants | ~300 | 2 | All 5 | 🟢 Low |
| CSS | ~5,000 | 30+ | All 5 | 🟡 Medium |

**Total:** ~14,300 lines core logic + ~5,000 lines CSS

### **Critical Duplicate Files:**

**Để AI đọc trước khi làm Phase 3:**
- `apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/BaseStrategy.ts`
- `apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/PollingStrategy.ts`
- `apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/StaticDirectStrategy.ts`
- `apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/IOSRamStrategy.ts`
- `apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/OtherStreamStrategy.ts`
- `apps/ytmp3-clone-3/src/features/downloader/logic/conversion/convert-logic-v2.ts`

**Để AI đọc trước khi làm Phase 1:**
- `apps/ytmp3-clone-3/src/utils/format-utils.ts`
- `apps/ytmp3-clone-3/src/utils/link-validator.ts`
- `apps/ytmp3-clone-3/src/utils/download-stream.ts`
- `apps/ytmp3-clone-3/src/constants/youtube-constants.ts`

**Để AI đọc trước khi làm Phase 4:**
- `apps/ytmp3-clone-3/src/ui-components/modal/expire-modal.ts`
- `apps/ytmp3-clone-3/src/ui-components/search-result-card/`
- `apps/ytmp3-clone-3/src/ui-components/skeleton/`
- (và các UI components khác)

**Verify duplication:**
AI cần compare files giữa các apps để verify chúng thực sự duplicate.

---

## 🏗️ KIẾN TRÚC MỤC TIÊU

### **New Packages (sẽ tạo):**

1. **@downloader/core** (enhanced)
   - Location: `/packages/core/`
   - New additions:
     - `src/conversion/` - Conversion strategies + orchestrator
     - `src/utils/` - Utilities (format, link validator, download, youtube)
     - `src/state-interface/` - State interface ONLY (no implementation)

2. **@downloader/i18n** (new)
   - Location: `/packages/i18n/`
   - Contains:
     - `src/core/` - i18n engine
     - `src/locales/` - 19 language JSON files

3. **@downloader/ui-shared** (enhanced)
   - Location: `/packages/ui-shared/`
   - New additions:
     - `src/components/` - Base UI components
     - `src/themes/` - CSS tokens

### **App Structure sau refactor:**

Mỗi app sẽ có:
- `src/features/downloader/state/` - APP-SPECIFIC state (không move vào package)
- `src/features/downloader/integration/` - Glue code (wire core + state)
- `src/features/downloader/ui/` - APP-SPECIFIC UI
- `src/styles/theme-override.css` - Override CSS tokens
- `src/i18n-setup.ts` - Bootstrap i18n

Dependencies:
- `@downloader/core`
- `@downloader/i18n`
- `@downloader/ui-shared`

---

## 🔑 KIẾN TRÚC CRITICAL: DEPENDENCY INJECTION

### **Vấn đề:**
- Conversion strategies cần update state
- Nhưng state là app-specific
- y2matepro không có state layer
- KHÔNG thể hard-code state import trong strategies

### **Giải pháp: Dependency Injection**

**Concept:**
- Core packages định nghĩa INTERFACE (không có implementation)
- Apps implement interface theo cách riêng
- Apps INJECT implementation vào core packages khi sử dụng

**Files để đọc hiểu pattern:**
1. Đọc current code (có hard-coded dependency):
   - `apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/BaseStrategy.ts`
   - Tìm dòng: `import { updateConversionTask } from ...state`
   - Nhận thấy: Hard-coded dependency!

2. Hiểu cần refactor thế nào:
   - Strategies KHÔNG được import state trực tiếp
   - Phải nhận StateUpdater qua constructor parameter
   - StateUpdater là function type (interface), không phải concrete implementation

**Validation pattern:**
- ❌ BAD: Strategy import state trực tiếp
- ✅ GOOD: Strategy nhận StateUpdater qua constructor

**AI MUST implement Dependency Injection trong Phase 3.**

---

## 🌍 I18N REQUIREMENTS

### **Languages (19 total):**

**High Priority:**
- en (English) - Base language
- vi (Vietnamese)
- ar (Arabic) - RTL
- es (Spanish)
- fr (French)

**Medium Priority:**
- de (German)
- pt (Portuguese)
- id (Indonesian)
- th (Thai)

**Low Priority:**
- ja (Japanese)
- ko (Korean)
- it (Italian)
- ru (Russian)
- tr (Turkish)
- hi (Hindi)
- bn (Bengali)
- ms (Malay)
- my (Myanmar)
- ur (Urdu) - RTL

### **RTL Support:**
- ar (Arabic)
- ur (Urdu)

Must support:
- `direction: rtl` CSS
- `dir="rtl"` attribute
- RTL-friendly CSS properties (margin-inline-start, etc.)

### **Translation Structure:**

Files location: `packages/i18n/src/locales/[lang].json`

Categories needed:
- common (loading, error, retry, cancel, etc.)
- expireModal
- searchResultCard
- suggestionDropdown
- previewCard
- conversionStatusBar
- progress
- time
- formats
- quality

**AI MUST NOT write translations** - Only setup structure. Translations will be provided by native speakers.

---

## 📋 ROADMAP (18 TUẦN - 8 PHASES)

### **~~Phase 0: Preparation~~ (SKIPPED)**
- ~~Setup Vitest~~
- ~~Setup Playwright~~
- ~~Setup CI/CD~~
- **Decision:** Skip testing for now, focus on refactoring
- **Impact:** Manual testing required, careful review needed

### **Phase 1: Extract Utilities (Week 3-4)**
- Extract format-utils, link-validator, download-stream
- Extract YouTube helpers
- Write unit tests (80%+ coverage)
- Migrate 1 app (ytmp3-clone-4)

### **Phase 2: I18n System (Week 5-6)**
- Create i18n package
- Setup 19 locale files structure
- Write i18n engine
- Write translation checker

### **Phase 3: Extract Conversion Logic (Week 7-9)**
- Define StateUpdater interface
- Extract all strategies với Dependency Injection
- Extract orchestrator
- Write comprehensive tests

### **Phase 4: Extract UI Components (Week 10-12)**
- Setup CSS tokens
- Extract base components với i18n
- Support override pattern
- RTL CSS support

### **Phase 5: Pilot Migration (Week 13-14)**
- Migrate ytmp3-clone-3 fully
- Create integration layer
- Test thoroughly

### **Phase 6: Migrate y2matepro (Week 15-16)**
- Handle architectural differences
- Create minimal state adapter
- Production rollout

### **Phase 7: Migrate Remaining Apps (Week 17)**
- Migrate clone-4, darkmode-3, new-ux
- Delete duplicate code

### **Phase 8: Polish & Optimize (Week 18)**
- Performance optimization
- Complete translations (with native speakers)
- Final documentation

---

## 🎯 SUCCESS CRITERIA

### **Must achieve:**
- [ ] All 5 apps working identically
- [ ] All conversion flows working
- [ ] No production errors
- [ ] 19 languages supported
- [ ] 80%+ test coverage for packages
- [ ] Duplicate code < 1,000 lines
- [ ] Bundle size ≤ current
- [ ] Performance ≥ current

### **Code quality:**
- [ ] No `any` types in packages
- [ ] TypeScript strict mode
- [ ] ESLint passing
- [ ] No console errors
- [ ] Proper error handling

---

## ⚠️ CRITICAL CONSTRAINTS

### **NGHIÊM CẤM (MUST NOT):**
1. ❌ Change app UI/UX without approval
2. ❌ Break production (y2matepro)
3. ❌ Force apps use same state implementation
4. ❌ Hard-code state dependencies trong core
5. ❌ Remove existing functionality
6. ❌ Deploy without tests passing
7. ❌ Copy code from tài liệu này (không có code để copy)
8. ❌ Code trước khi thảo luận

### **BẮT BUỘC (MUST):**
1. ✅ Use Dependency Injection cho state
2. ✅ Write tests for all new code
3. ✅ Support RTL languages
4. ✅ Maintain backward compatibility
5. ✅ Document all decisions
6. ✅ Get approval before merging
7. ✅ Đọc code từ project files
8. ✅ Thảo luận approach trước khi code

---

## 🛠️ TECHNICAL STACK

**Build Tools:**
- Vite 7.x
- TypeScript 5.3.3
- pnpm workspace

**Testing:**
- Vitest (unit)
- Playwright (E2E)
- Coverage: vitest --coverage

**Linting:**
- ESLint
- TypeScript strict mode
- Prettier

**CI/CD:**
- GitHub Actions

---

## 📖 DOCUMENTS STRUCTURE

```
docs/refactor/
├── MASTER_REFACTOR_DOC.md          # This file (context)
├── BASELINE_BEHAVIOR.md            # Current behavior reference
├── REVIEWER_PROMPT.md              # For AI reviewer
│
├── prompts/                        # Phase-specific prompts
│   ├── PHASE_0_PREPARATION.md
│   ├── PHASE_1_EXTRACT_UTILITIES.md
│   ├── PHASE_2_I18N_SYSTEM.md
│   ├── PHASE_3_EXTRACT_CONVERSION.md
│   ├── PHASE_4_UI_COMPONENTS.md
│   ├── PHASE_5_PILOT_MIGRATION.md
│   ├── PHASE_6_Y2MATEPRO.md
│   ├── PHASE_7_REMAINING_APPS.md
│   └── PHASE_8_POLISH.md
│
└── adr/                            # Architecture Decision Records
    ├── 001-dependency-injection.md
    ├── 002-state-independence.md
    └── 003-i18n-strategy.md
```

**Reading order for AI:**
1. MASTER_REFACTOR_DOC.md (this file)
2. Phase-specific prompt (e.g., PHASE_1_EXTRACT_UTILITIES.md)
3. Relevant code files (listed in phase prompt)
4. ADRs if needed

---

## 🚨 CRITICAL KNOWLEDGE

### **1. Dependency Injection Pattern**

**Files to read:**
- Current: `apps/ytmp3-clone-3/src/features/downloader/logic/conversion/application/strategies/BaseStrategy.ts`
- Look for: imports from state
- Understand: This is the PROBLEM (hard-coded dependency)

**What to implement:**
- StateUpdater type/interface
- Constructor injection pattern
- Apps inject their state updater

### **2. UI Override Pattern**

**Concept:**
- Base component có default behavior
- App có thể override via config/props
- App có thể override CSS via tokens

**Files to read:**
- `apps/ytmp3-clone-3/src/ui-components/modal/expire-modal.ts`
- Understand: How to make it configurable

### **3. i18n Integration**

**Requirements:**
- TypeScript-safe keys
- RTL support
- Interpolation (placeholder replacement)
- Lazy loading
- Reactive switching

**Files to read later:**
- Sẽ có reference implementation trong Phase 2

---

## 🔄 WORKFLOW FOR AI AGENTS

### **Every Phase MUST follow:**

**1. READ Phase:**
- Read MASTER_REFACTOR_DOC.md
- Read phase-specific prompt
- Read ALL listed code files
- Read related ADRs

**2. ANALYZE Phase:**
- Understand requirements
- Identify files to extract
- Compare files across apps (find differences)
- Identify risks

**3. DISCUSSION Phase (MANDATORY):**
- Summarize understanding
- Propose approach
- List assumptions
- Identify risks
- Ask questions
- **WAIT for human approval**

**4. IMPLEMENTATION Phase:**
- Create feature branch
- Implement step by step
- Write tests FIRST
- Verify tests pass
- Manual testing

**5. REVIEW Phase:**
- Create PR with checklist
- Submit for review
- Address feedback
- Merge after approval

### **NGHIÊM CẤM bỏ qua Discussion Phase!**

---

## 📊 PROGRESS TRACKING

| Phase | Status | Start | End | Notes |
|-------|--------|-------|-----|-------|
| ~~Phase 0~~ | ❌ SKIPPED | - | - | Testing (skip for now) |
| Phase 1 | 🔵 Planned | - | - | Utilities |
| Phase 2 | 🔵 Planned | - | - | I18n |
| Phase 3 | 🔵 Planned | - | - | Conversion (DI critical) |
| Phase 4 | 🔵 Planned | - | - | UI Components |
| Phase 5 | 🔵 Planned | - | - | Pilot (clone-3) |
| Phase 6 | 🔵 Planned | - | - | y2matepro (production) |
| Phase 7 | 🔵 Planned | - | - | Remaining apps |
| Phase 8 | 🔵 Planned | - | - | Polish |

Legend: 🔵 Planned | 🟡 In Progress | 🟢 Complete | 🔴 Blocked

---

## 📝 REFERENCE FILES

### **Existing Analysis Documents:**
- `/detailed-refactoring-plan.md` - Previous detailed plan
- `/downloader-duplication-report.md` - Duplication analysis
- `/downloader-refactor-report.md` - Original recommendations
- `/refactoring-plan.md` - Another plan version

**Note:** These are historical. This MASTER_REFACTOR_DOC is the SINGLE SOURCE OF TRUTH.

---

## 🎓 LEARNING FOR AI

### **Before starting Phase 1:**
Learn:
- pnpm workspace structure
- Vitest testing patterns
- How to compare files programmatically

### **Before starting Phase 3:**
Learn:
- Dependency Injection pattern
- Strategy pattern
- TypeScript interfaces vs implementations

### **Before starting Phase 4:**
Learn:
- CSS custom properties
- RTL CSS patterns
- Component override patterns

---

## 📞 COMMUNICATION TEMPLATE

### **Starting a phase:**
```
I'm starting [Phase X]: [Name]

Documents read:
- ✅ MASTER_REFACTOR_DOC.md
- ✅ PHASE_X_[NAME].md
- ✅ [List code files read]

My understanding:
[Summary]

Questions before proceeding:
1. [Question]
2. [Question]

Proposed approach:
[Approach]

Awaiting approval.
```

### **During work:**
```
Phase X Progress:
- ✅ Task 1 complete
- 🟡 Task 2 in progress
- ⏳ Task 3 pending

Blockers: [None/List]
ETA: [Date]
```

### **Completing:**
```
Phase X Complete!

Summary:
- [Achievement 1]
- [Achievement 2]

Tests: [X passing]
Coverage: [Y%]

PR: [link]
Ready for review.
```

---

## 🎯 CONCLUSION

This refactoring project requires:

1. **Deep understanding** - Read code, don't assume
2. **Careful planning** - Think before code
3. **Thorough testing** - 80%+ coverage
4. **Clear communication** - Discuss first
5. **Patience** - 18 weeks, don't rush

**Golden Rule:**
**READ → UNDERSTAND → DISCUSS → APPROVE → CODE → TEST → REVIEW**

**Never skip the DISCUSS step!**

---

## 📋 CHECKLIST FOR AI

Before starting ANY phase:
- [ ] Read MASTER_REFACTOR_DOC.md completely
- [ ] Read phase-specific prompt
- [ ] Read all listed code files
- [ ] Understand the WHY (not just the WHAT)
- [ ] Identify risks
- [ ] Prepare questions
- [ ] Ready to discuss (NOT code yet)

---

**Good luck! Remember: This document has NO CODE intentionally. You must read actual code from the project.** 🚀
