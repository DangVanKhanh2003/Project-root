/**
 * History Card Integration
 * ---------------------------------------------------------
 * Integrates @downloader/history package with the app
 */

import {
  initHistoryUI,
  registerApplyHandlers,
  type ApplyHistoryHandlers
} from '@downloader/history';

import {
  setSelectedFormat,
  setVideoQuality,
  setAudioBitrate,
  setAudioFormat
} from '../downloader/state/format-selector-state';

// CSS is imported via index.css using relative path

/**
 * Set URL in the input field and dispatch input event
 */
function setUrl(url: string): void {
  const input = document.getElementById('videoUrl') as HTMLInputElement;
  if (input) {
    input.value = url;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/**
 * Set format (mp3/mp4)
 */
function setFormat(format: 'mp3' | 'mp4'): void {
  setSelectedFormat(format);
}

/**
 * Trigger form submission
 */
function triggerConvert(): void {
  const form = document.getElementById('downloadForm') as HTMLFormElement;
  if (form) {
    form.requestSubmit();
  }
}

/**
 * Scroll to the converter section
 */
function scrollToConverter(): void {
  const converter = document.getElementById('downloadForm');
  if (converter) {
    converter.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Apply handlers configuration
 */
const applyHandlers: ApplyHistoryHandlers = {
  setUrl,
  setFormat,
  setVideoQuality,
  setAudioBitrate,
  setAudioFormat,
  triggerConvert,
  scrollToConverter
};

/**
 * Initialize history card
 */
export function initHistoryCard(): void {
  // Register apply handlers first
  registerApplyHandlers(applyHandlers);

  // Initialize history UI
  initHistoryUI('#history-card-container', {
    initialCount: 5,
    loadMoreCount: 10,
    maxStorageItems: 100,
    storageKey: 'downloader_history'
  });

  console.log('[History] History card initialized');
}
