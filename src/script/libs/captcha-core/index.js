/**
 * CAPTCHA Core Logic (Pure Business Logic - No DOM Manipulation)
 * Handles Cloudflare Turnstile and Google reCAPTCHA token acquisition
 * This module can be reused across different projects
 */

// --- Configuration ---
// TODO: Replace with actual site keys
const TURNSTILE_SITE_KEY = '1x00000000000000000000BB'; // Standard Turnstile placeholder
const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Standard reCAPTCHA placeholder

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
const RECAPTCHA_SCRIPT_URL = 'https://www.google.com/recaptcha/api.js?onload=onloadRecaptchaCallback&render=explicit';

// --- State ---
let turnstileScriptLoaded = false;
let recaptchaScriptLoaded = false;

// --- Private Functions ---

/**
 * Dynamically loads a script and returns a promise.
 * @param {string} src - The script source URL.
 * @param {string} id - The ID to give the script element.
 * @returns {Promise<void>}
 */
function _loadScript(src, id) {
    return new Promise((resolve, reject) => {
        if (document.getElementById(id)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.id = id;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            resolve();
        };
        script.onerror = () => {
            reject(new Error(`Failed to load script: ${src}`));
        };
        document.head.appendChild(script);
    });
}

/**
 * Runs the invisible Cloudflare Turnstile challenge.
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Called with token on success
 * @param {Function} options.onError - Called with error on failure
 * @returns {Promise<string>} - The Turnstile token.
 */
export async function getTurnstileToken(options = {}) {
    const { onSuccess, onError } = options;

    return new Promise(async (resolve, reject) => {
        try {
            if (!turnstileScriptLoaded) {
                window.onloadTurnstileCallback = () => {
                    turnstileScriptLoaded = true;
                    renderTurnstile(resolve, reject, onSuccess, onError);
                };
                await _loadScript(TURNSTILE_SCRIPT_URL, 'turnstile-script');
            } else {
                renderTurnstile(resolve, reject, onSuccess, onError);
            }
        } catch (error) {
            if (onError) onError(error);
            reject(error);
        }
    });
}

function renderTurnstile(resolve, reject, onSuccess, onError) {
    if (!document.getElementById('turnstile-widget-container')) {
        const turnstileContainer = document.createElement('div');
        turnstileContainer.id = 'turnstile-widget-container';
        turnstileContainer.style.display = 'none';
        document.body.appendChild(turnstileContainer);
    }

    window.turnstile.render('#turnstile-widget-container', {
        sitekey: TURNSTILE_SITE_KEY,
        mode: 'invisible',
        callback: function(token) {
            if (onSuccess) onSuccess(token);
            resolve(token);
        },
        'error-callback': function() {
            const error = new Error('Cloudflare Turnstile challenge failed.');
            if (onError) onError(error);
            reject(error);
        },
    });
    // Since it's invisible, we need to explicitly execute it
    window.turnstile.execute();
}

/**
 * Runs the Google reCAPTCHA v2 challenge.
 * NOTE: Requires UI modal to be shown by caller (this is pure logic)
 * @param {string} containerId - DOM container ID where reCAPTCHA widget should render
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Called with token on success
 * @param {Function} options.onError - Called with error on failure
 * @returns {Promise<string>} - The reCAPTCHA token.
 */
export async function getRecaptchaToken(containerId, options = {}) {
    const { onSuccess, onError, onExpired } = options;

    return new Promise(async (resolve, reject) => {
        try {
            if (!recaptchaScriptLoaded) {
                window.onloadRecaptchaCallback = () => {
                    recaptchaScriptLoaded = true;
                    renderRecaptcha(containerId, resolve, reject, onSuccess, onError, onExpired);
                };
                await _loadScript(RECAPTCHA_SCRIPT_URL, 'recaptcha-script');
            } else {
                renderRecaptcha(containerId, resolve, reject, onSuccess, onError, onExpired);
            }
        } catch (error) {
            if (onError) onError(error);
            reject(error);
        }
    });
}

function renderRecaptcha(containerId, resolve, reject, onSuccess, onError, onExpired) {
    window.grecaptcha.render(containerId, {
        'sitekey': RECAPTCHA_SITE_KEY,
        'callback': (token) => {
            if (onSuccess) onSuccess(token);
            resolve(token);
        },
        'expired-callback': () => {
            const error = new Error('reCAPTCHA challenge expired.');
            if (onExpired) onExpired(error);
            if (onError) onError(error);
            reject(error);
        },
        'error-callback': () => {
            const error = new Error('reCAPTCHA challenge failed to load.');
            if (onError) onError(error);
            reject(error);
        }
    });
}

/**
 * Orchestrates the captcha flow: Turnstile first, then reCAPTCHA as a fallback.
 * NOTE: For reCAPTCHA, caller must handle modal UI
 * @param {Object} options - Configuration options
 * @param {Function} options.onRecaptchaNeeded - Called when reCAPTCHA modal should be shown
 * @param {string} options.recaptchaContainerId - Container ID for reCAPTCHA widget
 * @returns {Promise<{token: string, type: string}>} - The captcha token and type.
 */
export async function getCaptchaToken(options = {}) {
    const { onRecaptchaNeeded, recaptchaContainerId = 'recaptcha-widget-container' } = options;

    try {
        const turnstileToken = await getTurnstileToken();
        return { token: turnstileToken, type: 'turnstile' };
    } catch (turnstileError) {
        // Notify caller that reCAPTCHA UI is needed
        if (onRecaptchaNeeded) {
            onRecaptchaNeeded();
        }

        try {
            const recaptchaToken = await getRecaptchaToken(recaptchaContainerId, options);
            return { token: recaptchaToken, type: 'recaptcha' };
        } catch (recaptchaError) {
            throw new Error('Captcha verification failed.');
        }
    }
}

/**
 * Configuration getters
 */
export function getTurnstileSiteKey() {
    return TURNSTILE_SITE_KEY;
}

export function getRecaptchaSiteKey() {
    return RECAPTCHA_SITE_KEY;
}
