/**
 * Queue Service Interface (V2)
 */

/**
 * Queue service interface
 */
export interface IQueueService {
  addVideoToQueue(videoId: string): Promise<boolean>;
}
