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
  QUALITY_OPTIONS,
  type FormatType,
  type AudioFormatType
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
 *
 * Flow:
 * 1. initializeFormatSelector() - Loads state from localStorage or page defaults
 * 2. renderFormatSelectorToForm() - Renders HTML with loaded state
 * 3. User sees FormatSelector immediately with correct values (no layout shift)
 */
export function renderFormatSelectorToForm(): void {
  const container = document.getElementById('format-selector-container');
  if (!container) {
    console.warn('Format selector container not found');
    return;
  }

  // Render immediately with current state (no loading/skeleton needed)
  const html = renderFormatSelector();
  container.innerHTML = html;

  // Initialize event listeners
  initFormatSelector('#format-selector-container');
}

/**
 * Render format selector HTML
 * Returns HTML string for the format selector component
 */
function renderFormatSelector(): string {
  const state = getState();
  const { selectedFormat, videoQuality, audioFormat, audioBitrate } = state;

  // Generate quality dropdown HTML based on selected format
  const qualityDropdownHTML = selectedFormat === 'mp4'
    ? renderVideoQualityDropdown(videoQuality)
    : renderAudioQualityDropdown(audioFormat, audioBitrate);

  // Debug: Check language at render time
  const htmlLang = document.documentElement.getAttribute('lang');
  const convertText = t('common.buttons.convert');
  console.log('[FormatSelector] Rendering:', {
    htmlLang,
    convertText,
    timestamp: new Date().toISOString()
  });

  return `
    <div class="format-selector">
      <!-- Format Toggle (Two separate buttons) -->
      <div class="format-toggle">
        <button type="button" class="format-btn ${selectedFormat === 'mp3' ? 'active' : ''}" data-format="mp3">MP3</button>
        <button type="button" class="format-btn ${selectedFormat === 'mp4' ? 'active' : ''}" data-format="mp4">MP4</button>
      </div>

      <!-- Quality Dropdown (Dynamic based on format) -->
      <div class="quality-wrapper">
        ${qualityDropdownHTML}
        <div class="select-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </div>

      <!-- Convert Button -->
      <button type="submit" class="btn-convert">
        <span>${convertText}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
      </button>
    </div>
  `;
}

/**
 * Render video quality dropdown (for MP4)
 * Shows MP4 with all resolutions + WEBM and MKV options
 */
function renderVideoQualityDropdown(selectedQuality: string): string {
  const qualities = QUALITY_OPTIONS.mp4.qualities;
  const formats = QUALITY_OPTIONS.mp4.formats;
  const defaultQuality = selectedQuality || '720p';

  // Build video options: MP4 with all qualities, then WEBM and MKV without quality
  const videoOptions: { value: string; label: string }[] = [];

  // MP4 with all quality options
  qualities.forEach(quality => {
    const resolution = quality.replace('p', '');
    videoOptions.push({ value: `mp4-${resolution}`, label: `MP4 - ${quality}` });
  });

  // WEBM and MKV without quality suffix
  formats.forEach(format => {
    if (format !== 'mp4') {
      videoOptions.push({ value: format, label: format.toUpperCase() });
    }
  });

  return `
    <select id="quality-select" class="quality-select" aria-label="${t('aria.qualitySelector')}" data-quality-select>
      ${videoOptions.map(option => {
        const isSelected = option.value === `mp4-${defaultQuality.replace('p', '')}` || option.value === defaultQuality;
        return `<option value="${option.value}"${isSelected ? ' selected' : ''}> ${option.label} </option>`;
      }).join('')}
    </select>
  `;
}

/**
 * Render audio quality dropdown (for MP3)
 * Shows combined format + quality options
 */
function renderAudioQualityDropdown(selectedAudioFormat: AudioFormatType, selectedBitrate: string): string {
  // Build audio quality options - MP3 has bitrate suffix, others don't
  const audioOptions = [
    { value: 'mp3-320', label: 'MP3 - 320kbps' },
    { value: 'mp3-192', label: 'MP3 - 192kbps' },
    { value: 'mp3-128', label: 'MP3 - 128kbps' },
    { value: 'mp3-64', label: 'MP3 - 64kbps' },
    { value: 'flac', label: 'FLAC - Lossless' },
    { value: 'wav', label: 'WAV - Lossless' },
    { value: 'm4a', label: 'M4A' },
    { value: 'opus', label: 'Opus' },
    { value: 'ogg', label: 'OGG' },
  ];

  // Determine selected value: MP3 has bitrate suffix, others don't
  let selectedValue: string;
  if (selectedAudioFormat === 'mp3' && selectedBitrate) {
    selectedValue = `mp3-${selectedBitrate}`;
  } else if (selectedAudioFormat) {
    selectedValue = selectedAudioFormat;
  } else {
    selectedValue = 'mp3-128'; // Default
  }

  return `
    <div class="quality-dropdown-wrapper">
      <select id="quality-select" class="quality-select" aria-label="${t('aria.qualitySelector')}" data-quality-select>
        ${audioOptions.map(option => {
          const isSelected = option.value === selectedValue;
          return `<option value="${option.value}"${isSelected ? ' selected' : ''}> ${option.label} </option>`;
        }).join('')}
      </select>
    </div>
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
 */
function handleQualityChange(event: Event): void {
  const target = event.target as HTMLSelectElement;

  // Only handle quality-select changes
  if (!target.matches('[data-quality-select]')) {
    return;
  }

  const value = target.value;
  const state = getState();

  if (state.selectedFormat === 'mp4') {
    // Video format: value can be "mp4-1080", "webm", "mkv"
    if (value.startsWith('mp4-')) {
      // MP4 with quality: "mp4-1080" -> "720p"
      const resolution = value.split('-')[1];
      setVideoQuality(`${resolution}p`);
    } else {
      // WEBM or MKV without quality suffix
      setVideoQuality(value); // Store as "webm" or "mkv"
    }
  } else {
    // Audio format: MP3 has "mp3-bitrate", others are just format name
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
 * Triggers dropdown re-render
 */
function handleFormatChange(format: FormatType): void {
  setSelectedFormat(format);
  refreshFormatSelector();
}

/**
 * Refresh format selector UI
 * Re-renders the component with current state
 */
function refreshFormatSelector(): void {
  const container = document.getElementById('format-selector-container');
  if (!container) return;

  const html = renderFormatSelector();
  container.innerHTML = html;
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
