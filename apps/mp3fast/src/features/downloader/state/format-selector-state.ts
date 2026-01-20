/**
 * Format Selector State Management
 * Manages MP3 bitrate selection with localStorage persistence
 * Auto format = MP3 (no format selection needed)
 */

import { setState, getState } from './state-manager';

// ==========================================
// Constants
// ==========================================

const STORAGE_KEY = 'y2mate_format_preferences';

/**
 * Available MP3 bitrate options
 */
export const BITRATE_OPTIONS = ['320', '192', '128', '64'] as const;

/**
 * Default bitrate
 */
const DEFAULT_BITRATE = '128';

// ==========================================
// LocalStorage Types
// ==========================================

interface StoredPreferences {
  audioFormat: string;
  audioBitrate: string;
  timestamp: number;
}

// ==========================================
// LocalStorage Operations
// ==========================================

/**
 * Save bitrate preference to localStorage
 */
export function saveFormatPreferences(): void {
  try {
    const state = getState();
    const preferences: StoredPreferences = {
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
 * Valid audio formats for mp3fast
 */
const AUDIO_FORMATS = ['mp3', 'wav', 'm4a', 'opus', 'ogg', 'flac'] as const;
type AudioFormat = typeof AUDIO_FORMATS[number];

/**
 * Load format preferences from localStorage
 * Returns null if no preferences found or invalid
 */
function loadFormatPreferences(): StoredPreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const preferences = JSON.parse(stored) as StoredPreferences;

    // Validate audioFormat - default to 'mp3' if invalid
    if (!preferences.audioFormat || !AUDIO_FORMATS.includes(preferences.audioFormat as AudioFormat)) {
      preferences.audioFormat = 'mp3';
    }

    // Validate audioBitrate - default to DEFAULT_BITRATE if invalid
    if (!preferences.audioBitrate || !BITRATE_OPTIONS.includes(preferences.audioBitrate as any)) {
      preferences.audioBitrate = DEFAULT_BITRATE;
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
    // Use stored format and bitrate preferences
    // selectedFormat is always 'mp3' (audio mode) for this app
    setState({
      selectedFormat: 'mp3',
      audioFormat: stored.audioFormat as AudioFormat,
      audioBitrate: stored.audioBitrate,
      hasUserSelectedFormat: true
    });
  } else {
    // Use defaults
    setState({
      selectedFormat: 'mp3',
      audioFormat: 'mp3',
      audioBitrate: DEFAULT_BITRATE,
      hasUserSelectedFormat: false
    });
  }
}

// ==========================================
// State Setters
// ==========================================

/**
 * Set audio format
 * Supports: mp3, wav, m4a, opus, ogg, flac
 */
export function setAudioFormat(format: string): void {
  // Validate format
  if (!AUDIO_FORMATS.includes(format as AudioFormat)) {
    console.warn(`Invalid audio format: ${format}, defaulting to 'mp3'`);
    format = 'mp3';
  }

  setState({
    audioFormat: format as AudioFormat,
    hasUserSelectedFormat: true
  });

  // Auto-save to localStorage
  saveFormatPreferences();
}

/**
 * Set audio bitrate (MP3)
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

  // Auto-save to localStorage
  saveFormatPreferences();
}

/**
 * Combined setter for audio (format + bitrate)
 * More efficient when setting both at once
 * Matches ytmp3.my API for consistency
 */
export function setAudioOptions(format: string, bitrate: string): void {
  // Validate format
  if (!AUDIO_FORMATS.includes(format as AudioFormat)) {
    console.warn(`Invalid audio format: ${format}, defaulting to 'mp3'`);
    format = 'mp3';
  }

  // Bitrate is optional for non-MP3 formats
  if (bitrate && !BITRATE_OPTIONS.includes(bitrate as any)) {
    console.warn(`Invalid audio bitrate: ${bitrate}`);
    bitrate = '';
  }

  setState({
    audioFormat: format as AudioFormat,
    audioBitrate: bitrate,
    hasUserSelectedFormat: true
  });

  // Auto-save to localStorage
  saveFormatPreferences();
}

// ==========================================
// Getters
// ==========================================

/**
 * Get current bitrate label
 */
export function getCurrentQualityLabel(): string {
  const state = getState();
  return state.audioBitrate ? `${state.audioBitrate}kbps` : 'Select quality';
}

/**
 * Get available bitrate options
 */
export function getAvailableBitrates(): readonly string[] {
  return BITRATE_OPTIONS;
}

