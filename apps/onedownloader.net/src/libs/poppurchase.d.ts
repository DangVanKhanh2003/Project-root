declare module 'https://media.ytmp3.gg/poppurchase.v3.js?v=11' {
    type PaywallType =
        | 'download_multi'
        | 'download_playlist'
        | 'download_channel'
        | 'download_4k'
        | 'download_2k'
        | 'download_320kbps'
        | 'download_wav'
        | 'cut_video_youtube'
        | 'title_limit_max10'
        | 'geo_location'
        | 'none_title'
        | 'download_long_video';

    interface ShowOptions {
        title?: string;
        noCountdown?: boolean;
        noCountdownMessage?: string;
    }

    export function show(type?: PaywallType, options?: ShowOptions): void;
    export function hide(): void;
    export function configure(opts: {
        pricingUrl?: string;
        onUpgradeClick?: (plan: string) => void;
        onClose?: () => void;
    }): void;
    export function preload(): Promise<unknown>;
}
