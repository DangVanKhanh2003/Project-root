/**
 * Feedback Service Implementation (V1)
 * Handles user feedback submission
 */

import type { FeedbackResponse } from '../../../models/remote/v1/responses/feedback.response';
import type { FeedbackRequest, FeedbackWidgetRequest } from '../../../models/remote/v1/requests/feedback.request';
import type { IFeedbackService } from '../interfaces/feedback.interface';
import { BaseService } from '../../base/base-service';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { getTimeout } from '../../../config/api-config.interface';

/**
 * Feedback Service Implementation
 * Extends BaseService for centralized request handling
 */
class FeedbackServiceImpl extends BaseService implements IFeedbackService {
  /**
   * Send user feedback to the server
   *
   * @param params - Feedback request parameters
   * @returns Response from the API
   * @throws Error if star rating is invalid or no content provided
   */
  async sendFeedback(params: FeedbackRequest): Promise<FeedbackResponse> {
    // Validate star rating - Relaxed for suggestions (isRating: false)
    if (params.isRating !== false) {
      if (typeof params.star !== 'number' || params.star < 1 || params.star > 5) {
        throw new Error('Invalid star rating. Must be between 1 and 5.');
      }
    }

    // Sanitize inputs
    const sanitizedTitle = params.title?.trim() || '';
    const sanitizedDescription = params.description?.trim() || '';

    // At least one field must be provided
    if (!sanitizedTitle && !sanitizedDescription) {
      throw new Error('At least one field (title or description) must be provided.');
    }

    const response = await this.makeRequest<FeedbackResponse>({
      method: 'POST',
      url: API_ENDPOINTS.FEEDBACK,
      data: {
        star: params.star,
        title: sanitizedTitle,
        description: sanitizedDescription,
        email: params.email,
        page: params.page,
        isRating: params.isRating,
      },
      timeout: getTimeout(this.config, 'feedback'),
    });

    return response;
  }

  /**
   * Specialized method for the feedback widget (suggestions/ideas)
   * Matches ytmp3.gg exact logic but implemented in core.
   */
  async sendFeedbackWidget(params: FeedbackWidgetRequest): Promise<FeedbackResponse> {
    const metaParts: string[] = [];
    if (params.link) metaParts.push(`link: ${String(params.link).trim()}`);

    if (params.state !== undefined && params.state !== null) {
      try {
        metaParts.push(`state: ${JSON.stringify(params.state)}`);
      } catch {
        // Silent catch for serialization
      }
    }

    const descriptionWithMeta = metaParts.length > 0
      ? `${params.description}\n\nMeta-data: ${metaParts.join(', ')}`
      : params.description;

    return this.sendFeedback({
      star: null,
      title: params.title || 'Feedback Widget',
      description: descriptionWithMeta,
      email: params.email,
      page: params.page || '/',
      isRating: false,
    });
  }
}

/**
 * Create feedback service
 *
 * @param httpClient - HTTP client instance
 * @param config - API configuration
 * @returns Feedback service instance
 */
export function createFeedbackService(
  httpClient: any,
  config: any
): IFeedbackService {
  return new FeedbackServiceImpl(httpClient, config);
}
