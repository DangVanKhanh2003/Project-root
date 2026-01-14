# Theme Toggle Module

TypeScript module để toggle giữa dark và light theme với localStorage persistence.

## Features

- ✅ Toggle giữa dark (default) và light theme
- ✅ Save theme preference vào localStorage
- ✅ Auto-apply saved theme khi page load
- ✅ Support cả desktop và mobile toggle buttons
- ✅ Update sun/moon icons tự động
- ✅ Smooth transitions (CSS handles)

## Usage

### Initialization

Module tự động init khi page load:

```typescript
// src/main.ts
import { initThemeToggle } from './features/theme-toggle/theme-toggle';

function loadFeatures() {
  initThemeToggle(); // Call this first, before any rendering
  // ... other initializations
}
```

### HTML Requirements

Theme toggle cần các elements sau trong HTML:

```html
<!-- Desktop toggle button -->
<button class="icon-btn" id="theme-toggle" aria-label="Toggle Theme">
  <!-- Sun Icon (visible in light mode) -->
  <svg class="sun-icon hidden">...</svg>
  <!-- Moon Icon (visible in dark mode) -->
  <svg class="moon-icon">...</svg>
</button>

<!-- Mobile toggle button (trong drawer) -->
<button class="icon-btn" id="mobile-theme-toggle">
  <span>Switch Theme</span>
  <svg class="moon-icon">...</svg>
</button>
```

### CSS Requirements

CSS cần support `data-theme` attribute:

```css
/* Default: Dark theme */
:root {
  --bg-body: #030014;
  --text-main: #ffffff;
  /* ... */
}

/* Light theme override */
[data-theme="light"] {
  --bg-body: #f1f5f9;
  --text-main: #0f172a;
  /* ... */
}

/* Smooth transitions */
body {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

## API

### `initThemeToggle()`

Initialize theme toggle functionality. Call this once when app loads.

```typescript
initThemeToggle();
```

### `getTheme()`

Get current theme.

```typescript
import { getTheme } from './features/theme-toggle/theme-toggle';

const currentTheme = getTheme(); // 'dark' | 'light'
console.log('Current theme:', currentTheme);
```

### `setTheme(theme)`

Set theme programmatically.

```typescript
import { setTheme } from './features/theme-toggle/theme-toggle';

// Force dark theme
setTheme('dark');

// Force light theme
setTheme('light');
```

## How It Works

1. **Page Load:**
   - Read saved theme from localStorage (key: `ytmp3-theme`)
   - Apply theme immediately (set `data-theme` attribute on `<html>`)
   - Update sun/moon icons visibility

2. **User Clicks Toggle:**
   - Toggle theme (dark → light or light → dark)
   - Save new theme to localStorage
   - Apply new theme (CSS transitions handle smooth change)
   - Update icons

3. **Persistence:**
   - Theme preference saved in `localStorage.ytmp3-theme`
   - Persists across page reloads
   - Default to 'dark' if no saved preference

## Supported Themes

- `dark` (default) - Dark Nebula theme với purple/blue gradients
- `light` - Light theme với slate colors

## Examples

### Example 1: Check Current Theme

```typescript
import { getTheme } from './features/theme-toggle/theme-toggle';

if (getTheme() === 'dark') {
  console.log('User prefers dark mode');
}
```

### Example 2: Force Theme on Specific Condition

```typescript
import { setTheme } from './features/theme-toggle/theme-toggle';

// Force light theme if time is daytime
const hour = new Date().getHours();
if (hour >= 6 && hour < 18) {
  setTheme('light');
}
```

### Example 3: Listen to Theme Changes

Currently module doesn't emit events. If needed, can add event emitter pattern:

```typescript
// Future enhancement
window.addEventListener('themechange', (e: CustomEvent) => {
  console.log('Theme changed to:', e.detail.theme);
});
```

## File Structure

```
src/features/theme-toggle/
├── theme-toggle.ts    # Main module
└── README.md          # This file
```

## Dependencies

- None (pure TypeScript, no external dependencies)
- Requires modern browser with localStorage support
- Requires CSS with `[data-theme]` attribute support

## Browser Compatibility

- Chrome/Edge: ✅ (all versions with localStorage)
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅

## Testing

Manual testing checklist:

- [ ] Click desktop toggle → theme switches
- [ ] Click mobile toggle → theme switches
- [ ] Refresh page → theme persists
- [ ] Icons update correctly (sun in light, moon in dark)
- [ ] CSS transitions smooth
- [ ] LocalStorage saved correctly

## Future Enhancements

- [ ] Add event emitter for theme changes
- [ ] Support system preference detection (`prefers-color-scheme`)
- [ ] Add more themes (e.g., auto, high-contrast)
- [ ] Add keyboard shortcuts (e.g., Ctrl+Shift+D for dark)

---

**Created:** 2025-12-10
**Version:** 1.0.0
**Author:** ytmp3-clone-3 project
