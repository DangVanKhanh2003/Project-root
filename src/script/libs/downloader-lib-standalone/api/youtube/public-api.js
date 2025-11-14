import * as utils from '../../utils/common.js';
import { createClient } from './httpClient.js';

const OEMBED_API_URL = 'https://www.youtube.com';
const OEMBED_TIMEOUT = 7000;

/**
 * WHY: Extract YouTube video ID from various URL formats including Music, country domains, oEmbed, and flexible query params
 * CONTRACT: url:string → string (11-char video ID) | throws
 * PRE: url is string; no network/auth required
 * POST: Returns validated 11-char video ID; throws on invalid input with specific reason
 * EDGE: Invalid URL → throw 'invalid_url_format'; Non-YouTube domain → throw 'invalid_domain'; Missing video ID → throw 'missing_video_id'; Invalid ID format → throw 'invalid_video_id_format'; oEmbed max recursion depth = 2
 * USAGE: extractYouTubeVideoId("https://music.youtube.com/watch?v=dQw4w9WgXcQ") → "dQw4w9WgXcQ"; extractYouTubeVideoId("https://youtube.co.uk/watch?v=dQw4w9WgXcQ") → "dQw4w9WgXcQ"; extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ") → "dQw4w9WgXcQ"; extractYouTubeVideoId("https://youtube.com/oembed?url=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ") → "dQw4w9WgXcQ"
 */
function extractYouTubeVideoId(url, depth = 0) {
  const sanitized = utils.sanitise(url);

  // Prevent infinite recursion for oEmbed URLs
  if (depth > 2) {
    throw {
      status: 0,
      message: 'Maximum recursion depth exceeded while extracting video ID',
      reason: 'max_recursion_depth',
      url: sanitized.substring(0, 100),
    };
  }

  // Parse URL using URL API for robust handling
  let parsedUrl;
  try {
    parsedUrl = new URL(sanitized);
  } catch (e) {
    throw {
      status: 0,
      message: `Invalid URL format: ${e.message}`,
      reason: 'invalid_url_format',
      url: sanitized.substring(0, 100),
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname;

  // Handle oEmbed wrapper URLs (e.g., youtube.com/oembed?url=...)
  if (pathname === '/oembed') {
    const nestedUrl = parsedUrl.searchParams.get('url');
    if (!nestedUrl) {
      throw {
        status: 0,
        message: 'oEmbed URL missing required "url" parameter',
        reason: 'missing_oembed_url_param',
        url: sanitized.substring(0, 100),
      };
    }

    try {
      const decodedUrl = decodeURIComponent(nestedUrl);
      return extractYouTubeVideoId(decodedUrl, depth + 1);
    } catch (e) {
      throw {
        status: 0,
        message: `Failed to decode oEmbed URL parameter: ${e.message}`,
        reason: 'invalid_oembed_url',
        url: sanitized.substring(0, 100),
      };
    }
  }

  // Validate YouTube domain (flexible: youtube.com, music.youtube.com, youtube.co.uk, youtu.be, etc.)
  const isYouTubeDomain = (
    hostname === 'youtu.be' ||
    hostname === 'youtube.com' ||
    hostname.endsWith('.youtube.com') ||
    hostname.endsWith('.youtu.be') ||
    /youtube\.(com?\.)?[a-z]{2,}$/i.test(hostname) // Matches youtube.co.uk, youtube.fr, etc.
  );

  if (!isYouTubeDomain) {
    throw {
      status: 0,
      message: `Not a YouTube URL: ${hostname}`,
      reason: 'invalid_domain',
      url: sanitized.substring(0, 100),
    };
  }

  // Helper function to validate video ID format
  const isValidVideoId = (id) => /^[a-zA-Z0-9_-]{11}$/.test(id);

  // Try to extract video ID from query parameter "v"
  const videoIdFromQuery = parsedUrl.searchParams.get('v');
  if (videoIdFromQuery) {
    if (isValidVideoId(videoIdFromQuery)) {
      return videoIdFromQuery;
    } else {
      throw {
        status: 0,
        message: `Invalid video ID format in query parameter: ${videoIdFromQuery}`,
        reason: 'invalid_video_id_format',
        url: sanitized.substring(0, 100),
      };
    }
  }

  // Fallback: Extract video ID from pathname (youtu.be/ID, /shorts/ID, /embed/ID, /live/ID, /v/ID)
  const pathSegments = pathname.split('/').filter(Boolean);

  if (pathSegments.length > 0) {
    // For youtu.be/VIDEO_ID (short links)
    if (hostname === 'youtu.be' && pathSegments.length >= 1) {
      const potentialId = pathSegments[0];
      if (isValidVideoId(potentialId)) {
        return potentialId;
      }
    }

    // For youtube.com/shorts/VIDEO_ID, /embed/VIDEO_ID, /live/VIDEO_ID, /v/VIDEO_ID
    if (pathSegments.length >= 2) {
      const pathType = pathSegments[0].toLowerCase();
      if (['shorts', 'embed', 'live', 'v'].includes(pathType)) {
        const potentialId = pathSegments[1];
        if (isValidVideoId(potentialId)) {
          return potentialId;
        }
      }
    }
  }

  // No valid video ID found
  throw {
    status: 0,
    message: 'Could not extract video ID from YouTube URL',
    reason: 'missing_video_id',
    url: sanitized.substring(0, 100),
  };
}

/**
 * Creates YouTube Public API service (oEmbed).
 * @param {object} config - Service configuration.
 * @returns {object} An object with getMetadata method.
 */
export function createYouTubePublicApiService(config = {}) {
  const http = createClient({
    apiBaseUrl: OEMBED_API_URL,
    timeout: config.timeout || OEMBED_TIMEOUT,
  });

  /**
   * WHY: Fetch basic YouTube video metadata from public oEmbed API (no auth required)
   * CONTRACT: url:string → Promise<{title, author_name, author_url, thumbnail_url, ...}> | throws
   * PRE: url is valid YouTube URL; network access; no authentication needed
   * POST: Returns raw oEmbed response; không modify state; không cache; auto retry once on network/5xx errors
   * EDGE: Invalid URL → throw validation error; network timeout → auto retry once then throw; API down → throw; 4xx errors → no retry
   * USAGE: await getMetadata("https://youtube.com/watch?v=...");
   */
  async function getMetadata(url) {
    const videoId = extractYouTubeVideoId(url);
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

    let lastError = null;
    const maxRetries = 2; // 1 initial + 1 retry

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await http.request({
          method: 'GET',
          url: '/oembed',
          data: {
            url: watchUrl,
            format: 'json'
          },
          timeout: OEMBED_TIMEOUT,
        });

        return response; // Success
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx - invalid video, not found, private)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Retry on network errors and 5xx server errors
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        }
      }
    }

    // All retries exhausted
    throw lastError;
  }

  return {
    getMetadata,
  };
}

// Export the video ID extraction function for use in other modules
export { extractYouTubeVideoId };
