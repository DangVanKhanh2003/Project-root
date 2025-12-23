# Search Results Package - Responsive Video Grid Component

A comprehensive video grid layout component with skeleton loading states, infinite scroll support, and mobile-first responsive design.

## Features

- 📱 **Adaptive Grid Layout** - 2 columns (mobile) → 4 columns (desktop+)
- ✨ **Skeleton Loading States** - Professional loading UX
- ♾️ **Infinite Scroll Ready** - Built-in indicators and sentinel elements
- 🎯 **CLS Optimized** - Zero layout shift with fixed aspect ratios
- 🎨 **Easy Theming** - Customize via CSS variables
- ⚡ **Lightweight** - Pure CSS, ~5KB uncompressed
- ♿ **Accessible** - WCAG compliant, reduced motion support

## Installation

```html
<!-- Required: Import package-root first -->
<link rel="stylesheet" href="path/to/package-root.css">

<!-- Recommended: Import skeleton package for loading states -->
<link rel="stylesheet" href="path/to/skeleton/skeleton.css">

<!-- Import search-results package -->
<link rel="stylesheet" href="path/to/search-results/search-results.css">
```

## Grid Layout - Responsive Breakpoints

| Breakpoint | Columns | Gap | Max Width | Metadata |
|------------|---------|-----|-----------|----------|
| Mobile (0-599px) | 2 | 10px | 100% | Hidden |
| Tablet (600-839px) | 3 | 12px | 100% | Visible |
| Desktop (840-1239px) | 4 | 12px | 1100px | Visible |
| Wide (1240-1919px) | 4 | 12px | 1100px | Visible |
| 2K (1920-2559px) | 4 | 12px | 1100px | Visible |
| 4K (2560px+) | 4 | 12px | 1600px | Visible |

## Usage

### Basic HTML Structure

```html
<section class="search-results-section">
  <div class="search-results">
    <div class="search-results-grid">
      <!-- Video cards here -->
    </div>
  </div>
</section>
```

### Video Card Structure

```html
<div class="search-result-card">
  <!-- Thumbnail -->
  <div class="card-thumbnail">
    <img src="thumbnail.jpg" alt="Video title" loading="lazy">
    <span class="duration-badge">12:34</span>
  </div>

  <!-- Content -->
  <div class="card-content">
    <h3 class="card-title">Video Title Here</h3>
    <p class="card-channel">Channel Name</p>
    <div class="card-metadata">
      <span>1.2M views</span>
      <span>•</span>
      <span>2 days ago</span>
    </div>
  </div>
</div>
```

### Skeleton Loading State

```html
<div class="search-result-card skeleton-card">
  <div class="card-thumbnail">
    <span class="skeleton-thumbnail"></span>
  </div>
  <div class="card-content">
    <div class="skeleton-title">
      <span class="skeleton-line skeleton-line--long"></span>
      <span class="skeleton-line skeleton-line--medium"></span>
    </div>
    <div class="skeleton-channel">
      <span class="skeleton-line skeleton-line--short"></span>
    </div>
    <div class="skeleton-metadata">
      <span class="skeleton-segment"></span>
      <span class="skeleton-segment"></span>
    </div>
  </div>
</div>
```

### Infinite Scroll Integration

```html
<!-- Loading indicator -->
<div class="infinite-scroll-loader">
  <div class="loader-spinner"></div>
  <p class="loader-text">Loading more...</p>
</div>

<!-- Sentinel for IntersectionObserver -->
<div class="infinite-scroll-sentinel"></div>

<!-- End of results -->
<div class="end-of-results">
  <p class="end-message">No more results</p>
</div>

<!-- Error state -->
<div class="load-more-error">
  <p class="error-message">Failed to load more results</p>
  <button class="btn-retry">Retry</button>
</div>
```

### JavaScript Example

```javascript
// IntersectionObserver for infinite scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadMoreResults();
    }
  });
}, {
  rootMargin: '100px' // Load before reaching sentinel
});

const sentinel = document.querySelector('.infinite-scroll-sentinel');
observer.observe(sentinel);

// Load more results
async function loadMoreResults() {
  try {
    showLoader();
    const results = await fetchMoreResults();
    renderResults(results);
    hideLoader();
  } catch (error) {
    showError();
  }
}
```

## Customization

### CSS Variables

```css
:root {
  /* Section Background */
  --pkg-search-results-section-bg: #f2f2f2;

  /* Card Styling */
  --pkg-search-results-card-bg: #ffffff;
  --pkg-search-results-card-radius: 12px;
  --pkg-search-results-card-shadow: none;
  --pkg-search-results-card-shadow-hover: 0 2px 4px rgba(0,0,0,0.2);

  /* Grid Spacing */
  --pkg-search-results-gap-mobile: 10px;
  --pkg-search-results-gap-tablet: 12px;

  /* Typography Colors */
  --pkg-search-results-title-color: #333333;
  --pkg-search-results-channel-color: #666666;
  --pkg-search-results-metadata-color: #666666;

  /* Duration Badge */
  --pkg-search-results-duration-bg: rgba(0, 0, 0, 0.65);
  --pkg-search-results-duration-color: #ffffff;

  /* Retry Button */
  --pkg-search-results-retry-bg: #ffb01e;
  --pkg-search-results-retry-color: #000000;
  --pkg-search-results-retry-hover-bg: #2c62e6;

  /* Animation */
  --pkg-search-results-transition-duration: 200ms;
  --pkg-search-results-transition-easing: cubic-bezier(0.2, 0, 0, 1);
}
```

### Dark Theme Example

```css
:root {
  --pkg-search-results-section-bg: #1a1a1a;
  --pkg-search-results-card-bg: #2c2c2e;
  --pkg-search-results-title-color: #ffffff;
  --pkg-search-results-channel-color: #aaaaaa;
  --pkg-search-results-metadata-color: #888888;
}
```

## Classes Reference

### Container Classes
- `.search-results-section` - Outer section wrapper
- `.search-results` - Inner container
- `.search-results-grid` - CSS Grid container

### Card Classes
- `.search-result-card` - Individual video card
- `.card-thumbnail` - Thumbnail container (16:9 aspect ratio)
- `.card-content` - Text content area
- `.card-title` - Video title (h3)
- `.card-channel` - Channel name (p)
- `.card-metadata` - Views/date row (hidden on mobile)
- `.duration-badge` - Video duration overlay

### Skeleton Classes
- `.skeleton-card` - Add to `.search-result-card` for loading state
- `.skeleton-thumbnail` - Thumbnail loading shimmer
- `.skeleton-title` - Title loading lines
- `.skeleton-channel` - Channel loading line
- `.skeleton-metadata` - Metadata loading segments
- `.skeleton-line` - Generic loading line (with modifiers: `--long`, `--medium`, `--short`)
- `.skeleton-segment` - Small loading segment

### Infinite Scroll Classes
- `.infinite-scroll-loader` - Loading indicator container
- `.loader-spinner` - Spinning loader
- `.loader-text` - "Loading..." text
- `.infinite-scroll-sentinel` - Invisible IntersectionObserver target
- `.end-of-results` - End of results message
- `.end-message` - End message text
- `.load-more-error` - Error state container
- `.error-message` - Error message text
- `.btn-retry` - Retry button

## Performance

### CLS Prevention
- Fixed `aspect-ratio: 16/9` on thumbnails
- Skeleton states maintain exact card dimensions
- No layout shift when loading images

### Optimization Tips
1. Use `loading="lazy"` on thumbnail images
2. Serve appropriately sized images (320px, 640px, 1280px srcset)
3. Implement virtual scrolling for 100+ items
4. Debounce infinite scroll triggers
5. Preload next batch before reaching bottom

## Browser Support

- ✅ Chrome 76+ (CSS Grid, aspect-ratio)
- ✅ Firefox 75+
- ✅ Safari 14+
- ✅ Edge 79+

## License

MIT License - Free to use in personal and commercial projects.

---

**Part of the Reusable Packages Collection**
