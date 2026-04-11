import '../styles/index.css';

import { clearLicenseToken, getLicenseInfo, saveLicenseFromApi, computeDaysRemaining } from './license-token';
import { initDrawerLangSelector, initLangSelector, initMobileMenu, initSupporterUi } from './shared/init/common-init';
import { initThemeToggle } from './shared/init/theme-toggle';
import { supporterService } from '../api';

// ============================================================
// HELPERS
// ============================================================

function maskKey(value: string | null): string {
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

function formatPlanType(plan: string): string {
    const map: Record<string, string> = {
        lifetime: 'Lifetime',
        yearly: 'Yearly',
        monthly: 'Monthly',
        weekly: 'Weekly',
    };
    return map[plan.toLowerCase()] || plan;
}

function formatDaysRemaining(expiresAt: string | null): string {
    if (!expiresAt) return '∞ (Lifetime)';
    const days = computeDaysRemaining(expiresAt);
    if (days === null) return '∞';
    if (days <= 0) return 'Last day';
    return `${days} day${days !== 1 ? 's' : ''}`;
}

function formatActivationState(status: string, isExpired: boolean): { text: string; state: string } {
    if (isExpired || status === 'expired') {
        return { text: 'Expired', state: 'expired' };
    }
    if (status === 'active') {
        return { text: 'Active', state: 'active' };
    }
    return { text: 'Inactive', state: 'inactive' };
}

// ============================================================
// UI UPDATE
// ============================================================

function updateLicenseDisplay(): void {
    const currentKeyEl = document.getElementById('license-current-key');
    const clearButton = document.getElementById('license-clear-btn') as HTMLButtonElement | null;
    const stateEl = document.getElementById('license-activation-state');
    const planTypeEl = document.getElementById('license-plan-type');
    const daysRemainingEl = document.getElementById('license-days-remaining');
    const detailRows = Array.from(document.querySelectorAll('[data-license-detail]')) as HTMLElement[];

    const info = getLicenseInfo();
    const hasLicense = !!info;

    // Key display
    if (currentKeyEl) {
        currentKeyEl.textContent = maskKey(info?.key ?? null);
    }

    // Activation state
    if (stateEl) {
        if (info) {
            const { text, state } = formatActivationState(info.status, info.isExpired);
            stateEl.textContent = text;
            stateEl.setAttribute('data-state', state);
        } else {
            stateEl.textContent = 'Inactive';
            stateEl.setAttribute('data-state', 'inactive');
        }
    }

    // Clear button
    clearButton?.toggleAttribute('hidden', !hasLicense);

    // Plan + Days remaining rows
    detailRows.forEach((row) => {
        row.hidden = !hasLicense;
    });
    if (planTypeEl && info) {
        planTypeEl.textContent = formatPlanType(info.planType);
    }
    if (daysRemainingEl && info) {
        daysRemainingEl.textContent = formatDaysRemaining(info.expiresAt);
    }
}

// ============================================================
// API CALLS
// ============================================================

async function activateKey(key: string): Promise<{ valid: boolean; message: string }> {
    const result = await supporterService.checkLicenseKey(key);

    if (result.valid) {
        saveLicenseFromApi(key, result);
    }

    return {
        valid: result.valid,
        message: result.message || (result.valid ? 'License activated successfully.' : 'Invalid license key.'),
    };
}

// ============================================================
// INIT
// ============================================================

async function initLicensePage(): Promise<void> {
    initThemeToggle();
    initMobileMenu();
    initLangSelector();
    initDrawerLangSelector();
    initSupporterUi();

    const form = document.getElementById('license-form') as HTMLFormElement | null;
    const input = document.getElementById('license-key-input') as HTMLInputElement | null;
    const clearButton = document.getElementById('license-clear-btn') as HTMLButtonElement | null;

    if (!form || !input) return;

    // --- Initial display ---
    updateLicenseDisplay();

    // --- Form submit ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const key = input.value.trim();
        if (!key) {
            setStatus('Please enter your license key.', 'error');
            return;
        }

        setStatus('Checking your license key...', 'loading');

        try {
            const result = await activateKey(key);
            if (!result.valid) {
                setStatus(result.message, 'error');
                return;
            }

            updateLicenseDisplay();
            setStatus(result.message, 'success');
            input.value = '';
            initSupporterUi();
        } catch {
            setStatus('Network error while checking your license key.', 'error');
        }
    });

    // --- Clear button ---
    clearButton?.addEventListener('click', () => {
        clearLicenseToken();
        updateLicenseDisplay();
        setStatus('Stored license key removed.', 'idle');
        initSupporterUi();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void initLicensePage());
} else {
    void initLicensePage();
}
