/**
 * Common Init
 * Shared initialization functions used across all page entry points.
 */

import { refreshWidgetState } from '../../widget-level-manager';
import { migrateOldKey, removeLegacyKey, saveLicenseFromApi, isCacheStale, getStoredRawKey, clearLicenseToken } from '../../license-token';
import { supporterService } from '../../../api';

let supporterUiBound = false;
let licenseRefreshDone = false;

// ==========================================
// License Auto-Migration & Background Refresh
// ==========================================

/**
 * Handles:
 *   1. Seamless migration from old key format (ezconv:license_key)
 *   2. Background async refresh when cache is stale (>24h)
 *
 * Both are non-blocking — hasValidLicense() always uses cache.
 * Runs once per page load.
 */
async function initLicenseRefresh(): Promise<void> {
    if (licenseRefreshDone) return;
    licenseRefreshDone = true;

    // 1. Migrate old key format
    const oldKey = migrateOldKey();
    if (oldKey) {
        try {
            const result = await supporterService.checkLicenseKey(oldKey);
            if (result.valid) {
                saveLicenseFromApi(oldKey, result);
                removeLegacyKey();
            } else {
                removeLegacyKey();
            }
        } catch {
            // Network error — leave old key for next attempt
        }
        void refreshWidgetState();
        return;
    }

    // 2. Background refresh if cache is stale (non-blocking, fire-and-forget)
    if (isCacheStale()) {
        const key = getStoredRawKey();
        if (key) {
            supporterService.checkLicenseKey(key)
                .then((result) => {
                    if (result.valid) {
                        saveLicenseFromApi(key, result);
                    } else {
                        clearLicenseToken();
                    }
                    void refreshWidgetState();
                })
                .catch(() => {
                    // Network error — cache still valid, will retry next load
                });
        }
    }
}

// ==========================================
// Mobile Menu
// ==========================================

export function initMobileMenu(): void {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeDrawerBtn = document.getElementById('close-drawer-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');

    if (!mobileMenuBtn || !mobileDrawer) return;

    mobileDrawer.removeAttribute('hidden');

    const openDrawer = () => {
        mobileDrawer.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
        mobileDrawer.classList.remove('open');
        document.body.style.overflow = '';
    };

    mobileMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openDrawer();
    });

    closeDrawerBtn?.addEventListener('click', closeDrawer);

    mobileDrawer.addEventListener('click', (e) => {
        if (e.target === mobileDrawer) closeDrawer();
    });

    // Close on drawer link clicks
    document.querySelectorAll('.drawer-link, .drawer-sublink').forEach(link => {
        link.addEventListener('click', closeDrawer);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileDrawer.classList.contains('open')) closeDrawer();
    });
}

// ==========================================
// Language Selectors
// ==========================================

export function initLangSelector(): void {
    const langSelector = document.querySelector('.lang-selector');
    const langButton = document.querySelector('.lang-button');

    if (!langSelector || !langButton) return;

    langButton.addEventListener('click', (e) => {
        e.stopPropagation();
        langSelector.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!langSelector.contains(e.target as Node)) {
            langSelector.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') langSelector.classList.remove('active');
    });
}

export function initDrawerLangSelector(): void {
    const drawerLangSelector = document.querySelector('.drawer-lang-selector');
    const drawerLangButton = document.querySelector('.drawer-lang-button');

    if (!drawerLangSelector || !drawerLangButton) return;

    drawerLangButton.addEventListener('click', (e) => {
        e.stopPropagation();
        drawerLangSelector.classList.toggle('active');
    });

    const mobileDrawer = document.getElementById('mobile-drawer');
    if (mobileDrawer) {
        mobileDrawer.addEventListener('click', (e) => {
            if (!drawerLangSelector.contains(e.target as Node)) {
                drawerLangSelector.classList.remove('active');
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') drawerLangSelector.classList.remove('active');
    });
}

// ==========================================
// Header Scroll Effect
// ==========================================

export function initHeaderScroll(): void {
    const header = document.getElementById('main-header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 10);
    });
}

// ==========================================
// Firebase Analytics (lazy, after 5s)
// ==========================================

export function initFirebaseAnalytics(): void {
    setTimeout(() => {
        import('../../../libs/firebase/firebase-loader')
            .then(({ loadFirebaseWhenIdle }) => loadFirebaseWhenIdle())
            .catch(() => { });
    }, 5000);
}

// ==========================================
// Feedback Widget (lazy, after 5s)
// ==========================================

export function initFeedbackWidget(): void {
    setTimeout(() => {
        import('../../feedback/feedback-widget')
            .then(({ initFeedbackWidget: init }) => init())
            .catch(() => { });
    }, 5000);
}

export function initSupporterUi(): void {
    const licenseMenus = Array.from(document.querySelectorAll('.license-menu, .drawer-license-menu')) as HTMLElement[];

    if (!supporterUiBound) {
        supporterUiBound = true;
        const licenseTriggers = Array.from(document.querySelectorAll('[data-license-trigger]')) as HTMLElement[];
        const closeMenus = () => {
            const menus = Array.from(document.querySelectorAll('.license-menu, .drawer-license-menu')) as HTMLElement[];
            menus.forEach((menu) => {
                menu.classList.remove('active');
                const trigger = menu.querySelector('[data-license-trigger]') as HTMLElement | null;
                trigger?.setAttribute('aria-expanded', 'false');
            });
        };

        licenseTriggers.forEach((trigger) => {
            trigger.addEventListener('click', (event) => {
                event.stopPropagation();
                const menu = trigger.closest('.license-menu, .drawer-license-menu') as HTMLElement | null;
                if (!menu) return;

                const isActive = menu.classList.contains('active');
                closeMenus();
                if (!isActive) {
                    menu.classList.add('active');
                    trigger.setAttribute('aria-expanded', 'true');
                }
            });
        });

        document.addEventListener('click', (event) => {
            const target = event.target as Node | null;
            if (!target) return;

            const menus = Array.from(document.querySelectorAll('.license-menu, .drawer-license-menu')) as HTMLElement[];
            const clickedInsideMenu = menus.some((menu) => menu.contains(target));
            if (!clickedInsideMenu) {
                closeMenus();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeMenus();
            }
        });
    }

    licenseMenus.forEach((menu) => {
        menu.classList.remove('active');
    });

    void refreshWidgetState();

    // Trigger license migration & TTL refresh in background
    void initLicenseRefresh();
}
