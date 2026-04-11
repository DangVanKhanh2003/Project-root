/**
 * ZIP Download Service Interface (V3)
 */

export interface ZipDownloadRequest {
    files: string[];
    zipName: string;
}

export interface ZipDownloadResponse {
    success: boolean;
    downloadUrl?: string;
    error?: string;
}

export interface IZipDownloadService {
    /**
     * Create a ZIP download from multiple URLs
     * @param request The ZIP download request
     * @returns The ZIP download response
     */
    createZipDownload(request: ZipDownloadRequest): Promise<ZipDownloadResponse>;
}
