/**
 * YouTube URL Validator
 * Validates if a given URL is a YouTube URL
 */

import { YOUTUBE_API_CONSTANTS } from './constants';

/**
 * Check if URL is a YouTube URL
 * @param url - URL to check
 * @returns True if YouTube URL
 */
export function isYouTubeUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  const normalizedUrl = url.toLowerCase();

  return YOUTUBE_API_CONSTANTS.YOUTUBE_DOMAINS.some(domain =>
    normalizedUrl.includes(domain)
  );
}
