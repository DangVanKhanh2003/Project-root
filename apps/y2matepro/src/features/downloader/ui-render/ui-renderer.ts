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
    return false;
  }

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
 * Update loading state (disable/enable form elements)
 * Keeps button text unchanged, only disables input, submit btn, and action btn
 */
function updateLoadingState(isLoading: boolean): void {
  if (!elements.input || !elements.submitBtn) return;

  if (isLoading) {
    elements.input.disabled = true;
    elements.submitBtn.disabled = true;
    elements.pasteBtn && (elements.pasteBtn.disabled = true);
    elements.form?.classList.add('loading');
  } else {
    elements.input.disabled = false;
    elements.submitBtn.disabled = false;
    elements.pasteBtn && (elements.pasteBtn.disabled = false);
    elements.form?.classList.remove('loading');
  }
}

/**
 * Update paste/clear button visibility
 * Note: In new design, we have a single action button that toggles between Paste/Clear
 * Icon-only design - CSS handles icon visibility based on data-action attribute
 */
function updateButtonVisibility(showPaste: boolean, showClear: boolean): void {
  // Update the single action button to show either Paste or Clear icon
  if (elements.pasteBtn) {
    if (showClear) {
      // Has content → show Clear icon
      elements.pasteBtn.dataset.action = 'clear';
      elements.pasteBtn.setAttribute('aria-label', 'Clear input');
    } else {
      // No content → show Paste icon
      elements.pasteBtn.dataset.action = 'paste';
      elements.pasteBtn.setAttribute('aria-label', 'Paste from clipboard');
    }
  }

  // clearBtn is not used (single button design)
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
