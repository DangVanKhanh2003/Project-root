/**
 * Main Entry Point (Single Mode / Static Pages)
 */

import './styles/index.css';

import {
    initHeaderScroll,
    initMobileMenu,
    initLangSelector,
    initDrawerLangSelector,
    initFirebaseAnalytics
} from './features/shared/init/common-init';

function init(): void {
    initHeaderScroll();
    initMobileMenu();
    initLangSelector();
    initDrawerLangSelector();
    initFirebaseAnalytics();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
