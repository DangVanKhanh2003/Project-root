/**
 * Format Selector Component (CUSTOM DROPDOWN WITH SUBMENU)
 * Custom dropdown with nested Audio submenu that expands on hover
 */

import {
  setUnifiedSelection,
  UNIFIED_OPTIONS
} from '../../features/downloader/state';

// ==========================================
// State
// ==========================================

let isDropdownOpen = false;
let clickOutsideHandler: ((e: MouseEvent) => void) | null = null;

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

  initFormatSelector('#format-selector-container');
}

/**
 * Render unified dropdown HTML with custom dropdown structure
 */
export function renderUnifiedDropdown(selectedValue: string): string {
  const videoOptions = UNIFIED_OPTIONS.video;
  const audioOptions = UNIFIED_OPTIONS.audio;

  const selectedOption = [...videoOptions, ...audioOptions].find(o => o.value === selectedValue);
  const selectedLabel = selectedOption?.label || 'MP4 - 4K';

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
// Dropdown Control
// ==========================================

function openDropdown(wrapper: Element): void {
  if (isDropdownOpen) return;

  isDropdownOpen = true;
  wrapper.classList.add('open');

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

export function initFormatSelector(containerSelector: string = '#previewCard'): void {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.warn('Format selector container not found:', containerSelector);
    return;
  }

  // Prevent initial flash before CSS loads.
  container.querySelectorAll('.custom-dropdown-menu[hidden]').forEach(menu => {
    menu.removeAttribute('hidden');
  });

  container.addEventListener('click', handleDropdownClick);
  container.addEventListener('keydown', handleDropdownKeydown);
}

function handleDropdownClick(event: Event): void {
  const target = event.target as HTMLElement;
  const wrapper = target.closest('.quality-wrapper');

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
  const wrapper = target.closest('.quality-wrapper');

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
