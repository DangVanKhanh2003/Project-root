/**
 * Card Utilities - TypeScript
 * Helper functions for search result card rendering
 */

// TODO: Import from utils.ts once it's migrated
// For now, inline the function
function generateThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Format view count for responsive display
 * Mobile: "2.3M" | Desktop: "2.3M views"
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
 * Generate YouTube thumbnail fallback URL
 */
export function generateYoutubeThumbnail(videoId: string): string {
  return generateThumbnail(videoId);
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
