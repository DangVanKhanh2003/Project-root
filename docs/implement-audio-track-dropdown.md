---
description: How to implement the Audio Track Dropdown feature with SVG flags
---

# Audio Track Dropdown Implementation Guide

This workflow documents how to implement a custom searchable audio track dropdown with SVG country flags for a YouTube downloader application.

## Overview

The audio track dropdown allows users to select the language/audio track for video conversion. It features:
- Searchable dropdown menu with language options
- SVG country flags for each language
- Smooth mobile animation (icon-only collapsed state, expands on click)
- Desktop min-width for proper text display

---

## Files to Create/Modify

### 1. Languages Data File
**Path:** `src/features/downloader/data/languages.ts`

```typescript
export interface Language {
  code: string;
  name: string;
  flag: string; // SVG path or inline SVG for 'original'
}

export const LANGUAGES: Language[] = [
  { code: 'original', name: 'Original', flag: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-languages text-gray-400" aria-hidden="true"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></svg>' },
  { code: 'en', name: 'English', flag: '/assest/flat-svg/us.png' },
  { code: 'vi', name: 'Vietnamese', flag: '/assest/flat-svg/vn.svg' },
  // ... add more languages as needed
];
```

**Important:** The 'original' entry uses an inline SVG string, while other languages use paths to SVG files.

---

### 2. Dropdown Logic File
**Path:** `src/features/downloader/ui-render/dropdown-logic.ts`

```typescript
import { LANGUAGES, type Language } from '../data/languages';

export function initAudioDropdown(): void {
  const dropdown = document.getElementById('audio-track-dropdown');
  if (!dropdown) return;

  const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement;
  const menu = dropdown.querySelector('.dropdown-menu') as HTMLElement;
  const optionsContainer = dropdown.querySelector('.dropdown-options') as HTMLElement;
  const searchInput = dropdown.querySelector('.dropdown-search input') as HTMLInputElement;
  const hiddenInput = document.getElementById('audio-track-value') as HTMLInputElement;
  const selectedText = dropdown.querySelector('.selected-text') as HTMLElement;

  // Render initial options
  renderOptions(LANGUAGES, optionsContainer, hiddenInput.value);

  // Toggle dropdown
  trigger.addEventListener('click', () => {
    const isActive = dropdown.classList.toggle('active');
    menu.classList.toggle('hidden', !isActive);
    trigger.setAttribute('aria-expanded', String(isActive));
    if (isActive) {
      searchInput.value = '';
      searchInput.focus();
      renderOptions(LANGUAGES, optionsContainer, hiddenInput.value);
    }
  });

  // Search filter
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const filtered = LANGUAGES.filter(lang =>
      lang.name.toLowerCase().includes(query) ||
      lang.code.toLowerCase().includes(query)
    );
    renderOptions(filtered, optionsContainer, hiddenInput.value);
  });

  // Select option
  optionsContainer.addEventListener('click', (e) => {
    const option = (e.target as HTMLElement).closest('.dropdown-option') as HTMLElement;
    if (!option) return;
    
    const code = option.dataset.code!;
    const name = option.dataset.name!;
    
    hiddenInput.value = code;
    selectedText.textContent = name;
    
    dropdown.classList.remove('active');
    menu.classList.add('hidden');
    trigger.setAttribute('aria-expanded', 'false');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target as Node)) {
      dropdown.classList.remove('active');
      menu.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
}

function renderOptions(languages: Language[], container: HTMLElement, currentVal: string): void {
  container.innerHTML = languages.map(lang => {
    const isOriginal = lang.code === 'original';
    const flagHtml = isOriginal 
      ? lang.flag 
      : `<img src="${lang.flag}" alt="${lang.name}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">`;

    return `
      <div class="dropdown-option ${lang.code === currentVal ? 'selected' : ''}" 
           data-code="${lang.code}" 
           data-name="${lang.name}"
           data-flag="${isOriginal ? 'original' : lang.flag}"
           role="option"
           aria-selected="${lang.code === currentVal}">
        <div class="flag-wrapper" style="width: 24px; height: 16px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 2px;">
          ${flagHtml}
        </div>
        <span class="name">${lang.name}</span>
      </div>`;
  }).join('');
}
```

---

### 3. HTML Template Structure
Add inside `.quality-wrapper`:

```html
<div class="quality-wrapper">
    <!-- Quality Dropdown (existing) -->
    <div class="quality-dropdown-wrapper">
        <select id="quality-select-mp3" class="quality-select quality-select--mp3" ...>...</select>
        <select id="quality-select-mp4" class="quality-select quality-select--mp4" ...>...</select>
        <div class="select-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6" />
            </svg>
        </div>
    </div>
    
    <!-- NEW: Audio Track Dropdown -->
    <div class="audio-dropdown-wrapper">
        <div class="custom-dropdown" id="audio-track-dropdown">
            <div class="dropdown-trigger" tabindex="0" role="button" aria-haspopup="listbox" aria-expanded="false">
                <!-- Language Icon -->
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dropdown-trigger-icon">
                    <path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path>
                </svg>
                
                <div class="selected-content">
                    <span class="selected-text">Original</span>
                </div>
                <svg class="dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </div>

            <div class="dropdown-menu hidden">
                <div class="dropdown-search">
                    <input type="text" placeholder="Search language..." aria-label="Search language">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
                <div class="dropdown-options" role="listbox">
                    <!-- Options populated via JS -->
                </div>
            </div>
            <input type="hidden" id="audio-track-value" value="original" name="audioTrack">
        </div>
    </div>
</div>
```

---

### 4. CSS Styles
**Path:** `src/styles/components/quality-select.css`

#### Core Dropdown Styles

```css
/* Quality Dropdown Wrapper - Position relative for arrow */
.quality-dropdown-wrapper {
    position: relative;
    width: 100%;
    flex: 1;
}

/* Quality Select - Padding for arrow space */
.quality-select {
    width: 100%;
    height: 56px;
    background: var(--bg-card);
    border: var(--border-glass);
    border-radius: var(--radius-md);
    color: var(--text-main);
    padding: 0 30px 0 20px;
    appearance: none;
    cursor: pointer;
    font-weight: 500;
}

/* Arrow positioning */
.select-arrow {
    position: absolute;
    right: 8px;
    top: 55%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--text-muted);
}

/* ===== CUSTOM SEARCHABLE DROPDOWN ===== */
.custom-dropdown {
    position: relative;
    width: 100%;
    color: var(--text-main);
    user-select: none;
}

.dropdown-trigger {
    height: 56px;
    background: var(--bg-card);
    border: var(--border-glass);
    border-radius: var(--radius-md);
    padding: 0 16px 0 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: border-color 0.2s;
    position: relative;
}

.dropdown-trigger-icon {
    position: absolute;
    left: 12px;
    top: 55%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
}

.dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 100%;
    background: var(--bg-card);
    border: var(--border-glass);
    border-radius: var(--radius-md);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    z-index: 50;
    overflow: hidden;
    animation: fadeIn 0.2s ease-out;
}

.custom-dropdown .hidden {
    display: none !important;
}

.custom-dropdown.active .dropdown-menu {
    display: block;
}
```

#### Mobile Animation Styles

```css
/* ===== MOBILE TRIGGER EXPANSION ANIMATION ===== */
@media (max-width: 640px) {
    .quality-wrapper {
        flex-grow: 1;
    }

    .quality-dropdown-wrapper:nth-child(1) {
        flex: 1;
        transition: flex-basis 0.75s ease, flex-grow 0.75s ease, min-width 0.75s ease, opacity 0.5s;
        min-width: 0;
    }

    .audio-dropdown-wrapper {
        flex: 0 0 56px;
        transition: flex-basis 0.75s ease, flex-grow 0.75s ease, width 0.75s ease;
        z-index: 20;
    }

    /* Active State: Audio expands to ~200px */
    .audio-dropdown-wrapper:has(.custom-dropdown.active) {
        flex: 0 0 200px;
        width: 200px;
    }

    /* Hide text/arrow when collapsed */
    .audio-dropdown-wrapper .selected-content,
    .audio-dropdown-wrapper .dropdown-arrow {
        opacity: 0;
        width: 0;
        overflow: hidden;
        transition: opacity 0.5s, width 0.5s;
    }

    /* Show text/arrow when expanded */
    .audio-dropdown-wrapper:has(.custom-dropdown.active) .selected-content,
    .audio-dropdown-wrapper:has(.custom-dropdown.active) .dropdown-arrow {
        opacity: 1;
        width: auto;
        transition: opacity 0.5s 0.25s, width 0.5s;
    }

    /* Trigger Styles - Collapsed: center icon */
    .audio-dropdown-wrapper .dropdown-trigger {
        padding: 0;
        justify-content: center;
        transition: padding 0.75s, justify-content 0.75s;
    }

    /* Center icon when collapsed */
    .audio-dropdown-wrapper .dropdown-trigger-icon {
        left: 50%;
        transform: translate(-50%, -50%);
        transition: left 0.75s, transform 0.75s;
    }

    /* Trigger Styles - Expanded */
    .audio-dropdown-wrapper:has(.custom-dropdown.active) .dropdown-trigger {
        padding: 0 16px 0 40px;
        justify-content: space-between;
    }

    /* Move icon to left when expanded */
    .audio-dropdown-wrapper:has(.custom-dropdown.active) .dropdown-trigger-icon {
        left: 12px;
        transform: translateY(-50%);
    }
}

/* Desktop Styles */
@media (min-width: 641px) {
    .quality-wrapper {
        flex-grow: 0;
    }

    .quality-dropdown-wrapper {
        flex: 1;
    }

    .audio-dropdown-wrapper {
        flex: 0 0 auto;
        min-width: 160px;
    }

    .dropdown-trigger {
        padding: 0 16px 0 40px;
    }

    .dropdown-trigger-icon {
        left: 12px;
        transform: translateY(-50%);
    }
}
```

---

### 5. Initialize in main.ts

```typescript
import { initAudioDropdown } from './features/downloader/ui-render/dropdown-logic';

// In your initialization function
function loadFeatures() {
    // ... other initializations
    initAudioDropdown();
}
```

---

### 6. SVG Flag Assets
**Path:** `public/assest/flat-svg/`

Download country flag SVGs from a repository like `hampusborgos/country-flags` and rename them to match language codes:
- `us.png` for English (en)
- `vn.svg` for Vietnamese (vi)
- `jp.svg` for Japanese (ja)
- etc.

---

## Responsive Behavior Summary

| Breakpoint | Quality Wrapper | Audio Dropdown | Format Toggle |
|------------|-----------------|----------------|---------------|
| Desktop (800px+) | Row with format + quality + audio + convert | Shows icon + text (min-width: 160px) | Normal |
| Tablet/Mobile (<800px) | Row 1: Quality + Audio | Row 2: Format + Convert | Full width row 2 |
| Mobile (<640px) | Quality fills space | Icon-only, expands to 200px on click | max-width: 150px |
| Tiny Mobile (<480px) | Height 40px | Height 40px, collapsed 40px | max-width: 130px |

---

## Key Implementation Notes

1. **Arrow Positioning:** The `.select-arrow` must be inside `.quality-dropdown-wrapper` (not `.quality-wrapper`) for correct relative positioning.

2. **SVG Flag Handling:** The 'original' option uses an inline SVG string. Other languages use `<img src="path">` tags. Avoid putting the SVG string in `data-flag` attribute as it breaks HTML parsing.

3. **Animation Duration:** The animation uses `0.75s` for the main transitions, with opacity transitions at `0.5s` for a smooth staggered effect.

4. **CSS :has() Selector:** Used for styling parent elements based on child state (e.g., `.audio-dropdown-wrapper:has(.custom-dropdown.active)`).

5. **z-index:** The audio dropdown wrapper needs `z-index: 20` on mobile to ensure the dropdown menu appears above other elements.

---

### 6. Performance Optimization (Mobile)

To prevent UI jank when opening the dropdown on mobile, especially with many flags:
- **CSS**: Use `will-change: transform, opacity` and `backface-visibility: hidden` on the dropdown menu.
- **Containment**: Use `contain: layout style` on the scrollable options container.
- **Image Decoding**: Use `decoding="async"` on flag images to offload work from the main thread.
- **JS Rendering**: Avoid re-rendering the entire list when closing the menu; only update when the search query changes.

### 7. Implementation Checklist
- [ ] Added `LANGUAGES` data to `languages.ts`.
- [ ] Implemented searchable logic in `dropdown-logic.ts`.
- [ ] Updated HTML structure in Nunjucks templates.
- [ ] Added CSS with mobile-first animations and GPU acceleration.
- [ ] Initialized dropdown in `main.ts`.
- [ ] Verified SVG flags display correctly with background decoding.

---

## Checklist for New Project Implementation

- [ ] Create `languages.ts` with Language interface and LANGUAGES array
- [ ] Create `dropdown-logic.ts` with init and render functions
- [ ] Add HTML structure in template (inside `.quality-wrapper`)
- [ ] Add CSS styles in `quality-select.css`
- [ ] Import and call `initAudioDropdown()` in main.ts
- [ ] Copy SVG flag assets to `public/assest/flat-svg/`
- [ ] Update `format-selector.css` for responsive layout (800px breakpoint)
- [ ] Test on desktop, tablet, and mobile
