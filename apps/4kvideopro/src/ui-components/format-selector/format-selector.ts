/**
 * Format Selector Component
 * Reusable MP3/MP4 toggle + Quality dropdown + Audio Track Dropdown
 */

import {
  setUnifiedSelection,
  UNIFIED_OPTIONS
} from '../../features/downloader/state';
import { initAudioDropdown } from '../../features/downloader/ui-render/dropdown-logic';

// ==========================================
// Render Functions
// ==========================================

/**
 * Render format selector into the input form
 * Called once during app initialization
 */
export function renderFormatSelectorToForm(): void {
  const container = document.getElementById('format-selector-container');
  if (!container) {
    console.warn('Format selector container not found');
    return;
  }

  // Inject the split structure: Quality Wrapper + Audio Dropdown Wrapper
  container.innerHTML = `
    <div class="format-selector-wrapper">
        <div class="format-selector">
            <!-- Format Toggle (Hidden but kept for structure) -->
            <div class="format-toggle" style="display:none;">
                <button type="button" class="format-btn" data-format="mp3">MP3</button>
                <button type="button" class="format-btn" data-format="mp4">MP4</button>
            </div>

            <!-- Quality Dropdown + Audio Dropdown -->
            <div class="quality-wrapper setting-wrapper">
                <div class="quality-dropdown-wrapper">
                   ${renderUnifiedDropdown('mp4-720')}
                </div>

                <div class="audio-dropdown-wrapper" id="audio-track-dropdown">
                    <!-- Custom Searchable Audio Track Dropdown -->
                    <div class="custom-dropdown">
                        <div class="dropdown-trigger" tabindex="0" role="button" aria-haspopup="listbox"
                            aria-expanded="false">
                            <!-- Absolute Icon (Languages) -->
                            <div class="selected-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="16" viewBox="0 0 44 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" class="icon-audio-language-horizontal">
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
                            </div>
                            <div class="selected-content">
                                <span class="selected-text">Original</span>
                            </div>
                            <svg class="dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2">
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </div>

                        <div class="dropdown-menu hidden">
                            <div class="dropdown-search">
                                <input type="text" placeholder="Search..." aria-label="Search language">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2" class="search-icon">
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
            
            <button type="submit" class="btn-convert">
                <span>Convert</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    </div>
  `;

  initFormatSelector('#format-selector-container');
}

/**
 * Render the unified format selector (keeping existing logic for format selection)
 */
export function renderUnifiedDropdown(selectedValue: string): string {
  // Keep using the existing unified dropdown logic for the format selector part
  // but wrapped inside our new structure.
  // Note: We might want to review if we should still use the 'custom-dropdown' class here
  // as it might conflict with the audio 'custom-dropdown' if they are nested or share styles unexpectedly.
  // Based on CSS analysis, they seem compatible as siblings.

  const videoOptions = UNIFIED_OPTIONS.video;
  const audioOptions = UNIFIED_OPTIONS.audio;

  const selectedOption = [...videoOptions, ...audioOptions].find(o => o.value === selectedValue);
  const selectedLabel = selectedOption?.label || 'MP4 - 720p'; // Default fall back

  return `
    <input type="hidden" id="unified-format-select" name="format" value="${selectedValue}" data-unified-select>
    <button type="button" class="quality-select custom-dropdown-trigger" aria-haspopup="listbox" aria-expanded="false">
      <span class="dropdown-selected-text">${selectedLabel}</span>
      <svg class="dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
    <div class="custom-dropdown-menu" role="listbox" hidden>
      <div class="dropdown-group">
        <div class="dropdown-group-label">Video</div>
        ${videoOptions.map(option => `
          <div class="dropdown-option${option.value === selectedValue ? ' selected' : ''}" data-value="${option.value}" role="option">${option.label}</div>
        `).join('')}
      </div>
      <div class="dropdown-group">
        <div class="dropdown-group-label">Audio</div>
        ${audioOptions.map(option => `
          <div class="dropdown-option${option.value === selectedValue ? ' selected' : ''}" data-value="${option.value}" role="option">${option.label}</div>
        `).join('')}
      </div>
    </div>
  `;
}

// ==========================================
// State
// ==========================================

let isDropdownOpen = false;
let clickOutsideHandler: ((e: MouseEvent) => void) | null = null;

// ==========================================
// Dropdown Control
// ==========================================

function openDropdown(wrapper: Element): void {
  if (isDropdownOpen) return;

  isDropdownOpen = true;
  wrapper.classList.add('open'); // This toggles the 'open' class on quality-dropdown-wrapper

  const trigger = wrapper.querySelector('.custom-dropdown-trigger');
  if (trigger) {
    trigger.setAttribute('aria-expanded', 'true');
  }

  clickOutsideHandler = (e: MouseEvent) => {
    if (!wrapper.contains(e.target as Node)) {
      closeDropdown(wrapper);
    }
  };
  setTimeout(() => {
    document.addEventListener('click', clickOutsideHandler!);
  }, 0);
}

function closeDropdown(wrapper: Element): void {
  if (!isDropdownOpen) return;

  isDropdownOpen = false;
  wrapper.classList.remove('open');

  const trigger = wrapper.querySelector('.custom-dropdown-trigger');
  if (trigger) {
    trigger.setAttribute('aria-expanded', 'false');
  }

  if (clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler);
    clickOutsideHandler = null;
  }
}

function toggleDropdown(wrapper: Element): void {
  if (isDropdownOpen) {
    closeDropdown(wrapper);
  } else {
    openDropdown(wrapper);
  }
}

function selectOption(wrapper: Element, value: string, label: string): void {
  const hiddenInput = wrapper.querySelector('[data-unified-select]') as HTMLInputElement;
  if (hiddenInput) {
    hiddenInput.value = value;
  }

  const selectedText = wrapper.querySelector('.dropdown-selected-text');
  if (selectedText) {
    selectedText.textContent = label;
  }

  const options = wrapper.querySelectorAll('.dropdown-option');
  options.forEach(opt => {
    opt.classList.toggle('selected', opt.getAttribute('data-value') === value);
  });

  setUnifiedSelection(value);
  closeDropdown(wrapper);
}

// ==========================================
// Event Handlers
// ==========================================

export function initFormatSelector(containerSelector: string = '#format-selector-container'): void {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.warn('Format selector container not found:', containerSelector);
    return;
  }

  // Prevent initial flash before CSS loads.
  container.querySelectorAll('.custom-dropdown-menu[hidden]').forEach(menu => {
    menu.removeAttribute('hidden');
  });

  // Attach listeners for the Quality/Format dropdown
  // We attach to the container but scope checks to .quality-dropdown-wrapper
  container.addEventListener('click', handleDropdownClick);
  container.addEventListener('keydown', handleDropdownKeydown);

  // Initialize Audio Dropdown Logic
  initAudioDropdown();
}

function handleDropdownClick(event: Event): void {
  const target = event.target as HTMLElement;
  // Make sure we are interacting with the unified quality dropdown, not the audio dropdown
  // The audio dropdown has its own listeners in initAudioDropdown
  const wrapper = target.closest('.quality-dropdown-wrapper');

  if (!wrapper) return;

  // Click on trigger button -> toggle dropdown
  if (target.closest('.custom-dropdown-trigger')) {
    event.preventDefault();
    toggleDropdown(wrapper);
    return;
  }

  // Click on option -> select it
  const option = target.closest('.dropdown-option') as HTMLElement;
  if (option) {
    const value = option.getAttribute('data-value');
    const label = option.textContent?.trim();
    if (value && label) {
      selectOption(wrapper, value, label);
    }
    return;
  }
}

function handleDropdownKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement;
  const wrapper = target.closest('.quality-dropdown-wrapper');

  if (!wrapper) return;

  switch (event.key) {
    case 'Enter':
    case ' ':
      if (target.classList.contains('custom-dropdown-trigger')) {
        event.preventDefault();
        toggleDropdown(wrapper);
      }
      break;
    case 'Escape':
      closeDropdown(wrapper);
      break;
  }
}

// ==========================================
// Cleanup
// ==========================================

export function cleanupFormatSelector(): void {
  if (clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler);
    clickOutsideHandler = null;
  }
  isDropdownOpen = false;
}
