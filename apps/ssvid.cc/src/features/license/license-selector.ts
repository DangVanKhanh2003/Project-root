/**
 * License Selector — license button dropdown logic
 * Ported from: ytmp3.gg/src/script/features/license-selector.js
 */

import { logEvent } from '../../libs/firebase';

const LICENSE_KEY_STORAGE_KEY = 'ssvid:license_key';
const KOFI_MEMBERSHIP_URL = 'https://ko-fi.com/s/fa5c2b2a93';

let isDropdownOpen = false;

// ============================================================
// STORAGE HELPERS
// ============================================================

export function getSavedLicenseKey(): string | null {
    try {
        const key = localStorage.getItem(LICENSE_KEY_STORAGE_KEY);
        return typeof key === 'string' && key.trim() !== '' ? key : null;
    } catch {
        return null;
    }
}

export function saveLicenseKey(key: string): void {
    try {
        localStorage.setItem(LICENSE_KEY_STORAGE_KEY, key);
        console.log('✅ License key saved');
    } catch {
        // Silent fail
    }
}

export function resetLicenseKey(): void {
    try {
        localStorage.removeItem(LICENSE_KEY_STORAGE_KEY);
        console.log('🗑️ License key removed');
    } catch {
        // Silent fail
    }
}

// ============================================================
// DROPDOWN RENDERING
// ============================================================

function getMaskedKey(key: string): string {
    if (key.length > 8) {
        return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    }
    return '****';
}

const plusIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"></path></svg>`;

const resetIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3a9 9 0 0 0-9 9H1l4 4 4-4H6a7 7 0 1 1 2.05 4.95l-1.42 1.42A9 9 0 1 0 13 3z"></path></svg>`;

const kofiIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.17A3.001 3.001 0 0 0 12 4.76 3.001 3.001 0 0 0 6.17 6H4a2 2 0 0 0-2 2v3h1v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9h1V8a2 2 0 0 0-2-2zM15 4a1 1 0 1 1 0 2h-2V5a1 1 0 0 1 1-1h1zM9 4h1a1 1 0 0 1 1 1v1H9a1 1 0 1 1 0-2zm10 6h-6v10h6V10zm-8 10V10H5v10h6zm9-12v1H4V8h16z"></path></svg>`;

function renderDropdownItems(licenseDropdown: Element, savedKey: string | null): void {
    const isMobile = licenseDropdown.classList.contains('drawer-license-actions');
    const itemClass = isMobile ? 'license-dropdown-item drawer-sublink drawer-license-link' : 'license-dropdown-item';

    if (savedKey) {
        licenseDropdown.innerHTML = `
            <div class="${itemClass} license-item-key" role="menuitem">
                <span style="font-size:.8rem;color:#64748b;">${getMaskedKey(savedKey)}</span>
            </div>
            <a href="/license" class="${itemClass} license-item" data-license-action="add">
                <span class="license-dropdown-icon" aria-hidden="true">${plusIcon}</span>
                <span>Change license key</span>
            </a>
            <a href="https://ytmp3-supporter.ytmp3.gg/reset/" target="_blank" rel="noopener nofollow noreferrer" class="${itemClass} license-item" id="resetLicenseBtn" role="menuitem" data-license-action="reset">
                <span class="license-dropdown-icon" aria-hidden="true">${resetIcon}</span>
                <span>Reset license key</span>
            </a>
        `;
    } else {
        licenseDropdown.innerHTML = `
            <a href="/license" class="${itemClass}" data-license-action="add">
                <span class="license-dropdown-icon" aria-hidden="true">${plusIcon}</span>
                <span>Add License Key</span>
            </a>
            <a href="https://ytmp3-supporter.ytmp3.gg/reset/" target="_blank" rel="noopener nofollow noreferrer" class="${itemClass} license-item" id="resetLicenseBtn" role="menuitem" data-license-action="reset">
                <span class="license-dropdown-icon" aria-hidden="true">${resetIcon}</span>
                <span>Reset license key</span>
            </a>
            <a href="${KOFI_MEMBERSHIP_URL}" target="_blank" rel="noopener nofollow noreferrer" class="${itemClass} license-item" role="menuitem" data-license-action="get">
                <span class="license-dropdown-icon" aria-hidden="true">${kofiIcon}</span>
                <span>Join Membership</span>
            </a>
        `;
    }
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

    const savedKey = getSavedLicenseKey();

    licenseContainers.forEach((container) => {
        const licenseButton = container.querySelector('[data-license-trigger]') as HTMLElement;
        const licenseDropdown = container.querySelector('.license-dropdown') as HTMLElement | null;

        if (!licenseButton || !licenseDropdown) return;

        let isContainerDropdownOpen = false;

        // Let's render but not overwrite the HTML entirely if it exists, wait ezconv has predefined links
        // If we inject elements dynamically, render function is used.
        renderDropdownItems(licenseDropdown, savedKey);

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

                // Re-render all dropdowns
                document.querySelectorAll('.license-dropdown').forEach(d => {
                    renderDropdownItems(d, null);
                });

                window.open(href, '_blank');
                closeDropdown();
                try { logEvent('license_key_reset'); } catch { /* silent */ }
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
