/**
 * Decrypt Mapper
 * Maps decrypt API responses to DecryptDto
 */

import type { DecryptResponse } from '../../models/remote/v1/responses/decrypt.response';
import type { DecodeDto } from '../../models/dto/decrypt.dto';

/**
 * Map decrypt response to DecryptDto
 *
 * @param response - Decrypt response from API
 * @returns Normalized DecryptDto
 */
export function mapDecryptResponse(response: DecryptResponse): DecodeDto {
  if (!response) {
    return {
      success: false,
      error: 'Empty response from decrypt API',
      reason: 'empty_response',
    };
  }

  // Handle wrapped response: {success: true, data: {status: 'ok', original_url: '...'}}
  const actualData = response.data || response;

  // Success case
  if (actualData.status === 'ok' && actualData.original_url) {
    return {
      success: true,
      url: actualData.original_url,
    };
  }

  // Error case
  return {
    success: false,
    error: actualData.message || 'Failed to decode URL',
    reason: actualData.reason || 'unknown_error',
  };
}
