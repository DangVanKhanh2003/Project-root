import '../styles/index.css';

import { clearStoredLicenseKey, getStoredLicenseKey, saveLicenseKey } from './license-selector';
import { initDrawerLangSelector, initLangSelector, initMobileMenu, initSupporterUi } from './shared/init/common-init';
import { initThemeToggle } from './shared/init/theme-toggle';

const CHECK_KEY_ENDPOINT = 'https://ytmp3-supporter.ytmp3.gg/api/check-key';

interface CheckKeyResponse {
    success?: boolean;
    valid?: boolean;
    message?: string;
    data?: {
        valid?: boolean;
        key?: string;
    };
}

function maskStoredKey(value: string | null): string {
    if (!value) return 'Not activated';
    if (value.length <= 7) return '*'.repeat(value.length);
    return `${value.slice(0, -7)}*******`;
}

function setStatus(message: string, type: 'idle' | 'success' | 'error' | 'loading'): void {
    const statusEl = document.getElementById('license-status');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.setAttribute('data-state', type);
}

function setCurrentKey(value: string | null): void {
    const currentKeyEl = document.getElementById('license-current-key');
    const clearButton = document.getElementById('license-clear-btn') as HTMLButtonElement | null;
    const stateEl = document.getElementById('license-activation-state');

    if (!currentKeyEl) return;

    currentKeyEl.textContent = maskStoredKey(value);
    if (stateEl) {
        stateEl.textContent = value ? 'Active' : 'Inactive';
        stateEl.setAttribute('data-state', value ? 'active' : 'inactive');
    }
    clearButton?.toggleAttribute('hidden', !value);
}

async function verifyLicenseKey(key: string): Promise<{ valid: boolean; message: string }> {
    const response = await fetch(CHECK_KEY_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key })
    });

    const payload = await response.json() as CheckKeyResponse;
    const isValid = Boolean(payload?.success || payload?.valid || payload?.data?.valid);

    if (!response.ok) {
        return {
            valid: false,
            message: payload?.message || 'Could not verify license key.'
        };
    }

    return {
        valid: isValid,
        message: payload?.message || (isValid ? 'License activated successfully.' : 'Invalid license key.')
    };
}

function initLicensePage(): void {
    initThemeToggle();
    initMobileMenu();
    initLangSelector();
    initDrawerLangSelector();
    initSupporterUi();

    const form = document.getElementById('license-form') as HTMLFormElement | null;
    const input = document.getElementById('license-key-input') as HTMLInputElement | null;
    const clearButton = document.getElementById('license-clear-btn') as HTMLButtonElement | null;

    if (!form || !input) return;

    setCurrentKey(getStoredLicenseKey());

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const key = input.value.trim();
        if (!key) {
            setStatus('Please enter your license key.', 'error');
            return;
        }

        setStatus('Checking your license key...', 'loading');

        try {
            const result = await verifyLicenseKey(key);
            if (!result.valid) {
                setStatus(result.message, 'error');
                return;
            }

            saveLicenseKey(key);
            setCurrentKey(key);
            setStatus(result.message, 'success');
            input.value = '';
            initSupporterUi();
        } catch {
            setStatus('Network error while checking your license key.', 'error');
        }
    });

    clearButton?.addEventListener('click', () => {
        clearStoredLicenseKey();
        setCurrentKey(null);
        setStatus('Stored license key removed.', 'idle');
        initSupporterUi();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLicensePage);
} else {
    initLicensePage();
}
