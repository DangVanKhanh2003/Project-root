/**
 * Skeleton Card Component
 * Loading state for search result cards
 * Uses existing skeleton CSS from /reusable-packages/skeleton/
 */

/**
 * Create skeleton card HTML for loading state
 *
 * @returns {string} HTML string for skeleton card
 */
export function createSkeletonCard() {
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
