# Conversion Modal Package - Multi-State Modal Component

A comprehensive modal component for displaying conversion/download progress with multiple states (loading, success, error, expired).

## Features

- 🎭 **Multi-State Design** - Loading, success, error, expired states
- 📱 **Mobile-first responsive** - 350px → 4K+ displays
- ⚡ **Smooth animations** - Modal show/hide, pulse feedback, spinner
- 🎨 **Easy theming** - Customize via CSS variables
- ♿ **Accessibility** - WCAG compliant, keyboard navigation, reduced motion
- 🔒 **CLS Prevention** - Fixed heights prevent layout shift
- ⚡ **Lightweight** - Pure CSS, ~8KB uncompressed
- 🎯 **Overlay click protection** - Pulse animation feedback

## Installation

```html
<!-- Required: Import package-root first -->
<link rel="stylesheet" href="path/to/package-root.css">

<!-- Import conversion-modal package -->
<link rel="stylesheet" href="path/to/conversion-modal/conversion-modal.css">
```

## Modal States

### 1. Loading State
Shows spinning loader with message while processing conversion.

### 2. Success State
Displays download button and success icon when ready.

### 3. Error State
Shows error message with retry button.

### 4. Expired State
Indicates link expiration with refresh option.

## Usage

### Basic HTML Structure

```html
<!-- Modal Wrapper -->
<div id="progressBarWrapper" style="visibility: visible;">
  <!-- Modal Content -->
  <div class="conversion-modal-content">
    <!-- Header -->
    <div class="conversion-modal-header">
      <h3 class="modal-video-title">Video Title Here</h3>
      <button class="btn-close-modal" aria-label="Close">
        <svg><!-- Close icon --></svg>
      </button>
    </div>

    <!-- Body (State content changes here) -->
    <div class="conversion-modal-body">
      <div class="conversion-state">
        <!-- State-specific content -->
      </div>
    </div>

    <!-- Footer -->
    <div class="conversion-modal-footer">
      <div class="social-sharing-container">
        <div class="social-sharing-text">
          <span>Share this tool:</span>
        </div>
        <div class="share-icons">
          <!-- Social icons -->
        </div>
      </div>
    </div>
  </div>
</div>
```

### Loading State

```html
<div class="conversion-state">
  <!-- Spinner -->
  <div class="loading-spinner-container">
    <div class="spinning-circle"></div>
  </div>

  <!-- Title -->
  <h4 class="conversion-title">Converting...</h4>

  <!-- Message -->
  <p class="conversion-message">Please wait while we process your video</p>
</div>
```

### Success State

```html
<div class="conversion-state">
  <!-- Icon -->
  <div class="conversion-icon conversion-icon--success">✓</div>

  <!-- Title -->
  <h4 class="conversion-title">Ready to Download!</h4>

  <!-- Message -->
  <p class="conversion-message">Your file is ready</p>

  <!-- Actions -->
  <div class="conversion-actions">
    <button class="btn-conversion btn-conversion--download">
      Download Now
    </button>
  </div>
</div>
```

### Error State

```html
<div class="conversion-state">
  <!-- Icon -->
  <div class="conversion-icon conversion-icon--error">✕</div>

  <!-- Title -->
  <h4 class="conversion-title">Conversion Failed</h4>

  <!-- Message -->
  <p class="conversion-message conversion-message--error">
    Something went wrong. Please try again.
  </p>

  <!-- Actions -->
  <div class="conversion-actions">
    <button class="btn-conversion btn-conversion--cancel">Cancel</button>
    <button class="btn-conversion btn-conversion--retry">Retry</button>
  </div>
</div>
```

### Expired State

```html
<div class="conversion-state">
  <!-- Icon -->
  <div class="conversion-icon conversion-icon--expired">⚠</div>

  <!-- Title -->
  <h4 class="conversion-title">Link Expired</h4>

  <!-- Message -->
  <p class="conversion-message">
    Your download link has expired. Please generate a new one.
  </p>

  <!-- Actions -->
  <div class="conversion-actions">
    <button class="btn-conversion btn-conversion--retry">Refresh Link</button>
  </div>
</div>
```

## JavaScript Integration

### Show Modal

```javascript
function showModal() {
  const wrapper = document.getElementById('progressBarWrapper');
  wrapper.style.visibility = 'visible';
}
```

### Hide Modal

```javascript
function hideModal() {
  const wrapper = document.getElementById('progressBarWrapper');
  wrapper.style.visibility = 'hidden';
}
```

### Overlay Click Protection (Pulse)

```javascript
const wrapper = document.getElementById('progressBarWrapper');
const content = wrapper.querySelector('.conversion-modal-content');

wrapper.addEventListener('click', (e) => {
  if (e.target === wrapper) {
    // User clicked overlay - pulse animation
    content.classList.add('pulse');
    setTimeout(() => content.classList.remove('pulse'), 280);
  }
});
```

### State Switching

```javascript
function showLoadingState() {
  const body = document.querySelector('.conversion-modal-body');
  body.innerHTML = `
    <div class="conversion-state">
      <div class="loading-spinner-container">
        <div class="spinning-circle"></div>
      </div>
      <h4 class="conversion-title">Converting...</h4>
      <p class="conversion-message">Please wait</p>
    </div>
  `;
}

function showSuccessState(downloadUrl) {
  const body = document.querySelector('.conversion-modal-body');
  body.innerHTML = `
    <div class="conversion-state">
      <div class="conversion-icon conversion-icon--success">✓</div>
      <h4 class="conversion-title">Ready!</h4>
      <div class="conversion-actions">
        <a href="${downloadUrl}" class="btn-conversion btn-conversion--download">
          Download
        </a>
      </div>
    </div>
  `;
}
```

## Customization

### CSS Variables

```css
:root {
  /* Overlay */
  --pkg-conversion-modal-overlay-bg: rgba(0, 0, 0, 0.5);
  --pkg-conversion-modal-z-index: 1050;

  /* Container */
  --pkg-conversion-modal-bg: #ffffff;
  --pkg-conversion-modal-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  --pkg-conversion-modal-radius: 12px;
  --pkg-conversion-modal-max-width-base: 400px;

  /* Header */
  --pkg-conversion-modal-header-border: #e0e0e0;
  --pkg-conversion-modal-title-color: #1a1a1a;

  /* Body */
  --pkg-conversion-modal-body-padding: 24px;
  --pkg-conversion-modal-body-min-height-mobile: 180px;

  /* State Colors */
  --pkg-conversion-success-color: #16a34a;
  --pkg-conversion-error-color: #dc2626;
  --pkg-conversion-warning-color: #f59e0b;

  /* Buttons */
  --pkg-conversion-download-bg: #2c62e6;
  --pkg-conversion-download-color: #ffffff;
  --pkg-conversion-cancel-bg: #f5f5f5;
  --pkg-conversion-cancel-color: #1a1a1a;

  /* Retry Button (Gradient) */
  --pkg-conversion-retry-gradient-start: #f97316;
  --pkg-conversion-retry-gradient-end: #ea580c;
  --pkg-conversion-retry-color: #ffffff;

  /* Spinner */
  --pkg-conversion-spinner-color: #2c62e6;
  --pkg-conversion-spinner-bg: rgba(59, 130, 246, 0.1);

  /* Animation */
  --pkg-conversion-modal-duration: 200ms;
  --pkg-conversion-pulse-duration: 280ms;
}
```

### Dark Theme Example

```css
:root {
  --pkg-conversion-modal-bg: #2c2c2e;
  --pkg-conversion-modal-header-border: #444444;
  --pkg-conversion-modal-title-color: #ffffff;
  --pkg-conversion-modal-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}
```

## Classes Reference

### Container Classes
- `#progressBarWrapper` - Full-screen overlay wrapper
- `.conversion-modal-content` - Modal content box
- `.conversion-modal-content.pulse` - Pulse animation (overlay click)

### Section Classes
- `.conversion-modal-header` - Header section
- `.conversion-modal-body` - Body section (state content)
- `.conversion-modal-footer` - Footer section

### Header Classes
- `.modal-video-title` - Video title (h3)
- `.btn-close-modal` - Close button

### State Classes
- `.conversion-state` - State container
- `.conversion-icon` - State icon
- `.conversion-icon--success` - Success icon (green)
- `.conversion-icon--error` - Error icon (red)
- `.conversion-icon--expired` - Expired icon (orange)
- `.conversion-title` - State title (h4)
- `.conversion-message` - State message (p)
- `.conversion-message--error` - Error message styling
- `.conversion-hint` - Hint text

### Loading Classes
- `.loading-spinner-container` - Spinner container
- `.spinning-circle` - Animated spinner

### Button Classes
- `.conversion-actions` - Button container
- `.btn-conversion` - Base button class
- `.btn-conversion--download` - Download button (success state)
- `.btn-conversion--cancel` - Cancel button
- `.btn-conversion--retry` - Retry button (error/expired state)

### Footer Classes
- `.social-sharing-container` - Social sharing section
- `.social-sharing-text` - Sharing text
- `.share-icons` - Social icons container

## Responsive Breakpoints

| Breakpoint | Max Width | Body Min Height | Behavior |
|------------|-----------|-----------------|----------|
| Extra Small (0-350px) | 400px | 180px | Compact |
| Small (351-599px) | 440px | 220px | Standard mobile |
| Tablet (600-839px) | 480px | 250px | More spacious |
| Desktop (840-1239px) | 500px | 250px | Desktop optimized |
| Wide (1240-1919px) | 520px | 250px | Enhanced spacing |
| 2K (1920-2559px) | 560px | 280px | Large screen |
| 4K (2560px+) | 600px | 280px | Premium experience |

## Accessibility

### Keyboard Support
- `Escape` - Close modal (implement in JavaScript)
- `Tab` - Navigate between buttons
- Focus trap within modal when open

### ARIA Attributes

```html
<!-- Modal wrapper -->
<div id="progressBarWrapper"
     role="dialog"
     aria-modal="true"
     aria-labelledby="modal-title">

<!-- Close button -->
<button class="btn-close-modal"
        aria-label="Close modal">

<!-- Title -->
<h3 class="modal-video-title" id="modal-title">
```

### Motion Preferences

Pulse animation respects `prefers-reduced-motion`:
- Animation disabled → Static border highlight
- Provides visual feedback without motion

## Browser Support

- ✅ Chrome 76+
- ✅ Firefox 75+
- ✅ Safari 14+
- ✅ Edge 79+

**Required features:**
- CSS Custom Properties
- CSS Animations
- CSS Grid/Flexbox
- `inset` property

## Performance

- **File size**: ~8KB uncompressed, ~2.5KB gzipped
- **CLS prevention**: Fixed min-heights prevent layout shift
- **GPU acceleration**: `transform` and `opacity` animations
- **Instant hide**: No transition when closing

## Tips & Best Practices

1. **Focus Management**: Trap focus within modal when open
2. **Escape Key**: Implement ESC to close
3. **Body Scroll**: Disable body scroll when modal is open
4. **State Transitions**: Smooth fade between states
5. **Error Recovery**: Always provide retry action on errors
6. **Loading Time**: Show spinner immediately on action
7. **Success Feedback**: Clear call-to-action button

## License

MIT License - Free to use in personal and commercial projects.

---

**Part of the Reusable Packages Collection**
