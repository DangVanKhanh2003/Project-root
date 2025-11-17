/**
 * Decrypt Service Implementation (V1)
 * Handles decoding/decryption of encrypted URLs
 */

import type { DecodeDto } from '../../../models/dto/decrypt.dto';
import type { DecryptResponse, DecryptListResponse } from '../../../models/remote/v1/responses/decrypt.response';
import type { DecryptRequest, DecryptListRequest } from '../../../models/remote/v1/requests/decrypt.request';
import type { ProtectionPayload } from '../../types/protection.types';
import type { IDecryptService, JwtSaveCallback } from '../interfaces/decrypt.interface';
import { BaseService } from '../../base/base-service';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { getTimeout } from '../../../config/api-config.interface';
import { mapDecryptResponse } from '../../../mappers/v1/decrypt.mapper';

/**
 * Decrypt Service Implementation
 * Extends BaseService for centralized request handling with JWT support
 */
class DecryptServiceImpl extends BaseService implements IDecryptService {
  /**
   * Decode encrypted URL to direct download URL
   *
   * @param params - Decrypt request parameters
   * @param protectionPayload - JWT or CAPTCHA token
   * @returns Decrypted URL DTO
   */
  async decodeUrl(
    params: DecryptRequest,
    protectionPayload?: ProtectionPayload
  ): Promise<DecodeDto> {
    const response = await this.makeRequest<DecryptResponse>({
      method: 'POST',
      url: API_ENDPOINTS.DECRYPT,
      data: { encrypted_url: params.encrypted_url },
      timeout: getTimeout(this.config, 'decode'),
    }, protectionPayload);

    return mapDecryptResponse(response);
  }

  /**
   * Decode a list of encrypted URLs
   *
   * @param params - Decrypt list request parameters
   * @param protectionPayload - JWT or CAPTCHA token
   * @returns Raw decrypt list response (verifier handles it)
   */
  async decodeList(
    params: DecryptListRequest,
    protectionPayload?: ProtectionPayload
  ): Promise<DecryptListResponse> {
    const response = await this.makeRequest<DecryptListResponse>({
      method: 'POST',
      url: API_ENDPOINTS.DECRYPT_LIST,
      data: { encrypted_urls: params.encrypted_urls },
      timeout: getTimeout(this.config, 'decodeList'),
    }, protectionPayload);

    // Return as-is, verifier will handle it
    return response;
  }
}

/**
 * Create decrypt service
 *
 * @param httpClient - HTTP client instance
 * @param config - API configuration
 * @returns Decrypt service instance
 */
export function createDecryptService(
  httpClient: any,
  config: any
): IDecryptService {
  return new DecryptServiceImpl(httpClient, config);
}
