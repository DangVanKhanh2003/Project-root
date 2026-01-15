/**
 * Format Selector Component
 * Reusable MP3/MP4 toggle + Quality dropdown
 */

import {
  setSelectedFormat,
  setVideoQuality,
  setAudioFormat,
  setAudioBitrate,
  type FormatType,
  type AudioFormatType
} from '../../features/downloader/state';

// ==========================================
// Render Functions
// ==========================================

/**
 * Initialize format selector from static HTML
 * Called once during app initialization
 *
 * HTML inline scripts already handle:
 * 1. data-format attribute on <html> (head script)
 * 2. Dropdown values (body script)
 * TS only needs to attach event listeners
 */
export function renderFormatSelectorToForm(): void {
  const container = document.getElementById('format-selector-container');
  if (!container) {
    console.warn('Format selector container not found');
    return;
  }

  // HTML inline scripts already set UI - just attach event listeners
  initFormatSelector('#format-selector-container');
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

  // Use event delegation for all format selector interactions
  container.addEventListener('click', handleFormatSelectorClick);

  // Listen for quality select changes
  container.addEventListener('change', handleQualityChange);

  // Initialize custom tooltips
  initCustomTooltips(container);
}

/**
 * Handle all clicks within format selector (event delegation)
 */
function handleFormatSelectorClick(event: Event): void {
  const target = event.target as HTMLElement;

  // Handle format button clicks (Two separate buttons)
  const formatBtn = target.closest('.format-btn') as HTMLElement;
  if (formatBtn) {
    const format = formatBtn.dataset.format as FormatType;
    if (format) {
      handleFormatChange(format);
    }
    return;
  }
}

/**
 * Handle quality select change
 * Determines format type from select element id (mp3 vs mp4)
 */
function handleQualityChange(event: Event): void {
  const target = event.target as HTMLSelectElement;

  // Only handle quality-select changes
  if (!target.matches('[data-quality-select]')) {
    return;
  }

  const value = target.value;
  const isMP4Select = target.id === 'quality-select-mp4';

  if (isMP4Select) {
    // Video format: value is "mp4-1080", "mp4-720", etc.
    const resolution = value.split('-')[1];
    setVideoQuality(`${resolution}p`);
  } else {
    // Audio format: MP3 has "mp3-bitrate", others have "format-bitrate"
    const [format, bitrate] = value.split('-');
    setAudioFormat(format as AudioFormatType);
    if (format === 'mp3') {
      setAudioBitrate(bitrate);
    } else {
      setAudioBitrate(''); // Non-MP3 formats don't use bitrate
    }
  }
}

/**
 * Handle format change (MP3 ↔ MP4)
 * Updates data-format attribute for CSS-based switching (no re-render needed)
 */
function handleFormatChange(format: FormatType): void {
  setSelectedFormat(format);

  // Update data-format attribute on <html> - CSS handles visibility
  document.documentElement.dataset.format = format;
}

// ==========================================
// Cleanup
// ==========================================

/**
 * Initialize custom tooltips with 0.5s delay
 */
function initCustomTooltips(container: Element): void {
  const tooltipElements = container.querySelectorAll('[data-tooltip]');

  tooltipElements.forEach((element) => {
    let tooltipTimer: number | null = null;

    // Set tooltip text content
    const tooltipText = element.getAttribute('data-tooltip');
    const tooltipElement = element.querySelector('.custom-tooltip');

    if (tooltipElement && tooltipText) {
      tooltipElement.textContent = tooltipText;
    }

    // Show tooltip on mouse enter (with 0.5s delay)
    element.addEventListener('mouseenter', () => {
      tooltipTimer = window.setTimeout(() => {
        element.classList.add('show-tooltip');
      }, 500); // 0.5s delay
    });

    // Hide tooltip on mouse leave
    element.addEventListener('mouseleave', () => {
      if (tooltipTimer) {
        clearTimeout(tooltipTimer);
        tooltipTimer = null;
      }
      element.classList.remove('show-tooltip');
    });
  });
}

/**
 * Cleanup format selector (remove event listeners)
 */
export function cleanupFormatSelector(): void {
  // No global event listeners to clean up (using event delegation)
}
