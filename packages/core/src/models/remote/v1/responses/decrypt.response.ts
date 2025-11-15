/**
 * API v1 Decrypt Response Models
 */

/**
 * Decrypt single URL response data (inside wrapper)
 */
export interface DecryptResponseData {
  url: string; // Decrypted URL
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

export interface DecryptListResult {
  index: number; // Index in original array
  success: boolean;
  url?: string; // Decrypted URL (only if success = true)
  error?: string; // Error message (only if success = false)
}
