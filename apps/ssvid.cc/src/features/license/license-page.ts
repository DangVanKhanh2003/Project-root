/**
 * License Page Logic — form input + API validation
 * Ported from: ytmp3.gg/src/script/features/license-page.js (simplified, no i18n)
 */

import { supporterService } from '../../api';
import { saveLicenseKey, getSavedLicenseKey } from './license-selector';

const LICENSE_KEY_STORAGE_KEY = 'ssvid:license_key';

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

function setStatusTag(status: 'active' | 'inactive' | ''): void {
    const statusTag = document.getElementById('license-status-tag');
    if (!statusTag) return;
    statusTag.classList.remove('active', 'inactive');
    if (status === 'active') {
        statusTag.textContent = 'Active';
        statusTag.classList.add('active');
    } else if (status === 'inactive') {
        statusTag.textContent = 'Inactive';
        statusTag.classList.add('inactive');
    } else {
        statusTag.textContent = '';
    }
}

// ============================================================
// CORE LOGIC
// ============================================================

async function checkLicenseKey(licenseKey: string): Promise<{ valid: boolean; message: string; status?: string }> {
    try {
        // checkLicenseKey returns CheckKeyResponse: { valid: boolean, message?: string }
        const response = await supporterService.checkLicenseKey(licenseKey);

        if (response?.valid) {
            return {
                valid: true,
                message: response.message || 'active',
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

async function initActivationForm(): Promise<void> {
    const input = document.getElementById('licenseKeyInputPage') as HTMLInputElement | null;
    const submitBtn = document.getElementById('license-submit') as HTMLButtonElement | null;
    const messageEl = document.getElementById('license-page-message');

    if (!input || !submitBtn || !messageEl) return;

    let hasSavedKey = false;

    // Check existing saved key on load
    const savedKey = getSavedLicenseKey();
    if (savedKey) {
        setMessage('Verifying license key...', 'loading');
        const result = await checkLicenseKey(savedKey);
        if (result.valid) {
            hasSavedKey = true;
            setStatusTag('active');
            clearMessage();
        } else {
            hasSavedKey = false;
            setStatusTag('inactive');
            setMessage(`Invalid license key: ${result.message}`, 'error');
        }
    } else {
        setStatusTag('inactive');
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

        if (result.valid) {
            saveLicenseKey(licenseKey);
            hasSavedKey = true;
            setStatusTag('active');
            setMessage(`License verified: ${result.message}`, 'success');
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
    initActivationForm();
}

// Auto-init if used as standalone script entry
initLicensePage();
