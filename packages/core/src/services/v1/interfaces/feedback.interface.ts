/**
 * Feedback Service Interface (V1)
 */

import type { FeedbackResponse } from '../../../models/remote/v1/responses/feedback.response';
import type { FeedbackRequest, FeedbackWidgetRequest } from '../../../models/remote/v1/requests/feedback.request';

/**
 * Feedback service interface
 */
export interface IFeedbackService {
  sendFeedback(params: FeedbackRequest): Promise<FeedbackResponse>;
  sendFeedbackWidget(params: FeedbackWidgetRequest): Promise<FeedbackResponse>;
}
