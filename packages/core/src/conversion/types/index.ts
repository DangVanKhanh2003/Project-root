/**
 * Conversion Types
 *
 * All conversion-related types, enums, and utilities.
 * Extracted from apps to @downloader/core for reusability.
 */

import { isIOS, isWindows } from '../../utils/platform-detection';

// ============================================================
// ENUMS
// ============================================================

/**
 * Task State - Lowercase values (standardized)
 */
export enum TaskState {
  IDLE = 'idle',
  EXTRACTING = 'extracting',
  PROCESSING = 'processing',
  POLLING = 'polling',
  DOWNLOADING = 'downloading',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

/**
 * Route Type - Strategy routing decisions
 */
export enum RouteType {
  STATIC_DIRECT = 'static_direct',       // Static file, direct download
  IOS_RAM = 'ios_ram',                   // iOS RAM download (audio ≤150MB)
  IOS_POLLING = 'ios_polling',           // iOS server-side processing
  WINDOWS_MP4_POLLING = 'windows_mp4_polling',  // Windows MP4 polling
  OTHER_STREAM = 'other_stream'          // Other platforms, direct stream
}

/**
 * File Format - Supported formats
 */
export enum FileFormat {
  MP4 = 'mp4',
  WEBM = 'webm',
  MP3 = 'mp3',
  WAV = 'wav',
  OPUS = 'opus',
  OGG = 'ogg',
  M4A = 'm4a'
}

// ============================================================
// INTERFACES
// ============================================================

/**
 * Extract Result - Result from API extract call
 */
export interface ExtractResult {
  url: string;                     // Download URL
  filename: string | null;         // Filename (if available)
  size: number | null;             // File size in bytes
  status: 'static' | 'stream';     // Static or stream
  progressUrl: string | null;      // Progress polling URL (for stream)
}

/**
 * Format Data - Format information from video detail
 */
export interface FormatData {
  id: string;                      // Format ID
  category: string;                // Category (video/audio)
  type: string;                    // Type (mp4, mp3, etc.)
  quality: string;                 // Quality (1080p, 320kbps, etc.)
  size: number | null;             // Size in bytes
  url: string | null;              // Download URL (if static)
  vid: string | null;              // Video ID
  key: string | null;              // API key
  encryptedUrl: string | null;     // Encrypted URL
  isFakeData: boolean;             // Is fake data (preview)
  format?: string;                 // Format override
  filename?: string;               // Filename override
  completedAt?: number;            // Completion timestamp
  extractV2Options?: {             // Extract V2 options
    downloadMode?: string;
    videoQuality?: string;
    youtubeVideoContainer?: string;
    audioBitrate?: string;
    audioFormat?: string;
  } | null;
}

/**
 * Routing Decision - Strategy routing result
 */
export interface RoutingDecision {
  routeType: RouteType;            // Which strategy to use
  platform: string;                // Platform (iOS, Windows, other)
  format: string;                  // Format (mp4, mp3, etc.)
  sizeMB: number;                  // File size in MB
  description: string;             // Human-readable description
}

/**
 * API Progress Data - Progress data from polling API
 */
export interface ApiProgressData {
  videoProgress: number;           // Video progress (0-100)
  audioProgress: number;           // Audio progress (0-100)
  status: string;                  // Status (processing, merging, etc.)
  mergedUrl: string | null;        // Final merged URL (when complete)
}

/**
 * Display Progress - UI progress data
 */
export interface DisplayProgress {
  percent: number;                 // Display percentage (0-100)
  statusText: string;              // Status text for UI
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

const AUDIO_FORMATS = ['mp3', 'wav', 'opus', 'ogg', 'm4a', 'audio'];

/**
 * Check if format is audio
 */
export function isAudioFormat(format: string): boolean {
  return AUDIO_FORMATS.includes(format.toLowerCase());
}

/**
 * Parse string to FileFormat enum
 */
export function parseFileFormat(value: string): FileFormat | null {
  const normalized = value.toLowerCase().trim();
  const map: Record<string, FileFormat> = {
    'mp4': FileFormat.MP4,
    'webm': FileFormat.WEBM,
    'mp3': FileFormat.MP3,
    'wav': FileFormat.WAV,
    'opus': FileFormat.OPUS,
    'ogg': FileFormat.OGG,
    'm4a': FileFormat.M4A
  };
  return map[normalized] ?? null;
}

/**
 * Get file size in MB from ExtractResult
 */
export function getSizeMB(result: ExtractResult): number {
  return result.size ? Math.round(result.size / (1024 * 1024)) : 0;
}

// ============================================================
// ROUTING LOGIC
// ============================================================

const IOS_RAM_MAX_SIZE_MB = 150;
const MAX_STREAM_SIZE_MB = 500; // Force polling for files > 500MB

/**
 * Determine route (strategy) based on extract result and format
 *
 * Routing rules:
 * 1. Static content → STATIC_DIRECT
 * 2. iOS + audio ≤150MB → IOS_RAM
 * 3. iOS + (video OR audio >150MB) → IOS_POLLING
 * 4. Windows + MP4 → WINDOWS_MP4_POLLING
 * 5. Any platform + size >500MB → WINDOWS_MP4_POLLING (forced)
 * 6. Other → OTHER_STREAM
 */
export function determineRoute(
  extractResult: ExtractResult,
  formatData: FormatData
): RoutingDecision {
  const format = formatData.format || formatData.type || 'mp4';
  const sizeMB = getSizeMB(extractResult);
  const isAudio = isAudioFormat(format);

  // Case 1: Static content - direct download
  if (extractResult.status === 'static') {
    return {
      routeType: RouteType.STATIC_DIRECT,
      platform: 'any',
      format,
      sizeMB,
      description: 'Static file direct download'
    };
  }

  // Case 2 & 3: iOS handling
  if (isIOS()) {
    // iOS RAM: Audio ≤150MB (direct stream download to RAM, ignore progressUrl)
    // iOS Polling: Video or large audio (server-side processing)
    if (isAudio && sizeMB <= IOS_RAM_MAX_SIZE_MB) {
      return {
        routeType: RouteType.IOS_RAM,
        platform: 'iOS',
        format,
        sizeMB,
        description: `iOS audio stream (${sizeMB}MB) - RAM download`
      };
    }
    return {
      routeType: RouteType.IOS_POLLING,
      platform: 'iOS',
      format,
      sizeMB,
      description: `iOS stream (${sizeMB}MB) - server polling`
    };
  }

  // Case 4: Windows MP4 stream
  if (isWindows() && (format.toLowerCase() === 'mp4' || format.toLowerCase() === 'video')) {
    return {
      routeType: RouteType.WINDOWS_MP4_POLLING,
      platform: 'Windows',
      format,
      sizeMB,
      description: 'Windows MP4 stream - server polling'
    };
  }

  // Case 5: Other platforms - check size before deciding
  // Force polling if file > 500MB to avoid memory issues
  if (sizeMB > MAX_STREAM_SIZE_MB) {
    return {
      routeType: RouteType.WINDOWS_MP4_POLLING,
      platform: 'other',
      format,
      sizeMB,
      description: `Large file (${sizeMB}MB > 500MB) - forced server polling`
    };
  }

  // Case 6: Default fallback - other stream
  return {
    routeType: RouteType.OTHER_STREAM,
    platform: 'other',
    format,
    sizeMB,
    description: 'Direct stream download'
  };
}

// ============================================================
// PROGRESS CALCULATION
// ============================================================

/**
 * Create ApiProgressData from partial data
 */
export function createApiProgressData(data: {
  videoProgress?: number;
  audioProgress?: number;
  status?: string;
  mergedUrl?: string | null;
}): ApiProgressData {
  return {
    videoProgress: data.videoProgress ?? 0,
    audioProgress: data.audioProgress ?? 0,
    status: data.status ?? '',
    mergedUrl: data.mergedUrl ?? null
  };
}

/**
 * Calculate display progress from API progress
 *
 * Maps API progress (0-100) to display progress (10-95)
 * to leave room for merging phase UI
 */
export function calculateDisplayProgress(
  apiData: ApiProgressData,
  format: string,
  lastPercent: number = 0
): DisplayProgress {
  const isAudio = isAudioFormat(format);

  // Complete
  if (apiData.mergedUrl) {
    return { percent: 100, statusText: 'Ready' };
  }

  // Calculate raw progress
  let rawPercent: number;
  if (isAudio) {
    rawPercent = apiData.audioProgress;
  } else {
    // Video: weighted average (60% video, 40% audio)
    rawPercent = apiData.videoProgress * 0.6 + apiData.audioProgress * 0.4;
  }

  // Map to 10-95% range (leave room for merging phase)
  const mappedPercent = 10 + (rawPercent / 100) * 85;

  // Never backwards rule
  const percent = Math.max(mappedPercent, lastPercent);

  // Status text
  let statusText = 'Processing...';
  if (apiData.status === 'merging') {
    statusText = isAudio ? 'Encoding audio...' : 'Merging...';
  }

  return { percent, statusText };
}

// ============================================================
// FACTORY HELPERS
// ============================================================

/**
 * Create ExtractResult from API response
 */
export function createExtractResult(apiResponse: {
  url: string;
  filename?: string;
  size?: number;
  status: string;
  progressUrl?: string;
}): ExtractResult {
  return {
    url: apiResponse.url,
    filename: apiResponse.filename ?? null,
    size: apiResponse.size ?? null,
    status: apiResponse.status === 'static' ? 'static' : 'stream',
    progressUrl: apiResponse.progressUrl ?? null
  };
}
