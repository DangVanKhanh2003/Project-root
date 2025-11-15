# Skeleton.css - Responsive Loading Skeleton System

A lightweight, standalone CSS library for beautiful loading skeletons with mobile-first responsive design and smooth shimmer animations.

## Features

✨ **Zero Dependencies** - Pure CSS, no JavaScript required
📱 **Mobile-First** - Optimized from 350px to 4K displays
🎨 **Easy Theming** - Customize via CSS custom properties
♿ **Accessible** - Respects `prefers-reduced-motion`
⚡ **Lightweight** - ~3KB minified
🎯 **Production Ready** - Battle-tested in real projects

## Installation

### Option 1: Direct Link
```html
<link rel="stylesheet" href="path/to/skeleton.css">
```

### Option 2: Copy & Paste
Simply copy `skeleton.css` into your project and include it in your HTML.

## Quick Start

```html
<!-- Basic skeleton text -->
<div class="skeleton-text"></div>

<!-- Title skeleton -->
<div class="skeleton-title"></div>

<!-- Image skeleton with 16:9 aspect ratio -->
<div class="skeleton-img"></div>

<!-- Button skeleton -->
<div class="skeleton-button"></div>

<!-- Avatar skeleton (circular) -->
<div class="skeleton-avatar"></div>
```

## Available Components

### Text Skeletons

```html
<!-- Default text line -->
<div class="skeleton-text"></div>

<!-- Short text (40% width) -->
<div class="skeleton-text skeleton-text--short"></div>

<!-- Medium text (60% width) -->
<div class="skeleton-text skeleton-text--medium"></div>

<!-- Long text (85% width) -->
<div class="skeleton-text skeleton-text--long"></div>

<!-- Full width text -->
<div class="skeleton-text skeleton-text--full"></div>

<!-- Desktop-only text (hidden on mobile) -->
<div class="skeleton-text skeleton-text--desktop-only"></div>
```

**Responsive Sizing:**
- 0-350px: 0.75em
- 351px+: 0.8125em
- 840px+: 0.875em
- 1920px+: 0.9375em
- 2560px+: 1em

### Title Skeleton

```html
<div class="skeleton-title"></div>
```

**Responsive Heights:**
- 0-350px: 14px
- 351px+: 16px
- 840px+: 18px
- 1920px+: 20px
- 2560px+: 22px

### Subtitle Skeleton

```html
<div class="skeleton-subtitle"></div>
```

Fixed at 70% width, height scales with em units.

### Image Skeletons

```html
<!-- Fixed 16:9 aspect ratio -->
<div class="skeleton-img"></div>

<!-- Fill container dimensions -->
<div class="skeleton-thumbnail"></div>
```

### Button Skeleton

```html
<div class="skeleton-button"></div>
```

**Responsive Sizes:**
- 0-350px: 80px × 36px
- 351px+: 90px × 38px
- 840px+: 100px × 40px
- 1920px+: 110px × 44px
- 2560px+: 120px × 48px

### Avatar Skeleton

```html
<div class="skeleton-avatar"></div>
```

**Responsive Sizes:**
- 0-350px: 32px × 32px
- 351px+: 36px × 36px
- 840px+: 40px × 40px
- 1240px+: 48px × 48px
- 1920px+: 52px × 52px
- 2560px+: 56px × 56px

## Common Patterns

### Card Skeleton

```html
<div class="skeleton-card">
  <div class="skeleton-img"></div>
  <div class="skeleton-title"></div>
  <div class="skeleton-text skeleton-text--long"></div>
  <div class="skeleton-text skeleton-text--medium"></div>
</div>
```

### List Item Skeleton

```html
<div class="skeleton-list-item">
  <div class="skeleton-avatar"></div>
  <div class="skeleton-group">
    <div class="skeleton-text skeleton-text--full"></div>
    <div class="skeleton-text skeleton-text--medium"></div>
  </div>
</div>
```

### Profile Skeleton

```html
<div class="skeleton-group--inline">
  <div class="skeleton-avatar"></div>
  <div class="skeleton-group">
    <div class="skeleton-title"></div>
    <div class="skeleton-subtitle"></div>
  </div>
</div>
```

## Customization

### CSS Custom Properties

Override these variables to customize the skeleton appearance:

```css
:root {
  /* Colors */
  --skeleton-color-dark: #e0e0e0;    /* Dark shimmer color */
  --skeleton-color-light: #f0f0f0;   /* Light shimmer color */

  /* Animation */
  --skeleton-duration: 1.0s;          /* Animation duration */
  --skeleton-easing: linear;          /* Animation easing */

  /* Border Radius */
  --skeleton-radius-sm: 4px;          /* Small elements (text) */
  --skeleton-radius-md: 6px;          /* Medium elements (title) */
  --skeleton-radius-lg: 8px;          /* Large elements (image) */
  --skeleton-radius-xl: 20px;         /* Extra large (button) */
  --skeleton-radius-full: 50%;        /* Circular (avatar) */
}
```

### Example: Dark Theme

```css
:root {
  --skeleton-color-dark: #2a2a2a;
  --skeleton-color-light: #3a3a3a;
}
```

### Example: Slower Animation

```css
:root {
  --skeleton-duration: 2.0s;
  --skeleton-easing: ease-in-out;
}
```

### Example: Custom Border Radius

```css
:root {
  --skeleton-radius-sm: 2px;
  --skeleton-radius-md: 4px;
  --skeleton-radius-lg: 12px;
}
```

## Responsive Breakpoints

Skeleton.css uses mobile-first responsive design with these breakpoints:

| Breakpoint | Range | Description |
|------------|-------|-------------|
| Base | 0–350px | Extra Small Mobile |
| Small | 351–599px | Small Mobile |
| Medium | 600–839px | Tablet |
| Expanded | 840–1239px | Desktop |
| Large | 1240–1919px | Wide Desktop |
| Extra Large | 1920–2559px | 2K Display |
| Ultra Large | 2560px+ | 4K Display |

All skeleton components scale smoothly across these breakpoints.

## Accessibility

### Reduced Motion Support

Skeleton.css respects user motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations are disabled, showing static gray background */
}
```

Users who prefer reduced motion will see static skeletons without shimmer animation.

### Keyboard & Screen Readers

All skeleton elements have:
- `pointer-events: none` - Prevents interaction
- `user-select: none` - Prevents text selection
- `cursor: default` - Shows default cursor

## Browser Support

- ✅ Chrome 76+
- ✅ Firefox 75+
- ✅ Safari 14+
- ✅ Edge 79+

**Note:** Requires support for:
- CSS Custom Properties
- CSS Animations
- `aspect-ratio` property (for `.skeleton-img`)

## Performance

### File Size
- **Uncompressed:** ~3KB
- **Minified:** ~2KB
- **Gzipped:** ~0.8KB

### Animation Performance
- Uses `background-position` animation
- GPU-accelerated with `will-change`
- 60fps on mobile devices
- Optimized for low-end devices

## Integration Examples

### With React

```jsx
function LoadingCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img" />
      <div className="skeleton-title" />
      <div className="skeleton-text skeleton-text--long" />
      <div className="skeleton-text skeleton-text--medium" />
    </div>
  );
}
```

### With Vue

```vue
<template>
  <div class="skeleton-card">
    <div class="skeleton-img"></div>
    <div class="skeleton-title"></div>
    <div class="skeleton-text skeleton-text--long"></div>
  </div>
</template>
```

### With Vanilla JavaScript

```javascript
function showSkeleton() {
  const container = document.getElementById('content');
  container.innerHTML = `
    <div class="skeleton-card">
      <div class="skeleton-img"></div>
      <div class="skeleton-title"></div>
      <div class="skeleton-text skeleton-text--long"></div>
    </div>
  `;
}

function showContent(data) {
  // Replace skeleton with real content
  const container = document.getElementById('content');
  container.innerHTML = `
    <img src="${data.image}" alt="${data.title}">
    <h2>${data.title}</h2>
    <p>${data.description}</p>
  `;
}
```

## Best Practices

### 1. Match Content Layout
Make sure skeleton structure matches the final content:

```html
<!-- ❌ Bad: Different structure -->
<div class="skeleton-text"></div>
<!-- Becomes -->
<h1>Title</h1>
<p>Content</p>

<!-- ✅ Good: Matching structure -->
<div class="skeleton-title"></div>
<div class="skeleton-text"></div>
<!-- Becomes -->
<h1>Title</h1>
<p>Content</p>
```

### 2. Prevent Layout Shift
Use fixed dimensions or aspect ratios:

```html
<!-- ✅ Good: Fixed aspect ratio -->
<div class="skeleton-img"></div>

<!-- ✅ Good: Container-based -->
<div style="width: 100%; height: 200px;">
  <div class="skeleton-thumbnail"></div>
</div>
```

### 3. Hide Decorative Skeletons on Mobile
Use `--desktop-only` modifier for secondary elements:

```html
<div class="skeleton-text skeleton-text--full"></div>
<div class="skeleton-text skeleton-text--desktop-only"></div>
```

### 4. Group Related Skeletons
Use utility classes for better organization:

```html
<div class="skeleton-group">
  <div class="skeleton-title"></div>
  <div class="skeleton-text"></div>
  <div class="skeleton-text"></div>
</div>
```

## Troubleshooting

### Skeletons Not Animating
**Problem:** Skeletons show as static gray boxes.

**Solutions:**
1. Check if user has `prefers-reduced-motion` enabled
2. Verify browser supports CSS animations
3. Check for conflicting CSS that overrides `animation`

### Wrong Sizing
**Problem:** Skeletons are too large or too small.

**Solutions:**
1. Use appropriate skeleton type (text vs title vs subtitle)
2. Check parent container dimensions
3. Customize with CSS custom properties

### Layout Shifting
**Problem:** Content jumps when skeletons are replaced.

**Solutions:**
1. Ensure skeleton structure matches final content
2. Use fixed dimensions or aspect ratios
3. Add `min-height` to containers

## License

MIT License - Free to use in personal and commercial projects.

## Credits

Developed for production use in media downloader applications.
Tested across 350px mobile screens to 4K displays.

## Changelog

### Version 1.0.0 (2025-01-14)
- Initial release
- 8 skeleton components
- Full responsive support (350px → 4K)
- CSS custom properties for theming
- Accessibility support
- Mobile-first design

---

**Made with ❤️ for better loading experiences**
