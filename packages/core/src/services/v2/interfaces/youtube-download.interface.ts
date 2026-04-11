/**
 * YouTube Download Service Interface (V2)
 */

import type { DownloadRequest, ProgressRequest } from '../../../models/remote/v2/requests/download.request';
import type { StreamDto } from '../../../models/dto/stream.dto';
import type { ProgressResponse } from '../../../models/remote/v2/responses/download.response';

export interface IYouTubeDownloadService {
  downloadYouTube(params: DownloadRequest, signal?: AbortSignal): Promise<StreamDto>;
  getDownloadProgress(params: ProgressRequest): Promise<ProgressResponse>;
}
