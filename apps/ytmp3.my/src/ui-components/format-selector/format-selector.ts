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
 * 2. renderFormatSelectorToForm() - Only updates if localStorage exists, otherwise keeps HTML default
 * 3. User sees FormatSelector immediately with correct values (no layout shift)
 */
export function renderFormatSelectorToForm(): void {
  const container = document.getElementById('format-selector-container');
  if (!container) {
    console.warn('Format selector container not found');
    return;
  }

  const state = getState();

  // Only update HTML if user has stored preferences in localStorage
  // Otherwise, keep the HTML default values (no JS modification needed)
  if (state.hasUserSelectedFormat) {
    // Update format button states
    updateFormatButtonState(container, state.selectedFormat);

    // Update dropdown selected value
    updateDropdownSelectedValue(container, state);
  }

  // Always initialize event listeners
  initFormatSelector('#format-selector-container');
}

/**
 * Update format button active state without replacing HTML
 */
function updateFormatButtonState(container: HTMLElement, selectedFormat: FormatType): void {
  const formatButtons = container.querySelectorAll('.format-btn');
  formatButtons.forEach((btn) => {
    const format = (btn as HTMLElement).dataset.format;
    if (format === selectedFormat) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Update dropdown selected value without replacing options
 */
function updateDropdownSelectedValue(container: HTMLElement, state: ReturnType<typeof getState>): void {
  const select = container.querySelector('[data-quality-select]') as HTMLSelectElement;
  if (!select) return;

  let targetValue: string;

  if (state.selectedFormat === 'mp4') {
    // For MP4: value format is "mp4-720" (without 'p')
    const resolution = state.videoQuality?.replace('p', '') || '720';
    targetValue = `mp4-${resolution}`;
  } else {
    // For audio: MP3 has bitrate suffix, others don't
    if (state.audioFormat === 'mp3') {
      targetValue = `mp3-${state.audioBitrate}`;
    } else {
      // flac, wav, m4a, opus, ogg - no bitrate suffix
      targetValue = state.audioFormat;
    }
  }

  // Set the selected value
  select.value = targetValue;
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
 */
function renderVideoQualityDropdown(selectedQuality: string): string {
  const defaultQuality = selectedQuality || '720p';

  // Build video quality options with all formats
  const videoOptions = [
    // MP4 options
    { value: 'mp4-1080', label: 'MP4 - 1080p', format: 'mp4', quality: '1080p' },
    { value: 'mp4-720', label: 'MP4 - 720p', format: 'mp4', quality: '720p' },
    { value: 'mp4-480', label: 'MP4 - 480p', format: 'mp4', quality: '480p' },
    { value: 'mp4-360', label: 'MP4 - 360p', format: 'mp4', quality: '360p' },
    // WebM options
    { value: 'webm-1080', label: 'WebM - 1080p', format: 'webm', quality: '1080p' },
    { value: 'webm-720', label: 'WebM - 720p', format: 'webm', quality: '720p' },
    { value: 'webm-480', label: 'WebM - 480p', format: 'webm', quality: '480p' },
    // MKV options
    { value: 'mkv-1080', label: 'MKV - 1080p', format: 'mkv', quality: '1080p' },
    { value: 'mkv-720', label: 'MKV - 720p', format: 'mkv', quality: '720p' },
  ];

  // Determine selected value
  const selectedValue = `mp4-${defaultQuality.replace('p', '')}`;

  return `
    <select id="quality-select" class="quality-select" aria-label="${t('aria.qualitySelector')}" data-quality-select>
      ${videoOptions.map(option => {
        const isSelected = option.value === selectedValue;
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
  // Build audio quality options
  const audioOptions = [
    { value: 'mp3-320', label: 'MP3 - 320kbps', format: 'mp3', bitrate: '320' },
    { value: 'mp3-256', label: 'MP3 - 256kbps', format: 'mp3', bitrate: '256' },
    { value: 'mp3-128', label: 'MP3 - 128kbps', format: 'mp3', bitrate: '128' },
    { value: 'flac-128', label: 'FLAC - Lossless', format: 'flac', bitrate: '128' },
    { value: 'wav-128', label: 'WAV - Lossless', format: 'wav', bitrate: '128' },
    { value: 'm4a-256', label: 'M4A - 256kbps', format: 'm4a', bitrate: '256' },
    { value: 'm4a-128', label: 'M4A - 128kbps', format: 'm4a', bitrate: '128' },
    { value: 'opus-128', label: 'Opus - 128kbps', format: 'opus', bitrate: '128' },
    { value: 'ogg-128', label: 'OGG - 128kbps', format: 'ogg', bitrate: '128' },
  ];

  // Determine selected value
  const selectedValue = selectedAudioFormat && selectedBitrate
    ? `${selectedAudioFormat}-${selectedBitrate}`
    : 'mp3-128'; // Default

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
    // MP4 format: value is "format-resolution" (e.g., "mp4-1080", "webm-720")
    const [format, resolution] = value.split('-');
    if (format && resolution) {
      const quality = `${resolution}p`;
      setVideoQuality(quality);
      // TODO: Store video format (mp4/webm/mkv) in state if needed
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
 * Updates button state and replaces dropdown options
 */
function handleFormatChange(format: FormatType): void {
  setSelectedFormat(format);

  const container = document.getElementById('format-selector-container');
  if (!container) return;

  // Update button states
  updateFormatButtonState(container, format);

  // Replace dropdown with appropriate options (audio vs video)
  replaceDropdownOptions(container, format);
}

/**
 * Replace dropdown options when switching between MP3 and MP4
 * Only replaces the <select> element, not the entire component
 */
function replaceDropdownOptions(container: HTMLElement, format: FormatType): void {
  const dropdownWrapper = container.querySelector('.quality-dropdown-wrapper');
  if (!dropdownWrapper) return;

  const state = getState();

  if (format === 'mp4') {
    // Replace with video options
    dropdownWrapper.innerHTML = renderVideoQualityDropdown(state.videoQuality);
  } else {
    // Replace with audio options
    dropdownWrapper.innerHTML = renderAudioDropdownOnly(state.audioFormat, state.audioBitrate);
  }
}

/**
 * Render only the audio dropdown select element (no wrapper)
 */
function renderAudioDropdownOnly(selectedAudioFormat: AudioFormatType, selectedBitrate: string): string {
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
    <select id="quality-select" class="quality-select" aria-label="${t('aria.qualitySelector')}" data-quality-select>
      ${audioOptions.map(option => {
        const isSelected = option.value === selectedValue;
        return `<option value="${option.value}"${isSelected ? ' selected' : ''}>${option.label}</option>`;
      }).join('')}
    </select>
  `;
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
