/**
 * Format Selector Component
 * Reusable MP3/MP4 toggle + Quality dropdown
 * Uses CSS-based switching to prevent FOUC
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
    // Video format: value is "mp4-1080", "mp4-720", "webm", "mkv"
    if (value.startsWith('mp4-')) {
      const resolution = value.split('-')[1];
      setVideoQuality(`${resolution}p`);
    } else {
      // WEBM or MKV
      setVideoQuality(value);
    }
  } else {
    // Audio format: MP3 has "mp3-bitrate", others have just format name
    if (value.startsWith('mp3-')) {
      const [format, bitrate] = value.split('-');
      setAudioFormat(format as AudioFormatType);
      setAudioBitrate(bitrate);
    } else {
      // flac, wav, m4a, opus, ogg - no bitrate
      setAudioFormat(value as AudioFormatType);
      setAudioBitrate(''); // No bitrate for lossless/other formats
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

  // Update active class on format buttons
  document.querySelectorAll('.format-btn').forEach((btn) => {
    const btnFormat = (btn as HTMLElement).dataset.format;
    btn.classList.toggle('active', btnFormat === format);
  });
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
