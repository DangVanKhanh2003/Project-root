import { IHttpClient } from '../../../http';
import { ApiConfig } from '../../../config/api-config.interface';
import { BaseService } from '../../base/base-service';
import {
  ISaveZipService,
  SaveZipInitResponse,
  SaveZipAddFileRequest,
  SaveZipAddFileResponse,
  SaveZipCreateRequest,
  SaveZipStatusResponse,
} from '../interfaces/save-zip.interface';
import { SAVE_ZIP_ENDPOINTS } from '../../constants/endpoints';

export class SaveZipService extends BaseService implements ISaveZipService {
  constructor(httpClient: IHttpClient, config: ApiConfig) {
    super(httpClient, config);
  }

  /**
   * Initialize a server-side ZIP session
   * POST /save/init
   */
  async saveInit(): Promise<SaveZipInitResponse> {
    try {
      const response = await this.httpClient.request<any>({
        method: 'POST',
        url: SAVE_ZIP_ENDPOINTS.INIT,
        data: {},
        timeout: this.config.saveZip?.timeout || 15000,
      });

      const data = response.data || response;

      if (data.task_id) {
        return {
          success: true,
          taskId: data.task_id,
        };
      }

      return {
        success: false,
        taskId: null,
        error: data.error || data.message || 'Failed to initialize ZIP session',
      };
    } catch (error: any) {
      return {
        success: false,
        taskId: null,
        error: error.message || 'Failed to initialize ZIP session',
      };
    }
  }

  /**
   * Add a file to the ZIP session
   * POST /save/add
   */
  async saveAddFile(request: SaveZipAddFileRequest): Promise<SaveZipAddFileResponse> {
    try {
      const response = await this.httpClient.request<any>({
        method: 'POST',
        url: SAVE_ZIP_ENDPOINTS.ADD,
        data: {
          task_id: request.taskId,
          url: request.url,
        },
        timeout: this.config.saveZip?.timeout || 15000,
      });

      const data = response.data || response;

      if (data.error) {
        return {
          success: false,
          error: data.error,
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add file to ZIP session',
      };
    }
  }

  /**
   * Trigger ZIP creation from all added files
   * POST /save/zip
   */
  async saveZip(request: SaveZipCreateRequest): Promise<SaveZipAddFileResponse> {
    try {
      const response = await this.httpClient.request<any>({
        method: 'POST',
        url: SAVE_ZIP_ENDPOINTS.ZIP,
        data: {
          task_id: request.taskId,
          zip_name: request.zipName,
        },
        timeout: this.config.saveZip?.timeout || 15000,
      });

      const data = response.data || response;

      if (data.error) {
        return {
          success: false,
          error: data.error,
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create ZIP',
      };
    }
  }

  /**
   * Poll ZIP creation status
   * GET /save/status/{taskId}
   */
  async saveStatus(taskId: string): Promise<SaveZipStatusResponse> {
    try {
      const response = await this.httpClient.request<any>({
        method: 'GET',
        url: `${SAVE_ZIP_ENDPOINTS.STATUS}/${taskId}`,
        timeout: this.config.saveZip?.timeout || 10000,
      });

      const data = response.data || response;

      return {
        status: data.status || 'failed',
        zipUrl: data.zip_url || null,
        zipSize: data.zip_size || null,
        downloaded: data.downloaded || 0,
        total: data.total || 0,
        failed: data.failed || 0,
        error: data.error || null,
      };
    } catch (error: any) {
      return {
        status: 'failed',
        zipUrl: null,
        zipSize: null,
        downloaded: 0,
        total: 0,
        failed: 0,
        error: error.message || 'Failed to get ZIP status',
      };
    }
  }
}

/**
 * Factory function for SaveZipService
 */
export function createSaveZipService(httpClient: IHttpClient, config: any): ISaveZipService {
  return new SaveZipService(httpClient, config);
}
