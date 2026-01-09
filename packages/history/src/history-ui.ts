/**
 * History UI Module
 * Handles rendering and event management for history card
 */

import type { HistoryItem, HistoryDisplayConfig } from './types';
import { DEFAULT_HISTORY_CONFIG } from './types';
import {
  getHistory,
  getHistoryCount,
  hasMoreItems,
  removeFromHistory,
  clearHistory,
  getHistoryItem,
  configureStorage
} from './history-storage';
import { applyHistoryItem, getRelativeTime, onHistoryUpdate } from './history-service';

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

interface HistoryUIState {
  currentDisplayCount: number;
  container: HTMLElement | null;
  config: HistoryDisplayConfig;
  isDropdownOpen: boolean;
}

const state: HistoryUIState = {
  currentDisplayCount: 0,
  container: null,
  config: { ...DEFAULT_HISTORY_CONFIG },
  isDropdownOpen: false
};

/**
 * Generate SVG icons
 */
const icons = {
  menu: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <circle cx="10" cy="4" r="1.5"/>
    <circle cx="10" cy="10" r="1.5"/>
    <circle cx="10" cy="16" r="1.5"/>
  </svg>`,

  delete: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>`,

  close: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>`,

  fallback: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>`
};

/**
 * Render a single history item
 */
function renderHistoryItem(item: HistoryItem): string {
  const relativeTime = getRelativeTime(item.createdAt);
  const formatClass = item.format === 'mp3' ? 'history-card__format--mp3' : 'history-card__format--mp4';
  const qualityDisplay = item.format === 'mp3'
    ? (item.quality.includes('kbps') ? item.quality : `${item.quality}kbps`)
    : (item.quality.includes('p') ? item.quality : `${item.quality}p`);

  return `
    <li class="history-card__item" data-history-id="${item.id}">
      <div class="history-card__thumbnail${item.thumbnail ? '' : ' history-card__thumbnail--fallback'}">
        ${item.thumbnail
      ? `<img src="${item.thumbnail}" alt="" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('history-card__thumbnail--fallback')">`
      : ''
    }
      </div>
      <div class="history-card__content">
        <div class="history-card__video-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
        <div class="history-card__meta">
          ${item.author ? `<span class="history-card__author">${escapeHtml(item.author)}</span><span class="history-card__meta-separator">·</span>` : ''}
          <span class="history-card__format ${formatClass}">${item.format.toUpperCase()}</span>
          <span class="history-card__meta-separator">·</span>
          <span>${qualityDisplay}</span>
          <span class="history-card__meta-separator">·</span>
          <span>${relativeTime}</span>
        </div>
      </div>
      <button class="history-card__delete-btn" data-delete-id="${item.id}" title="Remove">
        ${icons.close}
      </button>
    </li>
  `;
}

/**
 * Render the complete history card
 */
function renderHistoryCard(items: HistoryItem[], totalCount: number): string {
  const showViewMore = items.length < totalCount;

  if (items.length === 0) {
    return `
      <div class="history-card hidden">
        <div class="history-card__header">
          <h3 class="history-card__title">Recent Downloads</h3>
        </div>
        <div class="history-card__empty">
          <div class="history-card__empty-text">No download history yet</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="history-card">
      <div class="history-card__header">
        <h3 class="history-card__title">Recent Downloads</h3>
        <div class="history-card__menu-wrapper">
          <button class="history-card__menu-btn" data-history-menu-toggle title="More options">
            ${icons.menu}
          </button>
          <div class="history-card__dropdown" data-history-dropdown>
            <button class="history-card__dropdown-item history-card__dropdown-item--danger" data-clear-history>
              ${icons.delete}
              <span>Clear all history</span>
            </button>
          </div>
        </div>
      </div>
      <ul class="history-card__list" data-history-list>
        ${items.map(renderHistoryItem).join('')}
      </ul>
      ${showViewMore ? `
        <div class="history-card__footer">
          <button class="history-card__view-all" data-history-view-more>
            View more
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Toggle dropdown menu
 */
function toggleDropdown(show?: boolean): void {
  const dropdown = state.container?.querySelector('[data-history-dropdown]');
  if (!dropdown) return;

  state.isDropdownOpen = show ?? !state.isDropdownOpen;
  dropdown.classList.toggle('show', state.isDropdownOpen);
}

/**
 * Handle item click - apply and convert
 */
function handleItemClick(id: string): void {
  const item = getHistoryItem(id);
  if (item) {
    applyHistoryItem(item);
  }
}

/**
 * Handle delete button click
 */
function handleDeleteClick(id: string, event: Event): void {
  event.stopPropagation();

  if (removeFromHistory(id)) {
    // Remove item from DOM with animation
    const itemElement = state.container?.querySelector(`[data-history-id="${id}"]`);
    if (itemElement) {
      itemElement.classList.add('removing');
      setTimeout(() => {
        refreshHistoryCard();
      }, 200);
    }
  }
}

/**
 * Handle view more click
 */
function handleViewMore(): void {
  state.currentDisplayCount += state.config.loadMoreCount;
  refreshHistoryCard();
}

/**
 * Handle clear all history
 */
function handleClearHistory(): void {
  clearHistory();
  toggleDropdown(false);
  refreshHistoryCard();
}

/**
 * Attach event listeners
 */
function attachEventListeners(): void {
  if (!state.container) return;

  // Use event delegation for better performance
  state.container.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    // Menu toggle
    if (target.closest('[data-history-menu-toggle]')) {
      event.stopPropagation();
      toggleDropdown();
      return;
    }

    // Clear history
    if (target.closest('[data-clear-history]')) {
      handleClearHistory();
      return;
    }

    // View more
    if (target.closest('[data-history-view-more]')) {
      handleViewMore();
      return;
    }

    // Delete button
    const deleteBtn = target.closest('[data-delete-id]') as HTMLElement;
    if (deleteBtn) {
      const id = deleteBtn.dataset.deleteId;
      if (id) handleDeleteClick(id, event);
      return;
    }

    // Item click (convert)
    const itemElement = target.closest('[data-history-id]') as HTMLElement;
    if (itemElement && !target.closest('.history-card__delete-btn')) {
      const id = itemElement.dataset.historyId;
      if (id) handleItemClick(id);
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    if (state.isDropdownOpen) {
      const dropdown = state.container?.querySelector('[data-history-dropdown]');
      const menuBtn = state.container?.querySelector('[data-history-menu-toggle]');
      if (dropdown && menuBtn && !dropdown.contains(event.target as Node) && !menuBtn.contains(event.target as Node)) {
        toggleDropdown(false);
      }
    }
  });
}

/**
 * Refresh the history card (re-render)
 */
export function refreshHistoryCard(): void {
  if (!state.container) return;

  const totalCount = getHistoryCount();
  const displayCount = Math.max(state.currentDisplayCount, state.config.initialCount);
  const items = getHistory(0, displayCount);

  state.currentDisplayCount = items.length;

  state.container.innerHTML = renderHistoryCard(items, totalCount);
}

/**
 * Initialize history UI
 * @param containerSelector - CSS selector for the container element
 * @param config - Optional configuration overrides
 */
export function initHistoryUI(
  containerSelector: string,
  config?: Partial<HistoryDisplayConfig>
): void {
  // Apply config
  if (config) {
    state.config = { ...DEFAULT_HISTORY_CONFIG, ...config };
    configureStorage(state.config);
  }

  // Find container
  state.container = document.querySelector(containerSelector);
  if (!state.container) {
    console.error(`[History] Container not found: ${containerSelector}`);
    return;
  }

  // Initial display count
  state.currentDisplayCount = state.config.initialCount;

  // Render initial state
  refreshHistoryCard();

  // Attach events
  attachEventListeners();

  // Subscribe to history updates (e.g., when new item is saved)
  onHistoryUpdate(() => {
    refreshHistoryCard();
  });
}

/**
 * Destroy history UI (cleanup)
 */
export function destroyHistoryUI(): void {
  state.container = null;
  state.currentDisplayCount = 0;
  state.isDropdownOpen = false;
}
