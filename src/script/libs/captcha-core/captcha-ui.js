/**
 * CAPTCHA UI Wrapper (Feature Layer)
 * Handles UI aspects of CAPTCHA: modal creation, display, user interactions
 * Uses captcha-core for business logic
 */

import { getCaptchaToken } from './index.js';
import { getValidJwt, clearJwt } from './jwt.js';
import '../../../styles/features/captcha-modal.css';

// --- State ---
let modalOverlay = null;
let currentResolve = null;
let currentReject = null;

// --- Private UI Functions ---

/**
 * Creates and injects the reCAPTCHA modal into the DOM.
 */
function _createRecaptchaModal() {
    if (document.getElementById('recaptcha-modal')) return;

    const modalHTML = `
        <div id="recaptcha-modal" class="captcha-modal" role="dialog" aria-modal="true" aria-labelledby="recaptcha-modal-title">
            <div class="captcha-modal-overlay"></div>
            <div class="captcha-modal-content">
                <div class="captcha-modal-header">
                    <h2 id="recaptcha-modal-title" class="captcha-modal-title">Please Verify You Are Human</h2>
                    <button id="recaptcha-close-btn" class="captcha-modal-close-btn" aria-label="Close verification modal">&times;</button>
                </div>
                <div class="captcha-modal-body">
                    <p>To continue, please complete the challenge below.</p>
                    <div id="recaptcha-widget-container" class="recaptcha-container">
                        <!-- reCAPTCHA widget will be rendered here -->
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('recaptcha-close-btn').addEventListener('click', () => {
        _hideRecaptchaModal();
        if (currentReject) {
            currentReject(new Error('User closed the reCAPTCHA challenge.'));
        }
    });

    modalOverlay = document.getElementById('recaptcha-modal');
}

/**
 * Shows the reCAPTCHA modal.
 */
function _showRecaptchaModal() {
    const modal = document.getElementById('recaptcha-modal');
    if (modal) {
        modal.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Hides the reCAPTCHA modal.
 */
function _hideRecaptchaModal() {
    const modal = document.getElementById('recaptcha-modal');
    if (modal) {
        modal.classList.remove('visible');
        document.body.style.overflow = '';
    }
}

/**
 * Get CAPTCHA token with UI handling
 * @returns {Promise<{token: string, type: string}>}
 */
async function _getCaptchaTokenWithUI() {
    return new Promise(async (resolve, reject) => {
        currentResolve = resolve;
        currentReject = reject;

        try {
            const result = await getCaptchaToken({
                onRecaptchaNeeded: () => {
                    // Show modal when reCAPTCHA is needed (Turnstile failed)
                    _createRecaptchaModal();
                    _showRecaptchaModal();
                },
                onSuccess: (token) => {
                    // Hide modal on success
                    _hideRecaptchaModal();
                },
                onError: (error) => {
                    // Hide modal on error
                    _hideRecaptchaModal();
                },
                recaptchaContainerId: 'recaptcha-widget-container'
            });

            resolve(result);
        } catch (error) {
            _hideRecaptchaModal();
            reject(error);
        } finally {
            currentResolve = null;
            currentReject = null;
        }
    });
}

// --- Public API ---

/**
 * A higher-order function that wraps an API function with Captcha protection.
 * @param {Function} apiFunction - The original API function to protect.
 * @returns {Function} A new function that will get a captcha token before calling the original function.
 */
export function withCaptchaProtection(apiFunction) {
    return async function(...args) {
        const jwtToken = getValidJwt();

        // --- Flow for when a JWT exists ---
        if (jwtToken) {
            try {
                // Try to call the API with the existing JWT
                return await apiFunction(...args, { jwt: jwtToken });
            } catch (error) {
                // Check if the error indicates an invalid JWT
                const isJwtError = error?.status === 401 || error?.status === 403 || (error?.reason || '').includes('jwt');

                if (isJwtError) {
                    clearJwt(); // Clear the invalid JWT
                    // Fall through to the captcha logic below
                } else {
                    // It's a different kind of error, just re-throw it
                    throw error;
                }
            }
        }

        // --- Flow for when NO JWT exists, or it was invalid ---
        try {
            const captchaPayload = await _getCaptchaTokenWithUI();
            // Call the API with the captcha token
            return await apiFunction(...args, { captcha: captchaPayload });
        } catch (error) {
            // As per user's request, if this call fails, just show the error.
            // Re-throw the error to be handled by the UI layer.
            throw error;
        }
    };
}
