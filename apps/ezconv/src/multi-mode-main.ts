/**
 * Multi-Mode Downloader Entry Point
 * Entry point for the unified download page combining single, trim, multi, and playlist modes.
 */

import './styles/index.css';

import { multipleDownloadRenderer } from './features/downloader/ui-render/multiple-download/multiple-download-renderer';
import { initAudioDropdown } from './features/downloader/ui-render/dropdown-logic';
import { initMobileMenu, initLangSelector, initDrawerLangSelector, initFirebaseAnalytics, initFeedbackWidget, initSupporterUi } from './features/shared/init/common-init';
import { getCurrentSettings, initFormatToggle } from './features/shared/form/format-settings';
import { initAdvancedSettings } from './features/multi-mode-downloader/advanced-settings-controller';
import { initConvertForm } from './features/multi-mode-downloader/convert-submit-controller';
import { initTrimController, getTrimStart, getTrimEnd } from './features/multi-mode-downloader/trim-controller';
import { initSearchSuggestController } from './features/multi-mode-downloader/search-suggest-controller';
import { initThemeToggle } from './features/shared/init/theme-toggle';
import { initWaveAnimation } from './features/shared/init/wave-animation';

function init(): void {
    // Auto-activate license from URL param (?license=XXXXX)
    const urlParams = new URLSearchParams(window.location.search);
    const autoLicenseKey = urlParams.get('license');

    if (autoLicenseKey) {
        const url = new URL(window.location.href);
        url.searchParams.delete('license');
        window.history.replaceState({}, '', url.toString());

        import('./features/auto-license-checker').then(({ autoCheckLicense }) => {
            autoCheckLicense(autoLicenseKey);
        });
    }

    initThemeToggle();
    initWaveAnimation();
    initMobileMenu();
    initSupporterUi();
    initLangSelector();
    initDrawerLangSelector();
    initFormatToggle();
    initAudioDropdown({
        dropdownId: 'multi-audio-track-dropdown',
        hiddenInputId: 'multi-audio-track-value',
    });

    multipleDownloadRenderer.useBatchStrategy();
    multipleDownloadRenderer.init();

    initTrimController();
    initAdvancedSettings();
    initSearchSuggestController();
    initConvertForm({ getSettings: getCurrentSettings, getTrimStart, getTrimEnd });

    initFirebaseAnalytics();
    initFeedbackWidget();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
