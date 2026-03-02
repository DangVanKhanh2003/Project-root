/**
 * Content Renderer - TypeScript (Simplified for Phase 4B)
 * Renders search results and messages in content area
 */

import {
  createSearchResultCard,
  createSkeletonCard,
  createPreviewCardSkeleton,
  createPreviewCardSkeletonWithWrapper,
  type VideoData
} from '@downloader/ui-components';
import { setInputValue } from './ui-renderer';
import { initExpandableText } from '../../../utils';
import { LANGUAGES } from '../logic/data/languages';
import {
  setViewingItem,
  setIsFromListItemClick,
  getState,
  setResults,
  getSearchPagination,
  setSearchPagination,
  setLoadingMore,
  incrementLoadMoreCount,
  decrementLoadMoreCount,
} from '../state';
import { transformSearchItemToVideoData } from '../logic/input-form';
import { getInfiniteScrollThreshold } from '@downloader/ui-shared/scroll';
import { api } from '../../../api';
import { showResultView, showSearchView, isResultViewVisible } from './view-switcher';
import { logEvent } from '../../../libs/firebase';

let contentArea: HTMLElement | null = null;
let searchResultsContainer: HTMLElement | null = null;
let searchResultsSection: HTMLElement | null = null;
let heroMessageContainer: HTMLElement | null = null;

/**
 * Handle click on search result card (event delegation)
 */
function handleSearchResultClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const card = target.closest('.search-result-card') as HTMLElement;

  if (!card) {
    return;
  }

  const videoId = card.dataset.videoId;
  const videoTitle = card.dataset.videoTitle;

  if (!videoId) {
    return;
  }


  // Set flag to indicate this is from list item click (DON'T clear search results)
  setIsFromListItemClick(true);

  // Save viewing item to state (for context)
  setViewingItem({ id: videoId, title: videoTitle || '' });

  logEvent('search_result_click', {
    video_id: videoId,
    video_title: videoTitle || ''
  });

  // Show detail skeleton immediately (before form submission)
  showLoading('detail');

  // Construct YouTube URL
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Get form element
  const form = document.getElementById('downloadForm') as HTMLFormElement;

  if (!form) {
    return;
  }

  // Update input value
  setInputValue(youtubeUrl);

  // Get input element to dispatch input event
  const input = document.getElementById('videoUrl') as HTMLInputElement;
  if (input) {
    // Dispatch input event to trigger handleInput() → update inputType
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // Submit form to extract video (skeleton already shown)
  const isStrimPage = document.body.dataset.page === 'strim-downloader';
  if (isStrimPage) {
    // Stream cut page uses Start button as the entry action.
    // Clicking a list item should prefill input then auto-trigger Start.
    const startBtn = document.getElementById('stream-start-btn') as HTMLButtonElement | null;
    startBtn?.click();
  } else {
    form.requestSubmit();
  }
}

/**
 * Initialize content renderer
 */
export function initContentRenderer(): boolean {
  contentArea = document.getElementById('content-area');
  searchResultsContainer = document.getElementById('search-results-container');
  searchResultsSection = document.getElementById('search-results-section');

  if (!contentArea) {
    return false;
  }

  // Setup event delegation for search result card clicks
  if (searchResultsContainer) {
    searchResultsContainer.addEventListener('click', handleSearchResultClick);
  }

  // Setup infinite scroll for load more functionality
  setupInfiniteScroll();

  return true;
}

/**
 * Setup infinite scroll for automatic load more detection
 * Uses scroll event with requestAnimationFrame throttling for optimal performance
 */
function setupInfiniteScroll(): void {
  let isLoadingMore = false;

  const checkGridScroll = (): void => {
    if (!searchResultsContainer) return;

    const pagination = getSearchPagination();

    // Guards: Don't trigger if conditions not met
    if (pagination.loadMoreCount >= 2) return; // Max 2 load more operations
    if (!pagination.hasNextPage) return; // No more results available
    if (pagination.isLoadingMore || isLoadingMore) return; // Already loading

    // Calculate distance from viewport bottom to GRID bottom (not page bottom)
    const grid = searchResultsContainer.querySelector('.search-results-grid');
    if (!grid) return;

    const gridRect = grid.getBoundingClientRect();
    const distanceToBottom = gridRect.bottom - window.innerHeight;
    const threshold = getInfiniteScrollThreshold(); // Responsive: 600px mobile, 800px desktop (from shared utils)

    // Trigger load more when close to bottom
    if (distanceToBottom <= threshold) {
      isLoadingMore = true;
      handleLoadMore().finally(() => {
        isLoadingMore = false;
      });
    }
  };

  // Use requestAnimationFrame for optimal performance (no jank)
  let rafPending = false;
  const throttledCheck = (): void => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      checkGridScroll();
      rafPending = false;
    });
  };

  // Attach scroll listener with passive flag for better performance
  window.addEventListener('scroll', throttledCheck, { passive: true });

}

/**
 * Ensure inline message container exists right below hero section
 */
function ensureHeroMessageContainer(): HTMLElement | null {
  if (heroMessageContainer && heroMessageContainer.isConnected) {
    return heroMessageContainer;
  }

  const heroSection = document.querySelector('.hero-section');
  if (!heroSection) {
    return null;
  }

  const existing = document.getElementById('hero-inline-message');
  if (existing) {
    heroMessageContainer = existing as HTMLElement;
    return heroMessageContainer;
  }

  heroMessageContainer = document.createElement('div');
  heroMessageContainer.id = 'hero-inline-message';
  heroMessageContainer.className = 'hero-inline-message';
  heroSection.insertAdjacentElement('afterend', heroMessageContainer);
  return heroMessageContainer;
}

function showHeroMessage(message: string, type: 'info' | 'error' | 'success'): boolean {
  const container = ensureHeroMessageContainer();
  if (!container) {
    return false;
  }

  container.innerHTML = `
    <div class="inline-message inline-message--${type}">
      <p>${escapeHtml(message)}</p>
    </div>
  `;
  container.style.display = 'block';
  return true;
}

export function clearHeroMessage(): void {
  const container = ensureHeroMessageContainer();
  if (!container) {
    return;
  }
  container.innerHTML = '';
  container.style.display = 'none';
}

/**
 * Handle load more action - fetch next page and append results
 * Includes skeleton loading, error handling, and state management
 */
async function handleLoadMore(): Promise<void> {
  const pagination = getSearchPagination();
  const state = getState();

  // Double-check guards (defensive programming)
  if (pagination.loadMoreCount >= 2) {
    return;
  }
  if (!pagination.hasNextPage) {
    return;
  }
  if (pagination.isLoadingMore) {
    return;
  }


  try {
    // Increment counter immediately to prevent race conditions
    incrementLoadMoreCount();
    setLoadingMore(true);

    logEvent('load_more_trigger', {
      page_token: pagination.nextPageToken || 'initial'
    });

    // Append skeleton cards to grid (visual feedback)
    const grid = searchResultsContainer?.querySelector('.search-results-grid');
    if (grid) {
      const skeletonCards = Array(12)
        .fill(null)
        .map(() => createSkeletonCard())
        .join('');
      grid.insertAdjacentHTML('beforeend', skeletonCards);
    }

    // Fetch next page from API
    const result = await api.searchV2(state.query || '', {
      pageToken: pagination.nextPageToken || undefined,
      limit: 12,
    });

    if (result.ok && result.data) {
      const searchData = result.data as any;
      const rawVideos = searchData.videos || searchData.items || [];


      // Update pagination state
      if (searchData.pagination) {
        setSearchPagination({
          nextPageToken: searchData.pagination.nextPageToken || null,
          hasNextPage: Boolean(searchData.pagination.hasMore || searchData.pagination.hasNextPage),
        });
      }

      // Transform and merge results
      const newVideos = rawVideos.map(transformSearchItemToVideoData);
      const currentResults = state.results || [];
      const mergedResults = [...currentResults, ...newVideos];
      setResults(mergedResults as any);

      // Remove skeleton cards
      grid?.querySelectorAll('.skeleton-card').forEach((card) => card.remove());

      // Append new result cards
      const newItemsHTML = newVideos.map((video) => createSearchResultCard(video)).join('');
      grid?.insertAdjacentHTML('beforeend', newItemsHTML);

    } else {
      // Rollback counter on error
      decrementLoadMoreCount();
      // Remove skeleton cards on error
      grid?.querySelectorAll('.skeleton-card').forEach((card) => card.remove());
      // Show error message (optional)
      // Could add error UI here
    }
  } catch (error) {
    // Rollback counter on exception
    decrementLoadMoreCount();
    // Remove skeleton cards
    const grid = searchResultsContainer?.querySelector('.search-results-grid');
    grid?.querySelectorAll('.skeleton-card').forEach((card) => card.remove());
  } finally {
    setLoadingMore(false);
  }
}

/**
 * Render search results using TypeScript UI components
 */
export function renderResults(results: VideoData[]): void {

  if (results.length === 0) {
    renderMessage('No results found');
    hideSearchResultsSection();
    return;
  }

  if (!searchResultsContainer) {
    return;
  }

  // Render search results
  const html = `
    <div class="search-results">
      <div class="search-results-grid">
        ${results.map(video => createSearchResultCard(video)).join('')}
      </div>
    </div>
  `;

  searchResultsContainer.innerHTML = html;

  // Show search results section
  if (searchResultsSection) {
    searchResultsSection.style.display = 'block';
  }

  // Hide content area (used for URL results/video detail)
  if (contentArea) {
    contentArea.innerHTML = '';
    contentArea.style.display = 'none';
  }

}

/**
 * Hide search results section
 * Always hide/clear results on any submit
 */
function hideSearchResultsSection(): void {
  // Always hide and clear search results section
  if (searchResultsSection) {
    searchResultsSection.style.display = 'none';
  }
  if (searchResultsContainer) {
    searchResultsContainer.innerHTML = '';
  }
}

/**
 * Render loading state with skeleton cards
 * @param type - Type of skeleton: 'list' for search results, 'detail' for video details
 * @param append - Whether to append or replace content
 */
export function showLoading(type: 'list' | 'detail' = 'list', append: boolean = false): void {
  let content = '';

  switch (type) {
    case 'list': {
      // LIST skeleton - 12 cards for search results
      const skeletonCards = Array(12).fill(null).map(() => createSkeletonCard()).join('');
      content = `
        <div class="content-data search-results">
          <div class="search-results-grid">
            ${skeletonCards}
          </div>
        </div>
      `;

      // Route to search results container
      if (searchResultsContainer && searchResultsSection) {
        searchResultsContainer.innerHTML = content;
        searchResultsSection.style.display = 'block'; // Show section
      }

      // Hide content area (for URL results)
      if (contentArea) {
        contentArea.innerHTML = '';
        contentArea.style.display = 'none';
      }
      break;
    }

    case 'detail': {
      // PREVIEW CARD skeleton - shows video info preview
      content = renderPreviewCardSkeleton() + createConversionStateWrapper();

      if (!contentArea) return;

      if (append) {
        contentArea.insertAdjacentHTML('afterbegin', content);
      } else {
        contentArea.innerHTML = content;
      }
      contentArea.classList.add('showing-loading');

      // Show content area (may be hidden from search results)
      contentArea.style.display = 'block';

      // Hide search section
      hideSearchResultsSection();
      break;
    }
  }
}

/**
 * Render message
 */
export function renderMessage(message: string, type: 'info' | 'error' | 'success' = 'info'): void {
  if (!contentArea) return;

  if (!isResultViewVisible() && showHeroMessage(message, type)) {
    showSearchView();
    hideSearchResultsSection();
    return;
  }

  clearHeroMessage();
  contentArea.innerHTML = `
    <div class="message message-${type}">
      <p>${escapeHtml(message)}</p>
    </div>
  `;

  contentArea.style.display = 'block';
  showResultView();
  hideSearchResultsSection();
}

/**
 * Clear content area
 */
export function clearContent(): void {
  if (contentArea) {
    contentArea.innerHTML = '';
  }

  // Also hide search results section
  hideSearchResultsSection();
}

/**
 * Create conversion state wrapper HTML (created once, updated by download-rendering.ts)
 * This container is managed by renderConversionStatus() and should NOT be re-rendered
 */
function createConversionStateWrapper(): string {
  return `
    <div class="conversion-state-wrapper">
      <div class="status-container" id="status-container" style="display: none;">
        <div class="status">
          <span class="status-text"></span>
          <div class="icon"></div>
        </div>
      </div>
      <div class="action-container" id="action-container">
        <button class="btn-new-convert" id="btn-new-convert">Start Over</button>
        <button class="retry-btn" id="conversion-retry-btn">Retry</button>

        <button class="download-btn" id="conversion-download-btn">Download</button>

      </div>
    </div>
  `;
}

/**
 * Render preview card skeleton
 * IMPORTANT: Structure MUST match renderPreviewCard() to prevent CLS
 * @deprecated Use createPreviewCardSkeleton from @downloader/ui-components instead
 */
function renderPreviewCardSkeleton(): string {
  return createPreviewCardSkeleton();
}

/**
 * Render preview card with video info
 * Shows simple video preview with format and quality info from YouTube preview state
 * NOTE: Only updates preview card content, does NOT touch conversion-state-wrapper
 * @param _data - Unused parameter (kept for backward compatibility)
 */
export function renderPreviewCard(_data: any): void {
  if (!contentArea) {
    return;
  }

  clearHeroMessage();

  // Switch to result view when rendering preview
  showResultView();

  const state = getState();
  const youtubePreview = state.youtubePreview;

  // If no YouTube preview data, don't render
  if (!youtubePreview) {
    return;
  }

  const { videoId, title, thumbnail, author, trimRangeLabel } = youtubePreview;
  const showSourcePreview = Boolean(videoId && thumbnail);
  const selectedFormat = state.selectedFormat;
  const audioTrackInput = document.getElementById('audio-track-value') as HTMLInputElement | null;
  const audioTrackCode = audioTrackInput?.value || 'original';
  const audioTrackLabel = getAudioTrackLabel(audioTrackCode);
  const audioTrackIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="16" viewBox="0 0 44 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-audio-language-horizontal"><g fill="currentColor" stroke="none" transform="translate(-2 0)"><path d="M19.4 .2C19.29 .27 19.20 .37 19.13 .49C19.07 .60 19.02 .72 19.01 .85C18.99 .98 18.99 1.12 19.03 1.24C19.06 1.37 19.12 1.49 19.2 1.6L20.8 .4C20.64 .18 20.40 .04 20.14 .01C19.87 -0.02 19.61 .04 19.4 .2ZM20.8 .4L20 1L19.2 1.59C20.37 3.16 21.00 5.06 21.00 7.01C20.99 8.97 20.35 10.87 19.17 12.42C19.01 12.64 18.94 12.90 18.98 13.16C19.02 13.43 19.16 13.66 19.37 13.83C19.58 13.99 19.84 14.05 20.11 14.02C20.37 13.98 20.61 13.84 20.77 13.63C22.21 11.73 22.99 9.41 23 7.02C23.00 4.63 22.23 2.31 20.8 .4ZM10 2C8.67 2 7.40 2.52 6.46 3.46C5.52 4.40 5 5.67 5 7C5 8.32 5.52 9.59 6.46 10.53C7.40 11.47 8.67 12 10 12C11.32 12 12.59 11.47 13.53 10.53C14.47 9.59 15 8.32 15 7C15 5.67 14.47 4.40 13.53 3.46C12.59 2.52 11.32 2 10 2ZM16.17 2.29C15.97 2.48 15.86 2.73 15.86 2.99C15.85 3.26 15.95 3.51 16.14 3.71C16.98 4.58 17.44 5.68 17.49 6.80L17.5 7.02C17.49 8.22 17.01 9.40 16.10 10.32C15.92 10.51 15.83 10.77 15.83 11.03C15.84 11.29 15.95 11.53 16.13 11.71C16.32 11.90 16.57 12.00 16.83 12.00C17.09 12.00 17.34 11.90 17.53 11.72C18.78 10.44 19.49 8.77 19.5 7.03L19.49 6.71C19.42 5.09 18.74 3.53 17.58 2.32C17.49 2.23 17.38 2.15 17.26 2.10C17.14 2.05 17.01 2.02 16.88 2.01C16.75 2.01 16.62 2.03 16.49 2.08C16.37 2.13 16.26 2.20 16.17 2.29ZM10.39 13.01L10 13C8.01 12.99 6.10 13.73 4.63 15.06L4.34 15.34C3.60 16.08 3.01 16.96 2.60 17.93C2.20 18.90 1.99 19.94 2 21C2 21.26 2.10 21.51 2.29 21.70C2.48 21.89 2.73 22 3 22C3.26 22 3.51 21.89 3.70 21.70C3.89 21.51 4 21.26 4 21C4.00 19.40 4.63 17.88 5.75 16.75L5.97 16.55C7.07 15.55 8.51 15 10 15L10.29 15.00C11.78 15.08 13.18 15.70 14.24 16.75L14.44 16.97C15.44 18.07 16 19.51 16 21C16 21.26 16.10 21.51 16.29 21.70C16.48 21.89 16.73 22 17 22C17.26 22 17.51 21.89 17.70 21.70C17.89 21.51 18 21.26 18 21C18.00 19.01 17.26 17.10 15.93 15.63L15.65 15.34C14.25 13.93 12.37 13.10 10.39 13.01Z"></path></g><g transform="translate(23.8 1.6) scale(0.75)"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></g></svg>`;

  // Get quality info based on selected format
  // For wav, flac, opus, ogg (audio) and webm, mkv (video): show badge only (no quality-info)
  // For mp4, mp3: show badge + quality-info
  const audioBadgeOnlyFormats = ['wav', 'flac', 'opus', 'ogg'];
  const videoBadgeOnlyFormats = ['webm', 'mkv'];

  let qualityInfo = '';
  let formatBadge = '';
  const videoQuality = state.videoQuality || '720p';

  if (selectedFormat === 'mp4' && videoBadgeOnlyFormats.includes(videoQuality)) {
    // webm, mkv: show badge only, no quality-info
    formatBadge = videoQuality.toUpperCase();
    qualityInfo = '';
  } else if (selectedFormat === 'mp4') {
    formatBadge = 'MP4';
    qualityInfo = videoQuality;
  } else {
    const audioFormat = state.audioFormat;
    if (audioBadgeOnlyFormats.includes(audioFormat)) {
      // wav, flac, opus, ogg: show badge only, no quality-info
      formatBadge = audioFormat.toUpperCase();
      qualityInfo = '';
    } else {
      // MP3: show badge + bitrate
      formatBadge = audioFormat.toUpperCase();
      const bitrate = state.audioBitrate || '128';
      qualityInfo = `${bitrate}kbps`;
    }
  }

  const previewCardHtml = `
    <div class="yt-preview-card${showSourcePreview ? '' : ' yt-preview-card--compact'}">
      ${showSourcePreview ? `<div class="yt-preview-thumbnail">
        <img src="${escapeHtml(thumbnail)}"
             alt="${escapeHtml(title)}"
             width="480"
             height="360"
             loading="lazy">
      </div>` : ''}
      <div class="yt-preview-details">
        <h3 class="yt-preview-title">${escapeHtml(title)}</h3>
        <div class="yt-preview-meta">
          <div class="yt-preview-format">
            ${formatBadge ? `<span class="meta-badge badge-format">${formatBadge}</span>` : ''}
            ${qualityInfo ? `<span class="meta-badge badge-quality badge-main-quality">${escapeHtml(qualityInfo)}</span>` : ''}
            <span class="meta-badge badge-audio">
              <span class="audio-track-icon">${audioTrackIcon}</span>
              <span class="audio-track-value">${escapeHtml(audioTrackLabel)}</span>
            </span>
            ${trimRangeLabel ? `<span class="meta-badge badge-quality badge-trim-range">${escapeHtml(trimRangeLabel)}</span>` : ''}
          </div>
          ${showSourcePreview && author ? `<p class="yt-preview-author">${escapeHtml(author)}</p>` : ''}
        </div>
      </div>
    </div>
  `;

  // Check if conversion-state-wrapper already exists
  const existingWrapper = contentArea.querySelector('.conversion-state-wrapper');

  if (existingWrapper) {
    // Wrapper exists - only update preview card (preserve conversion state)
    const existingPreviewCard = contentArea.querySelector('.yt-preview-card');
    if (existingPreviewCard) {
      // Check if thumbnail is the same - only update text to prevent flicker
      const existingImg = existingPreviewCard.querySelector('.yt-preview-thumbnail img') as HTMLImageElement;
      if (showSourcePreview && existingImg && existingImg.src === thumbnail) {
        // Same thumbnail - only update text elements (no DOM replacement = no flicker)
        const titleEl = existingPreviewCard.querySelector('.yt-preview-title');
        const formatBadgeEl = existingPreviewCard.querySelector('.badge-format');
        const qualityInfoEl = existingPreviewCard.querySelector('.badge-main-quality');
        const audioTrackValueEl = existingPreviewCard.querySelector('.audio-track-value');
        const trimBadgeEl = existingPreviewCard.querySelector('.badge-trim-range');
        const authorEl = existingPreviewCard.querySelector('.yt-preview-author');
        const metaEl = existingPreviewCard.querySelector('.yt-preview-meta');

        if (titleEl) titleEl.textContent = title;
        if (formatBadgeEl) formatBadgeEl.textContent = formatBadge;
        if (qualityInfoEl) qualityInfoEl.textContent = qualityInfo;
        if (audioTrackValueEl) audioTrackValueEl.textContent = audioTrackLabel;
        if (trimRangeLabel) {
          if (trimBadgeEl) {
            trimBadgeEl.textContent = trimRangeLabel;
          } else {
            const formatWrap = existingPreviewCard.querySelector('.yt-preview-format');
            if (formatWrap) {
              const badge = document.createElement('span');
              badge.className = 'meta-badge badge-quality badge-trim-range';
              badge.textContent = trimRangeLabel;
              formatWrap.appendChild(badge);
            }
          }
        } else if (trimBadgeEl) {
          trimBadgeEl.remove();
        }
        // Handle author: update, create, or remove
        if (author) {
          if (authorEl) {
            authorEl.textContent = author;
          } else if (metaEl) {
            const newAuthor = document.createElement('p');
            newAuthor.className = 'yt-preview-author';
            newAuthor.textContent = author;
            metaEl.appendChild(newAuthor);
          }
        } else if (authorEl) {
          authorEl.remove();
        }
      } else {
        // Different thumbnail - full replacement needed
        existingPreviewCard.outerHTML = previewCardHtml;
      }
    } else {
      // Preview card doesn't exist - insert before wrapper
      existingWrapper.insertAdjacentHTML('beforebegin', previewCardHtml);
    }
  } else {
    // First render - create both preview card AND conversion-state-wrapper
    contentArea.innerHTML = previewCardHtml + createConversionStateWrapper();
  }

  // Remove loading class
  contentArea.classList.remove('showing-loading');

  // Show content area
  contentArea.style.display = 'block';

  // Hide search results section
  hideSearchResultsSection();

  // Switch to result view (show result, hide search)
  showResultView();
}

/**
 * Setup image loading with preload to prevent flicker
 * @param container - Preview card container
 */
function setupImageLoader(container: HTMLElement): void {
  const img = container.querySelector('#videoThumbnail') as HTMLImageElement | null;
  const skeleton = container.querySelector('.thumbnail-skeleton') as HTMLElement | null;

  if (!img || !skeleton) {
    return;
  }

  const thumbnailUrl = img.dataset.src;
  if (!thumbnailUrl) {
    return;
  }

  // Preload image in memory
  const preloader = new Image();

  preloader.onload = () => {
    // Image loaded successfully - show it smoothly
    img.src = thumbnailUrl;

    // Wait for browser to paint, then fade in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        img.classList.remove('thumbnail-hidden');
        img.classList.add('thumbnail-visible');

        if (skeleton) {
          skeleton.classList.add('skeleton-hidden');
        }
      });
    });
  };

  preloader.onerror = () => {
    // Image failed to load
    img.src = thumbnailUrl;
    img.classList.remove('thumbnail-hidden');
    img.classList.add('thumbnail-error');

    if (skeleton) {
      skeleton.classList.add('skeleton-hidden');
    }
  };

  // Start preloading
  preloader.src = thumbnailUrl;
}

function getAudioTrackLabel(code: string): string {
  const normalized = code.trim().toLowerCase();
  if (!normalized || normalized === 'original') {
    return 'Origin';
  }
  const match = LANGUAGES.find((language) => language.code.toLowerCase() === normalized);
  return match?.name || code;
}



/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string | undefined): string {
  if (typeof text !== 'string') return '';

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format duration from seconds or HH:MM:SS string
 */
function formatDuration(duration: string | number | undefined): string {
  if (!duration) return '';

  // If already formatted (e.g., "04:20"), return as is
  if (typeof duration === 'string' && duration.includes(':')) {
    return duration;
  }

  // Convert seconds to MM:SS or HH:MM:SS
  const seconds = typeof duration === 'string' ? parseInt(duration, 10) : duration;
  if (isNaN(seconds)) return '';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')} `;
  }
  return `${minutes}:${String(secs).padStart(2, '0')} `;
}

/**
 * Get quality badge text (Full-HD, 4K, etc.)
 */
function getBadgeForQuality(quality: string, qText?: string | null): string {
  if (qText) return qText;

  // Auto-detect badge from quality string
  const qualityLower = quality.toLowerCase();
  if (qualityLower.includes('2160') || qualityLower.includes('4k')) return '4K';
  if (qualityLower.includes('1440') || qualityLower.includes('2k')) return '2K';
  if (qualityLower.includes('1080')) return 'Full-HD';
  if (qualityLower.includes('720')) return 'HD';
  if (qualityLower.includes('320')) return 'High';
  if (qualityLower.includes('256')) return 'Good';
  if (qualityLower.includes('128')) return 'Standard';
  return '';
}

/**
 * Render download options list for selected format
 */
function renderDownloadOptionsList(formats: any[], selectedFormat: string): string {
  if (!formats || formats.length === 0) {
    return `
    < div class="quality-list" >
      <div class="quality-empty" >
        No ${selectedFormat.toUpperCase()} options available for this video
          </div>
          </div>
            `;
  }

  const formatTypeLabel = selectedFormat.toUpperCase();

  const optionsHTML = formats.map(formatData => {
    const { quality, format, size, q_text, key, url } = formatData;
    const badge = getBadgeForQuality(quality, q_text);
    const formatId = `${format} -${quality} `.replace(/[^a-zA-Z0-9-]/g, '-');

    return `
    < div class="quality-item" data - format - id="${formatId}" >
      <div class="quality-row" >
        <!--Left Column: Format Type-- >
          <div class="quality-col-left" >
            <div class="format-type" > ${formatTypeLabel} </div>
              </div>

              < !--Middle Column: Quality + Badge + Size-- >
                <div class="quality-col-middle" >
                  <div class="quality-main" >
                    <span class="quality-text" > ${escapeHtml(quality)} </span>
              ${badge ? `<span class="quality-badge">${escapeHtml(badge)}</span>` : ''}
  </div>
            ${size ? `<div class="quality-size">${escapeHtml(size)}</div>` : ''}
  </div>

    < !--Right Column: Download Button-- >
      <div class="quality-col-right" >
    <button
              type="button"
  class="btn-convert"
  data - format - id="${formatId}"
  data - quality="${escapeHtml(quality)}"
  data - format="${escapeHtml(format)}"
    >
    <span class="btn-text" > Download </span>
          </button>
          </div>
          </div>
          </div>
            `;
  }).join('');

  return `
          < div class="quality-list" >
            ${optionsHTML}
  </div>
    `;
}

// TODO: setupDownloadOptionsTabs() and handleTabClick() removed - tabs no longer needed in new flow

/**
 * Render HTML content (NOT escaped - for internal use only)
 * Use this for hardcoded HTML like fake data messages
 * NEVER pass user input to this function
 * @deprecated Use renderVideoDownloadOptions() for proper download UI
 */
export function renderHtmlContent(htmlContent: string, type: 'info' | 'error' | 'success' = 'info'): void {
  if (!contentArea) return;

  contentArea.innerHTML = `
    < div class="content-message content-message--${type}" >
      ${htmlContent}
  </div>
    `;

  // Hide search results section when showing content
  hideSearchResultsSection();
}
