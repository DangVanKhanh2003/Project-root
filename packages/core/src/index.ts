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
// Services - V1
// ========================================
export {
  createSearchService,
  createPlaylistService,
  createFeedbackService,
  createDecryptService,
  createMediaService,
  createMultifileService,
  createConversionService,
  type ISearchService,
  type IPlaylistService,
  type IFeedbackService,
  type IDecryptService,
  type IMediaService,
  type IMultifileService,
  type IConversionService,
} from './services/v1';

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
  type IV3DownloadService,
} from './services/v3';

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
  checkVideoExists,
  type VideoExistsResult,
} from './utils/youtube-url-validator';
