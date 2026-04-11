import { IHttpClient } from '../../../http';
import { ApiConfig } from '../../../config/api-config.interface';
import { BaseService, BaseRequestOptions } from '../../base/base-service';
import { IZipDownloadService, ZipDownloadRequest, ZipDownloadResponse } from '../interfaces/zip.interface';

export class ZipDownloadService extends BaseService implements IZipDownloadService {
    constructor(httpClient: IHttpClient, config: ApiConfig) {
        super(httpClient, config);
    }

    /**
     * Create a ZIP download from multiple URLs
     * POST /create
     */
    async createZipDownload(request: ZipDownloadRequest, options?: BaseRequestOptions): Promise<ZipDownloadResponse> {
        try {
            const response = await this.httpClient.request<any>({
                method: 'POST',
                url: '/create',
                data: {
                    files: request.files,
                    zipName: request.zipName,
                },
                timeout: options?.timeout || this.config.zip?.timeout || 30000,
            });

            // Handle response normalization similar to ytmp3.gg
            const data = response.data || response;

            if (data.download_url) {
                return {
                    success: true,
                    downloadUrl: data.download_url,
                };
            }

            return {
                success: false,
                error: data.message || data.error || 'Failed to create ZIP download',
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to create ZIP download',
            };
        }
    }
}

/**
 * Factory function for ZipDownloadService
 */
export function createV3ZipDownloadService(httpClient: IHttpClient, config: any): IZipDownloadService {
    return new ZipDownloadService(httpClient, config);
}
