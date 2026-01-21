/**
 * Format Selector Component (UNIFIED DROPDOWN)
 * Single dropdown combining Video and Audio options with optgroups
 */

import {
  setUnifiedSelection,
  UNIFIED_OPTIONS
} from '../../features/downloader/state';
import { t } from '@downloader/i18n';

// ==========================================
// Render Functions
// ==========================================

/**
 * Render format selector into the input form
 * Called once during app initialization
 *
 * IMPORTANT: This function MUST be called AFTER initializeFormatSelector()
 * to ensure state is loaded before rendering. This prevents layout shift.
 */
export function renderFormatSelectorToForm(): void {
  const container = document.getElementById('format-selector-container');
  if (!container) {
    console.warn('Format selector container not found');
    return;
  }

  // HTML inline scripts already set dropdown value
  // TS only needs to attach event listeners
  initFormatSelector('#format-selector-container');
}

/**
 * Render unified dropdown HTML with optgroups
 */
export function renderUnifiedDropdown(selectedValue: string): string {
  const videoOptions = UNIFIED_OPTIONS.video;
  const audioOptions = UNIFIED_OPTIONS.audio;

  return `
    <select id="unified-format-select" class="quality-select unified-format-select" aria-label="${t('aria.qualitySelector')}" data-unified-select>
      <optgroup label="Video">
        ${videoOptions.map(option => {
          const isSelected = option.value === selectedValue;
          return `<option value="${option.value}"${isSelected ? ' selected' : ''}>${option.label}</option>`;
        }).join('')}
      </optgroup>
      <optgroup label="Audio">
        ${audioOptions.map(option => {
          const isSelected = option.value === selectedValue;
          return `<option value="${option.value}"${isSelected ? ' selected' : ''}>${option.label}</option>`;
        }).join('')}
      </optgroup>
    </select>
  `;
}

// ==========================================
// Event Handlers
// ==========================================

/**
 * Initialize format selector event listeners
 * Call this after rendering the component
 */
export function initFormatSelector(containerSelector: string = '#previewCard'): void {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.warn('Format selector container not found:', containerSelector);
    return;
  }

  // Listen for unified select changes
  container.addEventListener('change', handleUnifiedChange);
}

/**
 * Handle unified dropdown change
 */
function handleUnifiedChange(event: Event): void {
  const target = event.target as HTMLSelectElement;

  // Only handle unified-select changes
  if (!target.matches('[data-unified-select]')) {
    return;
  }

  const value = target.value;
  setUnifiedSelection(value);
}

// ==========================================
// Cleanup
// ==========================================

/**
 * Cleanup format selector (remove event listeners)
 */
export function cleanupFormatSelector(): void {
  // No global event listeners to clean up (using event delegation)
}
