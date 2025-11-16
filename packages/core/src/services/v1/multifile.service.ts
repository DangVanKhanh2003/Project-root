/**
 * Multifile Service (V1)
 * Handles multifile download sessions
 */

import type { IHttpClient } from '../../http/http-client.interface';
import type { ApiConfig } from '../../config/api-config.interface';
import type {
  MultifileStartResponse,
  MultifileStatusResponse,
} from '../../models/remote/v1/responses/multifile.response';
import type {
  MultifileNonEncodeStartRequest,
  MultifileStatusRequest,
} from '../../models/remote/v1/requests/multifile.request';
import type { ProtectionPayload } from '../types/protection.types';
import { MULTIFILE_ENDPOINTS } from '../constants/endpoints';
import { getTimeout } from '../../config/api-config.interface';

/**
 * JWT save callback type
 */
export type JwtSaveCallback = (jwt: string) => void;

/**
 * Multifile service interface
 */
export interface IMultifileService {
  startMultifileSession(params: MultifileNonEncodeStartRequest, protectionPayload?: ProtectionPayload): Promise<MultifileStartResponse>;
  getMultifileStatus(params: MultifileStatusRequest): Promise<MultifileStatusResponse>;
}

/**
 * Create multifile service
 *
 * @param httpClient - HTTP client instance
 * @param config - API configuration
 * @param onJwtReceived - Callback when JWT is received from API
 * @returns Multifile service instance
 */
export function createMultifileService(
  httpClient: IHttpClient,
  config: ApiConfig,
  onJwtReceived?: JwtSaveCallback
): IMultifileService {
  let internalJwt: string | null = null;

  /**
   * Save JWT if present in response
   */
  function handleJwt(response: any): void {
    if (response?.jwt) {
      internalJwt = response.jwt;
      if (onJwtReceived) {
        onJwtReceived(response.jwt);
      }
    }
  }

  /**
   * Start multifile download session
   *
   * @param params - Multifile start request parameters
   * @param protectionPayload - JWT or CAPTCHA token
   * @returns Session start response with session_id and stream_url
   */
  async function startMultifileSession(
    params: MultifileNonEncodeStartRequest,
    protectionPayload: ProtectionPayload = {}
  ): Promise<MultifileStartResponse> {
    const headers: Record<string, string> = {};
    const data: Record<string, unknown> = { urls: params.urls };

    if (protectionPayload.jwt) {
      headers['Authorization'] = `Bearer ${protectionPayload.jwt}`;
    } else if (protectionPayload.captcha) {
      data.captcha_token = protectionPayload.captcha.token;
      data.provider = protectionPayload.captcha.provider || 'recaptcha';
    }

    const response = await httpClient.request<MultifileStartResponse>({
      method: 'POST',
      url: MULTIFILE_ENDPOINTS.START,
      data,
      headers,
      timeout: getTimeout(config, 'multifileStart'),
    });

    handleJwt(response);

    // Response format: { success: true, data: { status, session_id, stream_url, expires_at } }
    return response;
  }

  /**
   * Get multifile download session status
   *
   * @param params - Multifile status request parameters
   * @returns Session status with progress and stats
   */
  async function getMultifileStatus(params: MultifileStatusRequest): Promise<MultifileStatusResponse> {
    const headers: Record<string, string> = {};
    if (internalJwt) {
      headers['Authorization'] = `Bearer ${internalJwt}`;
    }

    const response = await httpClient.request<MultifileStatusResponse>({
      method: 'GET',
      url: `${MULTIFILE_ENDPOINTS.STATUS}/${params.sessionId}`,
      headers,
      timeout: getTimeout(config, 'multifileStatus'),
    });

    handleJwt(response);

    // Response format: { success: true, data: { session_id, status, progress, stats, ... } }
    return response;
  }

  return {
    startMultifileSession,
    getMultifileStatus,
  };
}
