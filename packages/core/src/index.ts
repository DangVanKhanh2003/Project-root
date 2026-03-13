/**
 * @downloader/core - Main entry point
 * Core business logic and type definitions for the downloader application
 */

export const VERSION = '1.0.0';

// ========================================
// Models (Remote, DTO, Entities, State)
// ========================================
export * from './models';

// ========================================
// HTTP Client
// ========================================
export {
  createHttpClient,
  type IHttpClient,
  type HttpClientConfig,
  type RequestOptions,
  type HttpMethod,
} from './http';

// ========================================
// HTTP Errors
// ========================================
export {
  ApiError,
  NetworkError,
  TimeoutError,
  ValidationError,
  CancellationError,
} from './http';

// ========================================
// Services - V2
// ========================================
export {
  createQueueService,
  createSearchV2Service,
  createYouTubeDownloadService,
  extractCacheId,
  type IQueueService,
  type ISearchV2Service,
  type IYouTubeDownloadService,
} from './services/v2';

// ========================================
// Services - V3
// ========================================
export {
  createV3DownloadService,
  createV3PlaylistService,
  createV3ZipDownloadService,
  type IV3DownloadService,
  type IV3PlaylistService,
  type IZipDownloadService,
} from './services/v3';

// ========================================
// Services - V1 (Feedback, Decrypt, Multifile)
// ========================================
export {
  createFeedbackService,
} from './services/v1/implementations/feedback.service';
export type { IFeedbackService } from './services/v1/interfaces/feedback.interface';

export {
  createDecryptService,
} from './services/v1/implementations/decrypt.service';
export type { IDecryptService } from './services/v1/interfaces/decrypt.interface';

export {
  createMultifileService,
} from './services/v1/implementations/multifile.service';
export type { IMultifileService } from './services/v1/interfaces/multifile.interface';

// ========================================
// Services - Public API
// ========================================
export {
  createYouTubePublicApiService,
  type IYouTubePublicApiService,
} from './services/public-api';

// ========================================
// Mappers
// ========================================
export {
  mapSearchResponse,
  mapSearchV2Response,
  mapPlaylistResponse,
  mapConversionResponse,
  mapDecryptResponse,
  mapYouTubeExtractResponse,
  mapDirectExtractResponse,
  mapInstagramResponse,
  normalizeFormat,
  normalizeFormats,
  normalizeFormatsFromObject,
} from './mappers';

// ========================================
// Mappers - V3
// ========================================
export {
  mapToV3DownloadRequest,
  detectOsType,
  mapErrorCodeToMessage,
  isRetryableError,
  isUserInputError,
  isVideoUnavailableError,
  type ExtractV2Options,
} from './mappers/v3';

// ========================================
// Service Base (for custom services)
// ========================================
export { BaseService, type BaseRequestOptions, type ProtectionPayload } from './services/base/base-service';

// ========================================
// Domain Layer (RECOMMENDED FOR SITE PROJECTS)
// ========================================
// Read DOMAIN_LAYER_GUIDE.md for usage instructions
// Exports: DomainVerifier, VerifiedServices, JWT Store, Verification types
export * from './domain';

// ========================================
// Orchestration Layer
// ========================================
// Download flow coordination and session management
// Exports: Multifile orchestrator, SSE manager, constants
export * from './orchestration';

// ========================================
// Utils
// ========================================
// YouTube URL validation utilities
export {
  isYouTubeUrl,
  isYouTubeUrlStrict,
  isValidVideoId,
  extractVideoId,
  extractPlaylistId,
  isPlaylistUrl,
  checkVideoExists,
  type VideoExistsResult,
} from './utils/youtube-url-validator';

// Playlist redirect helpers
export {
  shouldPromptPlaylistRedirect,
  shouldPromptPlaylistRedirectForMulti,
  shouldPromptChannelRedirect,
  getUrlRedirectTarget,
} from './utils/playlist-redirect';
export type { UrlRedirectTarget } from './utils/playlist-redirect';

// URL detection utilities
export { looksLikeUrl } from './utils/url-detection';

// ========================================
// Supporter
// ========================================
export {
  FEATURE_KEYS,
  FEATURE_KEY_ALIASES,
  GEO_RESTRICTED_FEATURES,
  FEATURE_ACCESS_REASONS,
  type FeatureKey,
  type FeatureAccessReason,
} from './supporter/feature-access-constants';

export {
  createSupporterService,
  type ISupporterService,
  type AllowedFeaturesResponse,
  type CheckKeyResponse,
  type ResetKeyResponse,
  type SupporterPricingResponse,
} from './services/supporter';
