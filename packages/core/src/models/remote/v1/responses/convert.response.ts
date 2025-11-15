/**
 * API v1 Convert Response Models
 */

/**
 * Convert/Check-task response data (inside wrapper)
 * Both endpoints return the same structure
 */
export interface ConvertResponseData {
  status: 'ok';
  mess: string; // Message
  c_status: string; // Conversion status: "PENDING", "CONVERTING", "CONVERTED", "FAILED"
  vid: string; // Video ID
  title?: string; // Video title
  ftype?: string; // Format type (e.g., "mp4")
  fquality?: string; // Quality (e.g., "360", "720", "1080")
  dlink?: string; // Download link (when c_status = "CONVERTED")
  b_id?: string; // Batch ID for polling (when not converted yet)
}

/**
 * Alias for check-task (same structure)
 */
export type CheckTaskResponseData = ConvertResponseData;
