# Suggestions Package - Autocomplete Dropdown Component

A lightweight, accessible autocomplete/suggestions dropdown component built with pure CSS.

## Features

- ✨ **Zero JavaScript dependencies** - Pure CSS implementation
- 📱 **Mobile-first responsive** - 350px → 4K+ displays
- ⌨️ **Keyboard navigation** - Full keyboard support with visual highlights
- 🎨 **Easy theming** - Customize via CSS variables
- ♿ **Accessibility** - WCAG compliant, respects reduced motion
- ⚡ **Lightweight** - ~3KB uncompressed
- 🎭 **Smooth animations** - CSS transitions with performance optimization

## Installation

### 1. Import Required CSS

```html
<!-- Import package-root first (required dependency) -->
<link rel="stylesheet" href="path/to/reusable-packages/package-root.css">

<!-- Then import suggestions package -->
<link rel="stylesheet" href="path/to/reusable-packages/suggestions/suggestions.css">
```

### 2. Or with JavaScript Bundler

```javascript
// Import package-root first
import './styles/reusable-packages/package-root.css';

// Import suggestions package
import './styles/reusable-packages/suggestions/suggestions.css';
```

## Usage

### HTML Structure

```html
<div class="input-wrapper" style="position: relative;">
  <!-- Input field -->
  <input
    type="text"
    id="search-input"
    placeholder="Start typing..."
    autocomplete="off"
    aria-autocomplete="list"
    aria-controls="suggestion-container"
    aria-expanded="false"
  />

  <!-- Suggestions dropdown -->
  <div
    id="suggestion-container"
    class="suggestion-container"
    role="listbox"
    aria-label="Search suggestions"
  >
    <ul class="suggestion-list">
      <!-- Suggestion items will be inserted here -->
    </ul>
  </div>
</div>
```

### JavaScript Integration

```javascript
// Show suggestions
function showSuggestions(items) {
  const container = document.getElementById('suggestion-container');
  const list = container.querySelector('.suggestion-list');

  // Clear existing items
  list.innerHTML = '';

  // Add new items
  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'suggestion-item';
    li.textContent = item;
    li.setAttribute('role', 'option');
    li.setAttribute('tabindex', '-1');
    list.appendChild(li);
  });

  // Show container
  container.classList.add('suggestion-container--visible');
  document.getElementById('search-input').setAttribute('aria-expanded', 'true');
}

// Hide suggestions
function hideSuggestions() {
  const container = document.getElementById('suggestion-container');
  container.classList.remove('suggestion-container--visible');
  document.getElementById('search-input').setAttribute('aria-expanded', 'false');
}

// Keyboard navigation example
function handleKeyboardNav(event) {
  const items = document.querySelectorAll('.suggestion-item');
  const highlighted = document.querySelector('.suggestion-item--highlighted');

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (!highlighted && items.length > 0) {
      items[0].classList.add('suggestion-item--highlighted');
    } else if (highlighted) {
      const next = highlighted.nextElementSibling;
      if (next) {
        highlighted.classList.remove('suggestion-item--highlighted');
        next.classList.add('suggestion-item--highlighted');
      }
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (highlighted) {
      const prev = highlighted.previousElementSibling;
      if (prev) {
        highlighted.classList.remove('suggestion-item--highlighted');
        prev.classList.add('suggestion-item--highlighted');
      }
    }
  } else if (event.key === 'Enter' && highlighted) {
    event.preventDefault();
    highlighted.click();
  } else if (event.key === 'Escape') {
    hideSuggestions();
  }
}
```

## Customization

### CSS Variables

Override these variables in your CSS to customize the suggestions dropdown:

```css
:root {
  /* Container styling */
  --pkg-suggestions-bg: #ffffff;
  --pkg-suggestions-shadow: -8px 10px 10px rgba(0, 0, 0, 0.1);
  --pkg-suggestions-radius: 12px;
  --pkg-suggestions-offset-top: 55px;  /* Position below input */

  /* Colors */
  --pkg-suggestions-text-color: #333333;
  --pkg-suggestions-hover-bg: #e1effe;
  --pkg-suggestions-highlight-bg: #B8CFE1;
  --pkg-suggestions-highlight-color: #1a2832;

  /* Animation */
  --pkg-suggestions-duration: 150ms;
  --pkg-suggestions-easing: cubic-bezier(0.2, 0, 0, 1);

  /* Z-index */
  --pkg-suggestions-z-index: 1030;
}
```

### Example: Dark Theme

```css
:root {
  --pkg-suggestions-bg: #2c2c2e;
  --pkg-suggestions-text-color: #ffffff;
  --pkg-suggestions-hover-bg: #3a3a3c;
  --pkg-suggestions-highlight-bg: #0a84ff;
  --pkg-suggestions-highlight-color: #ffffff;
  --pkg-suggestions-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}
```

## Classes Reference

### Container Classes

- `.suggestion-container` - Main container (hidden by default)
- `.suggestion-container--visible` - Add to show the dropdown

### List Classes

- `.suggestion-list` - Scrollable list container

### Item Classes

- `.suggestion-item` - Individual suggestion item
- `.suggestion-item--highlighted` - Currently highlighted item (keyboard navigation)
- `.suggestion-item--original` - Original user query (optional styling)

## Responsive Breakpoints

The component automatically adapts to screen sizes:

| Breakpoint | Range | Behavior |
|------------|-------|----------|
| Extra Small | 0-350px | Compact display, smaller text |
| Small Mobile | 351-599px | Standard mobile experience |
| Tablet | 600-839px | More spacious, subtle shadow |
| Desktop | 840-1239px | Hover effects enabled |
| Wide Desktop | 1240-1919px | Enhanced spacing, larger text |
| 2K Display | 1920-2559px | Optimized for large screens |
| 4K+ Display | 2560px+ | Premium experience, max spacing |

## Accessibility

### Keyboard Support

- `Arrow Down` - Highlight next item
- `Arrow Up` - Highlight previous item
- `Enter` - Select highlighted item
- `Escape` - Close dropdown

### ARIA Attributes

Required ARIA attributes (add via JavaScript):

```javascript
// On input field
inputElement.setAttribute('role', 'combobox');
inputElement.setAttribute('aria-autocomplete', 'list');
inputElement.setAttribute('aria-controls', 'suggestion-container');
inputElement.setAttribute('aria-expanded', 'false'); // or 'true' when showing

// On container
container.setAttribute('role', 'listbox');
container.setAttribute('aria-label', 'Search suggestions');

// On each item
item.setAttribute('role', 'option');
item.setAttribute('aria-selected', 'false'); // or 'true' for highlighted
```

### Motion Preferences

Automatically respects `prefers-reduced-motion`:
- Animations disabled for users who prefer reduced motion
- Container appears instantly without transform animation

### Touch Targets

On touch devices (`pointer: coarse`):
- Minimum touch target height: 40px (WCAG AA compliant)

## Browser Support

- ✅ Chrome 76+
- ✅ Firefox 75+
- ✅ Safari 14+
- ✅ Edge 79+

**Required CSS features:**
- CSS Custom Properties
- CSS Transitions
- `contain` property
- `color-mix()` (for original query styling - degrades gracefully)

## Performance

- **File size**: ~3KB uncompressed, ~1KB gzipped
- **Animations**: Uses `transform` and `opacity` for GPU acceleration
- **CLS prevention**: `contain: layout style paint` for layout isolation
- **Scroll performance**: Native smooth scrolling on mobile

## Examples

### Basic Usage

```html
<div style="position: relative;">
  <input type="text" id="search" placeholder="Search..." />
  <div id="suggestion-container" class="suggestion-container">
    <ul class="suggestion-list">
      <li class="suggestion-item">JavaScript</li>
      <li class="suggestion-item suggestion-item--highlighted">TypeScript</li>
      <li class="suggestion-item">Python</li>
    </ul>
  </div>
</div>
```

### With Original Query

```html
<ul class="suggestion-list">
  <li class="suggestion-item suggestion-item--original">react hooks (your query)</li>
  <li class="suggestion-item">react hooks tutorial</li>
  <li class="suggestion-item">react hooks examples</li>
</ul>
```

## Tips & Best Practices

1. **Parent Positioning**: Ensure parent container has `position: relative`
2. **Z-index Stacking**: Adjust `--pkg-suggestions-z-index` if conflicts occur
3. **Offset Positioning**: Adjust `--pkg-suggestions-offset-top` to match your input height
4. **Debouncing**: Debounce input events (300ms recommended) to reduce API calls
5. **Max Items**: Limit to 5-10 suggestions for better UX
6. **Loading State**: Consider adding a loading indicator for async suggestions
7. **Empty State**: Show "No results" message when suggestions array is empty

## License

MIT License - Free to use in personal and commercial projects.

---

**Part of the Reusable Packages Collection** - See `/reusable-packages/README.md` for more packages.
