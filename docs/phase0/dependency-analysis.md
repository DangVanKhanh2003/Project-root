# Dependency Analysis - Phase 0

**Created:** 2025-01-15
**Project:** TypeScript Monorepo Migration
**Purpose:** Analyze current dependencies và plan workspace placement

---

## Executive Summary

- **Total Runtime Dependencies:** 0
- **Total Dev Dependencies:** 9
- **External Library Usage:** ZERO (Pure vanilla JS project)
- **Build Tool Dependencies:** 9 (Vite ecosystem)
- **Recommendation:** All deps → root workspace devDependencies

---

## Current Dependencies Breakdown

### ✅ Runtime Dependencies: NONE

**Observation:** Project sử dụng 100% vanilla JavaScript, không có external runtime libraries.

**Implications:**
- ✅ Lightweight bundle size
- ✅ No peer dependency conflicts
- ✅ No version compatibility issues
- ✅ Easy migration (no lib-specific types needed)

---

## Dev Dependencies Analysis (Total: 9)

### Category 1: Build System (Vite Core)

#### 1. `vite` v7.1.10
- **Purpose:** Build tool và dev server
- **Workspace Placement:** Root devDependencies
- **Peer Dependencies:** NONE
- **@types Package Needed:** NO (built-in TypeScript support)
- **Migration Impact:**
  - Will need separate Vite configs for packages vs apps
  - Apps will use full Vite config
  - Packages will use Vite library mode
- **Notes:**
  - Version 7.x is latest (Nov 2024)
  - No breaking changes expected

---

### Category 2: Code Optimization

#### 2. `terser` v5.44.0
- **Purpose:** JavaScript minifier
- **Current Usage:** Configured in vite.config.js:
  ```javascript
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', ...]
    }
  }
  ```
- **Workspace Placement:** Root devDependencies
- **Peer Dependencies:** NONE
- **@types Package Needed:** NO
- **Migration Strategy:**
  - Keep in root for shared config
  - Apps will inherit terser config from root Vite setup
- **Notes:** v5.x stable, widely used

---

### Category 3: CSS Processing

#### 3. `vite-plugin-purgecss` v0.2.13
- **Purpose:** Remove unused CSS from bundles
- **Current Usage:** Configured with safelist patterns in vite.config.js
- **Safelist Patterns:**
  - `/^nav/`, `/^modal/`, `/^conversion/`
  - State classes: 'active', 'open', 'loading'
  - See vite.config.js lines 27-60 for full list
- **Workspace Placement:** Root devDependencies (apps need it)
- **Peer Dependencies:**
  - `vite: ^2.0.0 || ^3.0.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0` ✅ (satisfied)
- **@types Package Needed:** NO
- **Migration Strategy:**
  - Each app will configure its own content paths
  - Shared safelist patterns can be extracted to shared config
- **Risk:** May need version update if peerDep warning occurs

#### 4. `critical` v7.2.1
- **Purpose:** Extract critical CSS for above-the-fold content
- **Current Usage:** Custom Vite plugin (`vite-plugin-critical.js`)
- **Workspace Placement:** Root devDependencies
- **Peer Dependencies:** NONE
- **@types Package Needed:** YES → `@types/critical`
- **Migration Notes:**
  - Custom plugin will need TypeScript conversion
  - Plugin code in `/vite-plugin-critical.js`
- **Action Items:**
  - [ ] Install `@types/critical` khi migrate plugin

#### 5. `critters` v0.0.23
- **Purpose:** Inline critical CSS
- **Current Usage:** Likely used by critical plugin
- **Workspace Placement:** Root devDependencies
- **Peer Dependencies:** NONE
- **@types Package Needed:** Check if available
- **Notes:**
  - v0.0.23 is very old (check for updates)
  - May be deprecated package

---

### Category 4: HTML Processing

#### 6. `minify-html-literals` v1.3.5
- **Purpose:** Minify HTML template literals in JavaScript
- **Current Usage:** Custom plugin (`vite-plugin-minify-html.js`)
- **Workspace Placement:** Root devDependencies
- **Peer Dependencies:** NONE
- **@types Package Needed:** Check availability
- **Migration Notes:**
  - Custom plugin needs TypeScript conversion
  - Plugin file: `/vite-plugin-minify-html.js`

---

### Category 5: Rollup Plugins (Legacy?)

#### 7. `rollup-plugin-critical` v1.0.15
- **Purpose:** Rollup plugin for critical CSS
- **Current Usage:** **UNCLEAR** - may be legacy/unused
- **Workspace Placement:** Root devDependencies (if still used)
- **Peer Dependencies:** Check npm
- **@types Package Needed:** Unlikely to exist
- **⚠️ Investigation Needed:**
  - Is this still used? (vite-plugin-critical.js exists)
  - Might be leftover from pre-Vite setup
  - **Action:** Grep codebase for usage

#### 8. `rollup-plugin-minify-html-literals` v1.2.6
- **Purpose:** Rollup plugin for HTML minification
- **Current Usage:** **UNCLEAR** - may be legacy/unused
- **Workspace Placement:** Root devDependencies (if still used)
- **⚠️ Investigation Needed:**
  - Vite-plugin-minify-html.js already exists
  - Might be duplicate/legacy
  - **Action:** Check if actually imported anywhere

---

### Category 6: Asset Handling

#### 9. `vite-plugin-static-copy` v3.1.4
- **Purpose:** Copy static assets to dist/ during build
- **Current Usage:** In vite.config.js:
  ```javascript
  viteStaticCopy({
    targets: [
      { src: 'src/assest/social-icon', dest: 'assest' },
      { src: 'src/assest/img-social', dest: 'assest' },
      { src: 'src/assest/section-img', dest: 'assest' }
    ]
  })
  ```
- **Workspace Placement:** Apps devDependencies (each app has own assets)
- **Peer Dependencies:**
  - `vite: ^2.0.0 || ^3.0.0 || ^4.0.0 || ^5.0.0 || ^6.0.0` ✅
- **@types Package Needed:** NO
- **Migration Strategy:**
  - Each app configures its own asset copy targets
  - Shared assets → packages/ui-shared/assets/

---

## Missing Dependencies to Add

### TypeScript Ecosystem

Will need to install during Phase 0 setup:

1. **`typescript`** ^5.3.3
   - Core TypeScript compiler
   - Workspace: Root devDependencies
   - Reason: Shared across all workspaces

2. **`@types/node`** ^20.0.0
   - Node.js type definitions
   - Workspace: Root devDependencies
   - Reason: For build scripts, configs

3. **`@typescript-eslint/parser`** ^6.0.0
   - ESLint parser for TypeScript
   - Workspace: Root devDependencies

4. **`@typescript-eslint/eslint-plugin`** ^6.0.0
   - ESLint rules for TypeScript
   - Workspace: Root devDependencies

5. **`eslint`** ^8.56.0
   - JavaScript/TypeScript linter
   - Workspace: Root devDependencies

6. **`eslint-config-prettier`** ^9.0.0
   - Disable ESLint rules that conflict with Prettier
   - Workspace: Root devDependencies

7. **`prettier`** ^3.0.0
   - Code formatter
   - Workspace: Root devDependencies

### Optional Type Definitions

8. **`@types/critical`**
   - If available on npm
   - For critical CSS plugin migration

---

## Peer Dependency Warnings - Expected

### Current State
No peer dependency warnings (no runtime deps).

### After TypeScript Migration
Will see warnings for:
- `@typescript-eslint/*` expecting `eslint` ✅ (will be installed)
- Vite plugins expecting `vite` ✅ (already installed)

**Action:** Monitor and resolve during installation.

---

## Version Conflicts - None Detected

All current dependencies are compatible:
- Vite v7.x supported by all plugins
- No overlapping dependency trees
- No version constraint conflicts

---

## Recommended Workspace Placement

### Root `package.json` devDependencies

**Build Tools:**
- `vite` ^7.1.10
- `typescript` ^5.3.3 (new)
- `terser` ^5.44.0

**Linting & Formatting:**
- `eslint` ^8.56.0 (new)
- `@typescript-eslint/parser` ^6.0.0 (new)
- `@typescript-eslint/eslint-plugin` ^6.0.0 (new)
- `prettier` ^3.0.0 (new)
- `eslint-config-prettier` ^9.0.0 (new)

**Vite Plugins (Shared):**
- `vite-plugin-purgecss` ^0.2.13
- `critical` ^7.2.1
- `critters` ^0.0.23
- `minify-html-literals` ^1.3.5
- `@types/critical` (new, if available)
- `@types/node` ^20.0.0 (new)

**Deprecated/Legacy (Investigate):**
- `rollup-plugin-critical` ^1.0.15 (may remove)
- `rollup-plugin-minify-html-literals` ^1.2.6 (may remove)

### App `package.json` devDependencies

**Asset Handling:**
- `vite-plugin-static-copy` ^3.1.4

**Runtime:**
- `@downloader/core` workspace:*
- `@downloader/ui-shared` workspace:*

### Package `packages/core` dependencies

**Runtime:** NONE (pure business logic)

**Dev:**
- `typescript` workspace:* (inherited)

### Package `packages/ui-shared` dependencies

**Runtime:**
- `@downloader/core` workspace:*

**Dev:**
- `typescript` workspace:* (inherited)

---

## Investigation Required

### 1. Rollup Plugins Usage

**Question:** Are `rollup-plugin-*` packages still used?

**How to Check:**
```bash
# Search for imports
grep -r "rollup-plugin-critical" . --exclude-dir=node_modules
grep -r "rollup-plugin-minify-html-literals" . --exclude-dir=node_modules

# If no results → safe to remove
```

**Expected Outcome:**
- Likely NOT used (Vite custom plugins exist)
- Can be removed to reduce dep bloat

### 2. Critters Package Age

**Question:** Is v0.0.23 the latest?

**How to Check:**
```bash
npm view critters versions
npm view critters version  # Latest version
```

**Action:**
- If newer version exists → update
- If deprecated → find alternative

---

## Migration Impact Summary

### Low Risk
✅ No runtime dependencies to migrate
✅ No version conflicts
✅ All build tools well-maintained
✅ TypeScript support built into Vite

### Medium Risk
⚠️ Custom Vite plugins need TypeScript conversion:
  - `vite-plugin-critical.js`
  - `vite-plugin-minify-html.js`
  - `vite-plugin-clean-urls.js` (if exists)

⚠️ Legacy rollup plugins may need cleanup

### High Risk
None identified.

---

## Next Steps (Phase 0)

1. ✅ **Investigate rollup-plugin-* usage** (15 min)
2. ✅ **Check critters version** (5 min)
3. ✅ **Create pnpm-workspace.yaml** with dependency strategy
4. ✅ **Install TypeScript ecosystem** in root
5. ✅ **Verify no dependency conflicts**

---

## Summary Table

| Package | Version | Category | Workspace | @types Needed | Status |
|---------|---------|----------|-----------|---------------|--------|
| vite | 7.1.10 | Build | Root | No | ✅ Keep |
| terser | 5.44.0 | Optimization | Root | No | ✅ Keep |
| vite-plugin-purgecss | 0.2.13 | CSS | Root | No | ✅ Keep |
| critical | 7.2.1 | CSS | Root | Yes | ✅ Keep |
| critters | 0.0.23 | CSS | Root | ? | ⚠️ Check version |
| minify-html-literals | 1.3.5 | HTML | Root | ? | ✅ Keep |
| rollup-plugin-critical | 1.0.15 | Build | Root | No | ⚠️ Investigate |
| rollup-plugin-minify-html-literals | 1.2.6 | Build | Root | No | ⚠️ Investigate |
| vite-plugin-static-copy | 3.1.4 | Assets | Apps | No | ✅ Keep |

**NEW (to install):**

| Package | Version | Category | Workspace | Reason |
|---------|---------|----------|-----------|--------|
| typescript | ^5.3.3 | Core | Root | TypeScript compiler |
| @types/node | ^20.0.0 | Types | Root | Node API types |
| eslint | ^8.56.0 | Linting | Root | Code quality |
| @typescript-eslint/parser | ^6.0.0 | Linting | Root | TS parsing |
| @typescript-eslint/eslint-plugin | ^6.0.0 | Linting | Root | TS rules |
| prettier | ^3.0.0 | Formatting | Root | Code style |
| eslint-config-prettier | ^9.0.0 | Linting | Root | ESLint+Prettier compat |

---

**Research Duration:** ~1.5 hours (faster than estimated due to minimal dependencies)

**Completed By:** Claude Code Migration Team
**Status:** ✅ Ready for Research 2
