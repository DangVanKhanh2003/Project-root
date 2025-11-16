/**
 * Suggestion Renderer (View)
 * Responsible ONLY for rendering suggestion dropdown based on state
 * Does NOT change state directly - follows existing MVC pattern
 */

// DOM element references (private)
let elements = {};

/**
 * Initialize suggestion renderer and setup DOM element references
 * Must be called before any render operations
 * @returns {boolean} Success status
 */
export function initSuggestionRenderer() {
    elements = {
        container: document.getElementById('suggestion-container'),
        input: document.getElementById('videoUrl') // Reference for positioning
    };

    

    // Validate required elements exist
    if (!elements.container) {
        return false;
    }

    if (!elements.input) {
        return false;
    }

    return true;
}

/**
 * Render suggestions based on current state
 * This is the main function called whenever suggestion-related state changes
 * @param {Object} state - Current state object
 * @param {Object} prevState - Previous state object (optional, for optimization)
 */
export function render(state, prevState = {}) {
    if (!elements.container) {
        return;
    }

    // Only render when suggestion-related state changes
    const suggestionStateChanged = (
        state.showSuggestions !== prevState?.showSuggestions ||
        state.suggestions !== prevState?.suggestions ||
        state.highlightedIndex !== prevState?.highlightedIndex ||
        state.originalQuery !== prevState?.originalQuery
    );

    if (!suggestionStateChanged) {
        return; // No suggestion state changes, skip render
    }

    // Update ARIA attributes on input
    updateInputAria(state);

    if (state.showSuggestions && state.suggestions.length > 0) {
        renderSuggestions(state);
    } else {
        hideSuggestions();
    }

}

/**
 * Render suggestion dropdown with current suggestions
 * @param {Object} state - Current state object
 */
function renderSuggestions(state) {
    const displaySuggestions = getDisplaySuggestions(state);

    // Limit to maximum 10 suggestions as per requirements
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

    // Scroll highlighted item into view if necessary
    if (state.highlightedIndex >= 0) {
        scrollHighlightedIntoView(state.highlightedIndex);
    }
}

/**
 * Hide suggestion dropdown with fade-out animation
 */
function hideSuggestions() {
    elements.container.classList.remove('suggestion-container--visible');

    // Clear content after animation completes
    setTimeout(() => {
        if (!elements.container.classList.contains('suggestion-container--visible')) {
            elements.container.innerHTML = '';
        }
    }, 150); // Match CSS transition duration
}

/**
 * Update ARIA attributes on input element for accessibility
 * @param {Object} state - Current state object
 */
function updateInputAria(state) {
    if (!elements.input) return;

    // Update aria-expanded to indicate dropdown state
    elements.input.setAttribute('aria-expanded', state.showSuggestions ? 'true' : 'false');

    // Update aria-activedescendant for highlighted suggestion
    if (state.showSuggestions && state.highlightedIndex >= 0) {
        const highlightedElement = elements.container.querySelector(`[data-suggestion-index="${state.highlightedIndex}"]`);
        if (highlightedElement) {
            // Add ID to highlighted element if not present
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
 * @param {number} highlightedIndex - Index of highlighted suggestion
 */
function scrollHighlightedIntoView(highlightedIndex) {
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
 * Helper function that matches state.js logic
 * @param {Object} state - Current state object
 * @returns {Array<string>} Display suggestions array
 */
function getDisplaySuggestions(state) {
    const { originalQuery, suggestions } = state;

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
 * Escape HTML to prevent XSS attacks
 * @param {string} str - String to escape
 * @returns {string} HTML-escaped string
 */
function escapeHtml(str) {
    if (!str) return '';

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Get suggestion item element by index
 * @param {number} index - Suggestion index
 * @returns {Element|null} Suggestion element or null
 */
export function getSuggestionElement(index) {
    if (!elements.container) return null;
    return elements.container.querySelector(`[data-suggestion-index="${index}"]`);
}

/**
 * Get total number of visible suggestions
 * @returns {number} Number of suggestions currently displayed
 */
export function getSuggestionCount() {
    if (!elements.container) return 0;
    const suggestionElements = elements.container.querySelectorAll('.suggestion-item');
    return suggestionElements.length;
}

/**
 * Get suggestion text by index
 * @param {number} index - Suggestion index
 * @returns {string|null} Suggestion text or null
 */
export function getSuggestionText(index) {
    const element = getSuggestionElement(index);
    if (!element) return null;
    return element.dataset.suggestionText || null;
}

/**
 * Check if suggestions are currently visible
 * @returns {boolean} Whether suggestions are visible
 */
export function isSuggestionsVisible() {
    if (!elements.container) return false;
    return elements.container.classList.contains('suggestion-container--visible');
}

/**
 * Get DOM element references (read-only access for Controller)
 * @returns {Object} DOM element references
 */
export function getElements() {
    return { ...elements };
}