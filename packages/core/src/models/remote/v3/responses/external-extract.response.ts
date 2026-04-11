/**
 * External Extract API Response
 * cc.ytconvert.org → POST /api/v2/download
 */

export interface ExternalExtractResponse {
  /** 'completed' | 'error' */
  status: string;
  /** Direct download URL (when completed) */
  downloadUrl?: string;
  /** Suggested filename */
  filename?: string;
  /** Video/audio title */
  title?: string;
  /** Duration in seconds */
  duration?: number;
  /** True if requested quality was unavailable and a fallback was used */
  qualityChanged?: boolean;
  /** Actual quality used */
  selectedQuality?: string;
  /** Originally requested quality */
  requestedQuality?: string;
}
