/**
 * URL Manager - Client-Side Routing
 *
 * Handles URL-based navigation for SPA routing with History API.
 * Supports forward navigation (no reload) and backward navigation (reload).
 */

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Route type definition
 */
export interface Route {
  type: 'home' | 'video';
  videoId?: string;
  format?: string;
  quality?: string;
  audioTrack?: string;
}

/**
 * Route change callback type
 */
export type RouteChangeHandler = (route: Route) => void;

// ==========================================
// URL PARSING
// ==========================================

/**
 * Parse current URL and return route information
 *
 * @returns Route object with type and videoId (if applicable)
 */
export function getRouteFromUrl(): Route {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const videoId = searchParams.get('v');
    const format = searchParams.get('format') || undefined;
    const quality = searchParams.get('quality') || undefined;
    const audioTrack = searchParams.get('audioTrack') || undefined;

    // Validate videoId format if present
    if (videoId && isValidVideoId(videoId)) {
      return {
        type: 'video',
        videoId,
        format,
        quality,
        audioTrack
      };
    }

    // Default to home route
    return { type: 'home' };
  } catch (error) {
    console.error('Error parsing URL:', error);
    return { type: 'home' };
  }
}

/**
 * Validate YouTube video ID format
 * Must be exactly 11 characters: alphanumeric, dash, underscore
 *
 * @param videoId - Video ID to validate
 * @returns true if valid format
 */
function isValidVideoId(videoId: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

/**
 * Get current video ID from URL (helper function)
 *
 * @returns Video ID or null if not on video route
 */
export function getCurrentVideoId(): string | null {
  const route = getRouteFromUrl();
  return route.type === 'video' ? route.videoId || null : null;
}

// ==========================================
// NAVIGATION FUNCTIONS
// ==========================================

/**
 * Navigate to video result page
 * Uses replaceState if already on video page (prevents history pollution)
 * Uses pushState if coming from home page
 * Preserves language prefix from current URL
 *
 * @param videoId - YouTube video ID
 */
export function navigateToVideo(videoId: string, params?: { format?: string; quality?: string; audioTrack?: string }): void {
  // Get current pathname and preserve it
  let basePath = window.location.pathname;

  // Remove .html extension if present
  basePath = basePath.replace(/\.html$/, '');

  // Remove trailing slash (but keep root /)
  basePath = basePath.replace(/\/$/, '') || '/';

  // Remove existing /search suffix (legacy URLs)
  basePath = basePath.replace(/\/search$/, '');

  // Normalize root paths
  if (basePath === '' || basePath === '/index') {
    basePath = '/';
  }

  // Build query params
  const urlParams = new URLSearchParams();
  urlParams.set('v', videoId);

  // Add optional parameters if provided
  if (params?.format) urlParams.set('format', params.format);
  if (params?.quality) urlParams.set('quality', params.quality);
  if (params?.audioTrack) urlParams.set('audioTrack', params.audioTrack);

  // Keep current path + /search + query params
  // e.g. /download-youtube-mp4/search?v=xxx, /vi/download-youtube-mp3/search?v=xxx
  const newUrl = `${basePath}/search?${urlParams.toString()}`;
  const state = {
    type: 'video',
    videoId,
    format: params?.format,
    quality: params?.quality,
    audioTrack: params?.audioTrack
  };

  const currentRoute = getRouteFromUrl();
  if (currentRoute.type === 'video') {
    // Already on video page → Replace current entry
    history.replaceState(state, '', newUrl);
  } else {
    // Coming from home → Add new entry
    history.pushState(state, '', newUrl);
  }
}

/**
 * Navigate to home page
 * Preserves language prefix from current URL
 *
 * @param replace - Use replaceState instead of pushState (optional)
 */
export function navigateToHome(replace: boolean = false): void {
  const state = { type: 'home' };
  // Keep current page path, just remove query params
  const basePath = window.location.pathname.replace(/\/search$/, '') || '/';

  if (replace) {
    history.replaceState(state, '', basePath);
  } else {
    history.pushState(state, '', basePath);
  }
}

/**
 * Replace current URL without adding history entry
 * Useful for URL cleanup (removing extra params)
 * Preserves language prefix from current URL
 *
 * @param route - Route to set
 */
export function replaceUrl(route: Route): void {
  const state = { type: route.type };

  if (route.type === 'video' && route.videoId) {
    // Keep current path, only update query params
    let basePath = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '').replace(/\/search$/, '');
    if (basePath === '' || basePath === '/index') {
      basePath = '/';
    }

    const params = new URLSearchParams();
    params.set('v', route.videoId);
    if (route.format) params.set('format', route.format);
    if (route.quality) params.set('quality', route.quality);
    if (route.audioTrack) params.set('audioTrack', route.audioTrack);

    history.replaceState(state, '', `${basePath}/search?${params.toString()}`);
  } else {
    // Home: keep current path without query params
    const basePath = window.location.pathname.replace(/\/search$/, '');
    history.replaceState(state, '', basePath || '/');
  }
}

// ==========================================
// POPSTATE HANDLING
// ==========================================

/**
 * Initialize routing - setup popstate listener
 * Reloads page on back/forward navigation for simplicity
 * and multi-language support
 *
 * @param onRouteChange - Callback for route changes (optional, for future use)
 */
export function initRouting(onRouteChange?: RouteChangeHandler): void {
  window.addEventListener('popstate', (event) => {
    // On back/forward button → Reload page
    // This ensures:
    // 1. Multi-language routing works (server handles locale)
    // 2. Clean state reset
    // 3. No complex client-side state management needed
    window.location.reload();
  });
}

// ==========================================
// URL CLEANUP UTILITIES
// ==========================================

/**
 * Clean URL by removing extra query parameters
 * Keeps only the 'v' parameter for video routes
 *
 * @returns true if URL was cleaned (had extra params)
 */
export function cleanUrl(): boolean {
  // Logic simplified:
  // We want to keep the URL as is if it's a valid video route with supported params.
  // The 'getUrlFromRoute' logic inside replaceUrl effectively "cleans" 
  // by only including known parameters from the Route object.
  // So we just need to re-apply the current route to ensure consistency and strip unknown params.

  const currentRoute = getRouteFromUrl();
  const searchParams = new URLSearchParams(window.location.search);

  // Minimal check: if we have params but no videoId, go home
  if (searchParams.size > 0 && !currentRoute.videoId) {
    if (searchParams.has('v')) {
      // has 'v' but getRouteFromUrl returned home? invalid ID probably.
      // getRouteFromUrl handles validation.
      if (currentRoute.type === 'home') {
        replaceUrl({ type: 'home' });
        return true;
      }
    }
  }

  // If we are on a video route under any circumstance, replaceUrl will re-serialize standard params
  // stripping anything else (like fbclid, etc.)
  if (currentRoute.type === 'video') {
    replaceUrl(currentRoute);
    return true; // We always "clean" to ensure normalized order/params
  }

  // If home and has params (that aren't ignored above)
  if (currentRoute.type === 'home' && searchParams.size > 0) {
    replaceUrl({ type: 'home' });
    return true;
  }

  return false;
}
