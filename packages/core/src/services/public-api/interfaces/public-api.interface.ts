/**
 * YouTube Public API Service Interface
 */

import type { YouTubeMetadataDto } from '../../../models/dto/youtube.dto';

/**
 * YouTube Public API service interface
 */
export interface IYouTubePublicApiService {
  getMetadata(url: string): Promise<YouTubeMetadataDto>;
}
