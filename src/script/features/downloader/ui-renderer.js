/**
 * UI Renderer for Input Form (View)
 * Responsible ONLY for updating DOM based on state
 * Does NOT change state directly
 */

// DOM element references (private)
let elements = {};

/**
 * Initialize renderer and setup DOM element references
 * Must be called before any render operations
 */
export function initRenderer() {
    elements = {
        form: document.getElementById('downloadForm'),
        urlInput: document.getElementById('videoUrl'),
        actionButton: document.getElementById('input-action-button'), // Combined paste/clear button
        submitButton: document.getElementById('submit-button'),
        buttonText: document.querySelector('#submit-button .button-text'),
        errorMessage: document.getElementById('error-message')
    };

    

    // Validate that all required elements exist
    const requiredElements = ['form', 'urlInput', 'submitButton', 'buttonText', 'actionButton'];
    const missingElements = requiredElements.filter(key => !elements[key]);

    if (missingElements.length > 0) {
        return false;
    }

    return true;
}

/**
 * Render UI based on current state
 * This is the main function called whenever state changes
 * @param {Object} state - Current state object
 * @param {Object} prevState - Previous state object (optional, for optimization)
 */
export function render(state, prevState = {}) {
    if (!elements.form) {
        return;
    }

    // Update button text and icon based on input type
    updateButtonText(state.inputType);

    // Update loading state (form interactions)
    updateLoadingState(state.isLoading);

    // Update error display
    updateErrorDisplay(state.error);

    // Update the action button state (Paste/Clear)
    updateActionButtonState(state.query && state.query.length > 0);

    // Log render for debugging
}

/**
 * Update button text - shows "Download"
 * @param {string} inputType - 'url' or 'keyword' (kept for compatibility)
 */
function updateButtonText(inputType) {
    if (!elements.buttonText) return;

    // Show "Download" button
    const icon = 'fas fa-download';
    const text = 'Download';

    elements.buttonText.innerHTML = `<i class="${icon}"></i> ${text}`;
}

/**
 * Update loading state - disable/enable form elements
 * @param {boolean} isLoading - Loading state
 */
function updateLoadingState(isLoading) {
    if (isLoading) {
        // Disable all form interactions
        elements.urlInput.disabled = true;
        elements.submitButton.disabled = true;

        // Disable optional buttons if they exist
        if (elements.actionButton) {
            elements.actionButton.disabled = true;
        }

        // Add loading class for potential CSS styling
        elements.form.classList.add('loading');
    } else {
        // Re-enable all form interactions
        elements.urlInput.disabled = false;
        elements.submitButton.disabled = false;

        // Re-enable optional buttons if they exist
        if (elements.actionButton) {
            elements.actionButton.disabled = false;
        }

        // Remove loading class
        elements.form.classList.remove('loading');
    }
}

/**
 * Update error message display
 * Note: Error display is now handled by content renderer
 * This function only manages form error styling
 * @param {string|null} error - Error message to display, or null to hide
 */
function updateErrorDisplay(error) {
    // Error messages are now handled by content renderer
    // This function only manages form styling for error states
    if (error) {
        // Add error styling to form
        elements.form.classList.add('has-error');
    } else {
        // Remove error styling from form
        elements.form.classList.remove('has-error');
    }
}

/**
 * Get DOM element references (read-only access for Controller)
 * @returns {Object} DOM element references
 */
export function getElements() {
    return { ...elements };
}

/**
 * Focus on the input field (utility function for Controller)
 */
export function focusInput() {
    if (elements.urlInput) {
        elements.urlInput.focus();
    }
}

/**
 * Get input value (utility function for Controller)
 * @returns {string} Current input value
 */
export function getInputValue() {
    return elements.urlInput ? elements.urlInput.value.trim() : '';
}

/**
 * Set input value (utility function for Controller)
 * @param {string} value - Value to set
 */
export function setInputValue(value) {
    if (elements.urlInput) {
        elements.urlInput.value = value || '';
    }
}

/**
 * Clear input field (utility function for Controller)
 */
export function clearInput() {
    setInputValue('');
}

/**
 * Update the state of the single action button (Paste/Clear).
 * @param {boolean} hasContent - Whether the input has content.
 */
function updateActionButtonState(hasContent) {
    if (!elements.actionButton) return;

    if (hasContent) {
        // Set to "Clear" state
        elements.actionButton.innerHTML = 'Clear';
        elements.actionButton.dataset.action = 'clear';
    } else {
        // Set to "Paste" state
        elements.actionButton.innerHTML = ' Paste';
        elements.actionButton.dataset.action = 'paste';
    }
}