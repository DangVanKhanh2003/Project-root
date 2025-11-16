/**
 * Content Renderer - TypeScript (Simplified for Phase 4B)
 * Renders search results and messages in content area
 */

import { createSearchResultCard, type VideoData } from '../../../ui-components/search-result-card/search-result-card';
import { createSkeletonCard } from '../../../ui-components/search-result-card/skeleton-card';
import { renderDownloadOptions } from './download-options-renderer';
import { setInputValue } from './ui-renderer';
import { setViewingItem } from '../state';

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
    console.warn('⚠️ Card clicked but no video ID found');
    return;
  }

  console.log('🎬 Search result card clicked:', { videoId, videoTitle });

  // Save viewing item to state (for context)
  setViewingItem({ id: videoId, title: videoTitle || '' });

  // Construct YouTube URL
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Get form element
  const form = document.getElementById('downloadForm') as HTMLFormElement;

  if (!form) {
    console.error('❌ Form not found');
    return;
  }

  // Update input value
  setInputValue(youtubeUrl);

  // Get input element to dispatch input event
  const input = document.getElementById('videoUrl') as HTMLInputElement;
  if (input) {
    // Dispatch input event to trigger handleInput() → update inputType
    input.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('🔄 Input event dispatched - inputType should update to "url"');
  }

  // Submit form to extract video
  console.log('📝 Submitting form with URL:', youtubeUrl);
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
    console.error('Content area not found');
    return false;
  }

  // Setup event delegation for search result card clicks
  if (searchResultsContainer) {
    searchResultsContainer.addEventListener('click', handleSearchResultClick);
    console.log('✅ Search result click listener attached');
  }

  console.log('✅ Content renderer initialized');
  return true;
}

/**
 * Render search results using TypeScript UI components
 */
export function renderResults(results: VideoData[]): void {
  console.log('📋 renderResults called with:', results.length, 'videos');

  if (results.length === 0) {
    renderMessage('No results found');
    hideSearchResultsSection();
    return;
  }

  if (!searchResultsContainer) {
    console.error('❌ searchResultsContainer is null!');
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

  console.log('📝 Setting innerHTML, html length:', html.length);
  searchResultsContainer.innerHTML = html;

  // Show search results section
  if (searchResultsSection) {
    searchResultsSection.style.display = 'block';
    console.log('📍 Search section display:', searchResultsSection.style.display);
  }

  // Clear content area (used for messages/video detail)
  if (contentArea) {
    contentArea.innerHTML = '';
  }

  console.log('✅ Search results rendered successfully');
  console.log('📊 Results container children:', searchResultsContainer.children.length);
  console.log('📊 First card:', searchResultsContainer.querySelector('.search-result-card'));
}

/**
 * Hide search results section
 */
function hideSearchResultsSection(): void {
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

      // Clear content area
      if (contentArea) {
        contentArea.innerHTML = '';
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

          <!-- Title -->
          <div class="video-title-wrapper">
            <div class="skeleton-title" style="width: 85%; margin-bottom: 8px; height: 14px"></div>
            <div class="skeleton-title" style="width: 65%; height: 14px"></div>
          </div>
        </div>

        <!-- Right Column: Format Options Skeleton -->
        <div class="video-details">
          <!-- Format Tabs -->
          <div class="format-tabs" role="tablist">
            <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
              <div class="skeleton-title" style="width: 60px; height: 18px;"></div>
            </div>
            <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
              <div class="skeleton-title" style="width: 60px; height: 18px;"></div>
            </div>
          </div>

          <!-- Quality List -->
          <div class="quality-list">
            ${Array(6).fill(null).map(() => `
              <div class="quality-item">
                <div class="quality-row">
                  <div class="quality-col-left">
                    <div class="skeleton-text" style="width: 60px;"></div>
                  </div>
                  <div class="quality-col-center">
                    <div class="skeleton-text" style="width: 100px;"></div>
                  </div>
                  <div class="quality-col-right">
                    <div class="skeleton-button"></div>
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
  console.log('📺 renderVideoDownloadOptions called', { data, activeTab, contentArea });

  if (!contentArea) {
    console.error('❌ contentArea is null!');
    return;
  }

  // Generate HTML using download options renderer
  const html = renderDownloadOptions(data, activeTab);
  console.log('✅ Generated HTML, length:', html.length);

  // Render to content area
  contentArea.innerHTML = html;
  console.log('✅ HTML rendered to contentArea');

  // Remove loading class
  contentArea.classList.remove('showing-loading');

  // Show content area (was hidden by default)
  contentArea.style.display = 'block';
  console.log('✅ Content area display set to block');

  // Hide search results section
  hideSearchResultsSection();

  // Setup tab switching event listeners
  setupDownloadOptionsTabs();
  console.log('✅ Download options UI setup complete');
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
