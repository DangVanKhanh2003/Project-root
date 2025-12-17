# Y2matePro Architecture Documentation Index

This directory contains comprehensive documentation of the Y2matePro application architecture for understanding the codebase structure and planning Eleventy integration.

## Documentation Files

### 1. **Y2MATEPRO-ARCHITECTURE.md** (24KB - Main Reference)
**Location:** `apps/y2matepro/Y2MATEPRO-ARCHITECTURE.md`

**Contents:**
- Executive summary of the vanilla JavaScript architecture
- Detailed HTML structure and templating approach (1.1-1.3)
- CSS architecture with design tokens and organization (Section 2)
- JavaScript module structure with 63 TypeScript files explained (Section 3)
- Build process and Vite configuration (Section 4)
- Content organization: static vs dynamic (Section 5)
- i18n and localization patterns (Section 6)
- Complete GitHub Actions CI/CD pipeline (Section 7)
- Design patterns used (Strategy, Factory, Observer, MVC) (Section 8)
- Monorepo structure and shared packages (Section 9)
- Integration points for Eleventy (Section 10)
- Dependencies and libraries overview (Section 11)

**Best for:** Understanding the overall architecture and tech stack in depth.

---

### 2. **ARCHITECTURE-QUICK-REFERENCE.md** (16KB - Visual Guide)
**Location:** `apps/y2matepro/ARCHITECTURE-QUICK-REFERENCE.md`

**Contents:**
- ASCII architecture diagram showing component hierarchy
- Data flow diagrams for downloading videos
- File size distribution across HTML, CSS, and JS
- Technology stack summary table
- Key design decisions and rationale
- Component hierarchy tree
- Redux-style state tree
- CSS custom properties reference
- Build process flow diagram
- Common patterns for adding new pages
- Performance metrics and optimization opportunities
- Environment configuration reference
- Mobile-first breakpoints guide
- Quick troubleshooting table
- Eleventy integration roadmap

**Best for:** Quick navigation, visual understanding, and troubleshooting.

---

### 3. **CLAUDE.md** (Project-wide Instructions)
**Location:** Root directory

**Contains:** High-level project guidelines, tech stack overview, deployment strategy, and instructions to read task-workflow before implementing changes.

---

## Quick Navigation by Topic

### Understanding the Current Architecture

1. **Read first:** ARCHITECTURE-QUICK-REFERENCE.md (Architecture Diagram section)
2. **Then read:** Y2MATEPRO-ARCHITECTURE.md (Sections 1-4)

### Understanding How Pages Work

1. **HTML Structure:** Y2MATEPRO-ARCHITECTURE.md (Section 1)
2. **CSS Architecture:** Y2MATEPRO-ARCHITECTURE.md (Section 2)
3. **Visual Reference:** ARCHITECTURE-QUICK-REFERENCE.md (Component Hierarchy section)

### Understanding JavaScript Implementation

1. **Module Structure:** Y2MATEPRO-ARCHITECTURE.md (Section 3)
2. **Data Flow:** ARCHITECTURE-QUICK-REFERENCE.md (Data Flow section)
3. **State Management:** Y2MATEPRO-ARCHITECTURE.md (Section 3.3)

### Understanding Build & Deployment

1. **Vite Configuration:** Y2MATEPRO-ARCHITECTURE.md (Section 4)
2. **CI/CD Pipeline:** Y2MATEPRO-ARCHITECTURE.md (Section 7)
3. **Build Process:** ARCHITECTURE-QUICK-REFERENCE.md (Build Process Flow section)

### Planning Eleventy Integration

1. **Current Limitations:** Y2MATEPRO-ARCHITECTURE.md (Section 10.1)
2. **Proposed Structure:** Y2MATEPRO-ARCHITECTURE.md (Section 10.2-10.3)
3. **Roadmap:** ARCHITECTURE-QUICK-REFERENCE.md (Future Improvements section)

### Troubleshooting Issues

1. **Quick help:** ARCHITECTURE-QUICK-REFERENCE.md (Quick Troubleshooting Guide)
2. **Detailed help:** Y2MATEPRO-ARCHITECTURE.md (relevant section)

---

## Key Statistics

```
HTML Files:           14 pages (6,500 lines total)
├─ Main pages:        8 files (~430 lines avg)
└─ Static pages:      6 files (~270 lines avg)

CSS Files:           19 files (3,500 lines total)
├─ Reset/Base:       ~200 lines
├─ Sections:        ~1,200 lines
└─ Components:      ~2,100 lines

TypeScript Files:    63 files (15,000+ lines total)
├─ Features:        ~8,000 lines (downloader)
├─ Components:      ~3,000 lines (UI)
├─ State/Logic:     ~2,500 lines
└─ Utils/Config:    ~1,500 lines

Total Codebase:     ~25,000 lines of code
```

---

## Technology Stack Summary

| Aspect | Technology |
|--------|-----------|
| **HTML** | HTML5 (Semantic markup) |
| **CSS** | CSS3 + CSS Custom Properties (no Tailwind) |
| **JavaScript** | TypeScript + ES6+ Vanilla (no frameworks) |
| **Bundler** | Vite 7.1.10 |
| **Build Tool** | GitHub Actions |
| **Package Manager** | pnpm |
| **Monorepo** | Workspaces (2 shared packages) |
| **State** | Vanilla observer pattern (no Redux) |
| **Components** | Vanilla DOM manipulation |

---

## Architecture Overview

### Stack Layers

```
┌─────────────────────────────────┐
│   Browser (14 HTML pages)       │
├─────────────────────────────────┤
│   src/main.ts (Entry Point)     │
├─────────────────────────────────┤
│   CSS (19 files)  │  JS (63 files)
│   3,500 lines     │  15,000+ lines
├─────────────────────────────────┤
│   Shared Packages                │
│   @downloader/core               │
│   @downloader/ui-shared          │
├─────────────────────────────────┤
│   External APIs & Services       │
│   (YouTube, Video Convert, etc)  │
└─────────────────────────────────┘
```

### Data Flow Pattern

```
User Input
    → Form Controller
    → State Change
    → Render Callback
    → View Update (DOM)
    → Display Change
```

### State Management (No Framework)

```typescript
// Simple callback-based state management
interface AppState { /* ... */ }

function setState(updates: Partial<AppState>) {
  // Update state
  // Call: renderCallback(newState, prevState)
}

setRenderCallback((state, prevState) => {
  render(state, prevState);  // Update DOM
});
```

---

## Design Decisions & Rationale

| Decision | Why | Tradeoff |
|----------|-----|----------|
| **No Frameworks** | Performance, minimal deps | More DOM code |
| **Vanilla State** | Lightweight, full control | Custom management |
| **CSS Variables** | Theming, maintainability | No preprocessing |
| **Multiple HTML Pages** | SEO, independent metadata | Code duplication |
| **Custom Vite Plugins** | Clean URLs, no backend | Extra build config |
| **TypeScript** | Type safety, better DX | Compilation step |

---

## Current Strengths

1. **Performance-First:** Vanilla JS, minimal dependencies, code splitting
2. **Clean Architecture:** Clear separation (UI, Logic, State, Routing)
3. **Type Safety:** TypeScript throughout for better developer experience
4. **Mobile-First:** Responsive design with CSS variables
5. **SEO-Optimized:** Proper meta tags, structured data, clean URLs
6. **Modular:** Reusable components and shared packages
7. **Modern Build Tools:** Vite for fast dev and optimized builds
8. **Multi-Environment:** Easy test vs production variants

---

## Opportunities for Eleventy Integration

### Problem: Code Duplication
- **Current:** Header, nav, footer repeated in 14 HTML files
- **Solution:** Single Eleventy template for all pages

### Problem: SEO Metadata Management
- **Current:** Each page manually maintains meta tags
- **Solution:** Data-driven metadata from JSON files

### Problem: Localization
- **Current:** Single language dropdown (no implementation)
- **Solution:** Eleventy i18n directory structure

### Problem: Maintainability
- **Current:** Layout changes require updating 14 files
- **Solution:** Template inheritance → automatic propagation

### Result of Integration
- Eliminate ~40% HTML duplication
- Single source of truth for layouts
- Easier i18n support (vi, en, es, etc.)
- Automatic layout updates across all pages
- Maintain vanilla JS benefits (no framework)

---

## File Organization Reference

```
apps/y2matepro/
├── index.html                    # Main page
├── youtube-to-mp3.html          # Converter pages (8 files)
├── privacy-policy.html          # Static pages (6 files)
├── src/
│   ├── main.ts                  # Entry point
│   ├── environment.ts           # Configuration
│   ├── styles/                  # CSS (19 files)
│   ├── features/downloader/     # Main feature
│   ├── ui-components/           # Reusable components
│   ├── loaders/                 # Async loaders
│   └── utils/                   # Helpers
├── public/                      # Static assets
├── dist/                        # Build output
├── vite.config.ts              # Vite configuration
├── vite-plugin-html-rewrite.ts # URL rewriting
├── vite-plugin-move-pages.ts   # Page movement
└── package.json
```

---

## Before Starting Work

Per CLAUDE.md instructions:

1. **Read** `docs/task-workflow.md` (one time per conversation)
2. **Understand** the current architecture (you're reading it now)
3. **Plan** your changes (consider Eleventy integration points)
4. **Implement** following project conventions

---

## Common Tasks & Where to Find Info

| Task | Documentation |
|------|----------------|
| Add new page | QUICK-REF: "Adding a New Converter Page" |
| Modify header/footer | Y2MATEPRO: Section 1.2 (Template Pattern) |
| Change colors/fonts | QUICK-REF: "CSS Custom Properties" |
| Understand API flow | Y2MATEPRO: Section 5.2 (Data Flow) |
| Debug build issues | QUICK-REF: "Quick Troubleshooting" |
| Plan Eleventy work | Y2MATEPRO: Section 10 |
| Check deployment | Y2MATEPRO: Section 7 (CI/CD) |
| Understand state | QUICK-REF: "State Tree" |

---

## Related Documentation

- **conversion-architecture.md** - Detailed explanation of video conversion feature
- **CLAUDE.md** - Project-wide guidelines and instructions
- **docs/task-workflow.md** - Task execution workflow (in root docs/)

---

## Summary

This documentation provides:

1. **Complete architectural overview** (Y2MATEPRO-ARCHITECTURE.md)
2. **Visual quick reference** (ARCHITECTURE-QUICK-REFERENCE.md)
3. **Integration roadmap** (for Eleventy adoption)
4. **Troubleshooting guide** (for common issues)

**Total documentation:** ~40KB providing comprehensive insight into a 25,000+ line vanilla JavaScript application built with Vite.

---

## Next Steps

To integrate Eleventy while maintaining vanilla JavaScript benefits:

1. Extract common templates (header, footer, meta) to Eleventy includes
2. Create data files for page metadata and navigation
3. Convert HTML pages to Markdown/Njk templates
4. Configure Eleventy to output to `/dist` (same as Vite)
5. Keep Vite handling JavaScript bundling
6. Support i18n with language directory structure

See Y2MATEPRO-ARCHITECTURE.md Section 10 for detailed proposed structure.

