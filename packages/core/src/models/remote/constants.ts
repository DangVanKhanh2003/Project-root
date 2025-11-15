/**
 * Remote API Constants
 * Shared constants across v1 and v2 APIs
 */

// ============================================================
// CAPTCHA PROVIDERS (v1 uses different providers than before)
// ============================================================
export const CAPTCHA_PROVIDERS = {
  RECAPTCHA_V2: 'recaptchav2',
  HCAPTCHA: 'hcaptcha',
} as const;

export type CaptchaProviderType =
  (typeof CAPTCHA_PROVIDERS)[keyof typeof CAPTCHA_PROVIDERS];

// ============================================================
// API v1 RESPONSE STATUS
// ============================================================
export const API_V1_STATUS = {
  OK: 'ok',
  ERROR: 'error',
} as const;

export type ApiV1StatusType =
  (typeof API_V1_STATUS)[keyof typeof API_V1_STATUS];

// ============================================================
// API v2 RESPONSE STATUS
// ============================================================
export const API_V2_STATUS = {
  STREAM: 'stream',
  STATIC: 'static',
  ERROR: 'error',
} as const;

export type ApiV2StatusType =
  (typeof API_V2_STATUS)[keyof typeof API_V2_STATUS];

// ============================================================
// MULTIFILE SESSION STATUS (v1)
// ============================================================
export const MULTIFILE_SESSION_STATUS = {
  INITIALIZING: 'initializing',
  DECRYPTING: 'decrypting',
  DOWNLOADING: 'downloading',
  ZIPPING: 'zipping',
  COMPLETED: 'completed',
  ERROR: 'error',
  EXPIRED: 'expired',
} as const;

export type MultifileSessionStatusType =
  (typeof MULTIFILE_SESSION_STATUS)[keyof typeof MULTIFILE_SESSION_STATUS];

// ============================================================
// DOWNLOAD PROGRESS STATUS (v2)
// ============================================================
export const DOWNLOAD_PROGRESS_STATUS = {
  DOWNLOADING: 'downloading',
  COMPLETED: 'completed',
  NO_DOWNLOAD: 'no_download',
  NOT_FOUND: 'not_found',
  ERROR: 'error',
} as const;

export type DownloadProgressStatusType =
  (typeof DOWNLOAD_PROGRESS_STATUS)[keyof typeof DOWNLOAD_PROGRESS_STATUS];

// ============================================================
// MEDIA FILE TYPES
// ============================================================
export const MEDIA_FILE_TYPE = {
  IMAGE: 'Image',
  VIDEO: 'Video',
} as const;

export type MediaFileType =
  (typeof MEDIA_FILE_TYPE)[keyof typeof MEDIA_FILE_TYPE];

// ============================================================
// DOWNLOAD MODE (v2)
// ============================================================
export const DOWNLOAD_MODE = {
  VIDEO: 'video',
  AUDIO: 'audio',
} as const;

export type DownloadModeType =
  (typeof DOWNLOAD_MODE)[keyof typeof DOWNLOAD_MODE];

// ============================================================
// FILENAME STYLE (v2)
// ============================================================
export const FILENAME_STYLE = {
  CLASSIC: 'classic',
  PRETTY: 'pretty',
  BASIC: 'basic',
  NERDY: 'nerdy',
} as const;

export type FilenameStyleType =
  (typeof FILENAME_STYLE)[keyof typeof FILENAME_STYLE];

// ============================================================
// VIDEO QUALITY (v2)
// ============================================================
export const VIDEO_QUALITY = {
  MAX: 'max',
  UHD_8K: '4320',
  UHD_4K: '2160',
  QHD: '1440',
  FULL_HD: '1080',
  HD: '720',
  SD: '480',
  LOW: '360',
  MOBILE: '240',
  VERY_LOW: '144',
} as const;

export type VideoQualityType =
  (typeof VIDEO_QUALITY)[keyof typeof VIDEO_QUALITY];

// ============================================================
// VIDEO CODEC (v2)
// ============================================================
export const VIDEO_CODEC = {
  H264: 'h264',
  AV1: 'av1',
  VP9: 'vp9',
} as const;

export type VideoCodecType =
  (typeof VIDEO_CODEC)[keyof typeof VIDEO_CODEC];

// ============================================================
// VIDEO CONTAINER (v2)
// ============================================================
export const VIDEO_CONTAINER = {
  AUTO: 'auto',
  MP4: 'mp4',
  WEBM: 'webm',
  MKV: 'mkv',
} as const;

export type VideoContainerType =
  (typeof VIDEO_CONTAINER)[keyof typeof VIDEO_CONTAINER];

// ============================================================
// AUDIO BITRATE (v2)
// ============================================================
export const AUDIO_BITRATE = {
  HIGH: '320',
  MEDIUM_HIGH: '256',
  MEDIUM: '128',
  LOW: '96',
  VERY_LOW: '64',
  MIN: '8',
} as const;

export type AudioBitrateType =
  (typeof AUDIO_BITRATE)[keyof typeof AUDIO_BITRATE];

// ============================================================
// AUDIO FORMAT (v2)
// ============================================================
export const AUDIO_FORMAT = {
  BEST: 'best',
  MP3: 'mp3',
  OGG: 'ogg',
  WAV: 'wav',
  OPUS: 'opus',
} as const;

export type AudioFormatType =
  (typeof AUDIO_FORMAT)[keyof typeof AUDIO_FORMAT];
