/**
 * Skeleton Card Component
 * Loading state for search result cards
 *
 * @module @downloader/ui-components/SkeletonCard
 */

/**
 * Create skeleton card HTML for loading state
 *
 * WHY: Provide visual feedback during data loading
 * CONTRACT: () → string - returns HTML string for skeleton card
 * PRE: None
 * POST: Returns fully formed HTML with shimmer animation classes
 * EDGE: Always returns valid HTML
 * USAGE: container.innerHTML = createSkeletonCard();
 */
export function createSkeletonCard(): string {
  return `
    <article class="search-result-card skeleton-card">
      <div class="card-thumbnail">
        <span class="skeleton-thumbnail"></span>
      </div>
      <div class="card-content">
        <span class="skeleton-line skeleton-line--long"></span>
        <span class="skeleton-line skeleton-line--medium"></span>
        <p class="card-channel skeleton-channel">
          <span class="skeleton-line skeleton-line--short"></span>
        </p>
        <div class="card-metadata skeleton-metadata">
          <span class="skeleton-segment"></span>
          <span class="skeleton-segment"></span>
        </div>
      </div>
    </article>
  `;
}

/**
 * Create multiple skeleton cards
 *
 * WHY: Render multiple skeleton cards at once for list loading states
 * CONTRACT: (count:number) → string - returns HTML for N skeleton cards
 * PRE: count > 0
 * POST: Returns HTML string with N skeleton cards
 * EDGE: count <= 0 → returns empty string, count > 100 → clamps to 100
 * USAGE: container.innerHTML = createSkeletonCards(5);
 */
export function createSkeletonCards(count: number = 1): string {
  const clampedCount = Math.min(Math.max(count, 0), 100);
  return Array(clampedCount).fill(null).map(() => createSkeletonCard()).join('');
}

/**
 * Skeleton line types for custom skeleton building
 */
export const SkeletonLineTypes = {
  SHORT: 'skeleton-line--short',
  MEDIUM: 'skeleton-line--medium',
  LONG: 'skeleton-line--long',
  FULL: 'skeleton-line--full'
} as const;

/**
 * Create custom skeleton line
 *
 * WHY: Build custom skeleton layouts
 * CONTRACT: (type:string) → string - returns HTML for skeleton line
 * PRE: Valid line type from SkeletonLineTypes
 * POST: Returns HTML for skeleton line element
 * USAGE: createSkeletonLine(SkeletonLineTypes.SHORT);
 */
export function createSkeletonLine(type: typeof SkeletonLineTypes[keyof typeof SkeletonLineTypes] = SkeletonLineTypes.MEDIUM): string {
  return `<span class="skeleton-line ${type}"></span>`;
}

/**
 * Create skeleton thumbnail
 *
 * WHY: Create skeleton for image/video thumbnails
 * CONTRACT: () → string - returns HTML for skeleton thumbnail
 * PRE: None
 * POST: Returns HTML for skeleton thumbnail element
 * USAGE: createSkeletonThumbnail();
 */
export function createSkeletonThumbnail(): string {
  return `<span class="skeleton-thumbnail"></span>`;
}
