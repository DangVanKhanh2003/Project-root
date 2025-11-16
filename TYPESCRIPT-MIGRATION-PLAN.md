# KẾ HOẠCH TÁI CẤU TRÚC SANG TYPESCRIPT MONOREPO

**Dự án**: Downloader Project - TypeScript Migration
**Tạo lúc**: 2025-11-15
**Backup source**: `Project-root-backup-20251115-171021`

---

## 🤖 FOR AI CLI - START HERE

**If you're an AI CLI working on this project, read this first:**

### Current Focus: Phase 2E ✅ COMPLETE | Phase 3 🎯 STARTED

**Phase 2E Status:** ✅ Complete - All 17 API methods implemented
**Phase 3 Status:** 🎯 Partial - ui-shared package created (scroll + captcha)

**For current work:**
```
/Users/macos/Documents/work/downloader/Project-root/packages/ui-shared/README.md
```

**For core architecture:**
```
/Users/macos/Documents/work/downloader/Project-root/packages/core/AI_CLI_ONBOARDING.md
/Users/macos/Documents/work/downloader/Project-root/packages/core/DOMAIN_LAYER_GUIDE.md
```

**For architecture and API reference:**
```
/Users/macos/Documents/work/downloader/Project-root/packages/core/DOMAIN_LAYER_GUIDE.md
/Users/macos/Documents/work/downloader/Project-root/packages/core/REFACTOR_COMPARISON.md
/Users/macos/Documents/work/downloader/Project-root/packages/core/VERIFIED_SERVICES_QUICKSTART.md
```

**Quick Context:**
- **Phase 0:** ✅ DONE - Monorepo infrastructure setup
- **Phase 1:** ✅ DONE - Model layer built (models/dto + models/remote)
- **Phase 2A:** ✅ DONE - HTTP Client with axios
- **Phase 2B:** ✅ DONE - BaseService (OOP inheritance pattern)
- **Phase 2C:** ✅ DONE - Core Services (V1: 7 services, V2: 3 services)
- **Phase 2D:** ✅ DONE - Domain Layer (VerifiedServices + DomainVerifier)
- **Phase 2E:** ✅ DONE - All 17 API methods (Multifile + YouTubePublicApi added)
- **Phase 3:** 🎯 PARTIAL - ui-shared package (scroll + captcha migrated)

**Current Architecture (Actual Implementation):**
```
packages/
├── core/src/            # ← Business Logic (DOM-independent)
│   ├── domain/              # Domain Layer (Site projects use this)
│   │   ├── verified-services.ts      # Main API (17 methods)
│   │   ├── verification/
│   │   │   ├── verifier.ts           # JWT extraction & verification
│   │   │   ├── types.ts              # VerifiedResult<T>
│   │   │   ├── messages.ts           # Error messages
│   │   │   └── policies.ts           # Verification policies
│   │   └── jwt/
│   │       └── jwt-store.interface.ts # JWT storage abstractions
│   │
│   ├── services/            # Service Layer (Internal)
│   │   ├── base/
│   │   │   └── base-service.ts       # Abstract base (OOP pattern)
│   │   ├── v1/
│   │   │   ├── interfaces/           # Service contracts
│   │   │   └── implementations/      # 7 services (Search, Media, etc.)
│   │   ├── v2/
│   │   │   ├── interfaces/
│   │   │   └── implementations/      # 3 services (SearchV2, Queue, etc.)
│   │   └── public-api/
│   │       ├── interfaces/
│   │       └── implementations/      # Public API service
│   │
│   ├── http/                # HTTP Layer
│   │   └── http-client.ts            # Axios-based client
│   │
│   └── models/              # Data Models
│       ├── dto/             # Domain Transfer Objects
│       └── remote/          # Remote API types
│
└── ui-shared/src/       # ← 🆕 UI Utilities (Browser-only)
    ├── scroll/              # Scroll management
    │   ├── scroll-manager.ts         # Centralized scroll system
    │   ├── scroll-behavior.ts        # Form scroll behaviors
    │   └── index.ts
    │
    ├── captcha/             # CAPTCHA UI
    │   ├── captcha-provider.ts       # Token acquisition (Turnstile + reCAPTCHA)
    │   ├── captcha-modal.ts          # Modal UI component
    │   └── index.ts
    │
    └── styles/              # CSS files
        └── captcha-modal.css
```

**Your Task:**
Continue Phase 3 - Migrate remaining UI components to ui-shared package.

**DO NOT:**
- ❌ Read this entire planning document (too long!)
- ❌ Start coding immediately without reading package READMEs
- ❌ Follow the old Phase 3 plan below (it's outdated!)

**DO:**
- ✅ Read `packages/ui-shared/README.md` for current UI utilities
- ✅ Read `packages/core/DOMAIN_LAYER_GUIDE.md` for integration patterns
- ✅ Check Phase 3 actual status below for what's already done
- ✅ Identify remaining UI components to migrate

**⚠️ IMPORTANT:** The Phase 2 section below is **OUTDATED** and kept for historical reference only. The actual implementation follows a **completely different architecture** (Domain Layer + BaseService OOP + Verification System). Always refer to the onboarding guide and current documentation files for accurate information.

---

## MỤC LỤC

- [I. TỔNG QUAN](#i-tổng-quan)
- [II. NGUYÊN TẮC KẾ HOẠCH](#ii-nguyên-tắc-kế-hoạch)
- [III. CẤU TRÚC SAU REFACTOR](#iii-cấu-trúc-sau-refactor)
- [IV. PHASE 0: FOUNDATION SETUP](#iv-phase-0-foundation-setup)
- [V. PHASE 1: BUILD MODEL LAYER](#v-phase-1-build-model-layer)
- [VI. PHASE 2: MIGRATE CORE PACKAGE](#vi-phase-2-migrate-core-package)
- [VII. PHASE 3: MIGRATE UI-SHARED PACKAGE](#vii-phase-3-migrate-ui-shared-package)
- [VIII. PHASE 4: MIGRATE APP](#viii-phase-4-migrate-app)
- [IX. PHASE 5: CI/CD SETUP](#ix-phase-5-cicd-setup)
- [X. PHASE 6: STRICT MODE & CLEANUP](#x-phase-6-strict-mode--cleanup)
- [XI. TIMELINE & MILESTONES](#xi-timeline--milestones)

---

## I. TỔNG QUAN

### Hiểu Đúng Mục Tiêu

**Cấu trúc sau refactor**:
```
Project-root/
├── packages/
│   ├── core/              # Core business logic (từ /src/script/libs + models mới)
│   └── ui-shared/         # UI components reusable (từ /src/script/ui-components)
├── apps/
│   └── yt1s-test-monorepo/   # Site đầu tiên (import packages)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .eslintrc.js
├── .prettierrc.js
└── package.json (root)
```

### Nguyên Tắc

- ✅ **UI components migrate sang TS** → dễ copy sang sites khác
- ✅ **Features code vào app** → import từ packages
- ✅ **Không rebuild** - migrate incremental
- ✅ **Backward compatible** trong quá trình migration
- ✅ **Core package pure** - không DOM dependencies

---

## II. NGUYÊN TẮC KẾ HOẠCH

### Các Nguyên Tắc Bắt Buộc

1. ❌ **KHÔNG chứa code implementation trong kế hoạch**
2. ✅ **Phân tích sâu**: Thực trạng → Output → Challenges → Research → Quy trình → Tiêu chí
3. ✅ **Mỗi bước có quy trình riêng** phù hợp đặc thù
4. ✅ **Focus vào WHY và HOW**, không phải WHAT (code)
5. ✅ **Research trước, code sau** - không bao giờ code trước khi hiểu rõ
6. ✅ **Document mọi quyết định** để trace được reasoning

### Workflow Chung

```
Research (hiểu vấn đề)
  → Document findings
  → Design solution
  → Verify với user
  → Execute incremental
  → Validate result
  → Checkpoint
```

---

## III. CẤU TRÚC SAU REFACTOR (UPDATED - Reflects Actual Implementation)

### Package Structure

**`packages/core/`** - Core Business Logic Package ✅ IMPLEMENTED

**Actual Structure:**
```
packages/core/src/
├── config/                    # API configuration
├── domain/                    # 🆕 Domain Layer (MAIN API)
│   ├── verified-services.ts   # Verified services wrapper (14 methods)
│   ├── verification/          # JWT extraction & verification
│   │   ├── verifier.ts
│   │   ├── types.ts
│   │   ├── messages.ts
│   │   └── policies.ts
│   └── jwt/                   # JWT storage abstractions
│       └── jwt-store.interface.ts
│
├── http/                      # HTTP Client
│   └── http-client.ts         # Axios-based client
│
├── mappers/                   # 🆕 Data Mappers/Normalizers
│   ├── v1/                    # V1 API normalizers
│   ├── v2/                    # V2 API normalizers
│   └── public-api/            # Public API normalizers
│
├── models/                    # Type Definitions
│   ├── dto/                   # Domain Transfer Objects (clean data)
│   │   ├── search.dto.ts
│   │   ├── media.dto.ts
│   │   ├── conversion.dto.ts
│   │   └── ...
│   ├── remote/                # Remote API types
│   │   ├── v1/                # V1 requests/responses
│   │   ├── v2/                # V2 requests/responses
│   │   └── public-api/        # Public API types
│   └── application-models/    # Enums & shared types
│
├── services/                  # Service Layer
│   ├── base/                  # BaseService abstract class
│   ├── v1/                    # V1 API services
│   │   ├── interfaces/
│   │   └── implementations/
│   ├── v2/                    # V2 API services
│   │   ├── interfaces/
│   │   └── implementations/
│   ├── public-api/            # Public API services
│   ├── types/                 # Service types
│   └── constants/             # Service constants
│
└── utils/                     # Pure utilities
```

**Key Differences from Original Plan:**
- ✅ **ADDED:** `domain/` layer - Main API for site projects (VerifiedServices)
- ✅ **ADDED:** `mappers/` - Data normalization layer (replaced inline normalizers)
- ✅ **CHANGED:** `models/` structure - Split into dto/, remote/, application-models/
- ✅ **CHANGED:** `services/` - Now has v1/, v2/, public-api/ structure
- ❌ **REMOVED:** `captcha/`, `scroll/` - Not needed in core (app-level concerns)
- ✅ **FOCUS:** Domain-driven design with clear layers

**Đặc điểm:**
- NO DOM dependencies
- Pure TypeScript
- Can run on Node.js
- Site projects ONLY use `domain/` layer

**Current Status (as of 2025-11-16):**
- ✅ Phase 0: Foundation Setup - COMPLETE
- ✅ Phase 1: Model Layer - COMPLETE
- ✅ Phase 2A: HTTP Client - COMPLETE
- ✅ Phase 2B: Base Service - COMPLETE
- ✅ Phase 2C: Core Services - COMPLETE
- ✅ Phase 2D: Domain Layer (VerifiedServices) - COMPLETE
- 🔄 Phase 2E: Add Multifile & YouTubePublicApi - IN PROGRESS (14/17 methods)
- ⏸️ Phase 2F-6: Pending

**For current task details:**
See `/packages/core/AI_CLI_ONBOARDING.md`

---

**`packages/ui-shared/`** - Reusable UI Components ⏸️ NOT YET IMPLEMENTED
- Status: Planned for Phase 3
- Nguồn: `/src/script/ui-components/`
- Nội dung:
  - `components/modal/`
  - `components/search-result-card/`
  - `components/suggestion-dropdown/`
- Đặc điểm: DOM-aware, TypeScript, reusable

---

**`apps/yt1s-test-monorepo/`** - First Site ⏸️ NOT YET IMPLEMENTED
- Status: Planned for Phase 4
- Nguồn: `/src/script/features/` + `/src/pages/` + `/src/styles/`
- Nội dung:
  - `src/main.ts` - Entry point
  - `src/features/` - App features
  - `src/styles/` - CSS
  - `index.html`
- Đặc điểm: Import từ `@downloader/core` domain layer

---

## IV. PHASE 0: FOUNDATION SETUP

### Mục Tiêu Phase

Thiết lập monorepo infrastructure mà **KHÔNG ảnh hưởng code hiện tại**.

### Thực Trạng Hiện Tại

- Single repo, vanilla JS
- Vite build đơn giản với plugins (critical CSS, PurgeCSS, etc.)
- npm package manager
- Code đang chạy production
- Không có TypeScript, linting infrastructure
- Multiple HTML pages (index.html, youtube-downloader.html, etc.)

### Output Phase 0

- ✅ Git branch mới isolated: `feature/typescript-monorepo-migration`
- ✅ Monorepo skeleton (folders + configs)
- ✅ pnpm workspace functional
- ✅ TypeScript compiler setup (`allowJs: true`, `strict: false`)
- ✅ ESLint + Prettier shared configs
- ✅ **Existing code VẪN chạy được** (zero disruption)

### Vấn Đề & Challenges

#### Challenge 1: Workspace Hoisting Conflicts

**Vấn đề**: pnpm workspace hoisting có thể conflict với node_modules hiện tại

**Risk**:
- Dependencies bị duplicate hoặc missing
- Version conflicts
- Peer dependency issues

**Impact**:
- Build bị break
- Runtime errors
- Hard to debug dependency issues

#### Challenge 2: TypeScript Incremental Adoption

**Vấn đề**: Làm sao JS và TS coexist trong quá trình migration?

**Risk**:
- Import errors khi mix JS/TS
- Type checking failures block build
- Path resolution issues

**Impact**:
- Không build được
- Development experience bị gián đoạn

#### Challenge 3: Config Cascading

**Vấn đề**: tsconfig, eslint, prettier - nào ở root, nào ở workspace?

**Risk**:
- Config conflicts
- Override không đúng
- Inconsistent behavior giữa workspaces

**Impact**:
- Linting errors không consistent
- Build behavior khác nhau giữa packages

### Research Process Chi Tiết

#### Research 1: Current Dependency Tree (4 hours)

**Câu hỏi cần trả lời**:
- package.json hiện tại có bao nhiêu dependencies?
- Dependencies nào runtime, nào dev?
- Có peer dependencies không?
- Có version conflicts tiềm năng không?
- External libs nào cần @types packages?

**Cách thực hiện**:

1. **Đọc package.json từng dòng** (1 hour)
   - List tất cả dependencies
   - List tất cả devDependencies
   - Note versions và version constraints

2. **Classify dependencies** (1.5 hours)
   - **Core business logic deps** → `packages/core`
     - HTTP client libraries
     - Utility libraries
     - Data processing libs
   - **UI dependencies** → `packages/ui-shared`
     - DOM manipulation libs (nếu có)
     - UI component libs (nếu có)
   - **Build tools** → root devDependencies
     - Vite và plugins
     - TypeScript
     - ESLint, Prettier
   - **App-specific** → `apps/yt1s-test-monorepo`
     - App-only features

3. **Check npm registry for peer deps** (1 hour)
   - Với mỗi dependency, check trên npmjs.com
   - Note peer dependency requirements
   - Identify potential conflicts

4. **Document version constraints** (0.5 hour)
   - Which libs require specific versions?
   - Compatibility matrix
   - Upgrade opportunities

**Output document**: `docs/phase0/dependency-analysis.md`

**Template**:
```markdown
# Dependency Analysis

## Runtime Dependencies (Total: X)

### Core Business Logic (→ packages/core)
- [lib-name]: version [x.y.z]
  - Purpose: [why we use it]
  - Peer deps: [list]
  - @types needed: Yes/No

### UI Dependencies (→ packages/ui-shared)
[Same format]

### App-specific (→ apps/yt1s-test-monorepo)
[Same format]

## Dev Dependencies (Total: Y)

### Build Tools (→ root)
- Vite: [version]
  - Plugins: [list]
- TypeScript: [version]
- ESLint: [version]

## Peer Dependency Warnings
[List any peer dep issues]

## Version Conflicts
[Document conflicts]

## Recommended Workspace Placement
[Summary table]
```

#### Research 2: Build Process Analysis (3 hours)

**Câu hỏi cần trả lời**:
- Vite config hiện tại làm gì?
- Entry points là gì?
- Plugins nào đang dùng và purpose?
- Asset handling như thế nào?
- Output structure ra sao?
- Multiple HTML pages được handle thế nào?

**Cách thực hiện**:

1. **Đọc `vite.config.js` line by line** (1.5 hours)
   - Document mỗi config option
   - Understand plugins:
     - criticalCss plugin - does what?
     - purgeCss plugin - configuration?
     - minifyHTML plugin - how works?
     - viteStaticCopy plugin - copies what?
   - Note rollupOptions:
     - Multiple HTML inputs
     - Asset file naming strategy
     - External dependencies

2. **Trace build flow** (1 hour)
   - Input: HTML files → which scripts?
   - Transformations: CSS processing, JS bundling
   - Output: dist/ structure
   - Asset handling: images, icons, fonts

3. **Document critical configs** (0.5 hour)
   - Path aliases (nếu có)
   - Externals
   - Code splitting strategy
   - CSS code splitting

**Output document**: `docs/phase0/build-process.md`

**Template**:
```markdown
# Build Process Analysis

## Vite Configuration

### Entry Points
- index.html → [script src]
- youtube-downloader.html → [script src]
[List all HTML entries]

### Plugins

#### criticalCss Plugin
- Purpose: [explain]
- Configuration: [settings]
- Impact: [how affects build]

#### purgeCss Plugin
- Purpose: Remove unused CSS
- Content sources: [files scanned]
- Safelist patterns: [protected classes]

[Document all plugins]

### Rollup Options

#### Input (Multi-page)
[List all inputs]

#### Output
- Asset naming: [strategy]
- Code splitting: [how works]

### Asset Handling
- Images: [copy strategy]
- Icons: [location]
- Fonts: [if any]

## Build Flow Diagram
```
[Source files]
  → [Vite processing]
  → [Plugin transformations]
  → [dist/ output]
```

## Critical Considerations for Monorepo
- How to adapt for package builds?
- Vite config per workspace?
- Shared Vite config base?
```

#### Research 3: Import Patterns Audit (2 hours)

**Câu hỏi cần trả lời**:
- Code hiện tại import như thế nào?
- Có absolute imports không?
- Path aliases có không?
- Circular dependencies có không?
- Deep relative imports nhiều không?

**Cách thực hiện**:

1. **Grep tất cả import statements** (0.5 hour)
   ```bash
   grep -r "from ['\"]" src/script/ > imports-audit.txt
   wc -l imports-audit.txt  # Count total imports
   ```

2. **Analyze patterns** (1 hour)
   - **Relative imports**: `from './module'`
     - Count: how many?
     - Depth: how deep? (../..)
   - **Deep relative imports**: `from '../../../libs/`
     - Problem areas
   - **External imports**: `from 'library'`
     - Which external libs used where?

3. **Identify problematic patterns** (0.5 hour)
   - Circular dependencies check:
     ```bash
     # Manual trace or use tool
     ```
   - Deep nesting (>3 levels `../`)
   - Inconsistent patterns

4. **Plan future monorepo imports**
   - From: `from '../../../libs/downloader-lib-standalone/api/service'`
   - To: `from '@downloader/core/services/api.service'`

**Output document**: `docs/phase0/import-patterns.md`

**Template**:
```markdown
# Import Patterns Analysis

## Current Patterns

### Relative Imports
- Total count: [number]
- Average depth: [levels]
- Examples:
  - `from './state'`
  - `from '../ui-renderer'`

### Deep Relative Imports (>2 levels)
- Count: [number]
- Problem files: [list]
- Example: `from '../../../libs/downloader-lib-standalone/api/service'`

### External Imports
- Libraries imported: [list]
- Most used: [lib name]

## Circular Dependencies
[If found, document]

## Problematic Patterns
1. [Pattern 1]: [Why problematic]
2. [Pattern 2]: [Why problematic]

## Future Monorepo Import Strategy

### Package Imports
- `@downloader/core` - for core logic
- `@downloader/ui-shared` - for UI components

### Path Aliases (tsconfig)
```json
{
  "paths": {
    "@downloader/core": ["packages/core/src"],
    "@downloader/ui-shared": ["packages/ui-shared/src"]
  }
}
```

### Migration Plan
[How to migrate from old to new imports]
```

### Quy Trình Thực Hiện Phase 0

**Workflow độc nhất: "Non-Disruptive Setup"**

**Nguyên tắc**: Mọi thay đổi phải ADDITIVE (thêm vào), không DESTRUCTIVE (phá vỡ).

#### Step 1: Git Isolation (15 mins)

**Actions**:
1. Verify git status clean: `git status`
2. Create branch: `git checkout -b feature/typescript-monorepo-migration`
3. Push empty branch: `git push -u origin feature/typescript-monorepo-migration`

**Checkpoint**:
- ✅ Branch exists on remote
- ✅ Working directory clean

#### Step 2: Research Completion (9 hours)

**Actions**:
1. Execute Research 1: Dependency analysis
2. Execute Research 2: Build process analysis
3. Execute Research 3: Import patterns audit
4. Create all docs in `docs/phase0/`
5. Review docs for completeness

**Checkpoint**:
- ✅ All research docs complete
- ✅ Findings documented accurately
- ✅ User review (if needed for clarification)

#### Step 3: Install Monorepo Tooling (1 hour)

**Actions**:
1. Install pnpm globally: `npm install -g pnpm`
2. Verify installation: `pnpm --version`
3. Create `pnpm-workspace.yaml` at root:
   ```yaml
   packages:
     - 'packages/*'
     - 'apps/*'
   ```
4. Create root `package.json`:
   - Name: `downloader-monorepo`
   - Private: true
   - Scripts: dev, build, lint
   - DevDependencies: TypeScript, ESLint, Prettier
5. Run `pnpm install` to test

**Checkpoint**:
- ✅ pnpm installed globally
- ✅ workspace.yaml exists
- ✅ `pnpm install` runs successfully
- ✅ Workspace structure recognized

#### Step 4: Create Skeleton Structure (30 mins)

**Actions**:
1. Create folders:
   ```bash
   mkdir -p packages/core
   mkdir -p packages/ui-shared
   mkdir -p apps/yt1s-test-monorepo
   ```
2. Create placeholder `package.json` in each workspace (minimal):
   - packages/core/package.json
   - packages/ui-shared/package.json
   - apps/yt1s-test-monorepo/package.json
3. **NO CODE migration yet** - just structure

**Checkpoint**:
- ✅ Folder structure exists
- ✅ Placeholder package.json in each workspace
- ✅ pnpm recognizes workspaces: `pnpm -r list`

#### Step 5: Setup Shared Configs (2 hours)

**Actions**:

1. **Create `tsconfig.base.json`** (root level):
   - Target: ES2020
   - Module: ESNext
   - **allowJs: true** (CRITICAL for gradual migration)
   - **strict: false** (initially)
   - Path aliases for @downloader/core, @downloader/ui-shared
   - Include: DOM types

2. **Create `.eslintrc.js`** (root level):
   - Parser: @typescript-eslint/parser
   - Support both JS and TS
   - Plugins: @typescript-eslint
   - Rules: warn on `any`, not error yet

3. **Create `.prettierrc.js`** (root level):
   - Semi: true
   - Single quote: true
   - Print width: 100

4. **Test configs**:
   - Run `npx tsc --noEmit` - should not crash
   - Run `npx eslint . --ext .js,.ts` - should lint existing JS
   - Run `npx prettier --check .` - should check formatting

**Checkpoint**:
- ✅ tsconfig.base.json exists và valid
- ✅ ESLint config exists
- ✅ Prettier config exists
- ✅ `npx tsc --noEmit` doesn't crash
- ✅ Configs functional

#### Step 6: Verification Gate (30 mins)

**Actions**:
1. Run existing build: `npm run dev` (old script from existing package.json)
2. Verify app still works in browser
3. Run `pnpm install` again
4. Check for any errors
5. Review git diff - what changed?

**Tests**:
- ✅ Old code builds successfully
- ✅ Old code runs in browser
- ✅ No runtime errors
- ✅ pnpm workspace setup doesn't break anything

**Checkpoint**:
- ✅ Zero disruption to existing code
- ✅ Monorepo infrastructure in place
- ✅ Ready for Phase 1

### Tiêu Chí Thành Công Phase 0

#### Functional Requirements
- ✅ pnpm workspace functional
- ✅ Existing code builds và runs như cũ
- ✅ TypeScript compiler setup (noEmit mode works)
- ✅ ESLint + Prettier configs valid

#### Documentation Requirements
- ✅ `docs/phase0/dependency-analysis.md` complete
- ✅ `docs/phase0/build-process.md` complete
- ✅ `docs/phase0/import-patterns.md` complete

#### Risk Mitigation
- ✅ Backup exists: `Project-root-backup-20251115-171021`
- ✅ Git branch isolated
- ✅ Rollback plan: delete branch, restore from backup

#### Time Box
**Maximum**: 2-3 days

**Breakdown**:
- Research: 9 hours
- Setup: 4 hours
- Verification: 1 hour
- Buffer: remaining time

---

## V. PHASE 1: BUILD MODEL LAYER

### Mục Tiêu Phase

Xây dựng hoàn chỉnh **type system làm foundation** cho toàn bộ migration.

### Thực Trạng Hiện Tại

- **Zero type definitions** anywhere
- API responses handled as plain objects (`any` implicitly)
- State mutations via spread operators - no type safety
- **"Magic strings" everywhere**:
  - Statuses: 'idle', 'loading', 'error', 'success'
  - States: 'preparing', 'converting', 'ready', 'expired'
  - Formats: 'mp3', 'mp4', 'webm', '720p', '1080p'
  - Input types: 'url', 'keyword'
- Normalizer transformations không transparent
- Validation logic scattered, không centralized
- No runtime type checking

### Output Phase 1

- ✅ Complete model layer trong `packages/core/src/models/`
- ✅ **API Request models** (cho mọi API call)
- ✅ **API Response models** (raw từ backend)
- ✅ **DTO models** (normalized data sau normalizer)
- ✅ **Domain entity models** (Video, Gallery, Format, etc.)
- ✅ **Application state models** (complete state shape)
- ✅ **Enums/String literals** thay magic strings
- ✅ **Type guards** cho runtime validation
- ✅ **Zero `any` types** trong models
- ✅ Documentation đầy đủ

### Tại Sao Phase Này CRITICAL

#### Lý do 1: Type Safety Foundation

- Models là **contract giữa layers**:
  - API layer → Service layer (Request/Response models)
  - Service layer → Business logic (DTO models)
  - Business logic → UI (Domain models)
  - UI → State management (State models)
- **Sai model = sai toàn bộ migration**
- Không có models đúng → services không type được → UI không safe

#### Lý do 2: API Understanding

- Backend API structure **không rõ ràng**
- Response wrappers **phức tạp và không consistent**
- Phải **reverse-engineer từ code cũ**
- Models document API contracts → dễ maintain

#### Lý do 3: Domain Clarity

- Domain boundaries **unclear trong vanilla JS**
- Phải xác định **entities và relationships**
- Model design **ảnh hưởng architecture decisions**
- Sai domain model → hard to refactor later

### Vấn Đề & Challenges

#### Challenge 1: API Response Inconsistency

**Vấn đề cụ thể**:

Backend trả về nhiều wrapper formats khác nhau:

**Variant 1 - Simple wrapper**:
```json
{
  "status": "ok",
  "data": {
    "meta": {...},
    "formats": {...}
  }
}
```

**Variant 2 - Double-nested**:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "data": {
      "meta": {...},
      "formats": {...}
    }
  }
}
```

**Variant 3 - With JWT injection**:
```json
{
  "status": "ok",
  "data": {...},
  "jwt": "eyJhbGc..."
}
```

**Error responses khác structure**:
```json
{
  "status": "error",
  "message": "Invalid URL"
}
```

**Không biết trước response nào dùng format nào** - phải trace từ code.

**Risk**:
- Type models sai → runtime errors khi parse response
- Missing edge cases → bugs in production
- Normalizers không handle được tất cả variants

**Impact**:
- Service layer không type được chính xác
- Type assertions everywhere (`as any`)
- No compile-time safety

#### Challenge 2: Normalizer Black Box

**Vấn đề cụ thể**:

Normalizer functions transform data nhưng **logic hidden**:
- Input type không documented
- Output type không clear
- Intermediate transformations không visible
- Default value injection không predictable

Example từ code:
```javascript
// normalizeVideoDetail(data) - what is data shape?
function normalizeVideoDetail(data) {
  return {
    meta: {
      title: data.meta?.title || 'Untitled',  // Default injection
      thumbnail: data.meta?.thumbnail || null,
      // ... more defaults
    },
    formats: {
      video: (data.formats?.video || []).filter(f => f.quality), // Filtering
      audio: (data.formats?.audio || []).map(a => ({ // Transformation
        ...a,
        category: 'audio' // Computed field
      }))
    }
  };
}
```

**Không rõ**:
- Input `data` có shape gì?
- Output guaranteed có fields nào?
- Filtering logic làm mất data không?

**Risk**:
- Model output type sai
- Missing required properties trong type definition
- Type guards không accurate

**Impact**:
- UI render errors (missing data)
- Data inconsistency
- Hard to debug transformation issues

#### Challenge 3: State Complexity

**Vấn đề cụ thể**:

State object có **30+ properties**, nested objects, mutually exclusive states:

```javascript
const initialState = {
  // Simple properties
  inputType: 'url',           // 'url' | 'keyword'
  isLoading: false,
  isSubmitting: false,
  error: null,

  // Nested objects
  searchPagination: {
    nextPageToken: null,
    hasNextPage: false,
    isLoadingMore: false,
    loadMoreCount: 0
  },

  multifileSession: {
    sessionId: null,
    state: 'idle',            // Multiple possible states
    progress: {...},
    // ...
  },

  // Mutually exclusive states
  videoDetail: null,          // XOR galleryDetail
  galleryDetail: null,

  // Maps
  downloadTasks: {},          // formatId -> task
  conversionTasks: {},

  // ... 20+ more properties
};
```

**Partial updates everywhere**:
```javascript
setState({ isLoading: true });
setState({ videoDetail: data, isLoading: false });
setState({
  searchPagination: {
    ...state.searchPagination,
    loadMoreCount: count + 1
  }
});
```

**Không rõ**:
- Complete state shape là gì?
- Properties nào required, nào optional?
- Computed vs stored properties?

**Risk**:
- State model thiếu properties
- Type definitions không match runtime behavior
- State transitions không type-safe

**Impact**:
- State management bugs
- UI inconsistencies
- Hard to track state changes

#### Challenge 4: Domain Model Boundaries

**Vấn đề cụ thể**:

**Video và Gallery có overlap metadata?**
```javascript
// Video
{ meta: { title, thumbnail, duration, author }, formats: {...} }

// Gallery
{ meta: { title, thumbnail, duration, author }, items: [...] }
```
→ Nên có shared `VideoMetadata` interface?

**VideoFormat và AudioFormat có base?**
```javascript
// VideoFormat
{ id, quality: '720p', type: 'mp4', size, url, category: 'video' }

// AudioFormat
{ id, quality: '128kbps', type: 'mp3', size, url, bitrate, category: 'audio' }
```
→ Shared properties: id, size, url, category. Nên có `BaseFormat`?

**Download tasks vs Conversion tasks - unified?**
```javascript
// DownloadTask
{ status: 'loading', message, timestamp }

// ConversionTask
{ state: 'Converting', statusText, progress, downloadUrl, error }
```
→ Khác nhau nhiều, nên separate models.

**SearchResult vs VideoMetadata - reuse?**
```javascript
// SearchResult
{ id, title, thumbnail, duration, author, views, uploadDate }

// VideoMetadata
{ title, thumbnail, duration, author, source, platform, url }
```
→ Có overlap nhưng khác purpose. Separate hoặc extend?

**Risk**:
- Over-engineering (quá nhiều types, quá abstract)
- Under-engineering (missing abstractions, code duplication)
- Wrong inheritance hierarchy (hard to refactor)

**Impact**:
- Code duplication nếu under-engineer
- Complexity explosion nếu over-engineer
- Maintenance nightmare

#### Challenge 5: Magic Strings Proliferation

**Vấn đề cụ thể**:

Magic strings **scattered throughout codebase**:

```javascript
// Status strings
if (status === 'idle') ...
if (status === 'loading') ...
if (status === 'error') ...

// State strings
setState({ inputType: 'url' });
setState({ inputType: 'keyword' });

// Format strings
if (format === 'mp3') ...
if (quality === '720p') ...

// Platform strings
if (platform === 'youtube') ...
```

**Problems**:
- Typos: `'idel'` instead of `'idle'`
- Incomplete coverage: miss a state like 'canceled'
- No autocomplete
- No type safety

**Risk**:
- Runtime errors from typos
- Switch statements miss cases
- Future states không được handle

**Impact**:
- Bugs in production
- Hard to refactor (find all string usages)

### Research Process SIÊU Chi Tiết

#### Research 1: API Contract Discovery (2 days intensive)

**Mục tiêu**: Hiểu **100% mọi API call**, request, response.

**Câu hỏi cần trả lời**:
- Có bao nhiêu API methods?
- Mỗi method request params gì?
- Mỗi method response structure ra sao?
- Có bao nhiêu response variants?
- Side effects gì (JWT save, CAPTCHA trigger)?
- Error responses như thế nào?

**Cách thực hiện - Step by Step**:

##### Step 1: Inventory API Methods (2 hours)

**Actions**:
1. Đọc `/src/script/libs/downloader-lib-standalone/api/service.js`
2. List TOÀN BỘ exported functions
3. Classify theo purpose:
   - **Media extraction**: extractMedia, extractMediaDirect
   - **Search**: searchVideoV2, getSuggestions
   - **Download**: decryptDownloadUrl, startMultifileDownload
   - **Conversion**: convertMedia (if any)
   - **Utilities**: checkTask, pollProgress

**Output**: Initial API catalog in scratch notes

##### Step 2: Deep Dive Per Method (1.5 days)

**Với MỖI API method, phân tích**:

**Request Analysis**:
- Function signature: `async function extractMedia(url, protectionPayload = {})`
- Parameters:
  - `url`: string, required
  - `protectionPayload`: object, optional
    - `jwt`: string, optional
    - `captcha`: object, optional
- Request body structure: `{ url: sanitize(url) }`
- Request headers:
  - Static: `Content-Type: application/json`
  - Dynamic: `Authorization: Bearer ${jwt}` (if protectionPayload.jwt)
- Authentication: JWT-based
- CAPTCHA: Via protectionPayload or injected

**Endpoint Analysis**:
- HTTP method: POST
- URL path: `/extract` (from endpoints.js)
- Timeout: 20000ms (from REQUEST_TIMEOUTS)

**Response Analysis**:

**Success Response (Variant 1 - Simple)**:
```json
{
  "status": "ok",
  "data": {
    "meta": {
      "title": "Video Title",
      "thumbnail": "https://...",
      "duration": 120
    },
    "formats": {
      "video": [{...}],
      "audio": [{...}]
    }
  }
}
```

**Success Response (Variant 2 - Nested)**:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "data": {
      "meta": {...},
      "formats": {...}
    }
  }
}
```

**JWT Injection**:
```json
{
  "status": "ok",
  "data": {...},
  "jwt": "eyJhbGc..."
}
```

**Error Response**:
```json
{
  "status": "error",
  "message": "Invalid URL"
}
```

**Side Effects**:
- JWT storage: `if (response.jwt) saveJwt(response.jwt)`
- State mutations: None in API layer
- CAPTCHA flows: May trigger if JWT invalid

**Normalizer Pipeline**:
1. Response received
2. JWT extracted and saved
3. Data unwrapped (handle nesting)
4. Passed to `normalizeVideoDetail(dataToNormalize)`
5. Returns `VideoDetail` domain model

##### Step 3: Trace Normalizer Pipeline (4 hours)

**Với mỗi API method, follow normalizer**:

Example: `extractMedia()` → `normalizeVideoDetail()`

**Input to Normalizer** (raw API data after unwrap):
```javascript
{
  meta: { title, thumbnail, duration, author, ... },
  formats: { video: [...], audio: [...] },
  url: "https://..."
}
```

**Transformations Applied**:
1. Extract meta fields
2. Apply defaults: `title = title || 'Untitled'`
3. Parse formats arrays
4. Filter invalid formats: `formats.video.filter(f => f.quality)`
5. Add computed fields: `category: 'video'`
6. Construct output object

**Output from Normalizer** (VideoDetail domain model):
```javascript
{
  meta: {
    title: string,
    thumbnail: string | null,
    duration: number | null,
    author: string | null,
    source: string | null,
    platform: 'youtube' | 'tiktok' | ...,
    url: string | null,
    isFakeData: false
  },
  formats: {
    video: VideoFormat[],
    audio: AudioFormat[]
  }
}
```

##### Step 4: Document Response Wrappers (2 hours)

**Identify common patterns**:

**Pattern A - Simple**:
- Structure: `{ status, data, jwt? }`
- Used by: extractMedia, searchVideoV2
- Unwrap: `response.data`

**Pattern B - Nested**:
- Structure: `{ success, data: { status, data } }`
- Used by: Some legacy endpoints
- Unwrap: `response.data.data`

**Pattern C - Error**:
- Structure: `{ status: 'error', message }`
- All endpoints
- Handle: throw error or return error object

##### Step 5: Create API Contract Documents

**One file per API**:

```
docs/api-contracts/
├── 00-overview.md
├── 01-extract-media.md
├── 02-extract-media-direct.md
├── 03-search-video-v2.md
├── 04-get-suggestions.md
├── 05-decrypt-download-url.md
├── 06-multifile-start.md
├── 07-convert-media.md
└── 99-response-wrappers.md
```

**Template cho mỗi contract**:

````markdown
# API: extractMedia

## Overview
- **Purpose**: Extract video metadata and download formats from URL
- **Usage Context**: When user submits video URL

## Endpoint
- **URL**: `/extract`
- **HTTP Method**: POST
- **Timeout**: 20000ms (20 seconds)
- **Base URL**: API_BASE_URL from environment

## Request

### Parameters
- `url` (string, required): Video URL to extract
  - Example: `"https://www.youtube.com/watch?v=dQw4w9WgXcQ"`
- `protectionPayload` (object, optional): Authentication payload
  - `jwt` (string, optional): JWT token for authentication
  - `captcha` (object, optional): CAPTCHA verification
    - `token` (string): CAPTCHA token
    - `type` (string): Provider type ('cloudflare' | 'google')

### Headers
- **Static**:
  - `Content-Type: application/json`
- **Dynamic**:
  - `Authorization: Bearer ${jwt}` (if protectionPayload.jwt provided)

### Example Request Body
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

## Response

### Success Response (Variant 1 - Simple)
```json
{
  "status": "ok",
  "data": {
    "meta": {
      "title": "Rick Astley - Never Gonna Give You Up",
      "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "duration": 212,
      "author": "Rick Astley",
      "source": "youtube"
    },
    "formats": {
      "video": [
        {
          "quality": "720p",
          "type": "mp4",
          "size": 52428800,
          "encrypted_url": "enc_url_here"
        }
      ],
      "audio": [
        {
          "quality": "128kbps",
          "type": "mp3",
          "size": 3407872,
          "encrypted_url": "enc_audio_here"
        }
      ]
    }
  }
}
```

### Success Response (Variant 2 - Nested)
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "data": {
      "meta": {...},
      "formats": {...}
    }
  }
}
```

### JWT Injection Pattern
```json
{
  "status": "ok",
  "data": {...},
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Invalid URL format"
}
```

## Data Flow
1. Request preparation: sanitize URL
2. API call to `/extract` endpoint
3. Response received
4. JWT extraction: `if (response.jwt) saveJwt(response.jwt)`
5. Data unwrapping: handle nesting variants
6. Normalizer call: `normalizeVideoDetail(unwrappedData)`
7. Output: `VideoDetail` domain model

## Side Effects
- **JWT storage**: Yes - saves to localStorage via `saveJwt()`
- **State mutations**: None at API layer
- **CAPTCHA trigger**: May occur if JWT invalid/expired

## TypeScript Models Needed

### Request Model
```typescript
interface ExtractMediaRequest {
  url: string;
}

interface ExtractMediaProtectionPayload {
  jwt?: string;
  captcha?: {
    token: string;
    type: 'cloudflare' | 'google';
  };
}
```

### Raw Response Models
```typescript
// Variant 1
interface ExtractMediaRawResponseV1 {
  status: 'ok' | 'error';
  data?: ExtractMediaRawData;
  jwt?: string;
  message?: string;
}

// Variant 2
interface ExtractMediaRawResponseV2 {
  success: boolean;
  data: {
    status: 'ok' | 'error';
    data?: ExtractMediaRawData;
  };
}

interface ExtractMediaRawData {
  meta: RawVideoMetadata;
  formats?: {
    video?: RawVideoFormat[];
    audio?: RawAudioFormat[];
  };
  url?: string;
}
```

### DTO Model (Normalized Output)
```typescript
interface VideoDetail {
  meta: VideoMetadata;
  formats: {
    video: VideoFormat[];
    audio: AudioFormat[];
  };
  completedAt?: number;
}
```

## Edge Cases
- **Missing meta fields**: Defaults applied by normalizer
- **Empty formats arrays**: Normalized to empty arrays `[]`
- **Null vs undefined**: Normalizer converts to null
- **Network timeout**: Throws after 20s
- **Invalid JWT**: May trigger CAPTCHA challenge
````

**Verification Checkpoint**:
- ✅ Document cho 100% API methods?
- ✅ Each document has all sections filled?
- ✅ Examples are real (from code or testing)?
- ✅ All response variants covered?
- ✅ TypeScript models identified?

**Output**: Complete `docs/api-contracts/` folder

---

#### Research 2: Normalizer Reverse Engineering (1.5 days intensive)

**Mục tiêu**: Hiểu transformation pipeline từ **raw API → normalized data**.

**Câu hỏi cần trả lời**:
- Có bao nhiêu normalizer functions?
- Mỗi normalizer làm gì?
- Input type là gì?
- Output type là gì?
- Transformation logic ra sao?
- Có intermediate types không?

**Cách thực hiện - Step by Step**:

##### Step 1: Normalizer Inventory (2 hours)

**Actions**:
1. Đọc `/src/script/libs/downloader-lib-standalone/api/normalizers.js`
2. List tất cả exported functions:
   - `normalizeVideoDetail()`
   - `normalizeGallery()`
   - `normalizeSearchResults()`
   - `normalizeFormats()`
   - etc.
3. Classify theo domain:
   - Video normalization
   - Gallery normalization
   - Search normalization
   - Format normalization

**Output**: List of normalizers with purpose

##### Step 2: Deep Dive Per Normalizer (1 day)

**Với MỖI normalizer function**:

Example: `normalizeVideoDetail(data)`

**Input Analysis**:
```javascript
// From API (raw data)
{
  meta: {
    title: "...",
    thumbnail: "...",
    duration: 120,
    author: "...",
    // May have extra fields
    // May miss some fields
  },
  formats: {
    video: [...],
    audio: [...]
  },
  url: "https://..."
}
```

**Transformation Logic** (line-by-line reading):

```javascript
function normalizeVideoDetail(data) {
  // Step 1: Extract and default meta
  const meta = {
    title: data.meta?.title || 'Untitled',       // Default value
    thumbnail: data.meta?.thumbnail || null,     // Null if missing
    duration: data.meta?.duration || null,
    author: data.meta?.author || null,
    source: data.meta?.source || null,
    platform: detectPlatform(data.url),          // Computed field
    url: data.url || null,
    isFakeData: false                             // Injected field
  };

  // Step 2: Normalize formats
  const videoFormats = (data.formats?.video || [])
    .filter(f => f.quality)                       // Filter invalid
    .map(f => ({
      ...f,
      category: 'video',                          // Add category
      id: generateId(f)                           // Computed ID
    }));

  const audioFormats = (data.formats?.audio || [])
    .filter(f => f.quality)
    .map(f => ({
      ...f,
      category: 'audio',
      id: generateId(f)
    }));

  // Step 3: Construct output
  return {
    meta,
    formats: {
      video: videoFormats,
      audio: audioFormats
    }
  };
}
```

**Transformations Identified**:
1. **Default value injection**: `|| 'Untitled'`, `|| null`
2. **Computed fields**: `platform: detectPlatform()`, `id: generateId()`
3. **Data filtering**: `.filter(f => f.quality)`
4. **Data enrichment**: Add `category`, `isFakeData`
5. **Type conversions**: None (data types preserved)

**Output Analysis**:
```javascript
// Normalized VideoDetail
{
  meta: {
    title: string,
    thumbnail: string | null,
    duration: number | null,
    author: string | null,
    source: string | null,
    platform: Platform | null,
    url: string | null,
    isFakeData: boolean
  },
  formats: {
    video: VideoFormat[],    // Guaranteed array (never undefined)
    audio: AudioFormat[]     // Guaranteed array
  }
}
```

**Guaranteed fields**: title, meta object, formats object with arrays
**Optional fields**: Most meta fields can be null

##### Step 3: Vẽ Data Flow Diagrams (4 hours)

**Với mỗi API → Normalizer path**:

```
extractMedia API Call
  ↓
Raw Response: { success, data: { status, data: {...} } }
  ↓
[Unwrap Logic]
  ↓
Raw Data: { meta: {...}, formats: {...} }
  ↓
normalizeVideoDetail(rawData)
  ↓
[Apply Defaults]
meta.title = meta.title || 'Untitled'
  ↓
[Transform Formats]
formats.video.filter(...).map(...)
  ↓
[Add Computed Fields]
platform: detectPlatform(url)
  ↓
VideoDetail (Typed Domain Model)
```

**Document tất cả transformation steps**:
- Data loss: Filtered formats without quality
- Data gain: Added category, id, isFakeData
- Type changes: None

##### Step 4: Identify Intermediate Types (2 hours)

**Types cần define**:

1. **Raw API Response Type** (from backend):
   ```typescript
   interface ExtractMediaRawResponse {
     // Before unwrap
   }
   ```

2. **Unwrapped Type** (after unwrap logic):
   ```typescript
   interface ExtractMediaRawData {
     // After unwrap, before normalize
   }
   ```

3. **Pre-normalized Type** (optional, if có intermediate step):
   ```typescript
   interface ExtractMediaPreNormalized {
     // After some processing, before final
   }
   ```

4. **Normalized Type** (final output):
   ```typescript
   interface VideoDetail {
     // Final domain model
   }
   ```

##### Step 5: Create Normalizer Analysis Docs

```
docs/normalizers/
├── 00-overview.md
├── normalize-video-detail.md
├── normalize-gallery.md
├── normalize-search-results.md
└── data-flow-diagrams.md
```

**Template cho mỗi normalizer**:

````markdown
# Normalizer: normalizeVideoDetail

## Purpose
Transforms raw API response data into typed `VideoDetail` domain model with guaranteed structure and defaults.

## Input Type (Raw API Data)

### Structure (After Unwrap)
```javascript
{
  meta: {
    title: string | undefined,
    thumbnail: string | undefined,
    duration: number | undefined,
    author: string | undefined,
    source: string | undefined
  } | undefined,
  formats: {
    video: Array | undefined,
    audio: Array | undefined
  } | undefined,
  url: string | undefined
}
```

### Example Input
```json
{
  "meta": {
    "title": "Video Title",
    "thumbnail": "https://..."
  },
  "formats": {
    "video": [
      { "quality": "720p", "type": "mp4", "size": 12345 }
    ],
    "audio": []
  },
  "url": "https://youtube.com/watch?v=xxx"
}
```

## Transformation Steps

### Step 1: Extract and Default Meta Fields
- `title`: Use `data.meta?.title` or default to `'Untitled'`
- `thumbnail`: Use `data.meta?.thumbnail` or `null`
- `duration`: Use `data.meta?.duration` or `null`
- `author`: Use `data.meta?.author` or `null`
- `source`: Use `data.meta?.source` or `null`

### Step 2: Compute Platform
- Call `detectPlatform(data.url)` based on URL
- Returns: `'youtube' | 'tiktok' | 'instagram' | ...`

### Step 3: Inject Standard Fields
- `url`: Use `data.url` or `null`
- `isFakeData`: Always `false` for real API data

### Step 4: Normalize Video Formats
- Extract: `data.formats?.video || []`
- Filter: Remove formats without `quality` field
- Map: Add `category: 'video'` and `id: generateId(format)`

### Step 5: Normalize Audio Formats
- Extract: `data.formats?.audio || []`
- Filter: Remove formats without `quality` field
- Map: Add `category: 'audio'` and `id: generateId(format)`

### Step 6: Construct Output
- Return object with `meta` and `formats`

## Default Value Logic

| Field | Default Value | Condition |
|-------|---------------|-----------|
| meta.title | `'Untitled'` | If `data.meta?.title` is falsy |
| meta.thumbnail | `null` | If `data.meta?.thumbnail` is falsy |
| meta.duration | `null` | If `data.meta?.duration` is falsy |
| formats.video | `[]` | If `data.formats?.video` is undefined |
| formats.audio | `[]` | If `data.formats?.audio` is undefined |

## Data Filtering

**Removes**:
- Video formats without `quality` field
- Audio formats without `quality` field

**Keeps**:
- All formats with valid `quality` property

## Computed Fields

| Field | Computation Logic |
|-------|-------------------|
| `meta.platform` | `detectPlatform(url)` - extracts from URL |
| `meta.isFakeData` | Always `false` for real API responses |
| `format.category` | `'video'` or `'audio'` based on format type |
| `format.id` | `generateId(format)` - unique identifier |

## Output Type (Normalized)

### Structure
```typescript
{
  meta: {
    title: string,
    thumbnail: string | null,
    duration: number | null,
    author: string | null,
    source: string | null,
    platform: Platform | null,
    url: string | null,
    isFakeData: boolean
  },
  formats: {
    video: VideoFormat[],
    audio: AudioFormat[]
  }
}
```

### Example Output
```json
{
  "meta": {
    "title": "Video Title",
    "thumbnail": "https://...",
    "duration": null,
    "author": null,
    "source": null,
    "platform": "youtube",
    "url": "https://youtube.com/watch?v=xxx",
    "isFakeData": false
  },
  "formats": {
    "video": [
      {
        "quality": "720p",
        "type": "mp4",
        "size": 12345,
        "category": "video",
        "id": "video|720p|mp4"
      }
    ],
    "audio": []
  }
}
```

## TypeScript Models Needed

### Input Model
```typescript
interface ExtractMediaRawData {
  meta?: {
    title?: string;
    thumbnail?: string;
    duration?: number;
    author?: string;
    source?: string;
  };
  formats?: {
    video?: RawVideoFormat[];
    audio?: RawAudioFormat[];
  };
  url?: string;
}
```

### Output Model
```typescript
interface VideoDetail {
  meta: VideoMetadata;
  formats: {
    video: VideoFormat[];
    audio: AudioFormat[];
  };
}
```

### Intermediate Models
```typescript
interface RawVideoFormat {
  quality?: string;
  type?: string;
  size?: number;
  encrypted_url?: string;
}

interface VideoFormat extends RawVideoFormat {
  quality: string;        // Guaranteed (filtered)
  category: 'video';      // Computed
  id: string;             // Computed
}
```

## Edge Cases Handled

### Missing Meta Object
- **Input**: `{ formats: {...} }` (no meta)
- **Output**: All meta fields default to null except `title: 'Untitled'`

### Empty Formats Arrays
- **Input**: `{ meta: {...}, formats: {} }`
- **Output**: `formats: { video: [], audio: [] }`

### Invalid Formats (Missing Quality)
- **Input**: `video: [{ type: 'mp4', size: 123 }]` (no quality)
- **Output**: Filtered out, `video: []`

### Null vs Undefined
- All undefined fields converted to null
- Consistent null handling in output

## Data Flow Diagram
```
Raw API Data
  ↓
Extract meta (with undefined checks)
  ↓
Apply defaults (|| operators)
  ↓
Compute platform from URL
  ↓
Inject standard fields
  ↓
Filter & map video formats
  ↓
Filter & map audio formats
  ↓
Construct VideoDetail
  ↓
Return normalized output
```
````

**Verification Checkpoint**:
- ✅ All normalizers documented?
- ✅ Data flow diagrams complete?
- ✅ Transformation steps clear?
- ✅ Intermediate types identified?
- ✅ Edge cases covered?

**Output**: Complete `docs/normalizers/` folder

---

#### Research 3: State Shape Deep Analysis (1 day intensive)

**Mục tiêu**: Document hoàn chỉnh **application state structure**.

**Câu hỏi cần trả lời**:
- State có bao nhiêu properties?
- Mỗi property type gì, purpose gì?
- Nested objects structure ra sao?
- State transitions như thế nào?
- Computed vs stored properties?
- Mutually exclusive states là gì?

**Cách thực hiện - Step by Step**:

##### Step 1: State Inventory (2 hours)

**Actions**:
1. Đọc `/src/script/features/downloader/state.js`
2. Copy entire `initialState` object
3. List TẤT CẢ top-level properties (30+)
4. Classify:
   - **Primitives**: string, boolean, number, null
   - **Objects**: nested state objects
   - **Arrays**: lists
   - **Maps**: object as hashmap (downloadTasks, conversionTasks)

**Initial Classification**:
```
Primitives (15):
- inputType
- isLoading
- isSubmitting
- error
- query
- originalQuery
- highlightedIndex
- showSuggestions
- isLoadingSuggestions
- showPasteButton
- showClearButton
- resultsLoading
- isFromListItemClick
- activeTab
- ...

Objects (5):
- searchPagination
- multifileSession
- viewingItem
- videoDetail
- galleryDetail
- activeConversion
- recentDownload

Arrays (3):
- suggestions
- results
- listCurrentUrl

Maps (2):
- downloadTasks
- conversionTasks
```

##### Step 2: Property Deep Dive (4 hours)

**Với MỖI state property, analyze**:

**Example: inputType**

**Type Analysis**:
- Runtime type: `'url' | 'keyword'` (string literal union)
- Default value: `'url'`
- Nullable: No

**Purpose Analysis**:
- Controls: Input mode (URL paste vs keyword search)
- UI dependency: Hides/shows suggestion dropdown
- Business logic: Determines which API to call (extract vs search)

**Update Patterns**:
```bash
grep -r "setState.*inputType" src/script/features/
```
Results:
- `input-form.js:138`: `setInputType('url')`
- `input-form.js:142`: `setInputType('keyword')`

**Who updates it**: `handleInput()` function in `input-form.js`
**Update triggers**: User typing in input field

**Usage Patterns**:
```bash
grep -r "state\.inputType" src/script/
grep -r "getState()\.inputType" src/script/
```
Results:
- `ui-renderer.js:45`: Check để show/hide suggestions
- `input-form.js:89`: Check để decide API call

**Example: searchPagination (Nested Object)**

**Structure**:
```javascript
searchPagination: {
  nextPageToken: string | null,
  hasNextPage: boolean,
  isLoadingMore: boolean,
  loadMoreCount: number
}
```

**Purpose**: Manage search result pagination state

**Lifecycle**:
- Created: When search results returned
- Updated: When "load more" clicked
- Cleared: When new search initiated

**Update pattern**:
```javascript
setState({
  searchPagination: {
    ...state.searchPagination,
    loadMoreCount: count + 1
  }
});
```

##### Step 3: State Transitions Mapping (2 hours)

**Document state machines**:

**User Flow: Paste URL**
```
Initial State
  → User pastes URL
  → inputType: 'url'
  → isLoading: true
  → error: null
  → [API call extractMedia]
  → videoDetail: {...}
  → isLoading: false
```

**User Flow: Search Keyword**
```
Initial State
  → User types keyword
  → inputType: 'keyword'
  → query: 'cat videos'
  → [Debounced]
  → isLoadingSuggestions: true
  → [API call getSuggestions]
  → suggestions: [...]
  → showSuggestions: true
  → isLoadingSuggestions: false
  → User submits
  → isLoading: true
  → [API call searchVideoV2]
  → results: [...]
  → isLoading: false
```

**Error Flow**
```
Any State
  → [API error]
  → error: 'Error message'
  → isLoading: false
  → [User types new input]
  → error: null
```

##### Step 4: Mutually Exclusive States (1 hour)

**Identify XOR relationships**:

**videoDetail XOR galleryDetail**:
- Rules: Never both at same time
- When `videoDetail` set → `galleryDetail = null`
- When `galleryDetail` set → `videoDetail = null`
- Enforcement: In `setVideoDetail()` and `setGalleryDetail()`

**results[] XOR viewingItem**:
- When showing search results → `viewingItem = null`
- When viewing specific item → `results = []`

**Implications for TypeScript**:
- Use discriminated unions?
- Or separate state branches?

##### Step 5: Create State Documentation

```
docs/state/
├── 00-state-shape.md           # Complete structure
├── 01-state-properties.md      # Each property detailed
├── 02-state-transitions.md     # State machines
└── 03-state-invariants.md      # Rules and constraints
```

**Template: State Property Doc**

````markdown
# State Property: inputType

## Type
```typescript
type InputType = 'url' | 'keyword';
```

## Purpose
Determines the input mode:
- `'url'`: User is inputting a video URL for extraction
- `'keyword'`: User is searching by keyword

## Default Value
```javascript
inputType: 'url'
```

## Update Triggers

### User Actions
- User types URL-like text → `'url'`
- User types search keyword → `'keyword'`

### Detection Logic
```javascript
if (DownloaderUtils.isLikelyUrl(inputValue)) {
  setInputType('url');
} else {
  setInputType('keyword');
}
```

## Update Locations

### Files
- `src/script/features/downloader/input-form.js`

### Functions
- `handleInput(event)` - Line 124

## Read Locations

### Components
- `ui-renderer.js` - Controls suggestion visibility
- `input-form.js` - Determines API call type

### Usage Examples
```javascript
// In ui-renderer.js
const state = getState();
if (state.inputType === 'url') {
  hideSuggestions();
}

// In input-form.js
if (inputType === 'url') {
  await service.extractMedia(url);
} else {
  await service.searchVideoV2(keyword);
}
```

## Related Properties
- `showSuggestions`: Hidden when inputType is 'url'
- `query`: Current input value
- `isLoading`: Set during API call

## Constraints
- Must be one of: 'url' or 'keyword'
- Cannot be null or undefined
- Auto-detected, not manually set by user

## Lifecycle
- **Created**: On app init with default 'url'
- **Updated**: On every input change
- **Cleared**: Never (always has value)

## State Transitions
```
'url' → User types URL pattern → Stay 'url'
'url' → User types non-URL → 'keyword'
'keyword' → User types URL pattern → 'url'
'keyword' → User types text → Stay 'keyword'
```

## TypeScript Model
```typescript
interface AppState {
  inputType: InputType;
  // ...
}

type InputType = 'url' | 'keyword';
```

## Validation Rules
- No validation needed (auto-detected)
- Always valid (one of two states)
````

**Verification Checkpoint**:
- ✅ All properties documented?
- ✅ State transitions mapped?
- ✅ Invariants identified?
- ✅ Nested objects fully described?
- ✅ Update/read patterns clear?

**Output**: Complete `docs/state/` folder

---

#### Research 4: Domain Entity Discovery (1 day intensive)

**Mục tiêu**: Xác định **domain entities và relationships** chính xác.

**Câu hỏi cần trả lời**:
- Có những entities nào?
- Relationships giữa entities?
- Shared properties giữa entities?
- Inheritance hay composition?
- Value objects vs entities?

**Cách thực hiện - Step by Step**:

##### Step 1: Entity Identification (3 hours)

**Đọc sources**:
- normalizers.js - outputs are entities
- state.js - state properties reference entities
- API responses - raw entities from backend

**List tất cả "things" trong domain**:

1. **Video** - Main media entity
2. **Gallery** - Collection of media items
3. **VideoMetadata** - Descriptive information
4. **VideoFormat** - Downloadable video format
5. **AudioFormat** - Downloadable audio format
6. **GalleryItem** - Single item in gallery
7. **SearchResultItem** - Search result entry
8. **DownloadTask** - Download operation state
9. **ConversionTask** - Conversion operation state
10. **MultifileSession** - Multi-video download session
11. **Suggestion** - Search suggestion string

**Initial classification**:
- **Entities** (have identity): Video, Gallery, MultifileSession
- **Value Objects** (no identity): VideoMetadata, VideoFormat, DownloadTask
- **DTOs**: SearchResultItem, Suggestion

##### Step 2: Entity Analysis (4 hours)

**Với MỖI entity**:

**Example: Video Entity**

**Properties**:
```javascript
{
  meta: VideoMetadata,
  formats: {
    video: VideoFormat[],
    audio: AudioFormat[]
  },
  completedAt?: number
}
```

**Required vs Optional**:
- Required: `meta`, `formats`
- Optional: `completedAt`

**Nested Types**:
- `meta`: Complex object (VideoMetadata)
- `formats.video`: Array of complex objects
- `formats.audio`: Array of complex objects

**Relationships**:
- **Video HAS-ONE VideoMetadata** (1:1)
- **Video HAS-MANY VideoFormat** (1:N)
- **Video HAS-MANY AudioFormat** (1:N)

**Lifecycle**:
- Created: When API extractMedia returns
- Updated: When metadata enhanced (background oEmbed)
- Deleted: When user clears or navigates away

**Example: VideoFormat Entity**

**Properties**:
```javascript
{
  id: string,
  quality: '720p' | '1080p' | ...,
  type: 'mp4' | 'webm' | ...,
  size?: number,
  url?: string,
  encrypted_url?: string,
  isConverted?: boolean,
  category: 'video'
}
```

**Shared with AudioFormat**:
- `id`, `size`, `url`, `encrypted_url`

**Unique to VideoFormat**:
- `quality` values (resolution-based)
- `type` values (video formats)

**Suggests**:
- Need base `Format` interface?
- Or separate VideoFormat/AudioFormat completely?

##### Step 3: Relationship Mapping (2 hours)

**Vẽ Entity Relationship Diagram**:

```
VideoMetadata
    ↓ (1:1)
   Video
   ↙    ↘
 (1:N)   (1:N)
VideoFormat  AudioFormat

Gallery
   ↓ (1:N)
GalleryItem

SearchResultItem (standalone, no relations)

DownloadTask
   ↓ (belongs to)
  Format (via formatId)

ConversionTask
   ↓ (belongs to)
  Format (via formatId)

MultifileSession (aggregate root)
   ↓ (manages)
  Multiple Downloads
```

**Cardinality**:
- Video → VideoMetadata: 1:1
- Video → VideoFormat: 1:N
- Video → AudioFormat: 1:N
- Gallery → GalleryItem: 1:N
- Format → DownloadTask: 1:1 (via formatId key)

**Foreign Keys/References**:
- `DownloadTask.formatId` → references specific VideoFormat or AudioFormat
- `ConversionTask.formatId` → references format

##### Step 4: Identify Shared Abstractions (2 hours)

**VideoFormat vs AudioFormat**:

**Shared properties**:
```
id: string
size: number
url: string
encrypted_url: string
category: 'video' | 'audio'
```

**Unique to VideoFormat**:
```
quality: VideoQuality
type: VideoType
```

**Unique to AudioFormat**:
```
quality: AudioQuality
type: AudioType
bitrate: string
```

**Decision**: Create base interface `BaseFormat`?

**Pros**: DRY, shared logic
**Cons**: May over-complicate simple structure

**Recommendation**: Separate interfaces, accept minor duplication for clarity.

**Video vs Gallery Metadata**:

Both have:
```
title: string
thumbnail: string
duration: number
author: string
```

**Decision**: Share `VideoMetadata` interface? Or separate `GalleryMetadata`?

**Analysis**:
- Gallery может have different metadata needs
- Better separate for flexibility

**DownloadTask vs ConversionTask**:

**DownloadTask**:
```
status: DownloadStatus
message: string
timestamp: string
```

**ConversionTask**:
```
state: ConversionState
statusText: string
progress: number
downloadUrl: string
error: string
abortController: AbortController
```

**Very different** - no shared base needed.

##### Step 5: Design Model Hierarchy (1 hour)

**Decisions**:

**Inheritance**:
- NOT using class inheritance (TypeScript interfaces)
- Using interface composition where needed

**Composition over inheritance**:
- `Video` composes `VideoMetadata` and `VideoFormat[]`
- Not extending base classes

**Type Unions**:
- `Format = VideoFormat | AudioFormat` (if needed for generic handling)
- `DetailView = VideoDetail | GalleryDetail` (mutually exclusive)

**Model organization**:
```
models/
├── domain/
│   ├── video.model.ts          # Video, VideoMetadata
│   ├── gallery.model.ts        # Gallery, GalleryItem
│   ├── format.model.ts         # VideoFormat, AudioFormat
│   ├── search.model.ts         # SearchResultItem
│   └── task.model.ts           # DownloadTask, ConversionTask
├── api/
│   ├── requests/
│   └── responses/
├── state/
│   └── app-state.model.ts
└── enums/
    ├── download-status.enum.ts
    ├── video-quality.enum.ts
    └── ...
```

##### Step 6: Create Entity Documentation

```
docs/domain/
├── 00-entity-catalog.md
├── 01-entity-relationships.md
├── 02-entity-lifecycle.md
├── video-entity.md
├── gallery-entity.md
├── format-entities.md
└── task-entities.md
```

**Verification Checkpoint**:
- ✅ All entities identified?
- ✅ Relationships clear and diagrammed?
- ✅ Shared abstractions analyzed?
- ✅ Model hierarchy designed?
- ✅ Organization decided?

**Output**: Complete `docs/domain/` folder

---

#### Research 5: Magic String Audit (0.5 day)

**Mục tiêu**: Find tất cả magic strings để **replace bằng enums**.

**Cách thực hiện**:

##### Step 1: Grep Common Patterns (2 hours)

**Search status strings**:
```bash
grep -r "'idle'" src/script/ | wc -l
grep -r "'loading'" src/script/ | wc -l
grep -r "'error'" src/script/ | wc -l
grep -r "'success'" src/script/ | wc -l
grep -r "'downloaded'" src/script/ | wc -l
```

**Search state strings**:
```bash
grep -r "'url'" src/script/
grep -r "'keyword'" src/script/
grep -r "'preparing'" src/script/
grep -r "'converting'" src/script/
grep -r "'ready'" src/script/
grep -r "'expired'" src/script/
```

**Search format strings**:
```bash
grep -r "'mp3'" src/script/
grep -r "'mp4'" src/script/
grep -r "'webm'" src/script/
grep -r "'720p'" src/script/
grep -r "'1080p'" src/script/
```

**Collect all findings**

##### Step 2: Categorize and Group (2 hours)

**Group 1: Download Status**
```
Values found:
- 'idle'
- 'loading'
- 'downloaded'
- 'error'

Usage context: downloadTasks state
```

**Group 2: Input Type**
```
Values found:
- 'url'
- 'keyword'

Usage context: inputType state
```

**Group 3: Media Format**
```
Values found:
Video: 'mp4', 'webm', 'avi', 'mov'
Audio: 'mp3', 'm4a', 'aac', 'opus'

Usage context: format.type
```

**Group 4: Video Quality**
```
Values found:
- '144p', '240p', '360p', '480p'
- '720p', '1080p', '1440p', '2160p', '4320p'

Usage context: videoFormat.quality
```

**Group 5: Audio Quality**
```
Values found:
- '32kbps', '64kbps', '128kbps'
- '192kbps', '256kbps', '320kbps'

Usage context: audioFormat.quality
```

**Group 6: Conversion State**
```
Values found:
- 'Idle'
- 'Converting'
- 'Success'
- 'Failed'
- 'Canceled'

Usage context: conversionTask.state
```

**Group 7: Multifile State**
```
Values found:
- 'preparing'
- 'converting'
- 'zipping'
- 'ready'
- 'expired'
- 'error'

Usage context: multifileSession.state
```

**Group 8: Platform**
```
Values found:
- 'youtube'
- 'tiktok'
- 'instagram'
- 'facebook'
- 'twitter'

Usage context: videoMetadata.platform
```

**Group 9: Active Tab**
```
Values found:
- 'video'
- 'audio'

Usage context: activeTab state
```

##### Step 3: Create Enum Catalog

```
docs/enums/
└── enum-catalog.md
```

**Template**:

```markdown
# Enum Catalog

## Enums to Create

### 1. DownloadStatus
**Purpose**: Download task status
**Values**:
- `idle` - Not started
- `loading` - In progress
- `downloaded` - Completed successfully
- `error` - Failed

**Usage**: `downloadTasks[formatId].status`

**TypeScript**:
```typescript
type DownloadStatus = 'idle' | 'loading' | 'downloaded' | 'error';
```

### 2. InputType
**Purpose**: Input mode
**Values**:
- `url` - URL input mode
- `keyword` - Keyword search mode

**Usage**: `state.inputType`

**TypeScript**:
```typescript
type InputType = 'url' | 'keyword';
```

### 3. VideoType
**Purpose**: Video file format
**Values**:
- `mp4`
- `webm`
- `avi`
- `mov`

**Usage**: `videoFormat.type`

### 4. AudioType
**Purpose**: Audio file format
**Values**:
- `mp3`
- `m4a`
- `aac`
- `opus`

**Usage**: `audioFormat.type`

### 5. VideoQuality
**Purpose**: Video resolution
**Values**:
- `144p`, `240p`, `360p`, `480p`
- `720p`, `1080p`, `1440p`, `2160p`, `4320p`

**Usage**: `videoFormat.quality`

### 6. AudioQuality
**Purpose**: Audio bitrate
**Values**:
- `32kbps`, `64kbps`, `128kbps`
- `192kbps`, `256kbps`, `320kbps`

**Usage**: `audioFormat.quality`

### 7. ConversionState
**Purpose**: Conversion task state
**Values**:
- `Idle`
- `Converting`
- `Success`
- `Failed`
- `Canceled`

**Usage**: `conversionTask.state`

### 8. MultifileState
**Purpose**: Multifile session state
**Values**:
- `preparing`
- `converting`
- `zipping`
- `ready`
- `expired`
- `error`

**Usage**: `multifileSession.state`

### 9. Platform
**Purpose**: Social media platform
**Values**:
- `youtube`
- `tiktok`
- `instagram`
- `facebook`
- `twitter`

**Usage**: `videoMetadata.platform`

### 10. MediaCategory
**Purpose**: Format category
**Values**:
- `video`
- `audio`

**Usage**: `format.category`, `activeTab`

## Migration Strategy
1. Create enum files
2. Replace string literals trong models
3. Update switch statements
4. Add validation cho runtime values
```

**Verification Checkpoint**:
- ✅ All magic strings found?
- ✅ Categorized logically?
- ✅ Complete value sets identified?
- ✅ Usage contexts documented?

**Output**: Complete `docs/enums/enum-catalog.md`

---

### Quy Trình Thực Hiện Phase 1

**Workflow độc nhất: "Research-First, Model-Second"**

**Nguyên tắc**: KHÔNG viết một dòng TypeScript code nào cho đến khi research **100% complete**.

#### Step 1: Complete ALL Research (5-6 days)

**Actions**:
1. Execute Research 1: API Contract Discovery (2 days)
2. Execute Research 2: Normalizer Reverse Engineering (1.5 days)
3. Execute Research 3: State Shape Analysis (1 day)
4. Execute Research 4: Domain Entity Discovery (1 day)
5. Execute Research 5: Magic String Audit (0.5 day)

**Output**: All documentation in `docs/`

**Checkpoint**:
- ✅ `docs/api-contracts/` complete (all APIs)
- ✅ `docs/normalizers/` complete (all transformations)
- ✅ `docs/state/` complete (complete state)
- ✅ `docs/domain/` complete (entities + ER diagram)
- ✅ `docs/enums/` complete (magic string catalog)
- ✅ User review and sign-off

#### Step 2: Model Architecture Design (1 day)

**Based on research, design**:

**Folder Structure Decision**:
```
packages/core/src/models/
├── api/
│   ├── requests/
│   │   ├── extract-media.request.ts
│   │   ├── search-video.request.ts
│   │   └── index.ts
│   ├── responses/
│   │   ├── extract-media.response.ts (raw)
│   │   ├── search-video.response.ts (raw)
│   │   └── index.ts
│   └── dtos/
│       ├── video-detail.dto.ts (normalized)
│       ├── search-results.dto.ts
│       └── index.ts
├── domain/
│   ├── video.model.ts
│   ├── gallery.model.ts
│   ├── format.model.ts
│   ├── search.model.ts
│   ├── task.model.ts
│   └── index.ts
├── state/
│   ├── app-state.model.ts
│   └── index.ts
├── enums/
│   ├── download-status.enum.ts
│   ├── input-type.enum.ts
│   ├── video-quality.enum.ts
│   ├── audio-quality.enum.ts
│   ├── conversion-state.enum.ts
│   ├── platform.enum.ts
│   └── index.ts
└── index.ts (barrel export)
```

**Model Creation Order Decision**:
1. Enums first (foundation)
2. Domain models (entities)
3. API models (requests/responses/DTOs)
4. State models (depends on domain)

**Architecture Decisions Document**:
- Why this structure?
- Naming conventions
- Export strategy
- Dependency rules (models don't depend on services)

#### Step 3: Setup Core Package Skeleton (2 hours)

**Actions**:
1. Create `packages/core/package.json`
2. Create `packages/core/vite.config.ts` (library build)
3. Create `packages/core/tsconfig.json` (extends base)
4. Create folder structure (empty folders from Step 2)
5. Run `pnpm install` in workspace

**Checkpoint**:
- ✅ Core package recognized by pnpm
- ✅ TypeScript compiler setup
- ✅ Folder structure exists
- ✅ Ready for model files

#### Step 4: Create Enums (Foundation Layer) (1 day)

**Process**:
- Based on `docs/enums/enum-catalog.md`
- Create one enum file per category
- Use TypeScript string literal unions (not enum keyword)
- Export from `enums/index.ts`

**Quality checks**:
- ✅ All enum values from research
- ✅ JSDoc comments explaining usage
- ✅ TypeScript compiles: `pnpm --filter @downloader/core build`

#### Step 5: Create Domain Models (2 days)

**Process**:
- Based on `docs/domain/` documentation
- Create entity interfaces
- Establish relationships via property types
- Use enums from Step 4

**Quality checks**:
- ✅ Match entity documentation
- ✅ Relationships correctly typed
- ✅ JSDoc comments on all interfaces
- ✅ No `any` types
- ✅ TypeScript compiles

#### Step 6: Create API Models (2 days)

**Process**:
- Based on `docs/api-contracts/` documentation
- Create request models (one per API)
- Create raw response models (handle variants)
- Create DTO models (normalized outputs)

**Quality checks**:
- ✅ Match API contract docs 100%
- ✅ All response variants covered
- ✅ Request/response pairs complete
- ✅ JSDoc with examples
- ✅ TypeScript compiles

#### Step 7: Create State Models (1 day)

**Process**:
- Based on `docs/state/` documentation
- Create `AppState` interface
- Create nested state type interfaces
- Use domain models and enums

**Quality checks**:
- ✅ Match state shape docs 100%
- ✅ All properties typed correctly
- ✅ Nested objects properly typed
- ✅ Optional vs required correct
- ✅ TypeScript compiles

#### Step 8: Add Type Guards (1 day)

**Process**:
- Create runtime validators for domain models
- Type narrowing functions
- Use in services later for runtime validation

**Example**:
```typescript
function isVideoDetail(data: unknown): data is VideoDetail {
  // Runtime checks
}
```

**Quality checks**:
- ✅ Type guards for main domain entities
- ✅ Test with sample data (manual)
- ✅ TypeScript narrows types correctly

#### Step 9: Documentation (0.5 day)

**Actions**:
- Write `packages/core/src/models/README.md`
- Explain model architecture
- Document organization
- Provide usage examples
- Link to research docs

**Checkpoint**:
- ✅ README clear and helpful
- ✅ Examples accurate

### Tiêu Chí Thành Công Phase 1

#### Research Completeness
- ✅ `docs/api-contracts/` - all APIs documented (10+ files)
- ✅ `docs/normalizers/` - all transformations documented (5+ files)
- ✅ `docs/state/` - complete state shape (4 files)
- ✅ `docs/domain/` - entity catalog and ER diagram (6+ files)
- ✅ `docs/enums/` - magic string catalog (1 file)

#### Model Quality
- ✅ Zero `any` types trong models
- ✅ All models có JSDoc comments
- ✅ Type guards functional
- ✅ TypeScript compiles without errors
- ✅ ESLint passes

#### Verification
- ✅ `pnpm --filter @downloader/core build` success
- ✅ Models match API contracts 100%
- ✅ Models match state shape 100%
- ✅ Domain models match ER diagram
- ✅ Enums cover all magic strings

#### Documentation
- ✅ README.md clear
- ✅ Research docs comprehensive
- ✅ Architecture decisions documented

#### Time Box
**Maximum**: 10-12 days

**Breakdown**:
- Research: 5-6 days
- Design: 1 day
- Implementation: 3-4 days
- Documentation: 0.5 day
- Buffer: 0.5-1 day

---

## VI. PHASE 2: MIGRATE CORE PACKAGE ⚠️ OUTDATED - SEE ACTUAL IMPLEMENTATION

**⚠️ WARNING: This section is OUTDATED and kept for historical reference only.**

**The actual implementation is COMPLETELY DIFFERENT from this plan:**
- ❌ **NOT USED:** Flat service structure (services/api.service.ts)
- ❌ **NOT USED:** Direct JS→TS migration approach
- ❌ **NOT USED:** Batch migration strategy described below

**✅ ACTUAL IMPLEMENTATION (See REFACTOR_COMPARISON.md):**
- **Domain Layer:** VerifiedServices as main API for site projects
- **Service Layer:** V1, V2, Public-API organized services with OOP BaseService
- **HTTP Layer:** Axios-based HTTP client with interceptors
- **Verification System:** DomainVerifier with policies and JWT extraction
- **JWT Storage:** Abstracted stores (LocalStorage, InMemory, Custom)

**For accurate information, read:**
- `/packages/core/AI_CLI_ONBOARDING.md` - Current task
- `/packages/core/DOMAIN_LAYER_GUIDE.md` - API documentation
- `/packages/core/REFACTOR_COMPARISON.md` - Architecture explanation

---

### Mục Tiêu Phase (ORIGINAL PLAN - OUTDATED)

Migrate toàn bộ business logic từ `/src/script/libs/` sang `packages/core/` với TypeScript.

### Thực Trạng Hiện Tại

Core logic trong `/src/script/libs/`:
```
libs/
├── downloader-lib-standalone/
│   ├── api/
│   │   ├── service.js              # Main API service (20+ methods)
│   │   ├── client.js               # HTTP client
│   │   ├── normalizers.js          # Data transformations
│   │   ├── endpoints.js            # API endpoint configs
│   │   ├── verifier.js             # Response verification
│   │   └── youtube/                # YouTube-specific
│   ├── components/
│   │   └── progress-bar.js
│   ├── orchestration/
│   │   ├── multifile/              # Multifile download logic
│   │   └── sequential.js
│   ├── processors/
│   │   └── format-processor.js
│   ├── transfer/
│   │   └── strategies/             # Download strategies
│   ├── utils/
│   │   ├── common.js
│   │   └── multifile-utils.js
│   └── mock-data/
│       └── fake-data-generator.js
├── captcha-core/
│   ├── index.js
│   ├── captcha-ui.js               # CAPTCHA modal UI
│   └── jwt.js
├── scroll-core/
│   ├── scroll-manager.js
│   └── scroll-behavior.js
└── firebase/
    ├── firebase-init.js
    └── firebase-loader.js
```

**Đặc điểm**:
- Vanilla JS, no types
- Pure business logic (no DOM trong api/, utils/, orchestration/)
- Some UI components (captcha modal, progress bar)
- Complex async workflows
- CAPTCHA integration patterns

### Output Phase 2

`packages/core/` hoàn chỉnh:
```
packages/core/src/
├── models/                    # ✅ Done in Phase 1
├── services/
│   ├── api.service.ts         # Main API service (typed)
│   ├── http-client.service.ts # HTTP client (typed)
│   ├── normalizers.service.ts # Normalizers (typed)
│   └── index.ts
├── utils/
│   ├── common.utils.ts
│   ├── multifile.utils.ts
│   └── index.ts
├── orchestration/
│   ├── multifile/
│   └── sequential.ts
├── captcha/
│   ├── captcha.service.ts     # Logic only (no UI)
│   ├── jwt.service.ts
│   └── index.ts
├── scroll/
│   ├── scroll-manager.ts
│   └── scroll-behavior.ts
└── index.ts                   # Barrel export
```

**Đặc điểm**:
- ✅ Full TypeScript
- ✅ Uses models from Phase 1
- ✅ NO DOM dependencies trong core services
- ✅ Clean exports
- ✅ Backward compatible API

### Vấn Đề & Challenges

#### Challenge 1: Migration Order - Dependency Hell

**Vấn đề**:
Service.js depends on:
- client.js (HTTP client)
- normalizers.js (data transformation)
- endpoints.js (config)
- utils/common.js (utilities)
- captcha-core/jwt.js (auth)

Cannot migrate service.js trước dependencies.

**Risk**:
- Migrate wrong order → import errors
- Circular dependencies
- Build failures

**Impact**:
- Wasted time backtracking
- Frustration
- Hard to debug

#### Challenge 2: Complex Service Methods

**Vấn đề**:
Service methods có nhiều optional params, conditional logic:

```javascript
async function extractMedia(url, protectionPayload = {}) {
  const headers = {};
  if (protectionPayload.jwt) {
    headers['Authorization'] = `Bearer ${protectionPayload.jwt}`;
  }

  const response = await http.request({...});

  if (response.jwt) saveJwt(response.jwt);

  let dataToNormalize = response;
  if (response.success && response.data) {
    dataToNormalize = response.data;
    if (dataToNormalize.status === 'ok' && dataToNormalize.data) {
      dataToNormalize = dataToNormalize.data;
    }
  }

  return normalizers.normalizeVideoDetail(dataToNormalize);
}
```

**Typing challenges**:
- Optional params typing
- Response unwrapping logic typing
- Return type based on normalizer

#### Challenge 3: CAPTCHA Integration Pattern

**Vấn đề**:
`withCaptchaProtection()` wrapper function:
- Wraps service methods
- Auto-retries với CAPTCHA on JWT failure
- Complex higher-order function

**Typing**:
- Generic function signatures
- Preserving method types through wrapper
- Error handling types

#### Challenge 4: Backward Compatibility

**Vấn đề**:
Existing features code imports từ libs:
```javascript
import { createVerifiedService } from '../../libs/downloader-lib-standalone/index.js';
```

After migration:
```typescript
import { createVerifiedService } from '@downloader/core';
```

**Risk**:
- Breaking changes in API
- Method signature changes
- Import path changes → features break

### Research Process

#### Research 1: Dependency Mapping (1 day)

**Mục tiêu**: Xác định **chính xác migration order**.

**Cách thực hiện**:

##### Step 1: List All Files
```bash
find src/script/libs/downloader-lib-standalone -name "*.js" -type f > files-list.txt
```

##### Step 2: Analyze Imports Per File

**Với MỖI file, document**:
- What it imports (dependencies)
- What depends on it (dependents)

**Example: api/service.js**
```
Imports:
- ./client.js
- ./normalizers.js
- ./endpoints.js
- ../utils/common.js
- ../../captcha-core/jwt.js

Imported by:
- ../index.js (package export)
- (features code)
```

##### Step 3: Build Dependency Graph

```
utils/common.js (no deps) → Level 0
    ↓
captcha-core/jwt.js (depends utils?) → Level 1
    ↓
api/endpoints.js (config only) → Level 1
    ↓
api/client.js (depends utils, endpoints) → Level 2
    ↓
api/normalizers.js (depends models, utils) → Level 2
    ↓
api/service.js (depends client, normalizers, endpoints, jwt) → Level 3
    ↓
index.js (exports service) → Level 4
```

##### Step 4: Create Migration Batches

```
Batch 1 (Level 0-1): Zero/minimal dependencies
- utils/common.js
- utils/multifile-utils.js
- api/endpoints.js
- captcha-core/jwt.js

Batch 2 (Level 2): Depends on Batch 1
- api/client.js
- api/normalizers.js

Batch 3 (Level 3): Main services
- api/service.js
- captcha-core/index.js

Batch 4: Advanced features
- orchestration/
- processors/
- transfer/
```

**Output Document**: `docs/phase2/migration-order.md`

#### Research 2: Service Method Signatures (1 day)

**Mục tiêu**: Understand every service method để type correctly.

**Cách thực hiện**:

**Với MỖI method trong service.js**:

1. **Document function signature**:
   ```
   extractMedia(url: string, protectionPayload?: object)
   ```

2. **Document param types**:
   - url: string, required
   - protectionPayload: object, optional
     - jwt?: string
     - captcha?: object

3. **Document return type**:
   - Returns: `Promise<VideoDetail>`
   - From: normalizer output

4. **Document side effects**:
   - Saves JWT if present
   - May trigger CAPTCHA
   - No state mutations

5. **Document error handling**:
   - Network errors → throw
   - API errors → throw with message
   - CAPTCHA needed → wrapper handles

**Output Document**: `docs/phase2/service-signatures.md`

#### Research 3: Normalizer Test Cases (0.5 day)

**Mục tiêu**: Create test data để **verify migration correctness**.

**Cách thực hiện**:

**Với mỗi normalizer**:

1. **Create sample input** (raw API response)
2. **Document expected output** (normalized)
3. **Edge cases**:
   - Missing fields
   - Null values
   - Empty arrays

**Output**: Test data files in `docs/phase2/test-data/`

### Quy Trình Thực Hiện Phase 2

#### Step 1: Complete Dependency Analysis (1 day)
- Execute Research 1
- Create migration order document
- Get clear batches

#### Step 2: Migrate Batch 1 - Utilities (1 day)

**Process per file**:
1. Copy `utils/common.js` → `packages/core/src/utils/common.utils.ts`
2. Rename .js → .ts
3. Add type signatures:
   - Function params
   - Return types
   - Internal variables
4. Replace magic strings với enums
5. Add JSDoc comments
6. Test: `pnpm --filter @downloader/core build`

**Quality checks**:
- ✅ TypeScript compiles
- ✅ No `any` types (or explicit temporary `any` marked)
- ✅ ESLint passes

**Files to migrate**:
- utils/common.js → common.utils.ts
- utils/multifile-utils.js → multifile.utils.ts
- api/endpoints.js → endpoints.ts (config only, easy)
- captcha-core/jwt.js → captcha/jwt.service.ts

#### Step 3: Migrate Batch 2 - API Foundation (1.5 days)

**HTTP Client Migration**:
1. Copy `api/client.js` → `services/http-client.service.ts`
2. Type request/response:
   - Use models from Phase 1
   - Request config interface
   - Response generic type
3. Error handling types
4. AbortController types (built-in DOM types)
5. Test compilation

**Normalizers Migration**:
1. Copy `api/normalizers.js` → `services/normalizers.service.ts`
2. Add input types (raw API response models)
3. Add output types (DTO/domain models)
4. Maintain transformation logic exactly
5. Use enums instead of magic strings
6. Test với sample data (manual)

#### Step 4: Migrate Batch 3 - Main Service (2 days)

**API Service Migration**:
1. Copy `api/service.js` → `services/api.service.ts`
2. Type all methods:
   - Use request models
   - Use response models
   - Use DTO models as returns
3. Use typed HTTP client
4. Use typed normalizers
5. Maintain exact method signatures (backward compat)
6. Test: imports từ features code

**CAPTCHA Service**:
1. Copy `captcha-core/index.js` → `captcha/captcha.service.ts`
2. Separate logic from UI:
   - Logic stays in core
   - UI modal goes to ui-shared (Phase 3)
3. Type wrapper function generics
4. Test integration

#### Step 5: Migrate Supporting Libs (2 days)

**Orchestration**:
- Multifile logic
- Sequential processing
- SSE handling

**Scroll**:
- Scroll manager
- Scroll behavior

**Firebase** (if used):
- Firebase initialization
- Firebase loader

#### Step 6: Create Clean Exports (0.5 day)

**`packages/core/src/index.ts`**:
```typescript
// Models
export * from './models';

// Services
export { ApiService } from './services/api.service';
export { HttpClient } from './services/http-client.service';
export * from './services/normalizers.service';

// Utils
export * from './utils';

// Captcha
export * from './captcha';

// Scroll
export * from './scroll';

// Orchestration
export * from './orchestration';
```

**Checkpoint**:
- ✅ Clean, organized exports
- ✅ No internal implementation leaked

#### Step 7: Backward Compatibility Check (0.5 day)

**Test**:
1. Try importing từ features code (old JS)
2. Verify method signatures match
3. Verify types don't break JS usage

**If breaks**:
- Adjust types to be compatible
- Add compatibility layer if needed

### Tiêu Chí Thành Công Phase 2

#### Functional
- ✅ `pnpm --filter @downloader/core build` success
- ✅ `pnpm --filter @downloader/core lint` pass
- ✅ All services migrated to TypeScript
- ✅ All utils migrated to TypeScript

#### Type Safety
- ✅ Zero `any` types (except marked temporary)
- ✅ All functions have type signatures
- ✅ Models used throughout
- ✅ Enums replace magic strings

#### Quality
- ✅ JSDoc comments on public APIs
- ✅ Organized exports
- ✅ No circular dependencies

#### Compatibility
- ✅ Existing code can import (may need adjustments)
- ✅ Method signatures unchanged
- ✅ Behavior unchanged

#### Time Box
**Maximum**: 8-9 days

---

## VI.B. PHASE 2 - ACTUAL IMPLEMENTATION (CURRENT)

**This section documents what was ACTUALLY implemented (not the plan above).**

### Architecture Overview

**Clean Layered Architecture:**
```
Site Projects
    ↓ imports
Domain Layer (verified-services.ts)
    ↓ uses
Service Layer (base-service.ts + implementations)
    ↓ uses
HTTP Client Layer
    ↓ calls
Remote Backend API
```

### Phase 2 Sub-Phases (ACTUAL)

#### Phase 2A: HTTP Client ✅ DONE
**File:** `/packages/core/src/http/http-client.ts`

**Implementation:**
- Axios-based HTTP client
- Request/response interceptors
- TypeScript typed interfaces
- AbortController support
- Error handling with custom errors

**Key Features:**
```typescript
interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

class HttpClient {
  async request<T>(config: RequestConfig): Promise<T>
  // Interceptor support
  // Error transformation
}
```

#### Phase 2B: BaseService (OOP Pattern) ✅ DONE
**File:** `/packages/core/src/services/base/base-service.ts`

**Pattern:** Abstract Class Inheritance (OOP)

**Key Innovation:**
- All services extend BaseService
- **Centralized JWT handling** (auto-extract, auto-inject)
- **Centralized CAPTCHA handling**
- **Response cleaning** (remove JWT field before returning)
- **makeRequest()** - all HTTP calls go through here
- **makeRequestWithInternalJwt()** - auto-inject internal JWT

**Benefits over old functional pattern:**
- ✅ No duplicate JWT code across 11 services
- ✅ No duplicate CAPTCHA code
- ✅ Single source of truth for protection logic
- ✅ TypeScript enforces correct patterns
- ✅ 41% less code, 100% less duplication

**See:** `REFACTOR_COMPARISON.md` for detailed comparison

#### Phase 2C: Core Services ✅ DONE

**V1 Services** (`/services/v1/`):
1. **SearchService** - Search videos by keyword
2. **MediaService** - Extract media info
3. **ConversionService** - Convert media formats
4. **PlaylistService** - Extract playlists
5. **DecryptService** - Decode URLs
6. **FeedbackService** - User feedback
7. **MultifileService** - Multifile downloads

**V2 Services** (`/services/v2/`):
1. **SearchV2Service** - Paginated search
2. **QueueService** - Video queue management
3. **YouTubeDownloadService** - Direct downloads

**Public API** (`/services/public-api/`):
1. **YouTubePublicApiService** - Public metadata

**Pattern:**
```
/services/{version}/
  ├── interfaces/         # Service contracts (IServiceName)
  └── implementations/    # Service classes + factory functions
```

**Each service:**
- Extends `BaseService`
- Implements interface contract
- Exported via factory function: `createServiceName()`
- Zero duplicate code (all in BaseService)

#### Phase 2D: Domain Layer ✅ DONE

**Files:**
```
/domain/
├── verified-services.ts           # Main API
├── verification/
│   ├── verifier.ts                # DomainVerifier class
│   ├── types.ts                   # VerifiedResult<T>
│   ├── messages.ts                # Error messages
│   └── policies.ts                # Verification policies
└── jwt/
    └── jwt-store.interface.ts     # Storage abstractions
```

**Key Components:**

**1. DomainVerifier:**
- **Extracts JWT** from service responses
- **Saves JWT** to storage (localStorage/memory/custom)
- **Verifies responses** with policies
- **Returns standardized** `VerifiedResult<T>`

**2. VerifiedServices:**
- **Main API** for site projects
- **14 methods** (Phase 2E adds 3 more → 17 total)
- **Auto JWT injection** from storage
- **Generic wrap function** for all methods
- **Type-safe** with full TypeScript support

**3. JWT Stores:**
- `LocalStorageJwtStore` - Browser localStorage
- `InMemoryJwtStore` - In-memory (SSR, testing)
- `CustomJwtStore` - User-defined (Redux, Cookies, etc.)
- **Namespaced keys** to prevent collisions

**4. Verification Policies:**
- Per-method policies
- Custom validation logic
- Standardized error codes
- Human-readable messages

**Flow Example:**
```typescript
// 1. Site project calls
const result = await api.extractMedia({ url: '...' });

// 2. VerifiedServices auto-injects JWT from storage
// 3. Service layer calls backend
// 4. Backend returns { data, jwt: 'new-token' }
// 5. Verifier extracts JWT → saves to storage
// 6. Verifier removes jwt field from response
// 7. Verifier runs policy verification
// 8. Returns VerifiedResult<T> to site project

if (result.ok) {
  console.log(result.data); // Clean, verified data
}
```

**See:** `DOMAIN_LAYER_GUIDE.md` for full API documentation

#### Phase 2E: Missing Services 🔄 IN PROGRESS

**Goal:** Add remaining 3 methods to Domain Layer

**Missing:**
1. **IMultifileService** (2 methods)
   - `startMultifileSession()` - WITH protection
   - `getMultifileStatus()` - NO protection

2. **IYouTubePublicApiService** (1 method)
   - `getMetadata()` - NO protection

**Current:** 14 methods → **Target:** 17 methods

**See:** `AI_CLI_ONBOARDING.md` for implementation steps

### Actual File Structure

```
packages/core/src/
├── domain/
│   ├── index.ts
│   ├── verified-services.ts
│   ├── verification/
│   │   ├── verifier.ts
│   │   ├── types.ts
│   │   ├── messages.ts
│   │   └── policies.ts
│   └── jwt/
│       └── jwt-store.interface.ts
│
├── services/
│   ├── base/
│   │   ├── base-service.ts
│   │   └── index.ts
│   ├── v1/
│   │   ├── interfaces/
│   │   │   ├── search.interface.ts
│   │   │   ├── media.interface.ts
│   │   │   ├── conversion.interface.ts
│   │   │   ├── playlist.interface.ts
│   │   │   ├── decrypt.interface.ts
│   │   │   ├── feedback.interface.ts
│   │   │   └── multifile.interface.ts
│   │   ├── implementations/
│   │   │   ├── search.service.ts
│   │   │   ├── media.service.ts
│   │   │   ├── conversion.service.ts
│   │   │   ├── playlist.service.ts
│   │   │   ├── decrypt.service.ts
│   │   │   ├── feedback.service.ts
│   │   │   └── multifile.service.ts
│   │   └── index.ts
│   ├── v2/
│   │   ├── interfaces/
│   │   │   ├── searchv2.interface.ts
│   │   │   ├── queue.interface.ts
│   │   │   └── youtube-download.interface.ts
│   │   ├── implementations/
│   │   │   ├── searchv2.service.ts
│   │   │   ├── queue.service.ts
│   │   │   └── youtube-download.service.ts
│   │   └── index.ts
│   ├── public-api/
│   │   ├── interfaces/
│   │   │   └── public-api.interface.ts
│   │   ├── implementations/
│   │   │   └── public-api.service.ts
│   │   └── index.ts
│   └── types/
│       └── protection.types.ts
│
├── http/
│   ├── http-client.ts
│   └── index.ts
│
├── models/
│   ├── dto/                    # Domain Transfer Objects
│   │   ├── search.dto.ts
│   │   ├── media.dto.ts
│   │   └── ...
│   └── remote/                 # Remote API types
│       ├── v1/
│       │   ├── requests/
│       │   └── responses/
│       └── v2/
│           ├── requests/
│           └── responses/
│
└── index.ts                    # Main barrel export
```

### Success Criteria (Actual)

**✅ Completed:**
- Full TypeScript with strict typing
- Clean layered architecture
- OOP BaseService pattern eliminates duplication
- Domain Layer as single API for site projects
- JWT auto-extraction and auto-injection
- Verification system with policies
- Flexible storage abstractions
- 14 verified API methods functional

**🔄 In Progress:**
- Phase 2E: Add 3 remaining methods (Multifile + YouTubePublicApi)

**📊 Metrics:**
- Code reduction: 41% less code vs old pattern
- Duplication: 0% (vs 100+ lines duplicated in old pattern)
- Type coverage: 100%
- Build success: ✅ `pnpm --filter @downloader/core build`

### Key Learnings

**Why Different from Original Plan?**

1. **Domain Layer was not planned** - Added for better site project integration
2. **OOP pattern was not planned** - Emerged as solution to duplication
3. **Verification system was not planned** - Added for standardized error handling
4. **JWT abstraction was not planned** - Added for flexibility

**Advantages of Actual Implementation:**
- ✅ Better separation of concerns
- ✅ Easier to maintain (no duplication)
- ✅ Easier for site projects to use
- ✅ Type-safe throughout
- ✅ Flexible and extensible

---

## VII. PHASE 3: MIGRATE UI-SHARED PACKAGE

### Mục Tiêu Phase

Migrate UI components từ `/src/script/ui-components/` sang `packages/ui-shared/` với TypeScript.

### Thực Trạng Hiện Tại

```
src/script/ui-components/
├── modal/
│   ├── conversion-modal.js       # Conversion UI + logic
│   └── expire-modal.js           # Expiration warning modal
├── search-result-card/
│   ├── search-result-card.js     # Result card renderer
│   ├── skeleton-card.js          # Loading skeleton
│   └── card-utils.js             # Helper utilities
└── suggestion-dropdown/
    └── suggestion-renderer.js    # Suggestion list UI
```

### Output Phase 3

```
packages/ui-shared/src/
├── components/
│   ├── modal/
│   │   ├── conversion-modal.ts
│   │   └── expire-modal.ts
│   ├── search-result-card/
│   │   ├── search-result-card.ts
│   │   ├── skeleton-card.ts
│   │   └── card-utils.ts
│   └── suggestion-dropdown/
│       └── suggestion-renderer.ts
├── state/
│   └── state-manager.ts         # Generic state manager
└── index.ts
```

### Vấn Đề & Challenges

#### Challenge 1: DOM Types Integration
- HTMLElement types
- Event handler types
- querySelector return types nullable

#### Challenge 2: Component Props Typing
- Components receive data từ state
- Props must match state models
- Optional vs required props

#### Challenge 3: State Manager Generics
- Need generic state manager
- Type-safe setState/getState
- Callback typing

### Research Process

#### Research 1: Component Inventory (0.5 day)
- List all UI components
- Document props
- Document DOM interactions
- Classify: truly shared vs app-specific

### Quy Trình Thực Hiện Phase 3

(Similar structure to Phase 2, adapted for UI components)

### Tiêu Chí Thành Công Phase 3

- ✅ UI components migrated to TypeScript
- ✅ DOM types properly annotated
- ✅ Component props typed
- ✅ State manager generic and typed

**Time Box**: 3-4 days

---

## VIII. PHASE 4: MIGRATE APP

### Mục Tiêu Phase

Build first app `yt1s-test-monorepo` using packages.

### Process Overview

1. Setup app package structure
2. Copy HTML, CSS from src/
3. Migrate features to TypeScript
4. Create main.ts entry point
5. Test functionality

**Time Box**: 7-8 days

---

## IX. PHASE 5: CI/CD SETUP

### Mục Tiêu

GitHub Actions workflows for monorepo.

### Key Requirements

- Lint on PR
- Build all packages
- Deploy only changed apps (paths filter)
- No secrets hardcoded

**Time Box**: 1-2 days

---

## X. PHASE 6: STRICT MODE & CLEANUP

### Mục Tiêu

- Enable `strict: true`
- Remove all `any`
- Final cleanup

**Time Box**: 3-4 days

---

## XI. TIMELINE & MILESTONES

### Original Estimate vs Actual

| Phase | Original Estimate | Status | Actual Time | Notes |
|-------|------------------|--------|-------------|-------|
| 0: Foundation | 2-3 days | ✅ DONE | ~2 days | Monorepo structure, pnpm workspace |
| 1: Model Layer | 10-12 days | ✅ DONE | ~10 days | DTO, Remote types, Application models |
| 2A: HTTP Client | Part of Phase 2 | ✅ DONE | ~1 day | Axios-based HTTP client |
| 2B: Base Service | Part of Phase 2 | ✅ DONE | ~1 day | Abstract BaseService class |
| 2C: Core Services | Part of Phase 2 | ✅ DONE | ~3 days | V1, V2, Public API services |
| 2D: Domain Layer | Part of Phase 2 | ✅ DONE | ~2 days | VerifiedServices, Verifier, JWT stores |
| 2E: Add Missing Services | Not planned | ✅ DONE | ~0.5 day | Multifile, YouTubePublicApi - 17/17 methods |
| 3A: UI-Shared (Core) | Part of Phase 3 | ✅ DONE | ~1 day | scroll + captcha migrated to TypeScript |
| 3B: UI-Shared (Components) | 3-4 days | ⏸️ PENDING | - | Remaining UI components |
| 4: App | 7-8 days | ⏸️ PENDING | - | Planned |
| 5: CI/CD | 1-2 days | ⏸️ PENDING | - | Planned |
| 6: Strict Mode | 3-4 days | ⏸️ PENDING | - | Planned |

**Progress Summary:**
- **Completed:** Phase 0, 1, 2A-2E, 3A (~20 days actual vs 20-24 days estimate)
- **In Progress:** None
- **Remaining:** Phase 3B, 4-6 (~13-17 days estimate)

**Total Original Estimate**: 34-42 days (7-8 weeks)
**Total Actual + Remaining**: ~33-38 days

### Key Achievements

**Phase 0-3A Delivered:**
- ✅ TypeScript monorepo infrastructure
- ✅ Complete type system (DTO, Remote, Application models)
- ✅ HTTP client with interceptors
- ✅ BaseService with JWT/CAPTCHA support
- ✅ 11 services implemented (V1, V2, Public API, Multifile, YouTubePublicApi)
- ✅ **Domain Layer** - Main API with 17/17 methods
- ✅ JWT storage abstractions (LocalStorage, InMemory, Custom)
- ✅ Response verification with policies
- ✅ **UI-Shared Package** - scroll + captcha utilities (TypeScript)
- ✅ Removed JWT duplication (captcha-core/jwt.js)

**Current Status:**
- ✅ Phase 2E: Complete - All 17 API methods ready
- ✅ Phase 3A: Complete - Core UI utilities migrated (scroll + captcha)

**Next Steps:**
- ⏸️ Phase 3B: Migrate remaining UI components (modals, cards, dropdowns)
- ⏸️ Phase 4: Migrate first app to use packages

---

## END OF PLAN

This is a **strategic planning document** - no code implementation, only:
- ✅ Deep analysis of current state
- ✅ Clear outputs for each phase
- ✅ Identified challenges and risks
- ✅ Detailed research processes
- ✅ Step-by-step workflows
- ✅ Success criteria
- ✅ Time estimates

Ready for execution with full understanding of the migration complexity.
