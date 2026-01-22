/**
 * Format Selector State Management (UNIFIED DROPDOWN)
 * Manages unified format/quality selection with localStorage persistence
 */

import { setState, getState } from './state-manager';
import type { FormatType, AudioFormatType, ParsedSelection, DownloadMode } from './types';

// ==========================================
// Constants
// ==========================================

const STORAGE_KEY = 'y2mate_format_preferences';
const STORAGE_VERSION = 2;

// App default (fallback): 4K video
const APP_DEFAULT = 'video|mp4-2160';

/**
 * Page-specific default values based on URL
 * Maps page URL patterns to unified selection value
 */
const PAGE_DEFAULTS: Record<string, string> = {
  // Main pages
  'youtube-to-mp3': 'audio|mp3-128',
  'youtube-to-mp4': 'video|mp4-2160',
  // Audio format converter pages
  'youtube-to-wav-converter': 'audio|wav',
  'youtube-to-m4a-converter': 'audio|m4a',
  'youtube-to-opus-converter': 'audio|opus',
  'youtube-to-ogg-converter': 'audio|ogg',
  'youtube-to-flac-converter': 'audio|flac',
  'youtube-to-mp3-320kbps-converter': 'audio|mp3-320',
};

/**
 * Available quality options for unified dropdown
 */
export const UNIFIED_OPTIONS = {
  video: [
    { value: 'video|mp4-2160', label: 'MP4 - 4K' },
    { value: 'video|mp4-1440', label: 'MP4 - 2K' },
    { value: 'video|mp4-1080', label: 'MP4 - 1080p' },
    { value: 'video|mp4-720', label: 'MP4 - 720p' },
    { value: 'video|mp4-480', label: 'MP4 - 480p' },
    { value: 'video|mp4-360', label: 'MP4 - 360p' },
    { value: 'video|mp4-240', label: 'MP4 - 240p' },
    { value: 'video|mp4-144', label: 'MP4 - 144p' },
    { value: 'video|webm', label: 'WEBM' },
    { value: 'video|mkv', label: 'MKV' },
  ],
  audio: [
    { value: 'audio|mp3-320', label: 'MP3 - 320kbps' },
    { value: 'audio|mp3-256', label: 'MP3 - 256kbps' },
    { value: 'audio|mp3-128', label: 'MP3 - 128kbps' },
    { value: 'audio|mp3-64', label: 'MP3 - 64kbps' },
    { value: 'audio|flac', label: 'FLAC' },
    { value: 'audio|wav', label: 'WAV' },
    { value: 'audio|m4a', label: 'M4A' },
    { value: 'audio|opus', label: 'Opus' },
    { value: 'audio|ogg', label: 'OGG' },
  ],
} as const;

// Legacy QUALITY_OPTIONS - kept for backward compatibility
export const QUALITY_OPTIONS = {
  mp4: {
    formats: ['mp4', 'webm', 'mkv'] as const,
    qualities: ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'] as const
  },
  mp3: {
    formats: ['mp3', 'wav', 'm4a', 'opus', 'ogg', 'flac'] as AudioFormatType[],
    bitrates: ['320', '256', '128', '64']
  }
} as const;

// ==========================================
// LocalStorage Types
// ==========================================

interface StoredPreferencesV2 {
  unifiedSelection: string;
  version: 2;
  timestamp: number;
}

// Legacy V1 format
interface StoredPreferencesV1 {
  selectedFormat: FormatType;
  videoQuality: string;
  audioFormat: AudioFormatType;
  audioBitrate: string;
  timestamp: number;
}

// ==========================================
// Parsing Functions
// ==========================================

/**
 * Parse unified selection value into components
 * @param value - e.g., "video|mp4-720", "audio|mp3-128", "audio|wav"
 */
export function parseUnifiedSelection(value: string): ParsedSelection {
  const [mode, rest] = value.split('|') as [DownloadMode, string];

  if (mode === 'video') {
    if (rest === 'webm' || rest === 'mkv') {
      return { mode: 'video', format: rest };
    }
    const [format, quality] = rest.split('-');
    return { mode: 'video', format, quality };
  }

  // Audio
  if (rest.startsWith('mp3-')) {
    const [format, bitrate] = rest.split('-');
    return { mode: 'audio', format, bitrate };
  }
  return { mode: 'audio', format: rest };
}

/**
 * Build legacy state fields from unified selection
 * Used for backward compatibility with existing code
 */
function buildLegacyState(unifiedSelection: string): {
  selectedFormat: FormatType;
  videoQuality: string;
  audioFormat: AudioFormatType;
  audioBitrate: string;
} {
  const parsed = parseUnifiedSelection(unifiedSelection);

  if (parsed.mode === 'video') {
    return {
      selectedFormat: 'mp4',
      videoQuality: parsed.quality ? `${parsed.quality}p` : parsed.format,
      audioFormat: 'mp3',
      audioBitrate: '128',
    };
  }

  return {
    selectedFormat: 'mp3',
    videoQuality: '720p',
    audioFormat: parsed.format as AudioFormatType,
    audioBitrate: parsed.bitrate || '',
  };
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
 * Get page-specific default unified selection
 */
function getPageDefault(): string {
  const page = getCurrentPage();
  return PAGE_DEFAULTS[page] || APP_DEFAULT;
}

// ==========================================
// Migration Functions
// ==========================================

/**
 * Migrate V1 preferences to V2 unified format
 */
function migrateV1ToV2(v1: StoredPreferencesV1): string {
  if (v1.selectedFormat === 'mp4') {
    const quality = v1.videoQuality?.replace('p', '') || '720';
    if (quality === 'webm' || quality === 'mkv') {
      return `video|${quality}`;
    }
    return `video|mp4-${quality}`;
  }

  // Audio
  const format = v1.audioFormat || 'mp3';
  if (format === 'mp3') {
    const bitrate = v1.audioBitrate || '128';
    return `audio|mp3-${bitrate}`;
  }
  return `audio|${format}`;
}

// ==========================================
// LocalStorage Operations
// ==========================================

/**
 * Save unified selection to localStorage (V2 format)
 */
export function saveFormatPreferences(): void {
  try {
    const state = getState();
    const preferences: StoredPreferencesV2 = {
      unifiedSelection: state.unifiedSelection,
      version: STORAGE_VERSION,
      timestamp: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (err) {
    console.warn('Failed to save format preferences:', err);
  }
}

/**
 * Load format preferences from localStorage
 * Handles migration from V1 to V2
 */
function loadFormatPreferences(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const preferences = JSON.parse(stored);

    // Check if V2 format
    if (preferences.version === 2 && preferences.unifiedSelection) {
      return preferences.unifiedSelection;
    }

    // Detect V1 by presence of selectedFormat field
    if (preferences.selectedFormat) {
      const migrated = migrateV1ToV2(preferences as StoredPreferencesV1);
      // Save migrated preferences
      const v2Prefs: StoredPreferencesV2 = {
        unifiedSelection: migrated,
        version: STORAGE_VERSION,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v2Prefs));
      return migrated;
    }

    return null;
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
  const pageDefault = getPageDefault();

  const unifiedSelection = stored || pageDefault;
  const legacyState = buildLegacyState(unifiedSelection);

  setState({
    unifiedSelection,
    ...legacyState,
    hasUserSelectedFormat: !!stored,
  });
}

// ==========================================
// State Setters
// ==========================================

/**
 * Set unified selection (primary setter)
 * Updates both unified and legacy state fields
 */
export function setUnifiedSelection(value: string): void {
  const legacyState = buildLegacyState(value);

  setState({
    unifiedSelection: value,
    ...legacyState,
    hasUserSelectedFormat: true,
  });

  // Update data-format attribute on <html> for CSS
  const parsed = parseUnifiedSelection(value);
  document.documentElement.dataset.format = parsed.mode === 'video' ? 'mp4' : 'mp3';

  // Auto-save to localStorage
  saveFormatPreferences();
}

// ==========================================
// Legacy Setters (backward compatibility)
// ==========================================

/**
 * Change format (mp3 ↔ mp4) - Legacy
 * @deprecated Use setUnifiedSelection instead
 */
export function setSelectedFormat(format: FormatType): void {
  const state = getState();
  let newUnified: string;

  if (format === 'mp4') {
    // Switch to video, keep previous video quality or default to 4K
    const videoQuality = state.videoQuality?.replace('p', '') || '2160';
    if (videoQuality === 'webm' || videoQuality === 'mkv') {
      newUnified = `video|${videoQuality}`;
    } else {
      newUnified = `video|mp4-${videoQuality}`;
    }
  } else {
    // Switch to audio
    if (state.audioFormat === 'mp3') {
      newUnified = `audio|mp3-${state.audioBitrate || '128'}`;
    } else {
      newUnified = `audio|${state.audioFormat}`;
    }
  }

  setUnifiedSelection(newUnified);
}

/**
 * Set video quality - Legacy
 * @deprecated Use setUnifiedSelection instead
 */
export function setVideoQuality(quality: string): void {
  const resolution = quality.replace('p', '');
  let newUnified: string;

  if (resolution === 'webm' || resolution === 'mkv') {
    newUnified = `video|${resolution}`;
  } else {
    newUnified = `video|mp4-${resolution}`;
  }

  setUnifiedSelection(newUnified);
}

/**
 * Set audio format - Legacy
 * @deprecated Use setUnifiedSelection instead
 */
export function setAudioFormat(format: AudioFormatType): void {
  const state = getState();
  let newUnified: string;

  if (format === 'mp3') {
    newUnified = `audio|mp3-${state.audioBitrate || '128'}`;
  } else {
    newUnified = `audio|${format}`;
  }

  setUnifiedSelection(newUnified);
}

/**
 * Set audio bitrate - Legacy
 * @deprecated Use setUnifiedSelection instead
 */
export function setAudioBitrate(bitrate: string): void {
  setUnifiedSelection(`audio|mp3-${bitrate}`);
}

/**
 * Combined setter for audio - Legacy
 * @deprecated Use setUnifiedSelection instead
 */
export function setAudioOptions(format: AudioFormatType, bitrate: string): void {
  let newUnified: string;

  if (format === 'mp3') {
    newUnified = `audio|mp3-${bitrate}`;
  } else {
    newUnified = `audio|${format}`;
  }

  setUnifiedSelection(newUnified);
}

// ==========================================
// Validation
// ==========================================

/**
 * Validate if current unified selection is valid
 */
export function validateFormatSelection(): { isValid: boolean; message?: string } {
  const state = getState();

  if (!state.unifiedSelection) {
    return { isValid: false, message: 'Please select a format' };
  }

  const parsed = parseUnifiedSelection(state.unifiedSelection);

  if (!parsed.mode || !parsed.format) {
    return { isValid: false, message: 'Invalid format selection' };
  }

  return { isValid: true };
}

/**
 * Get current quality selection as user-friendly string
 */
export function getCurrentQualityLabel(): string {
  const state = getState();
  const parsed = parseUnifiedSelection(state.unifiedSelection);

  if (parsed.mode === 'video') {
    if (parsed.quality) {
      return `MP4 - ${parsed.quality}p`;
    }
    return parsed.format.toUpperCase();
  }

  // Audio
  if (parsed.format === 'mp3' && parsed.bitrate) {
    return `MP3 - ${parsed.bitrate}kbps`;
  }
  return parsed.format.toUpperCase();
}

// ==========================================
// Getters
// ==========================================

/**
 * Get all unified options (for dropdown)
 */
export function getUnifiedOptions() {
  return UNIFIED_OPTIONS;
}

/**
 * Get available quality options based on current format - Legacy
 */
export function getAvailableQualities(): { formats: readonly string[]; qualities: readonly string[] } | { formats: readonly AudioFormatType[]; bitrates: readonly string[] } {
  const state = getState();

  if (state.selectedFormat === 'mp4') {
    return QUALITY_OPTIONS.mp4;
  } else {
    return QUALITY_OPTIONS.mp3;
  }
}
