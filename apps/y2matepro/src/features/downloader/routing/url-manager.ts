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
  format?: string;  // f param: mp3, mp4, etc.
  quality?: string; // q param: 320, 1080, etc.
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
    const format = searchParams.get('f');  // mp3, mp4, etc.
    const quality = searchParams.get('q'); // 320, 1080, etc.

    // Validate videoId format if present
    if (videoId && isValidVideoId(videoId)) {
      return {
        type: 'video',
        videoId,
        format: format || undefined,
        quality: quality || undefined
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
 *
 * Preserves current pathname (e.g., /youtube-to-mp4.html → /youtube-to-mp4/search?v=xxx)
 *
 * @param videoId - YouTube video ID
 */
export function navigateToVideo(videoId: string): void {
  const currentRoute = getRouteFromUrl();

  // Get current pathname and preserve it
  let basePath = window.location.pathname;

  // Remove .html extension if present
  basePath = basePath.replace(/\.html$/, '');

  // Remove trailing slash
  basePath = basePath.replace(/\/$/, '');

  // Remove existing /search suffix (legacy URLs)
  basePath = basePath.replace(/\/search$/, '');

  // Build new URL: keep current path + /search + query param
  // e.g. /youtube-to-mp4/search?v=xxx, /es/youtube-to-mp3/search?v=xxx
  const newUrl = (basePath === '' || basePath === '/' || basePath === '/index')
    ? `/search?v=${videoId}`
    : `${basePath}/search?v=${videoId}`;

  const state = { type: 'video', videoId };

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
 *
 * @param route - Route to set
 */
export function replaceUrl(route: Route): void {
  const state = { type: route.type };

  if (route.type === 'video' && route.videoId) {
    // Keep current path, only update query param
    let basePath = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '').replace(/\/search$/, '');
    if (basePath === '' || basePath === '/' || basePath === '/index') {
      basePath = '/';
    }
    const url = `${basePath}/search?v=${route.videoId}`;
    history.replaceState(state, '', url);
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
  const params = new URLSearchParams(window.location.search);
  const videoId = params.get('v');

  // Check if there are extra params
  if (params.size > 1 || (params.size === 1 && !videoId)) {
    // Has extra params → Clean URL
    if (videoId) {
      replaceUrl({ type: 'video', videoId });
    } else {
      replaceUrl({ type: 'home' });
    }
    return true;
  }

  return false;
}
