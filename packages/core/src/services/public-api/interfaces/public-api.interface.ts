/**
 * YouTube Public API Service Interface
 */

import type { YouTubeMetadataDto } from '../../../models/dto/youtube.dto';

// ... imports

/**
 * YouTube Public API service interface
 */
export interface IYouTubePublicApiService {
  getMetadata(url: string): Promise<YouTubeMetadataDto>;
  getSuggestions(query: string): Promise<string[]>;
}
