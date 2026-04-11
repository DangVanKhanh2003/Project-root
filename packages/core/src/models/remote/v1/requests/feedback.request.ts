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
  star?: number | null; // Rating from 1 to 5, or null if isRating is false
  title?: string;
  description?: string;
  email?: string;
  page?: string;
  isRating?: boolean;
}

/**
 * Feedback request from the widget (suggestion/idea)
 */
export interface FeedbackWidgetRequest {
  title?: string;
  description: string;
  page?: string;
  email?: string;
  link?: string;
  state?: any; // Snapshot for context
}
