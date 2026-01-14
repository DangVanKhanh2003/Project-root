/**
 * Conversion Mapper
 * Maps convert and check-task API responses to ConversionDto
 */

import type { ConvertResponseData } from '../../models/remote/v1/responses/convert.response';
import type { TaskDto } from '../../models/dto/conversion.dto';

/**
 * Map convert/check-task response to TaskDto
 *
 * Both convert and checkTask return the same structure:
 * - c_status: PENDING | CONVERTING | CONVERTED | FAILED
 * - dlink: Download URL (when CONVERTED)
 * - b_id: Batch ID for polling (when not converted yet)
 *
 * @param data - Convert or check-task response data
 * @returns Normalized TaskDto
 */
export function mapConversionResponse(
  data: ConvertResponseData
): TaskDto {
  // Normalize status to uppercase
  const status = String(data.c_status || '').toUpperCase();

  return {
    status, // Keep original status: "PENDING", "CONVERTING", "CONVERTED", "FAILED"
    vid: data.vid,
    bId: data.b_id || null,
    downloadUrl: data.dlink || null,
    message: data.mess || '',
    title: data.title || null,
    quality: data.fquality || null,
  };
}
