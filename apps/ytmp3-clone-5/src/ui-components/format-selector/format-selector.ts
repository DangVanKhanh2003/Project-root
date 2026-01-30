/**
 * Format Selector Component
 * Separated: Format dropdown (MP3/MP4) + Quality settings dropdown
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
 * Render Format Dropdown (MP3/MP4 only)
 */
function renderFormatDropdown(): string {
  const state = getState();
  const { selectedFormat } = state;

  return `
    <div class="format-selector-pill">
      <button type="button" class="format-dropdown-btn" id="formatDropdownBtn">
        <span class="format-current">${selectedFormat.toUpperCase()}</span>
        <svg class="chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      <div class="format-dropdown-menu" id="formatDropdownMenu">
        <div class="dropdown-header">Select Format</div>
        <button type="button" class="dropdown-item ${selectedFormat === 'mp4' ? 'selected' : ''}" data-format="mp4">
          <span>MP4 Video</span>
          <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <button type="button" class="dropdown-item ${selectedFormat === 'mp3' ? 'selected' : ''}" data-format="mp3">
          <span>MP3 Audio</span>
          <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
      </div>
    </div>
  `;
}

/**
 * Render Quality Selector (Settings button with dropdown)
 */
function renderQualitySelector(): string {
  const state = getState();
  const { selectedFormat, videoQuality, audioFormat, audioBitrate } = state;

  // Get current quality display text
  let qualityText: string;
  if (selectedFormat === 'mp4') {
    qualityText = videoQuality;
  } else if (audioFormat === 'mp3' && audioBitrate) {
    qualityText = `${audioBitrate}kbps`;
  } else {
    qualityText = audioFormat ? audioFormat.toUpperCase() : '128kbps';
  }

  return `
    <button type="button" class="settings-btn" id="settingsBtn" title="Quality: ${qualityText}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </button>

    <div class="settings-dropdown" id="settingsDropdown">
      <div class="dropdown-header">Quality</div>
      ${renderQualityOptions(selectedFormat, videoQuality, audioFormat, audioBitrate)}
      <div class="dropdown-divider"></div>
      <div class="dropdown-footer">
        Current: <span class="current-summary">${selectedFormat.toUpperCase()} • ${qualityText}</span>
      </div>
    </div>
  `;
}

/**
 * Render quality options based on selected format
 */
function renderQualityOptions(
  selectedFormat: FormatType,
  videoQuality: string,
  audioFormat: AudioFormatType,
  audioBitrate: string
): string {
  if (selectedFormat === 'mp4') {
    const qualities = QUALITY_OPTIONS.mp4.qualities;
    const formats = QUALITY_OPTIONS.mp4.formats;

    // Build video options: MP4 with all qualities, then WEBM and MKV without quality
    const videoOptions: { value: string; label: string }[] = [];

    // MP4 with all quality options
    qualities.forEach(quality => {
      videoOptions.push({ value: `mp4-${quality}`, label: `MP4 - ${quality}` });
    });

    // WEBM and MKV without quality suffix
    formats.forEach(format => {
      if (format !== 'mp4') {
        videoOptions.push({ value: format, label: format.toUpperCase() });
      }
    });

    return videoOptions.map(option => {
      const isSelected = option.value === `mp4-${videoQuality}` || option.value === videoQuality;
      return `
        <button type="button" class="dropdown-item ${isSelected ? 'selected' : ''}" data-quality="${option.value}">
          <span>${option.label}</span>
          <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
      `;
    }).join('');
  } else {
    // Build audio quality options - MP3 has bitrate suffix, others don't
    const audioOptions = [
      { value: 'mp3-320', label: 'MP3 320kbps' },
      { value: 'mp3-192', label: 'MP3 192kbps' },
      { value: 'mp3-128', label: 'MP3 128kbps' },
      { value: 'mp3-64', label: 'MP3 64kbps' },
      { value: 'flac', label: 'FLAC Lossless' },
      { value: 'wav', label: 'WAV Lossless' },
      { value: 'm4a', label: 'M4A' },
      { value: 'opus', label: 'Opus' },
      { value: 'ogg', label: 'OGG' },
    ];

    // Determine current value: MP3 has bitrate suffix, others don't
    let currentValue: string;
    if (audioFormat === 'mp3' && audioBitrate) {
      currentValue = `mp3-${audioBitrate}`;
    } else if (audioFormat) {
      currentValue = audioFormat;
    } else {
      currentValue = 'mp3-128';
    }

    return audioOptions.map(option => {
      const isSelected = option.value === currentValue;
      return `
        <button type="button" class="dropdown-item ${isSelected ? 'selected' : ''}" data-audio-quality="${option.value}">
          <span>${option.label}</span>
          <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
      `;
    }).join('');
  }
}

// ==========================================
// Event Handlers - Format Dropdown
// ==========================================

function initFormatDropdown(): void {
  const btn = document.getElementById('formatDropdownBtn');
  const dropdown = document.getElementById('formatDropdownMenu');

  if (!btn || !dropdown) return;

  // Toggle dropdown
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('show');
    closeAllDropdowns();
    if (!isOpen) {
      dropdown.classList.add('show');
      btn.classList.add('active');
    }
  });

  // Handle format selection
  dropdown.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const item = target.closest('[data-format]') as HTMLElement;
    if (item) {
      const format = item.dataset.format as FormatType;
      if (format) {
        setSelectedFormat(format);
        refreshAll();
        closeAllDropdowns();
      }
    }
  });
}

// ==========================================
// Event Handlers - Quality Selector
// ==========================================

function initQualitySelector(): void {
  const btn = document.getElementById('settingsBtn');
  const dropdown = document.getElementById('settingsDropdown');

  if (!btn || !dropdown) return;

  // Toggle dropdown
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('show');
    closeAllDropdowns();
    if (!isOpen) {
      dropdown.classList.add('show');
      btn.classList.add('active');
    }
  });

  // Handle quality selection
  dropdown.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Video quality
    const qualityItem = target.closest('[data-quality]') as HTMLElement;
    if (qualityItem) {
      const value = qualityItem.dataset.quality;
      if (value) {
        // Video format: value can be "mp4-720p", "webm", "mkv"
        if (value.startsWith('mp4-')) {
          // MP4 with quality: "mp4-720p" -> "720p"
          const quality = value.replace('mp4-', '');
          setVideoQuality(quality);
        } else {
          // WEBM or MKV without quality suffix
          setVideoQuality(value); // Store as "webm" or "mkv"
        }
        refreshAll();
        closeAllDropdowns();
      }
      return;
    }

    // Audio quality
    const audioItem = target.closest('[data-audio-quality]') as HTMLElement;
    if (audioItem) {
      const value = audioItem.dataset.audioQuality;
      if (value) {
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
        refreshAll();
        closeAllDropdowns();
      }
    }
  });
}

// ==========================================
// Utility Functions
// ==========================================

function closeAllDropdowns(): void {
  // Close format dropdown
  const formatDropdown = document.getElementById('formatDropdownMenu');
  const formatBtn = document.getElementById('formatDropdownBtn');
  if (formatDropdown) formatDropdown.classList.remove('show');
  if (formatBtn) formatBtn.classList.remove('active');

  // Close settings dropdown
  const settingsDropdown = document.getElementById('settingsDropdown');
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsDropdown) settingsDropdown.classList.remove('show');
  if (settingsBtn) settingsBtn.classList.remove('active');
}

function refreshAll(): void {
  // Refresh format dropdown
  const formatContainer = document.getElementById('format-selector-container');
  if (formatContainer) {
    formatContainer.innerHTML = renderFormatDropdown();
    initFormatDropdown();
  }

  // Refresh quality selector
  const qualityContainer = document.getElementById('quality-selector-container');
  if (qualityContainer) {
    qualityContainer.innerHTML = renderQualitySelector();
    initQualitySelector();
  }
}

// Click outside to close
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const isInsideFormat = target.closest('#format-selector-container');
  const isInsideQuality = target.closest('#quality-selector-container');

  if (!isInsideFormat && !isInsideQuality) {
    closeAllDropdowns();
  }
});

// ==========================================
// Legacy exports for compatibility
// ==========================================

export function initFormatSelector(): void {
  initFormatDropdown();
  initQualitySelector();
}

export function cleanupFormatSelector(): void {
  // No cleanup needed
}
