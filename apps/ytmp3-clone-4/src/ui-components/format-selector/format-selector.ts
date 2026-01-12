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
  const { selectedFormat, videoQuality, audioFormat, audioBitrate } = state;

  // HTML defaults: MP3, mp3-128
  // Only update if state differs from defaults
  if (selectedFormat !== 'mp3' || audioFormat !== 'mp3' || audioBitrate !== '128') {
    updateFormatSelectorUI(state);
  }

  // Initialize event listeners
  initFormatSelector('#format-selector-container');
}

/**
 * Update format selector UI to match state
 * Called when state differs from HTML defaults
 */
function updateFormatSelectorUI(state: ReturnType<typeof getState>): void {
  const { selectedFormat, videoQuality, audioFormat, audioBitrate } = state;

  // Update format buttons
  const mp3Btn = document.querySelector('.format-btn[data-format="mp3"]');
  const mp4Btn = document.querySelector('.format-btn[data-format="mp4"]');

  if (mp3Btn && mp4Btn) {
    mp3Btn.classList.toggle('active', selectedFormat === 'mp3');
    mp4Btn.classList.toggle('active', selectedFormat === 'mp4');
  }

  // Update quality dropdown based on format
  if (selectedFormat === 'mp4') {
    // Switch to MP4 quality options
    const qualityWrapper = document.querySelector('.quality-wrapper');
    if (qualityWrapper) {
      const dropdownWrapper = qualityWrapper.querySelector('.quality-dropdown-wrapper');
      if (dropdownWrapper) {
        dropdownWrapper.innerHTML = renderVideoQualityDropdown(videoQuality);
      } else {
        // No wrapper, update select directly
        const select = qualityWrapper.querySelector('.quality-select');
        if (select) {
          select.outerHTML = renderVideoQualityDropdown(videoQuality);
        }
      }
    }
  } else {
    // MP3 format - just update selected value
    const select = document.querySelector('.quality-select') as HTMLSelectElement;
    if (select) {
      const value = `${audioFormat}-${audioBitrate}`;
      select.value = value;
    }
  }
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
        <!-- Quality icon for mobile -->
        <div class="quality-icon-mobile">
          <img src="/assest/icons/quality-choose-icon.png" alt="Quality" width="20" height="20" />
        </div>
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
  const qualities = QUALITY_OPTIONS.mp4;
  const defaultQuality = selectedQuality || '720p';

  return `
    <select id="quality-select" class="quality-select" aria-label="${t('aria.qualitySelector')}" data-quality-select>
      ${qualities.map(quality => {
        const resolution = quality.replace('p', '');
        const isSelected = quality === defaultQuality;
        return `<option value="${resolution}"${isSelected ? ' selected' : ''}> MP4 - ${quality} </option>`;
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
    { value: 'mp3-128', label: 'MP3 - 128kbps', format: 'mp3', bitrate: '128' },
    { value: 'mp3-256', label: 'MP3 - 256kbps', format: 'mp3', bitrate: '256' },
    { value: 'ogg-128', label: 'OGG', format: 'ogg', bitrate: '128' },
    { value: 'wav-128', label: 'WAV - Lossless', format: 'wav', bitrate: '128' },
    { value: 'opus-128', label: 'Opus', format: 'opus', bitrate: '128' },
    { value: 'm4a-192', label: 'M4A', format: 'm4a', bitrate: '192' },
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
    // MP4 format: value is resolution (e.g., "1080")
    const quality = `${value}p`;
    setVideoQuality(quality);
  } else {
    // MP3 format: value is "format-bitrate" (e.g., "mp3-128")
    const [format, bitrate] = value.split('-');
    if (format && bitrate) {
      setAudioFormat(format as AudioFormatType);
      setAudioBitrate(bitrate);
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
