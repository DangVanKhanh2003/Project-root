/**
 * Suggestion Dropdown Component
 * Renders suggestion dropdown based on state
 *
 * @module @downloader/ui-components/SuggestionDropdown
 */

export interface SuggestionState {
  showSuggestions: boolean;
  suggestions: string[];
  highlightedIndex: number;
  originalQuery: string;
}

export interface SuggestionDropdownOptions {
  containerId: string;
  inputId: string;
  maxSuggestions?: number;
}

/**
 * Suggestion Dropdown Renderer
 *
 * WHY: Reusable dropdown for search suggestions
 * CONTRACT: Constructor(options) creates renderer, render(state) updates UI
 * PRE: Valid container and input elements exist in DOM
 * POST: Dropdown rendered with suggestions
 * EDGE: Handles empty suggestions, keyboard navigation
 * USAGE: const dropdown = new SuggestionDropdown({ containerId, inputId }); dropdown.render(state);
 */
export class SuggestionDropdown {
  private container: HTMLElement | null = null;
  private input: HTMLInputElement | null = null;
  private options: Required<SuggestionDropdownOptions>;
  private previousState: SuggestionState | null = null;

  constructor(options: SuggestionDropdownOptions) {
    this.options = {
      ...options,
      maxSuggestions: options.maxSuggestions || 10
    };
  }

  /**
   * Initialize suggestion dropdown
   */
  init(): boolean {
    this.container = document.getElementById(this.options.containerId);
    this.input = document.getElementById(this.options.inputId) as HTMLInputElement;

    if (!this.container || !this.input) {
      console.warn('[SuggestionDropdown] Container or input not found');
      return false;
    }

    return true;
  }

  /**
   * Render suggestions based on state
   */
  render(state: SuggestionState): void {
    if (!this.container) {
      return;
    }

    // Check if suggestion state changed
    const suggestionStateChanged = (
      state.showSuggestions !== this.previousState?.showSuggestions ||
      state.suggestions !== this.previousState?.suggestions ||
      state.highlightedIndex !== this.previousState?.highlightedIndex ||
      state.originalQuery !== this.previousState?.originalQuery
    );

    if (!suggestionStateChanged) {
      return;
    }

    // Update ARIA attributes
    this.updateInputAria(state);

    // Show or hide suggestions
    if (state.showSuggestions && state.suggestions.length > 0) {
      this.renderSuggestions(state);
    } else {
      this.hideSuggestions();
    }

    this.previousState = { ...state };
  }

  /**
   * Render suggestion dropdown
   */
  private renderSuggestions(state: SuggestionState): void {
    if (!this.container) return;

    const displaySuggestions = this.getDisplaySuggestions(state);
    const limitedSuggestions = displaySuggestions.slice(0, this.options.maxSuggestions);

    const suggestionItems = limitedSuggestions.map((suggestion, index) => {
      const isHighlighted = index === state.highlightedIndex;
      const isOriginal = index === 0 && suggestion === state.originalQuery;

      return `
        <li class="suggestion-item ${isHighlighted ? 'suggestion-item--highlighted' : ''} ${isOriginal ? 'suggestion-item--original' : ''}"
            data-suggestion-index="${index}"
            data-suggestion-text="${this.escapeHtml(suggestion)}"
            role="option"
            aria-selected="${isHighlighted}"
            tabindex="-1">
            ${this.escapeHtml(suggestion)}
        </li>
      `;
    }).join('');

    this.container.innerHTML = `
      <ul class="suggestion-list"
          role="listbox"
          aria-label="Search suggestions">
          ${suggestionItems}
      </ul>
    `;

    // Show container with fade-in animation
    this.container.classList.add('suggestion-container--visible');

    // Scroll highlighted item into view
    if (state.highlightedIndex >= 0) {
      this.scrollHighlightedIntoView(state.highlightedIndex);
    }
  }

  /**
   * Hide suggestion dropdown
   */
  private hideSuggestions(): void {
    if (!this.container) return;

    this.container.classList.remove('suggestion-container--visible');

    // Clear content after animation
    setTimeout(() => {
      if (this.container && !this.container.classList.contains('suggestion-container--visible')) {
        this.container.innerHTML = '';
      }
    }, 150);
  }

  /**
   * Update ARIA attributes on input
   */
  private updateInputAria(state: SuggestionState): void {
    if (!this.input) return;

    // Only set aria-expanded and related attributes when suggestions are visible
    if (state.showSuggestions && state.highlightedIndex >= 0) {
      const highlightedElement = this.container?.querySelector(`[data-suggestion-index="${state.highlightedIndex}"]`);
      if (highlightedElement) {
        if (!highlightedElement.id) {
          highlightedElement.id = `suggestion-${state.highlightedIndex}`;
        }
        this.input.setAttribute('aria-activedescendant', highlightedElement.id);
      }
    } else {
      this.input.removeAttribute('aria-activedescendant');
    }
  }

  /**
   * Scroll highlighted suggestion into view
   */
  private scrollHighlightedIntoView(highlightedIndex: number): void {
    if (!this.container) return;

    const highlightedElement = this.container.querySelector(`[data-suggestion-index="${highlightedIndex}"]`);
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
  private getDisplaySuggestions(state: SuggestionState): string[] {
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
  private escapeHtml(str: string): string {
    if (!str) return '';

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Destroy dropdown and cleanup
   */
  destroy(): void {
    this.hideSuggestions();
    this.container = null;
    this.input = null;
    this.previousState = null;
  }
}
