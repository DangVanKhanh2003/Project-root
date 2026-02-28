/**
 * Common Init
 * Shared initialization functions used across all page entry points.
 */

import { refreshWidgetState } from '../../widget-level-manager';

let supporterUiBound = false;

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
            .catch(() => {});
    }, 5000);
}

// ==========================================
// Feedback Widget (lazy, after 5s)
// ==========================================

export function initFeedbackWidget(): void {
    setTimeout(() => {
        import('../../feedback/feedback-widget')
            .then(({ initFeedbackWidget: init }) => init())
            .catch(() => {});
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
}
