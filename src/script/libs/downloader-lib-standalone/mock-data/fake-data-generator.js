/**
 * Fake Data Generator for Video Details
 * Generates immediate fake/mock data for YouTube videos to improve UX
 * Provides instant UI rendering while background API calls complete
 */

import { extractYouTubeVideoId } from '../api/youtube/public-api.js';
import { generateYoutubeThumbnail } from '../../../utils.js';
import { getAllFormats } from '../api/youtube/constants.js';

/**
 * Generate fake video detail object for immediate UI rendering
 * Creates mock data structure matching API response format
 */
export function generateFakeVideoDetail(url, context = {}) {
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided for fake data generation');
    }

    let videoId = null;

    try {
        videoId = extractYouTubeVideoId(url);
    } catch (error) {
        // If we can't extract video ID, this might not be a YouTube URL
        // Let the normal workflow handle it
        throw new Error('Cannot generate fake data for non-YouTube URL');
    }

    const title = generateFallbackTitle(context, url, videoId);
    const thumbnail = generateYoutubeThumbnail(videoId);
    const formats = generateFakeFormats(videoId); // Pass videoId to add to formats

    return {
        meta: {
            vid: videoId,
            title: title,
            author: 'Loading...', // Will be updated by background API
            thumbnail: thumbnail,
            duration: '--:--', // Will be updated by background API
            source: 'YouTube',
            originalUrl: url, // Store for retry/resubmit functionality
            isFakeData: true, // Flag to indicate this is placeholder data
        },
        formats: formats,
        gallery: null, // YouTube single videos don't have galleries
    };
}

/**
 * Generate fallback title using 3-tier strategy from specification
 * Tier 1: From search results context
 * Tier 2: Clean URL without protocol
 * Tier 3: Generic format with video ID
 */
export function generateFallbackTitle(context, url, videoId) {
    // Tier 1: Use title from search results if available
    if (context.fromSearchResults && context.originalTitle) {
        return context.originalTitle;
    }

    // Tier 2: Clean URL display (remove protocol)
    if (url) {
        const cleanUrl = url.replace(/^https?:\/\//, '');

        // Make it more presentable - truncate if too long
        if (cleanUrl.length > 60) {
            return cleanUrl.substring(0, 57) + '...';
        }
        return cleanUrl;
    }

    // Tier 3: Generic fallback with video ID
    return `YouTube Video (${videoId})`;
}

/**
 * Generate fake format options using pre-defined constants
 * Uses constants from youtube-data-constants.js for better performance
 * @param {string} videoId - YouTube video ID for extract v2 API
 */
export function generateFakeFormats(videoId) {
    const { videoFormats, audioFormats } = getAllFormats(videoId);

    return {
        video: videoFormats,
        audio: audioFormats
    };
}

// Helper functions removed - using pre-defined constants from youtube-data-constants.js

/**
 * Utility wrapper for video ID detection
 * Safely extracts YouTube video ID with error handling
 */
export function detectVideoIdFromUrl(url) {
    try {
        return extractYouTubeVideoId(url);
    } catch (error) {
        return null;
    }
}

/**
 * Check if URL is eligible for fake data generation
 * Only YouTube URLs can use fake data workflow
 */
export function canGenerateFakeData(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }

    // Check if it's a YouTube URL by trying to extract video ID
    const videoId = detectVideoIdFromUrl(url);
    return videoId !== null;
}

/**
 * Create context object for title generation
 * Helper to structure context data for fallback title logic
 */
export function createTitleContext(fromSearchResults = false, originalTitle = null) {
    return {
        fromSearchResults,
        originalTitle,
    };
}