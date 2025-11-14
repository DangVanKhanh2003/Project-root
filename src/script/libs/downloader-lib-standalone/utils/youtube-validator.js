// Loose, domain-first validator to minimize false negatives.
// Accepts common YouTube hosts and typical paths/params without requiring
// strict VIDEO_ID extraction. Prefer this for UX-friendly validation.
export function isYouTubeUrl(input) {
  if (!input || typeof input !== 'string') return false;

  const s = input.trim();

  let u;
  try {
    // Allow inputs without scheme
    u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return false;
  }

  const host = u.hostname.toLowerCase();

  const isYoutubeHost = (
    host === 'youtube.com' || host.endsWith('.youtube.com') ||
    host === 'youtube-nocookie.com' || host.endsWith('.youtube-nocookie.com') ||
    host === 'youtu.be'
  );
  if (!isYoutubeHost) return false;

  // If it's a YouTube host, be permissive but still require a likely
  // content-indicating signal to avoid obvious non-content pages.
  const hasParam = (name) => u.searchParams.has(name);
  const pathParts = u.pathname.split('/').filter(Boolean);
  const first = pathParts[0] || '';

  // Signals of video or playlist intent (without enforcing ID shape):
  const signals = (
    // youtu.be short link typically has /:id
    (host === 'youtu.be' && pathParts.length >= 1) ||
    // common content paths
    ['watch', 'shorts', 'embed', 'v', 'live', 'playlist'].includes(first) ||
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
        // Normalize to absolute for URL constructor
        const iu = new URL('https://youtube.com' + (decoded.startsWith('/') ? decoded : `/${decoded}`));
        if (iu.searchParams.has('v') || iu.searchParams.has('list')) return true;
        const ip = iu.pathname.split('/').filter(Boolean);
        if (ip.length && ['watch', 'shorts', 'embed', 'v', 'live', 'playlist'].includes(ip[0])) return true;
      } catch {}
    }
  }

  // Fallback: allow any page on YouTube hosts to pass.
  // This biases toward avoiding false negatives at the cost of some false positives.
  return true;
}

// Optional strict helper (not used by guards by default):
// Requires a valid 11-char video id or a playlist `list` param.
export function isYouTubeUrlStrict(input) {
  if (!input || typeof input !== 'string') return false;
  let u;
  try {
    u = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return false;
  }

  const host = u.hostname.toLowerCase();
  const isYoutubeHost = (
    host === 'youtube.com' || host.endsWith('.youtube.com') ||
    host === 'youtube-nocookie.com' || host.endsWith('.youtube-nocookie.com') ||
    host === 'youtu.be'
  );
  if (!isYoutubeHost) return false;

  const isVideoId = (id) => /^[A-Za-z0-9_-]{11}$/.test(id || '');
  const params = u.searchParams;

  if (params.has('list')) return true; // playlist accepted

  const pathParts = u.pathname.split('/').filter(Boolean);
  // youtu.be/:id
  if (host === 'youtu.be' && pathParts.length >= 1 && isVideoId(pathParts[0])) return true;
  // /shorts|embed|v|live/:id
  if (pathParts.length >= 2 && ['shorts', 'embed', 'v', 'live'].includes(pathParts[0]) && isVideoId(pathParts[1])) return true;
  // watch?v=:id (v can be anywhere in the query string)
  if (isVideoId(params.get('v'))) return true;

  // attribution wrapper
  if (u.pathname.startsWith('/attribution_link')) {
    const inner = u.searchParams.get('u');
    if (inner) {
      try {
        const iu = new URL('https://youtube.com' + decodeURIComponent(inner).replace(/^[/?]+/, '/'));
        const ip = iu.pathname.split('/').filter(Boolean);
        if (isVideoId(iu.searchParams.get('v'))) return true;
        if (ip.length >= 2 && ['shorts', 'embed', 'v', 'live'].includes(ip[0]) && isVideoId(ip[1])) return true;
        if (iu.searchParams.has('list')) return true;
      } catch {}
    }
  }
  return false;
}

/**
 * WHY: Check if YouTube video exists by verifying thumbnail availability
 * CONTRACT: videoId:string → Promise<{exists:boolean, error?:string}>
 * PRE: videoId is 11-char string; network access required; no auth needed
 * POST: Returns validation result; không modify state; fast HEAD request only
 * EDGE: Invalid ID format → {exists:false, error}; Network timeout (5s) → {exists:true, error} (graceful degradation); CORS error → {exists:true, error}; 404 response → {exists:false}; 200+image/jpeg → {exists:true}
 * USAGE: await checkYouTubeVideoExists("dQw4w9WgXcQ") → {exists: true}; await checkYouTubeVideoExists("invalid123") → {exists: false, error: "Invalid video ID format"}
 */
export async function checkYouTubeVideoExists(videoId) {
  // Validate video ID format
  if (!videoId || typeof videoId !== 'string') {
    return { exists: false, error: 'Invalid video ID format' };
  }

  // Validate 11-char YouTube video ID pattern
  const isValidVideoId = /^[A-Za-z0-9_-]{11}$/.test(videoId);
  if (!isValidVideoId) {
    return { exists: false, error: 'Invalid video ID format' };
  }

  // Thumbnail URL - using 0.jpg for maximum compatibility
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/0.jpg`;

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    // HEAD request to check thumbnail without downloading
    const response = await fetch(thumbnailUrl, {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Check response status and content-type
    // Valid video: 200 + content-type: image/jpeg
    // Invalid/deleted: 404 + content-type: image/
    if (response.ok && response.headers.get('content-type') === 'image/jpeg') {
      return { exists: true };
    } else {
      return { exists: false, error: 'Video not found or unavailable' };
    }

  } catch (error) {
    // Network errors, timeout, CORS issues - gracefully degrade
    // Let the main API handle these cases with more detailed errors

    if (error.name === 'AbortError') {
      return { exists: true, error: 'Thumbnail check timeout - proceeding anyway' };
    }

    // For other network errors, assume video might exist and let API verify
    return { exists: true, error: 'Network error - skipping validation' };
  }
}
