# 🎨 HƯỚNG DẪN CLONE HTML & CSS BASE - PHƯƠNG PHÁP GENERIC

> **Mục đích**: Hướng dẫn tổng quát cách clone HTML/CSS từ bất kỳ website nào, áp dụng được cho mọi project structure

## MỤC LỤC

1. [Nguyên Tắc Căn Bản](#1-nguyên-tắc-căn-bản)
2. [Phân Tích File Gốc](#2-phân-tích-file-gốc)
3. [Chiến Lược Copy vs Viết Mới](#3-chiến-lược-copy-vs-viết-mới)
4. [CSS Architecture - Đập Đi Xây Lại](#4-css-architecture---đập-đi-xây-lại)
5. [Design Tokens System](#5-design-tokens-system)
6. [Mobile-First Responsive](#6-mobile-first-responsive)
7. [Container Pattern](#7-container-pattern)
8. [Điểm Chú Ý Quan Trọng](#8-điểm-chú-ý-quan-trọng)
9. [Workflow Generic](#9-workflow-generic)
10. [Checklist Universal](#10-checklist-universal)

---

## 1. NGUYÊN TẮC CĂN BẢN

### 1.1 Golden Rule

**🔥 MEASURE TWICE, CODE ONCE 🔥**

```
┌─────────────────────────────────────────────┐
│ 1. ĐỌC & PHÂN TÍCH         → 40% thời gian │
│ 2. EXTRACT VALUES          → 40% thời gian │
│ 3. VIẾT CODE               → 20% thời gian │
└─────────────────────────────────────────────┘
```

### 1.2 Quy Trình 3 Bước

```
PHASE 1: ANALYSIS
   ↓
   ├─→ Grep tất cả values từ source HTML
   ├─→ Extract exact numbers (không đoán)
   ├─→ Document patterns và structure
   └─→ Identify dependencies

PHASE 2: ARCHITECTURE
   ↓
   ├─→ Create design token system
   ├─→ Rebuild CSS với class names mới
   ├─→ Maintain clean, scalable structure
   └─→ Implement reusable patterns

PHASE 3: VALIDATION
   ↓
   ├─→ Compare pixel-perfect với source
   ├─→ Test all responsive breakpoints
   └─→ Verify với DevTools
```

### 1.3 Tại Sao Phải Đập Đi Xây Lại?

**❌ KHÔNG LÀM**:
- Copy CSS rồi find-replace class names → Dễ miss
- Giữ nguyên structure cũ → Code bloat
- Đoán values thay vì đọc chính xác → Sai lệch

**✅ ĐÚNG**:
- Extract patterns từ source
- Rebuild với class names mới
- Clean architecture từ đầu
- Exact values được verify

---

## 2. PHÂN TÍCH FILE GỐC

### 2.1 File Gốc Là Gì?

**Có thể là**:
- Single HTML file với inline CSS (`webclone.html`)
- Live website (inspect trong DevTools)
- Figma/Design file export
- Component library documentation

**Mục tiêu**: Extract exact values để tái tạo chính xác

### 2.2 Công Cụ Extraction

#### A. Grep Commands (Cho HTML/CSS Files)

**Pattern chung**:
```bash
# Replace SOURCE_FILE với tên file thực tế
SOURCE_FILE="source.html"

# Tìm tất cả colors
grep -oE "#[0-9a-fA-F]{6}" $SOURCE_FILE | sort -u

# Tìm color properties với line numbers
grep -n "color:" $SOURCE_FILE

# Tìm specific value
grep "YOUR_VALUE" $SOURCE_FILE -n

# Tìm với context (before/after lines)
grep "PATTERN" $SOURCE_FILE -A 5 -B 3
```

**Values cần extract**:

```bash
# Colors
grep -n "color:\|background:" $SOURCE_FILE > colors.txt

# Typography
grep -n "font-size:\|font-weight:\|font-family:" $SOURCE_FILE > typography.txt

# Spacing
grep -n "padding:\|margin:" $SOURCE_FILE > spacing.txt

# Dimensions
grep -n "width:\|height:\|max-width:" $SOURCE_FILE > dimensions.txt

# Borders & Shadows
grep -n "border:\|box-shadow:\|border-radius:" $SOURCE_FILE > decorative.txt
```

#### B. Browser DevTools (Cho Live Websites)

**Workflow**:
1. Right-click element → Inspect
2. Computed tab → See all applied styles
3. Copy exact values
4. Document trong extraction file

**Pro tips**:
- Copy computed color (rgba → hex)
- Note inheritance chain
- Check responsive styles ở different breakpoints

#### C. Screenshot Method

**Pixel-perfect comparison**:
```bash
# Take screenshots at các breakpoints
# Mobile: 375px
# Tablet: 768px
# Desktop: 1440px
# 2K: 1920px
# 4K: 2560px
```

### 2.3 Extraction Template

Tạo file `EXTRACTION-NOTES.md`:

```markdown
# SOURCE ANALYSIS NOTES

## Project Info
- Source: [URL or file name]
- Date: [Date]
- Purpose: [Brief description]

## Color System

### Primary Colors
- Primary: #XXXXXX (usage: buttons, links)
- Primary variant 1: #XXXXXX (usage: hover states)
- Primary variant 2: #XXXXXX (usage: borders)

### Text Colors
- Heading: #XXXXXX
- Body: #XXXXXX
- Muted: #XXXXXX

### Backgrounds
- Page: #XXXXXX
- Card: #XXXXXX
- Hover: #XXXXXX

### Status Colors
- Success: #XXXXXX
- Error: #XXXXXX
- Warning: #XXXXXX

## Typography Scale

### Font Families
- Primary: [Font name]
- Heading: [Font name]
- Monospace: [Font name]

### Font Sizes (px → rem conversion)
- Base: XpxX (1rem)
- Small: XpxX (Xrem)
- Large: XpxX (Xrem)
- H1: XpxX (Xrem)
- H2: XpxX (Xrem)
- H3: XpxX (Xrem)

### Font Weights
- Light: 300
- Normal: 400
- Semibold: 600
- Bold: 700

### Line Heights
- Tight: 1.X
- Normal: 1.X
- Loose: 1.X

## Spacing Scale

### Pattern Found
- Unit: Xpx
- Scale: [2, 4, 8, 16, 24, 32, 48, 64]
- OR: [Custom scale found]

### Common Values
- Section padding (desktop): Xpx Y
- Section padding (mobile): Xpx Y
- Container padding: X Y
- Element gaps: Xpx

## Layout Dimensions

### Container
- Max-width: Xpx
- Padding (desktop): Xpx
- Padding (mobile): Xpx

### Header
- Height (desktop): Xpx
- Height (mobile): Xpx
- Sticky: [Yes/No]

### Common Element Sizes
- Button height: Xpx
- Input height: Xpx
- Card min-height: Xpx

## Decorative Styles

### Border Radius
- Small: Xpx
- Medium: Xpx
- Large: Xpx
- Full: [rounded or pill]

### Shadows
- Subtle: [box-shadow value]
- Medium: [box-shadow value]
- Strong: [box-shadow value]

### Borders
- Light: Xpx solid #XXXXXX
- Medium: Xpx solid #XXXXXX
- Accent: Xpx solid #XXXXXX

## Responsive Breakpoints

### Found Breakpoints
- Mobile: X to Ypx
- Tablet: Y to Zpx
- Desktop: Z to Apx
- Large: A+ px

### Media Query Strategy
- [Mobile-first or Desktop-first]
- [Custom breakpoints noted]

## Special Patterns

### Pseudo-elements
- [Description of ::before/::after patterns found]

### Animations
- [Transitions and keyframes noted]

### Grid/Flex Patterns
- [Layout patterns documented]
```

### 2.4 Verification Checklist

Sau khi extract, verify:

- [ ] Extracted all unique colors (no duplicates missed)
- [ ] Font sizes có conversion notes (px to rem)
- [ ] Spacing values form a clear scale
- [ ] All critical dimensions documented
- [ ] Responsive patterns noted
- [ ] Special effects/decorations listed

---

## 3. CHIẾN LƯỢC COPY VS VIẾT MỚI

### 3.1 Decision Matrix

```
┌─────────────────────────┬──────────────┬─────────────┐
│ Component Type          │ Strategy     │ Reason      │
├─────────────────────────┼──────────────┼─────────────┤
│ Browser Reset           │ COPY 100%    │ Standard    │
│ Design Tokens           │ COPY + EDIT  │ Customize   │
│ Container System        │ COPY + ADAPT │ Reusable    │
│ Download Core (if any)  │ COPY 100%    │ Tested      │
│ Section HTML            │ WRITE NEW    │ SEO unique  │
│ Section CSS             │ WRITE NEW    │ New classes │
│ Content                 │ WRITE NEW    │ Copyright   │
└─────────────────────────┴──────────────┴─────────────┘
```

### 3.2 CSS File Categories

#### Category 1: Foundation (Copy + Customize)

```
src/styles/
├── reset.css           (COPY 100% - standardization)
├── base.css            (COPY structure, EDIT values)
└── common.css          (COPY pattern, ADAPT to project)
```

**base.css tasks**:
- Replace color values với extracted values
- Update font families
- Adjust spacing scale nếu cần
- Keep structure (variables, typography, utilities)

**common.css tasks**:
- Copy container pattern
- Adapt class names nếu conflict
- Maintain responsive logic
- Update với project-specific utilities

#### Category 2: Critical CSS (Write New)

```
src/styles/critical/
└── hero.css            (WRITE NEW - above-the-fold)
```

**Purpose**: Inline trong `<head>` cho fast render

**Content**: Layout và colors cho visible content (< 10KB)

#### Category 3: Feature CSS (Project-Dependent)

**Generic structure**:
```
src/styles/features/
├── [section-name-1].css    (WRITE NEW)
├── [section-name-2].css    (WRITE NEW)
├── [section-name-3].css    (WRITE NEW)
└── ...
```

**Examples từ các projects**:
- E-commerce: `product-grid.css`, `cart.css`, `checkout.css`
- Blog: `post-list.css`, `sidebar.css`, `comments.css`
- Landing: `hero.css`, `features.css`, `testimonials.css`
- App: `dashboard.css`, `settings.css`, `notifications.css`

### 3.3 HTML Strategy

**❌ NEVER COPY**:
- Complete HTML files
- Content text
- SEO metadata
- Structured data

**✅ CAN COPY**:
- Structure patterns (generic templates)
- Accessibility attributes (roles, aria-*)
- Container wrapping patterns

**✅ MUST WRITE NEW**:
- All visible content
- Page titles và descriptions
- Alt texts
- Headings hierarchy

---

## 4. CSS ARCHITECTURE - ĐẬP ĐI XÂY LẠI

### 4.1 Tại Sao Rebuild?

**Vấn đề với direct copy**:

```css
/* Source có class names khác */
.site-a-header { /* ... */ }
.old-project-btn { /* ... */ }

/* Target cần class names mới */
.site-b-nav { /* Phải viết lại */ }
.new-brand-button { /* Không thể reuse */ }
```

**Giải pháp**:
1. Extract **patterns** (không phải code)
2. Extract **values** (colors, sizes, spacing)
3. Rebuild với **new class names**
4. Maintain **clean structure**

### 4.2 File Organization Pattern

**Generic template**:

```
src/styles/
│
├── 00-foundation/
│   ├── reset.css
│   ├── variables.css        (design tokens)
│   └── typography.css       (base text styles)
│
├── 01-layout/
│   ├── container.css        (container system)
│   ├── grid.css             (layout grids)
│   └── spacing.css          (margin/padding utilities)
│
├── 02-components/
│   ├── buttons.css
│   ├── forms.css
│   ├── cards.css
│   └── [component].css
│
├── 03-sections/
│   ├── header.css
│   ├── footer.css
│   ├── [section-name].css
│   └── ...
│
└── 04-utilities/
    ├── helpers.css
    └── responsive.css
```

**Adapt theo project**:
- Không bắt buộc dùng numbered prefixes
- Folder names có thể thay đổi
- Nhưng **concept** phải giữ: foundation → components → sections → utilities

### 4.3 Section CSS Template

**Generic structure cho bất kỳ section nào**:

```css
/* =========================================================
   [SECTION NAME]
   ---------------------------------------------------------
   [Brief description of section purpose]
   Mobile-first responsive design
   ========================================================= */

/* ======= BASE STYLES (Mobile Default) ======= */
.section-wrapper {
    padding: var(--section-padding-mobile);
    /* Base mobile styles */
}

.section-title {
    font-size: var(--h2-size-mobile);
    /* Title styles */
}

.section-content {
    /* Content styles */
}

/* ======= DECORATIVE ELEMENTS ======= */
.section-wrapper::before {
    /* Pseudo-element decorations */
}

/* ======= RESPONSIVE ENHANCEMENTS ======= */

/* Tablet */
@media (min-width: 768px) {
    .section-wrapper {
        padding: var(--section-padding-tablet);
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .section-wrapper {
        padding: var(--section-padding-desktop);
    }

    .section-title {
        font-size: var(--h2-size-desktop);
    }
}

/* Large Desktop */
@media (min-width: 1440px) {
    /* Enhancements */
}

/* 2K Display */
@media (min-width: 1920px) {
    /* 2K enhancements */
}

/* 4K Display */
@media (min-width: 2560px) {
    /* 4K enhancements */
}
```

### 4.4 Naming Convention

**BEM Pattern** (recommended but not required):

```css
/* Block */
.feature-card { }

/* Element */
.feature-card__title { }
.feature-card__description { }
.feature-card__icon { }

/* Modifier */
.feature-card--highlighted { }
.feature-card--compact { }
```

**Alternative patterns** (choose one consistently):

```css
/* Namespaced */
.proj-feature-card { }
.proj-feature-title { }

/* Hyphenated */
.feature-card { }
.feature-card-title { }

/* Camel case (less common for CSS) */
.featureCard { }
.featureCardTitle { }
```

**Key rule**: Consistency > Convention

---

## 5. DESIGN TOKENS SYSTEM

### 5.1 Token Categories

**Colors**:
```css
:root {
    /* Semantic naming pattern */
    --color-primary: #XXXXXX;
    --color-primary-dark: #XXXXXX;
    --color-primary-light: #XXXXXX;

    --color-secondary: #XXXXXX;

    --color-text-primary: #XXXXXX;
    --color-text-secondary: #XXXXXX;
    --color-text-muted: #XXXXXX;

    --color-bg-page: #XXXXXX;
    --color-bg-card: #XXXXXX;
    --color-bg-hover: #XXXXXX;

    --color-border: #XXXXXX;
    --color-border-light: #XXXXXX;

    --color-success: #XXXXXX;
    --color-error: #XXXXXX;
    --color-warning: #XXXXXX;
}
```

**Typography**:
```css
:root {
    /* Font families */
    --font-primary: [extracted font];
    --font-heading: [extracted font];
    --font-mono: [monospace font];

    /* Font sizes - T-shirt sizing */
    --font-xs: 0.75rem;     /* 12px */
    --font-sm: 0.875rem;    /* 14px */
    --font-base: 1rem;      /* 16px */
    --font-lg: 1.125rem;    /* 18px */
    --font-xl: 1.25rem;     /* 20px */
    --font-2xl: 1.5rem;     /* 24px */
    --font-3xl: 1.875rem;   /* 30px */
    --font-4xl: 2.25rem;    /* 36px */

    /* Font weights */
    --weight-light: 300;
    --weight-normal: 400;
    --weight-medium: 500;
    --weight-semibold: 600;
    --weight-bold: 700;

    /* Line heights */
    --leading-tight: 1.25;
    --leading-normal: 1.5;
    --leading-relaxed: 1.75;
    --leading-loose: 2;
}
```

**Spacing**:
```css
:root {
    /* 8px scale (common pattern) */
    --space-1: 0.25rem;   /* 4px */
    --space-2: 0.5rem;    /* 8px */
    --space-3: 0.75rem;   /* 12px */
    --space-4: 1rem;      /* 16px */
    --space-5: 1.5rem;    /* 24px */
    --space-6: 2rem;      /* 32px */
    --space-8: 3rem;      /* 48px */
    --space-10: 4rem;     /* 64px */

    /* OR custom scale extracted từ source */
    --space-xs: [extracted]px;
    --space-sm: [extracted]px;
    --space-md: [extracted]px;
    --space-lg: [extracted]px;
    --space-xl: [extracted]px;
}
```

**Sizing**:
```css
:root {
    /* Container */
    --container-max-width: [extracted]px;
    --container-padding: var(--space-4);

    /* Common element sizes */
    --input-height: [extracted]px;
    --button-height: [extracted]px;
    --header-height: [extracted]px;
}
```

**Effects**:
```css
:root {
    /* Border radius */
    --radius-sm: [extracted]px;
    --radius-md: [extracted]px;
    --radius-lg: [extracted]px;
    --radius-full: 9999px;

    /* Shadows */
    --shadow-sm: [extracted value];
    --shadow-md: [extracted value];
    --shadow-lg: [extracted value];

    /* Transitions */
    --transition-fast: 150ms ease;
    --transition-base: 250ms ease;
    --transition-slow: 350ms ease;
}
```

### 5.2 Extraction → Token Workflow

**Step 1**: Analyze extracted values

```
Found colors:
#c10841 - Used 15 times (buttons, links, headings)
#f20a51 - Used 3 times (button backgrounds)
#ff0068 - Used 2 times (input borders)
#293a46 - Used 20 times (text)
```

**Step 2**: Group by purpose

```
Primary family:
- #c10841 (main)
- #f20a51 (button variant)
- #ff0068 (border variant)

Text family:
- #293a46 (primary)
- #666666 (secondary)
- #999999 (muted)
```

**Step 3**: Create semantic names

```css
--color-primary: #c10841;
--color-primary-button: #f20a51;
--color-primary-border: #ff0068;

--color-text-primary: #293a46;
--color-text-secondary: #666666;
--color-text-muted: #999999;
```

**Step 4**: Use consistently

```css
/* Instead of hardcoding */
.button { background: #f20a51; }

/* Use token */
.button { background: var(--color-primary-button); }
```

---

## 6. MOBILE-FIRST RESPONSIVE

### 6.1 Quy Tắc Bắt Buộc

**🔥 ONLY USE `min-width` - NEVER `max-width` 🔥**

```css
/* ❌ WRONG - Desktop-first */
.element {
    padding: 30px; /* Desktop default */
}

@media (max-width: 768px) {
    .element {
        padding: 15px; /* Mobile override */
    }
}
```

```css
/* ✅ CORRECT - Mobile-first */
.element {
    padding: 15px; /* Mobile default */
}

@media (min-width: 768px) {
    .element {
        padding: 30px; /* Desktop enhancement */
    }
}
```

### 6.2 Breakpoint System

**Recommendation** (adjust theo extracted data):

```css
/* Extra Small: 0-599px (default, no media query) */

/* Small: 600px+ (small tablet) */
@media (min-width: 600px) { }

/* Medium: 768px+ (tablet) */
@media (min-width: 768px) { }

/* Large: 1024px+ (desktop) */
@media (min-width: 1024px) { }

/* XL: 1280px+ (large desktop) */
@media (min-width: 1280px) { }

/* 2XL: 1536px+ */
@media (min-width: 1536px) { }

/* 2K: 1920px+ */
@media (min-width: 1920px) { }

/* 4K: 2560px+ */
@media (min-width: 2560px) { }
```

**Custom breakpoints**:

```css
:root {
    /* Define từ extracted data */
    --breakpoint-sm: 640px;
    --breakpoint-md: 768px;
    --breakpoint-lg: 1024px;
    --breakpoint-xl: 1280px;
    --breakpoint-2xl: 1536px;
}

/* Use trong @media */
@media (min-width: 768px) { /* var() doesn't work in media queries */ }
```

### 6.3 Component-Based Responsive

**Pattern**: Media queries ngay sau component styles

```css
/* ✅ GOOD - Component-grouped */

/* === COMPONENT A === */
.component-a {
    font-size: 14px; /* Mobile */
}

@media (min-width: 768px) {
    .component-a {
        font-size: 16px; /* Tablet */
    }
}

@media (min-width: 1024px) {
    .component-a {
        font-size: 18px; /* Desktop */
    }
}

/* === COMPONENT B === */
.component-b {
    padding: 10px; /* Mobile */
}

@media (min-width: 768px) {
    .component-b {
        padding: 20px; /* Tablet */
    }
}
```

```css
/* ❌ BAD - All breakpoints at end */
.component-a { font-size: 14px; }
.component-b { padding: 10px; }

/* Media queries far from components - hard to maintain */
@media (min-width: 768px) {
    .component-a { font-size: 16px; }
    .component-b { padding: 20px; }
}
```

### 6.4 Responsive Patterns

**Typography scaling**:
```css
.heading {
    font-size: 1.5rem;   /* Mobile */
}

@media (min-width: 768px) {
    .heading {
        font-size: 2rem;  /* +33% */
    }
}

@media (min-width: 1024px) {
    .heading {
        font-size: 2.5rem; /* +25% */
    }
}

@media (min-width: 1920px) {
    .heading {
        font-size: 3rem;   /* +20% for 2K */
    }
}
```

**Spacing scaling**:
```css
.section {
    padding: 20px 0; /* Mobile */
}

@media (min-width: 768px) {
    .section {
        padding: 40px 0; /* 2x */
    }
}

@media (min-width: 1024px) {
    .section {
        padding: 60px 0; /* 1.5x */
    }
}
```

**Layout changes**:
```css
/* Stack on mobile */
.grid {
    display: block;
}

.grid-item {
    width: 100%;
    margin-bottom: 20px;
}

/* 2 columns on tablet */
@media (min-width: 768px) {
    .grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
    }

    .grid-item {
        margin-bottom: 0;
    }
}

/* 3 columns on desktop */
@media (min-width: 1024px) {
    .grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 30px;
    }
}

/* 4 columns on 2K */
@media (min-width: 1920px) {
    .grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 40px;
    }
}
```

---

## 7. CONTAINER PATTERN

### 7.1 Generic Container System

**Base pattern**:

```css
.container {
    max-width: var(--container-max-width);
    margin-left: auto;
    margin-right: auto;
    padding-left: var(--container-padding);
    padding-right: var(--container-padding);
}

/* Responsive padding */
@media (min-width: 768px) {
    .container {
        --container-padding: var(--space-6);
    }
}

@media (min-width: 1024px) {
    .container {
        --container-padding: var(--space-8);
    }
}
```

**Variables**:
```css
:root {
    /* Mobile */
    --container-max-width: 100%;
    --container-padding: var(--space-4); /* 16px */
}

@media (min-width: 768px) {
    :root {
        --container-max-width: 720px;
    }
}

@media (min-width: 1024px) {
    :root {
        --container-max-width: 960px;
    }
}

@media (min-width: 1280px) {
    :root {
        --container-max-width: 1200px;
    }
}

@media (min-width: 1920px) {
    :root {
        --container-max-width: 1600px;
    }
}
```

### 7.2 Full-Width Breakout Pattern

**Problem**: Section cần full-width trong container có padding

**Solution**: Negative margins

```css
.container {
    padding: 0 16px;
}

.full-width-section {
    margin-left: -16px;
    margin-right: -16px;
}

/* Responsive */
@media (min-width: 768px) {
    .container {
        padding: 0 32px;
    }

    .full-width-section {
        margin-left: -32px;
        margin-right: -32px;
    }
}
```

**Với CSS variables**:
```css
.container {
    --padding-x: 16px;
    padding-left: var(--padding-x);
    padding-right: var(--padding-x);
}

.full-width-section {
    margin-left: calc(var(--padding-x) * -1);
    margin-right: calc(var(--padding-x) * -1);
}
```

### 7.3 Container Variants

```css
/* Narrow container (reading content) */
.container-narrow {
    max-width: 720px;
}

/* Wide container (content with sidebar) */
.container-wide {
    max-width: 1400px;
}

/* Full container (no max-width) */
.container-full {
    max-width: none;
}

/* Fluid container (percentage-based) */
.container-fluid {
    max-width: 90%;
}
```

---

## 8. ĐIỂM CHÚ Ý QUAN TRỌNG

### 8.1 Colors Phải Exact

**Common mistake**:
```css
/* Using one color for everything */
--color-primary: #XX;

.button { background: var(--color-primary); }
.border { border-color: var(--color-primary); }
.text { color: var(--color-primary); }
```

**Problem**: Source thường có nhiều shades

**Solution**:
```css
/* Specific tokens cho từng usage */
--color-primary: #XX;
--color-primary-dark: #XX;    /* For hover */
--color-primary-light: #XX;   /* For backgrounds */
--color-primary-border: #XX;  /* For borders */

.button { background: var(--color-primary); }
.button:hover { background: var(--color-primary-dark); }
.border { border-color: var(--color-primary-border); }
```

### 8.2 Typography Hierarchy

**Global defaults vs Component overrides**:

```css
/* base.css - Global */
h2 {
    font-size: var(--font-2xl);
    font-weight: var(--weight-light);
}

/* section.css - Component override */
.special-section h2 {
    font-weight: var(--weight-bold); /* Override */
}
```

**Rule**: Document overrides với comments

```css
.special-section h2 {
    font-weight: var(--weight-bold);
    /* Override: This section needs bold headings vs global light */
}
```

### 8.3 Critical Dimensions

**Elements phải exact**:
- Header/navbar height
- Input/button heights (must match)
- Container max-widths
- Fixed sidebar widths

**Verification**:
```bash
# Extract exact value
grep "header-height" source.html

# Verify trong CSS
grep "header" your-styles.css | grep "height"

# Compare numbers
```

### 8.4 Pseudo-elements

**Don't forget**:
```css
/* Decorative ::before */
.section::before {
    content: "";
    /* Positioning */
    /* Styling */
}

/* Icon ::after */
.link::after {
    content: "→";
    /* Styling */
}
```

**Document pattern**:
```css
/* Decorative line separator (extracted from source line XXX) */
.section::before {
    /* ... */
}
```

### 8.5 Display Properties

**Context matters**:

```css
/* Desktop */
.nav-link {
    /* May not have display: block */
}

/* Mobile */
@media (max-width: 767px) {
    .nav-link {
        display: block; /* Stack vertically */
    }
}
```

**Check source at different breakpoints**

### 8.6 Spacing Inconsistencies

**Sections không đồng nhất spacing**:

```css
/* Most sections */
.section {
    padding: var(--space-section);
}

/* Exception: Hero */
.hero-section {
    padding: var(--space-hero); /* Different */
}

/* Exception: Footer */
.footer-section {
    padding: var(--space-footer); /* Different */
}
```

**Document exceptions**:
```css
/* Footer has larger padding than standard sections (per source design) */
.footer-section {
    padding: 60px 0; /* vs standard 30px */
}
```

---

## 9. WORKFLOW GENERIC

### Phase 1: Setup (30 min)

**Tasks**:
1. Create extraction notes file
2. Set up project structure
3. Identify source type (HTML file, live site, design)

**Deliverable**: `EXTRACTION-NOTES.md` template ready

### Phase 2: Analysis (2-3 hours)

**Tasks**:
1. Extract all colors → Document
2. Extract typography scale → Document
3. Extract spacing patterns → Document
4. Extract layout dimensions → Document
5. Extract decorative styles → Document
6. Identify responsive breakpoints → Document

**Tools**:
- Grep commands
- Browser DevTools
- Screenshots at breakpoints

**Deliverable**: Complete `EXTRACTION-NOTES.md`

### Phase 3: Token System (1-2 hours)

**Tasks**:
1. Create `variables.css` (or section in `base.css`)
2. Convert extracted values → CSS variables
3. Organize by category (color, typography, spacing, etc.)
4. Document token usage

**Deliverable**: Design token system ready

### Phase 4: Foundation (1 hour)

**Tasks**:
1. Copy/adapt `reset.css`
2. Create `base.css` với tokens
3. Set up typography defaults
4. Create container system

**Deliverable**: Foundation styles ready

### Phase 5: Section Rebuild (3-5 hours)

**Tasks**:
1. Identify all sections cần rebuild
2. Create CSS file cho mỗi section
3. Implement mobile-first responsive
4. Use design tokens consistently

**Time varies**: Depends on number và complexity của sections

### Phase 6: HTML Structure (2-3 hours)

**Tasks**:
1. Create HTML với new class names
2. Maintain structure patterns
3. Write unique content
4. Verify all semantic markup

**Deliverable**: HTML pages ready

### Phase 7: Integration (1 hour)

**Tasks**:
1. Import CSS trong đúng order
2. Link HTML → CSS
3. Verify no missing imports

**Deliverable**: Integrated codebase

### Phase 8: Testing (2-3 hours)

**Tasks**:
1. Visual comparison với source
2. Responsive testing (all breakpoints)
3. DevTools inspection
4. Fix discrepancies

**Deliverable**: Production-ready code

### Phase 9: Documentation (30 min)

**Tasks**:
1. Document customizations
2. Note deviations từ source
3. Create maintenance guide

**Deliverable**: Project documentation

---

## 10. CHECKLIST UNIVERSAL

### Pre-Development

- [ ] Source identified và accessible
- [ ] All values extracted và documented
- [ ] Design token system planned
- [ ] Class naming convention decided
- [ ] File structure mapped

### Development

**Foundation**:
- [ ] reset.css implemented
- [ ] Design tokens created (variables.css / base.css)
- [ ] Typography system set up
- [ ] Container pattern implemented

**Sections**:
- [ ] All section CSS files created
- [ ] Mobile-first responsive implemented
- [ ] Design tokens used consistently
- [ ] No hardcoded values

**HTML**:
- [ ] Structure matches source patterns
- [ ] Content unique (not copied)
- [ ] Semantic markup correct
- [ ] Accessibility attributes present

### Testing

**Visual**:
- [ ] Pixel-perfect comparison passed
- [ ] Colors exact match
- [ ] Typography exact match
- [ ] Spacing exact match
- [ ] Dimensions exact match

**Responsive**:
- [ ] Mobile (350px-599px) tested
- [ ] Tablet (600px-1023px) tested
- [ ] Desktop (1024px-1919px) tested
- [ ] 2K (1920px-2559px) tested
- [ ] 4K (2560px+) tested
- [ ] No horizontal scroll on any breakpoint

**Functionality**:
- [ ] All links working
- [ ] Forms functional (if applicable)
- [ ] Animations smooth
- [ ] No console errors

**Performance**:
- [ ] CSS optimized (no unused styles)
- [ ] Critical CSS identified
- [ ] Images optimized
- [ ] Fonts loaded efficiently

### Quality

**CSS Architecture**:
- [ ] Clean structure
- [ ] Consistent naming
- [ ] No duplicates
- [ ] Well commented
- [ ] Maintainable

**Responsive**:
- [ ] Only min-width media queries used
- [ ] Component-based responsive
- [ ] All breakpoints working
- [ ] Mobile-first verified

**Documentation**:
- [ ] Extraction notes complete
- [ ] Customizations documented
- [ ] Token system explained
- [ ] Maintenance guide created

---

## 🎯 SUCCESS CRITERIA

Clone được coi là thành công khi:

### Visual Accuracy
- ✅ Colors match exactly (verified in DevTools)
- ✅ Typography matches (sizes, weights, line heights)
- ✅ Spacing matches (padding, margins, gaps)
- ✅ Dimensions match (heights, widths, max-widths)
- ✅ Decorative elements present (shadows, borders, pseudo-elements)

### Code Quality
- ✅ Clean architecture (organized, maintainable)
- ✅ Design token system implemented
- ✅ No hardcoded values
- ✅ Consistent naming convention
- ✅ Mobile-first responsive
- ✅ Well documented

### Functionality
- ✅ All sections render correctly
- ✅ Responsive behavior matches source
- ✅ No regressions or bugs
- ✅ Performance acceptable

### Uniqueness
- ✅ Content unique (SEO-safe)
- ✅ Class names different (if required)
- ✅ No copyright violations

---

## 📊 TIME ESTIMATES

| Phase | Time |
|-------|------|
| Setup | 30 min |
| Analysis | 2-3 hrs |
| Token System | 1-2 hrs |
| Foundation | 1 hr |
| Sections | 3-5 hrs |
| HTML | 2-3 hrs |
| Integration | 1 hr |
| Testing | 2-3 hrs |
| Documentation | 30 min |
| **TOTAL** | **13-20 hrs** |

**Variables**:
- Simple landing page: 10-15 hrs
- Complex multi-page site: 20-30 hrs
- E-commerce/App: 30+ hrs

**Experience factor**:
- First time: +50% time
- Experienced: -25% time

---

## 🚨 COMMON PITFALLS

1. **Guessing values** instead of extracting → Inaccurate clone
2. **Using max-width** media queries → Desktop-first (wrong)
3. **Copying CSS directly** → Class name conflicts
4. **Hardcoding values** → Hard to maintain
5. **Skipping extraction phase** → Waste time fixing later
6. **Incomplete responsive** → Breaks on some screens
7. **Missing pseudo-elements** → Visual differences
8. **Wrong font weights** → Hierarchy broken
9. **Inconsistent spacing** → Sloppy look
10. **No documentation** → Hard to maintain

---

**Document Version**: 2.0 (Generic)
**Purpose**: Universal guide for any project structure
**Last Updated**: 2024
**Maintained By**: Development Team
