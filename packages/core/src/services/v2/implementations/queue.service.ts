/**
 * Queue Service Implementation (V2)
 * Handles video queue operations (fire-and-forget analytics)
 */

import type { IQueueService } from '../interfaces/queue.interface';
import { BaseService } from '../../base/base-service';
import { QUEUE_ENDPOINTS } from '../../constants/endpoints';
import { getTimeout } from '../../../config/api-config.interface';

/**
 * Queue Service Implementation
 * Extends BaseService for centralized request handling
 */
class QueueServiceImpl extends BaseService implements IQueueService {
  /**
   * Add YouTube video to extraction queue
   * Fire-and-forget notification to server for analytics
   *
   * @param videoId - YouTube video ID
   * @returns True if successfully sent, false otherwise (silent failure)
   */
  async addVideoToQueue(videoId: string): Promise<boolean> {
    try {
      // Skip if video ID is invalid
      if (!videoId || typeof videoId !== 'string' || !videoId.trim()) {
        return false;
      }

      // Send to queue API (fire-and-forget)
      await this.makeRequest({
        method: 'POST',
        url: QUEUE_ENDPOINTS.ADD_VIDEO_QUEUE,
        data: { videoId },
        timeout: getTimeout(this.config, 'addQueue'),
      });

      return true;
    } catch (error) {
      // Silent failure - log error but don't block main flow
      return false;
    }
  }
}

/**
 * Create queue service
 *
 * @param httpClient - HTTP client instance for queue API
 * @param config - API configuration
 * @returns Queue service instance
 */
export function createQueueService(
  httpClient: any,
  config: any
): IQueueService {
  return new QueueServiceImpl(httpClient, config);
}
