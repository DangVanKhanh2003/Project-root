/**
 * YouTube Metadata Enhancement
 * Progressive enhancement của fake YouTube metadata via oEmbed API
 * Non-blocking background updates để improve UX without sacrificing performance
 */

import { createYouTubePublicApiService } from '../../libs/downloader-lib-standalone/remote/youtube-public-api.js';
import { getState, updateVideoDetailMetadata } from './state.js';

// Create YouTube public API service instance
const youtubePublicApi = createYouTubePublicApiService({
    timeout: 7000 // 7 second timeout for oEmbed calls
});

/**
 * Progressive enhancement of YouTube video metadata using oEmbed API
 * Fetches real title, author, and thumbnail to replace fake placeholder data
 * Runs asynchronously without blocking UI - graceful fallback on errors
 */
export async function enhanceYouTubeMetadata(url) {
    if (!url || typeof url !== 'string') {
        return;
    }


    try {
        // Fetch metadata from YouTube oEmbed API
        const oembedData = await youtubePublicApi.getMetadata(url);


        // Check if we still have video detail in state (user might have navigated away)
        const currentState = getState();
        if (!currentState.videoDetail || !currentState.videoDetail.meta.isFakeData) {
            return;
        }

        // Extract useful metadata from oEmbed response
        // NOTE: Intentionally preserving original thumbnail to prevent flashing
        const metadataUpdate = {
            title: oembedData.title || currentState.videoDetail.meta.title,
            author: oembedData.author_name || 'Unknown Channel',
            // SKIP thumbnail update to prevent flashing from 0.jpg → hqdefault.jpg
            thumbnail: currentState.videoDetail.meta.thumbnail,  // Keep original
            // Keep existing duration and source
            duration: currentState.videoDetail.meta.duration,
            source: currentState.videoDetail.meta.source,
        };

        // Update state with real metadata
        updateVideoDetailMetadata(metadataUpdate);


    } catch (error) {

        // Don't throw error - gracefully degrade to fake data
        // This ensures UI remains functional even if oEmbed API fails

        // Log specific error types for debugging
        if (error.status >= 400 && error.status < 500) {
        } else if (error.status >= 500) {
        } else {
        }

        // Keep fake data as fallback - no action needed
    }
}

/**
 * Batch enhance YouTube metadata for multiple URLs
 * Useful for playlist or batch processing scenarios
 */
export async function batchEnhanceYouTubeMetadata(urls) {
    if (!Array.isArray(urls) || urls.length === 0) {
        return;
    }


    // Process URLs sequentially to avoid overwhelming YouTube's API
    // Add small delay between requests to be respectful to the service
    for (let i = 0; i < urls.length; i++) {
        try {
            await enhanceYouTubeMetadata(urls[i]);

            // Add small delay between requests (except for last one)
            if (i < urls.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
            }
        } catch (error) {
            // Continue with next URL even if one fails
        }
    }

}

/**
 * Cancel any pending YouTube metadata enhancement
 * Useful when user navigates away or submits new request
 */
export function cancelYouTubeMetadataEnhancement() {
    // Note: Individual oEmbed requests have built-in timeout
    // No additional cancellation mechanism needed for now
    // Future enhancement: Could implement AbortController for request cancellation

}