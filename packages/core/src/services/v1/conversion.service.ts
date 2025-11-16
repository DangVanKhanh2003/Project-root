/**
 * Conversion Service (V1)
 * Handles YouTube format conversion and task status checking
 */

import type { IHttpClient } from '../../http/http-client.interface';
import type { ApiConfig } from '../../config/api-config.interface';
import type { TaskDto } from '../../models/dto/conversion.dto';
import type { ConvertResponse, ConvertResponseData } from '../../models/remote/v1/responses/convert.response';
import type { ConvertRequest, CheckTaskRequest } from '../../models/remote/v1/requests/convert.request';
import type { ProtectionPayload } from '../types/protection.types';
import { API_ENDPOINTS } from '../constants/endpoints';
import { getTimeout } from '../../config/api-config.interface';
import { mapConversionResponse } from '../../mappers/v1/conversion.mapper';

/**
 * JWT save callback type
 */
export type JwtSaveCallback = (jwt: string) => void;

/**
 * Conversion service interface
 */
export interface IConversionService {
  convert(params: ConvertRequest, protectionPayload?: ProtectionPayload): Promise<TaskDto>;
  checkTask(params: CheckTaskRequest): Promise<TaskDto>;
}

/**
 * Create conversion service
 *
 * @param httpClient - HTTP client instance
 * @param config - API configuration
 * @param onJwtReceived - Callback when JWT is received from API
 * @returns Conversion service instance
 */
export function createConversionService(
  httpClient: IHttpClient,
  config: ApiConfig,
  onJwtReceived?: JwtSaveCallback
): IConversionService {
  let internalJwt: string | null = null;

  /**
   * Unwrap nested API response data
   */
  function unwrapResponse<T>(response: unknown): T {
    const data = response as any;
    return (data?.data || data) as T;
  }

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
   * Convert video format (YouTube 2-step conversion)
   *
   * @param params - ConvertRequest with vid and key
   * @param protectionPayload - JWT or CAPTCHA token
   * @returns Task status DTO (response)
   */
  async function convert(
    params: ConvertRequest,
    protectionPayload: ProtectionPayload = {}
  ): Promise<TaskDto> {
    const headers: Record<string, string> = {};
    const data: Record<string, unknown> = {
      vid: params.vid,
      key: params.key,
    };

    if (protectionPayload.jwt) {
      headers['Authorization'] = `Bearer ${protectionPayload.jwt}`;
    } else if (protectionPayload.captcha) {
      data.captcha_token = protectionPayload.captcha.token;
      data.provider = protectionPayload.captcha.provider || 'recaptcha';
    }

    const response = await httpClient.request<ConvertResponse>({
      method: 'POST',
      url: API_ENDPOINTS.CONVERT,
      data,
      headers,
      timeout: getTimeout(config, 'convert'),
    });

    handleJwt(response);

    const unwrapped = unwrapResponse<ConvertResponseData>(response);
    return mapConversionResponse(unwrapped);
  }

  /**
   * Check conversion task status
   *
   * @param params - CheckTaskRequest with vid and b_id
   * @returns Task status DTO (response)
   */
  async function checkTask(params: CheckTaskRequest): Promise<TaskDto> {
    const headers: Record<string, string> = {};
    if (internalJwt) {
      headers['Authorization'] = `Bearer ${internalJwt}`;
    }

    const response = await httpClient.request<ConvertResponse>({
      method: 'GET',
      url: API_ENDPOINTS.CHECK_TASK,
      data: {
        vid: params.vid,
        b_id: params.b_id,
      },
      headers,
      timeout: getTimeout(config, 'checkTask'),
    });

    handleJwt(response);

    const unwrapped = unwrapResponse<ConvertResponseData>(response);
    return mapConversionResponse(unwrapped);
  }

  return {
    convert,
    checkTask,
  };
}
