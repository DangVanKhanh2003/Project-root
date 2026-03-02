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
  QUALITY_OPTIONS,
  type FormatType,
  type AudioFormatType
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

  // Format button clicks (MP3 ↔ MP4)
  container.addEventListener('click', handleFormatSelectorClick);

  // Quality select changes
  container.addEventListener('change', handleQualityChange);

  // Initialize dropdown arrow rotation
  initDropdownArrow(container);

  // Initialize custom tooltips
  initCustomTooltips(container);
}

/**
 * Handle all clicks within format selector (event delegation)
 */
function handleFormatSelectorClick(event: Event): void {
  const target = event.target as HTMLElement;

  const formatBtn = target.closest('.format-btn') as HTMLElement;
  if (formatBtn) {
    const format = formatBtn.dataset.format as FormatType;
    if (format === 'mp3' || format === 'mp4') {
      handleFormatChange(format);
    }
  }
}

/**
 * Handle format change (MP3 ↔ MP4)
 * Updates html[data-format] — CSS handles visibility and active state
 */
function handleFormatChange(format: FormatType): void {
  setSelectedFormat(format);
  document.documentElement.dataset.format = format;
}

/**
 * Handle quality select change
 *
 * MP3 values:  "mp3-128", "mp3-320", "flac", "wav", "m4a", "opus", "ogg"
 * MP4 values:  "mp4-720", "mp4-1080", "webm", "mkv"
 */
function handleQualityChange(event: Event): void {
  const target = event.target as HTMLSelectElement;

  if (!target.matches('[data-quality-select]')) {
    return;
  }

  const value = target.value;
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
      setAudioBitrate('128'); // Default for API compatibility
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
