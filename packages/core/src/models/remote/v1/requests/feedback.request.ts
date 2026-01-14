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
  star: number; // Rating from 1 to 5
  title?: string;
  description?: string;
}
