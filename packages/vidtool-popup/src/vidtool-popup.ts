/**
 * VidTool Popup - Standalone Component
 * Shows popup when download fails after all retries exhausted
 * Auto-detects device and shows appropriate download link
 *
 * Usage:
 *   import { showVidToolPopup } from '@downloader/vidtool-popup';
 *   showVidToolPopup({ lang: 'en' });
 */

// ==================== Types ====================

export type Platform = 'android' | 'ios' | 'macos' | 'windows' | 'unknown';

/** Firebase logEvent function signature */
export type LogEventFunction = (eventName: string, eventParams?: Record<string, unknown>) => void;

// ==================== Constants ====================

// Default icon URL (can be overridden via options)
const DEFAULT_ICON_URL = '/public/vidtool_icon.png';

// Download URLs per platform
const DOWNLOAD_URLS: Record<Platform, string> = {
    android: 'https://api.vidtool.net/download/apk/app.apk',
    ios: 'https://vidcombo.net/',      // TODO: Replace with iOS App Store link
    macos: 'https://vidcombo.net/',    // TODO: Replace with macOS download link
    windows: 'https://vidcombo.net/',  // TODO: Replace with Windows download link
    unknown: 'https://vidcombo.net/'   // Fallback
};

// ==================== Device Detection ====================

/**
 * Detect user's platform/device
 * @returns Platform type: 'android' | 'ios' | 'macos' | 'windows' | 'unknown'
 */
export function detectPlatform(): Platform {
    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';

    // Android detection
    if (ua.includes('android')) {
        return 'android';
    }

    // iOS detection (iPhone, iPad, iPod)
    if (/iphone|ipad|ipod/.test(ua) || (platform === 'macintel' && navigator.maxTouchPoints > 1)) {
        return 'ios';
    }

    // macOS detection (non-touch Mac)
    if (platform.includes('mac') || ua.includes('macintosh')) {
        return 'macos';
    }

    // Windows detection
    if (platform.includes('win') || ua.includes('windows')) {
        return 'windows';
    }

    return 'unknown';
}

/**
 * Get download URL for a specific platform
 * @param platform - Platform type
 * @returns Download URL string
 */
export function getDownloadUrl(platform: Platform): string {
    return DOWNLOAD_URLS[platform] || DOWNLOAD_URLS.unknown;
}

// ==================== i18n Translations ====================

const translations: Record<string, {
    title: string;
    description: string;
    buttonText: Record<Platform, string>;
    logoAlt: string;
}> = {
    // English (default)
    en: {
        title: 'Download Failed',
        description: 'Unable to process this video. Please try VidTool app for better compatibility and faster downloads.',
        buttonText: {
            android: 'Download for Android',
            ios: 'Download for iOS',
            macos: 'Download for Mac',
            windows: 'Download for Windows',
            unknown: 'Get VidTool App'
        },
        logoAlt: 'VidTool'
    },
    // Vietnamese
    vi: {
        title: 'Tải Xuống Thất Bại',
        description: 'Không thể xử lý video này. Vui lòng thử ứng dụng VidTool để tương thích tốt hơn và tải nhanh hơn.',
        buttonText: {
            android: 'Tải cho Android',
            ios: 'Tải cho iOS',
            macos: 'Tải cho Mac',
            windows: 'Tải cho Windows',
            unknown: 'Tải VidTool App'
        },
        logoAlt: 'VidTool'
    },
    // Spanish
    es: {
        title: 'Descarga Fallida',
        description: 'No se puede procesar este video. Pruebe la aplicación VidTool para mejor compatibilidad y descargas más rápidas.',
        buttonText: {
            android: 'Descargar para Android',
            ios: 'Descargar para iOS',
            macos: 'Descargar para Mac',
            windows: 'Descargar para Windows',
            unknown: 'Obtener VidTool App'
        },
        logoAlt: 'VidTool'
    },
    // Portuguese
    pt: {
        title: 'Download Falhou',
        description: 'Não foi possível processar este vídeo. Experimente o aplicativo VidTool para melhor compatibilidade e downloads mais rápidos.',
        buttonText: {
            android: 'Baixar para Android',
            ios: 'Baixar para iOS',
            macos: 'Baixar para Mac',
            windows: 'Baixar para Windows',
            unknown: 'Obter VidTool App'
        },
        logoAlt: 'VidTool'
    },
    // French
    fr: {
        title: 'Échec du Téléchargement',
        description: 'Impossible de traiter cette vidéo. Essayez l\'application VidTool pour une meilleure compatibilité et des téléchargements plus rapides.',
        buttonText: {
            android: 'Télécharger pour Android',
            ios: 'Télécharger pour iOS',
            macos: 'Télécharger pour Mac',
            windows: 'Télécharger pour Windows',
            unknown: 'Obtenir VidTool App'
        },
        logoAlt: 'VidTool'
    },
    // German
    de: {
        title: 'Download Fehlgeschlagen',
        description: 'Dieses Video kann nicht verarbeitet werden. Versuchen Sie die VidTool-App für bessere Kompatibilität und schnellere Downloads.',
        buttonText: {
            android: 'Für Android herunterladen',
            ios: 'Für iOS herunterladen',
            macos: 'Für Mac herunterladen',
            windows: 'Für Windows herunterladen',
            unknown: 'VidTool App Holen'
        },
        logoAlt: 'VidTool'
    },
    // Italian
    it: {
        title: 'Download Fallito',
        description: 'Impossibile elaborare questo video. Prova l\'app VidTool per una migliore compatibilità e download più veloci.',
        buttonText: {
            android: 'Scarica per Android',
            ios: 'Scarica per iOS',
            macos: 'Scarica per Mac',
            windows: 'Scarica per Windows',
            unknown: 'Ottieni VidTool App'
        },
        logoAlt: 'VidTool'
    },
    // Japanese
    ja: {
        title: 'ダウンロード失敗',
        description: 'この動画を処理できません。より良い互換性と高速ダウンロードのためにVidToolアプリをお試しください。',
        buttonText: {
            android: 'Android版をダウンロード',
            ios: 'iOS版をダウンロード',
            macos: 'Mac版をダウンロード',
            windows: 'Windows版をダウンロード',
            unknown: 'VidToolアプリを入手'
        },
        logoAlt: 'VidTool'
    },
    // Korean
    ko: {
        title: '다운로드 실패',
        description: '이 비디오를 처리할 수 없습니다. 더 나은 호환성과 빠른 다운로드를 위해 VidTool 앱을 사용해 보세요.',
        buttonText: {
            android: 'Android용 다운로드',
            ios: 'iOS용 다운로드',
            macos: 'Mac용 다운로드',
            windows: 'Windows용 다운로드',
            unknown: 'VidTool 앱 받기'
        },
        logoAlt: 'VidTool'
    },
    // Russian
    ru: {
        title: 'Ошибка Загрузки',
        description: 'Не удалось обработать это видео. Попробуйте приложение VidTool для лучшей совместимости и быстрой загрузки.',
        buttonText: {
            android: 'Скачать для Android',
            ios: 'Скачать для iOS',
            macos: 'Скачать для Mac',
            windows: 'Скачать для Windows',
            unknown: 'Получить VidTool App'
        },
        logoAlt: 'VidTool'
    },
    // Arabic
    ar: {
        title: 'فشل التحميل',
        description: 'تعذر معالجة هذا الفيديو. جرب تطبيق VidTool للحصول على توافق أفضل وتنزيلات أسرع.',
        buttonText: {
            android: 'تحميل لأندرويد',
            ios: 'تحميل لـ iOS',
            macos: 'تحميل لـ Mac',
            windows: 'تحميل لـ Windows',
            unknown: 'احصل على VidTool App'
        },
        logoAlt: 'VidTool'
    },
    // Turkish
    tr: {
        title: 'İndirme Başarısız',
        description: 'Bu video işlenemiyor. Daha iyi uyumluluk ve daha hızlı indirmeler için VidTool uygulamasını deneyin.',
        buttonText: {
            android: 'Android için İndir',
            ios: 'iOS için İndir',
            macos: 'Mac için İndir',
            windows: 'Windows için İndir',
            unknown: 'VidTool App Edinin'
        },
        logoAlt: 'VidTool'
    },
    // Hindi
    hi: {
        title: 'डाउनलोड विफल',
        description: 'इस वीडियो को प्रोसेस नहीं किया जा सकता। बेहतर संगतता और तेज़ डाउनलोड के लिए VidTool ऐप आज़माएं।',
        buttonText: {
            android: 'Android के लिए डाउनलोड करें',
            ios: 'iOS के लिए डाउनलोड करें',
            macos: 'Mac के लिए डाउनलोड करें',
            windows: 'Windows के लिए डाउनलोड करें',
            unknown: 'VidTool App प्राप्त करें'
        },
        logoAlt: 'VidTool'
    },
    // Indonesian
    id: {
        title: 'Unduhan Gagal',
        description: 'Tidak dapat memproses video ini. Coba aplikasi VidTool untuk kompatibilitas yang lebih baik dan unduhan yang lebih cepat.',
        buttonText: {
            android: 'Unduh untuk Android',
            ios: 'Unduh untuk iOS',
            macos: 'Unduh untuk Mac',
            windows: 'Unduh untuk Windows',
            unknown: 'Dapatkan VidTool App'
        },
        logoAlt: 'VidTool'
    },
    // Thai
    th: {
        title: 'ดาวน์โหลดล้มเหลว',
        description: 'ไม่สามารถประมวลผลวิดีโอนี้ได้ ลองใช้แอป VidTool เพื่อความเข้ากันได้ที่ดีขึ้นและดาวน์โหลดเร็วขึ้น',
        buttonText: {
            android: 'ดาวน์โหลดสำหรับ Android',
            ios: 'ดาวน์โหลดสำหรับ iOS',
            macos: 'ดาวน์โหลดสำหรับ Mac',
            windows: 'ดาวน์โหลดสำหรับ Windows',
            unknown: 'รับ VidTool App'
        },
        logoAlt: 'VidTool'
    },
    // Chinese Simplified
    zh: {
        title: '下载失败',
        description: '无法处理此视频。请尝试 VidTool 应用以获得更好的兼容性和更快的下载速度。',
        buttonText: {
            android: '下载 Android 版',
            ios: '下载 iOS 版',
            macos: '下载 Mac 版',
            windows: '下载 Windows 版',
            unknown: '获取 VidTool App'
        },
        logoAlt: 'VidTool'
    }
};

// ==================== CSS Styles ====================
const CSS_STYLES = `
:root {
    --vt-blue: #007AFF;
    --vt-bg: #ffffff;
    --vt-gray: #8e8e93;
    --vt-text: #1c1c1e;
    --vt-close-bg: #f2f2f7;
    --vt-radius-lg: 16px;
    --vt-radius-md: 8px;
}

/* Overlay */
.vt-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
}

/* Modal */
.vt-modal {
    background-color: var(--vt-bg);
    width: 100%;
    max-width: 340px;
    padding: 32px 24px;
    border-radius: var(--vt-radius-lg);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
    position: relative;
    text-align: center;
}

/* Close button */
.vt-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: var(--vt-close-bg);
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
}

.vt-close:hover {
    background: #e5e5ea;
}

.vt-close svg {
    width: 10px;
    height: 10px;
    stroke: var(--vt-gray);
    stroke-width: 3;
}

/* Content */
.vt-logo {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    display: block;
    border-radius: 16px;
}

.vt-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 10px;
    letter-spacing: -0.4px;
    color: var(--vt-text);
}

.vt-desc {
    font-size: 14px;
    line-height: 1.5;
    color: #6e6e73;
    margin-bottom: 28px;
}

/* CTA Button */
.vt-btn {
    display: block;
    width: 100%;
    background-color: var(--vt-blue);
    color: #ffffff;
    text-decoration: none;
    padding: 14px;
    border-radius: var(--vt-radius-md);
    font-size: 16px;
    font-weight: 600;
    transition: background 0.2s, transform 0.1s;
    box-shadow: 0 4px 10px rgba(0, 122, 255, 0.2);
    border: none;
    outline: none;
    cursor: pointer;
}

.vt-btn:hover {
    background-color: #0063cc;
}

.vt-btn:active {
    transform: scale(0.98);
}
`;

// ==================== Private Functions ====================

/**
 * Inject CSS styles into document head (only once)
 */
function injectStyles(): void {
    if (!document.getElementById('vidtool-popup-styles')) {
        const style = document.createElement('style');
        style.id = 'vidtool-popup-styles';
        style.textContent = CSS_STYLES;
        document.head.appendChild(style);
    }
}

/**
 * Get translation text
 * @param lang - Language code ('en', 'vi', 'es', etc.)
 * @returns Translation object
 */
function getTranslation(lang: string) {
    return translations[lang] || translations.en;
}

/**
 * Create popup HTML
 * @param t - Translation object
 * @param iconUrl - URL of the icon image
 * @param platform - Detected platform
 * @returns HTML string
 */
function createPopupHTML(
    t: typeof translations.en,
    iconUrl: string,
    platform: Platform
): string {
    const buttonText = t.buttonText[platform] || t.buttonText.unknown;

    return `
        <div class="vt-overlay" id="vidtool-popup">
            <div class="vt-modal">
                <button class="vt-close" id="vt-close-btn" aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <img src="${iconUrl}" alt="${t.logoAlt}" class="vt-logo">

                <h2 class="vt-title">${t.title}</h2>
                <p class="vt-desc">${t.description}</p>

                <button class="vt-btn" id="vt-redirect-btn">${buttonText}</button>
            </div>
        </div>
    `;
}

/**
 * Remove popup from DOM
 */
function removePopup(): void {
    const popup = document.getElementById('vidtool-popup');
    if (popup) {
        popup.remove();
    }
}

/**
 * Close popup immediately (no animation)
 */
function closePopup(): void {
    removePopup();
}

/**
 * Attach event listeners to popup
 * @param downloadUrl - URL to redirect to
 * @param platform - Detected platform
 * @param onRedirect - Callback when user clicks redirect button
 * @param logEvent - Optional Firebase logEvent function
 */
function attachEventListeners(
    downloadUrl: string,
    platform: Platform,
    onRedirect?: () => void,
    logEvent?: LogEventFunction
): void {
    const popup = document.getElementById('vidtool-popup');
    const closeBtn = document.getElementById('vt-close-btn');
    const redirectBtn = document.getElementById('vt-redirect-btn');

    if (!popup || !closeBtn || !redirectBtn) {
        return;
    }

    // Close button click
    closeBtn.addEventListener('click', closePopup);

    // Click outside to close
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            closePopup();
        }
    });

    // Redirect button click
    redirectBtn.addEventListener('click', () => {
        // Log Firebase event
        if (typeof logEvent === 'function') {
            logEvent('vidtool_popup_click', {
                platform: platform,
                download_url: downloadUrl
            });
        }

        // Open link
        const link = document.createElement('a');
        link.href = downloadUrl;
        // Android: download APK directly (no new tab)
        // Other platforms: open in new tab
        if (platform !== 'android') {
            link.target = '_blank';
        }
        link.rel = 'nofollow noopener noreferrer';
        link.click();

        // Call callback if provided
        if (typeof onRedirect === 'function') {
            onRedirect();
        }

        closePopup();
    });

    // ESC key to close
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            closePopup();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

// ==================== Public API ====================

export interface VidToolPopupOptions {
    /** Language code (auto-detected from document.documentElement.lang if not provided) */
    lang?: string;
    /** Callback when redirect button is clicked */
    onRedirect?: () => void;
    /** Custom icon URL (defaults to /public/vidtool_icon.png) */
    iconUrl?: string;
    /** Force specific platform (auto-detected if not provided) */
    platform?: Platform;
    /** Firebase logEvent function for analytics tracking */
    logEvent?: LogEventFunction;
}

/**
 * Show VidTool popup when download fails
 * Auto-detects user's platform and shows appropriate download link
 *
 * @param options - Configuration options
 * @param options.lang - Language code (auto-detected from document.documentElement.lang)
 * @param options.onRedirect - Callback when redirect button is clicked
 * @param options.iconUrl - Custom icon URL (defaults to /public/vidtool_icon.png)
 * @param options.platform - Force specific platform (auto-detected if not provided)
 *
 * @example
 * // Basic usage (Auto-detect language and platform)
 * showVidToolPopup();
 *
 * @example
 * // Vietnamese with callback
 * showVidToolPopup({
 *   lang: 'vi',
 *   onRedirect: () => console.log('User redirected')
 * });
 *
 * @example
 * // Force Android platform
 * showVidToolPopup({
 *   platform: 'android'
 * });
 */
export function showVidToolPopup(options: VidToolPopupOptions = {}): void {
    const {
        lang = document.documentElement.lang || 'en',
        onRedirect,
        iconUrl = DEFAULT_ICON_URL,
        platform = detectPlatform(),
        logEvent
    } = options;

    // Get download URL for detected/specified platform
    const downloadUrl = getDownloadUrl(platform);

    // Remove existing popup if any
    removePopup();

    // Inject CSS styles
    injectStyles();

    // Get translations
    const t = getTranslation(lang);

    // Create and insert popup HTML (shows immediately, no animation)
    document.body.insertAdjacentHTML('beforeend', createPopupHTML(t, iconUrl, platform));

    // Attach event listeners with platform-specific URL and analytics
    attachEventListeners(downloadUrl, platform, onRedirect, logEvent);
}

/**
 * Hide and remove VidTool popup
 */
export function hideVidToolPopup(): void {
    closePopup();
}
