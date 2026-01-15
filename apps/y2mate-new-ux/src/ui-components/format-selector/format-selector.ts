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
  setAutoSubmit,
  QUALITY_OPTIONS,
  type FormatType,
  type AudioFormatType
} from '../../features/downloader/state';
import { t } from '@downloader/i18n';

// ==========================================
// Render Functions
// ==========================================

/**
 * Initialize format selector from static HTML
 * Called once during app initialization
 *
 * HTML is already rendered in the page (no JS rendering needed).
 * This function only:
 * 1. Syncs UI with state from localStorage (if user has saved preferences)
 * 2. Attaches event listeners
 */
export function renderFormatSelectorToForm(): void {
  const container = document.getElementById('format-selector-container');
  if (!container) {
    console.warn('Format selector container not found');
    return;
  }

  // Sync UI with state from localStorage (update selected values if different from HTML defaults)
  syncUIWithState(container);

  // Initialize event listeners
  initFormatSelector('#format-selector-container');
}

/**
 * Sync UI elements with current state from localStorage
 * Updates format toggle, quality dropdown, and auto-submit based on saved preferences
 */
function syncUIWithState(container: HTMLElement): void {
  const state = getState();
  const { selectedFormat, videoQuality, audioFormat, audioBitrate, autoSubmit } = state;

  // Sync format toggle (MP4/MP3)
  const mp4Toggle = container.querySelector('.toggle-side[data-format="mp4"]');
  const mp3Toggle = container.querySelector('.toggle-side[data-format="mp3"]');
  if (mp4Toggle && mp3Toggle) {
    mp4Toggle.classList.toggle('active', selectedFormat === 'mp4');
    mp3Toggle.classList.toggle('active', selectedFormat === 'mp3');
  }

  // Sync quality dropdown - may need to re-render if format changed
  const qualitySelect = container.querySelector('#quality-select') as HTMLSelectElement;
  if (qualitySelect) {
    if (selectedFormat === 'mp4') {
      // Check if dropdown has MP4 options, if not re-render
      const hasMP4Options = qualitySelect.querySelector('option[value^="mp4-"]');
      if (!hasMP4Options) {
        // Need to replace dropdown with video options
        const qualitySelector = container.querySelector('.quality-selector');
        if (qualitySelector) {
          qualitySelector.innerHTML = renderVideoQualityDropdown(videoQuality);
        }
      } else {
        // Just update selected value
        const qualityValue = videoQuality.replace('p', '');
        const targetValue = `mp4-${qualityValue}`;
        if (qualitySelect.value !== targetValue && qualitySelect.querySelector(`option[value="${targetValue}"]`)) {
          qualitySelect.value = targetValue;
        }
      }
    } else {
      // MP3 format - check if dropdown has audio options
      const hasAudioOptions = qualitySelect.querySelector('option[value^="mp3-"]');
      if (!hasAudioOptions) {
        // Need to replace dropdown with audio options
        const qualitySelector = container.querySelector('.quality-selector');
        if (qualitySelector) {
          qualitySelector.innerHTML = renderAudioQualityDropdown(audioFormat, audioBitrate);
        }
      } else {
        // Update selected value
        let targetValue: string;
        if (audioFormat === 'mp3' && audioBitrate) {
          targetValue = `mp3-${audioBitrate}`;
        } else if (audioFormat) {
          targetValue = audioFormat;
        } else {
          targetValue = 'mp3-128';
        }
        if (qualitySelect.value !== targetValue && qualitySelect.querySelector(`option[value="${targetValue}"]`)) {
          qualitySelect.value = targetValue;
        }
      }
    }
  }

  // Sync auto-submit toggle
  const autoSubmitCheckbox = container.querySelector('#auto-submit-checkbox') as HTMLInputElement;
  if (autoSubmitCheckbox && autoSubmitCheckbox.checked !== autoSubmit) {
    autoSubmitCheckbox.checked = autoSubmit;
  }
}

/**
 * Render format selector HTML
 * Returns HTML string for the format selector component
 */
function renderFormatSelector(): string {
  const state = getState();
  const { selectedFormat, videoQuality, audioFormat, audioBitrate, autoSubmit } = state;

  // Generate quality dropdown HTML based on selected format
  const qualityDropdownHTML = selectedFormat === 'mp4'
    ? renderVideoQualityDropdown(videoQuality)
    : renderAudioQualityDropdown(audioFormat, audioBitrate);

  return `
    <div class="format-selector">
      <!-- Group 1: Format + Quality -->
      <div class="format-quality-group">
        <!-- Format Toggle (Single button: MP4 | MP3) -->
        <button type="button" class="format-toggle-btn" data-toggle-format>
          <span class="toggle-side ${selectedFormat === 'mp4' ? 'active' : ''}" data-format="mp4">
            <span class="format-label">MP4</span>
          </span>
          <span class="toggle-side ${selectedFormat === 'mp3' ? 'active' : ''}" data-format="mp3">
            <span class="format-label">MP3</span>
          </span>
        </button>

        <!-- Quality Dropdown (Dynamic based on format) -->
        <div class="quality-selector">
          ${qualityDropdownHTML}
        </div>
      </div>

      <!-- Group 2: Auto Submit Toggle -->
      <div class="auto-submit-toggle" data-tooltip="Automatically submit when pasting URL or keyword">
        <strong class="toggle-label">Auto</strong>
        <label class="toggle-switch">
          <input type="checkbox" id="auto-submit-checkbox" ${autoSubmit ? 'checked' : ''} data-auto-submit-toggle />
          <span class="toggle-slider"></span>
        </label>
        <span class="custom-tooltip"></span>
      </div>
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
      // MP4 with quality: "mp4-1080" -> "1080p"
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
