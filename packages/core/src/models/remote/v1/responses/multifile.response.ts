/**
 * API v1 Multifile Download Response Models
 */

import { MultifileSessionStatusType } from '../../constants';

/**
 * Multifile start response data (inside wrapper)
 */
export interface MultifileStartResponseData {
  status: 'ok';
  session_id: string; // UUID
  stream_url: string; // SSE stream URL path
  expires_at: string; // ISO date-time
}

/**
 * Multifile status response data (inside wrapper)
 */
export interface MultifileStatusResponseData {
  status: 'ok';
  session_id: string; // UUID
  session_status: MultifileSessionStatusType;
  progress: {
    decrypt_progress: MultifileProgress;
    download_progress: MultifileProgress;
    zip_progress: MultifileProgress;
    overall_progress: MultifileProgress;
  };
  stats: {
    decrypted_count: number;
    downloaded_count: number;
    error_count: number;
    total_size: number;
  };
  download_url?: string; // Available when completed
  created_at: string; // ISO date-time
  expires_at: string; // ISO date-time
}

export interface MultifileProgress {
  current: number;
  total: number;
  percentage: number;
}

/**
 * Multifile stream response (SSE - Server-Sent Events)
 * Returns text/event-stream, not JSON
 */
export type MultifileStreamResponse = string; // SSE stream
