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
      audioBitrate: state.audioBitrate,
      timestamp: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (err) {
    console.warn('Failed to save format preferences:', err);
  }
}

/**
 * Load bitrate preference from localStorage
 * Returns null if no preferences found or invalid
 */
function loadFormatPreferences(): StoredPreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const preferences = JSON.parse(stored) as StoredPreferences;

    // Validate stored data - check audioBitrate is valid
    if (!preferences.audioBitrate || !BITRATE_OPTIONS.includes(preferences.audioBitrate as any)) {
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
 * Priority: localStorage > Default (128kbps)
 * Always sets format to MP3
 */
export function initializeFormatSelector(): void {
  const stored = loadFormatPreferences();

  if (stored) {
    // Use stored bitrate preference
    setState({
      selectedFormat: 'mp3',
      audioFormat: 'mp3',
      audioBitrate: stored.audioBitrate,
      hasUserSelectedFormat: true
    });
  } else {
    // Use default bitrate
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

