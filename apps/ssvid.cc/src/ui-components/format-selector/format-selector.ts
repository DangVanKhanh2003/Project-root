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
import { logEvent } from '../../libs/firebase';

// ==========================================
// Render Functions
// ==========================================


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
    // Check if videoQuality is a format (webm, mkv) or resolution (720p)
    if (state.videoQuality === 'webm' || state.videoQuality === 'mkv') {
      // WEBM/MKV: value is just the format name
      targetValue = state.videoQuality;
    } else {
      // MP4: value format is "mp4-720" (without 'p')
      const resolution = state.videoQuality?.replace('p', '') || '720';
      targetValue = `mp4-${resolution}`;
    }
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

  const convertText = 'Convert';

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
    const label =
      quality === '2160p'
        ? 'MP4 - 4K'
        : quality === '1440p'
          ? 'MP4 - 2K'
          : `MP4 - ${quality}`;
    videoOptions.push({ value: `mp4-${resolution}`, label });
  });

  // WEBM and MKV without quality suffix
  formats.forEach(format => {
    if (format !== 'mp4') {
      videoOptions.push({ value: format, label: format.toUpperCase() });
    }
  });

  return `
    <select id="quality-select" class="quality-select" aria-label="Quality selector" data-quality-select>
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
  // Build audio quality options
  const audioOptions = [
    { value: 'mp3-320', label: 'MP3 - 320kbps', format: 'mp3', bitrate: '320' },
    { value: 'mp3-192', label: 'MP3 - 192kbps', format: 'mp3', bitrate: '192' },
    { value: 'mp3-128', label: 'MP3 - 128kbps', format: 'mp3', bitrate: '128' },
    { value: 'mp3-64', label: 'MP3 - 64kbps', format: 'mp3', bitrate: '64' },
    { value: 'flac', label: 'FLAC - Lossless', format: 'flac', bitrate: '128' },
    { value: 'wav', label: 'WAV - Lossless', format: 'wav', bitrate: '128' },
    { value: 'm4a', label: 'M4A', format: 'm4a', bitrate: '128' },
    { value: 'opus', label: 'Opus', format: 'opus', bitrate: '128' },
    { value: 'ogg', label: 'OGG', format: 'ogg', bitrate: '128' },
  ];

  // Determine selected value
  const selectedValue = selectedAudioFormat === 'mp3'
    ? `mp3-${selectedBitrate || '128'}`
    : (selectedAudioFormat || 'mp3-128');

  return `
    <div class="quality-dropdown-wrapper">
      <select id="quality-select" class="quality-select" aria-label="Quality selector" data-quality-select>
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
      logEvent('format_change', { format });
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
  logEvent('quality_change', { quality: value });
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
    // Audio format: MP3 uses "mp3-bitrate", others are just format name
    if (value.startsWith('mp3-')) {
      const [format, bitrate] = value.split('-');
      setAudioFormat(format as AudioFormatType);
      setAudioBitrate(bitrate);
    } else {
      // ogg, wav, opus, m4a, flac - no bitrate suffix
      setAudioFormat(value as AudioFormatType);
      setAudioBitrate('');
    }
  }
}

/**
 * Handle format change (MP3 ↔ MP4)
 * Updates data-format attribute on <html> - CSS handles visibility
 */
function handleFormatChange(format: FormatType): void {
  setSelectedFormat(format);

  // Update data-format attribute on <html> - CSS handles button active state and dropdown visibility
  document.documentElement.dataset.format = format;
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
    <select id="quality-select" class="quality-select" aria-label="Quality selector" data-quality-select>
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
