/**
 * Verified Services
 * Wrapper around core services with automatic verification
 *
 * Pattern: Generic wrap function + object literal return (like verifier.js)
 */

import type { DomainVerifier } from './verification/verifier';
import { POLICY_NAME } from './verification/constants';
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

// Mappers for data transformation
import { mapDirectExtractResponse } from '../mappers/v1/media/direct.mapper';
import { mapInstagramResponse } from '../mappers/v1/media/instagram.mapper';

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
 * CAPTCHA Handler Type
 * Function that shows CAPTCHA UI and returns token
 */
export type CaptchaHandler = () => Promise<{
  token: string;
  type: string;
}>;

/**
 * Create verified services
 * Wraps core services with domain verification
 *
 * @param services - Core services collection
 * @param verifier - Domain verifier instance
 * @param captchaHandler - Optional CAPTCHA handler for automatic retry
 * @returns Verified services API
 */
export function createVerifiedServices(
  services: CoreServices,
  verifier: DomainVerifier,
  captchaHandler?: CaptchaHandler
) {
  /**
   * Protected methods that support ProtectionPayload
   * These methods can accept CAPTCHA tokens for retry
   */
  const protectedMethods = new Set([
    'extractMedia',
    'extractMediaDirect',
    'convert',
    'decodeUrl',
    'decodeList',
    'startMultifileSession',
  ]);

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
    [POLICY_NAME.SEARCH_TITLE]: (params: any) =>
      services.search.searchTitle(params),
    [POLICY_NAME.GET_SUGGESTIONS]: (params: any) =>
      services.search.getSuggestions(params),

    // Media (with protection)
    [POLICY_NAME.EXTRACT_MEDIA]: (params: any, payload?: ProtectionPayload) =>
      services.media.extractMedia(params, payload),
    [POLICY_NAME.EXTRACT_MEDIA_DIRECT]: (params: any, payload?: ProtectionPayload) =>
      services.media.extractMediaDirect(params, payload),

    // Conversion
    [POLICY_NAME.CONVERT]: (params: any, payload?: ProtectionPayload) =>
      services.conversion.convert(params, payload),
    [POLICY_NAME.CHECK_TASK]: (params: any) =>
      services.conversion.checkTask(params),

    // Playlist
    [POLICY_NAME.EXTRACT_PLAYLIST]: (params: any) =>
      services.playlist.extractPlaylist(params),

    // Decrypt (with protection)
    [POLICY_NAME.DECODE_URL]: (params: any, payload?: ProtectionPayload) =>
      services.decrypt.decodeUrl(params, payload),
    [POLICY_NAME.DECODE_LIST]: (params: any, payload?: ProtectionPayload) =>
      services.decrypt.decodeList(params, payload),

    // Feedback
    [POLICY_NAME.SEND_FEEDBACK]: (params: any) =>
      services.feedback.sendFeedback(params),

    // Search V2
    [POLICY_NAME.SEARCH_V2]: (query: string, options?: any) =>
      services.searchV2.searchV2(query, options),

    // Queue
    [POLICY_NAME.ADD_VIDEO_TO_QUEUE]: (videoId: string) =>
      services.queue.addVideoToQueue(videoId),

    // YouTube Download
    [POLICY_NAME.DOWNLOAD_YOUTUBE]: (params: any, signal?: AbortSignal) =>
      services.youtubeDownload.downloadYouTube(params, signal),
    [POLICY_NAME.GET_DOWNLOAD_PROGRESS]: (params: any) =>
      services.youtubeDownload.getDownloadProgress(params),

    // Multifile (with protection for start session)
    [POLICY_NAME.START_MULTIFILE_SESSION]: (params: any, payload?: ProtectionPayload) =>
      services.multifile.startMultifileSession(params, payload),
    [POLICY_NAME.GET_MULTIFILE_STATUS]: (params: any) =>
      services.multifile.getMultifileStatus(params),

    // YouTube Public API
    [POLICY_NAME.GET_METADATA_YOUTUBE]: (url: string) =>
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

      // For protected methods, check JWT first and handle CAPTCHA flow
      if (protectedMethods.has(methodName) && captchaHandler) {
        const currentJwt = verifier.getCurrentJwt();
        debugger
        // Path 1: Have JWT - try with JWT first
        if (currentJwt) {
          const rawResponse = await method(...args);
          let result = await verifier.verifyResponse<any, T>(rawResponse, methodName);

          // If JWT invalid/expired (CAPTCHA_REQUIRED), clear and get CAPTCHA
          if (!result.ok && result.code === 'CAPTCHA_REQUIRED') {
            verifier.clearJwt();

            try {
              // Get CAPTCHA token
              const captchaResult = await captchaHandler();

              // Build args with CAPTCHA payload
              const captchaPayload: ProtectionPayload = {
                captcha: {
                  token: captchaResult.token,
                  type: captchaResult.type,
                },
              };

              const retryArgs = replaceOrAppendProtectionPayload(args, captchaPayload);

              // Retry with CAPTCHA
              const retryRawResponse = await method(...retryArgs);
              result = await verifier.verifyResponse<any, T>(retryRawResponse, methodName);

              if (!result.ok && result.code === 'CAPTCHA_REQUIRED') {
                return {
                  ...result,
                  message: 'CAPTCHA verification failed. Please try again later.',
                };
              }
            } catch (captchaError) {
              return handleCaptchaError(captchaError);
            }
          }

          return result;
        }

        // Path 2: No JWT - get CAPTCHA first, then call API
        try {
          // Get CAPTCHA token BEFORE calling API
          const captchaResult = await captchaHandler();

          // Build args with CAPTCHA payload
          const captchaPayload: ProtectionPayload = {
            captcha: {
              token: captchaResult.token,
              type: captchaResult.type,
            },
          };

          const protectedArgs = replaceOrAppendProtectionPayload(args, captchaPayload);

          // Call API with CAPTCHA
          const rawResponse = await method(...protectedArgs);
          const result = await verifier.verifyResponse<any, T>(rawResponse, methodName);

          if (!result.ok && result.code === 'CAPTCHA_REQUIRED') {
            return {
              ...result,
              message: 'CAPTCHA verification failed. Please try again later.',
            };
          }

          return result;
        } catch (captchaError) {
          return handleCaptchaError(captchaError);
        }
      }

      // For non-protected methods, call normally
      const rawResponse = await method(...args);
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

  /**
   * Helper: Replace or append protection payload to args
   */
  function replaceOrAppendProtectionPayload(
    args: any[],
    payload: ProtectionPayload
  ): any[] {
    const mergedPayload = getProtectionPayload(payload);

    // Check if last arg is protection payload (including undefined placeholders)
    const lastArg = args[args.length - 1];
    const lastArgIsProtection = args.length > 0 && (
      // Explicit undefined (protection slot)
      lastArg === undefined ||
      // Protection payload object
      (typeof lastArg === 'object' && lastArg !== null &&
       (lastArg.jwt !== undefined || lastArg.captcha !== undefined))
    );

    if (lastArgIsProtection) {
      // Replace last arg
      return [...args.slice(0, -1), mergedPayload];
    } else {
      // Append as new arg
      return [...args, mergedPayload];
    }
  }

  /**
   * Helper: Handle CAPTCHA errors
   */
  function handleCaptchaError(captchaError: unknown): VerifiedResult<any> {
    const isCancelled =
      captchaError instanceof Error &&
      (captchaError.message.toLowerCase().includes('close') ||
        captchaError.message.toLowerCase().includes('cancel'));

    if (isCancelled) {
      return {
        ok: false,
        status: 'error',
        code: 'ERROR',
        message: 'Verification cancelled',
        data: null,
        raw: captchaError,
      };
    }
    debugger
    return {
      ok: false,
      status: 'error',
      code: 'ERROR',
      message:
        captchaError instanceof Error
          ? captchaError.message
          : 'CAPTCHA verification failed',
      data: null,
      raw: captchaError,
    };
  }

  // Return verified services API
  return {
    // ========================================
    // Search V1
    // ========================================

    searchTitle: (params: Parameters<ISearchService['searchTitle']>[0]) =>
      wrap(POLICY_NAME.SEARCH_TITLE, params),

    getSuggestions: (params: Parameters<ISearchService['getSuggestions']>[0]) =>
      wrap(POLICY_NAME.GET_SUGGESTIONS, params),

    // ========================================
    // Media Extraction (WITH auto JWT injection)
    // ========================================

    extractMedia: (
      params: Parameters<IMediaService['extractMedia']>[0],
      protectionPayload?: ProtectionPayload
    ) => {
      const payload = getProtectionPayload(protectionPayload);
      return wrap(POLICY_NAME.EXTRACT_MEDIA, params, payload);
    },

    extractMediaDirect: async (
      params: Parameters<IMediaService['extractMediaDirect']>[0],
      protectionPayload?: ProtectionPayload
    ) => {
      const payload = getProtectionPayload(protectionPayload);
      const result = await wrap(POLICY_NAME.EXTRACT_MEDIA_DIRECT, params, payload);

      // Apply mapping to verified result data
      if (result.ok && result.data) {
        const unwrappedData = result.data as any;

        // Check if Instagram carousel
        if (unwrappedData.extractor?.toLowerCase() === 'instagram' && unwrappedData.gallery) {
          const mapped = mapInstagramResponse(unwrappedData);
          return {
            ...result,
            data: mapped,
          };
        }

        // Map direct extract response
        const mapped = mapDirectExtractResponse(unwrappedData);
        return {
          ...result,
          data: mapped,
        };
      }

      return result;
    },

    // ========================================
    // Conversion (WITH auto JWT for convert)
    // ========================================

    convert: (
      params: Parameters<IConversionService['convert']>[0],
      protectionPayload?: ProtectionPayload
    ) => {
      const payload = getProtectionPayload(protectionPayload);
      return wrap(POLICY_NAME.CONVERT, params, payload);
    },

    checkTask: (params: Parameters<IConversionService['checkTask']>[0]) =>
      wrap(POLICY_NAME.CHECK_TASK, params),

    // ========================================
    // Playlist
    // ========================================

    extractPlaylist: (params: Parameters<IPlaylistService['extractPlaylist']>[0]) =>
      wrap(POLICY_NAME.EXTRACT_PLAYLIST, params),

    // ========================================
    // Decrypt (WITH auto JWT injection)
    // ========================================

    decodeUrl: (
      params: Parameters<IDecryptService['decodeUrl']>[0],
      protectionPayload?: ProtectionPayload
    ) => {
      const payload = getProtectionPayload(protectionPayload);
      return wrap(POLICY_NAME.DECODE_URL, params, payload);
    },

    decodeList: (
      params: Parameters<IDecryptService['decodeList']>[0],
      protectionPayload?: ProtectionPayload
    ) => {
      const payload = getProtectionPayload(protectionPayload);
      return wrap(POLICY_NAME.DECODE_LIST, params, payload);
    },

    // ========================================
    // Feedback
    // ========================================

    sendFeedback: (params: Parameters<IFeedbackService['sendFeedback']>[0]) =>
      wrap(POLICY_NAME.SEND_FEEDBACK, params),

    // ========================================
    // Search V2
    // ========================================

    searchV2: (query: string, options?: Parameters<ISearchV2Service['searchV2']>[1]) =>
      wrap(POLICY_NAME.SEARCH_V2, query, options),

    // ========================================
    // Queue
    // ========================================

    addVideoToQueue: (videoId: string) =>
      wrap(POLICY_NAME.ADD_VIDEO_TO_QUEUE, videoId),

    // ========================================
    // YouTube Download
    // ========================================

    downloadYouTube: (params: Parameters<IYouTubeDownloadService['downloadYouTube']>[0], signal?: AbortSignal) =>
      wrap(POLICY_NAME.DOWNLOAD_YOUTUBE, params, signal),

    getDownloadProgress: (params: Parameters<IYouTubeDownloadService['getDownloadProgress']>[0]) =>
      wrap(POLICY_NAME.GET_DOWNLOAD_PROGRESS, params),

    // ========================================
    // Multifile
    // ========================================

    startMultifileSession: (
      params: Parameters<IMultifileService['startMultifileSession']>[0],
      protectionPayload?: ProtectionPayload
    ) => {
      const payload = getProtectionPayload(protectionPayload);
      return wrap(POLICY_NAME.START_MULTIFILE_SESSION, params, payload);
    },

    getMultifileStatus: (params: Parameters<IMultifileService['getMultifileStatus']>[0]) =>
      wrap(POLICY_NAME.GET_MULTIFILE_STATUS, params),

    // ========================================
    // YouTube Public API
    // ========================================

    getMetadataYoutube: (url: string) =>
      wrap(POLICY_NAME.GET_METADATA_YOUTUBE, url),

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
