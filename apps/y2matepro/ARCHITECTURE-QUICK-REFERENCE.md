# Y2matePro Architecture - Quick Reference Guide

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  HTML Pages (14 files)                              │    │
│  │  • index.html (main downloader)                     │    │
│  │  • youtube-to-mp3.html, youtube-to-mp4.html         │    │
│  │  • privacy-policy.html, terms-condition.html        │    │
│  │  • Plus 10 more converter pages                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                         │                                    │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  src/main.ts (Single Entry Point)                  │    │
│  │  • Loads all CSS (reset→base→common→sections)      │    │
│  │  • Initializes mobile menu                         │    │
│  │  • Lazy loads downloader UI                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                         │                                    │
│        ┌────────────────┴────────────────┐                  │
│        ▼                                 ▼                  │
│  ┌──────────────┐        ┌───────────────────────────┐    │
│  │ CSS (19 files)        │ Features (TypeScript)     │    │
│  ├──────────────┤        ├───────────────────────────┤    │
│  │ reset.css    │        │ downloader-ui.ts (MVC)    │    │
│  │ base.css     │        │ ├─ state/ (Model)        │    │
│  │ common.css   │        │ ├─ logic/ (Controller)    │    │
│  │ sections/    │        │ ├─ ui-render/ (View)      │    │
│  │ reusable-    │        │ ├─ routing/               │    │
│  │ packages/    │        │ └─ ui-components/         │    │
│  └──────────────┘        └───────────────────────────┘    │
│                                     │                      │
│                          ┌──────────┴──────────┐           │
│                          ▼                     ▼           │
│                   ┌──────────────┐    ┌──────────────┐    │
│                   │ State Change │    │ API Calls    │    │
│                   │ Triggers     │    │              │    │
│                   │ Renderer     │    │ @downloader/ │    │
│                   │              │    │ core (HTTP)  │    │
│                   └──────────────┘    └──────────────┘    │
│                          │                     │           │
│                          └─────────┬───────────┘           │
│                                    ▼                      │
│                         ┌──────────────────┐              │
│                         │ DOM Update       │              │
│                         │ Search results   │              │
│                         │ Progress bars    │              │
│                         │ Modals           │              │
│                         └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
   External APIs                   Shared Packages
   • YouTube Stream API         • @downloader/core
   • Video Convert API          • @downloader/ui-shared
   • Search API
```

---

## Data Flow: Downloading a Video

```
1. USER INPUT
   └─> <input id="videoUrl"> → User types/pastes URL
   
2. FORM SUBMISSION
   └─> initInputForm() (input-form.ts)
       └─> Validates input
       └─> setState({ isLoading: true })
   
3. STATE CHANGE
   └─> AppState updated (core-state.ts)
   └─> Triggers: render(state, prevState)
   
4. VIEW UPDATED
   └─> ui-renderer.ts → updateLoadingState()
   └─> DOM elements disabled/enabled
   
5. API CALL
   └─> API service from @downloader/core
   └─> Fetches YouTube metadata
   └─> Returns: video info, available formats
   
6. STATE UPDATED WITH RESULTS
   └─> setState({ 
           searchResults: [...],
           selectedVideo: {...},
           isLoading: false 
       })
   
7. VIEW RE-RENDERED
   └─> content-renderer.ts renders results
   └─> gallery-renderer.ts displays thumbnails
   
8. USER SELECTS FORMAT
   └─> Conversion modal opens (conversion-modal.ts)
   └─> User chooses MP3 320kbps or MP4 720p
   
9. CONVERSION INITIATED
   └─> conversion-controller.ts
   └─> StrategyFactory selects strategy
   └─> Execution: PollingStrategy vs StaticDirectStrategy
   
10. PROGRESS TRACKING
    └─> polling-progress-mapper.ts maps API progress
    └─> UI updates: circular-progress.ts or progress-bar.ts
    
11. COMPLETION
    └─> Download link generated
    └─> Triggers: Browser download or stream to RAM
    └─> UI shows success state
```

---

## File Size Distribution

```
HTML Pages:        ~6,500 lines total (14 files)
├─ Main pages:      ~430 lines avg (8 pages)
└─ Static pages:    ~270 lines avg (6 pages)

CSS Files:        ~3,500 lines total (19 files)
├─ Reset/Base:     ~200 lines
├─ Sections:       ~1,200 lines
└─ Components:     ~2,100 lines

TypeScript Files:  ~15,000+ lines (63 files)
├─ Features:       ~8,000 lines (downloader logic)
├─ UI Components:  ~3,000 lines
├─ State/Logic:    ~2,500 lines
└─ Utils/Config:   ~1,500 lines

Total:            ~25,000+ lines of code
```

---

## Technology Stack Summary

| Layer | Technology | Count | Key Files |
|-------|-----------|-------|-----------|
| **HTML** | HTML5 (Semantic) | 14 files | index.html, youtube-to-mp*.html |
| **CSS** | CSS3 + CSS Variables | 19 files | base.css (design tokens) |
| **JS/TS** | TypeScript + ES6+ | 63 files | main.ts, downloader-ui.ts |
| **Bundler** | Vite 7.1.10 | 1 config | vite.config.ts |
| **Build** | GitHub Actions | 1 workflow | deploy-y2matepro.yml |
| **Shared Code** | Monorepo packages | 2 pkgs | @downloader/core, @downloader/ui-shared |
| **Type Checking** | TypeScript | - | tsconfig.json |

---

## Key Design Decisions

### 1. No Frameworks
**Why:** Performance, minimal dependencies, full control
**Tradeoff:** More DOM manipulation code vs cleaner components

### 2. State Management Pattern (Vanilla)
**Why:** Lightweight, no Redux overhead
**How:** Callbacks trigger renders on state changes
**Pattern:** Model → View → Controller (MVC)

### 3. CSS Architecture (No Tailwind)
**Why:** Smaller bundle, better semantics, full design control
**How:** CSS variables for theming, organized by sections
**Result:** Mobile-first, responsive, maintainable

### 4. Multiple HTML Pages
**Why:** Better for SEO, independent page metadata
**Cost:** Code duplication in headers/footers
**Future:** Eleventy could solve this

### 5. Lazy Loading Features
**Why:** Initial page load performance
**How:** Dynamic imports in main.ts
**Result:** Critical code loads first, downloader UI loads after

### 6. Custom Vite Plugins
**Why:** Clean URL routing without server-side logic
**How:** HTML rewrite + page moving plugins
**Result:** URLs like `/youtube-to-mp3` instead of `/youtube-to-mp3.html`

---

## Component Hierarchy

```
App (Browser Page)
├─ Header
│  ├─ Logo
│  ├─ Navigation Menu
│  └─ Mobile Menu Overlay
│      ├─ Mobile Logo
│      ├─ Mobile Nav Links
│      └─ Close Button
│
├─ Main Content
│  ├─ Hero Section
│  ├─ Search Form
│  │  ├─ Input Field (id="videoUrl")
│  │  ├─ Action Button (paste/clear)
│  │  └─ Submit Button
│  │
│  ├─ Search Results (Dynamic)
│  │  ├─ Search Result Cards (vanilla components)
│  │  │  ├─ Thumbnail
│  │  │  ├─ Title
│  │  │  └─ Duration
│  │  └─ Skeleton Cards (loading state)
│  │
│  ├─ Suggestions Dropdown (Dynamic)
│  │  └─ Suggestion Items
│  │
│  ├─ Conversion Modal (Dynamic)
│  │  ├─ Format Options
│  │  ├─ Quality Selector
│  │  └─ Download Button
│  │
│  ├─ Progress Indicators (Dynamic)
│  │  ├─ Circular Progress
│  │  └─ Progress Bar
│  │
│  ├─ FAQ Section
│  ├─ Features Section
│  ├─ Instructions Section
│  └─ Tips Section
│
└─ Footer
   ├─ Links
   ├─ Copyright
   └─ Social Links
```

---

## State Tree (Redux-style)

```
AppState {
  // Form Input
  inputValue: string
  inputType: 'url' | 'search' | 'empty'
  isLoading: boolean
  showPasteButton: boolean
  showClearButton: boolean
  
  // Search Results
  searchResults: SearchResult[]
  searchError: string | null
  
  // Selected Video
  selectedVideo: VideoDetail | null
  videoMetadata: VideoMetadata | null
  
  // Download Options
  availableFormats: Format[]
  selectedFormat: Format | null
  
  // Conversion State
  isConverting: boolean
  conversionProgress: number (0-100)
  conversionError: string | null
  downloadLink: string | null
  
  // UI State
  mobileMenuOpen: boolean
  modalOpen: boolean
  suggestionsFocused: boolean
}
```

---

## CSS Custom Properties (Design Tokens)

```css
:root {
  /* Primary Colors */
  --color-primary: #f20a51;
  --color-primary-hover: #8a0029;
  
  /* Text Colors */
  --color-text-primary: #293a46;
  --color-text-secondary: #666;
  --color-text-dark: #333;
  
  /* Background Colors */
  --color-bg-page: #f9f9f9;
  --color-bg-white: #fff;
  --color-bg-hover: #eee;
  
  /* Border Colors */
  --color-border-light: #ddd;
  --color-border-medium: #d3e0e9;
  
  /* Status Colors */
  --color-success: #5cb85c;
  --color-error: #e71111;
  
  /* Typography */
  --font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-size-base: 1rem;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-md: 17px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 22px;
  --font-size-3xl: 26px;
}

/* Used throughout all CSS files for consistency */
.button { color: var(--color-primary); }
.text { color: var(--color-text-primary); }
.card { background: var(--color-bg-white); }
```

---

## Build Process Flow

```
Source Code
    ↓
TypeScript Compilation (tsc)
    ├─ Type check all .ts files
    ├─ Generate no output (noEmit: true)
    └─ Errors stop build
    ↓
Vite Build (vite build)
    ├─ Resolve imports/exports
    ├─ Bundle JavaScript
    │  ├─ main.ts → main-[hash].js
    │  ├─ Split chunks for each page
    │  └─ Apply tree-shaking
    ├─ Process CSS
    │  └─ Combine & hash
    ├─ Copy assets (images, fonts)
    ├─ Custom Plugins:
    │  ├─ htmlRewritePlugin (dev routing)
    │  └─ movePagesPlugin (move pages to dist/)
    └─ Output to dist/
    ↓
Post-Build (for test environment)
    ├─ Run: modify-robots-meta.js
    ├─ Add: noindex meta tags
    ├─ Create: robots.txt (disallow all)
    └─ Create: dist.tar.gz
    ↓
Deploy (GitHub Actions)
    ├─ SCP upload to server
    ├─ Extract tar.gz
    ├─ Set permissions (755/644)
    ├─ Update group (nginx)
    └─ Ready to serve
```

---

## Common File Patterns

### Adding a New Converter Page

1. **Create HTML file:**
   ```
   youtube-to-flac-converter.html
   (Copy from youtube-to-mp3.html, update meta tags)
   ```

2. **Update navigation:**
   ```html
   <!-- Add to all HTML files' navigation -->
   <li><a href="youtube-to-flac-converter">YouTube to FLAC</a></li>
   ```

3. **Update JavaScript (if needed):**
   ```typescript
   // src/features/downloader/logic/conversion/application/strategies/StrategyFactory.ts
   // Add new format handling
   ```

4. **Build and deploy:**
   ```bash
   pnpm build
   git push main  # or test-production
   # Automatically deployed via GitHub Actions
   ```

---

## Performance Metrics

**Current:**
- Pages: ~14 HTML files (474 lines max)
- CSS: ~3,500 lines across 19 files
- JS/TS: ~15,000+ lines across 63 files
- Dependencies: Only 2 workspace packages
- Bundle size: ~50-100KB (estimate, varies by page)

**Opportunities:**
- Eleventy: Reduce HTML duplication (~30% reduction possible)
- CSS: Minification & compression reduces ~70%
- JS: Code splitting per page reduces initial load
- Assets: Image optimization, WebP format support

---

## Environment Configuration

**File:** `src/environment.ts` (600+ lines)

```typescript
// Environment Detection
isDevelopment = localhost / 127.0.0.1
isProduction = anything else

// API Endpoints
baseUrl: https://api.yt1s.cx/api/v1
baseUrlV2: https://sv-190.y2mp3.co
searchV2BaseUrl: https://yt-extractor.y2mp3.co

// Timeouts (milliseconds)
default: 15000
extract: 20000
convert: 20000
polling: 950
decode: 60000
streamDownload: 30 * 60 * 1000

// CAPTCHA
provider: 'cloudflare'
siteKey: '1x00000000000000000000AA'

// Feature Flags
enableSuggestions: true
enablePlaylistSupport: true
enableCaptcha: true
enableDebugLogging: isDevelopment
```

---

## Mobile-First Breakpoints (Implied)

```css
/* Base: Mobile first (max 575px) */
.container { padding: 12px; }
.grid { grid-template-columns: 1fr; }

/* Tablet: 576px and up */
@media (min-width: 576px) {
  .container { padding: 20px; }
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop: 992px and up */
@media (min-width: 992px) {
  .container { padding: 40px; }
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

---

## Quick Troubleshooting Guide

| Issue | Cause | Solution |
|-------|-------|----------|
| Styles not updating | CSS import order | Check src/main.ts import sequence |
| Mobile menu stuck | Missing element | Ensure id="mobileMenuOverlay" exists |
| Page doesn't load | HTML not in build | Check vite.config.ts input entries |
| API calls failing | Wrong endpoint | Verify environment.ts baseUrl |
| TypeScript errors | Type mismatch | Run `tsc` to check errors |
| Build fails | Missing deps | Run `pnpm install` |
| Routes broken | Missing plugin | Verify vite-plugin-html-rewrite |

---

## Future Improvements (Eleventy Integration)

### Phase 1: Template Extraction
```
Create: src/_includes/layouts/
├─ base.njk (main wrapper)
├─ converter.njk (converter pages)
└─ static.njk (about, contact, etc.)
```

### Phase 2: Data-Driven
```
Create: src/_data/
├─ pages.json (metadata)
├─ navigation.json (menu)
└─ i18n.json (translations)
```

### Phase 3: Build Integration
```
.eleventy.js config
├─ Input: src/pages/
├─ Output: dist/ (same as Vite)
└─ Preserve: Vite assets handling
```

### Phase 4: i18n Support
```
/pages/en/index.md
/pages/vi/index.md
/pages/es/index.md
```

**Result:** Single HTML template change updates all 14 pages automatically

