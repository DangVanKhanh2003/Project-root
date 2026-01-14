/**
 * Responsive Utility Functions
 * Shared responsive logic for scroll and other UI features
 */

/**
 * Responsive breakpoints matching CSS
 * Should match values in base.css
 */
export const BREAKPOINTS = {
  MOBILE: 600,    // Match CSS breakpoint from base.css
  DESKTOP: 840,   // Match CSS breakpoint from base.css
} as const;

/**
 * Infinite scroll thresholds (distance from bottom to trigger)
 */
export const INFINITE_SCROLL_THRESHOLDS = {
  MOBILE: 600,   // Distance from bottom to trigger load on mobile
  DESKTOP: 800,  // Distance from bottom to trigger load on desktop
} as const;

/**
 * Check if current viewport is mobile
 */
export function isMobile(): boolean {
  return window.innerWidth <= BREAKPOINTS.MOBILE;
}

/**
 * Check if current viewport is desktop
 */
export function isDesktop(): boolean {
  return window.innerWidth >= BREAKPOINTS.DESKTOP;
}

/**
 * Get appropriate infinite scroll threshold based on current viewport
 */
export function getInfiniteScrollThreshold(): number {
  return isMobile()
    ? INFINITE_SCROLL_THRESHOLDS.MOBILE
    : INFINITE_SCROLL_THRESHOLDS.DESKTOP;
}
