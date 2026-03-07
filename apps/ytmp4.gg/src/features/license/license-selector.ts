/**
 * License Selector — license button dropdown logic
 * Shows plan status in dropdown header when license is active.
 * Updates button label to show days remaining or "Lifetime".
 */

import { logEvent } from '../../libs/firebase';
import { show as showPaywall } from 'https://media.ytmp3.gg/poppurchase.v3.js?v=1';
import {
    getSavedLicenseKey,
    saveLicenseKey,
    removeSavedLicenseKey,
    removeLicenseCache,
    getLicenseCache,
    isPlanActive,
    formatPlanDisplay,
    getDaysRemaining,
    type CachedLicense,
} from './license-token';

// Re-export for backward compatibility (license-page.ts imports these)
export { getSavedLicenseKey, saveLicenseKey };

// ============================================================
// STORAGE HELPERS
// ============================================================

export function resetLicenseKey(): void {
    try {
        removeSavedLicenseKey();
        removeLicenseCache();
        console.log('🗑️ License key + cache removed');
    } catch {
        // Silent fail
    }
}

// ============================================================
// BUTTON LABEL HELPERS
// ============================================================

/**
 * Short label for the header button.
 * e.g. "Lifetime", "364 days", "12 days"
 */
function getButtonLabel(cache: CachedLicense): string {
    if (cache.planType === 'lifetime') return 'Lifetime';

    const days = getDaysRemaining(cache);
    if (days === null) return 'License';
    if (!isPlanActive(cache)) return 'Expired';
    if (days === 0) return 'Last day';
    if (days === 1) return '1 day';
    return `${days} days`;
}

// ============================================================
// DROPDOWN RENDERING
// ============================================================

const plusIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"></path></svg>`;

const resetIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3a9 9 0 0 0-9 9H1l4 4 4-4H6a7 7 0 1 1 2.05 4.95l-1.42 1.42A9 9 0 1 0 13 3z"></path></svg>`;

const kofiIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 32 32" version="1.1"><title>gift</title><path d="M28 8.75h-0.211c0.548-0.833 0.874-1.854 0.874-2.952 0-0.448-0.054-0.884-0.157-1.3l0.008 0.037c-0.487-1.895-2.008-3.337-3.912-3.702l-0.031-0.005c-0.234-0.035-0.505-0.055-0.78-0.055-2.043 0-3.829 1.096-4.804 2.732l-0.014 0.026-2.973 4.279-2.974-4.279c-0.989-1.662-2.776-2.758-4.818-2.758-0.275 0-0.545 0.020-0.81 0.058l0.030-0.004c-1.935 0.37-3.455 1.812-3.934 3.672l-0.008 0.035c-0.095 0.379-0.149 0.815-0.149 1.263 0 1.097 0.326 2.119 0.886 2.972l-0.013-0.021h-0.212c-1.794 0.002-3.248 1.456-3.25 3.25v3c0.002 1.343 0.817 2.495 1.979 2.99l0.021 0.008v10.002c0.002 1.794 1.456 3.248 3.25 3.25h20c1.794-0.001 3.249-1.456 3.25-3.25v-10.002c1.183-0.503 1.998-1.656 2-2.998v-3c-0.002-1.794-1.456-3.248-3.25-3.25h-0zM28.75 12v3c-0.006 0.412-0.338 0.744-0.749 0.75h-10.751v-4.5h10.75c0.412 0.006 0.744 0.338 0.75 0.749v0.001zM21.027 4.957c0.544-1.009 1.593-1.683 2.8-1.683 0.104 0 0.207 0.005 0.309 0.015l-0.013-0.001c0.963 0.195 1.718 0.915 1.963 1.842l0.004 0.018c0.021 0.149 0.033 0.322 0.033 0.497 0 1.28-0.635 2.412-1.608 3.097l-0.012 0.008h-6.112zM5.911 5.147c0.248-0.944 1.002-1.664 1.949-1.857l0.016-0.003c0.092-0.010 0.199-0.015 0.307-0.015 1.204 0 2.251 0.675 2.783 1.667l0.008 0.017 2.636 3.793h-6.113c-0.984-0.692-1.619-1.823-1.619-3.101 0-0.177 0.012-0.351 0.036-0.521l-0.002 0.020zM3.25 12c0.006-0.412 0.338-0.744 0.749-0.75h10.751v4.5h-10.75c-0.412-0.006-0.744-0.338-0.75-0.749v-0.001zM5.25 28v-9.75h9.5v10.5h-8.75c-0.412-0.006-0.744-0.338-0.75-0.749v-0.001zM26.75 28c-0.006 0.412-0.338 0.744-0.749 0.75h-8.751v-10.5h9.5z"/></svg>`;

const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>`;

function renderDropdownItems(licenseDropdown: Element): void {
    const isMobile = licenseDropdown.classList.contains('drawer-license-actions');
    const itemClass = isMobile ? 'license-dropdown-item drawer-sublink drawer-license-link' : 'license-dropdown-item';

    // Check if we have an active license to show status header
    const cache = getLicenseCache();
    const isActive = cache && isPlanActive(cache);

    const statusHeader = isActive
        ? `<div class="license-dropdown-status">
               <span class="license-status-dot"></span>
               <span class="license-dropdown-status-text">${formatPlanDisplay(cache)}</span>
           </div>`
        : '';

    licenseDropdown.innerHTML = `
        ${statusHeader}
        <a href="/license" class="${itemClass} license-item" data-license-action="add">
            <span class="license-dropdown-icon" aria-hidden="true">${isActive ? checkIcon : plusIcon}</span>
            <span>${isActive ? 'Manage License' : 'Add License Key'}</span>
        </a>
        <a href="https://ytmp3-supporter.ytmp3.gg/reset/" target="_blank" rel="noopener nofollow noreferrer" class="${itemClass} license-item" id="resetLicenseBtn" role="menuitem" data-license-action="reset">
            <span class="license-dropdown-icon" aria-hidden="true">${resetIcon}</span>
            <span>Reset license key</span>
        </a>
        <a href="#" class="${itemClass} license-item" role="menuitem" data-license-action="upgrade">
            <span class="license-dropdown-icon" aria-hidden="true">${kofiIcon}</span>
            <span>Join Membership</span>
        </a>
    `;
}

/**
 * Update all license button labels based on current cache.
 */
function updateButtonLabels(): void {
    const cache = getLicenseCache();
    const isActive = cache && isPlanActive(cache);

    const buttons = document.querySelectorAll('[data-license-trigger]');
    buttons.forEach((btn) => {
        // Find the text span (second child span, not the icon span)
        const spans = btn.querySelectorAll('span:not(.license-icon)');
        const textSpan = spans.length > 0 ? spans[spans.length - 1] : null;
        if (!textSpan) return;

        if (isActive) {
            textSpan.textContent = getButtonLabel(cache);
            btn.classList.add('license-active');
        } else {
            const defaultLabel = btn.getAttribute('data-license-default-label') || 'License';
            textSpan.textContent = defaultLabel;
            btn.classList.remove('license-active');
        }
    });
}

// ============================================================
// PUBLIC INIT
// ============================================================

/**
 * Initialize license selector. Call once on page load.
 */
export function initLicenseSelector(): void {
    const licenseContainers = document.querySelectorAll('[data-license-button]');
    if (licenseContainers.length === 0) return;

    // Update button text to show plan info
    updateButtonLabels();

    licenseContainers.forEach((container) => {
        const licenseButton = container.querySelector('[data-license-trigger]') as HTMLElement;
        const licenseDropdown = container.querySelector('.license-dropdown') as HTMLElement | null;

        if (!licenseButton || !licenseDropdown) return;

        let isContainerDropdownOpen = false;

        renderDropdownItems(licenseDropdown);

        const toggleDropdown = () => {
            isContainerDropdownOpen = !isContainerDropdownOpen;

            if (isContainerDropdownOpen) {
                // Close others
                document.querySelectorAll('.license-dropdown.open').forEach(d => {
                    if (d !== licenseDropdown) d.classList.remove('open');
                });
            }

            licenseDropdown.classList.toggle('open', isContainerDropdownOpen);
            licenseButton.setAttribute('aria-expanded', String(isContainerDropdownOpen));
        };

        const closeDropdown = () => {
            isContainerDropdownOpen = false;
            licenseDropdown.classList.remove('open');
            licenseButton.setAttribute('aria-expanded', 'false');
        };

        // Toggle on button click
        licenseButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown();
            try { logEvent('license_button_click'); } catch { /* silent */ }
        });

        // Delegate dropdown item clicks
        licenseDropdown.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            const addBtn = target.closest('#addLicenseBtn') || target.closest('[data-license-action="add"]');
            if (addBtn) {
                e.preventDefault();
                e.stopPropagation();

                const href = (addBtn as HTMLAnchorElement).href || '/license';
                window.open(href, '_blank');
                closeDropdown();
                return;
            }

            const resetBtn = target.closest('#resetLicenseBtn') || target.closest('[data-license-action="reset"]');
            if (resetBtn) {
                e.preventDefault();
                e.stopPropagation();

                const href = (resetBtn as HTMLAnchorElement).href || 'https://ytmp3-supporter.ytmp3.gg/reset/';
                resetLicenseKey();

                // Re-render all dropdowns + reset button labels
                document.querySelectorAll('.license-dropdown').forEach(d => {
                    renderDropdownItems(d);
                });
                updateButtonLabels();

                window.open(href, '_blank');
                closeDropdown();
                try { logEvent('license_key_reset'); } catch { /* silent */ }
            }

            const upgradeBtn = target.closest('[data-license-action="upgrade"]');
            if (upgradeBtn) {
                e.preventDefault();
                e.stopPropagation();
                closeDropdown();
                showPaywall('none_title');
                try { logEvent('join_membership_click'); } catch { /* silent */ }
            }
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!licenseButton.contains(e.target as Node) && !licenseDropdown.contains(e.target as Node)) {
                closeDropdown();
            }
        });
    });

    console.log('✅ License selectors initialized');
}
