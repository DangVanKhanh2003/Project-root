/**
 * Paywall Popup Wrapper — ytsss.com
 * Thin wrapper around the remote poppurchase v3 script.
 * Uses the v3 API which accepts title/noCountdown as options directly.
 */

import { show as baseShowPaywall } from 'https://media.ytmp3.gg/poppurchase.v3.js?v=13';

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
        secondaryLabel: options.secondaryLabel,
        onSecondaryClick: options.onSecondaryClick,
    });
}
