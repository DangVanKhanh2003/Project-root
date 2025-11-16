/**
 * UI Renderer - TypeScript (Simplified for Phase 4B)
 * Responsible for updating DOM based on state
 */

import type { AppState } from '../state';

// DOM Elements
interface Elements {
  form: HTMLFormElement | null;
  input: HTMLInputElement | null;
  pasteBtn: HTMLButtonElement | null;
  clearBtn: HTMLButtonElement | null;
  submitBtn: HTMLButtonElement | null;
}

let elements: Elements = {
  form: null,
  input: null,
  pasteBtn: null,
  clearBtn: null,
  submitBtn: null,
};

/**
 * Initialize renderer and get DOM references
 */
export function initRenderer(): boolean {
  elements.form = document.getElementById('downloadForm') as HTMLFormElement;
  elements.input = document.getElementById('videoUrl') as HTMLInputElement;
  elements.pasteBtn = document.getElementById('input-action-button') as HTMLButtonElement;
  elements.clearBtn = null; // Not present in current HTML
  elements.submitBtn = elements.form?.querySelector('button[type="submit"]') as HTMLButtonElement;

  if (!elements.form || !elements.input || !elements.submitBtn) {
    console.error('Required elements not found');
    return false;
  }

  console.log('✅ UI Renderer initialized');
  return true;
}

/**
 * Main render function - updates UI based on state
 */
export function render(state: AppState, prevState?: AppState): void {
  if (!elements.form) return;

  // Update loading state
  updateLoadingState(state.isLoading);

  // Update button visibility
  updateButtonVisibility(state.showPasteButton, state.showClearButton);

  // Update form based on input type (optional visual feedback)
  updateFormClass(state.inputType);
}

/**
 * Update loading state (disable/enable form)
 */
function updateLoadingState(isLoading: boolean): void {
  if (!elements.input || !elements.submitBtn) return;

  if (isLoading) {
    elements.input.disabled = true;
    elements.submitBtn.disabled = true;
    elements.form?.classList.add('loading');

    // Update submit button text
    elements.submitBtn.textContent = 'Loading...';
  } else {
    elements.input.disabled = false;
    elements.submitBtn.disabled = false;
    elements.form?.classList.remove('loading');

    // Reset submit button text
    elements.submitBtn.textContent = 'Download';
  }
}

/**
 * Update paste/clear button visibility
 */
function updateButtonVisibility(showPaste: boolean, showClear: boolean): void {
  if (elements.pasteBtn) {
    elements.pasteBtn.style.display = showPaste ? 'block' : 'none';
  }

  if (elements.clearBtn) {
    elements.clearBtn.style.display = showClear ? 'block' : 'none';
  }
}

/**
 * Update form class based on input type
 */
function updateFormClass(inputType: 'url' | 'keyword'): void {
  if (!elements.form) return;

  elements.form.classList.remove('input-type-url', 'input-type-keyword');
  elements.form.classList.add(`input-type-${inputType}`);
}

/**
 * Get current input value
 */
export function getInputValue(): string {
  return elements.input?.value.trim() || '';
}

/**
 * Set input value
 */
export function setInputValue(value: string): void {
  if (elements.input) {
    elements.input.value = value;
  }
}

/**
 * Focus input
 */
export function focusInput(): void {
  elements.input?.focus();
}

/**
 * Get all elements (for external use)
 */
export function getElements(): Elements {
  return elements;
}
