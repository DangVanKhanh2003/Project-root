/**
 * Preferences Sync Utilities
 * Centralized logic for syncing user preferences from localStorage to UI
 */

import { STORAGE_KEYS } from './storage-keys';

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
    const preferencesJson = localStorage.getItem(STORAGE_KEYS.FORMAT_PREFERENCES);
    if (preferencesJson) {
      return JSON.parse(preferencesJson);
    }
  } catch (error) {
    console.error('Error reading format preferences:', error);
  }
  return null;
}

/**
 * Sync format preferences to select elements
 * Note: data-format attribute is set by inline script in <head> to prevent FOUC
 * This function only syncs the select dropdowns after DOM is ready
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
 * Note: data-auto-submit attribute is set by inline script in <head> to prevent FOUC
 * This function only syncs the checkbox.checked state after DOM is ready
 */
export function syncAutoSubmitCheckbox(): void {
  try {
    const autoSubmitValue = localStorage.getItem(STORAGE_KEYS.AUTO_SUBMIT);
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
