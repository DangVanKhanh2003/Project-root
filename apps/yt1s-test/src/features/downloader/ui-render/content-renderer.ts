/**
 * Content Renderer - TypeScript (Simplified for Phase 4B)
 * Renders search results and messages in content area
 */

import { createSearchResultCard, type VideoData } from '../../../ui-components/search-result-card/search-result-card';
import { createSkeletonCard } from '../../../ui-components/search-result-card/skeleton-card';

let contentArea: HTMLElement | null = null;
let searchResultsContainer: HTMLElement | null = null;
let searchResultsSection: HTMLElement | null = null;

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
      // DETAIL skeleton - for video details (future implementation)
      content = `<div class="loading-detail">Loading video details...</div>`;

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
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  if (typeof text !== 'string') return '';

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
