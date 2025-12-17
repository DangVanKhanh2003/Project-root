# Y2matePro App Architecture Report

## Executive Summary

Y2matePro is a multi-page vanilla JavaScript application built with Vite as the module bundler. It uses purely vanilla technologies (HTML5, CSS3, ES6+ JavaScript) with NO frameworks. The architecture emphasizes performance, clean separation of concerns, and mobile-first responsive design.

**Key Characteristics:**
- Vanilla JavaScript with ES modules and dynamic imports
- TypeScript for type safety and developer experience
- Vite for fast development and optimized production builds
- Multi-page architecture with clean URL routing
- State management pattern (no external library)
- Component-based UI rendering with vanilla DOM manipulation

---

## 1. HTML Structure & Templating Approach

### 1.1 Current HTML Organization

**Pages in Repository:**
- **Root level pages** (8 pages, 474-471 lines each):
  - `index.html` - Main YouTube downloader page (471 lines)
  - `youtube-to-mp4.html` - MP4 converter page (432 lines)
  - `youtube-to-mp3.html` - MP3 converter page (440 lines)
  - `youtube-music-downloader.html` - Music downloader (474 lines)
  - `youtube-to-mp3-320kbps-converter.html` - High-quality MP3 (414 lines)
  - Additional converter pages (WAV, OGG, Opus, Shorts)

- **Static pages** (6 pages):
  - `privacy-policy.html` (309 lines)
  - `terms-condition.html` (307 lines)
  - `about-us.html` (182 lines)
  - `contact.html` (181 lines)
  - `404.html` (166 lines)

- **src/page directory** (empty for now, designed for future page templates)

### 1.2 HTML Template Pattern

All HTML pages follow a **consistent pattern**:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Meta tags: viewport, charset, X-UA-Compatible -->
    <!-- SEO: title, description, canonical, og: tags, schema.org -->
    <!-- Security: CSP headers -->
    <!-- Favicons: multiple sizes (16x16, 32x32, 48x48, 96x96) -->
    <!-- Analytics: Google GTM/GA -->
    <!-- Single entry point: <script type="module" src="/src/main.ts"></script> -->
</head>
<body>
    <header class="nav-header">
        <!-- Navigation with mobile menu toggle -->
    </header>
    <div class="container">
        <section class="y2mate-download-pro">
            <!-- Form and dynamic content loaded by JavaScript -->
        </section>
        <!-- Other sections: Hero, Features, FAQ, Footer -->
    </div>
    <!-- Mobile menu overlay -->
</body>
</html>
```

**Key Template Features:**
- Semantic HTML5 with proper heading hierarchy (h1, h2, etc.)
- CSS variables for theming (loaded via main.ts)
- Mobile-first responsive meta viewport
- Single module entry point (`src/main.ts`) for all pages
- No server-side templating (all pages are static HTML files)
- Extensive SEO metadata (OG tags, schema.org, canonical URLs)

### 1.3 DOM Selectors & Component Integration

**Critical DOM Elements:**
```
id="downloadForm"           - Main download form
id="videoUrl"              - Input field for URL/search
id="input-action-button"   - Paste/Clear toggle button
id="search-results-container" - Results display area
id="suggestion-container"  - Autocomplete suggestions
id="progressBarWrapper"    - Download progress indicator
id="content-area"          - Main content area
id="mobileMenuToggle"      - Mobile hamburger button
id="mobileMenuOverlay"     - Mobile menu backdrop
```

---

## 2. CSS Architecture

### 2.1 CSS Organization Structure

```
src/styles/
├── reset.css              - CSS reset (normalize.css style)
├── base.css              - CSS variables, typography tokens
├── common.css            - Utility classes, common patterns
├── sections/             - Page sections
│   ├── header.css        - Navigation styling
│   ├── hero.css          - Hero section
│   ├── content.css       - Main content area
│   ├── instructions.css  - How-to section
│   ├── features.css      - Features grid
│   ├── faq.css          - FAQ accordion
│   ├── tips.css         - Tips section
│   └── footer.css       - Footer styling
└── reusable-packages/    - Feature-specific styles
    ├── package-root.css              - Downloader UI root
    ├── skeleton/skeleton.css         - Loading skeletons
    ├── search-results/search-results.css
    ├── video-info-card/video-info-card.css
    ├── suggestions/suggestions.css   - Autocomplete dropdown
    ├── conversion-modal/conversion-modal.css
    ├── captcha-modal/captcha-modal.css
    ├── expire-modal/expire-modal.css
    └── 404.css
```

**Total:** 19 CSS files, loaded in specific order in `src/main.ts`

### 2.2 CSS Design Tokens (Base CSS)

The design system uses **CSS custom properties** extensively:

```css
:root {
    /* COLORS */
    --color-primary: #f20a51;          /* Pink/Red */
    --color-primary-hover: #8a0029;    /* Dark red on hover */
    --color-primary-button: #f20a51;
    --color-primary-input-border: #ff0068;
    
    --color-text-primary: #293a46;
    --color-text-secondary: #666;
    --color-text-dark: #333;
    --color-text-hover: #262626;
    
    --color-bg-page: #f9f9f9;
    --color-bg-white: #fff;
    --color-bg-hover: #eee;
    --color-bg-selected: #f0f0f0;
    
    --color-border-light: #ddd;
    --color-border-medium: #d3e0e9;
    
    --color-success: #5cb85c;
    --color-error: #e71111;
    
    /* TYPOGRAPHY */
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
```

### 2.3 Mobile-First Responsive Strategy

- **Base styles:** Mobile first (small screens)
- **Breakpoints:** Media queries for tablets and desktops
- **Flexbox & Grid:** Modern layout methods
- **Theme Color:** `#c10841` (for browser UI on mobile)

---

## 3. JavaScript Module Structure

### 3.1 TypeScript + JavaScript Architecture

**63 TypeScript/JavaScript files** organized by feature:

```
src/
├── main.ts                    - Entry point, CSS imports, feature initialization
├── environment.ts            - Centralized configuration (600+ lines)
├── vite-env.d.ts            - Vite type definitions
│
├── api/                       - API client layer
│   └── [API service files]
│
├── constants/                 - Application constants
│   └── youtube-constants.ts
│
├── features/downloader/       - Main feature (YouTube downloader)
│   ├── downloader-ui.ts      - UI orchestrator (MVC wiring)
│   ├── routing/              - URL routing & deep linking
│   │   ├── url-manager.ts    - Clean URL handling
│   │   └── seo-manager.ts    - Dynamic SEO updates
│   ├── state/                - State management (no Redux/etc)
│   │   ├── core-state.ts
│   │   ├── media-detail-state.ts
│   │   └── multifile-reuse-state.ts
│   ├── logic/                - Business logic
│   │   ├── input-form.ts     - Form controller
│   │   ├── youtube-metadata.ts
│   │   ├── concurrent-polling.ts
│   │   ├── multifile-ui.ts
│   │   └── conversion/       - Conversion orchestration
│   │       ├── conversion-controller.ts
│   │       ├── convert-logic-v2.ts
│   │       ├── retry-helper.ts
│   │       ├── polling-progress-mapper.ts
│   │       └── application/strategies/ - Strategy pattern
│   │           ├── BaseStrategy.ts
│   │           ├── IConversionStrategy.ts
│   │           ├── StrategyFactory.ts
│   │           ├── IOSRamStrategy.ts
│   │           ├── StaticDirectStrategy.ts
│   │           ├── PollingStrategy.ts
│   │           └── OtherStreamStrategy.ts
│   └── ui-render/            - DOM manipulation & rendering
│       ├── ui-renderer.ts
│       ├── content-renderer.ts
│       ├── download-rendering.ts
│       ├── download-options-renderer.ts
│       └── gallery-renderer.ts
│
├── ui-components/            - Reusable UI components (vanilla)
│   ├── modal/
│   │   ├── conversion-modal.ts
│   │   └── expire-modal.ts
│   ├── search-result-card/
│   │   ├── search-result-card.ts
│   │   ├── skeleton-card.ts
│   │   └── card-utils.ts
│   ├── suggestion-dropdown/
│   │   └── suggestion-renderer.ts
│   ├── circular-progress/
│   │   └── circular-progress.ts
│   ├── progress-bar/
│   │   └── progress-bar-manager.ts
│   └── mobile-nav/
│       └── mobile-nav-toggle.ts
│
├── loaders/                  - Async loaders
│   ├── css-loader.ts
│   ├── asset-loader.ts
│   └── lazy-css-loader.ts
│
├── script/                   - Utility scripts
│
└── utils/                    - Helper utilities
    └── [utility files]
```

### 3.2 Module Loading Pattern

**Main entry point flow:**

```typescript
// src/main.ts

// 1. Load CSS (in specific order)
import './styles/reset.css';
import './styles/base.css';
import './styles/common.css';
import './styles/sections/header.css';
// ... more CSS files

// 2. Lazy load features with dynamic imports
async function initDownloaderUI() {
  const { init } = await import('./features/downloader/downloader-ui');
  await init();
}

// 3. Initialize other features
function initMobileMenu() { /* ... */ }
function loadFeatures() {
  initMobileMenu();
  initDownloaderUI(); // Lazy loaded
}

// 4. Wait for DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFeatures);
} else {
  loadFeatures();
}
```

### 3.3 State Management Pattern

**Vanilla state management** (no Redux/Vuex):

```typescript
// src/features/downloader/state/core-state.ts

interface AppState {
  isLoading: boolean;
  inputValue: string;
  showPasteButton: boolean;
  showClearButton: boolean;
  searchResults: SearchResult[];
  selectedVideo: VideoDetail | null;
  // ... more state properties
}

// State updates trigger render callbacks
function setState(updates: Partial<AppState>) {
  // Update state
  // Call registered render callbacks
  renderCallback(newState, oldState);
}
```

**Render callback pattern:**
```typescript
// Register callback in downloader-ui.ts
setRenderCallback((state, prevState) => {
  render(state, prevState);        // Update main UI
  renderSuggestions(state, prevState);  // Update suggestions
});

// Changes trigger UI updates
setState({ isLoading: true });  // Triggers callbacks
```

### 3.4 Component Architecture (Vanilla)

**Example: Search Result Card component**

```typescript
// src/ui-components/search-result-card/search-result-card.ts

interface SearchResult {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  // ...
}

// Rendering function (vanilla DOM manipulation)
function renderSearchResultCard(result: SearchResult): HTMLElement {
  const card = document.createElement('div');
  card.className = 'search-result-card';
  card.innerHTML = `
    <img src="${result.thumbnail}" alt="${result.title}">
    <div class="card-info">
      <h3>${escapeHtml(result.title)}</h3>
      <span class="duration">${result.duration}</span>
    </div>
  `;
  card.addEventListener('click', () => handleResultClick(result));
  return card;
}

// Insert into DOM
container.appendChild(renderSearchResultCard(searchResult));
```

---

## 4. Build Process & Tooling

### 4.1 Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",                              // Dev server with HMR
    "build": "tsc && vite build",               // Production build
    "build:test": "NODE_ENV=test tsc && ...",   // Test build (noindex)
    "preview": "vite preview",                  // Preview production build
    "remove-logs": "tsx remove-console-logs.ts"
  },
  "dependencies": {
    "@downloader/core": "workspace:*",
    "@downloader/ui-shared": "workspace:*"
  },
  "devDependencies": {
    "vite": "^7.1.10",
    "typescript": "^5.3.3",
    "tsx": "^4.20.6"
  }
}
```

### 4.2 Vite Configuration

**vite.config.ts:**

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync, existsSync } from 'fs';
import { htmlRewritePlugin } from './vite-plugin-html-rewrite';
import { movePagesPlugin } from './vite-plugin-move-pages';

export default defineConfig({
  plugins: [
    htmlRewritePlugin(),      // Clean URL routing for dev
    movePagesPlugin()         // Move pages to dist root
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // Auto-detect root HTML files
        // Auto-detect src/page HTML files
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@downloader/core': resolve(__dirname, '../../packages/core/src')
    }
  },
  server: {
    open: '/',
    fs: { strict: false }
  }
});
```

### 4.3 Custom Vite Plugins

**vite-plugin-html-rewrite.ts:**
- Maps clean URLs (e.g., `/youtube-to-mp3`) to actual HTML files
- Works in both dev server and preview mode
- Enables URL like `http://localhost:5173/youtube-to-mp3` → `src/page/youtube-to-mp3.html`

**vite-plugin-move-pages.ts:**
- Moves built HTML pages from `dist/src/page/` to `dist/` root
- Ensures clean URLs in production (`/youtube-to-mp3.html` instead of `/src/page/youtube-to-mp3.html`)
- Runs after Vite build completes

### 4.4 TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": false,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"],
      "@downloader/core/*": ["../../packages/core/src/*"],
      "@downloader/ui-shared/*": ["../../packages/ui-shared/src/*"]
    }
  }
}
```

---

## 5. Content Organization

### 5.1 Static vs Dynamic Content

**Static Content (HTML):**
- Page shells (header, navigation, footer)
- Hero sections
- FAQ sections
- Instructional content
- Legal pages (privacy, terms)

**Dynamic Content (JavaScript):**
- Search results loaded via API
- Video metadata from YouTube
- Download options (MP3 320kbps, MP4 720p, etc.)
- Progress indicators
- Suggestions/autocomplete

### 5.2 Data Flow

```
User Input (form)
    ↓
Form Controller (input-form.ts)
    ↓
State Update (core-state.ts)
    ↓
Render Callback triggered
    ↓
UI Renderer (ui-renderer.ts)
    ↓
DOM Update (DOM manipulation)
    ↓
Visual Update on Page
```

### 5.3 Assets Organization

```
public/
├── assest/              (note: typo in "assest")
│   ├── animations/
│   │   └── success-tick.json  (Lottie animation)
│   └── [other assets]
├── favicon.png
├── favicon1616.png
├── favicon3232.png
├── favicon4848.png
├── favicon9696.png
└── logo.png

dist/
├── index.html
├── youtube-to-mp3.html
├── youtube-to-mp4.html
└── assets/
    ├── main-[hash].js
    ├── [chunk]-[hash].js
    └── [name]-[hash].[ext]
```

---

## 6. i18n & Localization Patterns

### 6.1 Current Localization Status

**Minimal i18n currently implemented:**

- **Language selector in header:**
  ```html
  <li class="navbar language">
    <a href="javascript:void(0);">
      English<span class="shape"></span>
    </a>
    <div class="dropdown-menu">
      <ul class="lang-menu">
        <li><a data-lang="en" href="/">English</a></li>
      </ul>
    </div>
  </li>
  ```

- **Only English currently active** (single language option)

- **URL patterns:** Clean URLs (no locale prefix like `/en/` or `/vi/`)

- **No translation file infrastructure** currently in place

### 6.2 Localization Implementation Approach

**Potential structure for future i18n:**

```typescript
// Would need to implement:
// src/i18n/translations.ts
interface TranslationKey {
  [key: string]: string;
}

const translations = {
  en: {
    'header.title': 'YouTube Downloader',
    'form.placeholder': 'Paste YouTube link here...',
    'button.download': 'Download',
  },
  // vi: { ... }
  // es: { ... }
};

// Would use patterns like:
const t = (key: string) => translations[currentLang][key];
```

---

## 7. Build & Deployment Process

### 7.1 GitHub Actions CI/CD Pipeline

**File:** `.github/workflows/deploy-y2matepro.yml`

**Triggers:**
- Push to `main` branch → Production deployment
- Push to `test-production` branch → Test environment

**Build Steps:**

1. **Checkout code** (actions/checkout@v4)
2. **Setup pnpm** (package manager v10)
3. **Setup Node.js** (v20, with pnpm cache)
4. **Install dependencies:**
   ```bash
   pnpm install --frozen-lockfile
   ```

5. **Build (Vite):**
   ```bash
   # For test environment
   NODE_ENV=test pnpm --filter y2matepro run build:test
   
   # For production
   NODE_ENV=production pnpm --filter y2matepro run build
   ```

6. **Test environment enhancements:**
   - Adds `noindex` meta tags to all HTML files
   - Replaces `robots.txt` to block all crawlers
   - Prevents search engine indexing

7. **Create artifact:**
   ```bash
   tar -C apps/y2matepro/dist -czf dist.tar.gz .
   ```

8. **Deploy to server:**
   - Upload via SCP to `/tmp`
   - Extract to production directory
   - Set proper permissions (755 for dirs, 644 for files)
   - Optionally reload nginx

### 7.2 Deployment Environments

**Production (main branch):**
- Deploy to: `y2matepro.com`
- SEO: `robots.txt` allows crawling, `<meta name="robots" content="index, follow">`
- Analytics: Full Google GTM tracking

**Test Environment (test-production branch):**
- Deploy to: `y2matepro.com-test` subdomain
- SEO: `robots.txt` blocks all, `<meta name="robots" content="noindex">`
- For internal testing and quality assurance

### 7.3 Build Output Structure

```
dist/
├── index.html               (main page)
├── youtube-to-mp3.html      (converter pages)
├── youtube-to-mp4.html
├── privacy-policy.html      (static pages)
├── terms-condition.html
├── 404.html
├── robots.txt              (conditional: prod vs test)
└── assets/
    ├── main-abc123def.js    (bundle hash)
    ├── feature-xyz789.js    (chunk hash)
    ├── style.css           (if CSS extracted)
    ├── logo-hash.png
    └── favicon-hash.png
```

---

## 8. Key Architectural Patterns

### 8.1 Design Patterns Used

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Strategy Pattern** | `src/features/downloader/logic/conversion/application/strategies/` | Multiple conversion strategies (iOS RAM, Polling, Static, Stream) |
| **Factory Pattern** | `StrategyFactory.ts` | Create appropriate strategy based on conditions |
| **Observer Pattern** | State management with render callbacks | View updates when state changes |
| **Lazy Loading** | `main.ts` - `dynamic imports` | Load downloader feature only when needed |
| **Component Pattern** | UI components in `src/ui-components/` | Reusable vanilla components |
| **MVC Pattern** | `downloader-ui.ts` | Model (state), View (renderers), Controller (logic) |

### 8.2 Performance Optimizations

- **Code Splitting:** Separate entry points for each HTML page
- **Lazy Loading:** Downloader feature loaded asynchronously
- **CSS Ordering:** Reset → Base → Common → Sections → Packages
- **Asset Hashing:** Vite auto-hashes for cache busting
- **Tree Shaking:** ES modules enable dead code elimination
- **Mobile-First CSS:** Reduces media query overhead

### 8.3 Code Organization Principles

- **Single Responsibility:** Each file has one clear purpose
- **Separation of Concerns:** UI, logic, state, routing are separate
- **DRY (Don't Repeat Yourself):** Shared components in `ui-components/`
- **Dependency Injection:** Loose coupling between modules
- **Configuration Centralization:** `environment.ts` for all config
- **Type Safety:** TypeScript for better developer experience

---

## 9. Monorepo Structure

### 9.1 Shared Packages

**packages/core/**
- Business logic, API clients, data transformers
- Independent of any specific frontend app
- ~11 directories (http, services, models, mappers, etc.)

**packages/ui-shared/**
- Reusable UI components and utilities
- Captcha modal
- Scroll manager
- Download utilities
- Circular progress component
- Available to any app via `@downloader/ui-shared`

**apps/y2matepro/**
- Main production application
- Uses both shared packages

**apps/yt1s-test/**
- Test/development app
- Not deployed to production

### 9.2 Path Aliases

```typescript
// Configured in vite.config.ts and tsconfig.json
'@': './src',
'@downloader/core': '../../packages/core/src',
'@downloader/ui-shared': '../../packages/ui-shared/src'

// Usage in code:
import { scrollManager } from '@downloader/ui-shared';
import { getApiBaseUrl } from '@downloader/core/http';
import { initRenderer } from '@/features/downloader/ui-render/ui-renderer';
```

---

## 10. Integration Points for Eleventy

### 10.1 Current Template Approach Limitations

**What would benefit from Eleventy:**
1. **Code duplication:** Header, navigation, footer repeated in ~14 HTML files
2. **Metadata management:** SEO metadata manually maintained in each page
3. **Language pages:** Easy i18n setup with Eleventy
4. **Component template reuse:** Shared layouts for page types
5. **Build time data:** Static pages could be generated from data files

### 10.2 Proposed Eleventy Integration Points

```
src/
├── _includes/          (Eleventy layouts)
│   ├── base.njk       (main layout wrapper)
│   ├── page.njk       (page layout with sidebar)
│   └── components/
│       ├── header.njk
│       ├── footer.njk
│       └── meta-seo.njk
├── pages/             (Eleventy sources)
│   ├── index.md
│   ├── youtube-to-mp3.md
│   ├── privacy-policy.md
│   └── ...
├── _data/            (Eleventy data files)
│   ├── site.json     (site config)
│   ├── pages.json    (page metadata)
│   ├── navigation.json
│   └── i18n.json     (translations)
├── assets/
│   ├── css/          (Sass/CSS - processed by Eleventy)
│   ├── js/           (Already Vite-handled)
│   └── images/
└── .eleventy.js      (Eleventy config)
```

### 10.3 How to Maintain Vanilla JS

- **Eleventy generates:** Static HTML from templates
- **Vite still handles:** JavaScript bundling (main.ts → assets/)
- **HTML output:** Eleventy templates output to `/dist`
- **Vanilla JS continues:** No framework dependency, just template DRY benefits

---

## 11. Current Dependencies & Libraries

### 11.1 Package Dependencies

```json
{
  "dependencies": {
    "@downloader/core": "workspace:*",      // Shared business logic
    "@downloader/ui-shared": "workspace:*"  // Shared UI utilities
  }
}
```

### 11.2 Dev Dependencies

```json
{
  "devDependencies": {
    "typescript": "^5.3.3",
    "vite": "^7.1.10",
    "tsx": "^4.20.6",
    "@types/node": "^20.19.25"
  }
}
```

### 11.3 Notable Used Libraries (in packages/core and ui-shared)

- **Lottie Web:** For JSON animations (success-tick animation)
- **No UI frameworks:** Material-UI, Bootstrap, Tailwind, etc.
- **No state management:** Redux, Zustand, Jotai, etc.
- **No HTTP client:** Axios, React Query, etc. (custom fetch-based)

---

## Summary: Current Architecture Strengths

1. **Performance First:** Vanilla JS, minimal deps, code splitting
2. **Clean Separation:** Clear boundaries between features, UI, state, logic
3. **Type Safety:** TypeScript throughout for better DX
4. **Mobile-First:** Responsive design with CSS variables
5. **SEO-Ready:** Proper meta tags, structured data, clean URLs
6. **Modular:** Reusable components and shared packages
7. **Modern Build Tools:** Vite for fast development and optimized builds
8. **Multiple Environments:** Easy test vs production with build variants

---

## Summary: Areas for Eleventy Integration

1. **Template Reuse:** Header, navigation, footer in 14 files → Single template
2. **SEO Management:** Page metadata could be data-driven
3. **Internationalization:** i18n directory structure built-in
4. **Static Generation:** Privacy policy, About, Contact could be Markdown
5. **Build Consolidation:** Both Eleventy and Vite in one pipeline
6. **Maintainability:** Changes to layout propagate to all pages automatically

