/**
 * Search Result Card Component
 * Reusable video card for search results, playlists, and recommendations
 *
 * @module @downloader/ui-components/SearchResultCard
 */

import { formatViewsForDisplay, generateYoutubeThumbnail, escapeHtml } from './card-utils';

/**
 * Video data interface
 */
export interface VideoData {
  id: string;
  title: string;
  thumbnailUrl?: string;
  displayDuration?: string;
  metadata?: {
    uploaderName?: string;
    [key: string]: any;
  };
  displayViews?: string;
  displayDate?: string;
  [key: string]: any;
}

/**
 * Card rendering options
 */
export interface CardOptions {
  lazyLoad?: boolean;
  showChannel?: boolean;
  showMetadata?: boolean;
}

/**
 * Create search result card HTML
 *
 * WHY: Render video card with thumbnail, title, and metadata
 * CONTRACT: (video:VideoData, options?:CardOptions) → string - returns HTML
 * PRE: video.id and video.title required
 * POST: Returns fully formed HTML card
 * EDGE: Missing thumbnailUrl → uses YouTube default, missing metadata → hides sections
 * USAGE: container.innerHTML = createSearchResultCard(videoData);
 */
export function createSearchResultCard(video: VideoData, options: CardOptions = {}): string {
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
