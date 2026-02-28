import { BULK_DOWNLOAD_LIMIT, getSecondsUntilNextMidnight, type LimitedDailyMode } from '../download-limit';

type PopupKind = 'daily_limit' | 'video_limit' | 'maintenance';

interface PopupMessages {
    dailyLimitLabel: string;
    dailyLimitText: string;
    dailyLimitCtaTitle: string;
    dailyLimitDescription: string;
    dailyLimitButton: string;
    bulkDailyLimitTitle: string;
    bulkDailyLimitDescription: string;
    continueSingleUrlButton: string;
    videoLimitLabel: string;
    videoLimitText: string;
    videoLimitCtaTitle: string;
    videoLimitDescription: string;
    videoLimitButton: string;
    maybeLater: string;
    maintenanceBadge: string;
    maintenanceTitle: string;
    maintenanceDescription: string;
    maintenanceButton: string;
}

const SUPPORTER_CTA_URL = 'https://ko-fi.com/s/fa5c2b2a93';
const ONE_TIME_DOWNLOAD_URL = 'https://media.ytmp3.gg/';

const TRANSLATIONS: Record<string, PopupMessages> = {
    vi: {
        dailyLimitLabel: 'Da dat gioi han ngay',
        dailyLimitText: 'Quay lai sau',
        dailyLimitCtaTitle: 'Tai khong gioi han va mo toan bo tinh nang',
        dailyLimitDescription: 'Mo khoa tai khong gioi han va truy cap day du tat ca tinh nang.',
        dailyLimitButton: 'Mo khoa khong gioi han',
        bulkDailyLimitTitle: 'Da dat gioi han ngay cua Multiple Video Download',
        bulkDailyLimitDescription: 'Ban da dung het gioi han ngay cho multiple video download. Ban van co the tiep tuc tai tung URL don ben duoi.',
        continueSingleUrlButton: 'Tiep tuc tai URL don',
        videoLimitLabel: 'Vuot qua gioi han video',
        videoLimitText: 'Toi da',
        videoLimitCtaTitle: 'Tai khong gioi han va mo toan bo tinh nang',
        videoLimitDescription: 'Mo khoa tai khong gioi han va truy cap day du tat ca tinh nang.',
        videoLimitButton: 'Mo khoa khong gioi han',
        maybeLater: 'De sau',
        maintenanceBadge: 'Bao tri',
        maintenanceTitle: 'Tinh nang dang duoc cap nhat',
        maintenanceDescription: 'Chung toi dang cap nhat tinh nang nay. Tam thoi, ban co the dung trang tai video tung lan de tiep tuc.',
        maintenanceButton: 'Mo trang tai 1 video'
    },
    en: {
        dailyLimitLabel: 'Daily Limit Reached',
        dailyLimitText: 'Come back in',
        dailyLimitCtaTitle: 'Unlimited Downloads & Access All Features',
        dailyLimitDescription: 'Unlock unlimited downloads and full access to all features.',
        dailyLimitButton: 'Get Unlimited',
        bulkDailyLimitTitle: 'You have reached the daily limit for Multiple Video Download',
        bulkDailyLimitDescription: 'Your daily limit for multiple video download has been reached. You can still continue with single URL downloads below.',
        continueSingleUrlButton: 'Continue Single URL Download',
        videoLimitLabel: 'Video Limit Exceeded',
        videoLimitText: 'Max',
        videoLimitCtaTitle: 'Unlimited Downloads & Access All Features',
        videoLimitDescription: 'Unlock unlimited downloads and full access to all features.',
        videoLimitButton: 'Get Unlimited',
        maybeLater: 'Maybe later',
        maintenanceBadge: 'Maintenance',
        maintenanceTitle: 'Feature is being updated',
        maintenanceDescription: 'We are updating this feature. In the meantime, please visit our One-Time Video Download page to download your video.',
        maintenanceButton: 'Start One-Time Download'
    }
};

function getMessages(): PopupMessages {
    const lang = document.documentElement.lang?.toLowerCase() || 'en';
    return TRANSLATIONS[lang] || TRANSLATIONS[lang.split('-')[0]] || TRANSLATIONS.en;
}

function formatCountdown(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.max(0, totalSeconds % 60);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function trackPopupEvent(eventName: string, eventParams: Record<string, unknown>): void {
    import('../../libs/firebase')
        .then(({ logEvent }) => logEvent(eventName, eventParams))
        .catch(() => {});
}

function closeOverlay(overlay: HTMLElement, box: HTMLElement, tickerId?: number): void {
    if (typeof tickerId === 'number') {
        window.clearInterval(tickerId);
    }

    overlay.classList.remove('is-visible');
    box.classList.remove('is-visible');

    window.setTimeout(() => {
        overlay.remove();
    }, 250);
}

function mountPopup(
    overlayId: string,
    kind: PopupKind,
    boxHtml: string,
    afterMount?: (box: HTMLElement, overlay: HTMLElement) => number | void
): void {
    if (document.getElementById(overlayId)) return;

    const overlay = document.createElement('div');
    overlay.id = overlayId;
    overlay.className = 'maintenance-popup-overlay';

    const box = document.createElement('div');
    box.className = 'maintenance-popup-box';
    box.innerHTML = boxHtml;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.classList.add('is-visible');
        box.classList.add('is-visible');
    });

    const mountedTicker = afterMount?.(box, overlay);
    const tickerId: number | undefined = typeof mountedTicker === 'number' ? mountedTicker : undefined;

    overlay.addEventListener('click', (event) => {
        if (event.target !== overlay) return;
        trackPopupEvent(`${kind}_popup_overlay_click`, { popup: kind });
        closeOverlay(overlay, box, tickerId);
    });

    const closeButton = box.querySelector('[data-popup-close]');
    closeButton?.addEventListener('click', () => {
        trackPopupEvent(`${kind}_popup_close_click`, { popup: kind, action: 'maybe_later' });
        closeOverlay(overlay, box, tickerId);
    });

    const actionButtons = Array.from(box.querySelectorAll<HTMLElement>('[data-popup-action]'));
    actionButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const action = button.getAttribute('data-popup-action') || 'cta';
            trackPopupEvent(`${kind}_popup_action_click`, { popup: kind, action });
            closeOverlay(overlay, box, tickerId);
        });
    });
}

export function showLimitReachedPopup(mode?: LimitedDailyMode): void {
    const t = getMessages();
    const isBulkMode = mode === 'batch';
    const description = isBulkMode ? t.bulkDailyLimitDescription : t.dailyLimitDescription;
    const ctaTitle = isBulkMode ? t.bulkDailyLimitTitle : t.dailyLimitCtaTitle;
    const actionsHtml = isBulkMode
        ? `
            <div class="maintenance-popup-actions">
                <a href="${SUPPORTER_CTA_URL}" target="_blank" rel="noopener nofollow noreferrer" class="maintenance-popup-cta-button" data-popup-action="get_license">
                    <img src="https://storage.ko-fi.com/cdn/logomarkLogo.png" alt="Ko-fi" width="20" height="20">
                    <span>${t.dailyLimitButton}</span>
                </a>
                <button type="button" class="maintenance-popup-secondary-button" data-popup-action="continue_single_url">
                    <span>${t.continueSingleUrlButton}</span>
                </button>
            </div>
        `
        : `
            <a href="${SUPPORTER_CTA_URL}" target="_blank" rel="noopener nofollow noreferrer" class="maintenance-popup-cta-button" data-popup-action="get_license">
                <img src="https://storage.ko-fi.com/cdn/logomarkLogo.png" alt="Ko-fi" width="20" height="20">
                <span>${t.dailyLimitButton}</span>
            </a>
        `;

    mountPopup(
        'limit-reached-overlay',
        'daily_limit',
        `
            <div class="maintenance-popup-header">
                <svg class="maintenance-popup-header-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <div class="maintenance-popup-header-copy">
                    <div class="maintenance-popup-label">${t.dailyLimitLabel}</div>
                    <p class="maintenance-popup-subtitle">${t.dailyLimitText} <strong id="limit-countdown" class="maintenance-popup-countdown">${formatCountdown(getSecondsUntilNextMidnight())}</strong></p>
                </div>
            </div>
            <div class="maintenance-popup-cta-card">
                <div class="maintenance-popup-cta-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="none" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                    <span>${ctaTitle}</span>
                </div>
                <p class="maintenance-popup-cta-description">${description}</p>
                ${actionsHtml}
            </div>
            ${isBulkMode ? '' : `<button type="button" class="maintenance-popup-link-button" data-popup-close>${t.maybeLater}</button>`}
        `,
        (box, overlay) => {
            const countdownEl = box.querySelector('#limit-countdown');
            const ticker = window.setInterval(() => {
                const remainingSeconds = getSecondsUntilNextMidnight();
                if (!countdownEl) return;
                countdownEl.textContent = formatCountdown(remainingSeconds);
                if (remainingSeconds <= 0) {
                    closeOverlay(overlay, box, ticker);
                }
            }, 1000);

            return ticker;
        }
    );
}

export function showVideoLimitPopup(maxVideos = BULK_DOWNLOAD_LIMIT): void {
    const t = getMessages();

    mountPopup(
        'video-limit-overlay',
        'video_limit',
        `
            <div class="maintenance-popup-header">
                <svg class="maintenance-popup-header-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div class="maintenance-popup-header-copy">
                    <div class="maintenance-popup-label">${t.videoLimitLabel}</div>
                    <p class="maintenance-popup-subtitle">${t.videoLimitText} <strong class="maintenance-popup-countdown">${maxVideos} videos</strong> per conversion for free users</p>
                </div>
            </div>
            <div class="maintenance-popup-cta-card">
                <div class="maintenance-popup-cta-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="none" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                    <span>${t.videoLimitCtaTitle}</span>
                </div>
                <p class="maintenance-popup-cta-description">${t.videoLimitDescription}</p>
                <a href="${SUPPORTER_CTA_URL}" target="_blank" rel="noopener nofollow noreferrer" class="maintenance-popup-cta-button" data-popup-action="get_license">
                    <img src="https://storage.ko-fi.com/cdn/logomarkLogo.png" alt="Ko-fi" width="20" height="20">
                    <span>${t.videoLimitButton}</span>
                </a>
            </div>
            <button type="button" class="maintenance-popup-link-button" data-popup-close>${t.maybeLater}</button>
        `
    );
}

export function showMaintenancePopup(): void {
    const t = getMessages();

    mountPopup(
        'maintenance-overlay',
        'maintenance',
        `
            <div class="maintenance-popup-hero-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 30 30" aria-hidden="true">
                    <path fill="#64748b" d="M6,9.3L3.9,5.8l1.4-1.4l3.5,2.1v1.4l3.6,3.6c0,0.1,0,0.2,0,0.3L11.1,13L7.4,9.3H6z M21,17.8c-0.3,0-0.5,0-0.8,0c0,0,0,0,0,0c-0.7,0-1.3-0.1-1.9-0.2l-2.1,2.4l4.7,5.3c1.1,1.2,3,1.3,4.1,0.1c1.2-1.2,1.1-3-0.1-4.1L21,17.8z M24.4,14c1.6-1.6,2.1-4,1.5-6.1c-0.1-0.4-0.6-0.5-0.8-0.2l-3.5,3.5l-2.8-2.8l3.5-3.5c0.3-0.3,0.2-0.7-0.2-0.8C20,3.4,17.6,3.9,16,5.6c-1.8,1.8-2.2,4.6-1.2,6.8l-10,8.9c-1.2,1.1-1.3,3-0.1,4.1l0,0c1.2,1.2,3,1.1,4.1-0.1l8.9-10C19.9,16.3,22.6,15.9,24.4,14z"></path>
                </svg>
            </div>
            <div class="maintenance-popup-badge">${t.maintenanceBadge}</div>
            <h3 class="maintenance-popup-title">${t.maintenanceTitle}</h3>
            <p class="maintenance-popup-description">${t.maintenanceDescription}</p>
            <a href="${ONE_TIME_DOWNLOAD_URL}" class="maintenance-popup-primary-button" data-popup-action="continue_single_url">${t.maintenanceButton}</a>
        `
    );
}
