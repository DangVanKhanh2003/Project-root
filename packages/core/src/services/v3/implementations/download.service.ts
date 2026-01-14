/**
 * V3 Download Service Implementation
 * YouTube Download API - https://api.ytconvert.org
 */

import type { V3DownloadRequest } from '../../../models/remote/v3/requests';
import type {
  CreateJobResponse,
  StatusResponse,
  V3ErrorResponse,
} from '../../../models/remote/v3/responses';
import type { IV3DownloadService } from '../interfaces/download.interface';
import { BaseService } from '../../base/base-service';
import { V3_ENDPOINTS } from '../../constants/endpoints';
import { getTimeout } from '../../../config/api-config.interface';

/**
 * V3 Download Service Implementation
 */
class V3DownloadServiceImpl extends BaseService implements IV3DownloadService {
  /**
   * Create a download job
   * POST /api/download
   */
  async createJob(
    request: V3DownloadRequest,
    signal?: AbortSignal
  ): Promise<CreateJobResponse> {
    // Validate required fields
    if (!request.url || typeof request.url !== 'string') {
      throw new Error('Invalid URL: URL must be a non-empty string');
    }

    if (!request.output?.type) {
      throw new Error('Invalid request: output.type is required');
    }

    if (!request.output?.format) {
      throw new Error('Invalid request: output.format is required');
    }

    // Make request
    const response = await this.makeRequest<CreateJobResponse | V3ErrorResponse>({
      method: 'POST',
      url: V3_ENDPOINTS.DOWNLOAD,
      data: request as unknown as Record<string, unknown>,
      timeout: getTimeout(this.config, 'v3CreateJob'),
      signal,
    });

    // Check for error response
    if (this.isErrorResponse(response)) {
      throw new Error(response.error.message || response.error.code);
    }

    return response as CreateJobResponse;
  }

  /**
   * Get job status
   * GET /api/status/:id
   */
  async getStatus(jobId: string): Promise<StatusResponse> {
    if (!jobId || typeof jobId !== 'string') {
      throw new Error('Invalid jobId: must be a non-empty string');
    }

    const response = await this.makeRequest<StatusResponse | V3ErrorResponse>({
      method: 'GET',
      url: `${V3_ENDPOINTS.STATUS}/${jobId}`,
      timeout: getTimeout(this.config, 'v3GetStatus'),
    });

    // Check for error response
    if (this.isErrorResponse(response)) {
      throw new Error(response.error.message || response.error.code);
    }

    return response as StatusResponse;
  }

  /**
   * Type guard for error response
   */
  private isErrorResponse(response: unknown): response is V3ErrorResponse {
    return (
      typeof response === 'object' &&
      response !== null &&
      'error' in response &&
      typeof (response as V3ErrorResponse).error === 'object'
    );
  }
}

/**
 * Create V3 Download Service
 *
 * @param httpClient - HTTP client instance
 * @param config - API configuration with V3 timeouts
 * @returns V3 Download Service instance
 */
export function createV3DownloadService(
  httpClient: any,
  config: any
): IV3DownloadService {
  return new V3DownloadServiceImpl(httpClient, config);
}
