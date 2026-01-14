/**
 * YouTube URL Parser
 * Extracts video IDs and playlist IDs from YouTube URLs
 */

import { YOUTUBE_API_CONSTANTS } from './constants';

/**
 * Extract YouTube video ID from URL
 * Handles multiple URL formats:
 * - youtu.be/VIDEO_ID
 * - youtube.com/shorts/VIDEO_ID
 * - youtube.com/watch?v=VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 *
 * @param url - YouTube URL
 * @returns Video ID (11 characters) or null if not found
 */
export function extractYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;

  const patterns = YOUTUBE_API_CONSTANTS.VIDEO_ID_PATTERNS;

  // Priority 1: youtu.be/VIDEO_ID (short URL)
  const shortMatch = url.match(patterns.SHORT_URL);
  if (shortMatch) return shortMatch[1];

  // Priority 2: youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(patterns.SHORTS);
  if (shortsMatch) return shortsMatch[1];

  // Priority 3: youtube.com/watch?v=VIDEO_ID (standard URL)
  const watchMatch = url.match(patterns.WATCH);
  if (watchMatch) return watchMatch[1];

  // Priority 4: youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(patterns.EMBED);
  if (embedMatch) return embedMatch[1];

  return null;
}

/**
 * Extract playlist ID from YouTube URL
 * @param url - YouTube URL
 * @returns Playlist ID or null if not found
 */
export function extractPlaylistId(url: string | null | undefined): string | null {
  if (!url) return null;

  const match = url.match(YOUTUBE_API_CONSTANTS.PLAYLIST_ID_REGEX);
  return match ? match[1] : null;
}
