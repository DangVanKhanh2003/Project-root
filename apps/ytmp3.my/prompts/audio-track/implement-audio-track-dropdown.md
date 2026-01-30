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
                <!-- Audio Track Icon -->
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="16" viewBox="0 0 44 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-audio-language-horizontal">
                    <g fill="currentColor" stroke="none" transform="translate(-2 0)">
                        <path d="M19.4 .2C19.29 .27 19.20 .37 19.13 .49C19.07 .60 19.02 .72 19.01 .85C18.99 .98 18.99 1.12 19.03 1.24C19.06 1.37 19.12 1.49 19.2 1.6L20.8 .4C20.64 .18 20.40 .04 20.14 .01C19.87 -0.02 19.61 .04 19.4 .2ZM20.8 .4L20 1L19.2 1.59C20.37 3.16 21.00 5.06 21.00 7.01C20.99 8.97 20.35 10.87 19.17 12.42C19.01 12.64 18.94 12.90 18.98 13.16C19.02 13.43 19.16 13.66 19.37 13.83C19.58 13.99 19.84 14.05 20.11 14.02C20.37 13.98 20.61 13.84 20.77 13.63C22.21 11.73 22.99 9.41 23 7.02C23.00 4.63 22.23 2.31 20.8 .4ZM10 2C8.67 2 7.40 2.52 6.46 3.46C5.52 4.40 5 5.67 5 7C5 8.32 5.52 9.59 6.46 10.53C7.40 11.47 8.67 12 10 12C11.32 12 12.59 11.47 13.53 10.53C14.47 9.59 15 8.32 15 7C15 5.67 14.47 4.40 13.53 3.46C12.59 2.52 11.32 2 10 2ZM16.17 2.29C15.97 2.48 15.86 2.73 15.86 2.99C15.85 3.26 15.95 3.51 16.14 3.71C16.98 4.58 17.44 5.68 17.49 6.80L17.5 7.02C17.49 8.22 17.01 9.40 16.10 10.32C15.92 10.51 15.83 10.77 15.83 11.03C15.84 11.29 15.95 11.53 16.13 11.71C16.32 11.90 16.57 12.00 16.83 12.00C17.09 12.00 17.34 11.90 17.53 11.72C18.78 10.44 19.49 8.77 19.5 7.03L19.49 6.71C19.42 5.09 18.74 3.53 17.58 2.32C17.49 2.23 17.38 2.15 17.26 2.10C17.14 2.05 17.01 2.02 16.88 2.01C16.75 2.01 16.62 2.03 16.49 2.08C16.37 2.13 16.26 2.20 16.17 2.29ZM10.39 13.01L10 13C8.01 12.99 6.10 13.73 4.63 15.06L4.34 15.34C3.60 16.08 3.01 16.96 2.60 17.93C2.20 18.90 1.99 19.94 2 21C2 21.26 2.10 21.51 2.29 21.70C2.48 21.89 2.73 22 3 22C3.26 22 3.51 21.89 3.70 21.70C3.89 21.51 4 21.26 4 21C4.00 19.40 4.63 17.88 5.75 16.75L5.97 16.55C7.07 15.55 8.51 15 10 15L10.29 15.00C11.78 15.08 13.18 15.70 14.24 16.75L14.44 16.97C15.44 18.07 16 19.51 16 21C16 21.26 16.10 21.51 16.29 21.70C16.48 21.89 16.73 22 17 22C17.26 22 17.51 21.89 17.70 21.70C17.89 21.51 18 21.26 18 21C18.00 19.01 17.26 17.10 15.93 15.63L15.65 15.34C14.25 13.93 12.37 13.10 10.39 13.01Z"></path>
                    </g>
                    <g transform="translate(23.8 1.6) scale(0.75)">
                        <path d="m5 8 6 6"></path>
                        <path d="m4 14 6-6 2-3"></path>
                        <path d="M2 5h12"></path>
                        <path d="M7 2h1"></path>
                        <path d="m22 22-5-10-5 10"></path>
                        <path d="M14 18h6"></path>
                    </g>
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

### 4. Preview Tag (yt-preview-meta)
Add the audio track badge inside the preview meta row so it sits with format/quality badges:

```html
<div class="yt-preview-meta">
    <div class="yt-preview-format">
        <span class="format-badge">MP3</span>
        <span class="quality-info">128kbps</span>
        <span class="audio-track-badge">
            <span class="audio-track-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="16" viewBox="0 0 44 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-audio-language-horizontal">
                    <g fill="currentColor" stroke="none" transform="translate(-2 0)">
                        <path d="M19.4 .2C19.29 .27 19.20 .37 19.13 .49C19.07 .60 19.02 .72 19.01 .85C18.99 .98 18.99 1.12 19.03 1.24C19.06 1.37 19.12 1.49 19.2 1.6L20.8 .4C20.64 .18 20.40 .04 20.14 .01C19.87 -0.02 19.61 .04 19.4 .2ZM20.8 .4L20 1L19.2 1.59C20.37 3.16 21.00 5.06 21.00 7.01C20.99 8.97 20.35 10.87 19.17 12.42C19.01 12.64 18.94 12.90 18.98 13.16C19.02 13.43 19.16 13.66 19.37 13.83C19.58 13.99 19.84 14.05 20.11 14.02C20.37 13.98 20.61 13.84 20.77 13.63C22.21 11.73 22.99 9.41 23 7.02C23.00 4.63 22.23 2.31 20.8 .4ZM10 2C8.67 2 7.40 2.52 6.46 3.46C5.52 4.40 5 5.67 5 7C5 8.32 5.52 9.59 6.46 10.53C7.40 11.47 8.67 12 10 12C11.32 12 12.59 11.47 13.53 10.53C14.47 9.59 15 8.32 15 7C15 5.67 14.47 4.40 13.53 3.46C12.59 2.52 11.32 2 10 2ZM16.17 2.29C15.97 2.48 15.86 2.73 15.86 2.99C15.85 3.26 15.95 3.51 16.14 3.71C16.98 4.58 17.44 5.68 17.49 6.80L17.5 7.02C17.49 8.22 17.01 9.40 16.10 10.32C15.92 10.51 15.83 10.77 15.83 11.03C15.84 11.29 15.95 11.53 16.13 11.71C16.32 11.90 16.57 12.00 16.83 12.00C17.09 12.00 17.34 11.90 17.53 11.72C18.78 10.44 19.49 8.77 19.5 7.03L19.49 6.71C19.42 5.09 18.74 3.53 17.58 2.32C17.49 2.23 17.38 2.15 17.26 2.10C17.14 2.05 17.01 2.02 16.88 2.01C16.75 2.01 16.62 2.03 16.49 2.08C16.37 2.13 16.26 2.20 16.17 2.29ZM10.39 13.01L10 13C8.01 12.99 6.10 13.73 4.63 15.06L4.34 15.34C3.60 16.08 3.01 16.96 2.60 17.93C2.20 18.90 1.99 19.94 2 21C2 21.26 2.10 21.51 2.29 21.70C2.48 21.89 2.73 22 3 22C3.26 22 3.51 21.89 3.70 21.70C3.89 21.51 4 21.26 4 21C4.00 19.40 4.63 17.88 5.75 16.75L5.97 16.55C7.07 15.55 8.51 15 10 15L10.29 15.00C11.78 15.08 13.18 15.70 14.24 16.75L14.44 16.97C15.44 18.07 16 19.51 16 21C16 21.26 16.10 21.51 16.29 21.70C16.48 21.89 16.73 22 17 22C17.26 22 17.51 21.89 17.70 21.70C17.89 21.51 18 21.26 18 21C18.00 19.01 17.26 17.10 15.93 15.63L15.65 15.34C14.25 13.93 12.37 13.10 10.39 13.01Z"></path>
                    </g>
                    <g transform="translate(23.8 1.6) scale(0.75)">
                        <path d="m5 8 6 6"></path>
                        <path d="m4 14 6-6 2-3"></path>
                        <path d="M2 5h12"></path>
                        <path d="M7 2h1"></path>
                        <path d="m22 22-5-10-5 10"></path>
                        <path d="M14 18h6"></path>
                    </g>
                </svg>
            </span>
            <span class="audio-track-value">Origin</span>
        </span>
    </div>
    <p class="yt-preview-author">Author Name</p>
</div>
```

---

### 5. CSS Styles
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
    padding: 0 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: flex-start;
    cursor: pointer;
    transition: border-color 0.2s;
    position: relative;
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
        display: none;
        opacity: 0;
        width: 0;
        overflow: hidden;
        transition: opacity 0.5s, width 0.5s;
    }

    /* Show text/arrow when expanded */
    .audio-dropdown-wrapper:has(.custom-dropdown.active) .selected-content,
    .audio-dropdown-wrapper:has(.custom-dropdown.active) .dropdown-arrow {
        display: inline-flex;
        opacity: 1;
        width: auto;
        transition: opacity 0.5s 0.25s, width 0.5s;
    }

    /* Trigger Styles - Collapsed: center icon */
    .audio-dropdown-wrapper .dropdown-trigger {
        padding: 0 0 0 1px;
        justify-content: center;
        gap: 0;
        transition: padding 0.75s, justify-content 0.75s;
    }

    /* Trigger Styles - Expanded */
    .audio-dropdown-wrapper:has(.custom-dropdown.active) .dropdown-trigger {
        padding: 0 10px;
        justify-content: flex-start;
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
        min-width: 200px;
    }
}
```

---

### 6. Initialize in main.ts

```typescript
import { initAudioDropdown } from './features/downloader/ui-render/dropdown-logic';

// In your initialization function
function loadFeatures() {
    // ... other initializations
    initAudioDropdown();
}
```

---

### 7. SVG Flag Assets
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
| Desktop (>=641px) | Row with format + quality + audio + convert | Shows icon + text (min-width: 200px) | Normal |
| Tablet (>=768px) | Row layout via `.controls` | Inline with quality | Normal |
| Mobile (<640px) | Quality fills space | Icon-only, expands to 200px on click | max-width: 150px |
| Tiny Mobile (<480px) | Height 40px | Height 40px, collapsed 40px | max-width: 130px |

---

## Key Implementation Notes

1. **Arrow Positioning:** The `.select-arrow` must be inside `.quality-dropdown-wrapper` (not `.quality-wrapper`) for correct relative positioning.

2. **SVG Flag Handling:** The 'original' option uses an inline SVG string. Other languages use `<img src="path">` tags. Avoid putting the SVG string in `data-flag` attribute as it breaks HTML parsing.

3. **Icon Class:** The audio trigger icon uses `.icon-audio-language-horizontal` and flex layout (no absolute positioning).

4. **Animation Duration:** The animation uses `0.75s` for the main transitions, with opacity transitions at `0.5s` for a smooth staggered effect.

5. **CSS :has() Selector:** Used for styling parent elements based on child state (e.g., `.audio-dropdown-wrapper:has(.custom-dropdown.active)`).

6. **z-index:** The audio dropdown wrapper needs `z-index: 20` on mobile to ensure the dropdown menu appears above other elements.

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
