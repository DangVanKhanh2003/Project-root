/**
 * State Manager - Core State Management
 * Centralized state storage and callback management
 */

import type { AppState, StateChangeCallback, PartialState } from './types';

// ==========================================
// Initial State Definition
// ==========================================
const initialState: AppState = {
  // Core UI
  inputType: 'url',
  isLoading: false,
  isSubmitting: false,
  error: null,
  showPasteButton: true,
  showClearButton: false,

  // Suggestions
  suggestions: [],
  showSuggestions: false,
  isLoadingSuggestions: false,
  query: '',
  originalQuery: '',
  highlightedIndex: -1,

  // Search Results & Pagination
  results: [],
  resultsLoading: false,
  viewingItem: null,
  searchPagination: {
    nextPageToken: null,
    hasNextPage: false,
    isLoadingMore: false,
    loadMoreCount: 0
  },
  isFromListItemClick: false,

  // Media Detail
  videoDetail: null,
  galleryDetail: null,

  // Download Options
  activeTab: 'video',
  downloadTasks: {},

  // Conversion Tasks
  conversionTasks: {},
  activeConversion: null,

  // Multifile
  multifileSession: null,

  // Multifile Reuse
  listCurrentUrl: [],
  recentDownload: null
};

// ==========================================
// State Storage
// ==========================================
let currentState: AppState = { ...initialState };
let renderCallback: StateChangeCallback | null = null;

// ==========================================
// Core State Functions
// ==========================================

/**
 * Get current state (readonly)
 * @returns Current application state
 */
export function getState(): Readonly<AppState> {
  return { ...currentState };
}

/**
 * Update state with partial updates
 * Triggers render callback if registered
 * @param newState - Partial state updates
 */
export function setState(newState: PartialState): void {
  const prevState = { ...currentState };
  currentState = { ...currentState, ...newState };

  if (renderCallback) {
    renderCallback(currentState, prevState);
  }
}

/**
 * Register render callback
 * Called whenever state changes
 * @param callback - Callback function
 */
export function setRenderCallback(callback: StateChangeCallback): void {
  renderCallback = callback;
}

/**
 * Reset state to initial values
 */
export function resetState(): void {
  setState(initialState);
}

/**
 * Get initial state (for testing/debugging)
 * @returns Initial state
 */
export function getInitialState(): AppState {
  return { ...initialState };
}

/**
 * Replace entire state (use with caution)
 * @param newState - Complete new state
 */
export function replaceState(newState: AppState): void {
  const prevState = { ...currentState };
  currentState = { ...newState };

  if (renderCallback) {
    renderCallback(currentState, prevState);
  }
}
