/**
 * External Extract Service Implementation
 * cc.ytconvert.org — direct download, no polling needed
 *
 * POST /api/v2/download → returns { status, downloadUrl, filename, ... }
 */

import type { ExternalExtractRequest } from '../../../models/remote/v3/requests';
import type { ExternalExtractResponse } from '../../../models/remote/v3/responses';
import type { IExternalExtractService } from '../interfaces/external-extract.interface';
import { BaseService } from '../../base/base-service';
import { EXTERNAL_EXTRACT_ENDPOINTS } from '../../constants/endpoints';

class ExternalExtractServiceImpl extends BaseService implements IExternalExtractService {
  /**
   * Extract media — direct download, no polling
   * POST /api/v2/download
   */
  async extract(
    request: ExternalExtractRequest,
    signal?: AbortSignal
  ): Promise<ExternalExtractResponse> {
    if (!request.url || typeof request.url !== 'string') {
      throw new Error('Invalid URL: URL must be a non-empty string');
    }

    if (!request.output?.type || !['video', 'audio'].includes(request.output.type)) {
      throw new Error('Invalid request: output.type must be "video" or "audio"');
    }

    const response = await this.makeRequest<ExternalExtractResponse>({
      method: 'POST',
      url: EXTERNAL_EXTRACT_ENDPOINTS.DOWNLOAD,
      data: request as unknown as Record<string, unknown>,
      timeout: 5 * 60 * 1000, // 5 minutes
      signal,
    });

    return response;
  }
}

/**
 * Create External Extract Service
 *
 * @param httpClient - HTTP client configured with cc.ytconvert.org base URL
 * @param config - API configuration
 * @returns External Extract Service instance
 */
export function createExternalExtractService(
  httpClient: any,
  config: any
): IExternalExtractService {
  return new ExternalExtractServiceImpl(httpClient, config);
}
