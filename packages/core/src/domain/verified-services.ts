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

import type { IFeedbackService } from '../services/v1/interfaces/feedback.interface';
import type { ISearchV2Service } from '../services/v2/interfaces/searchv2.interface';
import type { IZipDownloadService, ZipDownloadResponse } from '../services/v3/interfaces/zip.interface';
import type { IQueueService } from '../services/v2/interfaces/queue.interface';

import type { IYouTubePublicApiService } from '../services/public-api/interfaces/public-api.interface';
import type { IV3PlaylistService } from '../services/v3/interfaces/playlist.interface';
import type { IV3DownloadService } from '../services/v3/interfaces/download.interface';
import { mapDirectExtractResponse } from '../mappers/v1/media/direct.mapper';
import { mapInstagramResponse } from '../mappers/v1/media/instagram.mapper';

/**
 * Core Services Collection
 */
export interface CoreServices {

  feedback: IFeedbackService;
  searchV2: ISearchV2Service;
  queue: IQueueService;
  youtubePublicApi: IYouTubePublicApiService;
  playlistV3: IV3PlaylistService;
  downloadV3: IV3DownloadService;
  zipDownload: IZipDownloadService;
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
   

    // Feedback
    [POLICY_NAME.SEND_FEEDBACK]: (params: any) =>
      services.feedback.sendFeedback(params),

    // Search V2
    [POLICY_NAME.SEARCH_V2]: (query: string, options?: any) =>
      services.searchV2.searchV2(query, options),

    // Queue
    [POLICY_NAME.ADD_VIDEO_TO_QUEUE]: (videoId: string) =>
      services.queue.addVideoToQueue(videoId),

  
    // YouTube Public API
    [POLICY_NAME.GET_METADATA_YOUTUBE]: (url: string) =>
      services.youtubePublicApi.getMetadata(url),

    // Playlist V3
    'playlistV3.extractPlaylist': (url: string, signal?: AbortSignal) =>
      services.playlistV3.extractPlaylist(url, signal),

    // Download V3
    'downloadV3.createJob': (request: any, signal?: AbortSignal) =>
      services.downloadV3.createJob(request, signal),
    'downloadV3.getStatusByUrl': (url: string) =>
      services.downloadV3.getStatusByUrl(url),
    'zipDownload.createZipDownload': (request: any) =>
      services.zipDownload.createZipDownload(request),
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

   
    // ========================================
    // Decrypt (WITH auto JWT injection)
    // ========================================


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


    // ========================================
    // YouTube Public API
    // ========================================

    getMetadataYoutube: (url: string) =>
      wrap(POLICY_NAME.GET_METADATA_YOUTUBE, url),

    // ========================================
    // Playlist V3
    // ========================================

    playlistV3: {
      extractPlaylist: (url: string, signal?: AbortSignal) =>
        wrap('playlistV3.extractPlaylist', url, signal),
    },

    // ========================================
    // Download V3
    // ========================================

    downloadV3: {
      createJob: (request: Parameters<IV3DownloadService['createJob']>[0], signal?: AbortSignal) =>
        wrap('downloadV3.createJob', request, signal),
      getStatusByUrl: (url: string) =>
        wrap('downloadV3.getStatusByUrl', url),
    },
    
    // ========================================
    // ZIP Download
    // ========================================

    zipDownload: {
      createZipDownload: (request: Parameters<IZipDownloadService['createZipDownload']>[0]) =>
        wrap<ZipDownloadResponse>('zipDownload.createZipDownload', request),
    },

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
