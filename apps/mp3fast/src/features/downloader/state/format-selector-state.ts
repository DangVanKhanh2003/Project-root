/**
 * Format Selector State Management
 * Manages MP3/MP4 format and quality selection with localStorage persistence
 */

import { setState, getState } from './state-manager';
import type { FormatType, AudioFormatType } from './types';

// ==========================================
// Constants
// ==========================================

const STORAGE_KEY = 'mp3fast_format_preferences';

export const QUALITY_OPTIONS = {
  mp4: {
    formats: ['mp4', 'webm', 'mkv'] as const,
    qualities: ['2160p', '1440p', '1080p', '720p', '480p', '360p', '144p'] as const
  },
  mp3: {
    formats: ['mp3', 'wav', 'm4a', 'opus', 'ogg', 'flac'] as AudioFormatType[],
    bitrates: ['320', '192', '128', '64'] as const
  }
} as const;

export const BITRATE_OPTIONS = QUALITY_OPTIONS.mp3.bitrates;

// ==========================================
// LocalStorage Types
// ==========================================

interface StoredPreferences {
  selectedFormat: FormatType;
  videoQuality: string;
  audioFormat: AudioFormatType;
  audioBitrate: string;
  timestamp: number;
}

// ==========================================
// LocalStorage Operations
// ==========================================

/**
 * Save format preferences to localStorage
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
 */
function loadFormatPreferences(): StoredPreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const preferences = JSON.parse(stored) as StoredPreferences;

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
 * Priority: localStorage > Default (mp3, 128kbps)
 */
export function initializeFormatSelector(): void {
  const stored = loadFormatPreferences();

  if (stored) {
    setState({
      selectedFormat: stored.selectedFormat,
      videoQuality: stored.videoQuality || '720p',
      audioFormat: stored.audioFormat || 'mp3',
      audioBitrate: stored.audioBitrate || '128',
      hasUserSelectedFormat: true
    });
  } else {
    setState({
      selectedFormat: 'mp3',
      videoQuality: '720p',
      audioFormat: 'mp3',
      audioBitrate: '128',
      hasUserSelectedFormat: false
    });
  }
}

// ==========================================
// State Setters
// ==========================================

/**
 * Change format (mp3 ↔ mp4)
 */
export function setSelectedFormat(format: FormatType): void {
  setState({
    selectedFormat: format,
    hasUserSelectedFormat: true
  });
  saveFormatPreferences();
}

/**
 * Set video quality (for MP4)
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
  saveFormatPreferences();
}

/**
 * Set audio format (for MP3 mode)
 */
export function setAudioFormat(format: string): void {
  const audioFormats = QUALITY_OPTIONS.mp3.formats as readonly string[];
  if (!audioFormats.includes(format)) {
    console.warn(`Invalid audio format: ${format}, defaulting to 'mp3'`);
    format = 'mp3';
  }

  setState({
    audioFormat: format as AudioFormatType,
    hasUserSelectedFormat: true
  });
  saveFormatPreferences();
}

/**
 * Set audio bitrate (for MP3 mode)
 */
export function setAudioBitrate(bitrate: string): void {
  if (!BITRATE_OPTIONS.includes(bitrate as any)) {
    console.warn(`Invalid audio bitrate: ${bitrate}`);
    return;
  }

  setState({
    audioBitrate: bitrate,
    hasUserSelectedFormat: true
  });
  saveFormatPreferences();
}

/**
 * Combined setter for audio (format + bitrate)
 */
export function setAudioOptions(format: string, bitrate: string): void {
  const audioFormats = QUALITY_OPTIONS.mp3.formats as readonly string[];
  if (!audioFormats.includes(format)) {
    console.warn(`Invalid audio format: ${format}, defaulting to 'mp3'`);
    format = 'mp3';
  }

  if (bitrate && !BITRATE_OPTIONS.includes(bitrate as any)) {
    console.warn(`Invalid audio bitrate: ${bitrate}`);
    bitrate = '';
  }

  setState({
    audioFormat: format as AudioFormatType,
    audioBitrate: bitrate,
    hasUserSelectedFormat: true
  });
  saveFormatPreferences();
}

// ==========================================
// Getters
// ==========================================

/**
 * Get current quality label
 */
export function getCurrentQualityLabel(): string {
  const state = getState();
  if (state.selectedFormat === 'mp4') {
    return state.videoQuality || 'Select quality';
  }
  return state.audioBitrate ? `${state.audioBitrate}kbps` : 'Select quality';
}

/**
 * Get available bitrate options (for backward compatibility)
 */
export function getAvailableBitrates(): readonly string[] {
  return BITRATE_OPTIONS;
}
