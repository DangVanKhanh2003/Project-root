/**
 * Save ZIP Service Interface (V3)
 * Server-side ZIP session management for mobile batch downloads
 *
 * Flow: saveInit() → saveAddFile() (repeat) → saveZip() → saveStatus() (poll)
 */

// ========================================
// Request Types
// ========================================

export interface SaveZipAddFileRequest {
  taskId: string;
  url: string;
}

export interface SaveZipCreateRequest {
  taskId: string;
  zipName: string;
}

// ========================================
// Response Types
// ========================================

export interface SaveZipInitResponse {
  success: boolean;
  taskId: string | null;
  error?: string;
}

export interface SaveZipAddFileResponse {
  success: boolean;
  error?: string;
}

export interface SaveZipStatusResponse {
  status: 'downloading' | 'zipping' | 'done' | 'failed';
  zipUrl: string | null;
  zipSize: number | null;
  downloaded: number;
  total: number;
  failed: number;
  error?: string | null;
}

// ========================================
// Service Interface
// ========================================

export interface ISaveZipService {
  /**
   * Initialize a server-side ZIP session
   * POST /save/init
   * @returns Session with taskId
   */
  saveInit(): Promise<SaveZipInitResponse>;

  /**
   * Add a file to the ZIP session (server downloads it)
   * POST /save/add
   * @param request - taskId + download URL
   */
  saveAddFile(request: SaveZipAddFileRequest): Promise<SaveZipAddFileResponse>;

  /**
   * Trigger ZIP creation from all added files
   * POST /save/zip
   * @param request - taskId + desired ZIP filename
   */
  saveZip(request: SaveZipCreateRequest): Promise<SaveZipAddFileResponse>;

  /**
   * Poll ZIP creation status
   * GET /save/status/{taskId}
   * @param taskId - Session ID to check
   */
  saveStatus(taskId: string): Promise<SaveZipStatusResponse>;
}
