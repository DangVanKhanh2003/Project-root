/**
 * YouTube URL Validator
 *
 * Utility functions for validating YouTube URLs and video IDs.
 * Provides both loose (UX-friendly) and strict validation modes.
 */

const YOUTUBE_HOSTS = [
  'youtube.com',
  'youtube-nocookie.com',
  'youtu.be'
] as const;

const CONTENT_PATHS = ['watch', 'shorts', 'embed', 'v', 'live', 'playlist'] as const;

const VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

/**
 * Check if hostname is a YouTube domain
 */
function isYouTubeHost(host: string): boolean {
  const h = host.toLowerCase();
  return YOUTUBE_HOSTS.some(
    yt => h === yt || h.endsWith(`.${yt}`)
  );
}

/**
 * Parse URL safely, adding https:// if missing
 */
function parseUrl(input: string): URL | null {
  if (!input || typeof input !== 'string') return null;

  const s = input.trim();
  try {
    return new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
}

/**
 * Validate YouTube video ID format (11 characters, alphanumeric + _ -)
 */
export function isValidVideoId(id: string | null | undefined): boolean {
  return VIDEO_ID_REGEX.test(id || '');
}

/**
 * Loose YouTube URL validator - minimizes false negatives
 *
 * Accepts common YouTube hosts and typical paths/params without requiring
 * strict VIDEO_ID extraction. Prefer this for UX-friendly validation.
 *
 * @param input - URL string to validate
 * @returns true if input looks like a YouTube URL
 */
export function isYouTubeUrl(input: string): boolean {
  const u = parseUrl(input);
  if (!u) return false;

  const host = u.hostname.toLowerCase();
  if (!isYouTubeHost(host)) return false;

  const hasParam = (name: string) => u.searchParams.has(name);
  const pathParts = u.pathname.split('/').filter(Boolean);
  const first = pathParts[0] || '';

  // Signals of video or playlist intent
  const signals = (
    // youtu.be short link typically has /:id
    (host === 'youtu.be' && pathParts.length >= 1) ||
    // common content paths
    (CONTENT_PATHS as readonly string[]).includes(first) ||
    // query params frequently used
    hasParam('v') || hasParam('list')
  );

  if (signals) return true;

  // Special wrapper: /attribution_link?u=%2Fwatch%3Fv%3D...
  if (u.pathname.startsWith('/attribution_link')) {
    const inner = u.searchParams.get('u');
    if (inner) {
      try {
        const decoded = decodeURIComponent(inner);
        const iu = new URL('https://youtube.com' + (decoded.startsWith('/') ? decoded : `/${decoded}`));
        if (iu.searchParams.has('v') || iu.searchParams.has('list')) return true;
        const ip = iu.pathname.split('/').filter(Boolean);
        if (ip.length && (CONTENT_PATHS as readonly string[]).includes(ip[0])) return true;
      } catch {
        // ignore parse errors
      }
    }
  }

  // Fallback: allow any page on YouTube hosts
  // Biases toward avoiding false negatives
  return true;
}

/**
 * Strict YouTube URL validator
 *
 * Requires a valid 11-char video ID or a playlist `list` param.
 * Use when you need to ensure the URL points to actual content.
 *
 * @param input - URL string to validate
 * @returns true if input is a valid YouTube video/playlist URL
 */
export function isYouTubeUrlStrict(input: string): boolean {
  const u = parseUrl(input);
  if (!u) return false;

  const host = u.hostname.toLowerCase();
  if (!isYouTubeHost(host)) return false;

  const params = u.searchParams;

  // Playlist accepted
  if (params.has('list')) return true;

  const pathParts = u.pathname.split('/').filter(Boolean);

  // youtu.be/:id
  if (host === 'youtu.be' && pathParts.length >= 1 && isValidVideoId(pathParts[0])) {
    return true;
  }

  // /shorts|embed|v|live/:id
  if (pathParts.length >= 2) {
    const contentPaths = ['shorts', 'embed', 'v', 'live'];
    if (contentPaths.includes(pathParts[0]) && isValidVideoId(pathParts[1])) {
      return true;
    }
  }

  // watch?v=:id
  if (isValidVideoId(params.get('v'))) return true;

  // attribution wrapper
  if (u.pathname.startsWith('/attribution_link')) {
    const inner = u.searchParams.get('u');
    if (inner) {
      try {
        const iu = new URL('https://youtube.com' + decodeURIComponent(inner).replace(/^[/?]+/, '/'));
        const ip = iu.pathname.split('/').filter(Boolean);
        if (isValidVideoId(iu.searchParams.get('v'))) return true;
        if (ip.length >= 2 && ['shorts', 'embed', 'v', 'live'].includes(ip[0]) && isValidVideoId(ip[1])) {
          return true;
        }
        if (iu.searchParams.has('list')) return true;
      } catch {
        // ignore parse errors
      }
    }
  }

  return false;
}

/**
 * Extract video ID from YouTube URL
 *
 * @param input - YouTube URL
 * @returns 11-char video ID or null
 */
export function extractVideoId(input: string): string | null {
  const u = parseUrl(input);
  if (!u) return null;

  const host = u.hostname.toLowerCase();
  if (!isYouTubeHost(host)) return null;

  const pathParts = u.pathname.split('/').filter(Boolean);

  // youtu.be/:id
  if (host === 'youtu.be' && pathParts.length >= 1 && isValidVideoId(pathParts[0])) {
    return pathParts[0];
  }

  // /shorts|embed|v|live/:id
  if (pathParts.length >= 2) {
    const contentPaths = ['shorts', 'embed', 'v', 'live'];
    if (contentPaths.includes(pathParts[0]) && isValidVideoId(pathParts[1])) {
      return pathParts[1];
    }
  }

  // watch?v=:id
  const vParam = u.searchParams.get('v');
  if (isValidVideoId(vParam)) return vParam;

  // attribution wrapper
  if (u.pathname.startsWith('/attribution_link')) {
    const inner = u.searchParams.get('u');
    if (inner) {
      try {
        const iu = new URL('https://youtube.com' + decodeURIComponent(inner).replace(/^[/?]+/, '/'));
        const ip = iu.pathname.split('/').filter(Boolean);
        const ivParam = iu.searchParams.get('v');
        if (isValidVideoId(ivParam)) return ivParam;
        if (ip.length >= 2 && ['shorts', 'embed', 'v', 'live'].includes(ip[0]) && isValidVideoId(ip[1])) {
          return ip[1];
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  return null;
}

/**
 * Extract playlist ID from YouTube URL
 *
 * @param input - YouTube URL
 * @returns Playlist ID or null
 */
export function extractPlaylistId(input: string): string | null {
  const u = parseUrl(input);
  if (!u) return null;

  const host = u.hostname.toLowerCase();
  if (!isYouTubeHost(host)) return null;

  // Direct list param
  const listParam = u.searchParams.get('list');
  if (listParam) return listParam;

  // attribution wrapper
  if (u.pathname.startsWith('/attribution_link')) {
    const inner = u.searchParams.get('u');
    if (inner) {
      try {
        const iu = new URL('https://youtube.com' + decodeURIComponent(inner).replace(/^[/?]+/, '/'));
        const iList = iu.searchParams.get('list');
        if (iList) return iList;
      } catch {
        // ignore parse errors
      }
    }
  }

  return null;
}

export interface VideoExistsResult {
  exists: boolean;
  error?: string;
}

/**
 * Check if YouTube video exists by verifying thumbnail availability
 *
 * Uses HEAD request to YouTube thumbnail server - fast and no auth needed.
 * Gracefully degrades on network errors.
 *
 * @param videoId - 11-char YouTube video ID
 * @returns Promise with exists status and optional error
 */
export async function checkVideoExists(videoId: string): Promise<VideoExistsResult> {
  if (!isValidVideoId(videoId)) {
    return { exists: false, error: 'Invalid video ID format' };
  }

  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/0.jpg`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(thumbnailUrl, {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Valid video: 200 + content-type: image/jpeg
    if (response.ok && response.headers.get('content-type') === 'image/jpeg') {
      return { exists: true };
    }

    return { exists: false, error: 'Video not found or unavailable' };

  } catch (error) {
    // Graceful degradation - let main API handle verification
    if ((error as Error).name === 'AbortError') {
      return { exists: true, error: 'Thumbnail check timeout - proceeding anyway' };
    }

    return { exists: true, error: 'Network error - skipping validation' };
  }
}
