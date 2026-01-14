/**
 * V3 Download Service Interface
 * YouTube Download API - https://api.ytconvert.org
 */

import type { V3DownloadRequest } from '../../../models/remote/v3/requests';
import type { CreateJobResponse, StatusResponse } from '../../../models/remote/v3/responses';

/**
 * V3 Download Service Interface
 */
export interface IV3DownloadService {
  /**
   * Create a download job
   * POST /api/download
   *
   * @param request - Download request parameters
   * @param signal - Optional abort signal
   * @returns Job creation response with job ID
   */
  createJob(request: V3DownloadRequest, signal?: AbortSignal): Promise<CreateJobResponse>;

  /**
   * Get job status
   * GET /api/status/:id
   *
   * @param jobId - Job ID from createJob response
   * @returns Job status with progress and download URL when completed
   */
  getStatus(jobId: string): Promise<StatusResponse>;
}
