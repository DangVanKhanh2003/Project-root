/**
 * License Page Logic — form input + API validation + plan info display
 * Uses cached license system — reads cache on load instead of calling API every time.
 */

import { supporterService } from '../../api';
import {
    saveLicenseKey,
    getSavedLicenseKey,
    saveLicenseCache,
    getLicenseCache,
    isPlanActive,
    getDaysRemaining,
    formatPlanDisplay,
    initLicenseOnPageLoad,
} from './license-token';

// ============================================================
// UI HELPERS
// ============================================================

type MessageType = 'success' | 'error' | 'loading';

function setMessage(message: string, type: MessageType): void {
    const messageEl = document.getElementById('license-page-message');
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.className = `license-message ${type} show`;
}

function clearMessage(): void {
    const messageEl = document.getElementById('license-page-message');
    if (!messageEl) return;
    messageEl.textContent = '';
    messageEl.className = 'license-message';
}

function setStatusTag(status: 'active' | 'expired' | 'inactive' | ''): void {
    const statusTag = document.getElementById('license-status-tag');
    if (!statusTag) return;
    statusTag.classList.remove('active', 'inactive', 'expired');
    if (status === 'active') {
        statusTag.textContent = 'Active';
        statusTag.classList.add('active');
    } else if (status === 'expired') {
        statusTag.textContent = 'Expired';
        statusTag.classList.add('expired');
    } else if (status === 'inactive') {
        statusTag.textContent = 'Inactive';
        statusTag.classList.add('inactive');
    } else {
        statusTag.textContent = '';
    }
}

/**
 * Show/hide plan info panel with plan details.
 */
function showPlanInfo(planType: string, daysRemaining: number | null, userName?: string): void {
    const panel = document.getElementById('license-plan-info');
    if (!panel) return;

    const planLabel = planType.charAt(0).toUpperCase() + planType.slice(1);

    let daysText = '';
    if (daysRemaining === null) {
        daysText = 'Never expires';
    } else if (daysRemaining <= 0) {
        daysText = 'Expired';
    } else {
        daysText = `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining`;
    }

    panel.innerHTML = `
        <div class="plan-info-row">
            <span class="plan-info-label">Plan</span>
            <span class="plan-info-value">${planLabel}</span>
        </div>
        <div class="plan-info-row">
            <span class="plan-info-label">Status</span>
            <span class="plan-info-value">${daysText}</span>
        </div>
        ${userName ? `
        <div class="plan-info-row">
            <span class="plan-info-label">Name</span>
            <span class="plan-info-value">${userName}</span>
        </div>` : ''}
    `;
    panel.style.display = '';
}

function hidePlanInfo(): void {
    const panel = document.getElementById('license-plan-info');
    if (!panel) return;
    panel.innerHTML = '';
    panel.style.display = 'none';
}

// ============================================================
// CORE LOGIC
// ============================================================

async function checkLicenseKey(licenseKey: string): Promise<{
    valid: boolean;
    message: string;
    response?: import('@downloader/core').CheckKeyResponse;
}> {
    try {
        const response = await supporterService.checkLicenseKey(licenseKey);

        if (response?.valid) {
            return {
                valid: true,
                message: response.message || 'active',
                response,
            };
        }

        return {
            valid: false,
            message: response?.message || 'Invalid license key',
        };
    } catch (error) {
        console.error('[LicensePage] Error checking license key:', error);
        return {
            valid: false,
            message: 'Failed to verify license key. Please try again.',
        };
    }
}

function initLicenseImageSkeletons(): void {
    const images = document.querySelectorAll<HTMLImageElement>('.license-email-image');
    if (images.length === 0) return;

    const markLoaded = (img: HTMLImageElement): void => {
        img.classList.remove('is-loading', 'is-error');
        img.classList.add('is-loaded');
    };

    const markError = (img: HTMLImageElement): void => {
        img.classList.remove('is-loading', 'is-loaded');
        img.classList.add('is-error');
    };

    images.forEach((img) => {
        if (img.complete && img.naturalWidth > 0) {
            markLoaded(img);
            return;
        }

        if (img.complete) {
            markError(img);
            return;
        }

        img.classList.add('is-loading');
        img.addEventListener('load', () => markLoaded(img), { once: true });
        img.addEventListener('error', () => markError(img), { once: true });
    });
}

// ============================================================
// INITIALIZATION
// ============================================================

async function initActivationForm(): Promise<void> {
    const input = document.getElementById('licenseKeyInputPage') as HTMLInputElement | null;
    const submitBtn = document.getElementById('license-submit') as HTMLButtonElement | null;
    const messageEl = document.getElementById('license-page-message');

    if (!input || !submitBtn || !messageEl) return;

    let hasSavedKey = false;

    // Check existing cached license on load (NO API call if cache is valid)
    const cache = getLicenseCache();
    if (cache) {
        if (isPlanActive(cache)) {
            hasSavedKey = true;
            setStatusTag('active');
            showPlanInfo(cache.planType, getDaysRemaining(cache), cache.userName);
            clearMessage();
        } else {
            // Plan expired
            hasSavedKey = false;
            setStatusTag('expired');
            showPlanInfo(cache.planType, getDaysRemaining(cache), cache.userName);
            setMessage('Your license plan has expired.', 'error');
        }
        // Fire background revalidation if needed (non-blocking)
        initLicenseOnPageLoad();
    } else {
        // No cache — check if there's a saved key we can try to validate
        const savedKey = getSavedLicenseKey();
        if (savedKey) {
            setMessage('Verifying license key...', 'loading');
            const result = await checkLicenseKey(savedKey);
            if (result.valid && result.response) {
                hasSavedKey = true;
                saveLicenseCache(result.response);
                setStatusTag('active');
                const newCache = getLicenseCache();
                if (newCache) {
                    showPlanInfo(newCache.planType, getDaysRemaining(newCache), newCache.userName);
                }
                clearMessage();
            } else {
                hasSavedKey = false;
                setStatusTag('inactive');
                hidePlanInfo();
                setMessage(`Invalid license key: ${result.message}`, 'error');
            }
        } else {
            setStatusTag('inactive');
            hidePlanInfo();
        }
    }

    // Submit logic
    const submitLicense = async () => {
        const licenseKey = input.value.trim();

        if (!licenseKey) {
            setMessage('Please enter a license key.', 'error');
            return;
        }

        const defaultLabel = submitBtn.getAttribute('data-default-label') || submitBtn.textContent || 'Activate';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Checking...';
        setMessage('Verifying license key...', 'loading');

        const result = await checkLicenseKey(licenseKey);

        submitBtn.disabled = false;
        submitBtn.textContent = defaultLabel;

        if (result.valid && result.response) {
            // Save key + cache
            saveLicenseKey(licenseKey);
            saveLicenseCache(result.response);
            hasSavedKey = true;

            setStatusTag('active');
            const newCache = getLicenseCache();
            if (newCache) {
                showPlanInfo(newCache.planType, getDaysRemaining(newCache), newCache.userName);
            }
            setMessage(`License verified: ${formatPlanDisplay(newCache!)}`, 'success');
        } else {
            if (!hasSavedKey) setStatusTag('inactive');
            setMessage(`Invalid license key: ${result.message}`, 'error');
        }
    };

    // Cache default label for reset after loading state
    submitBtn.setAttribute('data-default-label', submitBtn.textContent || 'Activate');

    submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clearMessage();
        submitLicense();
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearMessage();
            submitLicense();
        }
    });
}

// ============================================================
// ENTRY POINT
// ============================================================

export function initLicensePage(): void {
    initLicenseImageSkeletons();
    initActivationForm();
}

// Auto-init if used as standalone script entry
initLicensePage();
