/**
 * Input Form Controller
 * Handles user interactions and business logic
 * Communicates with Model (state.js) and uses View utilities
 */

// Import service and utilities from downloader library
import { createVerifiedService, DownloaderUtils } from '../../libs/downloader-lib-standalone/index.js';

// Import environment configuration
import { getApiBaseUrl, getTimeout } from '../../environment.js';

// Import CAPTCHA protection
import { withCaptchaProtection } from '../../libs/captcha-core/captcha-ui.js';

// Import fake data generator for immediate YouTube video rendering
import {
    generateFakeVideoDetail,
    canGenerateFakeData,
    createTitleContext
} from '../../libs/downloader-lib-standalone/fake-data-generator.js';

// Import YouTube metadata enhancer for progressive metadata enhancement
import { enhanceYouTubeMetadata } from './youtube-metadata.js';

// CSS imports removed - all CSS now bundled in main.js

// Import state management functions
import {
    getState,
    setState,
    setLoading,
    setError,
    clearError,
    setInputType,
    setSubmitting,
    clearResultsData,
    setResultsLoading,
    // Suggestion-related functions
    setSuggestions,
    hideSuggestions,
    setLoadingSuggestions,
    setQuery,
    setOriginalQuery,
    setHighlightedIndex,
    getDisplaySuggestions,
    // Detail state functions (newly added)
    setVideoDetail,
    setGalleryDetail,
    clearDetailStates,
    // Conversion cleanup functions
    clearConversionTasks,
    // Submit source tracking
    setIsFromListItemClick,
    // Search pagination functions (Search V2 API)
    setSearchPagination,
    setLoadingMore,
    clearSearchPagination,
    getSearchPagination,
    incrementLoadMoreCount
} from './state.js';

// Import content renderer
import { renderMessage, renderData, clearContent, showLoading } from './content-renderer.js';

// Import scroll behavior
import { initImmediateScroll } from '../../libs/scroll-core/scroll-behavior.js';

// Import polling cleanup
import { cleanupPollingManager } from './concurrent-polling.js';

// Import view utilities
import {
    getElements,
    getInputValue,
    setInputValue,
    clearInput,
    focusInput
} from './ui-renderer.js';

// Initialize service with environment configuration and CAPTCHA protection
const service = createVerifiedService({
    apiBaseUrl: getApiBaseUrl(),
    timeout: getTimeout('default')
}, {}, withCaptchaProtection);

/**
 * Debounced function to get suggestions
 */
const debouncedGetSuggestions = DownloaderUtils.debounce(async (query) => {
    if (!query || query.length === 0) {
        return;
    }

    try {
        setLoadingSuggestions(true);

        const result = await service.getSuggestions(query);

        // Update state with fetched suggestions - extract data array
        setSuggestions(result.data || []);
    } catch (error) {
        // On failure, do not clear existing suggestions. Just log the error
        // and ensure the loading indicator is turned off.
        setLoadingSuggestions(false);
    }
}, 150); // 150ms debounce for faster response

/**
 * Safely cancel debounced suggestions
 */
function cancelDebouncedSuggestions() {
    if (debouncedGetSuggestions && typeof debouncedGetSuggestions.cancel === 'function') {
        debouncedGetSuggestions.cancel();
    }
}

/**
 * Handle input changes to detect input type and get suggestions
 */
function handleInput(event) {
    const inputValue = getInputValue();

    // Clear error when user types
    clearError();

    // Don't clear detail states here - let user see existing content while typing
    // Detail states will be cleared on submit instead

    // Update current query state
    setQuery(inputValue);

    // Detect input type using DownloaderUtils
    if (DownloaderUtils.isLikelyUrl(inputValue)) {
        setInputType('url');
        hideSuggestions(); // URLs don't get suggestions
        cancelDebouncedSuggestions();

        // Check for auto-submit conditions
        const shouldAutoSubmit = event && (
            event.inputType === 'insertFromPaste' ||
            event.inputType === 'insertFromPasteButton'
        );

        // If the input event was triggered by a paste, submit the form
        if (shouldAutoSubmit) {
            setSubmitting(true); // Prevent suggestion interference during auto-submit
            const elements = getElements();
            if (elements.form) {
                elements.form.requestSubmit();
            }
        }
    } else {
        setInputType('keyword');

        // Check for paste button scroll (same behavior as input click)
        const isPasteButton = event && (
            event.inputType === 'insertFromPasteButton'
        );

        if (isPasteButton) {
            // Trigger scroll for paste keyword (same as input click behavior)
            initImmediateScroll('keyword');
        }

        // Get suggestions for keywords (debounced)
        const trimmedValue = inputValue.trim();

        if (trimmedValue.length >= 1) {
            // Set original query when starting to fetch suggestions
            setOriginalQuery(trimmedValue);
            debouncedGetSuggestions(trimmedValue);
        } else {
            hideSuggestions();
        }
    }
}

/**
 * Handle paste button click
 */
async function handlePaste() {
    try {
        // 1. Check for modern clipboard API support
        if (!navigator.clipboard?.readText || !navigator.permissions?.query) {
            // Fallback for older browsers or environments without Permissions API
            focusInput();
            document.execCommand('paste');
            // Trigger manual update after a short delay for fallback
            setTimeout(() => {
                const syntheticEvent = {
                    type: 'paste-button-legacy',
                    inputType: 'insertFromPasteButton',
                    target: getElements().urlInput
                };
                handleInput(syntheticEvent);
            }, 100);
            return;
        }

        // 2. Check the permission status proactively
        const permissionStatus = await navigator.permissions.query({ name: 'clipboard-read' });

        if (permissionStatus.state === 'denied') {
            // If denied, we cannot trigger the prompt. Inform the user how to fix it.
            renderMessage('error', 'Clipboard access was denied. Please enable it in your browser settings to use this feature.');
            focusInput(); // Still allow manual paste
            return;
        }

        // 3. If granted or prompt, attempt to read. This will trigger the prompt if state is 'prompt'.
        const text = await navigator.clipboard.readText();
        const trimmedText = text.trim();

        setInputValue(trimmedText);
        // Create a synthetic event to indicate this was from a paste action
        const syntheticEvent = {
            type: 'paste-button',
            inputType: 'insertFromPasteButton',
            target: getElements().urlInput,
            pastedContent: trimmedText
        };

        handleInput(syntheticEvent); // Trigger input type detection with paste indicator

    } catch (error) {
        // This catch block now handles cases where the user dismisses the prompt, or other unexpected errors.
        if (error.name === 'NotAllowedError') {
            // This occurs if the user actively dismisses the permission prompt.
            renderMessage('warning', 'Paste from clipboard was cancelled.');
        } else {
            renderMessage('error', 'Failed to paste from clipboard. Please try pasting manually.');
        }
        focusInput(); // Focus input for manual paste as a fallback
    }
}

/**
 * Handle clear button click
 * Only clears input value, keeps UI/content unchanged
 */
function handleClear() {
    clearInput();
    setInputType('url'); // Reset to default type
    clearError();
    hideSuggestions();
    cancelDebouncedSuggestions();
    setQuery('');
    setOriginalQuery('');
    setHighlightedIndex(-1);

    // Cleanup all active conversions when clearing
    clearConversionTasks();      // Abort all conversion tasks
    cleanupPollingManager();     // Stop all polling intervals

    // DO NOT clear detail states or content area - keep UI as is
    focusInput();
}

/**
 * Handles clicks on the combined action button (Paste/Clear).
 * @param {Event} event The click event.
 */
function handleActionButtonClick(event) {
    const action = event.currentTarget.dataset.action;
    if (action === 'paste') {
        handlePaste();
    } else if (action === 'clear') {
        handleClear();
    }
}

/**
 * Handle keyboard navigation for suggestions
 */
function handleKeyDown(event) {
    const state = getState();

    // Only handle navigation when suggestions are visible
    if (!state.showSuggestions || state.suggestions.length === 0) {
        return; // Let default behavior proceed
    }

    const displaySuggestions = getDisplaySuggestions(state);

    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            navigateDown(state, displaySuggestions);
            break;

        case 'ArrowUp':
            event.preventDefault();
            navigateUp(state, displaySuggestions);
            break;

        case 'Enter':
            event.preventDefault();
            setSubmitting(true); // Prevent suggestions from reappearing
            selectCurrentSuggestion(state);
            break;

        case 'Escape':
            event.preventDefault();
            returnToOriginal(state);
            break;

        default:
            // Allow other keys to proceed normally
            break;
    }
}

/**
 * Navigate down in suggestion list (with circular wrap)
 */
function navigateDown(state, displaySuggestions) {
    let newIndex;
    if (state.highlightedIndex === displaySuggestions.length - 1) {
        // Wrap: cuối → đầu (include original)
        newIndex = 0;
    } else {
        newIndex = state.highlightedIndex + 1;
    }

    setHighlightedIndex(newIndex);
    setQuery(displaySuggestions[newIndex]); // Update input immediately
    // Sync input value with state
    setInputValue(displaySuggestions[newIndex]);
}

/**
 * Navigate up in suggestion list (with circular wrap)
 */
function navigateUp(state, displaySuggestions) {
    let newIndex;
    if (state.highlightedIndex <= 0) {
        // Wrap: đầu → cuối
        newIndex = displaySuggestions.length - 1;
    } else {
        newIndex = state.highlightedIndex - 1;
    }

    setHighlightedIndex(newIndex);
    setQuery(displaySuggestions[newIndex]); // Update input immediately
    // Sync input value with state
    setInputValue(displaySuggestions[newIndex]);
}

/**
 * Select current highlighted suggestion and submit
 */
function selectCurrentSuggestion(state) {
    // Submit form with current input value (already updated by navigation)
    cancelDebouncedSuggestions();
    hideSuggestions();
    setHighlightedIndex(-1);

    // Trigger form submission
    const elements = getElements();
    if (elements.form) {
        elements.form.requestSubmit();
    }
}

/**
 * Return to original query and clear highlights
 */
function returnToOriginal(state) {
    cancelDebouncedSuggestions();
    setQuery(state.originalQuery); // Return to original typed value
    setInputValue(state.originalQuery); // Sync input value
    setHighlightedIndex(-1); // Clear highlight
    hideSuggestions();
}

/**
 * Handle suggestion click events
 */
function handleSuggestionClick(event) {
    const suggestionItem = event.target.closest('.suggestion-item');
    if (!suggestionItem) return;

    const suggestionText = suggestionItem.dataset.suggestionText;
    const suggestionIndex = parseInt(suggestionItem.dataset.suggestionIndex, 10);


    if (suggestionText) {
        // Set submitting flag to prevent suggestion interference
        setSubmitting(true);

        // Cancel any pending suggestion fetches
        cancelDebouncedSuggestions();

        // Update input value + submit immediately (as per requirements)
        setQuery(suggestionText);
        setInputValue(suggestionText);
        setHighlightedIndex(suggestionIndex);
        hideSuggestions();

        // Auto-submit after slight delay to ensure state updates
        setTimeout(() => {
            const elements = getElements();
            if (elements.form) {
                elements.form.requestSubmit();
            }
        }, 50);
    }
}





/**
 * Handle form submission with 3-step detection logic
 */
async function handleSubmit(event) {
    event.preventDefault();

    // Set submitting flag immediately to prevent suggestion interference
    setSubmitting(true);

    getElements().urlInput.blur();

    const inputValue = getInputValue();

    if (!inputValue) {
        setError('Please enter a URL or keyword');
        setSubmitting(false); // Reset flag on early return
        return;
    }

    // Note: Scroll will be called after skeleton is rendered to ensure correct position calculation

    // Block if already loading
    const currentState = getState();
    if (currentState.isLoading) {
        return;
    }

    // Check if this submit is from list item click
    const isFromListClick = currentState.isFromListItemClick;

    // Clear any existing detail states before starting new request
    clearDetailStates();

    // Cleanup all active conversions and stop polling
    clearConversionTasks();      // Abort all conversion tasks
    cleanupPollingManager();     // Stop all polling intervals

    // Set loading state
    setLoading(true);
    clearError();

    try {
        let caseType = '';
        let result = null;

        // 🐛 DEBUG: Log detection logic for skeleton issue analysis


        // Step 1: Check if it's a URL using isLikelyUrl
        if (DownloaderUtils.isLikelyUrl(inputValue)) {
            // Case 1: URL - Only YouTube URLs supported with fake data workflow
            caseType = 'media_url';

            // NEW: Check if this is a YouTube URL that can use fake data workflow
            if (canGenerateFakeData(inputValue)) {
                // YouTube URL - Show skeleton 0.3s then use fake data

                // Add video to queue API (fire-and-forget notification)
                service.addVideoToQueue(inputValue).then(result => {
                    if (result.ok) {
                    } else {
                    }
                }).catch(error => {
                });

                // Clear content if needed and show skeleton
                if (!isFromListClick) {
                    clearContent();
                    showLoading('detail');
                } else {
                    // Append detail skeleton below search results
                    showLoading('detail', true);
                }

                // Initialize scroll after skeleton render
                setTimeout(() => {
                    initImmediateScroll('url');
                }, 50);

                // Generate fake data after 0.3s skeleton display
                setTimeout(() => {
                    try {
                        // Create title context based on submission source
                        const titleContext = isFromListClick
                            ? createTitleContext(true, currentState.viewingItem?.title)
                            : createTitleContext(false);

                        // Generate and set fake video detail after skeleton delay
                        const fakeVideoDetail = generateFakeVideoDetail(inputValue, titleContext);
                        setVideoDetail(fakeVideoDetail);

                        // Start progressive YouTube metadata enhancement (non-blocking)
                        enhanceYouTubeMetadata(inputValue).catch(error => {
                            // Error already handled in enhanceYouTubeMetadata, just log
                        });

                        // Set result for success flow
                        result = fakeVideoDetail;
                    } catch (error) {
                        renderMessage('error', 'Failed to process YouTube URL. Please try again.');
                        return; // Exit early on error
                    }
                }, 300); // 0.3s delay for skeleton display
            } else {
                // Non-YouTube URL - Use traditional extract API workflow with skeleton

                // Show skeleton for non-YouTube URLs
                if (!isFromListClick) {
                    clearContent();
                    showLoading('detail');
                } else {
                    // Append detail skeleton below search results
                    showLoading('detail', true);
                }

                // Initialize scroll after skeleton render
                setTimeout(() => {
                    initImmediateScroll('url');
                }, 50);

                try {
                    
                    // Traditional API call for social media platforms
                    const r = await service.extractMediaDirect(inputValue);
                    
                    if (r.status === 'success') {
                        result = r.data;

                        // Add original URL to meta for retry functionality
                        if (r.data.meta) {
                            r.data.meta.originalUrl = inputValue;
                        }

                        // Check if this is gallery content or single video
                        if (r.data.gallery && Array.isArray(r.data.gallery) && r.data.gallery.length > 0) {
                            setGalleryDetail(r.data);
                        } else {
                            setVideoDetail(r.data);
                        }
                    } else if (r.status === 'warning') {
                        result = r.data; // Handle empty formats as success with data

                        // Add original URL to meta for retry functionality
                        if (r.data.meta) {
                            r.data.meta.originalUrl = inputValue;
                        }

                        // Check if this is gallery content or single video
                        if (r.data.gallery && Array.isArray(r.data.gallery) && r.data.gallery.length > 0) {
                            setGalleryDetail(r.data);
                        } else {
                            setVideoDetail(r.data);
                        }
                    } else {
                        // Error case
                        renderMessage(r.status, r.message);
                        clearDetailStates(); // Clear any existing detail states
                        return; // Exit early on error
                    }
                } catch (error) {
                    renderMessage('error', error.message || 'Failed to extract media information.');
                    clearDetailStates();
                    return;
                }
            }
        }
        // Step 3: Keyword search
        else {
            // Case 3: Keyword - Use LIST skeleton
            caseType = 'keyword';

            // Clear previous content and show skeleton loading (always clear for keyword search)
            clearContent();
            clearResultsData();
            setResultsLoading(true);
            showLoading('list');

            // --- Initialize Immediate Scroll AFTER skeleton render ---
            setTimeout(() => {
                initImmediateScroll('keyword');
            }, 50);
            // --------------------------------------------------------

            // Use Search V2 API with pagination support
            const r = await service.searchV2(inputValue, { limit: 12 });


            if (r.status === 'success') {
                // Save pagination data from response
                if (r.data && r.data.pagination) {
                    setSearchPagination(r.data.pagination);
                } else {
                }

                // Render search results using content renderer
                await renderData('search-results', r.data);
                result = r.data; // For final logging
            } else if (r.status === 'warning') {
                // Handle empty results - show message instead of empty data
                renderMessage(r.status, r.message);
                result = r.data; // For final logging
            } else {
                // Error case
                renderMessage(r.status, r.message);
                clearResultsData();
                return; // Exit early on error
            }

            setResultsLoading(false);
        }

        // Log successful result (only reached when no errors occurred)


    } catch (error) {
        // Fallback error handling for unexpected errors (e.g., from DownloaderUtils)
        setError('An unexpected error occurred. Please try again.');
    } finally {
        // Always stop loading in finally block as required
        setLoading(false);
        // Reset submitting flag to allow suggestions again
        setSubmitting(false);
        // Reset list item click flag
        setIsFromListItemClick(false);
    }
}

/**
 * Handle load more button click for pagination
 * Appends new search results to existing results
 * Maximum 2 load more operations allowed
 */
export async function handleLoadMore() {
    const state = getState();
    const { nextPageToken, isLoadingMore, loadMoreCount } = state.searchPagination;
    const currentQuery = state.query;

    // Guard: Maximum 2 load more operations
    if (loadMoreCount >= 2) {
        return;
    }

    // Guard: Don't load if already loading or no token
    if (isLoadingMore || !nextPageToken) {
        return;
    }

    // Guard: Need a query to search
    if (!currentQuery || currentQuery.trim() === '') {
        return;
    }

    setLoadingMore(true);

    try {
        // Fetch next page of results
        const r = await service.searchV2(currentQuery, {
            pageToken: nextPageToken,
            limit: 12
        });

        if (r.status === 'success') {
            // Increment load more counter FIRST
            incrementLoadMoreCount();

            // Update pagination data
            if (r.data && r.data.pagination) {
                setSearchPagination(r.data.pagination);
            }

            // Append new results to existing results
            const currentResults = state.results || [];
            const newResults = r.data.items || r.data.videos || [];
            const mergedResults = [...currentResults, ...newResults];

            setState({
                results: mergedResults
            });

        } else if (r.status === 'warning') {
            // No more results available
        } else {
            // Show error but keep existing results
            setError('Failed to load more results. Please try again.');
        }
    } catch (error) {
        setError('An error occurred while loading more results.');
    } finally {
        setLoadingMore(false);
    }
}

// Resubmit functionality removed - not needed with fake data workflow

// Mobile click-to-scroll throttling
let lastClickTime = 0;
const CLICK_THROTTLE_MS = 300;

/**
 * Handles mobile input click to trigger scroll behavior
 * @param {Event} event - Click event
 */
function handleInputClick(event) {
    // Only apply on mobile viewports
    if (window.innerWidth > 768) {
        return;
    }

    // Throttle clicks to prevent scroll spam
    const now = Date.now();
    if (now - lastClickTime < CLICK_THROTTLE_MS) {
        return;
    }
    lastClickTime = now;

    // Always trigger scroll to input using existing mechanism
    initImmediateScroll('keyword');
}

// User interaction detection for auto focus
let userHasInteracted = false;
const USER_INTERACTION_EVENTS = ['mousedown', 'keydown', 'touchstart'];

/**
 * Enhanced auto focus function with timing control and accessibility safeguards
 */
function enhancedAutoFocus() {
    // Only apply on desktop viewports
    if (window.innerWidth <= 768) {
        return;
    }

    // Respect user accessibility preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        return; // Skip auto focus for users who prefer reduced motion
    }

    // Skip if user has already interacted with the page
    if (userHasInteracted) {
        return;
    }

    // Apply timing delay to prevent blocking page load
    setTimeout(() => {
        // Double-check interaction status before focusing
        if (!userHasInteracted) {
            const elements = getElements();
            if (elements.urlInput) {
                try {
                    elements.urlInput.focus();
                } catch (error) {
                    // Graceful fallback - don't throw errors for focus issues
                }
            }
        }
    }, 150); // 150ms delay
}

/**
 * Sets up user interaction detection to prevent auto focus after user activity
 */
function setupUserInteractionDetection() {
    function markUserInteraction() {
        userHasInteracted = true;
        // Remove listeners after first interaction for performance
        USER_INTERACTION_EVENTS.forEach(eventType => {
            document.removeEventListener(eventType, markUserInteraction, { capture: true });
        });
    }

    // Listen for user interactions
    USER_INTERACTION_EVENTS.forEach(eventType => {
        document.addEventListener(eventType, markUserInteraction, { capture: true, once: true });
    });
}

/**
 * Initialize Input Form functionality
 * Setup all event listeners
 */
export function initInputForm() {
    // CSS loading removed - all bundled in main.js

    const elements = getElements();

    // Check if required elements exist
    if (!elements.form || !elements.urlInput || !elements.submitButton) {
        return false;
    }
    // Attach core event listeners
    elements.form.addEventListener('submit', handleSubmit);
    elements.urlInput.addEventListener('input', handleInput);

    // NEW: Keyboard navigation for suggestions
    elements.urlInput.addEventListener('keydown', handleKeyDown);

    // NEW: Mobile click-to-scroll functionality
    elements.urlInput.addEventListener('click', handleInputClick);



    // NEW: Suggestion click handling (event delegation)
    document.addEventListener('click', (event) => {
        const suggestionContainer = document.getElementById('suggestion-container');
        const urlInput = document.getElementById('videoUrl');

        // Hide suggestions if clicked outside the container and the input field
        if (!suggestionContainer.contains(event.target) && event.target !== urlInput) {
            hideSuggestions();
            setHighlightedIndex(-1);
        }

        if (event.target.closest('#suggestion-container')) {
            handleSuggestionClick(event);
        }
    });

    // Attach listener for the combined action button
    if (elements.actionButton) {
        elements.actionButton.addEventListener('click', handleActionButtonClick);
    }

    // Setup user interaction detection before auto focus
    setupUserInteractionDetection();

    // Enhanced auto-focus on desktop with accessibility safeguards
    enhancedAutoFocus();

    return true;
}