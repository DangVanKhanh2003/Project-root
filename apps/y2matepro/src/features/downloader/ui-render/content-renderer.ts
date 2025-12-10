/**
 * Content Renderer - TypeScript (Simplified for Phase 4B)
 * Renders search results and messages in content area
 */

import { createSearchResultCard, type VideoData } from '../../../ui-components/search-result-card/search-result-card';
import { createSkeletonCard } from '../../../ui-components/search-result-card/skeleton-card';
import { renderDownloadOptions, attachDownloadListeners } from './download-rendering';
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
 * IMPORTANT: Only hide if NOT from list item click (preserve results when clicking card)
 */
function hideSearchResultsSection(): void {
  const state = getState();

  // If click came from search result card, DON'T hide/clear results
  if (state.isFromListItemClick) {
    // DON'T reset flag here - will be reset after full render completes
    return;
  }

  // Normal hide behavior (direct URL submit)
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
      // DETAIL skeleton - for video details
      content = renderDetailSkeleton();

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
 * Render detail skeleton for video info page
 * IMPORTANT: Structure MUST match renderDownloadOptions() to prevent CLS
 */
function renderDetailSkeleton(): string {
  return `
    <div id="downloadOptionsContainer" class="video-info-card">
      <div class="video-layout">
        <!-- Left Column: Video Info Skeleton -->
        <div class="video-info-left">
          <!-- Thumbnail -->
          <div class="video-thumbnail aspect-16-9">
            <div class="skeleton-img"></div>
          </div>

          <!-- Title - MUST match .video-title + see-more height to prevent CLS -->
          <div class="video-title-wrapper">
            <div class="video-title-skeleton">
              <div class="skeleton-line"></div>
              <div class="skeleton-line"></div>
            </div>
          </div>
        </div>

        <!-- Right Column: Format Options Skeleton -->
        <div class="video-details">
          <!-- Format Tabs -->
          <div class="format-tabs" role="tablist">
            <div class="format-tab">
              <div class="skeleton-tab-text"></div>
            </div>
            <div class="format-tab">
              <div class="skeleton-tab-text"></div>
            </div>
          </div>

          <!-- Quality List - 2 columns only (left + right) -->
          <div class="quality-list">
            ${Array(6).fill(null).map(() => `
              <div class="quality-item">
                <div class="quality-row">
                  <div class="quality-col-left">
                    <div class="skeleton-text" style="width: 80px;"></div>
                  </div>
                  <div class="quality-col-right">
                    <div class="skeleton-convert-btn"></div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render video download options (2-column layout)
 * @param data - Video data with meta and formats
 * @param activeTab - Active format tab ('video' or 'audio')
 */
export function renderVideoDownloadOptions(data: any, activeTab: 'video' | 'audio' = 'video'): void {

  if (!contentArea) {
    return;
  }
  // Generate HTML using download options renderer
  // Note: renderDownloadOptions gets state internally, no need to pass data
  // TypeScript: Cast to any to handle type mismatch between FormatDto[] and ProcessedFormat[]
  // renderDownloadOptions internally calls processFormatArray to convert FormatDto[] → ProcessedFormat[]
  const html = renderDownloadOptions(getState() as any);

  // Render to content area
  contentArea.innerHTML = html;

  // Remove loading class
  contentArea.classList.remove('showing-loading');

  // Show content area (was hidden by default)
  contentArea.style.display = 'block';

  // Hide search results section
  hideSearchResultsSection();

  // Setup tab switching event listeners
  setupDownloadOptionsTabs();

  // Initialize expandable text for video title
  const container = document.getElementById('downloadOptionsContainer');
  if (container) {
    initExpandableText(container, '.video-title');
    // Attach listeners for download buttons
    attachDownloadListeners(container);
  }
}

/**
 * Setup event listeners for format tabs (Video/Audio switching)
 */
function setupDownloadOptionsTabs(): void {
  const tabs = document.querySelectorAll('.format-tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', handleTabClick);
  });
}

/**
 * Handle tab click (switch between Video/Audio)
 */
function handleTabClick(event: Event): void {
  const button = event.currentTarget as HTMLButtonElement;
  const targetTab = button.dataset.tab as 'video' | 'audio';

  if (!targetTab || button.disabled) return;

  // Update active tab UI
  document.querySelectorAll('.format-tab').forEach(t => t.classList.remove('active'));
  button.classList.add('active');

  // Show/hide corresponding panels
  const videoPanel = document.getElementById('videoFormats');
  const audioPanel = document.getElementById('audioFormats');

  if (targetTab === 'video') {
    if (videoPanel) videoPanel.style.display = 'block';
    if (audioPanel) audioPanel.style.display = 'none';
  } else {
    if (videoPanel) videoPanel.style.display = 'none';
    if (audioPanel) audioPanel.style.display = 'block';
  }
}

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

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  if (typeof text !== 'string') return '';

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
