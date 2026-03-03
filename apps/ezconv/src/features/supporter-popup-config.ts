import type { MaintenancePopupConfig } from '@downloader/ui-shared';

export const POPUP_CONFIG: MaintenancePopupConfig = {
    supporterCtaUrl: 'https://ko-fi.com/s/d242437374',
    oneTimeDownloadUrl: 'https://ezconv.pro/',
    logEvent: (eventName, eventParams) => {
        import('../libs/firebase')
            .then(({ logEvent }) => logEvent(eventName, eventParams))
            .catch(() => { });
    },
};
