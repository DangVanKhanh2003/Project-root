/**
 * Suggestions State Functions
 * Manages search suggestion state, keyboard navigation, and query tracking
 */

import { getState, setState } from './state-manager';

/**
 * Set suggestions and show suggestion box
 * @param suggestions - Array of suggestion strings
 */
export function setSuggestions(suggestions: string[]): void {
  const currentState = getState();

  // Don't show suggestions if form is being submitted
  if (currentState.isSubmitting) {
    return;
  }

  const suggestionArray = Array.isArray(suggestions) ? suggestions : [];


  setState({
    suggestions: suggestionArray,
    showSuggestions: suggestionArray.length > 0,
    isLoadingSuggestions: false
  });
}

/**
 * Hide suggestion box
 */
export function hideSuggestions(): void {
  setState({ showSuggestions: false });
}

/**
 * Set loading state for suggestions
 * @param loading - Loading state for suggestions
 */
export function setLoadingSuggestions(loading: boolean): void {
  setState({ isLoadingSuggestions: Boolean(loading) });
}

/**
 * Clear suggestions
 */
export function clearSuggestions(): void {
  setState({
    suggestions: [],
    showSuggestions: false,
    isLoadingSuggestions: false
  });
}

/**
 * Set current query (input display value)
 * @param value - Query value to set
 */
export function setQuery(value: string): void {
  setState({ query: value || '' });
}

/**
 * Set original query (user's typed keyword when API called)
 * @param value - Original query value to set
 */
export function setOriginalQuery(value: string): void {
  setState({ originalQuery: value || '' });
}

/**
 * Set highlighted index for keyboard navigation
 * @param index - Index to highlight (-1 for no highlight)
 */
export function setHighlightedIndex(index: number): void {
  setState({ highlightedIndex: Number(index) });
}

/**
 * Get display suggestions (original query + API suggestions)
 * @param state - Optional state object (uses current state if not provided)
 * @returns Display suggestions array
 */
export function getDisplaySuggestions(state: ReturnType<typeof getState> | null = null): string[] {
  const currentState = state || getState();
  const { originalQuery, suggestions } = currentState;

  if (!originalQuery) {
    return suggestions;
  }

  // Filter out duplicate of original query from API suggestions
  const uniqueApiSuggestions = suggestions.filter(
    suggestion => suggestion.toLowerCase() !== originalQuery.toLowerCase()
  );

  return [originalQuery, ...uniqueApiSuggestions];
}

/**
 * Select a suggestion and update query
 * @param index - Index of suggestion to select
 */
export function selectSuggestion(index: number): void {
  const state = getState();
  const displaySuggestions = getDisplaySuggestions(state);
  const suggestion = displaySuggestions[index];

  if (suggestion) {
    setState({
      query: suggestion,
      highlightedIndex: index,
      showSuggestions: false
    });
  }
}

/**
 * Reset suggestion navigation state
 */
export function resetSuggestionNavigation(): void {
  setState({
    query: '',
    originalQuery: '',
    highlightedIndex: -1,
    showSuggestions: false
  });
}
