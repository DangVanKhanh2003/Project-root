/**
 * Format Selector Component
 * MP3/MP4 toggle + Quality dropdown
 */

import {
  getState,
  setSelectedFormat,
  setVideoQuality,
  setAudioFormat,
  setAudioBitrate,
  type FormatType
} from '../../features/downloader/state';

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

  // All select changes (format select + quality select)
  container.addEventListener('change', handleSelectChange);

  // Initialize dropdown arrow rotation
  initDropdownArrow(container);

  // Initialize custom tooltips
  initCustomTooltips(container);
}

/**
 * Handle all <select> changes within format selector (event delegation)
 */
function handleSelectChange(event: Event): void {
  const target = event.target as HTMLSelectElement;

  // Format select (MP3 ↔ MP4)
  if (target.matches('[data-format-select]')) {
    const format = target.value as FormatType;
    if (format === 'mp3' || format === 'mp4') {
      setSelectedFormat(format);
      document.documentElement.dataset.format = format;
    }
    return;
  }

  // Quality select
  if (target.matches('[data-quality-select]')) {
    handleQualityChange(target.value);
  }
}

/**
 * Handle quality select value change
 *
 * MP3 values:  "mp3-128", "mp3-320", "flac", "wav", "m4a", "opus", "ogg"
 * MP4 values:  "mp4-720", "mp4-1080", "webm", "mkv"
 */
function handleQualityChange(value: string): void {
  const state = getState();

  if (state.selectedFormat === 'mp4') {
    if (value.startsWith('mp4-')) {
      // "mp4-720" → "720p"
      const resolution = value.split('-')[1];
      setVideoQuality(`${resolution}p`);
    } else {
      // "webm" or "mkv"
      setVideoQuality(value);
    }
  } else {
    if (value.startsWith('mp3-')) {
      // "mp3-128" → format='mp3', bitrate='128'
      const [format, bitrate] = value.split('-');
      setAudioFormat(format);
      setAudioBitrate(bitrate);
    } else {
      // "flac", "wav", "m4a", "opus", "ogg"
      setAudioFormat(value);
      setAudioBitrate('128');
    }
  }
}

// ==========================================
// Dropdown Arrow
// ==========================================

/**
 * Initialize dropdown arrow rotation on open/close
 */
function initDropdownArrow(container: Element): void {
  const qualityWrappers = container.querySelectorAll('.quality-wrapper');

  qualityWrappers.forEach((wrapper) => {
    const selects = wrapper.querySelectorAll('select');
    selects.forEach((select) => {
      select.addEventListener('mousedown', () => {
        wrapper.classList.toggle('dropdown-open');
      });

      select.addEventListener('change', () => {
        wrapper.classList.remove('dropdown-open');
      });

      select.addEventListener('blur', () => {
        wrapper.classList.remove('dropdown-open');
      });
    });
  });
}

// ==========================================
// Tooltips
// ==========================================

/**
 * Initialize custom tooltips with 0.5s delay
 */
function initCustomTooltips(container: Element): void {
  const tooltipElements = container.querySelectorAll('[data-tooltip]');

  tooltipElements.forEach((element) => {
    let tooltipTimer: number | null = null;

    const tooltipText = element.getAttribute('data-tooltip');
    const tooltipElement = element.querySelector('.custom-tooltip');

    if (tooltipElement && tooltipText) {
      tooltipElement.textContent = tooltipText;
    }

    element.addEventListener('mouseenter', () => {
      tooltipTimer = window.setTimeout(() => {
        element.classList.add('show-tooltip');
      }, 500);
    });

    element.addEventListener('mouseleave', () => {
      if (tooltipTimer) {
        clearTimeout(tooltipTimer);
        tooltipTimer = null;
      }
      element.classList.remove('show-tooltip');
    });
  });
}

// ==========================================
// Cleanup
// ==========================================

export function cleanupFormatSelector(): void {
  // Event delegation — no global listeners to remove
}
