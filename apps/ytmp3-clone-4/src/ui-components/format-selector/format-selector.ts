/**
 * Format Selector Component
 * Reusable MP3/MP4 toggle + Quality dropdown
 */

import {
  getState,
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
 * IMPORTANT: HTML is already rendered in index.html with default values (MP3, 128kbps).
 * This function only updates the UI if localStorage has different values.
 *
 * Flow:
 * 1. initializeFormatSelector() - Loads state from localStorage or defaults
 * 2. renderFormatSelectorToForm() - Updates UI if state differs from HTML defaults
 * 3. User sees FormatSelector immediately (no layout shift)
 */
export function renderFormatSelectorToForm(): void {
  const container = document.getElementById('format-selector-container');
  if (!container) {
    console.warn('Format selector container not found');
    return;
  }

  // Get state from localStorage (already loaded by initializeFormatSelector)
  const state = getState();
  const { selectedFormat, audioFormat, audioBitrate } = state;

  // HTML defaults: MP3, 128kbps
  // Only update if state differs from defaults
  if (selectedFormat !== 'mp3' || audioFormat !== 'mp3' || audioBitrate !== '128') {
    updateFormatSelectorUI(state);
  }

  // Initialize event listeners
  initFormatSelector('#format-selector-container');
}

/**
 * Update format selector UI to match state
 * Uses data-format attribute on <html> for CSS-based switching (no FOUC)
 */
function updateFormatSelectorUI(state: ReturnType<typeof getState>): void {
  const { selectedFormat, videoQuality, audioFormat, audioBitrate } = state;

  // Update data-format attribute on <html> for CSS-based switching
  document.documentElement.dataset.format = selectedFormat;

  // Update selected value in the appropriate dropdown
  if (selectedFormat === 'mp4') {
    const mp4Select = document.getElementById('quality-select-mp4') as HTMLSelectElement;
    if (mp4Select) {
      const resolution = videoQuality?.replace('p', '') || '720';
      mp4Select.value = `mp4-${resolution}`;
    }
  } else {
    const mp3Select = document.getElementById('quality-select-mp3') as HTMLSelectElement;
    if (mp3Select) {
      const value = audioFormat === 'mp3' ? `${audioFormat}-${audioBitrate || '128'}` : `${audioFormat}-128`;
      mp3Select.value = value;
    }
  }
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
