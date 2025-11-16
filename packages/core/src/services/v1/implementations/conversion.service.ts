/**
 * Conversion Service Implementation (V1) - REFACTORED
 * Extends BaseService for centralized request/response handling
 */

import type { TaskDto } from '../../../models/dto/conversion.dto';
import type { ConvertResponse, ConvertResponseData } from '../../../models/remote/v1/responses/convert.response';
import type { ConvertRequest, CheckTaskRequest } from '../../../models/remote/v1/requests/convert.request';
import type { ProtectionPayload } from '../../types/protection.types';
import type { IConversionService } from '../interfaces/conversion.interface';
import { BaseService } from '../../base/base-service';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { getTimeout } from '../../../config/api-config.interface';
import { mapConversionResponse } from '../../../mappers/v1/conversion.mapper';

/**
 * Conversion Service Implementation
 * Extends BaseService for automatic:
 * - JWT extraction and storage
 * - Protection payload handling (JWT/CAPTCHA)
 * - Verification control from domain layer
 */
class ConversionServiceImpl extends BaseService implements IConversionService {
  /**
   * Convert video format (YouTube 2-step conversion)
   *
   * @param params - ConvertRequest with vid and key
   * @param protectionPayload - Optional JWT or CAPTCHA token
   * @returns Task status DTO
   */
  async convert(
    params: ConvertRequest,
    protectionPayload?: ProtectionPayload
  ): Promise<TaskDto> {
    // ✅ Use base.makeRequest() instead of httpClient directly
    // Base handles:
    // - JWT headers: Bearer ${protectionPayload.jwt}
    // - CAPTCHA data: captcha_token, provider
    // - JWT extraction: auto-save to this.internalJwt
    // - Verification: if enabled, verify through domain layer
    const response = await this.makeRequest<ConvertResponse>({
      method: 'POST',
      url: API_ENDPOINTS.CONVERT,
      data: {
        vid: params.vid,
        key: params.key,
      },
      timeout: getTimeout(this.config, 'convert'),
    }, protectionPayload);

    // Unwrap and map response
    const unwrapped = this.unwrapSimpleResponse<ConvertResponseData>(response);
    return mapConversionResponse(unwrapped);
  }

  /**
   * Check conversion task status
   * Uses internal JWT from previous convert() call
   *
   * @param params - CheckTaskRequest with vid and b_id
   * @returns Task status DTO
   */
  async checkTask(params: CheckTaskRequest): Promise<TaskDto> {
    // ✅ Use base.makeRequestWithInternalJwt()
    // Base automatically adds: Authorization: Bearer ${this.internalJwt}
    const response = await this.makeRequestWithInternalJwt<ConvertResponse>({
      method: 'GET',
      url: API_ENDPOINTS.CHECK_TASK,
      data: {
        vid: params.vid,
        b_id: params.b_id,
      },
      timeout: getTimeout(this.config, 'checkTask'),
    });

    // Unwrap and map response
    const unwrapped = this.unwrapSimpleResponse<ConvertResponseData>(response);
    return mapConversionResponse(unwrapped);
  }
}

/**
 * Factory function to create Conversion Service
 * Maintains existing API for backward compatibility
 */
export function createConversionService(
  httpClient: any,
  config: any,
  onJwtReceived?: (jwt: string) => void
): IConversionService {
  return new ConversionServiceImpl(httpClient, config, onJwtReceived);
}
