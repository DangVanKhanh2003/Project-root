/**
 * Content Renderer - TypeScript (Simplified for Phase 4B)
 * Renders search results and messages in content area
 */

import { createSearchResultCard, type VideoData } from '../../../ui-components/search-result-card/search-result-card';
import { createSkeletonCard } from '../../../ui-components/search-result-card/skeleton-card';

let contentArea: HTMLElement | null = null;

/**
 * Initialize content renderer
 */
export function initContentRenderer(): boolean {
  contentArea = document.getElementById('contentArea');

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
  if (!contentArea) return;

  if (results.length === 0) {
    renderMessage('No results found');
    return;
  }

  const html = `
    <div class="search-results">
      <h3>Search Results (${results.length})</h3>
      <div class="results-list">
        ${results.map(video => createSearchResultCard(video)).join('')}
      </div>
    </div>
  `;

  contentArea.innerHTML = html;
}

/**
 * Render loading state with skeleton cards
 */
export function showLoading(): void {
  if (!contentArea) return;

  const skeletonCards = Array(3).fill(null).map(() => createSkeletonCard()).join('');

  contentArea.innerHTML = `
    <div class="search-results loading">
      <h3>Loading...</h3>
      <div class="results-list">
        ${skeletonCards}
      </div>
    </div>
  `;
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
}

/**
 * Clear content area
 */
export function clearContent(): void {
  if (contentArea) {
    contentArea.innerHTML = '';
  }
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
