/**
 * PreviewCardSkeleton Component
 * Generates skeleton loading state for YT Preview Card
 *
 * @module PreviewCardSkeleton
 * @package @downloader/ui-components
 */

// Import styles
import './preview-card-skeleton.css';

/**
 * Creates a skeleton preview card HTML structure
 *
 * Structure matches actual preview card to prevent CLS (Cumulative Layout Shift)
 *
 * @returns {string} HTML string for skeleton preview card
 *
 * @example
 * ```typescript
 * import { createPreviewCardSkeleton } from '@downloader/ui-components';
 *
 * // Render skeleton
 * contentArea.innerHTML = createPreviewCardSkeleton();
 *
 * // Later, replace with actual preview card
 * contentArea.innerHTML = renderActualPreviewCard(data);
 * ```
 */
export function createPreviewCardSkeleton(): string {
  return `
    <div class="yt-preview-card skeleton">
      <div class="yt-preview-thumbnail">
        <div class="skeleton-img"></div>
      </div>
      <div class="yt-preview-details">
        <div class="skeleton-line skeleton-title"></div>
        <div class="yt-preview-meta">
          <div class="yt-preview-format">
            <div class="skeleton-line" style="width: 50%; height: 16px;"></div>
          </div>
          <div class="skeleton-line skeleton-author"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Creates skeleton preview card with custom wrapper
 * Useful when you need additional containers around the skeleton
 *
 * @param {string} additionalContent - Optional HTML to append after skeleton
 * @returns {string} HTML string
 *
 * @example
 * ```typescript
 * const content = createPreviewCardSkeletonWithWrapper(
 *   '<div class="conversion-status-wrapper">...</div>'
 * );
 * ```
 */
export function createPreviewCardSkeletonWithWrapper(additionalContent: string = ''): string {
  return createPreviewCardSkeleton() + additionalContent;
}
