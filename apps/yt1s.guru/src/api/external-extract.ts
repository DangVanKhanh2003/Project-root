/**
 * External Extract API Setup
 * cc.ytconvert.org — direct download, no polling needed
 *
 * Completely isolated from V3 — no cross-imports
 */

import { createHttpClient, createExternalExtractService } from '@downloader/core';
import { getExternalExtractBaseUrl, getTimeout } from '../environment';
import { apiLogger } from '../libs/api-logger/api-logger';

// External Extract API Configuration
const EXTERNAL_EXTRACT_BASE_URL = getExternalExtractBaseUrl();
const EXTERNAL_EXTRACT_TIMEOUT = getTimeout('externalExtract');

// Create HTTP Client
const externalExtractHttpClient = createHttpClient({
  baseUrl: EXTERNAL_EXTRACT_BASE_URL,
  timeout: EXTERNAL_EXTRACT_TIMEOUT,
});

// Create Service
const externalExtractService = createExternalExtractService(externalExtractHttpClient, {
  v1: { baseUrl: '' },
  v2: { baseUrl: '' },
});

// Export API object with logging
export const apiExternalExtract = {
  /**
   * Extract media — direct download, no polling
   * POST /api/v2/download
   */
  extract: async (...args: Parameters<typeof externalExtractService.extract>) => {
    try {
      const result = await externalExtractService.extract(...args);
      apiLogger.log({
        type: 'success',
        endpoint: 'externalExtract',
        requestData: args[0],
        responseData: result,
      });
      return result;
    } catch (error) {
      apiLogger.log({
        type: 'error',
        endpoint: 'externalExtract',
        requestData: args[0],
        errorData: error,
      });
      throw error;
    }
  },
};

export const externalExtractConfig = {
  baseUrl: EXTERNAL_EXTRACT_BASE_URL,
  timeout: EXTERNAL_EXTRACT_TIMEOUT,
};
