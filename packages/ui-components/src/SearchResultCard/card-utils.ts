/**
 * Card Utilities
 * Helper functions for search result card rendering
 *
 * @module @downloader/ui-components/SearchResultCard/card-utils
 */

/**
 * Format view count for responsive display
 *
 * WHY: Display compact view count on mobile, full text on desktop
 * CONTRACT: (displayViews:string|null) → string - returns formatted views
 * PRE: displayViews can be null/undefined or string
 * POST: Returns formatted view count or empty string
 * EDGE: null/undefined → '', mobile removes ' views' suffix
 * USAGE: formatViewsForDisplay('2.3M views') → '2.3M' (mobile) or '2.3M views' (desktop)
 */
export function formatViewsForDisplay(displayViews: string | null | undefined): string {
  if (!displayViews) return '';

  // Mobile: Remove " views" suffix (e.g., "2.3M views" → "2.3M")
  // Desktop: Keep full text (e.g., "2.3M views")
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    return displayViews.replace(' views', '');
  }

  return displayViews;
}

/**
 * Generate YouTube thumbnail URL
 *
 * WHY: Provide fallback thumbnail URL for YouTube videos
 * CONTRACT: (videoId:string) → string - returns thumbnail URL
 * PRE: Valid YouTube video ID
 * POST: Returns hqdefault thumbnail URL
 * EDGE: Invalid videoId → still returns URL (will 404)
 * USAGE: generateYoutubeThumbnail('dQw4w9WgXcQ') → 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
 */
export function generateYoutubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Escape HTML to prevent XSS
 *
 * WHY: Sanitize user input before rendering in HTML
 * CONTRACT: (str:string|null) → string - returns escaped HTML
 * PRE: Any string value
 * POST: Returns HTML-escaped string safe for innerHTML
 * EDGE: null/undefined → '', escapes <, >, &, quotes
 * USAGE: escapeHtml('<script>alert("xss")</script>') → '&lt;script&gt;...'
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
