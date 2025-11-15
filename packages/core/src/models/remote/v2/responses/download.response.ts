/**
 * API v2 Download Response Models
 * YouTube Stream API
 */

import { DownloadProgressStatusType } from '../../constants';

/**
 * Stream response (download in progress)
 * Status: 'stream'
 */
export interface StreamResponse {
  status: 'stream';
  url: string; // Streaming URL
  filename: string; // Suggested filename
  progressUrl?: string; // Real-time progress tracking URL (full URL with domain)
}

/**
 * Static response (cached file)
 * Status: 'static'
 */
export interface StaticResponse {
  status: 'static';
  url: string; // Direct download URL (cached, encrypted params)
  filename: string; // Suggested filename
}

/**
 * Error response
 * Status: 'error'
 */
export interface ErrorResponse {
  status: 'error';
  error: {
    code: string; // e.g., "error.api.invalid_body", "error.api.fetch.critical.core"
    context?: {
      issues?: {
        path: string[];
        message: string;
      }[];
    };
  };
  critical?: boolean; // True for critical errors
}

/**
 * Union type for download responses
 */
export type DownloadResponse = StreamResponse | StaticResponse | ErrorResponse;

/**
 * Progress response
 * GET /api/download/progress/{cacheId}
 */
export interface ProgressResponse {
  cacheId: string;
  videoProgress: number | null; // 0-100 or null if no video
  audioProgress: number | null; // 0-100 or null if no audio
  status: DownloadProgressStatusType;
  mergedUrl?: string | null; // Available if autoMerge=true and merge completed (60min expiry)
  error?: string; // Error message if status = 'error'
}

/**
 * Progress error response
 */
export interface ProgressErrorResponse {
  error: string; // e.g., "Invalid cache ID format"
}
