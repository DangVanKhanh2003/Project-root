/**
 * ScrollBehavior Module
 * Modern form submission scrolling using centralized ScrollManager.
 * Replaces hardcoded logic with responsive, unified scroll management.
 */

import scrollManager, { ScrollOptions } from './scroll-manager';

export type SearchType = 'url' | 'keyword' | 'playlist';

/**
 * Finds the immediate scroll target for searches, with smart desktop/mobile logic.
 */
function findScrollTarget(searchType: SearchType): HTMLElement | null {
  let targetElement: HTMLElement | null = null;

  if (searchType === 'keyword') {
    // For keyword searches, always scroll to input field
    targetElement = document.querySelector<HTMLElement>('#videoUrl');
  } else if (searchType === 'url' || searchType === 'playlist') {
    // Desktop: scroll to input-container for URL submission
    if (scrollManager.isDesktop()) {
      targetElement = document.querySelector<HTMLElement>('.input-container') ||
        document.querySelector<HTMLElement>('#videoUrl') ||
        document.querySelector<HTMLElement>('#content-area');
    } else {
      // Mobile: use original logic
      targetElement = document.querySelector<HTMLElement>('.video-details');
    }
  }

  return targetElement;
}

/**
 * Get scroll offset based on search type and viewport
 */
function getScrollOffset(searchType: SearchType): number | 'auto' {
  // Use 'auto' for responsive navbar height calculation
  if (searchType === 'keyword') {
    return 'auto'; // Use standard navbar offset
  } else if (searchType === 'url' || searchType === 'playlist') {
    // Desktop URL submission: moderate offset for input-container
    if (scrollManager.isDesktop()) {
      return scrollManager.getNavbarHeight() + 30;
    } else {
      // Mobile: standard offset
      return 'auto';
    }
  }

  return 'auto'; // Default to responsive calculation
}

/**
 * Check if scroll should be performed based on search type and viewport
 */
function shouldScroll(searchType: SearchType): boolean {
  // On desktop, don't scroll for keyword searches (legacy behavior)
  if (searchType === 'keyword' && scrollManager.isDesktop()) {
    return false;
  }

  // Always scroll on mobile, and for URL/playlist on all devices
  return true;
}

/**
 * Enhanced scroll behavior with accessibility support
 */
function performEnhancedScroll(
  targetElement: HTMLElement,
  options: ScrollOptions = {}
): Promise<void> {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scrollOptions: ScrollOptions = {
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    offset: 'auto',
    ...options
  };

  return scrollManager.scrollToElement(targetElement, scrollOptions);
}

/**
 * Main function to initialize immediate scroll behavior on submit.
 * Uses modern ScrollManager for responsive, unified scrolling.
 */
export function initImmediateScroll(
  searchType: SearchType,
  options: ScrollOptions = {}
): Promise<void> {
  try {
    // Check if scroll should be performed
    if (!shouldScroll(searchType)) {
      return Promise.resolve();
    }

    // Standard scroll behavior for all cases
    const targetElement = findScrollTarget(searchType);
    if (!targetElement) {
      return Promise.resolve();
    }

    // Calculate appropriate offset
    const offset = getScrollOffset(searchType);

    // Perform scroll with enhanced options
    const scrollOptions: ScrollOptions = {
      offset,
      customOffset: options.customOffset || null,
      onComplete: options.onComplete,
      ...options
    };

    return performEnhancedScroll(targetElement, scrollOptions);
  } catch (error) {
    return Promise.resolve(); // Graceful fallback
  }
}

/**
 * Legacy API compatibility - accepts old parameters
 * @deprecated Use initImmediateScroll with options object instead
 */
export function scrollToInput(): Promise<void> {
  return initImmediateScroll('keyword');
}

/**
 * Scroll to top of page using ScrollManager
 */
export function scrollToTop(options: ScrollOptions = {}): Promise<void> {
  return scrollManager.scrollToTop(options);
}

/**
 * Force update scroll calculations (useful after dynamic content changes)
 */
export function forceUpdateScrollCalculations(): void {
  scrollManager.forceUpdateNavbarHeight();
}
