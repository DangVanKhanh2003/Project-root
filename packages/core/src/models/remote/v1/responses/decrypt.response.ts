/**
 * API v1 Decrypt Response Models
 */

/**
 * Decrypt single URL response data (from API)
 */
export interface DecryptResponseData {
  status: string; // 'ok' for success
  original_url?: string; // Decrypted URL (when success)
  message?: string; // Error message (when failed)
  reason?: string; // Error reason code
}

/**
 * Decrypt single URL response wrapper
 */
export interface DecryptResponse {
  success?: boolean;
  data?: DecryptResponseData;
  status?: string;
  original_url?: string;
  message?: string;
  reason?: string;
  jwt?: string; // JWT token for future requests
}

/**
 * Decrypt list response data (inside wrapper)
 */
export interface DecryptListResponseData {
  results: DecryptListResult[];
  total_count: number;
  success_count: number;
  error_count: number;
}

/**
 * Decrypt list response wrapper
 */
export interface DecryptListResponse {
  success?: boolean;
  data?: DecryptListResponseData;
  jwt?: string; // JWT token for future requests
}

export interface DecryptListResult {
  index: number; // Index in original array
  success: boolean;
  url?: string; // Decrypted URL (only if success = true)
  error?: string; // Error message (only if success = false)
}
