/**
 * Content Renderer - TypeScript (Simplified for Phase 4B)
 * Renders search results and messages in content area
 */

import {
  createSearchResultCard,
  createSkeletonCard,
  createPreviewCardSkeletonWithWrapper,
  type VideoData
} from '@downloader/ui-components';
import { setInputValue } from './ui-renderer';
import { initExpandableText } from '../../../utils';
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

let contentArea: HTMLElement | null = null;
let searchResultsContainer: HTMLElement | null = null;
let searchResultsSection: HTMLElement | null = null;

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
  form.requestSubmit();
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
      // PREVIEW CARD skeleton - shows video info preview (from @downloader/ui-components)
      const conversionStatusWrapper = `
        <div class="conversion-status-wrapper" id="conversion-status-wrapper">
          <div class="status-container">
            <div class="status status--extracting">
              <span class="status-text">Extracting...</span>
              <div class="icon spinner"></div>
            </div>
          </div>
          <div class="action-container">
            <button class="download-btn" id="conversion-download-btn">Download</button>
            <button class="retry-btn" id="conversion-retry-btn">Retry</button>
          </div>
        </div>
      `;
      content = createPreviewCardSkeletonWithWrapper(conversionStatusWrapper);

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

  contentArea.innerHTML = `
    <div class="message message-${type}">
      <p>${escapeHtml(message)}</p>
    </div>
  `;

  // Show content area (may be hidden from previous operations)
  contentArea.style.display = 'block';

  // Hide search results section when showing message
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
 * Render preview card skeleton
 * REMOVED: Now using createPreviewCardSkeletonWithWrapper() from @downloader/ui-components
 * See: showLoading('detail') case for implementation
 */

/**
 * Render preview card with video info
 * Shows simple video preview with format and quality info from YouTube preview state
 * @param _data - Unused parameter (kept for backward compatibility)
 */
export function renderPreviewCard(_data: any): void {
  if (!contentArea) {
    return;
  }

  const state = getState();
  const youtubePreview = state.youtubePreview;

  // If no YouTube preview data, don't render
  if (!youtubePreview) {
    return;
  }

  // If still loading, render skeleton instead of real content
  if (youtubePreview.isLoading) {
    const conversionStatusWrapper = `
      <div class="conversion-status-wrapper" id="conversion-status-wrapper">
        <div class="status-container">
          <div class="status status--extracting">
            <span class="status-text">Extracting...</span>
            <div class="icon spinner"></div>
          </div>
        </div>
        <div class="action-container">
          <button class="download-btn" id="conversion-download-btn">Download</button>
          <button class="retry-btn" id="conversion-retry-btn">Retry</button>
        </div>
      </div>
    `;
    contentArea.innerHTML = createPreviewCardSkeletonWithWrapper(conversionStatusWrapper);
    contentArea.style.display = 'block';
    hideSearchResultsSection();
    return;
  }

  const { title, thumbnail, author } = youtubePreview;
  const selectedFormat = state.selectedFormat; // 'mp3' or 'mp4'

  // Get quality info based on selected format
  let qualityInfo = '';
  if (selectedFormat === 'mp4') {
    qualityInfo = state.videoQuality || '720p';
  } else {
    // MP3 or other audio formats
    const format = state.audioFormat.toUpperCase();
    const bitrate = state.audioBitrate || '128';
    qualityInfo = `${format} ${bitrate}kbps`;
  }

  const formatBadge = selectedFormat.toUpperCase(); // "MP4" or "MP3"

  const html = `
    <div class="yt-preview-card">
      <div class="yt-preview-thumbnail">
        <img src="${escapeHtml(thumbnail)}"
             alt="${escapeHtml(title)}"
             width="480"
             height="360"
             loading="lazy">
      </div>
      <div class="yt-preview-details">
        <h3 class="yt-preview-title">${escapeHtml(title)}</h3>
        <div class="yt-preview-meta">
          <div class="yt-preview-format">
            <span class="format-badge">${formatBadge}</span>
            <span class="quality-info">${escapeHtml(qualityInfo)}</span>
          </div>
          ${author ? `<p class="yt-preview-author">${escapeHtml(author)}</p>` : ''}
        </div>
      </div>
    </div>
    <div class="conversion-status-wrapper" id="conversion-status-wrapper">
      <div class="status-container">
        <div class="status status--extracting">
          <span class="status-text">Extracting...</span>
          <div class="icon spinner"></div>
        </div>
      </div>
      <div class="action-container">
        <button class="download-btn" id="conversion-download-btn">Download</button>
        <button class="retry-btn" id="conversion-retry-btn">Retry</button>
      </div>
    </div>
  `;

  // Render to content area (preview card + status bar in one go)
  contentArea.innerHTML = html;

  // Remove loading class
  contentArea.classList.remove('showing-loading');

  // Show content area
  contentArea.style.display = 'block';

  // Hide search results section
  hideSearchResultsSection();
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
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
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
      <div class="quality-list">
        <div class="quality-empty">
          No ${selectedFormat.toUpperCase()} options available for this video
        </div>
      </div>
    `;
  }

  const formatTypeLabel = selectedFormat.toUpperCase();

  const optionsHTML = formats.map(formatData => {
    const { quality, format, size, q_text, key, url } = formatData;
    const badge = getBadgeForQuality(quality, q_text);
    const formatId = `${format}-${quality}`.replace(/[^a-zA-Z0-9-]/g, '-');

    return `
      <div class="quality-item" data-format-id="${formatId}">
        <div class="quality-row">
          <!-- Left Column: Format Type -->
          <div class="quality-col-left">
            <div class="format-type">${formatTypeLabel}</div>
          </div>

          <!-- Middle Column: Quality + Badge + Size -->
          <div class="quality-col-middle">
            <div class="quality-main">
              <span class="quality-text">${escapeHtml(quality)}</span>
              ${badge ? `<span class="quality-badge">${escapeHtml(badge)}</span>` : ''}
            </div>
            ${size ? `<div class="quality-size">${escapeHtml(size)}</div>` : ''}
          </div>

          <!-- Right Column: Download Button -->
          <div class="quality-col-right">
            <button
              type="button"
              class="btn-convert"
              data-format-id="${formatId}"
              data-quality="${escapeHtml(quality)}"
              data-format="${escapeHtml(format)}"
            >
              <span class="btn-text">Download</span>
              <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="quality-list">
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
    <div class="content-message content-message--${type}">
      ${htmlContent}
    </div>
  `;

  // Hide search results section when showing content
  hideSearchResultsSection();
}
