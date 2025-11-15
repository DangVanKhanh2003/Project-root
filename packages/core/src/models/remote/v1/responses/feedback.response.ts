/**
 * API v1 Feedback Response Models
 */

/**
 * Feedback response
 * Note: This endpoint returns different structure (not wrapped in success/data)
 */
export interface FeedbackResponse {
  ok: boolean;
  message?: string;
  error?: string;
}
