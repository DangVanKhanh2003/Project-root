/**
 * Preferences Sync Utilities
 * Centralized logic for syncing user preferences from localStorage to UI
 */

export interface FormatPreferences {
  selectedFormat: 'mp4' | 'mp3';
  videoQuality?: string;
  audioBitrate?: string;
  audioFormat?: string;
}

/**
 * Get format preferences from localStorage
 */
export function getFormatPreferences(): FormatPreferences | null {
  try {
    const preferencesJson = localStorage.getItem('y2mate_format_preferences');
    if (preferencesJson) {
      return JSON.parse(preferencesJson);
    }
  } catch (error) {
    console.error('Error reading format preferences:', error);
  }
  return null;
}

/**
 * Set format dataset attribute on document element (prevents FOUC)
 * This should run as early as possible in <head>
 */
export function setFormatDataset(): void {
  const preferences = getFormatPreferences();
  const format = preferences?.selectedFormat || 'mp4';
  document.documentElement.dataset.format = format;
}

/**
 * Sync format preferences to select elements
 * This runs after DOM is ready
 */
export function syncFormatSelectors(): void {
  try {
    const preferences = getFormatPreferences();
    if (!preferences) return;

    const selectElement = preferences.selectedFormat === 'mp4'
      ? document.getElementById('quality-select-mp4')
      : document.getElementById('quality-select-mp3');

    if (selectElement && selectElement instanceof HTMLSelectElement) {
      let value: string;

      if (preferences.selectedFormat === 'mp4') {
        const videoQuality = preferences.videoQuality || '720p';
        value = (videoQuality === 'webm' || videoQuality === 'mkv')
          ? videoQuality
          : `mp4-${videoQuality.replace('p', '')}`;
      } else {
        const audioFormat = preferences.audioFormat || 'mp3';
        value = (audioFormat === 'mp3')
          ? `mp3-${preferences.audioBitrate || '128'}`
          : audioFormat;
      }

      selectElement.value = value;
    }
  } catch (error) {
    console.error('Error syncing format selectors:', error);
  }
}

/**
 * Sync auto-submit checkbox state
 */
export function syncAutoSubmitCheckbox(): void {
  try {
    const autoSubmitValue = localStorage.getItem('y2mate_auto_submit');
    const checkbox = document.getElementById('auto-submit-checkbox');

    if (checkbox && checkbox instanceof HTMLInputElement) {
      checkbox.checked = autoSubmitValue === 'true';
    }
  } catch (error) {
    console.error('Error syncing auto-submit checkbox:', error);
  }
}

/**
 * Initialize all preference syncs
 * Call this after DOM is ready
 */
export function initPreferencesSync(): void {
  syncFormatSelectors();
  syncAutoSubmitCheckbox();
}
