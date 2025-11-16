/**
 * State Management for Input Form (Model)
 * Single source of truth for all UI state
 */

// Initial state object
const initialState = {
    inputType: 'url',        // 'url' or 'keyword'
    isLoading: false,        // Loading state for async operations
    isSubmitting: false,     // Flag to prevent suggestions during form submission
    error: null,             // Error message to display

    // Suggestion state
    suggestions: [],         // Array of API suggestion strings
    showSuggestions: false,  // Whether to show suggestion box
    isLoadingSuggestions: false,  // Loading state for suggestions

    // Suggestion navigation state (NEW)
    query: '',               // Current input display value
    originalQuery: '',       // User's typed keyword when API called
    highlightedIndex: -1,    // -1 = no highlight, 0+ = suggestion index

    // Button visibility
    showPasteButton: true,   // Show paste button (when input is empty)
    showClearButton: false,  // Show clear button (when input has content)

    // Search results state
    results: [],             // Array of search result items
    resultsLoading: false,   // Loading state for search results
    viewingItem: null,       // Currently viewing item { id, title },

    // Search pagination state (Search V2 API)
    searchPagination: {
        nextPageToken: null,     // Token for next page of results
        hasNextPage: false,      // Whether more results are available
        isLoadingMore: false,    // Loading state for load more action
        loadMoreCount: 0         // Number of load more operations (max 2)
    },

    // Submit source tracking (NEW)
    isFromListItemClick: false,  // True if submit triggered by clicking search result item

    // --- START: NEWLY ADDED ---
    // Mutually exclusive states for detailed content
    videoDetail: null,       // For single video/media results
    galleryDetail: null,     // For gallery (multiple items) results

    // Download options state
    activeTab: 'video',      // 'video' or 'audio' - active tab trong download options
    downloadTasks: {},       // formatId -> { status: 'idle'|'loading'|'downloaded'|'error', message?: string }

    // Concurrent conversion tasks (NEW)
    conversionTasks: {},     // formatId -> ConversionTask object

    // Active Conversion state
    activeConversion: null, // Will hold data for the single active conversion

    // Multifile download state
    multifileSession: null,  // { sessionId, streamUrl, expiresAt, downloadUrl, expireTime, state, progress }

    // Multifile reuse state (NEW)
    listCurrentUrl: [],      // Array of currently selected encrypted URLs
    recentDownload: null,    // { listUrl: string[], url: string, expireTime: number } - last successful download
};

// Current state (private)
let currentState = { ...initialState };

// Callback function for View updates
let renderCallback = null;

/**
 * Get current state (read-only access)
 * @returns {Object} Current state object (immutable copy)
 */
export function getState() {
    return { ...currentState };
}

/**
 * Update state and trigger re-render
 * @param {Object} newState - Partial state object to merge
 */
export function setState(newState) {
    if (!newState || typeof newState !== 'object') {
        return;
    }

    // Merge new state with current state
    const prevState = { ...currentState };
    currentState = { ...currentState, ...newState };

    // Log state changes for debugging


    // Trigger render callback if registered
    if (typeof renderCallback === 'function') {
        try {
            renderCallback(currentState, prevState);
        } catch (error) {
        }
    }
}

/**
 * Register callback function to be called when state changes
 * @param {Function} callback - Function to call on state changes
 */
export function setRenderCallback(callback) {
    if (typeof callback !== 'function') {
        return;
    }

    renderCallback = callback;
}

/**
 * Reset state to initial values
 */
export function resetState() {
    setState(initialState);
}

/**
 * Clear error state
 */
export function clearError() {
    setState({ error: null });
}

/**
 * Set loading state
 * @param {boolean} loading - Loading state
 */
export function setLoading(loading) {
    setState({ isLoading: Boolean(loading) });
}

/**
 * Set submitting state to prevent suggestion interference
 * @param {boolean} submitting - Submitting state
 */
export function setSubmitting(submitting) {
    setState({ isSubmitting: Boolean(submitting) });
}

/**
 * Set error state
 * @param {string} errorMessage - Error message to display
 */
export function setError(errorMessage) {
    setState({
        error: errorMessage || 'An unknown error occurred',
        isLoading: false  // Always stop loading when error occurs
    });
}

/**
 * Set input type based on user input
 * @param {string} type - 'url' or 'keyword'
 */
export function setInputType(type) {
    if (type !== 'url' && type !== 'keyword') {
        return;
    }
    setState({ inputType: type });
}

/**
 * Set flag to indicate submit is from list item click
 * @param {boolean} isFromClick - True if from list item click
 */
export function setIsFromListItemClick(isFromClick) {
    setState({ isFromListItemClick: Boolean(isFromClick) });
}

/**
 * Set suggestions and show suggestion box
 * @param {Array<string>} suggestions - Array of suggestion strings
 */
export function setSuggestions(suggestions) {
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
export function hideSuggestions() {
    setState({ showSuggestions: false });
}

/**
 * Set loading state for suggestions
 * @param {boolean} loading - Loading state for suggestions
 */
export function setLoadingSuggestions(loading) {
    setState({ isLoadingSuggestions: Boolean(loading) });
}

/**
 * Clear suggestions
 */
export function clearSuggestions() {
    setState({
        suggestions: [],
        showSuggestions: false,
        isLoadingSuggestions: false
    });
}

/**
 * Update button visibility based on input content
 * @param {boolean} hasContent - Whether input has content
 */
export function updateButtonVisibility(hasContent) {
    setState({
        showPasteButton: !hasContent,
        showClearButton: hasContent
    });
}

/**
 * Show paste button, hide clear button
 */
export function showPasteButton() {
    setState({
        showPasteButton: true,
        showClearButton: false
    });
}

/**
 * Show clear button, hide paste button
 */
export function showClearButton() {
    setState({
        showPasteButton: false,
        showClearButton: true
    });
}

/**
 * Set search results
 * @param {Array} results - Array of video items { id, title }
 */
export function setResults(results) {
    const resultsArray = Array.isArray(results) ? results : [];
    setState({
        results: resultsArray,
        resultsLoading: false
    });
}

/**
 * Set loading state for search results
 * @param {boolean} loading - Loading state
 */
export function setResultsLoading(loading) {
    setState({ resultsLoading: Boolean(loading) });
}

/**
 * Clear results data
 */
export function clearResultsData() {
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
 * @param {Object} item - Item to view { id, title }
 */
export function setViewingItem(item) {
    setState({
        viewingItem: item,
        results: []  // Clear results when viewing item
    });
}

/**
 * Clear viewing item (back to results)
 */
export function clearViewingItem() {
    setState({ viewingItem: null });
}

/**
 * Set search pagination data from API response
 * @param {Object} paginationData - Pagination object from search v2 API
 */
export function setSearchPagination(paginationData) {
    if (!paginationData || typeof paginationData !== 'object') {
        return;
    }

    // ⚡ PRESERVE loadMoreCount when updating from API response
    const currentState = getState();
    const existingCount = currentState.searchPagination?.loadMoreCount || 0;

    setState({
        searchPagination: {
            nextPageToken: paginationData.nextPageToken || null,
            hasNextPage: Boolean(paginationData.hasNextPage),
            isLoadingMore: false,
            loadMoreCount: existingCount  // ← Preserve existing count
        }
    });
}

/**
 * Set loading state for load more action
 * @param {boolean} isLoading - Loading state
 */
export function setLoadingMore(isLoading) {
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
export function clearSearchPagination() {
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
 * @returns {Object} Pagination state
 */
export function getSearchPagination() {
    const state = getState();
    const pagination = state.searchPagination;

    // ⚡ DEFENSIVE: Ensure loadMoreCount always exists
    return {
        nextPageToken: pagination?.nextPageToken || null,
        hasNextPage: Boolean(pagination?.hasNextPage),
        isLoadingMore: Boolean(pagination?.isLoadingMore),
        loadMoreCount: pagination?.loadMoreCount || 0  // ← Always fallback to 0
    };
}

/**
 * Increment load more counter
 */
export function incrementLoadMoreCount() {
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
export function decrementLoadMoreCount() {
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

/**
 * Set current query (input display value)
 * @param {string} value - Query value to set
 */
export function setQuery(value) {
    setState({ query: value || '' });
}

/**
 * Set original query (user's typed keyword when API called)
 * @param {string} value - Original query value to set
 */
export function setOriginalQuery(value) {
    setState({ originalQuery: value || '' });
}

/**
 * Set highlighted index for keyboard navigation
 * @param {number} index - Index to highlight (-1 for no highlight)
 */
export function setHighlightedIndex(index) {
    setState({ highlightedIndex: Number(index) });
}

/**
 * Select a suggestion and update query
 * @param {number} index - Index of suggestion to select
 */
export function selectSuggestion(index) {
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
 * Set video detail data (single media content)
 * @param {Object} data - Video detail data from API
 */
export function setVideoDetail(data) {
    // Add completedAt timestamp for expiration tracking
    const videoDetailWithTimestamp = {
        ...data,
        completedAt: Date.now() // Track when API extract completed
    };

    setState({
        videoDetail: videoDetailWithTimestamp,
        galleryDetail: null, // Ensure mutual exclusion
        results: [], // Clear search results when viewing detail
        viewingItem: null, // Clear any viewing item
        activeTab: 'video', // Reset to video tab
        downloadTasks: {} // Clear download states
    });
}

/**
 * Set gallery detail data (multiple media content)
 * @param {Object} data - Gallery detail data from API
 */
export function setGalleryDetail(data) {
    // Add completedAt timestamp for expiration tracking
    const galleryDetailWithTimestamp = {
        ...data,
        completedAt: Date.now() // Track when API extract completed
    };

    setState({
        galleryDetail: galleryDetailWithTimestamp,
        videoDetail: null, // Ensure mutual exclusion
        results: [], // Clear search results when viewing detail
        viewingItem: null // Clear any viewing item
    });
}

/**
 * Clear detail states (back to main view)
 */
export function clearDetailStates() {
    setState({
        videoDetail: null,
        galleryDetail: null,
        viewingItem: null
    });
}

/**
 * Update video detail metadata progressively (for background oEmbed updates)
 * Only updates metadata fields, preserves formats and other data
 * @param {Object} metadataUpdate - New metadata fields to update
 */
export function updateVideoDetailMetadata(metadataUpdate) {
    const currentState = getState();

    if (!currentState.videoDetail) {
        return;
    }

    // Create updated video detail with new metadata
    const updatedVideoDetail = {
        ...currentState.videoDetail,
        meta: {
            ...currentState.videoDetail.meta,
            ...metadataUpdate,
            isFakeData: false, // Mark as real data after update
        }
    };

    setState({
        videoDetail: updatedVideoDetail
    });
}

/**
 * Update a specific format in videoDetail after conversion/extraction
 * Adds download URL to format so subsequent clicks don't need API calls
 * @param {string} formatId - Format identifier (e.g., "video|720p|mp4")
 * @param {Object} formatUpdate - Fields to update (url, size, etc.)
 */
export function updateVideoDetailFormat(formatId, formatUpdate) {
    const currentState = getState();

    if (!currentState.videoDetail || !currentState.videoDetail.formats) {
        return;
    }

    // Parse formatId to get category
    const parts = formatId.split('|');
    if (parts.length < 2) {
        return;
    }

    const category = parts[0]; // 'video' or 'audio'
    const formatArray = currentState.videoDetail.formats[category];

    if (!Array.isArray(formatArray)) {
        return;
    }

    // Find and update the specific format
    const updatedFormats = formatArray.map(format => {
        // Match by comparing relevant fields (quality, type, etc.)
        // Since fake formats might not have exact ID match
        const matchesQuality = formatUpdate.quality ? format.quality === formatUpdate.quality : true;
        const matchesType = formatUpdate.type ? format.type === formatUpdate.type : true;

        // If this format matches the update criteria, merge the update
        if (matchesQuality && matchesType) {
            return {
                ...format,
                ...formatUpdate,
                // Keep original fields that shouldn't be overwritten
                id: format.id,
                category: format.category
            };
        }
        return format;
    });

    // Create updated video detail with modified formats
    const updatedVideoDetail = {
        ...currentState.videoDetail,
        formats: {
            ...currentState.videoDetail.formats,
            [category]: updatedFormats
        }
    };

    setState({
        videoDetail: updatedVideoDetail
    });

}

/**
 * Get current detail type
 * @returns {string|null} 'video', 'gallery', or null
 */
export function getCurrentDetailType() {
    const state = getState();
    if (state.galleryDetail) return 'gallery';
    if (state.videoDetail) return 'video';
    return null;
}

/**
 * Get display suggestions (original query + API suggestions)
 * @param {Object} state - Optional state object (uses current state if not provided)
 * @returns {Array<string>} Display suggestions array
 */
export function getDisplaySuggestions(state = null) {
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
 * Reset suggestion navigation state
 */
export function resetSuggestionNavigation() {
    setState({
        query: '',
        originalQuery: '',
        highlightedIndex: -1,
        showSuggestions: false
    });
}

/**
 * Set active tab in download options
 * @param {string} tab - 'video' or 'audio'
 */
export function setActiveTab(tab) {
    if (tab !== 'video' && tab !== 'audio') {
        return;
    }
    setState({ activeTab: tab });
}

/**
 * Update download task state for a specific format
 * @param {string} formatId - Unique format identifier
 * @param {Object} taskState - Task state object { status, message? }
 */
export function updateTaskState(formatId, taskState) {
    if (!formatId || !taskState || !taskState.status) {
        return;
    }

    const validStatuses = ['idle', 'loading', 'downloaded', 'error'];
    if (!validStatuses.includes(taskState.status)) {
        return;
    }

    const currentState = getState();
    const updatedTasks = {
        ...currentState.downloadTasks,
        [formatId]: {
            status: taskState.status,
            message: taskState.message || null,
            timestamp: new Date().toISOString()
        }
    };

    setState({ downloadTasks: updatedTasks });
}

// === NEW CONCURRENT CONVERSION TASK MANAGEMENT ===

/**
 * Create or update a conversion task
 * @param {string} formatId - Unique format identifier
 * @param {Object} taskData - Conversion task data
 */
export function setConversionTask(formatId, taskData) {
    if (!formatId || !taskData) {
        return;
    }

    const currentState = getState();
    const updatedTasks = {
        ...currentState.conversionTasks,
        [formatId]: {
            id: formatId,
            state: 'Idle',
            statusText: 'Ready to convert',
            showProgressBar: false,
            downloadUrl: null,
            error: null,
            createdAt: Date.now(),
            abortController: new AbortController(),
            ...taskData
        }
    };

    setState({ conversionTasks: updatedTasks });
}

/**
 * Update specific conversion task state
 * @param {string} formatId - Format identifier
 * @param {Object} updates - Partial updates to apply
 */
export function updateConversionTask(formatId, updates) {
    if (!formatId || !updates) {
        return;
    }

    const currentState = getState();
    const existingTask = currentState.conversionTasks[formatId];

    if (!existingTask) {
        return;
    }

    const updatedTask = { ...existingTask, ...updates };
    const updatedTasks = {
        ...currentState.conversionTasks,
        [formatId]: updatedTask
    };

    setState({ conversionTasks: updatedTasks });
}

/**
 * Get conversion task by formatId
 * @param {string} formatId - Format identifier
 * @returns {Object|null} Conversion task or null if not found
 */
export function getConversionTask(formatId) {
    const state = getState();
    return state.conversionTasks[formatId] || null;
}

/**
 * Remove conversion task
 * @param {string} formatId - Format identifier
 */
export function removeConversionTask(formatId) {
    if (!formatId) return;

    const currentState = getState();
    const { [formatId]: removed, ...remainingTasks } = currentState.conversionTasks;

    setState({ conversionTasks: remainingTasks });
}

/**
 * Get all conversion tasks
 * @returns {Object} All conversion tasks object
 */
export function getConversionTasks() {
    const state = getState();
    return state.conversionTasks;
}

/**
 * Get all conversion tasks by state
 * @param {string} state - Task state to filter by
 * @returns {Array} Array of conversion tasks
 */
export function getConversionTasksByState(state) {
    const currentState = getState();
    return Object.values(currentState.conversionTasks).filter(task => task.state === state);
}

/**
 * Get conversion tasks status summary
 * @returns {Object} Status summary
 */
export function getConversionStatus() {
    const currentState = getState();
    const tasks = Object.values(currentState.conversionTasks);

    return {
        total: tasks.length,
        idle: tasks.filter(task => task.state === 'Idle').length,
        converting: tasks.filter(task => task.state === 'Converting').length,
        success: tasks.filter(task => task.state === 'Success').length,
        failed: tasks.filter(task => task.state === 'Failed').length,
        canceled: tasks.filter(task => task.state === 'Canceled').length
    };
}

/**
 * Clear all conversion tasks and abort active conversions
 */
export function clearConversionTasks() {
    const currentState = getState();
    const tasks = Object.values(currentState.conversionTasks);

    // Abort all active conversions to stop polling
    tasks.forEach(task => {
        if (task.abortController && !task.abortController.signal.aborted) {
            task.abortController.abort();
        }
    });

    setState({ conversionTasks: {} });
}

/**
 * Clear all download states (reset download tasks and active tab)
 */
export function clearDownloadStates() {
    setState({
        activeTab: 'video',
        downloadTasks: {}
    });
}

/**
 * Get download task state for a specific format
 * @param {string} formatId - Unique format identifier
 * @returns {Object} Task state object or default idle state
 */
export function getTaskState(formatId) {
    const state = getState();
    return state.downloadTasks[formatId] || { status: 'idle', message: null };
}

/**
 * Check if any downloads are currently in progress
 * @returns {boolean} True if any download is loading
 */
export function hasActiveDownloads() {
    const state = getState();
    return Object.values(state.downloadTasks).some(task => task.status === 'loading');
}

/**
 * Get count of downloads by status
 * @returns {Object} Count object { idle, loading, downloaded, error }
 */
export function getDownloadCounts() {
    const state = getState();
    const counts = { idle: 0, loading: 0, downloaded: 0, error: 0 };

    Object.values(state.downloadTasks).forEach(task => {
        if (counts.hasOwnProperty(task.status)) {
            counts[task.status]++;
        }
    });

    return counts;
}

// --- Active Conversion Actions ---

/**
 * Starts a new conversion process.
 * @param {object} data - { videoTitle, format, quality, vid, key, encryptedUrl }
 */
export function startConversion(data) {
    setState({
        activeConversion: {
            isConverting: true,
            error: null,
            downloadUrl: null,
            progress: 0,
            statusText: 'Starting…',
            videoTitle: data.videoTitle,
            format: data.format,
            quality: data.quality,
            vid: data.vid,
            key: data.key,
            encryptedUrl: data.encryptedUrl
        }
    });
}

/**
 * Updates the progress of the active conversion.
 * @param {number} progress - The new progress value (0-100).
 * @param {string} statusText - The text to display.
 */
export function updateConversionProgress(progress, statusText) {
    const currentState = getState();
    if (!currentState.activeConversion) return;

    const newConversionState = { ...currentState.activeConversion, progress, statusText };
    setState({ activeConversion: newConversionState });
}

/**
 * Sets the active conversion to a success state.
 * @param {string} downloadUrl - The final download URL.
 */
export function setConversionSuccess(downloadUrl) {
    const currentState = getState();
    if (!currentState.activeConversion) return;

    const newConversionState = {
        ...currentState.activeConversion,
        isConverting: false,
        progress: 100,
        statusText: 'Completed',
        downloadUrl,
    };
    setState({ activeConversion: newConversionState });
}

/**
 * Sets the active conversion to an error state.
 * @param {string} error - The error message.
 */
export function setConversionError(error) {
    const currentState = getState();
    if (!currentState.activeConversion) return;

    const newConversionState = { ...currentState.activeConversion, isConverting: false, error };
    setState({ activeConversion: newConversionState });
}

/**
 * Clears the active conversion, hiding the UI.
 */
export function clearConversion() {
    setState({ activeConversion: null });
}

// ============================================================
// MULTIFILE DOWNLOAD STATE MANAGEMENT
// ============================================================

/**
 * Set multifile session data
 * @param {Object} sessionData - Session data from API
 */
export function setMultifileSession(sessionData) {
    setState({
        multifileSession: {
            ...sessionData,
            state: 'preparing', // Initial state
            progress: {
                decrypt: 0,
                download: 0,
                zip: 0,
                overall: 0
            }
        }
    });
}

/**
 * Update multifile session progress
 * @param {Object} progressData - Progress data from SSE
 */
export function updateMultifileProgress(progressData) {
    const current = getState().multifileSession;
    if (!current) return;

    setState({
        multifileSession: {
            ...current,
            progress: {
                ...current.progress,
                ...progressData
            }
        }
    });
}

/**
 * Update multifile session state
 * @param {string} state - New state (preparing, converting, zipping, ready, expired, error)
 */
export function setMultifileState(state) {
    const current = getState().multifileSession;
    if (!current) return;

    setState({
        multifileSession: {
            ...current,
            state
        }
    });
}

/**
 * Set multifile download URL and expire time
 * @param {string} downloadUrl - Download URL from complete event
 * @param {number} expireTime - Timestamp when link expires
 */
export function setMultifileDownloadUrl(downloadUrl, expireTime) {
    const current = getState().multifileSession;
    if (!current) return;

    setState({
        multifileSession: {
            ...current,
            downloadUrl,
            expireTime,
            state: 'ready'
        }
    });
}

/**
 * Set multifile session error
 * @param {string} error - Error message
 */
export function setMultifileError(error) {
    const current = getState().multifileSession;
    if (!current) return;

    setState({
        multifileSession: {
            ...current,
            error,
            state: 'error'
        }
    });
}

/**
 * Mark multifile session as expired
 */
export function setMultifileExpired() {
    const current = getState().multifileSession;
    if (!current) return;

    setState({
        multifileSession: {
            ...current,
            state: 'expired'
        }
    });
}

/**
 * Clear multifile session
 * @param {boolean} silent - If true, clear without triggering setState (prevents render cycle)
 */
export function clearMultifileSession(silent = false) {

    if (silent) {
        // Direct state modification without triggering renders
        currentState.multifileSession = null;
    } else {
        // Normal clear with UI update
        setState({
            multifileSession: null
        });
    }
}

/**
 * Get multifile session data
 * @returns {Object|null} Current multifile session
 */
export function getMultifileSession() {
    return getState().multifileSession;
}

// ============================================================
// MULTIFILE REUSE MANAGEMENT (NEW)
// ============================================================

import { validateUrlArray, canReuseDownload } from '../../libs/downloader-lib-standalone/utils/multifile-utils.js';

/**
 * Update currently selected URLs
 * @param {string[]} urls - Array of encrypted URLs
 */
export function updateCurrentSelection(urls) {
    try {
        // Validate input
        validateUrlArray(urls, 'updateCurrentSelection');

        // Immutable state update
        setState({
            listCurrentUrl: Object.freeze([...urls]) // Immutable copy
        });

    } catch (error) {
        throw error;
    }
}

/**
 * Save recent download data after successful completion
 * @param {string[]} listUrl - URLs that were downloaded
 * @param {string} downloadUrl - ZIP download URL
 * @param {number} expireTime - When the download link expires
 */
export function saveRecentDownload(listUrl, downloadUrl, expireTime) {
    try {
        // Validate inputs
        validateUrlArray(listUrl, 'saveRecentDownload.listUrl');

        if (typeof downloadUrl !== 'string' || !downloadUrl.trim()) {
            throw new Error('saveRecentDownload: Invalid download URL');
        }

        if (typeof expireTime !== 'number' || expireTime <= Date.now()) {
            throw new Error('saveRecentDownload: Invalid expire time');
        }

        // Immutable state update
        setState({
            recentDownload: Object.freeze({
                listUrl: Object.freeze([...listUrl]),
                url: downloadUrl,
                expireTime: expireTime
            })
        });

      
    } catch (error) {
        throw error;
    }
}

/**
 * Clear recent download data
 */
export function clearRecentDownload() {
    setState({
        recentDownload: null
    });
}

/**
 * Get comparison data for reuse decision
 * @returns {Object} Comparison data and reuse status
 */
export function getRecentDownloadStatus() {
    
    const state = getState();
    const { listCurrentUrl, recentDownload } = state;

    const status = canReuseDownload(listCurrentUrl, recentDownload);

    return {
        ...status,
        currentUrls: listCurrentUrl,
        recentDownload: recentDownload,
        hasCurrentSelection: Array.isArray(listCurrentUrl) && listCurrentUrl.length > 0,
        hasRecentDownload: Boolean(recentDownload?.url)
    };
}


// Export the initial state for reference
export { initialState };