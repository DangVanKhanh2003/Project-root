/**
 * Stream Mapper
 * Maps YouTube v2 stream API responses to StreamDto
 */

import type {
  StreamResponse,
  StaticResponse,
  ProgressResponse,
} from '../../models/remote/v2/responses/download.response';
import type { StreamDto } from '../../models/dto/stream.dto';

/**
 * Download options used to enrich stream DTO with metadata
 */
interface DownloadOptions {
  downloadMode?: 'video' | 'audio';
  videoQuality?: string;
  audioFormat?: string;
  url?: string;
}

/**
 * Map stream response to StreamDto
 * Handles both 'stream' and 'static' response types
 *
 * @param response - Stream or static response from API
 * @param options - Download options for metadata
 * @returns Normalized StreamDto
 */
export function mapStreamResponse(
  response: StreamResponse | StaticResponse,
  options: DownloadOptions = {}
): StreamDto {
  const isStream = response.status === 'stream';

  // Parse quality and format from filename or options
  const quality = options.videoQuality || null;
  const format = options.audioFormat || response.filename.split('.').pop() || 'mp4';

  return {
    status: response.status,
    url: response.url,
    filename: response.filename,
    title: '', // Will be populated by caller if needed
    quality,
    format,
    downloadMode: options.downloadMode || 'video',
    progressUrl: isStream ? (response as StreamResponse).progressUrl || null : null,
    size: response.size || null, // Extract size from response if available
  };
}

/**
 * Map progress response
 * Progress polling for autoMerge downloads
 *
 * @param response - Progress response from API
 * @returns Progress response (pass-through for now)
 */
export function mapProgressResponse(
  response: ProgressResponse
): ProgressResponse {
  // Pass-through for now - progress response is already well-structured
  return response;
}
