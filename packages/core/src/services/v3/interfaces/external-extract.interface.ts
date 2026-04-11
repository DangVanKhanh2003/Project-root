/**
 * External Extract Service Interface
 * cc.ytconvert.org — direct download, no polling needed
 */

import type { ExternalExtractRequest } from '../../../models/remote/v3/requests';
import type { ExternalExtractResponse } from '../../../models/remote/v3/responses';

export interface IExternalExtractService {
  /**
   * Extract media via External Extract API
   * POST /api/v2/download
   *
   * @param request - Extract request (url + output config)
   * @param signal - Optional abort signal
   * @returns Direct download response (downloadUrl, filename, etc.)
   */
  extract(request: ExternalExtractRequest, signal?: AbortSignal): Promise<ExternalExtractResponse>;
}
