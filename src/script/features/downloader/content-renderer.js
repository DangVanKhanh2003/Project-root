/**
 * Unified Content Renderer
 * Single point of rendering for all dynamic content in #content-area
 * Handles both data display (success) and message display (error/warning)
 */

import { generateYoutubeThumbnail } from '../../utils.js';
import { getState, getConversionTasks, setIsFromListItemClick, getSearchPagination } from './state.js';
import { getElements, setInputValue } from './ui-renderer.js';
// Dynamic imports for feature modules - prefetched after critical load

// Import centralized scroll manager for infinite scroll
import scrollManager from '../../libs/scroll-core/scroll-manager.js';

// CSS imports removed - all CSS now bundled in main.js

// Module-level state (private)
let container = null; // #content-area in hero (for video details)
let searchResultsContainer = null; // #search-results-container in dedicated section (for search results)
let searchResultsSection = null; // #search-results-section (the section wrapper)
let lastRenderedContentId = null; // Track what content is currently rendered
let lastRenderedActiveTab = null; // Track the active tab for re-rendering
let infiniteScrollErrorState = false; // Track infinite scroll error state

/**
 * Handles click events on search result items.
 * @param {Event} event - The click event.
 */
function handleSearchResultClick(event) {
    const item = event.target.closest('.search-result-card');
    if (!item) {
        return;
    }

    const videoId = item.dataset.videoId;
    if (!videoId) {
        return;
    }

    // Immediately remove any existing video detail cards
    if (container) {
        const existingVideoDetails = container.querySelectorAll('.video-info-card');
        existingVideoDetails.forEach(card => card.remove());
    }

    // Construct YouTube URL
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // 🐛 DEBUG: Log search result click details

    // Set flag to indicate this submit is from list item click
    setIsFromListItemClick(true);

    // Fill input and submit form
    setInputValue(youtubeUrl);

    const elements = getElements();
    if (elements.form) {
        elements.form.requestSubmit();
    }
}


/**
 * Initialize content renderer
 * Must be called before any render operations
 * @returns {boolean} Success status
 */
export function initContentRenderer() {
    // CSS loading removed - all bundled in main.js

    // Add debug info

    // Initialize hero content-area (for video details)
    container = document.getElementById('content-area');

    if (!container) {
        return false;
    }

    // Initialize search results container (dedicated section)
    searchResultsContainer = document.getElementById('search-results-container');
    searchResultsSection = document.getElementById('search-results-section');

    if (!searchResultsContainer || !searchResultsSection) {
        return false;
    }

    // Attach click listener for search result cards (on search results container)
    searchResultsContainer.addEventListener('click', handleSearchResultClick);

    // Setup infinite scroll detection
    setupInfiniteScroll();

    return true;
}

/**
 * Update loading indicator (outside grid) after load more completes
 * Shows "Maximum results reached", "No more videos", error state, etc.
 */
function updateLoadingIndicator() {
    if (!searchResultsContainer) {
        return;
    }

    const resultsGrid = searchResultsContainer.querySelector('.search-results-grid');
    if (!resultsGrid) {
        return;
    }

    // Get current loading indicator HTML
    const { nonGridIndicator } = renderLoadingIndicator();


    // Find and remove existing indicator elements
    // These elements are siblings of the grid, not inside it
    const existingIndicators = searchResultsContainer.querySelectorAll(
        '.load-more-error, .end-of-results, .infinite-scroll-sentinel'
    );

    if (existingIndicators.length > 0) {
        existingIndicators.forEach(el => el.remove());
    }

    // Insert new indicator after grid (if any)
    if (nonGridIndicator) {
        resultsGrid.insertAdjacentHTML('afterend', nonGridIndicator);
    } else {
    }
}

/**
 * Setup infinite scroll detection with scroll manager integration
 * Maintains existing logic but uses centralized scroll handling
 */
function setupInfiniteScroll() {
    let isLoadingMore = false;

    const handleScroll = async () => {
        // Guard: No search results container
        if (!searchResultsContainer) {
            return;
        }

        // Get pagination state
        const pagination = getSearchPagination();

        // Guard: Maximum 2 load more operations
        if (pagination.loadMoreCount >= 2) {
            return;
        }

        // Get results grid (the grid with search results)
        const resultsGrid = searchResultsContainer.querySelector('.search-results-grid');
        if (!resultsGrid) {
            return;
        }

        // Calculate distance from viewport bottom to END OF RESULTS GRID
        // Logic: gridRect.bottom is distance from viewport TOP to grid BOTTOM
        //   - If grid bottom is BELOW viewport bottom: distanceToBottom > 0 (need to scroll more)
        //   - If grid bottom is ABOVE viewport bottom: distanceToBottom < 0 (already scrolled past)
        //   - We trigger when: distanceToBottom <= threshold (near or past grid bottom)
        const gridRect = resultsGrid.getBoundingClientRect();
        const gridBottom = gridRect.bottom; // Distance from viewport top to grid bottom
        const viewportHeight = window.innerHeight;

        // Distance from viewport bottom to grid bottom
        // Positive = grid bottom is below viewport (need to scroll)
        // Negative = grid bottom is above viewport (already past)
        const distanceToBottom = gridBottom - viewportHeight;

        // Use scroll manager's responsive breakpoints and thresholds
        const threshold = scrollManager.getInfiniteScrollThreshold();

        // Guard: No more pages or already loading
        if (!pagination.hasNextPage || pagination.isLoadingMore || isLoadingMore) {
            return;
        }

        // Check if within threshold distance of RESULTS CONTAINER bottom
        if (distanceToBottom <= threshold) {

            // Set local flag to prevent duplicate requests
            isLoadingMore = true;

            // Import necessary functions
            const { setLoadingMore, setSearchPagination, setState, incrementLoadMoreCount, decrementLoadMoreCount } = await import('./state.js');
            const { createVerifiedService } = await import('../../libs/downloader-lib-standalone/index.js');
            const { withCaptchaProtection } = await import('../../libs/captcha-core/captcha-ui.js');

            // ⚡ RACE CONDITION FIX: Increment counter immediately to prevent concurrent calls
            incrementLoadMoreCount();

            // Get service instance with CAPTCHA protection
            const service = createVerifiedService({}, {}, withCaptchaProtection);

            try {
                const state = getState();
                const { nextPageToken } = state.searchPagination;
                const currentQuery = state.query;


                // Get grid reference once and reuse throughout function
                const existingGrid = searchResultsContainer.querySelector('.search-results-grid');

                // Step 1: Set loading state to show skeleton cards
                setLoadingMore(true);

                // Step 2: Append skeleton cards to existing grid (instead of replacing entire container)
                if (existingGrid) {
                    // Generate 12 skeleton cards to append
                    const skeletonCardsHTML = Array(12).fill(null).map(() => generateSkeletonCard()).join('');
                    existingGrid.insertAdjacentHTML('beforeend', skeletonCardsHTML);
                } else {
                    // Fallback: If no existing grid, render complete skeleton
                    let updatedHTML = renderSearchResults({ items: state.results });
                    searchResultsContainer.innerHTML = updatedHTML;
                }

                // Step 3: Fetch next page of results
                const r = await service.searchV2(currentQuery, {
                    pageToken: nextPageToken,
                    limit: 12
                });

                // Step 4: Process results
                if (r.status === 'success') {
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

                } else {
                    // ⚡ ROLLBACK: API call successful but status is not 'success'
                    decrementLoadMoreCount();
                }

                // Step 5: Remove skeleton cards and append new real items
                const finalState = getState();

                if (existingGrid) {
                    // Remove skeleton cards that were added in Step 2
                    const skeletonCards = existingGrid.querySelectorAll('.skeleton-card');
                    skeletonCards.forEach(card => card.remove());

                    // Append new real items (only the new items, not all items)
                    if (r.status === 'success') {
                        const newItems = r.data.items || r.data.videos || [];
                        const newVideos = newItems.filter(item => item.type === 'stream' || !item.type);

                        // Generate HTML for new items only (using same logic as renderSearchResults)
                        const newItemsHTML = newVideos.map(video => {
                            // Format view count based on screen size (responsive display)
                            const formatViewsForDisplay = (displayViews) => {
                                if (!displayViews) return '';
                                const isMobile = window.innerWidth <= 768;
                                if (isMobile) {
                                    return displayViews.replace(' views', '');
                                }
                                return displayViews;
                            };

                            const formattedViews = formatViewsForDisplay(video.displayViews);

                            return `
                                <article class="search-result-card"
                                         data-video-id="${escapeHtml(video.id)}"
                                         data-video-title="${escapeHtml(video.title)}">
                                    <div class="card-thumbnail">
                                        <img src="${escapeHtml(video.thumbnailUrl || generateYoutubeThumbnail(video.id))}"
                                             loading="lazy"
                                             alt="${escapeHtml(video.title)}"
                                             onerror="this.src='${generateYoutubeThumbnail(video.id)}'">
                                        ${video.displayDuration ? `<span class="duration-badge">${escapeHtml(video.displayDuration)}</span>` : ''}
                                    </div>
                                    <div class="card-content">
                                        <h3 class="card-title">${escapeHtml(video.title)}</h3>
                                        ${video.metadata?.uploaderName ? `<p class="card-channel">${escapeHtml(video.metadata.uploaderName)}</p>` : ''}
                                        <div class="card-metadata">
                                            ${formattedViews ? `<span>${escapeHtml(formattedViews)} </span>` : ''}
                                            ${formattedViews && video.displayDate ? '<span>•</span>' : ''}
                                            ${video.displayDate ? `<span>${escapeHtml(video.displayDate)}</span>` : ''}
                                        </div>
                                    </div>
                                </article>
                            `;
                        }).join('');

                        // Append new items to the grid
                        if (newItemsHTML) {
                            existingGrid.insertAdjacentHTML('beforeend', newItemsHTML);
                        }
                    }

                    // CRITICAL: Update loading indicator after appending items
                    // This shows "Maximum results reached" or other status messages
                    updateLoadingIndicator();
                } else {
                    // Fallback: If no existing grid, render complete content
                    const updatedHTML = renderSearchResults({ items: finalState.results });
                    searchResultsContainer.innerHTML = updatedHTML;
                }

                infiniteScrollErrorState = false; // Reset error flag on success
            } catch (error) {

                infiniteScrollErrorState = true; // Set error flag

                // ⚡ ROLLBACK: Decrement counter since load failed
                decrementLoadMoreCount();

                // Remove skeleton cards on error (don't replace entire container)
                setLoadingMore(false);

                if (existingGrid) {
                    // Just remove skeleton cards, keep existing items
                    const skeletonCards = existingGrid.querySelectorAll('.skeleton-card');
                    skeletonCards.forEach(card => card.remove());

                    // Update loading indicator to show error state
                    updateLoadingIndicator();
                } else {
                    // Fallback: If no existing grid, render complete content
                    const state = getState();
                    const updatedHTML = renderSearchResults({ items: state.results });
                    searchResultsContainer.innerHTML = updatedHTML;
                }
            } finally {
                // Reset states
                setLoadingMore(false);
                isLoadingMore = false;
            }
        }
    };

    // Handle retry logic for failed infinite scroll
    const handleRetry = () => {
        infiniteScrollErrorState = false;
        handleScroll(); // Trigger load again
    };

    // Expose retry handler for click events
    window.__infiniteScrollRetry = handleRetry;

    // Setup direct scroll listener for grid-based infinite scroll
    // DO NOT use ScrollManager's page-based detection - it checks page bottom, not grid bottom
    // We need to check grid bottom to trigger load BEFORE scrolling to page end

    // Use requestAnimationFrame for optimal performance across all refresh rates
    // Automatically syncs with screen refresh rate (60Hz, 120Hz, 144Hz, etc.)
    let rafPending = false;

    const throttledHandleScroll = () => {
        // If already scheduled a check, skip this event
        if (rafPending) {
            return;
        }

        // Schedule check on next animation frame
        rafPending = true;
        requestAnimationFrame(() => {
            handleScroll();
            rafPending = false;
        });
    };

    // Add scroll listener with passive option for better performance
    window.addEventListener('scroll', throttledHandleScroll, { passive: true });

}

/**
 * Clear all content from both containers (video details + search results)
 * Resets event delegation state to allow fresh initialization
 * PRIORITY 1: Clear images first with smooth transition to prevent flickering
 */
export async function clearContent() {
    // Clear video details container (in hero)
    if (container) {
        // PRIORITY 1: Clear image elements first to prevent flickering
        const thumbnailImages = container.querySelectorAll('.thumbnail-image, #videoThumbnail');
        if (thumbnailImages.length > 0) {
            // Hide instantly, clear src, then remove (prevents any flash)
            thumbnailImages.forEach(img => {
                img.style.transition = 'none';  // Disable transition for instant hide
                img.style.opacity = '0';        // Hide immediately (no visual flash)
                img.src = '';                   // Clear src to stop loading
                if (img.parentNode) {
                    img.remove();               // Remove from DOM
                }
            });
        }

        // Clean up multifile download session (silent cleanup)
        try {
            const { cancelMultifileDownload } = await import('./multifile-ui.js');
            cancelMultifileDownload(true);
        } catch (error) {
        }

        // Clean up any existing download event listeners
        const downloadContainer = container.querySelector('#downloadOptionsContainer');
        if (downloadContainer) {
            // Remove all event listeners by cloning and replacing the element
            const newContainer = downloadContainer.cloneNode(true);
            downloadContainer.parentNode.replaceChild(newContainer, downloadContainer);
        }

        // Clear remaining content (images already removed)
        container.innerHTML = '';
        container.className = 'content-area'; // Reset classes

        // IMPORTANT: Reset ALL event delegation flags to allow re-initialization
        // This ensures that new content can set up its own delegated listeners
        delete container.dataset.expandableDelegated;

        // Reset rendered content tracking
        lastRenderedContentId = null;

    }

    // Clear search results container and hide section
    if (searchResultsContainer && searchResultsSection) {
        searchResultsContainer.innerHTML = '';
        searchResultsSection.style.display = 'none';
    }
}

/**
 * Render message for error/warning cases
 * @param {string} status - 'error' or 'warning'
 * @param {string} message - Message text to display
 */
export async function renderMessage(status, message) {
    if (!container) {
        return;
    }

    await clearContent();

    const messageClass = status === 'error' ? 'message--error' : 'message--warning';
    const iconClass = status === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-exclamation-triangle';

    const messageHTML = `
        <div class="content-message ${messageClass}">
            <div class="message-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="message-content">
                <p class="message-text">${escapeHtml(message)}</p>
            </div>
        </div>
    `;

    container.innerHTML = messageHTML;
    container.classList.add('showing-message');

}

/**
 * Show loading skeleton
 * @param {string} type - Skeleton type: 'list' (search/playlist) or 'detail' (video/gallery/clicked-results)
 * @param {boolean} append - If true, append skeleton instead of replacing (for dual list+detail display)
 */
export async function showLoading(type = 'list', append = false) {
    if (!container) {
        return;
    }

    // 🐛 DEBUG: Log skeleton type selection

    // Only clear if not appending
    if (!append) {
        await clearContent();
    }

    let content = '';

    switch (type) {
        case 'list':
            // LIST skeleton - for search results and playlists
            // CSS already bundled in main.js
            content = renderListSkeleton();
            break;
        case 'detail':
            // DETAIL skeleton - for videos, galleries, and clicked results
            // CSS already bundled in main.js
            content = renderDetailSkeleton();
            break;

        // Legacy support (will be removed after testing)
        case 'search-results':
            // CSS already bundled in main.js
            content = renderListSkeleton();
            break;
        case 'video-info':
            // CSS already bundled in main.js
            content = renderDetailSkeleton();
            break;
        case 'playlist-info':
            // CSS already bundled in main.js
            content = renderListSkeleton();
            break;
        case 'gallery':
            // CSS already bundled in main.js
            content = renderDetailSkeleton();
            break;
        default:
            content = renderListSkeleton();
    }

    // Route skeleton to correct container based on type
    if (type === 'list' || type === 'search-results' || type === 'playlist-info') {
        // LIST skeleton goes to search results section
        if (searchResultsContainer && searchResultsSection) {
            searchResultsContainer.innerHTML = content;
            searchResultsSection.style.display = 'block'; // Show section
        }
    } else {
        // DETAIL skeleton goes to hero container
        if (append) {
            // Prepend skeleton ABOVE existing content
            container.insertAdjacentHTML('afterbegin', content);
        } else {
            // Replace entire content
            container.innerHTML = content;
        }
        container.classList.add('showing-loading');
    }
}

/**
 * Render content based on current state
 * Called by orchestrator when state changes
 */
export async function renderContent(currentState, prevState) {
    if (!container) {
        return;
    }
    
    // OPTIMIZATION: Check for fake-to-real update to perform partial rendering
    const isFakeToRealUpdate =
        prevState &&
        prevState.videoDetail &&
        prevState.videoDetail.meta.isFakeData === true &&
        currentState.videoDetail &&
        !currentState.videoDetail.meta.isFakeData;

    if (isFakeToRealUpdate) {
        // PARTIAL RENDER: Only update title and download options
        try {
            const { updateVideoTitle } = await import('./download-rendering.js');
            updateVideoTitle(currentState.videoDetail.meta);
            await refreshDownloadOptions(currentState.videoDetail);

            // Ensure card is visible
            const downloadContainer = document.getElementById('downloadOptionsContainer');
            if (downloadContainer) {
                downloadContainer.classList.add('loaded');
                downloadContainer.removeAttribute('aria-busy');
            }
            // Update tracking state
            lastRenderedContentId = currentState.videoDetail.meta?.url || currentState.videoDetail.meta?.title || 'video';
            lastRenderedActiveTab = currentState.activeTab;

            // --- ADVANCED DEBUGGING ---
            const imgElement = document.getElementById('videoThumbnail');
            if (imgElement) {
                // 1. MutationObserver to catch all attribute changes
                const observer = new MutationObserver((mutationsList) => {
                    for(const mutation of mutationsList) {
                        if (mutation.type === 'attributes') {
                        }
                    }
                });

                observer.observe(imgElement, {
                    attributes: true,
                    attributeOldValue: true
                });

                // Disconnect observer after a short time
                setTimeout(() => {
                    observer.disconnect();
                }, 500);

                // 2. Snapshot log (from before)
                setTimeout(() => {
                    const styles = window.getComputedStyle(imgElement);
                }, 100);
            } else {
            }

        } catch (error) {
            // Fallback to full render on error
            await fullRender(currentState);
        }
        return;
    }

    // FULL RENDER LOGIC (Original flow)
    await fullRender(currentState);
}

/**
 * Handles the full content rendering logic (original function body)
 * @param {Object} currentState 
 */
async function fullRender(currentState) {
    // Priority routing: gallery > video > clear content
    if (currentState.galleryDetail) {
        const existingGallery = container.querySelector('.gallery-container');
        if (existingGallery) {
            return;
        }

        await clearContent();
        try {
            await renderGalleryContent(currentState.galleryDetail, container);
            container.classList.add('showing-data');
        } catch (error) {
            await renderMessage('error', 'Failed to load gallery content');
        }
    } else if (currentState.videoDetail) {
        const contentId = currentState.videoDetail.meta?.url || currentState.videoDetail.meta?.title || 'video';

        if (lastRenderedContentId === contentId) {
            const activeTabChanged = lastRenderedActiveTab !== currentState.activeTab;
            const conversionTasksChanged = hasConversionTaskUpdates();

            if (activeTabChanged || conversionTasksChanged) {
                await refreshDownloadOptions(currentState.videoDetail);
                lastRenderedActiveTab = currentState.activeTab;
            } else {
                const downloadContainer = document.getElementById('downloadOptionsContainer');
                if (downloadContainer) {
                    try {
                        const { attachDownloadListeners } = await import('./download-rendering.js');
                        attachDownloadListeners(downloadContainer);
                    } catch (error) {
                    }
                }
            }
            return;
        }

        const hasExistingSearchResults = searchResultsContainer &&
                                         searchResultsSection &&
                                         searchResultsSection.style.display !== 'none' &&
                                         searchResultsContainer.querySelector('.search-results-grid');

        // ALWAYS clear content area properly (both paths) to prevent flicker
        // Priority: HIDE first, then clear src, then remove
        const thumbnailImages = container.querySelectorAll('.thumbnail-image, #videoThumbnail');
        if (thumbnailImages.length > 0) {
            thumbnailImages.forEach(img => {
                img.style.transition = 'none';  // Disable transition for instant hide
                img.style.opacity = '0';        // Hide immediately (no visual flash)
                img.src = '';                   // Clear src to stop loading
                if (img.parentNode) {
                    img.remove();               // Remove from DOM
                }
            });
        }

        lastRenderedContentId = contentId;
        lastRenderedActiveTab = currentState.activeTab;

        try {
            // Render new content FIRST (in memory)
            const content = await renderVideoContent(currentState.videoDetail);

            // Then do atomic swap: clear old + set new in one operation
            // This minimizes the time container is empty (prevents flash)
            container.className = 'content-area';
            container.innerHTML = content;
            container.classList.add('showing-data');

            const downloadContainer = document.getElementById('downloadOptionsContainer');
            if (downloadContainer) {
                try {
                    const { attachDownloadListeners } = await import('./download-rendering.js');
                    attachDownloadListeners(downloadContainer);
                } catch (error) {
                }
            }
        } catch (error) {
            await renderMessage('error', 'Failed to load video content');
        }
    }
}

/**
 * Render data for success cases (legacy support + search results)
 * @param {string} type - Content type: 'search-results', 'video-info', 'playlist-info'
 * @param {any} data - Data to render
 */
export async function renderData(type, data) {
    if (!container) {
        return;
    }

    await clearContent();

    try {
        // Handle gallery case separately as it modifies the DOM directly
        if (type === 'video-info' && data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
            await renderGalleryContent(data, container);
            container.classList.add('showing-data');
            return; // Exit early since rendering is done
        }

        let content = '';

        switch (type) {
            case 'search-results':
                // CSS already bundled in main.js
                content = renderSearchResults(data);
                // Render search results to dedicated section
                if (searchResultsContainer && searchResultsSection) {
                    searchResultsContainer.innerHTML = content;
                    searchResultsSection.style.display = 'block'; // Show section
                }
                break;
            case 'video-info':
                // This case now only handles non-gallery video info
                content = await renderVideoInfo(data);
                container.innerHTML = content;
                container.classList.add('showing-data');
                break;
            case 'playlist-info':
                content = renderPlaylistInfo(data);
                container.innerHTML = content;
                container.classList.add('showing-data');
                break;
            default:
                content = '<div class="content-error">Unknown content type</div>';
                container.innerHTML = content;
                container.classList.add('showing-data');
        }

    } catch (error) {
        await renderMessage('error', 'Failed to load content');
    }
}

/**
 * Render search results (Search V2 API with rich metadata)
 * @param {Object} data - Search data with items array and pagination
 * @returns {string} HTML string
 */
function renderSearchResults(data) {
    // Get current state for results (may have accumulated from load more)
    const currentState = getState();
    const allResults = currentState.results && currentState.results.length > 0
        ? currentState.results
        : (data.items || data.videos || []);

    // Filter only "stream" type (videos only, no channels)
    const videos = allResults.filter(item => item.type === 'stream' || !item.type);

    if (videos.length === 0) {
        return renderEmptyState('No videos found for your search');
    }

    const items = videos.map(video => {
        // Format view count based on screen size (responsive display)
        const formatViewsForDisplay = (displayViews) => {
            if (!displayViews) return '';

            // Mobile: Remove " views" suffix (e.g., "2.3M views" → "2.3M")
            // Desktop: Keep full text (e.g., "2.3M views")
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                return displayViews.replace(' views', '');
            }

            return displayViews;
        };

        const formattedViews = formatViewsForDisplay(video.displayViews);

        return `
            <article class="search-result-card"
                     data-video-id="${escapeHtml(video.id)}"
                     data-video-title="${escapeHtml(video.title)}">
                <div class="card-thumbnail">
                    <img src="${escapeHtml(video.thumbnailUrl || generateYoutubeThumbnail(video.id))}"
                         loading="lazy"
                         alt="${escapeHtml(video.title)}"
                         onerror="this.src='${generateYoutubeThumbnail(video.id)}'">
                    ${video.displayDuration ? `<span class="duration-badge">${escapeHtml(video.displayDuration)}</span>` : ''}
                </div>
                <div class="card-content">
                    <h3 class="card-title">${escapeHtml(video.title)}</h3>
                    ${video.metadata?.uploaderName ? `<p class="card-channel">${escapeHtml(video.metadata.uploaderName)}</p>` : ''}
                    <div class="card-metadata">
                        ${formattedViews ? `<span>${escapeHtml(formattedViews)} </span>` : ''}
                        ${formattedViews && video.displayDate ? '<span>•</span>' : ''}
                        ${video.displayDate ? `<span>${escapeHtml(video.displayDate)}</span>` : ''}
                    </div>
                </div>
            </article>
        `;
    }).join('');

    // Get skeleton cards and non-grid indicators separately
    const { skeletonCards, nonGridIndicator } = renderLoadingIndicator();

    return `
        <div class="content-data search-results">
            <div class="search-results-grid">
                ${items}
                ${skeletonCards}
            </div>
            ${nonGridIndicator}
        </div>
    `;
}

/**
 * Render loading indicator for infinite scroll
 * Shows skeleton cards when loading, error state on failure, end message when done
 * Maximum 2 load more operations supported
 * @returns {Object} Object with skeletonCards (in grid) and nonGridIndicator (outside grid)
 */
function renderLoadingIndicator() {
    const pagination = getSearchPagination();
    const state = getState();
    const hasResults = state.results && state.results.length > 0;


    // Show skeleton cards if currently loading more (12 cards) - INSIDE GRID
    if (pagination.isLoadingMore) {
        const skeletonCards = Array(12).fill(null).map(() => generateSkeletonCard()).join('');

        return {
            skeletonCards: skeletonCards,
            nonGridIndicator: ''
        };
    }

    // Show error state with retry button if load more failed - OUTSIDE GRID
    if (infiniteScrollErrorState && hasResults) {
        return {
            skeletonCards: '',
            nonGridIndicator: `
                <div class="load-more-error">
                    <p class="error-message">⚠ Unable to load more videos</p>
                    <button class="btn-retry" onclick="window.__infiniteScrollRetry()">Try Again</button>
                </div>
            `
        };
    }

    // Show maximum results reached message if hit 2-load limit - OUTSIDE GRID
    if (pagination.loadMoreCount >= 2 && hasResults) {
        return {
            skeletonCards: '',
            nonGridIndicator: ``
        };
    }

    // Show end of results message if no more pages and we have results - OUTSIDE GRID
    if (!pagination.hasNextPage && hasResults) {
        return {
            skeletonCards: '',
            nonGridIndicator: `
                <div class="end-of-results">
                    <p class="end-message">No more videos available</p>
                </div>
            `
        };
    }

    // Add sentinel element for intersection observer (invisible) - OUTSIDE GRID
    // Only add if there are more pages to load
    if (pagination.hasNextPage) {
        return {
            skeletonCards: '',
            nonGridIndicator: `<div class="infinite-scroll-sentinel" data-sentinel="true"></div>`
        };
    }

    return {
        skeletonCards: '',
        nonGridIndicator: ''
    };
}

/**
 * Render video info with download options
 * @param {Object} data - Video data
 * @returns {string} HTML string
 */
async function renderVideoInfo(data) {
    const currentState = getState();

    // Check if this is proper videoDetail with formats
    if (data && data.formats && (data.formats.video || data.formats.audio)) {
        // Dynamic import and use download options rendering
        try {
            const { renderDownloadOptions } = await import('./download-rendering.js');
            const downloadOptionsHTML = renderDownloadOptions(currentState);
            if (downloadOptionsHTML) {
                return downloadOptionsHTML;
            }
        } catch (error) {
        }
    }

    // Fallback to skeleton when data is incomplete or loading
    return renderDetailSkeleton();
}

/**
 * Render video content with download options
 * @param {Object} data - Video data
 * @returns {string} HTML string
 */
async function renderVideoContent(data) {

    // Check if this has proper format data for download options
    if (data && data.formats && (data.formats.video || data.formats.audio)) {
        // Load download options CSS before rendering
        try {
            // CSS already bundled in main.js
        } catch (error) {
        }

        // Get current state for rendering
        const currentState = getState();

        // Dynamic import and render download options
        try {
            const { renderDownloadOptions } = await import('./download-rendering.js');
            const downloadOptionsHTML = renderDownloadOptions(currentState);

            if (downloadOptionsHTML) {
                // NOTE: We return HTML here, listeners will be attached synchronously
                // after innerHTML assignment in the caller (renderContent())
                return downloadOptionsHTML;
            }
        } catch (error) {
        }
    }

    // Fallback to basic video info rendering
    return await renderVideoInfo(data);
}

// CSS loading function removed - all CSS now bundled in main.js

// CSS loading functions removed - all CSS bundled in main.js

// All CSS loading functions removed - CSS bundled in main.js

/**
 * Render gallery content using gallery-renderer
 * @param {Object} data - Gallery data with meta and gallery array
 * @param {HTMLElement} targetContainer - The container to render into
 */
async function renderGalleryContent(data, targetContainer) {

    // CSS is already bundled in main.js - no need to load separately
    // Add the correct classes to the container
    targetContainer.className = 'content-area content-data gallery-content';

    // Dynamic import gallery renderer (prefetched after page load)
    try {
        const { renderGallery } = await import('./gallery-renderer.js');
        await renderGallery(data, targetContainer);
    } catch (error) {
        throw error;
    }

    // This function no longer returns HTML
}

/**
 * Render playlist info (placeholder for now)
 * @param {Object} data - Playlist data
 * @returns {string} HTML string
 */
function renderPlaylistInfo(data) {
    const itemCount = data?.items?.length || 0;
    return `
        <div class="content-data playlist-info">
            <div class="info-placeholder">
                <p>📄 Playlist Information</p>
                <p class="placeholder-subtitle">Playlist items (${itemCount}) - to be implemented</p>
                <pre class="debug-data">${JSON.stringify(data, null, 2)}</pre>
            </div>
        </div>
    `;
}

/**
 * Render empty state
 * @param {string} text - Empty state text
 * @returns {string} HTML string
 */
function renderEmptyState(text) {
    return `
        <div class="content-empty">
            <div class="empty-icon">
                <i class="fas fa-search"></i>
            </div>
            <p class="empty-text">${escapeHtml(text)}</p>
        </div>
    `;
}

/**
 * Generate a single skeleton card HTML
 * Used by both initial load and load more
 * @returns {string} HTML string for one skeleton card
 */
function generateSkeletonCard() {
    return `
        <article class="search-result-card skeleton-card">
            <div class="card-thumbnail">
                <span class="skeleton-thumbnail"></span>
            </div>
            <div class="card-content">
                    <span class="skeleton-line skeleton-line--long"></span>
                    <span class="skeleton-line skeleton-line--medium"></span>
                <p class="card-channel skeleton-channel">
                    <span class="skeleton-line skeleton-line--short"></span>
                </p>
                <div class="card-metadata skeleton-metadata">
                    <span class="skeleton-segment"></span>
                    <span class="skeleton-segment"></span>
                </div>
            </div>
        </article>
    `;
}

/**
 * Render LIST skeleton - for search results and playlists
 * @returns {string} HTML string for skeleton
 */
function renderListSkeleton() {
    // Create 12 skeleton items for initial loading state
    const skeletonItems = Array(12).fill(null).map(() => generateSkeletonCard()).join('');

    return `
        <div class="content-data search-results">
            <div class="search-results-grid">
                ${skeletonItems}
            </div>
        </div>
    `;
}

/**
 * Render DETAIL skeleton - for videos, galleries, and clicked results
 * Simplified version without quality item skeletons
 * @returns {string} HTML string for skeleton
 */
function renderDetailSkeleton() {
    const qualityItemSkeleton = `
        <div class="quality-item">
            <div class="quality-row">
                <div class="quality-col-left">
                    <span class="skeleton skeleton-text" style="width: 50px; height: 20px;"></span>
                    <span class="skeleton skeleton-text skeleton-text--desktop-only" style="width: 40px; height: 16px; margin-top: 4px;"></span>
                </div>
                <div class="quality-col-center">
                    <span class="skeleton skeleton-text" style="width: 60px; height: 20px;"></span>
                </div>
                <div class="quality-col-right">
                    <div class="skeleton skeleton-button"></div>
                </div>
            </div>
        </div>
    `;

    return `
        <div class="video-info-card" aria-live="polite" aria-busy="true">
            <div class="video-layout">
                <div class="video-info-left">
                    <div class="format-tabs">
                        <div class="format-tab skeleton">
                            <div class="skeleton skeleton-text" style="width: 80px;"></div>
                        </div>
                    </div>
                    <div class="video-thumbnail aspect-16-9" style="position: relative; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 8px; background: #f5f5f5;">
                        <div class="skeleton skeleton-thumbnail" style="position: absolute; inset: 0; width: 100%; height: 100%;"></div>
                    </div>
                    <div class="video-title-wrapper">
                        <div class="skeleton skeleton-text" style="width: 90%; height: 18px; margin-bottom: 8px;"></div>
                        <div class="skeleton skeleton-text" style="width: 70%; height: 18px;"></div>
                    </div>
                </div>
                <div class="video-details">
                    <div class="format-tabs">
                        <div class="format-tab skeleton">
                            <div class="skeleton skeleton-text" style="width: 80px;"></div>
                        </div>
                        <div class="format-tab skeleton">
                            <div class="skeleton skeleton-text" style="width: 80px;"></div>
                        </div>
                    </div>
                    <div class="quality-list">
                        ${Array(6).fill(qualityItemSkeleton).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Note: Removed renderPlaylistSkeleton() and renderGallerySkeleton()
// Now using unified renderListSkeleton() and renderDetailSkeleton() instead

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Track conversion task updates
let lastConversionTaskSnapshot = {};

/**
 * Check if conversion tasks have been updated since last render
 * @returns {boolean} True if tasks have changed
 */
function hasConversionTaskUpdates() {
    const currentTasks = getConversionTasks();
    const currentSnapshot = JSON.stringify(currentTasks);

    if (lastConversionTaskSnapshot !== currentSnapshot) {
        lastConversionTaskSnapshot = currentSnapshot;
        return true;
    }

    return false;
}

/**
 * Refresh download options UI with updated conversion states
 * @param {Object} videoDetail - Video detail data
 */
async function refreshDownloadOptions(videoDetail) {
    if (!container) return;

    const downloadContainer = document.getElementById('downloadOptionsContainer');
    if (!downloadContainer) return;

    try {
        const { renderDownloadOptions, attachDownloadListeners } = await import('./download-rendering.js');

        // Get current state for rendering
        const currentState = getState();

        const newHTML = renderDownloadOptions(currentState);
        if (!newHTML) return;

        const tempWrapper = document.createElement('div');
        tempWrapper.innerHTML = newHTML;

        const updatedDetails = tempWrapper.querySelector('.video-details');
        const currentDetails = downloadContainer.querySelector('.video-details');

        if (updatedDetails && currentDetails) {
            currentDetails.innerHTML = updatedDetails.innerHTML;
        }

        // Ensure listeners remain attached (idempotent re-call)
        attachDownloadListeners(downloadContainer);
    } catch (error) {
    }
}
