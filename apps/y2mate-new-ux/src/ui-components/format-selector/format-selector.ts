/**
 * Format Selector Component
 * Reusable MP3/MP4 toggle + Quality dropdown
 * Uses CSS-based switching to prevent FOUC
 */

import {
  getState,
  setSelectedFormat,
  setVideoQuality,
  setAudioFormat,
  setAudioBitrate,
  setAutoSubmit,
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
 * HTML is already rendered with both MP3/MP4 dropdowns.
 * CSS controls visibility via html[data-format] attribute.
 * This function only:
 * 1. Syncs UI with state from localStorage (if different from defaults)
 * 2. Attaches event listeners
 */
export function renderFormatSelectorToForm(): void {
  const container = document.getElementById('format-selector-container');
  if (!container) {
    console.warn('Format selector container not found');
    return;
  }

  // Get state from localStorage (already loaded by initializeFormatSelector)
  const state = getState();
  const { selectedFormat, videoQuality } = state;

  // HTML defaults: MP4, 720p
  // Only update if state differs from defaults
  if (selectedFormat !== 'mp4' || videoQuality !== '720p') {
    updateFormatSelectorUI(state);
  }

  // Sync auto-submit toggle
  const autoSubmitCheckbox = container.querySelector('#auto-submit-checkbox') as HTMLInputElement;
  if (autoSubmitCheckbox && autoSubmitCheckbox.checked !== state.autoSubmit) {
    autoSubmitCheckbox.checked = state.autoSubmit;
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
      // webm, mkv don't have prefix - use as-is
      const isAlternateFormat = videoQuality === 'webm' || videoQuality === 'mkv';
      const value = isAlternateFormat ? videoQuality : `mp4-${videoQuality?.replace('p', '') || '720'}`;
      mp4Select.value = value;
    }
  } else {
    const mp3Select = document.getElementById('quality-select-mp3') as HTMLSelectElement;
    if (mp3Select) {
      // ogg, opus, wav, flac don't have bitrate suffix - use as-is
      const value = audioFormat === 'mp3' ? `mp3-${audioBitrate || '128'}` : audioFormat;
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

  // Listen for auto-submit toggle changes
  container.addEventListener('change', handleAutoSubmitToggle);

  // Initialize custom tooltips
  initCustomTooltips(container);
}

/**
 * Handle all clicks within format selector (event delegation)
 */
function handleFormatSelectorClick(event: Event): void {
  const target = event.target as HTMLElement;

  // Handle format toggle (Single button with two sides)
  const toggleSide = target.closest('.toggle-side') as HTMLElement;
  if (toggleSide) {
    const format = toggleSide.dataset.format as FormatType;
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
    // Video format: value is "mp4-1080", "mp4-720", "webm", "mkv"
    if (value.startsWith('mp4-')) {
      const resolution = value.split('-')[1];
      setVideoQuality(`${resolution}p`);
    } else {
      // WEBM or MKV
      setVideoQuality(value);
    }
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
 * Handle auto-submit toggle change
 */
function handleAutoSubmitToggle(event: Event): void {
  const target = event.target as HTMLInputElement;

  // Only handle auto-submit toggle changes
  if (!target.matches('[data-auto-submit-toggle]')) {
    return;
  }

  setAutoSubmit(target.checked);
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
