/**
 * Search Result Card Component
 * Reusable video card for search results, playlists, and recommendations
 */

import { formatViewsForDisplay, generateYoutubeThumbnail, escapeHtml } from './card-utils.js';

/**
 * Create search result card HTML
 *
 * WHY: Reusable component for video cards across app
 *
 * CONTRACT:
 * @param {Object} video - Video data object
 * @param {string} video.id - Video ID
 * @param {string} video.title - Video title
 * @param {string} [video.thumbnailUrl] - Thumbnail URL (optional)
 * @param {string} [video.displayDuration] - Duration badge text (optional)
 * @param {Object} [video.metadata] - Metadata object (optional)
 * @param {string} [video.metadata.uploaderName] - Channel name (optional)
 * @param {string} [video.displayViews] - View count text (optional)
 * @param {string} [video.displayDate] - Upload date text (optional)
 * @param {Object} [options] - Rendering options
 * @param {boolean} [options.lazyLoad=true] - Use lazy loading for images
 * @param {boolean} [options.showChannel=true] - Show channel name
 * @param {boolean} [options.showMetadata=true] - Show views/date
 *
 * @returns {string} HTML string for video card
 *
 * PRE: video object must have id and title
 * POST: Returns valid HTML string with proper escaping
 *
 * EDGE:
 * - Missing thumbnailUrl → Falls back to YouTube default thumbnail
 * - Missing metadata fields → Gracefully hidden (no broken layout)
 * - XSS protection → All user content escaped via escapeHtml()
 * - Responsive → Views text adapts to mobile/desktop
 *
 * USAGE:
 * const html = createSearchResultCard(videoData);
 * container.innerHTML = html;
 */
export function createSearchResultCard(video, options = {}) {
    const {
        lazyLoad = true,
        showChannel = true,
        showMetadata = true
    } = options;

    const formattedViews = formatViewsForDisplay(video.displayViews);

    return `
        <article class="search-result-card"
                 data-video-id="${escapeHtml(video.id)}"
                 data-video-title="${escapeHtml(video.title)}">
            <div class="card-thumbnail">
                <img src="${escapeHtml(video.thumbnailUrl || generateYoutubeThumbnail(video.id))}"
                     loading="${lazyLoad ? 'lazy' : 'eager'}"
                     alt="${escapeHtml(video.title)}"
                     onerror="this.src='${generateYoutubeThumbnail(video.id)}'">
                ${video.displayDuration ? `<span class="duration-badge">${escapeHtml(video.displayDuration)}</span>` : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${escapeHtml(video.title)}</h3>
                ${showChannel && video.metadata?.uploaderName ?
                    `<p class="card-channel">${escapeHtml(video.metadata.uploaderName)}</p>` : ''}
                ${showMetadata ? `
                    <div class="card-metadata">
                        ${formattedViews ? `<span>${escapeHtml(formattedViews)} </span>` : ''}
                        ${formattedViews && video.displayDate ? '<span>•</span>' : ''}
                        ${video.displayDate ? `<span>${escapeHtml(video.displayDate)}</span>` : ''}
                    </div>
                ` : ''}
            </div>
        </article>
    `;
}
