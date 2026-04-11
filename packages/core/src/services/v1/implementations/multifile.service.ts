/**
 * Multifile Download Service Implementation (V1)
 * Manages multifile download sessions
 */

import type { IMultifileService, StartMultifileRequest } from '../interfaces/multifile.interface';
import { BaseService } from '../../base/base-service';
import { MULTIFILE_ENDPOINTS } from '../../constants/endpoints';
import { getTimeout } from '../../../config/api-config.interface';

class MultifileServiceImpl extends BaseService implements IMultifileService {
  async startMultifileSession(params: StartMultifileRequest): Promise<any> {
    return this.makeRequest({
      method: 'POST',
      url: MULTIFILE_ENDPOINTS.START,
      data: params as unknown as Record<string, unknown>,
      timeout: getTimeout(this.config, 'multifileStart'),
    });
  }
}

export function createMultifileService(httpClient: any, config: any): IMultifileService {
  return new MultifileServiceImpl(httpClient, config);
}
