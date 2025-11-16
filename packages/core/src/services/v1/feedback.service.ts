/**
 * Feedback Service (V1)
 * Handles user feedback submission
 */

import type { IHttpClient } from '../../http/http-client.interface';
import type { ApiConfig } from '../../config/api-config.interface';
import type { FeedbackResponse } from '../../models/remote/v1/responses/feedback.response';
import type { FeedbackRequest } from '../../models/remote/v1/requests/feedback.request';
import { API_ENDPOINTS } from '../constants/endpoints';
import { getTimeout } from '../../config/api-config.interface';

/**
 * Feedback service interface
 */
export interface IFeedbackService {
  sendFeedback(params: FeedbackRequest): Promise<FeedbackResponse>;
}

/**
 * Create feedback service
 *
 * @param httpClient - HTTP client instance
 * @param config - API configuration
 * @returns Feedback service instance
 */
export function createFeedbackService(
  httpClient: IHttpClient,
  config: ApiConfig
): IFeedbackService {
  /**
   * Send user feedback to the server
   *
   * @param params - Feedback request parameters
   * @returns Response from the API
   * @throws Error if star rating is invalid or no content provided
   */
  async function sendFeedback(params: FeedbackRequest): Promise<FeedbackResponse> {
    // Validate star rating
    if (typeof params.star !== 'number' || params.star < 1 || params.star > 5) {
      throw new Error('Invalid star rating. Must be between 1 and 5.');
    }

    // Sanitize inputs
    const sanitizedTitle = params.title?.trim() || '';
    const sanitizedDescription = params.description?.trim() || '';

    // At least one field must be provided
    if (!sanitizedTitle && !sanitizedDescription) {
      throw new Error('At least one field (title or description) must be provided.');
    }

    const response = await httpClient.request<FeedbackResponse>({
      method: 'POST',
      url: API_ENDPOINTS.FEEDBACK,
      data: {
        star: params.star,
        title: sanitizedTitle,
        description: sanitizedDescription,
      },
      timeout: getTimeout(config, 'feedback'),
    });

    return response;
  }

  return {
    sendFeedback,
  };
}
