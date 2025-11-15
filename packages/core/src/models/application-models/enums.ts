/**
 * Application Models - Enums
 * Application-level enumerations (user-facing values, not API-specific)
 * These models are used in the application layer, independent of API contracts
 *
 * NOTE: API-specific constants are in remote/constants.ts
 */

// ============================================================
// PLATFORM SOURCES
// ============================================================
export enum PlatformSource {
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  TWITTER = 'twitter',
  UNKNOWN = 'unknown',
}

// ============================================================
// MEDIA TYPES
// ============================================================
export enum MediaType {
  VIDEO = 'video',
  AUDIO = 'audio',
  IMAGE = 'image',
  GALLERY = 'gallery', // Multi-item post (Instagram carousels)
}

// ============================================================
// CONVERSION/TASK STATUS (Domain-level)
// ============================================================
export enum ConversionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// ============================================================
// DOWNLOAD STATUS (Domain-level)
// ============================================================
export enum DownloadStatus {
  IDLE = 'idle',
  PREPARING = 'preparing',
  DOWNLOADING = 'downloading',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// ============================================================
// VIDEO QUALITY (User-facing display values)
// ============================================================
// NOTE: API uses different values ('1080', '2160', etc.) - see remote/constants.ts
export enum VideoQuality {
  UHD_8K = '8K',
  UHD_4K = '4K',
  FULL_HD = '1080p',
  HD = '720p',
  SD = '480p',
  LOW = '360p',
  MOBILE = '240p',
  AUTO = 'auto',
}

// ============================================================
// AUDIO QUALITY (User-facing display values)
// ============================================================
// NOTE: API uses different values ('320', '192', etc.) - see remote/constants.ts
export enum AudioQuality {
  HIGH = '320kbps',
  MEDIUM = '192kbps',
  LOW = '128kbps',
  AUTO = 'auto',
}

// ============================================================
// FORMAT TYPES (File extensions)
// ============================================================
export enum FormatType {
  MP4 = 'mp4',
  WEBM = 'webm',
  MP3 = 'mp3',
  M4A = 'm4a',
  WAV = 'wav',
  JPG = 'jpg',
  PNG = 'png',
}
