/**
 * Suggestion Renderer - TypeScript
 * Renders suggestion dropdown based on state
 */

import type { AppState } from '../../features/downloader/state/types';

// DOM element references
let elements = {
  container: null as HTMLElement | null,
  input: null as HTMLInputElement | null,
};

/**
 * Initialize suggestion renderer
 */
export function initSuggestionRenderer(): boolean {

  elements.container = document.getElementById('suggestion-container');
  elements.input = document.getElementById('videoUrl') as HTMLInputElement;


  if (!elements.container) {
    return false;
  }

  if (!elements.input) {
    return false;
  }

  return true;
}

/**
 * Render suggestions based on state
 */
export function render(state: AppState, prevState?: AppState): void {

  if (!elements.container) {
    return;
  }

  // Check if suggestion state changed
  const suggestionStateChanged = (
    state.showSuggestions !== prevState?.showSuggestions ||
    state.suggestions !== prevState?.suggestions ||
    state.highlightedIndex !== prevState?.highlightedIndex ||
    state.originalQuery !== prevState?.originalQuery
  );


  if (!suggestionStateChanged) {
    return;
  }

  // Update ARIA attributes
  updateInputAria(state);

  // Show or hide suggestions
  if (state.showSuggestions && state.suggestions.length > 0) {
    renderSuggestions(state);
  } else {
    hideSuggestions();
  }
}

/**
 * Render suggestion dropdown
 */
function renderSuggestions(state: AppState): void {
  if (!elements.container) return;

  const displaySuggestions = getDisplaySuggestions(state);
  const limitedSuggestions = displaySuggestions.slice(0, 10);


  const suggestionItems = limitedSuggestions.map((suggestion, index) => {
    const isHighlighted = index === state.highlightedIndex;
    const isOriginal = index === 0 && suggestion === state.originalQuery;

    return `
      <li class="suggestion-item ${isHighlighted ? 'suggestion-item--highlighted' : ''} ${isOriginal ? 'suggestion-item--original' : ''}"
          data-suggestion-index="${index}"
          data-suggestion-text="${escapeHtml(suggestion)}"
          role="option"
          aria-selected="${isHighlighted}"
          tabindex="-1">
          ${escapeHtml(suggestion)}
      </li>
    `;
  }).join('');

  elements.container.innerHTML = `
    <ul class="suggestion-list"
        role="listbox"
        aria-label="Search suggestions">
        ${suggestionItems}
    </ul>
  `;

  // Show container with fade-in animation
  elements.container.classList.add('suggestion-container--visible');

  // Scroll highlighted item into view
  if (state.highlightedIndex >= 0) {
    scrollHighlightedIntoView(state.highlightedIndex);
  }
}

/**
 * Hide suggestion dropdown
 */
function hideSuggestions(): void {
  if (!elements.container) return;

  elements.container.classList.remove('suggestion-container--visible');

  // Clear content after animation
  setTimeout(() => {
    if (elements.container && !elements.container.classList.contains('suggestion-container--visible')) {
      elements.container.innerHTML = '';
    }
  }, 150);
}

/**
 * Update ARIA attributes on input
 */
function updateInputAria(state: AppState): void {
  if (!elements.input) return;

  elements.input.setAttribute('aria-expanded', state.showSuggestions ? 'true' : 'false');

  if (state.showSuggestions && state.highlightedIndex >= 0) {
    const highlightedElement = elements.container?.querySelector(`[data-suggestion-index="${state.highlightedIndex}"]`);
    if (highlightedElement) {
      if (!highlightedElement.id) {
        highlightedElement.id = `suggestion-${state.highlightedIndex}`;
      }
      elements.input.setAttribute('aria-activedescendant', highlightedElement.id);
    }
  } else {
    elements.input.removeAttribute('aria-activedescendant');
  }
}

/**
 * Scroll highlighted suggestion into view
 */
function scrollHighlightedIntoView(highlightedIndex: number): void {
  if (!elements.container) return;

  const highlightedElement = elements.container.querySelector(`[data-suggestion-index="${highlightedIndex}"]`);
  if (highlightedElement) {
    highlightedElement.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }
}

/**
 * Get display suggestions (original query + API suggestions)
 */
function getDisplaySuggestions(state: AppState): string[] {
  const { originalQuery, suggestions } = state;

  if (!originalQuery) {
    return suggestions;
  }

  // Filter out duplicate
  const uniqueApiSuggestions = suggestions.filter(
    suggestion => suggestion.toLowerCase() !== originalQuery.toLowerCase()
  );

  return [originalQuery, ...uniqueApiSuggestions];
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str: string): string {
  if (!str) return '';

  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
