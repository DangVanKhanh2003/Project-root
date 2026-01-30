/**
 * Format Selector Component
 * Quality dropdown for MP3 (auto format = mp3)
 */

import {
  setAudioFormat,
  setAudioBitrate
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

  // Listen for quality select changes (MP3 bitrate)
  container.addEventListener('change', handleQualityChange);

  // Initialize dropdown arrow rotation
  initDropdownArrow(container);

  // Initialize custom tooltips
  initCustomTooltips(container);
}

/**
 * Handle quality select change
 * Sets both audio format and bitrate (matches ytmp3.my behavior)
 *
 * Value formats:
 * - "mp3-128", "mp3-320" etc. → format='mp3', bitrate='128'/'320'
 * - "wav", "flac", "ogg", "opus", "m4a" → format=value, bitrate=''
 */
function handleQualityChange(event: Event): void {
  const target = event.target as HTMLSelectElement;

  // Only handle quality-select changes
  if (!target.matches('[data-quality-select]')) {
    return;
  }

  const value = target.value;

  // Check if value contains bitrate (e.g., "mp3-128")
  if (value.includes('-')) {
    const [format, bitrate] = value.split('-');
    setAudioFormat(format);
    setAudioBitrate(bitrate);
  } else {
    // Non-MP3 formats without bitrate (wav, flac, ogg, opus, m4a)
    setAudioFormat(value);
    // Clear bitrate for non-MP3 formats (API will use default)
    setAudioBitrate('128'); // Default bitrate for API compatibility
  }
}

// ==========================================
// Dropdown Arrow
// ==========================================

/**
 * Initialize dropdown arrow rotation on open/close
 * Native <select> doesn't have open/close events, so we use:
 * - mousedown: toggle open state
 * - change: option selected, close
 * - blur: clicked outside, close
 */
function initDropdownArrow(container: Element): void {
  const qualityWrappers = container.querySelectorAll('.quality-wrapper');

  qualityWrappers.forEach((wrapper) => {
    const select = wrapper.querySelector('select');
    if (!select) return;

    // Toggle dropdown on mousedown (handles open and close on same element)
    select.addEventListener('mousedown', () => {
      wrapper.classList.toggle('dropdown-open');
    });

    // Close dropdown when option selected
    select.addEventListener('change', () => {
      wrapper.classList.remove('dropdown-open');
    });

    // Close dropdown when focus lost
    select.addEventListener('blur', () => {
      wrapper.classList.remove('dropdown-open');
    });
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
