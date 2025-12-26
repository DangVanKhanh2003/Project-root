/**
 * @downloader/ui-components
 *
 * Shared UI components for downloader applications
 * All components support customization via CSS custom properties
 *
 * @module @downloader/ui-components
 */

// ExpireModal
export { ExpireModal, showExpireModal, type ExpireModalOptions } from './ExpireModal';

// SkeletonCard
export {
  createSkeletonCard,
  createSkeletonCards,
  createSkeletonLine,
  createSkeletonThumbnail,
  SkeletonLineTypes
} from './SkeletonCard';

// SearchResultCard
export {
  createSearchResultCard,
  formatViewsForDisplay,
  generateYoutubeThumbnail,
  escapeHtml,
  type VideoData,
  type CardOptions
} from './SearchResultCard';

// SuggestionDropdown
export {
  SuggestionDropdown,
  type SuggestionState,
  type SuggestionDropdownOptions
} from './SuggestionDropdown';

// PreviewCardSkeleton
export {
  createPreviewCardSkeleton,
  createPreviewCardSkeletonWithWrapper
} from './PreviewCardSkeleton';
