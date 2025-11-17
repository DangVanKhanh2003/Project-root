/**
 * Scroll Module - Centralized scroll management
 *
 * @module @downloader/ui-shared/scroll
 */

export { ScrollManager, default as scrollManager } from './scroll-manager';
export type { ScrollConfig, ScrollOptions } from './scroll-manager';

export {
  initImmediateScroll,
  scrollToInput,
  scrollToTop,
  forceUpdateScrollCalculations,
} from './scroll-behavior';
export type { SearchType } from './scroll-behavior';

export {
  isMobile,
  isDesktop,
  getInfiniteScrollThreshold,
  BREAKPOINTS,
  INFINITE_SCROLL_THRESHOLDS,
} from './responsive-utils';
