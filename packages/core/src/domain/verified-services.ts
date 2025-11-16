/**
 * Verified Services
 * Wrapper around core services with automatic verification
 *
 * Pattern: Generic wrap function + object literal return (like verifier.js)
 */

import type { DomainVerifier } from './verification/verifier';
import type { VerifiedResult } from './verification/types';
import type { ProtectionPayload } from '../services/base/base-service';

// Core Services
import type { ISearchService } from '../services/v1/interfaces/search.interface';
import type { IMediaService } from '../services/v1/interfaces/media.interface';
import type { IConversionService } from '../services/v1/interfaces/conversion.interface';
import type { IPlaylistService } from '../services/v1/interfaces/playlist.interface';
import type { IDecryptService } from '../services/v1/interfaces/decrypt.interface';
import type { IFeedbackService } from '../services/v1/interfaces/feedback.interface';
import type { ISearchV2Service } from '../services/v2/interfaces/searchv2.interface';
import type { IQueueService } from '../services/v2/interfaces/queue.interface';
import type { IYouTubeDownloadService } from '../services/v2/interfaces/youtube-download.interface';
import type { IMultifileService } from '../services/v1/interfaces/multifile.interface';
import type { IYouTubePublicApiService } from '../services/public-api/interfaces/public-api.interface';

/**
 * Core Services Collection
 */
export interface CoreServices {
  search: ISearchService;
  media: IMediaService;
  conversion: IConversionService;
  playlist: IPlaylistService;
  decrypt: IDecryptService;
  feedback: IFeedbackService;
  searchV2: ISearchV2Service;
  queue: IQueueService;
  youtubeDownload: IYouTubeDownloadService;
  multifile: IMultifileService;
  youtubePublicApi: IYouTubePublicApiService;
}

/**
 * Create verified services
 * Wraps core services with domain verification
 *
 * @param services - Core services collection
 * @param verifier - Domain verifier instance
 * @returns Verified services API
 */
export function createVerifiedServices(
  services: CoreServices,
  verifier: DomainVerifier
) {
  /**
   * Auto-inject JWT helper
   */
  function getProtectionPayload(providedPayload?: ProtectionPayload): ProtectionPayload | undefined {
    const jwt = providedPayload?.jwt || verifier.getCurrentJwt();
    if (jwt && !providedPayload) {
      return { jwt };
    } else if (jwt && providedPayload && !providedPayload.jwt) {
      return { ...providedPayload, jwt };
    }
    return providedPayload;
  }

  /**
   * Service method registry
   * Maps method name to actual service implementation
   * KEY NAMES MUST MATCH ACTUAL METHOD NAMES for clarity
   */
  const methodRegistry: Record<string, (...args: any[]) => Promise<any>> = {
    // Search V1
    'searchTitle': (params: any) =>
      services.search.searchTitle(params),
    'getSuggestions': (params: any) =>
      services.search.getSuggestions(params),

    // Media (with protection)
    'extractMedia': (params: any, payload?: ProtectionPayload) =>
      services.media.extractMedia(params, payload),
    'extractMediaDirect': (params: any, payload?: ProtectionPayload) =>
      services.media.extractMediaDirect(params, payload),

    // Conversion
    'convert': (params: any, payload?: ProtectionPayload) =>
      services.conversion.convert(params, payload),
    'checkTask': (params: any) =>
      services.conversion.checkTask(params),

    // Playlist
    'extractPlaylist': (params: any) =>
      services.playlist.extractPlaylist(params),

    // Decrypt (with protection)
    'decodeUrl': (params: any, payload?: ProtectionPayload) =>
      services.decrypt.decodeUrl(params, payload),
    'decodeList': (params: any, payload?: ProtectionPayload) =>
      services.decrypt.decodeList(params, payload),

    // Feedback
    'sendFeedback': (params: any) =>
      services.feedback.sendFeedback(params),

    // Search V2
    'searchV2': (query: string, options?: any) =>
      services.searchV2.searchV2(query, options),

    // Queue
    'addVideoToQueue': (videoId: string) =>
      services.queue.addVideoToQueue(videoId),

    // YouTube Download
    'downloadYouTube': (params: any, signal?: AbortSignal) =>
      services.youtubeDownload.downloadYouTube(params, signal),
    'getDownloadProgress': (params: any) =>
      services.youtubeDownload.getDownloadProgress(params),

    // Multifile (with protection for start session)
    'startMultifileSession': (params: any, payload?: ProtectionPayload) =>
      services.multifile.startMultifileSession(params, payload),
    'getMultifileStatus': (params: any) =>
      services.multifile.getMultifileStatus(params),

    // YouTube Public API
    'getMetadataYoutube': (url: string) =>
      services.youtubePublicApi.getMetadata(url),
  };

  /**
   * Generic wrap function
   * Auto-injects JWT/CAPTCHA, calls service from registry, extracts JWT from response
   */
  async function wrap<T>(
    methodName: string,
    ...args: any[]
  ): Promise<VerifiedResult<T>> {
    try {
      // Lookup service method from registry
      const method = methodRegistry[methodName];

      if (!method) {
        throw new Error(`Method not found in registry: ${methodName}`);
      }

      // Call service method
      const rawResponse = await method(...args);

      // Verify with policy (extracts JWT automatically)
      return verifier.verifyResponse<any, T>(rawResponse, methodName);
    } catch (error) {
      // Handle errors - return error VerifiedResult
      const message = error instanceof Error ? error.message : 'Network or API error';
      return {
        ok: false,
        status: 'error',
        code: 'ERROR',
        message,
        data: null,
        raw: error,
      };
    }
  }

  // Return verified services API
  return {
    // ========================================
    // Search V1
    // ========================================

    searchTitle: (params: Parameters<ISearchService['searchTitle']>[0]) =>
      wrap('searchTitle', params),

    getSuggestions: (params: Parameters<ISearchService['getSuggestions']>[0]) =>
      wrap('getSuggestions', params),

    // ========================================
    // Media Extraction (WITH auto JWT injection)
    // ========================================

    extractMedia: (
      params: Parameters<IMediaService['extractMedia']>[0],
      protectionPayload?: ProtectionPayload
    ) => {
      const payload = getProtectionPayload(protectionPayload);
      return wrap('extractMedia', params, payload);
    },

    extractMediaDirect: (
      params: Parameters<IMediaService['extractMediaDirect']>[0],
      protectionPayload?: ProtectionPayload
    ) => {
      const payload = getProtectionPayload(protectionPayload);
      return wrap('extractMediaDirect', params, payload);
    },

    // ========================================
    // Conversion (WITH auto JWT for convert)
    // ========================================

    convert: (
      params: Parameters<IConversionService['convert']>[0],
      protectionPayload?: ProtectionPayload
    ) => {
      const payload = getProtectionPayload(protectionPayload);
      return wrap('convert', params, payload);
    },

    checkTask: (params: Parameters<IConversionService['checkTask']>[0]) =>
      wrap('checkTask', params),

    // ========================================
    // Playlist
    // ========================================

    extractPlaylist: (params: Parameters<IPlaylistService['extractPlaylist']>[0]) =>
      wrap('extractPlaylist', params),

    // ========================================
    // Decrypt (WITH auto JWT injection)
    // ========================================

    decodeUrl: (
      params: Parameters<IDecryptService['decodeUrl']>[0],
      protectionPayload?: ProtectionPayload
    ) => {
      const payload = getProtectionPayload(protectionPayload);
      return wrap('decodeUrl', params, payload);
    },

    decodeList: (
      params: Parameters<IDecryptService['decodeList']>[0],
      protectionPayload?: ProtectionPayload
    ) => {
      const payload = getProtectionPayload(protectionPayload);
      return wrap('decodeList', params, payload);
    },

    // ========================================
    // Feedback
    // ========================================

    sendFeedback: (params: Parameters<IFeedbackService['sendFeedback']>[0]) =>
      wrap('sendFeedback', params),

    // ========================================
    // Search V2
    // ========================================

    searchV2: (query: string, options?: Parameters<ISearchV2Service['searchV2']>[1]) =>
      wrap('searchV2', query, options),

    // ========================================
    // Queue
    // ========================================

    addVideoToQueue: (videoId: string) =>
      wrap('addVideoToQueue', videoId),

    // ========================================
    // YouTube Download
    // ========================================

    downloadYouTube: (params: Parameters<IYouTubeDownloadService['downloadYouTube']>[0], signal?: AbortSignal) =>
      wrap('downloadYouTube', params, signal),

    getDownloadProgress: (params: Parameters<IYouTubeDownloadService['getDownloadProgress']>[0]) =>
      wrap('getDownloadProgress', params),

    // ========================================
    // Multifile
    // ========================================

    startMultifileSession: (
      params: Parameters<IMultifileService['startMultifileSession']>[0],
      protectionPayload?: ProtectionPayload
    ) => {
      const payload = getProtectionPayload(protectionPayload);
      return wrap('startMultifileSession', params, payload);
    },

    getMultifileStatus: (params: Parameters<IMultifileService['getMultifileStatus']>[0]) =>
      wrap('getMultifileStatus', params),

    // ========================================
    // YouTube Public API
    // ========================================

    getMetadataYoutube: (url: string) =>
      wrap('getMetadataYoutube', url),

    // ========================================
    // Utility
    // ========================================

    getCurrentJwt: () => verifier.getCurrentJwt(),
    clearJwt: () => verifier.clearJwt(),

    // ========================================
    // Direct access to core services (if needed)
    // ========================================

    core: services,
  };
}

/**
 * Verified Services Type
 * Inferred return type of createVerifiedServices
 */
export type VerifiedServices = ReturnType<typeof createVerifiedServices>;
