
/**
 * Expire Modal Component
 * Dynamically creates and manages a modal for expired download links.
 */

let isCSSLoaded = false;

/**
 * Dynamically load the CSS for the modal.
 * Ensures the CSS is loaded only once.
 */
async function loadModalCSS() {
    if (isCSSLoaded) {
        return;
    }
    try {
        await import('../../../styles/features/expire-modal.css');
        isCSSLoaded = true;
    } catch (error) {
    }
}

// Preload the CSS as soon as the module is imported
loadModalCSS();

// Store a reference to the modal element
let modalOverlay = null;

/**
 * Hides and removes the modal from the DOM.
 */
function hideModal() {
    if (modalOverlay) {
        modalOverlay.classList.remove('visible');
        // Allow animation to finish before removing
        setTimeout(() => {
            modalOverlay.remove();
            modalOverlay = null;
        }, 300);
    }
}

/**
 * Shows the expired link modal.
 * @param {object} options - Configuration options.
 * @param {function} options.onTryAgain - Callback function for the 'Try Again' button.
 */
export async function showExpireModal({ onTryAgain }) {
    // If modal is already showing, do nothing
    if (modalOverlay) {
        return;
    }

    // 1. Create the modal HTML
    const modalHTML = `
        <div class="expire-modal-overlay" id="expire-modal-overlay">
            <div class="expire-modal">
                <div class="expire-modal-header">
                    <h2 class="expire-modal-title">Warning</h2>
                    <button class="expire-modal-close-btn" id="expire-modal-close-x" aria-label="Close">&times;</button>
                </div>
                <div class="expire-modal-body">
                    <i class="fas fa-exclamation-triangle expire-modal-icon"></i>
                    <p>Sorry, your download link has expired. Please try again.</p>
                </div>
                <div class="expire-modal-footer">
                    <button class="expire-modal-btn expire-modal-btn-primary" id="expire-modal-retry">Retry</button>
                </div>
            </div>
        </div>
    `;

    // 2. Append to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modalOverlay = document.getElementById('expire-modal-overlay');

    // 3. Add event listeners
    const closeBtnX = document.getElementById('expire-modal-close-x');
    const retryBtn = document.getElementById('expire-modal-retry');

    closeBtnX.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            hideModal();
        }
    });

    retryBtn.addEventListener('click', () => {
        if (typeof onTryAgain === 'function') {
            onTryAgain();
        }
        hideModal();
    });

    // 4. Show the modal with a fade-in effect
    setTimeout(() => {
        if (modalOverlay) {
            modalOverlay.classList.add('visible');
        }
    }, 10);
}
