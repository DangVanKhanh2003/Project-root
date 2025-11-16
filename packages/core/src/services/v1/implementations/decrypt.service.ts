/**
 * Decrypt Service Implementation (V1)
 * Handles decoding/decryption of encrypted URLs
 */

import type { IHttpClient } from '../../../http/http-client.interface';
import type { ApiConfig } from '../../../config/api-config.interface';
import type { DecodeDto } from '../../../models/dto/decrypt.dto';
import type { DecryptResponse, DecryptListResponse } from '../../../models/remote/v1/responses/decrypt.response';
import type { DecryptRequest, DecryptListRequest } from '../../../models/remote/v1/requests/decrypt.request';
import type { ProtectionPayload } from '../../types/protection.types';
import type { IDecryptService, JwtSaveCallback } from '../interfaces/decrypt.interface';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { getTimeout } from '../../../config/api-config.interface';
import { mapDecryptResponse } from '../../../mappers/v1/decrypt.mapper';

/**
 * Create decrypt service
 *
 * @param httpClient - HTTP client instance
 * @param config - API configuration
 * @param onJwtReceived - Callback when JWT is received from API
 * @returns Decrypt service instance
 */
export function createDecryptService(
  httpClient: IHttpClient,
  config: ApiConfig,
  onJwtReceived?: JwtSaveCallback
): IDecryptService {
  /**
   * Save JWT if present in response
   */
  function handleJwt(response: any): void {
    if (response?.jwt && onJwtReceived) {
      onJwtReceived(response.jwt);
    }
  }

  /**
   * Decode encrypted URL to direct download URL
   *
   * @param params - Decrypt request parameters
   * @param protectionPayload - JWT or CAPTCHA token
   * @returns Decrypted URL DTO
   */
  async function decodeUrl(
    params: DecryptRequest,
    protectionPayload: ProtectionPayload = {}
  ): Promise<DecodeDto> {
    const headers: Record<string, string> = {};
    const data: Record<string, unknown> = { encrypted_url: params.encrypted_url };

    if (protectionPayload.jwt) {
      headers['Authorization'] = `Bearer ${protectionPayload.jwt}`;
    } else if (protectionPayload.captcha) {
      data.captcha_token = protectionPayload.captcha.token;
      data.provider = protectionPayload.captcha.provider || 'recaptcha';
    }

    const response = await httpClient.request<DecryptResponse>({
      method: 'POST',
      url: API_ENDPOINTS.DECRYPT,
      data,
      headers,
      timeout: getTimeout(config, 'decode'),
    });

    handleJwt(response);

    return mapDecryptResponse(response);
  }

  /**
   * Decode a list of encrypted URLs
   *
   * @param params - Decrypt list request parameters
   * @param protectionPayload - JWT or CAPTCHA token
   * @returns Raw decrypt list response (verifier handles it)
   */
  async function decodeList(
    params: DecryptListRequest,
    protectionPayload: ProtectionPayload = {}
  ): Promise<DecryptListResponse> {
    const headers: Record<string, string> = {};
    const data: Record<string, unknown> = { encrypted_urls: params.encrypted_urls };

    if (protectionPayload.jwt) {
      headers['Authorization'] = `Bearer ${protectionPayload.jwt}`;
    } else if (protectionPayload.captcha) {
      data.captcha_token = protectionPayload.captcha.token;
      data.provider = protectionPayload.captcha.type || 'recaptcha';
    }

    const response = await httpClient.request<DecryptListResponse>({
      method: 'POST',
      url: API_ENDPOINTS.DECRYPT_LIST,
      data,
      headers,
      timeout: getTimeout(config, 'decodeList'),
    });

    handleJwt(response);

    // Return as-is, verifier will handle it
    return response;
  }

  return {
    decodeUrl,
    decodeList,
  };
}
