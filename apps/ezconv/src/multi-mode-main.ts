/**
 * Multi-Mode Downloader Entry Point
 * Entry point for the unified download page combining single, trim, multi, and playlist modes.
 */

import './styles/index.css';
import { scrollManager } from '@downloader/ui-shared';

import { multipleDownloadRenderer } from './features/downloader/ui-render/multiple-download/multiple-download-renderer';
import { initAudioDropdown } from './features/downloader/ui-render/dropdown-logic';
import { initMobileMenu, initLangSelector, initDrawerLangSelector, initHeaderScroll, initFirebaseAnalytics } from './features/shared/init/common-init';
import { getCurrentSettings, initFormatToggle } from './features/shared/form/format-settings';
import { initAdvancedSettings } from './features/multi-mode-downloader/advanced-settings-controller';
import { initConvertForm } from './features/multi-mode-downloader/convert-submit-controller';
import { initTrimController, getTrimStart, getTrimEnd } from './features/multi-mode-downloader/trim-controller';

function init(): void {
    // Use shared base scroll behavior across projects
    scrollManager.setHeaderConfig({ isFixed: false, height: 0 });
    scrollManager.init();

    initHeaderScroll();
    initMobileMenu();
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
    initConvertForm({ getSettings: getCurrentSettings, getTrimStart, getTrimEnd });

    initFirebaseAnalytics();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
