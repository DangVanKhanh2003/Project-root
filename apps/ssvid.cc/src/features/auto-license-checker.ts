/**
 * Auto License Checker
 *
 * Validates a license key from URL parameter (?license=XXXXX),
 * displays an animated modal with loading → success/error states,
 * and saves the key on success.
 *
 * Dynamically imported from main.ts only when ?license= param exists.
 */

import { supporterService } from '../api';
import {
    saveLicenseKey,
    saveLicenseCache,
    removeLicenseCache,
    removeSavedLicenseKey,
    getDaysRemaining,
} from './license/license-token';
import { updateButtonLabels } from './license/license-selector';
import type { CheckKeyResponse } from '@downloader/core';

// ============================================================
// ICONS (inline SVG)
// ============================================================

const ICONS = {
    loading: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>',
    success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    headerLoading: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    headerSuccess: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    headerError: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
};

// ============================================================
// INJECT STYLES
// ============================================================

function injectStyles(): void {
    const styleId = 'ssvid-auto-license-checker-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .auto-license-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease, visibility 0.2s ease;
        }

        .auto-license-overlay.visible {
            opacity: 1;
            visibility: visible;
        }

        .auto-license-popup {
            background: var(--bg-card);
            border-radius: var(--radius-md);
            width: 90%;
            max-width: 420px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            transform: translateY(20px);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            color: var(--text-body);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            border: 1px solid var(--border-default);
        }

        .auto-license-overlay.visible .auto-license-popup {
            transform: translateY(0);
        }

        .auto-license-header {
            padding: 16px 20px;
            background: var(--bg-surface-soft);
            border-bottom: 1px solid var(--border-default);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .auto-license-header-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0;
            color: var(--text-heading);
            font-family: var(--font-display, system-ui, sans-serif);
        }

        .auto-license-header-status {
            font-size: 0.85rem;
            font-weight: 500;
            padding: 4px 10px;
            border-radius: 999px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .auto-license-header-status svg {
            flex-shrink: 0;
        }

        .alc-status-loading { background: #dbeafe; color: #1e40af; }
        .alc-status-success { background: #d1fae5; color: #065f46; }
        .alc-status-error { background: #fee2e2; color: #991b1b; }

        :root[data-theme="dark"] .alc-status-loading { background: rgba(30, 64, 175, 0.2); color: #93c5fd; }
        :root[data-theme="dark"] .alc-status-success { background: rgba(6, 95, 70, 0.2); color: #6ee7b7; }
        :root[data-theme="dark"] .alc-status-error { background: rgba(153, 27, 27, 0.2); color: #fca5a5; }

        .auto-license-body {
            padding: 24px 20px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .auto-license-icon-wrapper {
            width: 56px;
            height: 56px;
            margin: 0 auto 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .auto-license-icon-wrapper svg {
            width: 28px;
            height: 28px;
            color: white;
        }

        .auto-license-icon-wrapper.alc-loading {
            background: rgba(198, 93, 59, 0.1);
        }

        .auto-license-icon-wrapper.alc-loading svg {
            color: var(--brand);
            animation: alc-spin 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes alc-spin {
            0% { transform: rotate(0deg); opacity: 0.8; }
            50% { opacity: 1; transform: rotate(180deg) scale(1.1); }
            100% { transform: rotate(360deg); opacity: 0.8; }
        }

        .auto-license-icon-wrapper.alc-success {
            background: #10b981;
            animation: alc-scale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .auto-license-icon-wrapper.alc-error {
            background: var(--color-status-error, #e74c3c);
            animation: alc-shake 0.4s ease-in-out;
        }

        @keyframes alc-scale {
            0% { transform: scale(0); }
            100% { transform: scale(1); }
        }

        @keyframes alc-shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-5px); }
            40%, 80% { transform: translateX(5px); }
        }

        .auto-license-message-title {
            font-size: 1.15rem;
            font-weight: 700;
            margin-bottom: 8px;
            color: var(--text-heading);
        }

        .auto-license-message-text {
            font-size: 0.95rem;
            color: var(--text-secondary);
            margin-bottom: 20px;
            line-height: 1.5;
        }

        .auto-license-plan-badge {
            display: inline-block;
            margin-top: 12px;
            background: var(--bg-surface-soft);
            padding: 8px 14px;
            border-radius: var(--radius-small);
            font-weight: 600;
            color: var(--text-heading);
            font-size: 0.9rem;
        }

        .auto-license-close {
            display: none;
            width: 100%;
            padding: 10px;
            border: none;
            border-radius: var(--radius-small);
            background: var(--brand);
            color: white;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s;
            -webkit-tap-highlight-color: transparent;
        }

        .auto-license-close:hover {
            background: var(--brand-hover);
        }

        .auto-license-close:active {
            transform: scale(0.98);
        }

        .auto-license-close.visible {
            display: block;
        }
    `;
    document.head.appendChild(style);
}

// ============================================================
// VALIDATION
// ============================================================

function isLicenseInactive(res: CheckKeyResponse): boolean {
    if (!res.valid) return true;
    if (res.status && res.status !== 'active') return true;
    if (res.isExpired) return true;
    if (typeof res.daysRemaining === 'number' && res.daysRemaining < 0) return true;

    if (res.expiresAt) {
        const expiresDate = new Date(res.expiresAt);
        if (!Number.isNaN(expiresDate.getTime())) {
            const diffDays = (expiresDate.getTime() - Date.now()) / 86400000;
            if (diffDays < 0) return true;
        }
    }
    return false;
}

// ============================================================
// MAIN EXPORT
// ============================================================

export async function autoCheckLicense(licenseKey: string): Promise<void> {
    if (!licenseKey) return;

    injectStyles();

    // Build DOM
    const overlay = document.createElement('div');
    overlay.className = 'auto-license-overlay';

    const popup = document.createElement('div');
    popup.className = 'auto-license-popup';

    // Header
    const header = document.createElement('div');
    header.className = 'auto-license-header';

    const headerTitle = document.createElement('h3');
    headerTitle.className = 'auto-license-header-title';
    headerTitle.textContent = 'License Activation';

    const headerStatus = document.createElement('span');
    headerStatus.className = 'auto-license-header-status alc-status-loading';
    headerStatus.innerHTML = `${ICONS.headerLoading}<span>Processing</span>`;

    header.appendChild(headerTitle);
    header.appendChild(headerStatus);

    // Body
    const body = document.createElement('div');
    body.className = 'auto-license-body';

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'auto-license-icon-wrapper alc-loading';
    iconWrapper.innerHTML = ICONS.loading;

    const titleEl = document.createElement('div');
    titleEl.className = 'auto-license-message-title';
    titleEl.textContent = 'Checking License Key';

    const subtitleEl = document.createElement('div');
    subtitleEl.className = 'auto-license-message-text';
    subtitleEl.textContent = 'Please wait while we verify your key...';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'auto-license-close';
    closeBtn.textContent = 'Close';

    body.appendChild(iconWrapper);
    body.appendChild(titleEl);
    body.appendChild(subtitleEl);
    body.appendChild(closeBtn);

    popup.appendChild(header);
    popup.appendChild(body);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Show popup (force reflow for transition)
    void overlay.offsetWidth;
    overlay.classList.add('visible');

    const removePopup = (): void => {
        overlay.classList.remove('visible');
        setTimeout(() => {
            overlay.parentNode?.removeChild(overlay);
        }, 300);
    };

    closeBtn.addEventListener('click', () => {
        removePopup();
        updateButtonLabels();
    });

    try {
        const result = await supporterService.checkLicenseKey(licenseKey);

        if (!isLicenseInactive(result)) {
            // ---- SUCCESS ----
            saveLicenseKey(licenseKey);
            saveLicenseCache(result);

            headerStatus.className = 'auto-license-header-status alc-status-success';
            headerStatus.innerHTML = `${ICONS.headerSuccess}<span>Success</span>`;

            iconWrapper.className = 'auto-license-icon-wrapper alc-success';
            iconWrapper.innerHTML = ICONS.success;
            titleEl.textContent = 'Verification Successful';

            // Format plan display
            const planTypeStr = result.planType
                ? result.planType.charAt(0).toUpperCase() + result.planType.slice(1)
                : 'Supporter';

            let planInfo = `Plan: ${planTypeStr}`;

            if (result.planType !== 'lifetime' && result.expiresAt) {
                const days = getDaysRemaining({
                    planType: (result.planType as 'lifetime' | 'yearly' | 'monthly' | 'weekly') || 'lifetime',
                    status: result.status || 'active',
                    activatedAt: result.activatedAt || '',
                    expiresAt: result.expiresAt,
                    tierPurchased: result.tierPurchased ?? 0,
                    lastValidatedAt: Date.now(),
                });
                const dateString = new Date(result.expiresAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                });
                if (days !== null) {
                    planInfo += ` &bull; Expires: ${dateString} (${days} day${days !== 1 ? 's' : ''} left)`;
                }
            } else if (result.planType === 'lifetime') {
                planInfo += ' &bull; Lifetime';
            }

            subtitleEl.innerHTML = `Your key has been verified successfully.<br><div class="auto-license-plan-badge">${planInfo}</div>`;

            closeBtn.classList.add('visible');
            closeBtn.textContent = 'Continue';
        } else {
            // ---- FAILED ----
            removeLicenseCache();
            removeSavedLicenseKey();

            headerStatus.className = 'auto-license-header-status alc-status-error';
            headerStatus.innerHTML = `${ICONS.headerError}<span>Failed</span>`;

            iconWrapper.className = 'auto-license-icon-wrapper alc-error';
            iconWrapper.innerHTML = ICONS.error;
            titleEl.textContent = 'Verification Failed';

            let errorMsg = result.message || 'The provided license key is either invalid or inactive.';
            if (result.isExpired) {
                errorMsg = 'This license key has expired and is no longer valid for activation.';
            }
            subtitleEl.textContent = errorMsg;
            closeBtn.classList.add('visible');
        }
    } catch {
        // ---- NETWORK ERROR ----
        headerStatus.className = 'auto-license-header-status alc-status-error';
        headerStatus.innerHTML = `${ICONS.headerError}<span>Error</span>`;

        iconWrapper.className = 'auto-license-icon-wrapper alc-error';
        iconWrapper.innerHTML = ICONS.error;
        titleEl.textContent = 'Verification Error';
        subtitleEl.textContent = 'Something went wrong while verifying your key. Please try again later.';
        closeBtn.classList.add('visible');
    }
}
