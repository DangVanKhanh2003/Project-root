/**
 * Multifile Service Implementation (V1)
 * Handles multifile download sessions
 */

import type {
  MultifileStartResponse,
  MultifileStatusResponse,
} from '../../../models/remote/v1/responses/multifile.response';
import type {
  MultifileNonEncodeStartRequest,
  MultifileStatusRequest,
} from '../../../models/remote/v1/requests/multifile.request';
import type { ProtectionPayload } from '../../types/protection.types';
import type { IMultifileService, JwtSaveCallback } from '../interfaces/multifile.interface';
import { BaseService } from '../../base/base-service';
import { MULTIFILE_ENDPOINTS } from '../../constants/endpoints';
import { getTimeout } from '../../../config/api-config.interface';

/**
 * Multifile Service Implementation
 * Extends BaseService for centralized request handling with stateful JWT
 */
class MultifileServiceImpl extends BaseService implements IMultifileService {
  /**
   * Start multifile download session
   *
   * @param params - Multifile start request parameters
   * @param protectionPayload - JWT or CAPTCHA token
   * @returns Session start response with session_id and stream_url
   */
  async startMultifileSession(
    params: MultifileNonEncodeStartRequest,
    protectionPayload?: ProtectionPayload
  ): Promise<MultifileStartResponse> {
    const response = await this.makeRequest<MultifileStartResponse>({
      method: 'POST',
      url: MULTIFILE_ENDPOINTS.START,
      data: { urls: params.urls },
      timeout: getTimeout(this.config, 'multifileStart'),
    }, protectionPayload);

    return response;
  }

  /**
   * Get multifile session status
   * Uses internal JWT from previous startMultifileSession() call
   *
   * @param params - Multifile status request parameters
   * @returns Session status response
   */
  async getMultifileStatus(params: MultifileStatusRequest): Promise<MultifileStatusResponse> {
    const response = await this.makeRequestWithInternalJwt<MultifileStatusResponse>({
      method: 'GET',
      url: MULTIFILE_ENDPOINTS.STATUS,
      data: { session_id: params.sessionId },
      timeout: getTimeout(this.config, 'multifileStatus'),
    });

    return response;
  }
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
  httpClient: any,
  config: any,
  onJwtReceived?: JwtSaveCallback
): IMultifileService {
  return new MultifileServiceImpl(httpClient, config, onJwtReceived);
}
