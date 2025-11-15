/**
 * API v1 Feedback Request Models
 */

/**
 * Submit user feedback
 * POST /api/v1/feedback
 *
 * At least one field (title or description) must be provided
 */
export interface FeedbackRequest {
  title: string;
  description: string;
}
