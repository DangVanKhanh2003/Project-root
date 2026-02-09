/**
 * Format Selector State Management
 * Manages format/quality selection with localStorage persistence
 */

import { setState, getState } from './state-manager';
import type { FormatType, AudioFormatType } from './types';

// ==========================================
// Constants
// ==========================================

const STORAGE_KEY = 'ssvid_format_preferences';

/**
 * Available quality options for each format
 */
export const QUALITY_OPTIONS = {
  mp4: {
    formats: ['mp4', 'webm', 'mkv'] as const,
    qualities: ['1080p', '720p', '480p', '360p', '144p'] as const
  },
  mp3: {
    formats: ['mp3', 'wav', 'm4a', 'opus', 'ogg', 'flac'] as AudioFormatType[],
    bitrates: ['320', '192', '128', '64'] // Only for MP3
  }
} as const;

/**
 * Page-specific default values based on URL
 * Maps page URL patterns to default format/quality
 * Note: audioBitrate is only used for MP3, empty for other formats
 */
const PAGE_DEFAULTS: Record<string, { format: FormatType; videoQuality?: string; audioFormat?: AudioFormatType; audioBitrate?: string }> = {
  // Main pages
  'youtube-to-mp3': { format: 'mp3', audioFormat: 'mp3', audioBitrate: '128' },
  'youtube-to-mp4': { format: 'mp4', videoQuality: '720p' },
  // Audio format converter pages (non-MP3 formats don't have bitrate)
  'youtube-to-wav-converter': { format: 'mp3', audioFormat: 'wav', audioBitrate: '' },
  'youtube-to-m4a-converter': { format: 'mp3', audioFormat: 'm4a', audioBitrate: '' },
  'youtube-to-opus-converter': { format: 'mp3', audioFormat: 'opus', audioBitrate: '' },
  'youtube-to-ogg-converter': { format: 'mp3', audioFormat: 'ogg', audioBitrate: '' },
  'youtube-to-flac-converter': { format: 'mp3', audioFormat: 'flac', audioBitrate: '' },
  'youtube-to-mp3-320kbps-converter': { format: 'mp3', audioFormat: 'mp3', audioBitrate: '320' },
};

// ==========================================
// LocalStorage Types
// ==========================================

interface StoredPreferences {
  selectedFormat: FormatType;
  videoQuality: string;
  audioFormat: AudioFormatType;
  audioBitrate: string;
  timestamp: number; // For potential expiration logic
}

// ==========================================
// Page Detection
// ==========================================

/**
 * Get current page identifier from URL
 */
function getCurrentPage(): string {
  const pathname = window.location.pathname;
  const pageName = pathname.split('/').pop()?.replace('.html', '') || '';
  return pageName;
}

/**
 * Get page-specific defaults based on current URL
 */
function getPageDefaults(): { format: FormatType; videoQuality: string; audioFormat: AudioFormatType; audioBitrate: string } {
  const page = getCurrentPage();
  const defaults = PAGE_DEFAULTS[page];

  if (defaults) {
    return {
      format: defaults.format,
      videoQuality: defaults.videoQuality || '',
      audioFormat: defaults.audioFormat || 'mp3',
      audioBitrate: defaults.audioBitrate || ''
    };
  }

  // Fallback defaults (App-level defaults)
  // IMPORTANT: Must match HTML defaults to prevent FOUC
  return {
    format: 'mp4',
    videoQuality: '720p',
    audioFormat: 'mp3',
    audioBitrate: '128'
  };
}

// ==========================================
// LocalStorage Operations
// ==========================================

/**
 * Save format preferences to localStorage
 * Only called after successful format selection with valid URL
 */
export function saveFormatPreferences(): void {
  try {
    const state = getState();
    const preferences: StoredPreferences = {
      selectedFormat: state.selectedFormat,
      videoQuality: state.videoQuality,
      audioFormat: state.audioFormat,
      audioBitrate: state.audioBitrate,
      timestamp: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (err) {
    console.warn('Failed to save format preferences:', err);
  }
}

/**
 * Load format preferences from localStorage
 * Returns null if no preferences found or invalid
 */
function loadFormatPreferences(): StoredPreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const preferences = JSON.parse(stored) as StoredPreferences;

    // Validate stored data
    if (!preferences.selectedFormat ||
      (preferences.selectedFormat !== 'mp3' && preferences.selectedFormat !== 'mp4')) {
      return null;
    }

    return preferences;
  } catch (err) {
    console.warn('Failed to load format preferences:', err);
    return null;
  }
}

/**
 * Clear format preferences from localStorage
 */
export function clearFormatPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear format preferences:', err);
  }
}

// ==========================================
// Initialization
// ==========================================

/**
 * Initialize format selector state on page load
 * Priority: localStorage > Page defaults > App defaults
 */
export function initializeFormatSelector(): void {
  const stored = loadFormatPreferences();
  const pageDefaults = getPageDefaults();

  if (stored) {
    // Use stored preferences (user has used the app before)
    setState({
      selectedFormat: stored.selectedFormat,
      videoQuality: stored.videoQuality,
      audioFormat: stored.audioFormat,
      audioBitrate: stored.audioBitrate,
      hasUserSelectedFormat: true
    });
  } else {
    // Use page-specific defaults (first time or cleared)
    setState({
      selectedFormat: pageDefaults.format,
      videoQuality: pageDefaults.videoQuality,
      audioFormat: pageDefaults.audioFormat,
      audioBitrate: pageDefaults.audioBitrate,
      hasUserSelectedFormat: false
    });
  }
}

// ==========================================
// State Setters
// ==========================================

/**
 * Change format (mp3 ↔ mp4)
 * Triggers quality dropdown re-render
 */
export function setSelectedFormat(format: FormatType): void {
  const state = getState();

  setState({
    selectedFormat: format,
    hasUserSelectedFormat: true
  });

  // Clear quality if switching format type to force user selection
  if (format === 'mp4' && !state.videoQuality) {
    setState({ videoQuality: '' });
  } else if (format === 'mp3' && !state.audioBitrate) {
    setState({ audioBitrate: '' });
  }

  // Auto-save to localStorage after format change
  saveFormatPreferences();
}

/**
 * Set video quality (for MP4 format)
 * Accepts: resolution (e.g., "720p") or format (e.g., "webm", "mkv")
 */
export function setVideoQuality(quality: string): void {
  const isValidQuality = QUALITY_OPTIONS.mp4.qualities.includes(quality as any);
  const isValidFormat = QUALITY_OPTIONS.mp4.formats.includes(quality as any);

  if (!isValidQuality && !isValidFormat) {
    console.warn(`Invalid video quality: ${quality}`);
    return;
  }

  setState({
    videoQuality: quality,
    hasUserSelectedFormat: true
  });

  // Auto-save to localStorage
  saveFormatPreferences();
}

/**
 * Set audio format (for MP3 mode)
 */
export function setAudioFormat(format: AudioFormatType): void {
  if (!QUALITY_OPTIONS.mp3.formats.includes(format)) {
    console.warn(`Invalid audio format: ${format}`);
    return;
  }

  setState({
    audioFormat: format,
    hasUserSelectedFormat: true
  });

  // Auto-save to localStorage
  saveFormatPreferences();
}

/**
 * Set audio bitrate (for MP3 mode)
 */
export function setAudioBitrate(bitrate: string): void {
  if (!QUALITY_OPTIONS.mp3.bitrates.includes(bitrate as any)) {
    console.warn(`Invalid audio bitrate: ${bitrate}`);
    return;
  }

  setState({
    audioBitrate: bitrate,
    hasUserSelectedFormat: true
  });

  // Auto-save to localStorage
  saveFormatPreferences();
}

/**
 * Combined setter for audio (format + bitrate)
 * More efficient when setting both at once
 */
export function setAudioOptions(format: AudioFormatType, bitrate: string): void {
  if (!QUALITY_OPTIONS.mp3.formats.includes(format)) {
    console.warn(`Invalid audio format: ${format}`);
    return;
  }

  if (!QUALITY_OPTIONS.mp3.bitrates.includes(bitrate as any)) {
    console.warn(`Invalid audio bitrate: ${bitrate}`);
    return;
  }

  setState({
    audioFormat: format,
    audioBitrate: bitrate,
    hasUserSelectedFormat: true
  });

  // Auto-save to localStorage
  saveFormatPreferences();
}

// ==========================================
// Validation
// ==========================================

/**
 * Validate if current format selection is complete
 * Used before allowing form submission
 */
export function validateFormatSelection(): { isValid: boolean; message?: string } {
  const state = getState();

  if (state.selectedFormat === 'mp4') {
    if (!state.videoQuality) {
      return { isValid: false, message: 'Please select a video quality' };
    }
  } else if (state.selectedFormat === 'mp3') {
    if (!state.audioFormat) {
      return { isValid: false, message: 'Please select an audio format' };
    }
    if (!state.audioBitrate) {
      return { isValid: false, message: 'Please select an audio bitrate' };
    }
  }

  return { isValid: true };
}

/**
 * Get current quality selection as user-friendly string
 */
export function getCurrentQualityLabel(): string {
  const state = getState();

  if (state.selectedFormat === 'mp4') {
    return state.videoQuality || 'Select quality';
  } else {
    const format = state.audioFormat.toUpperCase();
    const bitrate = state.audioBitrate ? `${state.audioBitrate}kbps` : 'Select quality';
    return state.audioBitrate ? `${format} - ${bitrate}` : bitrate;
  }
}

// ==========================================
// Getters
// ==========================================

/**
 * Get available quality options based on current format
 */
export function getAvailableQualities(): { formats: readonly string[]; qualities: readonly string[] } | { formats: readonly AudioFormatType[]; bitrates: readonly string[] } {
  const state = getState();

  if (state.selectedFormat === 'mp4') {
    return QUALITY_OPTIONS.mp4;
  } else {
    return QUALITY_OPTIONS.mp3;
  }
}

