/**
 * Gallery Renderer - Complete Implementation
 * Handles rendering and interaction for gallery content with multiple media items
 * Direct URLs from extract are passed straight to download helpers.
 */

import { triggerDownload, initExpandableText, openLinkInNewTab, isMobileDevice } from '../../utils.js';
import {
    startMultifileDownload,
    retryMultifileDownload,
    downloadZipFile,
    getMultifileState,
    cancelMultifileDownload
} from './multifile-ui.js';
import { MULTIFILE_STATES } from '../../libs/downloader-lib-standalone/remote/multifile-constants.js';
import {
    updateCurrentSelection,
    getRecentDownloadStatus,
    clearRecentDownload,
    setState
} from './state.js';
import { loadGalleryCSS } from '../../utils/css-loader.js';
import { showExpireModal } from '../../ui-components/modal/expire-modal.js';

// Module-level state for selection management
let selectedItems = new Set();
let galleryData = null;
let pageUnloadHandlerRegistered = false;

/**
 * Setup page-level cleanup handlers (only once per session)
 */
function setupPageCleanupHandlers() {
    if (pageUnloadHandlerRegistered) return;

    // Cleanup multifile session on page unload
    window.addEventListener('beforeunload', () => {
        cancelMultifileDownload(true); // Silent cleanup
    });

    pageUnloadHandlerRegistered = true;
}

/**
 * Main render function for gallery content
 * @param {Object} data - Gallery data with meta and gallery array
 * @param {HTMLElement} container - DOM container to render into
 */
export async function renderGallery(data, container, options = {}) {

    if (!data || !data.gallery || !Array.isArray(data.gallery) || data.gallery.length === 0) {
        container.innerHTML = '<div class="gallery-error">No gallery items to display</div>';
        return;
    }

    // CSS is already bundled in main.js - no need to load separately

    const isMobileView = isMobileDevice();

    // Setup page-level cleanup handlers (only once)
    setupPageCleanupHandlers();

    // Store data for event handlers
    galleryData = data;
    selectedItems.clear(); // Reset selection

    // Clean multifile session state when rendering new gallery (silent cleanup)
    cancelMultifileDownload(true);

  
    // Generate complete gallery HTML structure
    const galleryHTML = `
        <div class="gallery-container">
            ${renderGalleryHeader(data)}
            ${renderBulkControls()}
            <div class="gallery-grid">
                ${data.gallery.map(item => renderGalleryItem(item)).join('')}
            </div>
        </div>
    `;

    container.innerHTML = galleryHTML;

    const galleryContainerEl = container.querySelector('.gallery-container');
    if (galleryContainerEl && isMobileView) {
        galleryContainerEl.classList.add('mobile-multifile-disabled');
    }

    // Setup event listeners after DOM is populated
    setupEventListeners(container);

    // Initialize expandable text for the gallery title
    if (galleryContainerEl) {
        initExpandableText(galleryContainerEl, '.gallery-title');
    }
}

/**
 * Render gallery header with title and count
 * @param {Object} data - Gallery data
 * @returns {string} HTML string
 */
function renderGalleryHeader(data) {
    const title = data.meta?.title || 'Gallery';
    const itemCount = data.gallery.length;
    const author = data.meta?.author || 'Unknown';

    return `
        <div class="gallery-header">
            <div class="gallery-title-section">
                <p class="gallery-title expandable-text">${escapeHtml(title)}</p>
                <p class="gallery-author">by ${escapeHtml(author)}</p>
            </div>
            <div class="gallery-meta">
            </div>
        </div>
    `;
}

/**
 * Render bulk selection controls
 * @returns {string} HTML string
 */
function renderBulkControls() {
    return `
        <div>
            <div class="gallery-bulk-controls">
                <div class="bulk-selection">
                    <input type="checkbox" id="bulk-select-checkbox" class="bulk-select-checkbox">
                    <label for="bulk-select-checkbox" class="bulk-select-label">All</label>
                    <span class="bulk-selection-count">0 selected</span>
                </div>
                <span class="bulk-progress-info" aria-live="polite" style="display:none;"></span>
                <div class="bulk-actions">
                    <button type="button" class="btn-bulk-download" style="display: none;">Download</button>
                </div>

            </div>
            <span class="bulk-status-message" role="alert" aria-live="polite" style="display:none;"></span>
        </div>
    `;
}

/**
 * Render individual gallery item
 * @param {Object} item - Gallery item data
 * @returns {string} HTML string
 */
function renderGalleryItem(item) {
    const qualityOptions = renderQualityOptions(item.formats || []);
    const defaultQuality = getDefaultQuality(item.formats || []);

    return `
        <div class="gallery-item" data-id="${escapeHtml(item.id)}" data-type="${escapeHtml(item.type)}">
            <div class="gallery-item-header">
                <div class="item-selection">
                    <input type="checkbox"
                           class="gallery-item-checkbox"
                           id="item-${escapeHtml(item.id)}"
                           data-item-id="${escapeHtml(item.id)}">
                    <label for="item-${escapeHtml(item.id)}" class="sr-only">Select item</label>
                </div>
                <div class="gallery-item-thumb-container">
                    <img src="${escapeHtml(item.thumb)}"
                         alt="${escapeHtml(item.label || `${item.type} item`)}"
                         class="gallery-item-thumb"
                         width="300"
                         height="400"
                         loading="eager"
                         onerror="this.style.backgroundColor='#f0f0f0'; this.style.opacity='0.5'; this.alt='Failed to load';">
                    <span class="media-type-badge media-type-${item.type.toLowerCase()}">${escapeHtml(item.type)}</span>
                </div>
            </div>
            <div class="gallery-item-content">
                <div class="quality-selector-wrapper">
                    <select class="gallery-quality-select"
                            id="quality-${escapeHtml(item.id)}"
                            data-item-id="${escapeHtml(item.id)}"
                            data-default-quality="${escapeHtml(defaultQuality)}">
                        ${qualityOptions}
                    </select>
                </div>
                <button type="button"
                        class="btn-download-gallery-item"
                        data-item-id="${escapeHtml(item.id)}"
                        title="Download this item">
                    <span class="download-text">Download</span>
                </button>
            </div>
        </div>
    `;
}

/**
 * Generate quality options for dropdown
 * @param {Array} formats - Array of format objects
 * @returns {string} HTML options string
 */
function renderQualityOptions(formats) {
    if (!Array.isArray(formats) || formats.length === 0) {
        return '<option value="auto">Auto</option>';
    }

    return formats.map(format => {
        const qualityLabel = format.qualityLabel || format.quality || 'Default';
        const value = format.id; // Use the unique format ID as the value
        return `<option value="${escapeHtml(value)}">${escapeHtml(qualityLabel)}</option>`;
    }).join('');
}

/**
 * Get default quality option
 * @param {Array} formats - Array of format objects
 * @returns {string} Default quality string (format ID)
 */
function getDefaultQuality(formats) {
    if (!Array.isArray(formats) || formats.length === 0) {
        return 'auto';
    }
    // Use the first format as the default
    return formats[0].id;
}

/**
 * Setup all event listeners for gallery interactions
 * @param {HTMLElement} container - Gallery container element
 */
function setupEventListeners(container) {
    // Individual item selection
    const checkboxes = container.querySelectorAll('.gallery-item-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleItemSelection);
    });

    // Bulk selection controls
    const selectAllCheckbox = container.querySelector('#bulk-select-checkbox');
    const bulkDownloadBtn = container.querySelector('.btn-bulk-download');

    if (selectAllCheckbox) selectAllCheckbox.addEventListener('change', handleToggleSelectAll);
    if (bulkDownloadBtn) bulkDownloadBtn.addEventListener('click', handleBulkDownload);

    // Individual download buttons
    const downloadBtns = container.querySelectorAll('.btn-download-gallery-item');
    downloadBtns.forEach((btn, index) => {

        btn.addEventListener('click', handleSingleDownload);
    });


}

/**
 * Get currently selected encrypted URLs from UI
 * @returns {string[]} Array of encrypted URLs
 */
function getCurrentSelectedUrls() {
    const itemIds = Array.from(selectedItems);

    if (itemIds.length === 0) {
        return [];
    }

    // Gather encrypted URLs from selected items
    const itemsToProcess = itemIds.map(id => {
        const item = galleryData.gallery.find(i => i.id === id);
        const qualitySelect = document.querySelector(`#quality-${id}`);
        const selectedFormatId = qualitySelect ? qualitySelect.value : 'auto';
        const format = item.formats.find(f => f.id === selectedFormatId);
        return { item, format };
    }).filter(data => data.item && data.format && data.format.url);

    return itemsToProcess.map(p => p.format.url);
}

/**
 * Handle individual item selection
 * @param {Event} event - Change event from checkbox
 */
function handleItemSelection(event) {
    const checkbox = event.target;
    const itemId = checkbox.dataset.itemId;

    if (checkbox.checked) {
        selectedItems.add(itemId);
    } else {
        selectedItems.delete(itemId);
    }

    // Sync local selection với global state
    const currentUrls = getCurrentSelectedUrls();
    updateCurrentSelection(currentUrls);

    updateBulkControls();
}

/**
 * Handle the master "Select All" checkbox change
 * @param {Event} event - Change event from the master checkbox
 */
function handleToggleSelectAll(event) {
    const isChecked = event.target.checked;
    const checkboxes = document.querySelectorAll('.gallery-item-checkbox');

    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        if (isChecked) {
            selectedItems.add(checkbox.dataset.itemId);
        } else {
            selectedItems.delete(checkbox.dataset.itemId);
        }
    });

    // Ensure the set is completely empty if unchecked
    if (!isChecked) {
        selectedItems.clear();
    }

    // 🔥 NEW: Sync local selection với global state
    const currentUrls = getCurrentSelectedUrls();
    updateCurrentSelection(currentUrls);

    updateBulkControls();
}

/**
 * Update bulk control states based on selection
 */
function updateBulkControls() {
    const countElement = document.querySelector('.bulk-selection-count');
    const bulkDownloadBtn = document.querySelector('.btn-bulk-download');
    const selectAllCheckbox = document.querySelector('#bulk-select-checkbox');
    const totalItems = document.querySelectorAll('.gallery-item-checkbox').length;

    if (countElement) {
        countElement.textContent = `${selectedItems.size} selected`;
    }

    if (bulkDownloadBtn) {
        // Check if current selection matches recent download
        const reusableStatus = getRecentDownloadStatus();

        if (reusableStatus.canReuse) {
            // Selection matches + link valid → Add success class
            if (!bulkDownloadBtn.classList.contains('btn-success')) {
                bulkDownloadBtn.classList.add('btn-success', 'btn-ready');
                bulkDownloadBtn.textContent = 'Download';
            }
        } else {
            // Selection different or expired → Remove success class
            if (bulkDownloadBtn.classList.contains('btn-success')) {
                bulkDownloadBtn.classList.remove('btn-success', 'btn-ready');
                bulkDownloadBtn.textContent = 'Download';
            }
        }

        // Hide button when less than 2 items are selected
        if (selectedItems.size < 2) {
            bulkDownloadBtn.style.display = 'none';
        } else {
            bulkDownloadBtn.style.display = '';
        }
    }

    if (selectAllCheckbox) {
        if (selectedItems.size === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (selectedItems.size === totalItems) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }
}

/**
 * Handle single item download
 * @param {Event} event - Click event from download button
 */
async function handleSingleDownload(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const itemId = button.dataset.itemId;

   
    // Get selected quality for this item
    const qualitySelect = document.querySelector(`#quality-${itemId}`);
    const selectedQualityId = qualitySelect ? qualitySelect.value : 'auto';


    // Find item data
    const item = galleryData.gallery.find(item => item.id === itemId);
    if (!item) {
        return;
    }

  

    // Set loading state
    setDownloadButtonState(button, 'loading');

    try {
        await performSingleDownload(item, selectedQualityId);
        // Keep button in normal state - no success transition
        setDownloadButtonState(button, 'normal');
    } catch (error) {
        setDownloadButtonState(button, 'error');
        setTimeout(() => setDownloadButtonState(button, 'normal'), 3000);
    }
}

/**
 * Handle bulk download using multifile API
 * @param {Event} event - Click event from bulk download button
 */
async function handleBulkDownload(event) {
    event.preventDefault();
    const button = event.currentTarget;

    try {
        // Get current selected URLs
        const currentUrls = getCurrentSelectedUrls();

        if (currentUrls.length === 0) {
            setState({ error: 'Please select at least one item to download' });
            return;
        }

        // Update current selection in state
        updateCurrentSelection(currentUrls);

        // Get reuse status
        const reusableStatus = getRecentDownloadStatus();

        // Case 1: Can reuse existing download link
        if (reusableStatus.canReuse) {
            // Avoid navigating away which refreshes the UI
            triggerDownload(reusableStatus.recentDownload.url); // Keep ZIP in current tab
            return;
        }

        // Case 2: Same selection but expired - show modal
        if (reusableStatus.reason === 'expired' && reusableStatus.isExpired) {
            showExpireModal({
                onTryAgain: () => startNewMultifileSession(currentUrls, button)
            });
            return;
        }

        // Case 3: Different selection or no recent download - start new session
        await startNewMultifileSession(currentUrls, button);

    } catch (error) {
        setState({ error: 'Failed to start download. Please try again.' });
    }
}

/**
 * Start new multifile download session
 * @param {string[]} encryptedUrls - URLs to download
 * @param {HTMLElement} button - Download button element
 */
async function startNewMultifileSession(encryptedUrls, button) {
    try {
        // Start multifile download with UI callback
        await startMultifileDownload(encryptedUrls, (stateUpdate) => {
            // Update button UI based on state
            updateBulkDownloadButton(button, stateUpdate);
        });
    } catch (error) {
        setState({ error: 'Failed to start download session. Please try again.' });
    }
}

/**
 * Set download button visual state
 * @param {HTMLElement} button - Download button element
 * @param {string} state - Button state: 'normal', 'loading', 'success', 'error'
 */
function setDownloadButtonState(button, state) {
    // Remove all state classes
    button.classList.remove('btn-loading', 'btn-success', 'btn-error');

    const textElement = button.querySelector('.download-text');
    const iconElement = button.querySelector('.download-icon');

    switch (state) {
        case 'loading':
            button.classList.add('btn-loading');
            button.disabled = true;
            if (textElement) textElement.textContent = 'Preparing...';
            if (iconElement) iconElement.textContent = '';
            break;
        case 'success':
            // Keep normal appearance - no success styling for gallery buttons
            button.disabled = false;
            if (textElement) textElement.textContent = 'Download';
            if (iconElement) iconElement.textContent = '';
            break;
        case 'error':
            button.classList.add('btn-error');
            button.disabled = false;
            if (textElement) textElement.textContent = 'Try Again';
            if (iconElement) iconElement.textContent = '';
            break;
        default: // normal
            button.disabled = false;
            if (textElement) textElement.textContent = 'Download';
            if (iconElement) iconElement.textContent = '';
    }
}

/**
 * Update bulk download button based on multifile state
 * @param {HTMLElement} button - Bulk download button
 * @param {Object} stateUpdate - State update from multifile-ui
 */
function updateBulkDownloadButton(button, stateUpdate) {
    const { state } = stateUpdate;

    // Remove all state classes
    button.classList.remove('btn-loading', 'btn-success', 'btn-error', 'btn-preparing', 'btn-converting', 'btn-zipping', 'btn-ready');

    // Determine if download is in progress
    const isDownloading = [
        MULTIFILE_STATES.PREPARING,
        MULTIFILE_STATES.CONVERTING,
        MULTIFILE_STATES.ZIPPING,
        'DOWNLOADING_INDIVIDUAL'
    ].includes(state);

    // Disable all checkboxes when download is in progress
    toggleCheckboxesDisabled(isDownloading);

    switch (state) {
        case MULTIFILE_STATES.PREPARING:
            button.classList.add('btn-preparing');
            button.disabled = true;
            button.textContent = 'Preparing...';
            break;

        case MULTIFILE_STATES.CONVERTING:
            button.classList.add('btn-converting');
            button.disabled = true;
            // Per request, do not show progress on the button
            button.textContent = 'Preparing...';
            break;

        case MULTIFILE_STATES.ZIPPING:
            button.classList.add('btn-zipping');
            button.disabled = true; // Cannot cancel during ZIP
            button.textContent = 'Zipping...';
            break;

        // Mobile sequential-download custom state
        case 'DOWNLOADING_INDIVIDUAL':
            button.classList.add('btn-converting');
            button.disabled = true;
            button.textContent = 'Preparing...';
            break;

        case MULTIFILE_STATES.READY:
            button.classList.add('btn-ready', 'btn-success');
            button.disabled = false;
            button.textContent = 'Download';
            break;

        case MULTIFILE_STATES.EXPIRED:
        case MULTIFILE_STATES.ERROR:
            button.classList.add('btn-error');
            button.disabled = false;
            button.textContent = 'Try Again';
            break;

        default: // idle
            button.disabled = selectedItems.size === 0;
            button.textContent = 'Download';
            break;
    }
}

/**
 * Toggle all checkboxes (select-all and individual) disabled state
 * @param {boolean} disabled - Whether to disable checkboxes
 */
function toggleCheckboxesDisabled(disabled) {
    // Disable/enable select-all checkbox
    const selectAllCheckbox = document.querySelector('#bulk-select-checkbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.disabled = disabled;
    }

    // Disable/enable all individual checkboxes
    const checkboxes = document.querySelectorAll('.gallery-item-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.disabled = disabled;
    });
}

/**
 * Perform single item download using direct URLs.
 * @param {Object} item - Gallery item to download
 * @param {string} qualityId - The ID of the selected format.
 * @returns {Promise<void>} Download promise
 */
async function performSingleDownload(item, qualityId) {

    try {
        // Find the selected format from the item's formats array
        const selectedFormat = item.formats.find(f => f.id === qualityId);

        if (!selectedFormat || !selectedFormat.url) {
            throw new Error('Selected quality is not available or has no URL.');
        }

        const filename = selectedFormat.filename || item.filename || `download.${selectedFormat.format || 'mp4'}`;
        triggerDownload(selectedFormat.url, filename, true); // Open in new tab for gallery downloads
    } catch (error) {
        // Re-throw the error so the calling function (handleSingleDownload) can update the button state
        throw error;
    }
}

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

/**
 * Get current selection state (for testing/debugging)
 * @returns {Object} Selection state
 */
export function getSelectionState() {
    return {
        selectedItems: Array.from(selectedItems),
        totalItems: galleryData?.gallery?.length || 0
    };
}
