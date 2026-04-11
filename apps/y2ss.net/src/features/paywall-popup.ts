/**
 * Paywall Popup Wrapper — y2ss.net
 * Thin wrapper around the remote poppurchase v3 script.
 * Uses the v3 API which accepts title/noCountdown as options directly.
 */

import { show as baseShowPaywall, configure as baseConfigurePaywall } from 'https://media.ytmp3.gg/poppurchase.v3.js?v=18';
import { saveLicenseKey, saveLicenseCache } from './license/license-token';
import type { CheckKeyResponse } from '@downloader/core';

export interface PaywallOptions {
    /** Override popup header text */
    title?: string;
    /** If true, hide the countdown timer */
    noCountdown?: boolean;
    /** Custom message when countdown is disabled */
    noCountdownMessage?: string;
    /** Text for secondary button (normal mode). If omitted, no secondary button shown */
    secondaryLabel?: string;
    /** Callback when secondary button is clicked. Popup auto-closes before calling */
    onSecondaryClick?: () => void;
    /** Show activate-key form in popup */
    isShowCheckKey?: boolean;
}

// Track whether a license was just activated inside the popup
let _justActivated = false;

// Configure activate-key callbacks once
baseConfigurePaywall({
    onActivateSuccess(licenseKey: string, result: CheckKeyResponse) {
        saveLicenseKey(licenseKey);
        saveLicenseCache(result);
        _justActivated = true;
        document.dispatchEvent(new CustomEvent('license:activated', {
            detail: { planType: result.planType, expiresAt: result.expiresAt },
        }));
    },
    onClose() {
        if (_justActivated) {
            _justActivated = false;
            window.location.reload();
        }
    },
});

/**
 * Show supporter popup with optional overrides.
 *
 * @param type - popup type string (e.g. 'download_multi', 'download_playlist')
 * @param options - optional title, noCountdown, and noCountdownMessage overrides
 */
export function showPaywall(type?: string, options: PaywallOptions = {}): void {
    baseShowPaywall(type as Parameters<typeof baseShowPaywall>[0], {
        isShowCheckKey: true,
        title: options.title,
        noCountdown: options.noCountdown,
        noCountdownMessage: options.noCountdownMessage,
        secondaryLabel: options.secondaryLabel,
        onSecondaryClick: options.onSecondaryClick,
    });
}
