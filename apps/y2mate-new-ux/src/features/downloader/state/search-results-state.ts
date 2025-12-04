/**
 * Search Results State Functions
 * Manages search results, pagination, and viewing item state
 */

import type { SearchV2ItemDto } from '@downloader/core';
import type { ViewingItem, SearchPagination } from './types';
import { getState, setState } from './state-manager';

/**
 * Set search results
 * @param results - Array of video items
 */
export function setResults(results: SearchV2ItemDto[]): void {
  const resultsArray = Array.isArray(results) ? results : [];
  setState({
    results: resultsArray,
    resultsLoading: false
  });
}

/**
 * Set loading state for search results
 * @param loading - Loading state
 */
export function setResultsLoading(loading: boolean): void {
  setState({ resultsLoading: Boolean(loading) });
}

/**
 * Clear results data
 */
export function clearResultsData(): void {
  setState({
    results: [],
    resultsLoading: false,
    searchPagination: {
      nextPageToken: null,
      hasNextPage: false,
      isLoadingMore: false,
      loadMoreCount: 0
    }
  });
}

/**
 * Set viewing item (for detail view)
 * @param item - Item to view
 */
export function setViewingItem(item: ViewingItem): void {
  // Always clear results when setting viewing item
  setState({
    viewingItem: item,
    results: []
  });
}

/**
 * Clear viewing item (back to results)
 */
export function clearViewingItem(): void {
  setState({ viewingItem: null });
}

/**
 * Set flag to indicate submit is from list item click
 * @param isFromClick - True if from list item click
 */
export function setIsFromListItemClick(isFromClick: boolean): void {
  setState({ isFromListItemClick: Boolean(isFromClick) });
}

/**
 * Set search pagination data from API response
 * @param paginationData - Pagination object from search v2 API
 */
export function setSearchPagination(paginationData: Partial<SearchPagination>): void {
  if (!paginationData || typeof paginationData !== 'object') {
    return;
  }

  // Preserve loadMoreCount when updating from API response
  const currentState = getState();
  const existingCount = currentState.searchPagination?.loadMoreCount || 0;

  setState({
    searchPagination: {
      nextPageToken: paginationData.nextPageToken || null,
      hasNextPage: Boolean(paginationData.hasNextPage),
      isLoadingMore: false,
      loadMoreCount: existingCount // Preserve existing count
    }
  });
}

/**
 * Set loading state for load more action
 * @param isLoading - Loading state
 */
export function setLoadingMore(isLoading: boolean): void {
  const currentState = getState();
  setState({
    searchPagination: {
      ...currentState.searchPagination,
      isLoadingMore: Boolean(isLoading)
    }
  });
}

/**
 * Clear search pagination state
 */
export function clearSearchPagination(): void {
  setState({
    searchPagination: {
      nextPageToken: null,
      hasNextPage: false,
      isLoadingMore: false,
      loadMoreCount: 0
    }
  });
}

/**
 * Get current search pagination state
 * @returns Pagination state
 */
export function getSearchPagination(): SearchPagination {
  const state = getState();
  const pagination = state.searchPagination;

  // Defensive: Ensure loadMoreCount always exists
  return {
    nextPageToken: pagination?.nextPageToken || null,
    hasNextPage: Boolean(pagination?.hasNextPage),
    isLoadingMore: Boolean(pagination?.isLoadingMore),
    loadMoreCount: pagination?.loadMoreCount || 0 // Always fallback to 0
  };
}

/**
 * Increment load more counter
 */
export function incrementLoadMoreCount(): void {
  const currentState = getState();
  const currentCount = currentState.searchPagination.loadMoreCount || 0;

  setState({
    searchPagination: {
      ...currentState.searchPagination,
      loadMoreCount: currentCount + 1
    }
  });
}

/**
 * Decrement load more counter (for rollback on error)
 */
export function decrementLoadMoreCount(): void {
  const currentState = getState();
  const currentCount = currentState.searchPagination.loadMoreCount || 0;

  // Prevent negative values
  if (currentCount > 0) {
    setState({
      searchPagination: {
        ...currentState.searchPagination,
        loadMoreCount: currentCount - 1
      }
    });
  }
}
