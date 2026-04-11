/**
 * API V3 Setup - YouTube Download API
 * https://hub.ytconvert.org
 *
 * Completely isolated from V2 - no cross-imports
 */

import { createHttpClient, createV3DownloadService } from '@downloader/core';
import { getApiBaseUrlV3, getTimeout } from '../environment';

// V3 API Configuration
const V3_BASE_URL = getApiBaseUrlV3();
const V3_TIMEOUT = getTimeout('v3CreateJob');

// Create V3 HTTP Client
const v3HttpClient = createHttpClient({
  baseUrl: V3_BASE_URL,
  timeout: V3_TIMEOUT,
});

// V3 API Config for core services
const v3ApiConfig = {
  v1: { baseUrl: '' }, // Not used for V3
  v2: { baseUrl: '' }, // Not used for V3
  timeouts: {
    v3CreateJob: getTimeout('v3CreateJob'),
    v3GetStatus: getTimeout('v3GetStatus'),
  },
};

// Create V3 Download Service
export const v3DownloadService = createV3DownloadService(v3HttpClient, v3ApiConfig);

// Export V3 API object for easy access
export const apiV3 = {
  /**
   * Create a download job
   * POST /api/download
   */
  createJob: v3DownloadService.createJob.bind(v3DownloadService),

  /**
   * Get job status by full URL
   * GET {statusUrl} - URL from createJob response
   */
  getStatusByUrl: v3DownloadService.getStatusByUrl.bind(v3DownloadService),
};

// Export config for debugging
export const v3Config = {
  baseUrl: V3_BASE_URL,
  timeout: {
    createJob: getTimeout('v3CreateJob'),
    getStatus: getTimeout('v3GetStatus'),
    pollingInterval: getTimeout('v3PollingInterval'),
    maxPollingDuration: getTimeout('v3MaxPollingDuration'),
  },
};
