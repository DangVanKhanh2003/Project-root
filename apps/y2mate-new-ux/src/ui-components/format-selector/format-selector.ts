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

  return `
    <div class="format-selector">
      <!-- Format Toggle (Single button: MP4 | MP3) -->
      <button type="button" class="format-toggle-btn" data-toggle-format>
        <span class="toggle-side ${selectedFormat === 'mp4' ? 'active' : ''}" data-format="mp4">
          <span class="format-label">MP4</span>
        </span>
        <span class="toggle-divider"></span>
        <span class="toggle-side ${selectedFormat === 'mp3' ? 'active' : ''}" data-format="mp3">
          <span class="format-label">MP3</span>
        </span>
      </button>

      <!-- Quality Dropdown (Dynamic based on format) -->
      <div class="quality-selector">
        ${qualityDropdownHTML}
      </div>
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
    <select id="quality-select" class="quality-select" aria-label="Video quality" data-quality-select>
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
      <select id="quality-select" class="quality-select" aria-label="Audio quality" data-quality-select>
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
 * Cleanup format selector (remove event listeners)
 */
export function cleanupFormatSelector(): void {
  // No global event listeners to clean up (using event delegation)
}
