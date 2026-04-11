/**
 * types.ts - Conversion Types
 *
 * Simplified types for V3 conversion flow.
 * No device-specific routing or strategies.
 */

// ============================================================
// INTERFACES
// ============================================================

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

// ============================================================
// UTILS
// ============================================================

const AUDIO_FORMATS = ['mp3', 'wav', 'opus', 'ogg', 'm4a', 'audio'];

export function isAudioFormat(format: string): boolean {
  return AUDIO_FORMATS.includes(format.toLowerCase());
}
