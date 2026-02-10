/**
 * Decrypt Service Implementation (V1)
 * Decodes encrypted URLs from media extraction
 */

import type { IDecryptService, DecryptRequest, DecryptListRequest } from '../interfaces/decrypt.interface';
import { BaseService } from '../../base/base-service';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { getTimeout } from '../../../config/api-config.interface';

class DecryptServiceImpl extends BaseService implements IDecryptService {
  async decodeUrl(params: DecryptRequest): Promise<any> {
    return this.makeRequest({
      method: 'POST',
      url: API_ENDPOINTS.DECRYPT,
      data: params as unknown as Record<string, unknown>,
      timeout: getTimeout(this.config, 'decode'),
    });
  }

  async decodeList(params: DecryptListRequest): Promise<any> {
    return this.makeRequest({
      method: 'POST',
      url: API_ENDPOINTS.DECRYPT_LIST,
      data: params as unknown as Record<string, unknown>,
      timeout: getTimeout(this.config, 'decodeList'),
    });
  }
}

export function createDecryptService(httpClient: any, config: any): IDecryptService {
  return new DecryptServiceImpl(httpClient, config);
}
