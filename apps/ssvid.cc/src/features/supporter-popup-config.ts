import type { MaintenancePopupConfig } from '@downloader/ui-shared';

export const POPUP_CONFIG: MaintenancePopupConfig = {
    supporterCtaUrl: 'https://ko-fi.com/s/fa5c2b2a93',
    oneTimeDownloadUrl: 'https://ssvid.cc/',
    logEvent: (eventName, eventParams) => {
        import('../libs/firebase')
            .then(({ logEvent }) => logEvent(eventName, eventParams))
            .catch(() => { });
    },
};
