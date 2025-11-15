# Reusable CSS Packages

A collection of standalone, zero-dependency CSS packages built with Material Design 3 principles and mobile-first responsive design.

**Package Count**: 7 packages (1 core + 6 components)

## 📦 Available Packages

### 1. **package-root.css** - Central Design Token System
The foundation of all packages. Contains 220+ design tokens organized into:
- **Border Radius** (7 variants): MD3-compatible corner radii
- **Spacing Scale** (15 variants): 4px-80px consistent spacing
- **Typography** (33 variables): Body, label, and title variants with weights and line heights
- **Elevation/Shadows** (12 tokens): MD3 elevation levels
- **Colors**: Semantic color tokens
- **Animation**: Duration and easing tokens
- **Z-index**: Layer management

**Usage:**
```html
<link rel="stylesheet" href="path/to/package-root.css">
```

All package-specific variables use the `--pkg-*` prefix and reference shared base tokens via `var()`.

### 2. **skeleton/** - Loading Skeleton System
Beautiful loading skeletons with shimmer animations for better perceived performance.

**Features:**
- ✨ Zero dependencies - pure CSS
- 📱 Mobile-first responsive (350px → 4K)
- 🎨 Easy theming via CSS variables
- ♿ Accessibility (respects prefers-reduced-motion)
- ⚡ Lightweight (~3KB)

**Components:**
- `.skeleton-text` - Text line skeletons (with width modifiers)
- `.skeleton-title` - Title skeletons
- `.skeleton-subtitle` - Subtitle skeletons
- `.skeleton-img` - Image skeletons (16:9 aspect ratio)
- `.skeleton-thumbnail` - Thumbnail skeletons (fill container)
- `.skeleton-button` - Button skeletons
- `.skeleton-avatar` - Circular avatar skeletons
- `.skeleton-card` - Card pattern
- `.skeleton-list-item` - List item pattern

**Usage:**
```html
<link rel="stylesheet" href="path/to/package-root.css">
<link rel="stylesheet" href="path/to/skeleton/skeleton.css">

<div class="skeleton-text"></div>
<div class="skeleton-img"></div>
<div class="skeleton-button"></div>
```

**See:** `skeleton/README.md` for complete documentation

### 3. **expire-modal/** - Expiration Warning Modal
A clean, user-friendly modal for displaying link expiration warnings.

**Features:**
- 🎨 Clean Material Design 3 styling
- 📱 Fully responsive
- ⚡ Smooth show/hide transitions
- ♿ Accessible keyboard navigation

**Variables Used:**
- `--pkg-expire-modal-overlay-bg`
- `--pkg-expire-modal-bg`
- `--pkg-expire-modal-shadow`
- `--pkg-expire-modal-radius`
- `--pkg-expire-modal-padding`
- `--pkg-expire-modal-z-index`
- `--pkg-warning-color`

**HTML Structure:**
```html
<div class="expire-modal-overlay">
  <div class="expire-modal">
    <div class="expire-modal-header">
      <h3 class="expire-modal-title">Link Expired</h3>
      <button class="expire-modal-close-btn">&times;</button>
    </div>
    <div class="expire-modal-body">
      <span class="expire-modal-icon">⚠️</span>
      <p>Your download link has expired...</p>
    </div>
    <div class="expire-modal-footer">
      <button class="expire-modal-btn expire-modal-btn-primary">Refresh Link</button>
    </div>
  </div>
</div>
```

### 4. **captcha-modal/** - CAPTCHA Verification Modal
A dark-themed modal for CAPTCHA verification flows.

**Features:**
- 🌙 Dark theme optimized for reCAPTCHA
- 📱 Mobile responsive
- ⚡ Instant hide, smooth show transitions
- ♿ Accessible

**Variables Used:**
- `--pkg-captcha-modal-z-index`
- `--pkg-captcha-modal-overlay-bg`
- `--pkg-captcha-modal-bg`
- `--pkg-captcha-modal-radius`
- `--pkg-captcha-modal-padding`
- `--pkg-captcha-modal-shadow`

**HTML Structure:**
```html
<div class="captcha-modal">
  <div class="captcha-modal-overlay"></div>
  <div class="captcha-modal-content">
    <div class="captcha-modal-header">
      <h3 class="captcha-modal-title">Verify You're Human</h3>
      <button class="captcha-modal-close-btn">&times;</button>
    </div>
    <div class="captcha-modal-body">
      <p>Please complete the CAPTCHA below...</p>
      <div class="recaptcha-container">
        <!-- reCAPTCHA widget renders here -->
      </div>
    </div>
  </div>
</div>
```

### 5. **suggestions/** - Autocomplete Dropdown Component
A lightweight autocomplete/suggestions dropdown with keyboard navigation support.

**Features:**
- ⌨️ Full keyboard navigation (Arrow keys, Enter, Escape)
- 📱 Mobile-first responsive
- ⚡ Smooth show/hide animations
- ♿ WCAG compliant accessibility
- 🎨 Custom scrollbar styling

**Components:**
- `.suggestion-container` - Main dropdown container
- `.suggestion-list` - Scrollable list
- `.suggestion-item` - Individual suggestion
- `.suggestion-item--highlighted` - Keyboard highlight state
- `.suggestion-item--original` - Original query styling

**Usage:**
```html
<link rel="stylesheet" href="path/to/package-root.css">
<link rel="stylesheet" href="path/to/suggestions/suggestions.css">

<div style="position: relative;">
  <input type="text" id="search" aria-autocomplete="list">
  <div id="suggestion-container" class="suggestion-container">
    <ul class="suggestion-list">
      <li class="suggestion-item">Suggestion 1</li>
      <li class="suggestion-item suggestion-item--highlighted">Suggestion 2</li>
    </ul>
  </div>
</div>
```

**See:** `suggestions/README.md` for complete documentation

### 6. **search-results/** - Responsive Video Grid Component
A comprehensive video grid layout with skeleton loading states and infinite scroll support.

**Features:**
- 📱 Adaptive grid (2-4 columns based on screen size)
- ✨ Professional skeleton loading states
- ♾️ Infinite scroll ready with indicators
- 🎯 CLS optimized with fixed aspect ratios
- 🔄 Empty state and error handling

**Grid Layout:**
- Mobile (0-599px): 2 columns, 10px gap
- Tablet (600-839px): 3 columns, 12px gap
- Desktop (840px+): 4 columns, 12px gap
- 4K (2560px+): 4 columns, max-width 1600px

**Components:**
- `.search-results-section` - Section container
- `.search-results-grid` - Grid layout
- `.search-result-card` - Video card
- `.skeleton-card` - Loading state card
- `.infinite-scroll-loader` - Loading indicator
- `.btn-retry` - Retry button (error state)

**Usage:**
```html
<link rel="stylesheet" href="path/to/package-root.css">
<link rel="stylesheet" href="path/to/skeleton/skeleton.css">
<link rel="stylesheet" href="path/to/search-results/search-results.css">

<section class="search-results-section">
  <div class="search-results">
    <div class="search-results-grid">
      <!-- Video cards here -->
    </div>
  </div>
</section>
```

**See:** `search-results/README.md` for complete documentation

### 7. **conversion-modal/** - Multi-State Modal Component
A comprehensive modal for displaying conversion/download progress with multiple states.

**Features:**
- 🎭 Multi-state design (loading, success, error, expired)
- 📱 Mobile-first responsive (350px → 4K+)
- ⚡ Smooth animations with pulse feedback
- 🔒 CLS prevention with fixed heights
- ♿ WCAG compliant accessibility

**States:**
- **Loading**: Spinning loader with message
- **Success**: Download button with success icon
- **Error**: Error message with retry button
- **Expired**: Link expiration with refresh option

**Components:**
- `#progressBarWrapper` - Full-screen overlay
- `.conversion-modal-content` - Modal content box
- `.conversion-state` - State container
- `.loading-spinner-container` - Spinner
- `.conversion-icon` - State icons (success/error/expired)
- `.btn-conversion` - Action buttons

**Usage:**
```html
<link rel="stylesheet" href="path/to/package-root.css">
<link rel="stylesheet" href="path/to/conversion-modal/conversion-modal.css">

<div id="progressBarWrapper" style="visibility: visible;">
  <div class="conversion-modal-content">
    <div class="conversion-modal-header">
      <h3 class="modal-video-title">Video Title</h3>
      <button class="btn-close-modal">×</button>
    </div>
    <div class="conversion-modal-body">
      <!-- State content here -->
    </div>
  </div>
</div>
```

**See:** `conversion-modal/README.md` for complete documentation

## 🚀 Quick Start

### Basic Integration

```html
<!-- 1. Import package-root first (required) -->
<link rel="stylesheet" href="path/to/package-root.css">

<!-- 2. Import packages you need -->
<link rel="stylesheet" href="path/to/skeleton/skeleton.css">
<link rel="stylesheet" href="path/to/suggestions/suggestions.css">
<link rel="stylesheet" href="path/to/search-results/search-results.css">
<link rel="stylesheet" href="path/to/conversion-modal/conversion-modal.css">
<link rel="stylesheet" href="path/to/expire-modal/expire-modal.css">
<link rel="stylesheet" href="path/to/captcha-modal/captcha-modal.css">
```

### With JavaScript Module Bundler (Vite, Webpack, etc.)

```javascript
// Import package-root first
import './styles/reusable-packages/package-root.css';

// Import packages
import './styles/reusable-packages/skeleton/skeleton.css';
import './styles/reusable-packages/suggestions/suggestions.css';
import './styles/reusable-packages/search-results/search-results.css';
import './styles/reusable-packages/conversion-modal/conversion-modal.css';
import './styles/reusable-packages/expire-modal/expire-modal.css';
import './styles/reusable-packages/captcha-modal/captcha-modal.css';
```

## 🎨 Customization

Override package-root variables to customize all packages at once:

```css
:root {
  /* Border Radius */
  --pkg-radius-sm: 12px;  /* Rounder corners */

  /* Spacing */
  --pkg-space-4: 20px;    /* More spacious */

  /* Typography */
  --pkg-body-large-size: 1.125rem;  /* Larger text */

  /* Colors */
  --pkg-skeleton-color-dark: #2a2a2a;  /* Dark theme skeletons */
  --pkg-skeleton-color-light: #3a3a3a;

  /* Shadows */
  --pkg-elevation-2: 0 4px 12px rgba(0, 0, 0, 0.2);  /* Stronger shadows */
}
```

Component-specific variables can also be overridden:

```css
:root {
  /* Skeleton-specific */
  --pkg-skeleton-duration: 2s;  /* Slower animation */

  /* Modal-specific */
  --pkg-expire-modal-bg: #f5f5f5;  /* Light gray background */
  --pkg-captcha-modal-bg: #1a1a1a;  /* Darker modal */
}
```

## 📱 Responsive Design

All packages follow mobile-first responsive design with these breakpoints:

| Breakpoint | Range | Description |
|------------|-------|-------------|
| Base | 0–350px | Extra Small Mobile |
| Small | 351–599px | Small Mobile |
| Medium | 600–839px | Tablet |
| Expanded | 840–1239px | Desktop |
| Large | 1240–1919px | Wide Desktop |
| Extra Large | 1920–2559px | 2K Display |
| Ultra Large | 2560px+ | 4K Display |

**Example responsive scaling:**
```css
/* skeleton-text height scales automatically */
/* 0-350px: 0.75em */
/* 351px+: 0.8125em */
/* 840px+: 0.875em */
/* 1920px+: 0.9375em */
/* 2560px+: 1em */
```

## ♿ Accessibility

All packages include accessibility features:

### Reduced Motion Support
Respects user preferences for reduced motion:
```css
@media (prefers-reduced-motion: reduce) {
  /* Animations disabled, static backgrounds shown */
}
```

### Keyboard Navigation
- Modals support keyboard controls
- Focus management for screen readers
- ARIA attributes where appropriate

### Interaction Protection
- Skeleton elements have `pointer-events: none`
- User-select disabled on loading states
- Proper z-index layering for modals

## 🎯 Design Token Architecture

### Shared Base Tokens (package-root.css)
```css
:root {
  /* Base tokens used across all packages */
  --pkg-radius-sm: 8px;
  --pkg-space-4: 16px;
  --pkg-body-medium-size: 0.875rem;
  --pkg-elevation-2: 0 2px 4px rgba(0,0,0,0.2);
}
```

### Component Tokens Reference Base
```css
:root {
  /* Component tokens reference shared base */
  --pkg-skeleton-radius-sm: var(--pkg-radius-xs);
  --pkg-expire-modal-padding: var(--pkg-space-5);
  --pkg-captcha-modal-shadow: var(--pkg-elevation-2);
}
```

This architecture enables:
- **Consistent theming** across all packages
- **Single point of customization** via package-root.css
- **Portable packages** - copy any package folder to a new project
- **Easy maintenance** - update base tokens to cascade changes

## 📦 Package Independence

Each package is standalone and portable:

### To Copy a Package to Another Project:

1. **Copy package-root.css** (required dependency)
2. **Copy the package folder** you need (e.g., `skeleton/`)
3. **Import in order:**
   ```html
   <link rel="stylesheet" href="package-root.css">
   <link rel="stylesheet" href="skeleton/skeleton.css">
   ```

### No External Dependencies:
- ✅ Pure CSS - no JavaScript required
- ✅ No build tools needed
- ✅ No framework dependencies
- ✅ Works with any HTML/CSS project

## 🧪 Browser Support

- ✅ Chrome 76+
- ✅ Firefox 75+
- ✅ Safari 14+
- ✅ Edge 79+

**Required features:**
- CSS Custom Properties
- CSS Animations
- `aspect-ratio` property (for skeleton-img)
- Modern flexbox/grid support

## 📊 Performance

### File Sizes:
- **package-root.css**: ~4KB (169 design tokens)
- **skeleton.css**: ~3KB (complete skeleton system)
- **expire-modal.css**: ~2KB
- **captcha-modal.css**: ~2KB

**Total bundle**: ~11KB for all packages (uncompressed)

### Optimization Tips:
1. **Import only what you need** - don't include unused packages
2. **Lazy load modals** - load modal CSS only when needed
3. **Inline critical CSS** - inline skeleton CSS for above-the-fold content
4. **Minify and gzip** - reduces bundle to ~3-4KB total

## 🔧 Migration Guide

### From Legacy Variables to Package-Root:

**Before (hardcoded):**
```css
.my-component {
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
```

**After (using package-root):**
```css
.my-component {
  border-radius: var(--pkg-radius-sm);
  padding: var(--pkg-space-4);
  box-shadow: var(--pkg-elevation-2);
}
```

### Creating New Packages:

1. **Use package-root variables** wherever possible
2. **Follow naming convention**: `--pkg-{component}-{property}`
3. **Document dependencies** in header comment
4. **Include responsive breakpoints** for mobile-first design
5. **Add accessibility features** (reduced motion, keyboard support)
6. **Create comprehensive README** with examples

## 📚 Documentation

- **package-root.css**: See inline comments for all 169 tokens
- **skeleton/**: See `skeleton/README.md` for complete guide
- **expire-modal/**: See inline comments and HTML structure above
- **captcha-modal/**: See inline comments and HTML structure above

## 🤝 Contributing

When adding new packages:
1. Use `--pkg-*` naming convention
2. Reference package-root tokens via `var()`
3. Follow mobile-first responsive pattern
4. Include accessibility features
5. Document all variables and usage
6. Maintain zero-dependency philosophy

## 📄 License

MIT License - Free to use in personal and commercial projects.

---

**Made with ❤️ for better design systems and faster development**
