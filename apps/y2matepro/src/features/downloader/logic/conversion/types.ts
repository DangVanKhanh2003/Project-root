/**
 * types.ts - All conversion-related types in one file
 *
 * Simple, consolidated types for conversion module.
 * No complex folder structure, just types that make sense.
 */

import { isIOS, isWindows } from '../../../../utils';

// ============================================================
// ENUMS
// ============================================================

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

export enum RouteType {
  STATIC_DIRECT = 'static_direct',
  IOS_RAM = 'ios_ram',
  IOS_POLLING = 'ios_polling',
  WINDOWS_MP4_POLLING = 'windows_mp4_polling',
  OTHER_STREAM = 'other_stream'
}

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

export interface ExtractResult {
  url: string;
  filename: string | null;
  size: number | null;
  status: 'static' | 'stream';
  progressUrl: string | null;
}

export interface FormatData {
  id: string;
  category: string;
  type: string;
  quality: string;
  size: number | null;
  url: string | null;
  vid: string | null;
  key: string | null;
  encryptedUrl: string | null;
  isFakeData: boolean;
  format?: string;
  filename?: string;
  completedAt?: number;
  extractV2Options?: {
    downloadMode?: string;
    videoQuality?: string;
    youtubeVideoContainer?: string;
    audioBitrate?: string;
    audioFormat?: string;
  } | null;
}

export interface RoutingDecision {
  routeType: RouteType;
  platform: string;
  format: string;
  sizeMB: number;
  description: string;
}

export interface ApiProgressData {
  videoProgress: number;
  audioProgress: number;
  status: string;
  mergedUrl: string | null;
}

// ============================================================
// UTILS
// ============================================================

const AUDIO_FORMATS = ['mp3', 'wav', 'opus', 'ogg', 'm4a', 'audio'];

export function isAudioFormat(format: string): boolean {
  return AUDIO_FORMATS.includes(format.toLowerCase());
}

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

export function getSizeMB(result: ExtractResult): number {
  return result.size ? Math.round(result.size / (1024 * 1024)) : 0;
}

// ============================================================
// ROUTING LOGIC - Simple function, no class needed
// ============================================================

const IOS_RAM_MAX_SIZE_MB = 150;
const LOG_PREFIX = '[Routing]';
const log = (...args: unknown[]) => console.log(LOG_PREFIX, ...args);

export function determineRoute(
  extractResult: ExtractResult,
  formatData: FormatData
): RoutingDecision {
  const format = formatData.format || formatData.type || 'mp4';
  const sizeMB = getSizeMB(extractResult);
  const isAudio = isAudioFormat(format);

  log('=== ROUTING DECISION ===');
  log('Input extractResult:', JSON.stringify(extractResult, null, 2));
  log('Input formatData:', JSON.stringify(formatData, null, 2));
  log('Computed values:', {
    format,
    sizeMB,
    sizeBytes: extractResult.size,
    isAudio,
    status: extractResult.status,
    hasProgressUrl: !!extractResult.progressUrl,
    progressUrl: extractResult.progressUrl
  });

  // Case 1: Static content - direct download
  if (extractResult.status === 'static') {
    log('→ Case 1: STATIC_DIRECT (status is static)');
    return {
      routeType: RouteType.STATIC_DIRECT,
      platform: 'any',
      format,
      sizeMB,
      description: 'Static file direct download'
    };
  }

  // Case 2 & 3: iOS handling
  log('Platform check:', { isIOS: isIOS(), isWindows: isWindows() });

  if (isIOS()) {
    // iOS RAM: Audio ≤150MB (direct stream download to RAM, ignore progressUrl)
    // iOS Polling: Video or large audio (server-side processing)
    const hasProgressUrl = !!extractResult.progressUrl;

    log('iOS routing check:', {
      hasProgressUrl,
      isAudio,
      sizeMB,
      maxSizeMB: IOS_RAM_MAX_SIZE_MB,
      condition_isAudio: isAudio,
      condition_sizeOK: sizeMB <= IOS_RAM_MAX_SIZE_MB,
      allConditionsMet: isAudio && sizeMB <= IOS_RAM_MAX_SIZE_MB
    });

    if (isAudio && sizeMB <= IOS_RAM_MAX_SIZE_MB) {
      log('→ Case 2: IOS_RAM (audio + size OK, ignoring progressUrl)');
      return {
        routeType: RouteType.IOS_RAM,
        platform: 'iOS',
        format,
        sizeMB,
        description: `iOS audio stream (${sizeMB}MB) - RAM download`
      };
    }
    log('→ Case 3: IOS_POLLING (video or audio > 150MB)');
    return {
      routeType: RouteType.IOS_POLLING,
      platform: 'iOS',
      format,
      sizeMB,
      description: `iOS stream (${sizeMB}MB) - server polling`
    };
  }

  // Case 4: Windows MP4 stream
  if (isWindows() && format === 'mp4') {
    log('→ Case 4: WINDOWS_MP4_POLLING');
    return {
      routeType: RouteType.WINDOWS_MP4_POLLING,
      platform: 'Windows',
      format,
      sizeMB,
      description: 'Windows MP4 stream - server polling'
    };
  }

  // Case 5: Other platforms - direct stream
  log('→ Case 5: OTHER_STREAM (default fallback)');
  return {
    routeType: RouteType.OTHER_STREAM,
    platform: 'other',
    format,
    sizeMB,
    description: 'Direct stream download'
  };
}

// ============================================================
// PROGRESS CALCULATION - Simple functions
// ============================================================

export interface DisplayProgress {
  percent: number;
  statusText: string;
}

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
