/**
 * Paywall Popup Wrapper — snap1s.com
 * Thin wrapper around the remote poppurchase v3 script.
 * Uses the v3 API which accepts title/noCountdown as options directly.
 */

import { show as baseShowPaywall } from 'https://media.ytmp3.gg/poppurchase.v3.js?v=12';

export interface PaywallOptions {
    /** Override popup header text */
    title?: string;
    /** If true, hide the countdown timer */
    noCountdown?: boolean;
    /** Custom message when countdown is disabled */
    noCountdownMessage?: string;
}

/**
 * Show supporter popup with optional overrides.
 *
 * @param type - popup type string (e.g. 'download_multi', 'download_playlist')
 * @param options - optional title, noCountdown, and noCountdownMessage overrides
 */
export function showPaywall(type?: string, options: PaywallOptions = {}): void {
    baseShowPaywall(type as Parameters<typeof baseShowPaywall>[0], {
        title: options.title,
        noCountdown: options.noCountdown,
        noCountdownMessage: options.noCountdownMessage,
    });
}
