/**
 * API v1 Multifile Download Request Models
 */

/**
 * Start multifile download session (encrypted URLs)
 * POST /api/v1/download/multifile/start
 */
export interface MultifileStartRequest {
  encrypted_urls: string[]; // Base64 encoded encrypted URLs (max 100)
}

/**
 * Start multifile download session (non-encoded URLs)
 * POST /api/v1/download/multifile-non-encode/start
 */
export interface MultifileNonEncodeStartRequest {
  urls: string[]; // Standard URLs (not encrypted)
}

/**
 * Get multifile session status
 * GET /api/v1/download/multifile/status/{sessionId}
 *
 * Note: sessionId is passed as path parameter
 */
export interface MultifileStatusRequest {
  sessionId: string; // UUID
}

/**
 * SSE stream for multifile progress
 * GET /api/v1/download/multifile/stream/{sessionId}
 *
 * Note: sessionId is passed as path parameter
 * Returns Server-Sent Events stream
 */
export interface MultifileStreamRequest {
  sessionId: string; // UUID
}
