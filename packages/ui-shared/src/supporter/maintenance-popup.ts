type PopupKind = 'daily_limit' | 'video_limit' | 'maintenance' | 'instruction';

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
    dynamicLimitLabels?: Record<string, string>;
    playlistInstructionLabel: string;
    playlistInstructionText: string;
    channelInstructionLabel: string;
    channelInstructionText: string;
    instructionStep1: string;
    instructionStep2Playlist: string;
    instructionStep2Channel: string;
    gotItButton: string;
}

export interface MaintenancePopupConfig {
    /** Ko-fi supporter link */
    supporterCtaUrl: string;
    /** One-time download page URL */
    oneTimeDownloadUrl: string;
    /** Optional Firebase logEvent function */
    logEvent?: (eventName: string, eventParams: Record<string, unknown>) => void;
}

import { FEATURE_KEYS } from '@downloader/core';

const EN_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: '4K Download Limit Reached',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: '2K Download Limit Reached',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: '320kbps Download Limit Reached',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'Cut Video Limit Reached',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'Playlist Limit Reached',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'Channel Limit Reached',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'Multiple Download Limit Reached',
    'high_quality_4k': '4K Download Limit Reached',
    'high_quality_2k': '2K Download Limit Reached',
    'high_quality_320k': '320kbps Download Limit Reached',
    'playlist': 'Playlist Limit Reached',
    'channel': 'Channel Limit Reached',
    'batch': 'Multiple Download Limit Reached',
};

const VI_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: 'Đã đạt giới hạn tải 4K',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: 'Đã đạt giới hạn tải 2K',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: 'Đã đạt giới hạn tải 320kbps',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'Đã đạt giới hạn Cắt Video',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'Đã đạt giới hạn tải Playlist',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'Đã đạt giới hạn tải Channel',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'Đã đạt giới hạn tải nhiều video',
    'high_quality_4k': 'Đã đạt giới hạn tải 4K',
    'high_quality_2k': 'Đã đạt giới hạn tải 2K',
    'high_quality_320k': 'Đã đạt giới hạn tải 320kbps',
    'playlist': 'Đã đạt giới hạn tải Playlist',
    'channel': 'Đã đạt giới hạn tải Channel',
    'batch': 'Đã đạt giới hạn tải nhiều video',
};

const AR_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: 'تم الوصول إلى حد تنزيل 4K',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: 'تم الوصول إلى حد تنزيل 2K',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: 'تم الوصول إلى حد تنزيل 320kbps',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'تم الوصول إلى حد قطع الفيديو',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'تم الوصول إلى حد قائمة التشغيل',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'تم الوصول إلى حد القناة',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'تم الوصول إلى حد التنزيل المتعدد',
    'high_quality_4k': 'تم الوصول إلى حد تنزيل 4K',
    'high_quality_2k': 'تم الوصول إلى حد تنزيل 2K',
    'high_quality_320k': 'تم الوصول إلى حد تنزيل 320kbps',
    'playlist': 'تم الوصول إلى حد قائمة التشغيل',
    'channel': 'تم الوصول إلى حد القناة',
    'batch': 'تم الوصول إلى حد التنزيل المتعدد',
};

const BN_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: '4K ডাউনলোডের সীমা পৌঁছে গেছে',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: '2K ডাউনলোডের সীমা পৌঁছে গেছে',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: '320kbps ডাউনলোডের সীমা পৌঁছে গেছে',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'ভিডিও কাটার সীমা পৌঁছে গেছে',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'প্লেলিস্ট ডাউনলোডের সীমা পৌঁছে গেছে',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'চ্যানেল ডাউনলোডের সীমা পৌঁছে গেছে',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'একাধিক ডাউনলোডের সীমা পৌঁছে গেছে',
    'high_quality_4k': '4K ডাউনলোডের সীমা পৌঁছে গেছে',
    'high_quality_2k': '2K ডাউনলোডের সীমা পৌঁছে গেছে',
    'high_quality_320k': '320kbps ডাউনলোডের সীমা পৌঁছে গেছে',
    'playlist': 'প্লেলিস্ট ডাউনলোডের সীমা পৌঁছে গেছে',
    'channel': 'চ্যানেল ডাউনলোডের সীমা পৌঁছে গেছে',
    'batch': 'একাধিক ডাউনলোডের সীমা পৌঁছে গেছে',
};

const DE_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: '4K-Download-Limit erreicht',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: '2K-Download-Limit erreicht',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: '320kbps-Download-Limit erreicht',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'Video-Zuschneide-Limit erreicht',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'Playlist-Limit erreicht',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'Kanal-Limit erreicht',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'Mehrfach-Download-Limit erreicht',
    'high_quality_4k': '4K-Download-Limit erreicht',
    'high_quality_2k': '2K-Download-Limit erreicht',
    'high_quality_320k': '320kbps-Download-Limit erreicht',
    'playlist': 'Playlist-Limit erreicht',
    'channel': 'Kanal-Limit erreicht',
    'batch': 'Mehrfach-Download-Limit erreicht',
};

const ES_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: 'Límite de descarga de 4K alcanzado',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: 'Límite de descarga de 2K alcanzado',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: 'Límite de descarga de 320kbps alcanzado',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'Límite de recorte de video alcanzado',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'Límite de lista de reproducción alcanzado',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'Límite de canal alcanzado',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'Límite de descarga múltiple alcanzado',
    'high_quality_4k': 'Límite de descarga de 4K alcanzado',
    'high_quality_2k': 'Límite de descarga de 2K alcanzado',
    'high_quality_320k': 'Límite de descarga de 320kbps alcanzado',
    'playlist': 'Límite de lista de reproducción alcanzado',
    'channel': 'Límite de canal alcanzado',
    'batch': 'Límite de descarga múltiple alcanzado',
};

const FR_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: 'Limite de téléchargement 4K atteinte',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: 'Limite de téléchargement 2K atteinte',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: 'Limite de téléchargement 320kbps atteinte',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'Limite de découpe vidéo atteinte',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'Limite de liste de lecture atteinte',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'Limite de chaîne atteinte',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'Limite de téléchargement multiple atteinte',
    'high_quality_4k': 'Limite de téléchargement 4K atteinte',
    'high_quality_2k': 'Limite de téléchargement 2K atteinte',
    'high_quality_320k': 'Limite de téléchargement 320kbps atteinte',
    'playlist': 'Limite de liste de lecture atteinte',
    'channel': 'Limite de chaîne atteinte',
    'batch': 'Limite de téléchargement multiple atteinte',
};

const HI_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: '4K डाउनलोड सीमा समाप्त हो गई है',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: '2K डाउनलोड सीमा समाप्त हो गई है',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: '320kbps डाउनलोड सीमा समाप्त हो गई है',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'वीडियो काटने की सीमा समाप्त हो गई है',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'प्लेलिस्ट डाउनलोड सीमा समाप्त हो गई है',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'चैनल डाउनलोड सीमा समाप्त हो गई है',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'मल्टीपल डाउनलोड सीमा समाप्त हो गई है',
    'high_quality_4k': '4K डाउनलोड सीमा समाप्त हो गई है',
    'high_quality_2k': '2K डाउनलोड सीमा समाप्त हो गई है',
    'high_quality_320k': '320kbps डाउनलोड सीमा समाप्त हो गई है',
    'playlist': 'प्लेलिस्ट डाउनलोड सीमा समाप्त हो गई है',
    'channel': 'चैनल डाउनलोड सीमा समाप्त हो गई है',
    'batch': 'मल्टीपल डाउनलोड सीमा समाप्त हो गई है',
};

const ID_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: 'Batas unduhan 4K tercapai',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: 'Batas unduhan 2K tercapai',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: 'Batas unduhan 320kbps tercapai',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'Batas pemotongan video tercapai',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'Batas unduhan daftar putar tercapai',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'Batas unduhan saluran tercapai',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'Batas unduhan banyak video tercapai',
    'high_quality_4k': 'Batas unduhan 4K tercapai',
    'high_quality_2k': 'Batas unduhan 2K tercapai',
    'high_quality_320k': 'Batas unduhan 320kbps tercapai',
    'playlist': 'Batas unduhan daftar putar tercapai',
    'channel': 'Batas unduhan saluran tercapai',
    'batch': 'Batas unduhan banyak video tercapai',
};

const IT_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: 'Limite di download 4K raggiunto',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: 'Limite di download 2K raggiunto',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: 'Limite di download 320kbps raggiunto',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'Limite di ritaglio video raggiunto',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'Limite di download playlist raggiunto',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'Limite di download canale raggiunto',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'Limite di download multiplo raggiunto',
    'high_quality_4k': 'Limite di download 4K raggiunto',
    'high_quality_2k': 'Limite di download 2K raggiunto',
    'high_quality_320k': 'Limite di download 320kbps raggiunto',
    'playlist': 'Limite di download playlist raggiunto',
    'channel': 'Limite di download canale raggiunto',
    'batch': 'Limite di download multiplo raggiunto',
};

const JA_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: '4Kのダウンロード制限に達しました',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: '2Kのダウンロード制限に達しました',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: '320kbpsのダウンロード制限に達しました',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: '動画カットの制限に達しました',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'プレイリストのダウンロード制限に達しました',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'チャンネルのダウンロード制限に達しました',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: '複数ダウンロードの制限に達しました',
    'high_quality_4k': '4Kのダウンロード制限に達しました',
    'high_quality_2k': '2K의のダウンロード制限に達しました',
    'high_quality_320k': '320kbpsのダウンロード制限に達しました',
    'playlist': 'プレイリストのダウンロード制限に達しました',
    'channel': 'チャンネルのダウンロード制限に達しました',
    'batch': '複数ダウンロードの制限に達しました',
};

const KO_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: '4K 다운로드 한도에 도달했습니다',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: '2K 다운로드 한도에 도달했습니다',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: '320kbps 다운로드 한도에 도달했습니다',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: '동영상 자르기 한도에 도달했습니다',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: '재생목록 다운로드 한도에 도달했습니다',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: '채널 다운로드 한도에 도달했습니다',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: '멀티 다운로드 한도에 도달했습니다',
    'high_quality_4k': '4K 다운로드 한도에 도달했습니다',
    'high_quality_2k': '2K 다운로드 한도에 도달했습니다',
    'high_quality_320k': '320kbps 다운로드 한도에 도달했습니다',
    'playlist': '재생목록 다운로드 한도에 도달했습니다',
    'channel': '채널 다운로드 한도에 도달했습니다',
    'batch': '멀티 다운로드 한도에 도달했습니다',
};

const MY_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: '4K ဒေါင်းလုဒ်ကန့်သတ်ချက် ပြည့်သွားပါပြီ',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: '2K ဒေါင်းလုဒ်ကန့်သတ်ချက် ပြည့်သွားပါပြီ',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: '320kbps ဒေါင်းလုဒ်ကန့်သတ်ချက် ပြည့်သွားပါပြီ',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'ဗီဒီယိုဖြတ်တောက်မှုကန့်သတ်ချက် ပြည့်သွားပါပြီ',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'ပလေးလစ်ဒေါင်းလုဒ်ကန့်သတ်ချက် ပြည့်သွားပါပြီ',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'ချန်နယ်ဒေါင်းလုဒ်ကန့်သတ်ချက် ပြည့်သွားပါပြီ',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'မျိုးစုံဒေါင်းလုဒ်ကန့်သတ်ချက် ပြည့်သွားပါပြီ',
    'high_quality_4k': '4K ဒေါင်းလုဒ်ကန့်သတ်ချက် ပြည့်သွားပါပြီ',
    'high_quality_2k': '2K ဒေါင်းလုဒ်ကန့်သတ်ချက် ပြည့်သွားပါပြီ',
    'high_quality_320k': '320kbps ဒေါင်းလုဒ်ကန့်သတ်ချက် ပြည့်သွားပါပြီ',
    'playlist': 'ပလေးလစ်ဒေါင်းလုဒ်ကန့်သတ်ချက် ပြည့်သွားပါပြီ',
    'channel': 'ချန်နယ်ဒေါင်းလုဒ်ကန့်သတ်ချက် ပြည့်သွားပါပြီ',
    'batch': 'မျိုးစုံဒေါင်းလုဒ်ကန့်သတ်ချက် ပြည့်သွားပါပြီ',
};

const MS_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: 'Had muat turun 4K dicapai',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: 'Had muat turun 2K dicapai',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: 'Had muat turun 320kbps dicapai',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'Had pemotongan video dicapai',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'Had muat turun senarai main dicapai',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'Had muat turun saluran dicapai',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'Had muat turun banyak video dicapai',
    'high_quality_4k': 'Had muat turun 4K dicapai',
    'high_quality_2k': 'Had muat turun 2K dicapai',
    'high_quality_320k': 'Had muat turun 320kbps dicapai',
    'playlist': 'Had muat turun senarai main dicapai',
    'channel': 'Had muat turun saluran dicapai',
    'batch': 'Had muat turun banyak video dicapai',
};

const PT_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: 'Limite de download de 4K atingido',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: 'Limite de download de 2K atingido',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: 'Limite de download de 320kbps atingido',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'Limite de corte de vídeo atingido',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'Limite de download de lista de reprodução atingido',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'Limite de download de canal atingido',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'Limite de download múltiplo atingido',
    'high_quality_4k': 'Limite de download de 4K atingido',
    'high_quality_2k': 'Limite de download de 2K atingido',
    'high_quality_320k': 'Limite de download de 320kbps atingido',
    'playlist': 'Limite de download de lista de reprodução atingido',
    'channel': 'Limite de download de canal atingido',
    'batch': 'Limite de download múltiplo atingido',
};

const RU_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: 'Лимит загрузки 4K достигнут',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: 'Лимит загрузки 2K достигнут',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: 'Лимит загрузки 320kbps достигнут',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'Лимит обрезки видео достигнут',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'Лимит загрузки плейлиста достигнут',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'Лимит загрузки канала достигнут',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'Лимит множественной загрузки достигнут',
    'high_quality_4k': 'Лимит загрузки 4K достигнут',
    'high_quality_2k': 'Лимит загрузки 2K достигнут',
    'high_quality_320k': 'Лимит загрузки 320kbps достигнут',
    'playlist': 'Лимит загрузки плейлиста достигнут',
    'channel': 'Лимит загрузки канала достигнут',
    'batch': 'Лимит множественной загрузки достигнут',
};

const TH_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: 'ขีดจำกัดการดาวน์โหลด 4K ถึงเกณฑ์แล้ว',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: 'ขีดจำกัดการดาวน์โหลด 2K ถึงเกณฑ์แล้ว',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: 'ขีดจำกัดการดาวน์โหลด 320kbps ถึงเกณฑ์แล้ว',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'ขีดจำกัดการตัดวิดีโอถึงเกณฑ์แล้ว',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'ขีดจำกัดการดาวน์โหลดเพลย์ลิสต์ถึงเกณฑ์แล้ว',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'ขีดจำกัดการดาวน์โหลดช่องถึงเกณฑ์แล้ว',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'ขีดจำกัดการดาวน์โหลดหลายวิดีโอถึงเกณฑ์แล้ว',
    'high_quality_4k': 'ขีดจำกัดการดาวน์โหลด 4K ถึงเกณฑ์แล้ว',
    'high_quality_2k': 'ขีดจำกัดการดาวน์โหลด 2K ถึงเกณฑ์แล้ว',
    'high_quality_320k': 'ขีดจำกัดการดาวน์โหลด 320kbps ถึงเกณฑ์แล้ว',
    'playlist': 'ขีดจำกัดการดาวน์โหลดเพลย์ลิสต์ถึงเกณฑ์แล้ว',
    'channel': 'ขีดจำกัดการดาวน์โหลดช่องถึงเกณฑ์แล้ว',
    'batch': 'ขีดจำกัดการดาวน์โหลดหลายวิดีโอถึงเกณฑ์แล้ว',
};

const TR_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: '4K indirme limitine ulaşıldı',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: '2K indirme limitine ulaşıldı',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: '320kbps indirme limitine ulaşıldı',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'Video kesme limitine ulaşıldı',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'Oynatma listesi indirme limitine ulaşıldı',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'Kanal indirme limitine ulaşıldı',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'Çoklu indirme limitine ulaşıldı',
    'high_quality_4k': '4K indirme limitine ulaşıldı',
    'high_quality_2k': '2K indirme limitine ulaşıldı',
    'high_quality_320k': '320kbps indirme limitine ulaşıldı',
    'playlist': 'Oynatma listesi indirme limitine ulaşıldı',
    'channel': 'Kanal indirme limitine ulaşıldı',
    'batch': 'Çoklu indirme limitine ulaşıldı',
};

const UR_LIMIT_LABELS: Readonly<Record<string, string>> = {
    [FEATURE_KEYS.HIGH_QUALITY_4K]: '4K ڈاؤن لوڈ کی حد مکمل ہو گئی ہے',
    [FEATURE_KEYS.HIGH_QUALITY_2K]: '2K ڈاؤن لوڈ کی حد مکمل ہو گئی ہے',
    [FEATURE_KEYS.HIGH_QUALITY_320K]: '320kbps ڈاؤن لوڈ کی حد مکمل ہو گئی ہے',
    [FEATURE_KEYS.CUT_VIDEO_YOUTUBE]: 'ویڈیو کٹنگ کی حد مکمل ہو گئی ہے',
    [FEATURE_KEYS.PLAYLIST_DOWNLOAD]: 'پلے لسٹ ڈاؤن لوڈ کی حد مکمل ہو گئی ہے',
    [FEATURE_KEYS.CHANNEL_DOWNLOAD]: 'چینل ڈاؤن لوڈ کی حد مکمل ہو گئی ہے',
    [FEATURE_KEYS.BATCH_DOWNLOAD]: 'ملٹی ڈاؤن لوڈ کی حد مکمل ہو گئی ہے',
    'high_quality_4k': '4K ڈاؤن لوڈ کی حد مکمل ہو گئی ہے',
    'high_quality_2k': '2K ڈاؤن لوڈ کی حد مکمل हो گئی ہے',
    'high_quality_320k': '320kbps ڈاؤن لوڈ کی حد مکمل हो گئی ہے',
    'playlist': 'پلے لسٹ ڈاؤن لوڈ کی حد مکمل ہو گئی ہے',
    'channel': 'چینل ڈاؤن لوڈ کی حد مکمل ہو گئی ہے',
    'batch': 'ملٹی ڈاؤن لوڈ کی حد مکمل ہو گئی ہے',
};

const TRANSLATIONS: Record<string, PopupMessages> = {
    vi: {
        dailyLimitLabel: 'Đã đạt giới hạn ngày',
        dailyLimitText: 'Quay lại sau',
        dailyLimitCtaTitle: 'Tải không giới hạn và mở toàn bộ tính năng',
        dailyLimitDescription: 'Mở khóa tải không giới hạn và truy cập đầy đủ tất cả tính năng.',
        dailyLimitButton: 'Mở khóa không giới hạn',
        bulkDailyLimitTitle: 'Đã đạt giới hạn ngày của Multiple Video Download',
        bulkDailyLimitDescription: 'Bạn đã dùng hết giới hạn ngày cho multiple video download. Bạn vẫn có thể tiếp tục tải từng URL đơn bên dưới.',
        continueSingleUrlButton: 'Tiếp tục tải URL đơn',
        videoLimitLabel: 'Vượt quá giới hạn video',
        videoLimitText: 'Tối đa',
        videoLimitCtaTitle: 'Tải không giới hạn và mở toàn bộ tính năng',
        videoLimitDescription: 'Mở khóa tải không giới hạn và truy cập đầy đủ tất cả tính năng.',
        videoLimitButton: 'Mở khóa không giới hạn',
        maybeLater: 'Để sau',
        maintenanceBadge: 'Bảo trì',
        maintenanceTitle: 'Tính năng đang được cập nhật',
        maintenanceDescription: 'Chúng tôi đang cập nhật tính năng này. Tạm thời, bạn có thể dùng trang tải video từng lần để tiếp tục.',
        maintenanceButton: 'Mở trang tải 1 video',
        dynamicLimitLabels: VI_LIMIT_LABELS,
        playlistInstructionLabel: 'Có phải bạn muốn tải Playlist?',
        playlistInstructionText: 'Dưới đây là hướng dẫn cách tải Playlist:',
        channelInstructionLabel: 'Có phải bạn muốn tải Channel?',
        channelInstructionText: 'Dưới đây là hướng dẫn cách tải Channel:',
        instructionStep1: 'Click vào icon <b>Cài đặt</b> ở góc dưới bên trái thanh nhập URL',
        instructionStep2Playlist: 'Bật <b>Playlist Mode</b>',
        instructionStep2Channel: 'Bật <b>Channel Mode</b>',
        gotItButton: 'Đóng'
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
        maintenanceButton: 'Start One-Time Download',
        dynamicLimitLabels: EN_LIMIT_LABELS,
        playlistInstructionLabel: 'Do you want to download a Playlist?',
        playlistInstructionText: 'Follow these instructions to download a Playlist:',
        channelInstructionLabel: 'Do you want to download a Channel?',
        channelInstructionText: 'Follow these instructions to download a Channel:',
        instructionStep1: 'Click the <b>Settings</b> icon at the bottom-left of the input',
        instructionStep2Playlist: 'Enable <b>Playlist Mode</b>',
        instructionStep2Channel: 'Enable <b>Channel Mode</b>',
        gotItButton: 'Close'
    },
    ar: {
        dailyLimitLabel: 'تم الوصول إلى الحد اليومي',
        dailyLimitText: 'عد في غضون',
        dailyLimitCtaTitle: 'تنزيلات غير محدودة والوصول لجميع الميزات',
        dailyLimitDescription: 'افتح التنزيلات غير المحدودة والوصول الكامل لجميع الميزات.',
        dailyLimitButton: 'احصل على غير محدود',
        bulkDailyLimitTitle: 'لقد وصلت إلى الحد اليومي لتنزيل مقاطع الفيديو المتعددة',
        bulkDailyLimitDescription: 'تم الوصول إلى الحد اليومي لتنزيل مقاطع الفيديو المتعددة. يمكنك الاستمرار في تنزيل روابط فردية أدناه.',
        continueSingleUrlButton: 'الاستمرار في تنزيل رابط واحد',
        videoLimitLabel: 'تم تجاوز حد الفيديو',
        videoLimitText: 'الحد الأقصى',
        videoLimitCtaTitle: 'تنزيلات غير محدودة والوصول لجميع الميزات',
        videoLimitDescription: 'افتح التنزيلات غير المحدودة والوصول الكامل لجميع الميزات.',
        videoLimitButton: 'احصل على غير محدود',
        maybeLater: 'ربما لاحقاً',
        maintenanceBadge: 'صيانة',
        maintenanceTitle: 'الميزة قيد التحديث',
        maintenanceDescription: 'نحن نقوم بتحديث هذه الميزة. في هذه الأثناء، يرجى زيارة صفحة تنزيل الفيديو الفردي للمتابعة.',
        maintenanceButton: 'بدء تنزيل لمرة واحدة',
        dynamicLimitLabels: AR_LIMIT_LABELS,
        playlistInstructionLabel: 'هل تريد تنزيل قائمة تشغيل؟',
        playlistInstructionText: 'اتبع هذه الإرشادات لتنزيل قائمة تشغيل:',
        channelInstructionLabel: 'هل تريد تنزيل قناة؟',
        channelInstructionText: 'اتبع هذه الإرشادات لتنزيل قناة:',
        instructionStep1: 'انقر فوق رمز <b>الإعدادات</b> في الركن الأيسر السفلي من الإدخال',
        instructionStep2Playlist: 'قم بتمكين <b>وضع قائمة التشغيل</b>',
        instructionStep2Channel: 'قم بتمكين <b>وضع القناة</b>',
        gotItButton: 'إغلاق'
    },
    bn: {
        dailyLimitLabel: 'দৈনিক সীমা পৌঁছে গেছে',
        dailyLimitText: 'ফিরে আসুন',
        dailyLimitCtaTitle: 'আনলিমিটেড ডাউনলোড এবং সমস্ত ফিচারে অ্যাক্সেস',
        dailyLimitDescription: 'আনলিমিটেড ডাউনলোড আনলক করুন এবং সমস্ত ফিচারে পূর্ণ অ্যাক্সেস পান।',
        dailyLimitButton: 'আনলিমিটেড পান',
        bulkDailyLimitTitle: 'আপনি একাধিক ভিডিও ডাউনলোডের দৈনিক সীমায় পৌঁছেছেন',
        bulkDailyLimitDescription: 'একাধিক ভিডিও ডাউনলোডের আপনার দৈনিক সীমা পৌঁছে গেছে। আপনি নিচে একক URL ডাউনলোড চালিয়ে যেতে পারেন।',
        continueSingleUrlButton: 'একক URL ডাউনলোড চালিয়ে যান',
        videoLimitLabel: 'ভিডিও সীমা অতিক্রম করা হয়েছে',
        videoLimitText: 'সর্বোচ্চ',
        videoLimitCtaTitle: 'আনলিমিটেড ডাউনলোড এবং সমস্ত ফিচারে অ্যাক্সেস',
        videoLimitDescription: 'আনলিমিটেড ডাউনলোড আনলک করুন এবং সমস্ত ফিচারে পূর্ণ অ্যাক্সেস পান।',
        videoLimitButton: 'আনলিমিটেড পান',
        maybeLater: 'পরে হতে পারে',
        maintenanceBadge: 'রক্ষণাবেক্ষণ',
        maintenanceTitle: 'ফিচার আপডেট করা হচ্ছে',
        maintenanceDescription: 'আমরা এই ফিচারটি আপডেট করছি। এর মধ্যে, আপনার ভিডিও ডাউনলোড করতে আমাদের ওয়ান-টাইম ভিডিও ডাউনলোড পেজে যান।',
        maintenanceButton: 'ওয়ান-টাইম ডাউনলোড শুরু করুন',
        dynamicLimitLabels: BN_LIMIT_LABELS,
        playlistInstructionLabel: 'আপনি কি প্লেলিস্ট ডাউনলোড করতে চান?',
        playlistInstructionText: 'প্লেলিস্ট ডাউনলোড করতে এই নির্দেশাবলী অনুসরণ করুন:',
        channelInstructionLabel: 'আপনি কি চ্যানেল ডাউনলোড করতে চান?',
        channelInstructionText: 'চ্যানেল ডাউনলোড করতে এই নির্দেশাবলী অনুসরণ করুন:',
        instructionStep1: 'ইনপুট বারের নিচে বাম কোণে <b>Settings</b> আইকনে ক্লিক করুন',
        instructionStep2Playlist: '<b>Playlist Mode</b> চালু করুন',
        instructionStep2Channel: '<b>Channel Mode</b> চালু করুন',
        gotItButton: 'বন্ধ করুন'
    },
    de: {
        dailyLimitLabel: 'Tageslimit erreicht',
        dailyLimitText: 'Kommen Sie wieder in',
        dailyLimitCtaTitle: 'Unbegrenzte Downloads & Zugriff auf alle Funktionen',
        dailyLimitDescription: 'Schalten Sie unbegrenzte Downloads und vollen Zugriff auf alle Funktionen frei.',
        dailyLimitButton: 'Unbegrenzt holen',
        bulkDailyLimitTitle: 'Sie haben das Tageslimit für den Mehrfach-Video-Download erreicht',
        bulkDailyLimitDescription: 'Ihr Tageslimit für den Mehrfach-Video-Download wurde erreicht. Sie können unten mit einzelnen URL-Downloads fortfahren.',
        continueSingleUrlButton: 'Einzel-URL-Download fortsetzen',
        videoLimitLabel: 'Videolimit überschritten',
        videoLimitText: 'Max',
        videoLimitCtaTitle: 'Unbegrenzte Downloads & Zugriff auf alle Funktionen',
        videoLimitDescription: 'Schalten Sie unbegrenzte Downloads und vollen Zugriff auf alle Funktionen frei.',
        videoLimitButton: 'Unbegrenzt holen',
        maybeLater: 'Vielleicht später',
        maintenanceBadge: 'Wartung',
        maintenanceTitle: 'Funktion wird aktualisiert',
        maintenanceDescription: 'Wir aktualisieren diese Funktion. In der Zwischenzeit besuchen Sie bitte unsere Seite für Einzel-Video-Downloads.',
        maintenanceButton: 'Einzel-Download starten',
        dynamicLimitLabels: DE_LIMIT_LABELS,
        playlistInstructionLabel: 'Möchten Sie eine Playlist herunterladen?',
        playlistInstructionText: 'Folgen Sie diesen Anweisungen, um eine Playlist herunterzuladen:',
        channelInstructionLabel: 'Möchten Sie einen Kanal herunterladen?',
        channelInstructionText: 'Folgen Sie diesen Anweisungen, um einen Kanal herunterzuladen:',
        instructionStep1: 'Klicken Sie auf das <b>Einstellungen</b>-Symbol unten links im Eingabefeld',
        instructionStep2Playlist: 'Aktivieren Sie den <b>Playlist-Modus</b>',
        instructionStep2Channel: 'Aktivieren Sie den <b>Kanal-Modus</b>',
        gotItButton: 'Schließen'
    },
    es: {
        dailyLimitLabel: 'Límite diario alcanzado',
        dailyLimitText: 'Regresa en',
        dailyLimitCtaTitle: 'Descargas ilimitadas y acceso a todas las funciones',
        dailyLimitDescription: 'Desbloquea descargas ilimitadas y acceso completo a todas las funciones.',
        dailyLimitButton: 'Obtener ilimitado',
        bulkDailyLimitTitle: 'Has alcanzado el límite diario para la descarga de varios vídeos',
        bulkDailyLimitDescription: 'Has alcanzado tu límite diario para la descarga de varios vídeos. Puedes continuar con las descargas de URL individuales a continuación.',
        continueSingleUrlButton: 'Continuar con descarga de URL única',
        videoLimitLabel: 'Límite de vídeo excedido',
        videoLimitText: 'Máx',
        videoLimitCtaTitle: 'Descargas ilimitadas y acceso a todas las funciones',
        videoLimitDescription: 'Desbloquea descargas ilimitadas y acceso completo a todas las funciones.',
        videoLimitButton: 'Obtener ilimitado',
        maybeLater: 'Quizás más tarde',
        maintenanceBadge: 'Mantenimiento',
        maintenanceTitle: 'La función se está actualizando',
        maintenanceDescription: 'Estamos actualizando esta función. Mientras tanto, visita nuestra página de descarga de vídeo único.',
        maintenanceButton: 'Iniciar descarga única',
        dynamicLimitLabels: ES_LIMIT_LABELS,
        playlistInstructionLabel: '¿Quieres descargar una lista de reproducción?',
        playlistInstructionText: 'Sigue estas instrucciones para descargar una lista de reproducción:',
        channelInstructionLabel: '¿Quieres descargar un canal?',
        channelInstructionText: 'Sigue estas instrucciones para descargar un canal:',
        instructionStep1: 'Haz clic en el icono de <b>Ajustes</b> en la esquina inferior izquierda de la entrada',
        instructionStep2Playlist: 'Activa el <b>Modo de lista de reproducción</b>',
        instructionStep2Channel: 'Activa el <b>Modo de canal</b>',
        gotItButton: 'Cerrar'
    },
    fr: {
        dailyLimitLabel: 'Limite quotidienne atteinte',
        dailyLimitText: 'Revenez dans',
        dailyLimitCtaTitle: 'Téléchargements illimités & accès à toutes les fonctionnalités',
        dailyLimitDescription: 'Débloquez les téléchargements illimités et l\'accès complet à toutes les fonctionnalités.',
        dailyLimitButton: 'Obtenir l\'illimité',
        bulkDailyLimitTitle: 'Vous avez atteint la limite quotidienne pour le téléchargement multiple de vidéos',
        bulkDailyLimitDescription: 'Votre limite quotidienne pour le téléchargement multiple de vidéos a été atteinte. Vous pouvez toujours continuer avec les téléchargements d\'URL uniques ci-dessous.',
        continueSingleUrlButton: 'Continuer le téléchargement d\'URL unique',
        videoLimitLabel: 'Limite de vidéo dépassée',
        videoLimitText: 'Max',
        videoLimitCtaTitle: 'Téléchargements illimités & accès à toutes les fonctionnalités',
        videoLimitDescription: 'Débloquez les téléchargements illimités et l\'accès complet à toutes les fonctionnalités.',
        videoLimitButton: 'Obtenir l\'illimité',
        maybeLater: 'Peut-être plus tard',
        maintenanceBadge: 'Maintenance',
        maintenanceTitle: 'La fonctionnalité est en cours de mise à jour',
        maintenanceDescription: 'Nous mettons à jour cette fonctionnalité. En attendant, veuillez visiter notre page de téléchargement de vidéo unique.',
        maintenanceButton: 'Démarrer le téléchargement unique',
        dynamicLimitLabels: FR_LIMIT_LABELS,
        playlistInstructionLabel: 'Voulez-vous télécharger une liste de lecture ?',
        playlistInstructionText: 'Suivez ces instructions pour télécharger une liste de lecture :',
        channelInstructionLabel: 'Voulez-vous télécharger une chaîne ?',
        channelInstructionText: 'Suivez ces instructions pour télécharger une chaîne :',
        instructionStep1: 'Cliquez sur l\'icône <b>Paramètres</b> en bas à gauche de la zone de saisie',
        instructionStep2Playlist: 'Activez le <b>Mode Liste de lecture</b>',
        instructionStep2Channel: 'Activez le <b>Mode Chaîne</b>',
        gotItButton: 'Fermer'
    },
    hi: {
        dailyLimitLabel: 'दैनिक सीमा समाप्त हो गई है',
        dailyLimitText: 'वापस आएं',
        dailyLimitCtaTitle: 'असीमित डाउनलोड और सभी सुविधाओं तक पहुँच',
        dailyLimitDescription: 'असीमित डाउनलोड और सभी सुविधाओं तक पूर्ण पहुँच अनलॉक करें।',
        dailyLimitButton: 'असीमित प्राप्त करें',
        bulkDailyLimitTitle: 'आप मल्टीपल वीडियो डाउनलोड की दैनिक सीमा तक पहुँच गए हैं',
        bulkDailyLimitDescription: 'मल्टीपल वीडियो डाउनलोड की आपकी दैनिक सीमा समाप्त हो गई है। आप नीचे एकल URL डाउनलोड जारी रख सकते हैं।',
        continueSingleUrlButton: 'एकल URL डाउनलोड जारी रखें',
        videoLimitLabel: 'वीडियो सीमा पार हो गई',
        videoLimitText: 'अधिकतम',
        videoLimitCtaTitle: 'असीमित डाउनलोड और सभी सुविधाओं तक पहुँच',
        videoLimitDescription: 'असीमित डाउनलोड और सभी सुविधाओं तक पूर्ण पहुँच अनलॉक करें।',
        videoLimitButton: 'असीमित प्राप्त करें',
        maybeLater: 'फिर कभी',
        maintenanceBadge: 'رکھرکھاؤ',
        maintenanceTitle: 'सुविधा अपडेट की जा रही है',
        maintenanceDescription: 'हम इस सुविधा को अपडेट कर रहे हैं। इस बीच, कृपया अपना वीडियो डाउनलोड करने के लिए हमारे वन-टाइम वीडियो डाउनलोड पेज पर जाएं।',
        maintenanceButton: 'वन-टाइम डाउनलोड शुरू करें',
        dynamicLimitLabels: HI_LIMIT_LABELS,
        playlistInstructionLabel: 'क्या आप प्लेलिस्ट डाउनलोड करना चाहते हैं?',
        playlistInstructionText: 'प्लेलिस्ट डाउनलोड करने के लिए इन निर्देशों का पालन करें:',
        channelInstructionLabel: 'क्या आप चैनल डाउनलोड करना चाहते हैं?',
        channelInstructionText: 'चैनल डाउनलोड करने के लिए इन निर्देशों का पालन करें:',
        instructionStep1: 'इनपुट के नीचे बाईं ओर <b>Settings</b> आइकन पर क्लिक करें',
        instructionStep2Playlist: '<b>Playlist Mode</b> सक्षम करें',
        instructionStep2Channel: '<b>Channel Mode</b> सक्षम करें',
        gotItButton: 'बंद करें'
    },
    id: {
        dailyLimitLabel: 'Batas Harian Tercapai',
        dailyLimitText: 'Kembali lagi dalam',
        dailyLimitCtaTitle: 'Unduhan Tanpa Batas & Akses Semua Fitur',
        dailyLimitDescription: 'Buka unduhan tanpa batas dan akses penuh ke semua fitur.',
        dailyLimitButton: 'Dapatkan Tanpa Batas',
        bulkDailyLimitTitle: 'Anda telah mencapai batas harian untuk Pengunduhan Banyak Video',
        bulkDailyLimitDescription: 'Batas harian Anda untuk pengunduhan banyak video telah tercapai. Anda masih dapat melanjutkan dengan unduhan URL tunggal di bawah ini.',
        continueSingleUrlButton: 'Lanjutkan Unduhan URL Tunggal',
        videoLimitLabel: 'Batas Video Terlampaui',
        videoLimitText: 'Maks',
        videoLimitCtaTitle: 'Unduhan Tanpa Batas & Akses Semua Fitur',
        videoLimitDescription: 'Buka unduhan tanpa batas dan akses penuh ke semua fitur.',
        videoLimitButton: 'Dapatkan Tanpa Batas',
        maybeLater: 'Mungkin nanti',
        maintenanceBadge: 'Pemeliharaan',
        maintenanceTitle: 'Fitur sedang diperbarui',
        maintenanceDescription: 'Kami sedang memperbarui fitur ini. Untuk sementara, silakan kunjungi halaman Pengunduhan Video Sekali Pakai kami.',
        maintenanceButton: 'Mulai Unduhan Sekali Pakai',
        dynamicLimitLabels: ID_LIMIT_LABELS,
        playlistInstructionLabel: 'Ingin mengunduh Daftar Putar?',
        playlistInstructionText: 'Ikuti instruksi ini untuk mengunduh Daftar Putar:',
        channelInstructionLabel: 'Ingin mengunduh Saluran?',
        channelInstructionText: 'Ikuti instruksi ini untuk mengunduh Saluran:',
        instructionStep1: 'Klik ikon <b>Pengaturan</b> di sudut kiri bawah input',
        instructionStep2Playlist: 'Aktifkan <b>Mode Daftar Putar</b>',
        instructionStep2Channel: 'Aktifkan <b>Mode Saluran</b>',
        gotItButton: 'Tutup'
    },
    it: {
        dailyLimitLabel: 'Limite giornaliero raggiunto',
        dailyLimitText: 'Torna tra',
        dailyLimitCtaTitle: 'Download illimitati e accesso a tutte le funzioni',
        dailyLimitDescription: 'Sblocca download illimitati e l\'accesso completo a tutte le funzioni.',
        dailyLimitButton: 'Ottieni illimitato',
        bulkDailyLimitTitle: 'Hai raggiunto il limite giornaliero per il download di video multipli',
        bulkDailyLimitDescription: 'Il tuo limite giornaliero per il download di video multipli è stato raggiunto. Puoi comunque continuare con i download di URL singoli qui sotto.',
        continueSingleUrlButton: 'Continua il download di URL singolo',
        videoLimitLabel: 'Limite video superato',
        videoLimitText: 'Max',
        videoLimitCtaTitle: 'Download illimitati e accesso a tutte le funzioni',
        videoLimitDescription: 'Sblocca download illimitati e l\'accesso completo a tutte le funzioni.',
        videoLimitButton: 'Ottieni illimitato',
        maybeLater: 'Forse più tardi',
        maintenanceBadge: 'Manutenzione',
        maintenanceTitle: 'La funzione è in fase di aggiornamento',
        maintenanceDescription: 'Stiamo aggiornando questa funzione. Nel frattempo, visita la nostra pagina di download video singolo.',
        maintenanceButton: 'Avvia download singolo',
        dynamicLimitLabels: IT_LIMIT_LABELS,
        playlistInstructionLabel: 'Vuoi scaricare una Playlist?',
        playlistInstructionText: 'Segui queste istruzioni per scaricare una Playlist:',
        channelInstructionLabel: 'Vuoi scaricare un Canale?',
        channelInstructionText: 'Segui queste istruzioni per scaricare un Canale:',
        instructionStep1: 'Clicca sull\'icona <b>Impostazioni</b> in basso a sinistra dell\'input',
        instructionStep2Playlist: 'Abilita la <b>Modalità Playlist</b>',
        instructionStep2Channel: 'Abilita la <b>Modalità Canale</b>',
        gotItButton: 'Chiudi'
    },
    ja: {
        dailyLimitLabel: '1日の制限に達しました',
        dailyLimitText: '後で戻ってきてください',
        dailyLimitCtaTitle: '無制限のダウンロードとすべての機能へのアクセス',
        dailyLimitDescription: '無制限のダウンロードとすべての機能へのフルアクセスを解放します。',
        dailyLimitButton: '無制限を取得',
        bulkDailyLimitTitle: '複数動画ダウンロードの1日の制限に達しました',
        bulkDailyLimitDescription: '複数動画ダウンロードの1日の制限に達しました。以下のシングルURLダウンロードは引き続きご利用いただけます。',
        continueSingleUrlButton: 'シングルURLダウンロードを続ける',
        videoLimitLabel: '動画制限を超過しました',
        videoLimitText: '最大',
        videoLimitCtaTitle: '無制限のダウンロードとすべての機能へのアクセス',
        videoLimitDescription: '無制限のダウンロードとすべての機能へのフルアクセスを解放します。',
        videoLimitButton: '無制限を取得',
        maybeLater: '後で',
        maintenanceBadge: 'メンテナンス',
        maintenanceTitle: '機能が更新されています',
        maintenanceDescription: '現在、この機能を更新中です。その間、動画をダウンロードするには、ワンタイム動画ダウンロードページにアクセスしてください。',
        maintenanceButton: 'ワンタイムダウンロードを開始',
        dynamicLimitLabels: JA_LIMIT_LABELS,
        playlistInstructionLabel: 'プレイリストをダウンロードしますか？',
        playlistInstructionText: 'プレイリストをダウンロードするには、以下の手順に従ってください：',
        channelInstructionLabel: 'チャンネルをダウンロードしますか？',
        channelInstructionText: 'チャンネルをダウンロードするには、以下の手順に従ってください：',
        instructionStep1: '入力欄の左下にある<b>設定</b>アイコンをクリックします',
        instructionStep2Playlist: '<b>プレイリストモード</b>を有効にします',
        instructionStep2Channel: '<b>チャンネルモード</b>を有効にします',
        gotItButton: '閉じる'
    },
    ko: {
        dailyLimitLabel: '일일 한도 도달',
        dailyLimitText: '나중에 다시 오세요',
        dailyLimitCtaTitle: '무제한 다운로드 및 모든 기능 액세스',
        dailyLimitDescription: '무제한 다운로드 및 모든 기능에 대한 전체 액세스 권한을 해제하세요.',
        dailyLimitButton: '무제한 이용하기',
        bulkDailyLimitTitle: '다중 동영상 다운로드 일일 한도에 도달했습니다',
        bulkDailyLimitDescription: '다중 동영상 다운로드에 대한 일일 한도에 도달했습니다. 아래의 단일 URL 다운로드는 계속 이용하실 수 있습니다.',
        continueSingleUrlButton: '단일 URL 다운로드 계속하기',
        videoLimitLabel: '동영상 한도 초과',
        videoLimitText: '최대',
        videoLimitCtaTitle: '무제한 다운로드 및 모든 기능 액세스',
        videoLimitDescription: '무제한 다운로드 및 모든 기능에 대한 전체 액세스 권한을 해제하세요.',
        videoLimitButton: '무제한 이용하기',
        maybeLater: '나중에',
        maintenanceBadge: '유지보수',
        maintenanceTitle: '기능이 업데이트 중입니다',
        maintenanceDescription: '이 기능을 업데이트하고 있습니다. 그동안 동영상을 다운로드하려면 원타임 동영상 다운로드 페이지를 방문해 주세요.',
        maintenanceButton: '원타임 다운로드 시작',
        dynamicLimitLabels: KO_LIMIT_LABELS,
        playlistInstructionLabel: '재생목록을 다운로드하시겠습니까?',
        playlistInstructionText: '재생목록을 다운로드하려면 다음 지침을 따르세요:',
        channelInstructionLabel: '채널을 다운로드하시겠습니까?',
        channelInstructionText: '채널을 다운로드하려면 다음 지침을 따르세요:',
        instructionStep1: '입력창 왼쪽 하단의 <b>설정</b> 아이콘을 클릭하세요',
        instructionStep2Playlist: '<b>재생목록 모드</b>를 활성화하세요',
        instructionStep2Channel: '<b>채널 모드</b>를 활성화하세요',
        gotItButton: '닫기'
    },
    my: {
        dailyLimitLabel: 'နေ့စဉ်ကန့်သတ်ချက်ပြည့်သွားပါပြီ',
        dailyLimitText: 'ခေတ္တနားပြီးမှ ပြန်လာပါ',
        dailyLimitCtaTitle: 'အကန့်အသတ်မဲ့ဒေါင်းလုဒ်များနှင့် အင်္ဂါရပ်အားလုံးကို သုံးခွင့်ရယူပါ',
        dailyLimitDescription: 'အကန့်အသတ်မဲ့ဒေါင်းလုဒ်များနှင့် အင်္ဂါရပ်အားလုံးကို အပြည့်အဝသုံးခွင့်ရယူရန် ဖွင့်ပါ။',
        dailyLimitButton: 'အကန့်အသတ်မဲ့ရယူပါ',
        bulkDailyLimitTitle: 'ဗီဒီယိုအမြောက်အမြားဒေါင်းလုဒ်လုပ်ရန် နေ့စဉ်ကန့်သတ်ချက်ပြည့်သွားပါပြီ',
        bulkDailyLimitDescription: 'ဗီဒီယိုအမြောက်အမြားဒေါင်းလုဒ်လုပ်ရန် သင်၏နေ့စဉ်ကန့်သတ်ချက်ပြည့်သွားပါပြီ။ အောက်ပါ URL တစ်ခုချင်းစီဒေါင်းလုဒ်ပြုလုပ်ခြင်းကို ဆက်လက်လုပ်ဆောင်နိုင်ပါသည်။',
        continueSingleUrlButton: 'URL တစ်ခုချင်းစီဒေါင်းလုဒ်ပြုလုပ်ခြင်းကို ဆက်လုပ်ပါ',
        videoLimitLabel: 'ဗီဒီယိုကန့်သတ်ချက် ကျော်လွန်သွားပါပြီ',
        videoLimitText: 'အများဆုံး',
        videoLimitCtaTitle: 'အကန့်အသတ်မဲ့ဒေါင်းလုဒ်များနှင့် အင်္ဂါရပ်အားလုံးကို သုံးခွင့်ရယူပါ',
        videoLimitDescription: 'အကန့်အသတ်မဲ့ဒေါင်းလုဒ်များနှင့် အင်္ဂါရပ်အားလုံးကို အပြည့်အဝသုံးခွင့်ရယူရန် ဖွင့်ပါ။',
        videoLimitButton: 'အကန့်အသတ်မဲ့ရယူပါ',
        maybeLater: 'နောက်မှလုပ်ပါ',
        maintenanceBadge: 'ပြင်ဆင်နေဆဲ',
        maintenanceTitle: 'အင်္ဂါရပ်ကို အဆင့်မြှင့်တင်နေပါသည်',
        maintenanceDescription: 'ကျွန်ုပ်တို့သည် ဤအင်္ဂါရပ်ကို အဆင့်မြှင့်တင်နေပါသည်။ ထိုအတောအတွင်း သင့်ဗီဒီယိုကို ဒေါင်းလုဒ်လုပ်ရန် ကျွန်ုပ်တို့၏ တစ်ကြိမ်တည်း ဗီဒီယိုဒေါင်းလုဒ် စာမျက်နှာသို့ ဝင်ရောက်ကြည့်ရှုပါ။',
        maintenanceButton: 'တစ်ကြိမ်တည်း ဒေါင်းလုဒ်ပြုလုပ်ခြင်း စတင်ပါ',
        dynamicLimitLabels: MY_LIMIT_LABELS,
        playlistInstructionLabel: 'ပလေးလစ်ကို ဒေါင်းလုဒ်လုပ်လိုပါသလား?',
        playlistInstructionText: 'ပလေးလစ်ကို ဒေါင်းလုဒ်လုပ်ရန် ဤညွှန်ကြားချက်များကို လိုက်နာပါ -',
        channelInstructionLabel: 'ချန်နယ်ကို ဒေါင်းလုဒ်လုပ်လိုပါသလား?',
        channelInstructionText: 'ချန်နယ်ကို ဒေါင်းလုဒ်လုပ်ရန် ဤညွှန်ကြားချက်များကို လိုက်နာပါ -',
        instructionStep1: 'အဝင်ဘောက်စ်၏ ဘယ်ဘက်အောက်ထောင့်ရှိ <b>Settings</b> အိုင်ကွန်ကို နှိပ်ပါ',
        instructionStep2Playlist: '<b>Playlist Mode</b> ကို ဖွင့်ပါ',
        instructionStep2Channel: '<b>Channel Mode</b> ကို ဖွင့်ပါ',
        gotItButton: 'ပိတ်ရန်'
    },
    ms: {
        dailyLimitLabel: 'Had Harian Dicapai',
        dailyLimitText: 'Kembali semula dalam',
        dailyLimitCtaTitle: 'Muat Turun Tanpa Had & Akses Semua Ciri',
        dailyLimitDescription: 'Buka muat turun tanpa had dan akses penuh ke semua ciri.',
        dailyLimitButton: 'Dapatkan Tanpa Had',
        bulkDailyLimitTitle: 'Anda telah mencapai had harian untuk Muat Turun Pelbagai Video',
        bulkDailyLimitDescription: 'Had harian anda untuk muat turun pelbagai video telah dicapai. Anda masih boleh meneruskan muat turun URL tunggal di bawah.',
        continueSingleUrlButton: 'Teruskan Muat Turun URL Tunggal',
        videoLimitLabel: 'Had Video Dilampaui',
        videoLimitText: 'Maks',
        videoLimitCtaTitle: 'Muat Turun Tanpa Had & Akses Semua Ciri',
        videoLimitDescription: 'Buka muat turun tanpa had dan akses penuh ke semua ciri.',
        videoLimitButton: 'Dapatkan Tanpa Had',
        maybeLater: 'Mungkin kemudian',
        maintenanceBadge: 'Penyelenggaraan',
        maintenanceTitle: 'Ciri sedang dikemas kini',
        maintenanceDescription: 'Kami sedang mengemas kini ciri ini. Sementara itu, sila layari halaman Muat Turun Video Sekali Sahaja kami.',
        maintenanceButton: 'Mulakan Muat Turun Sekali Sahaja',
        dynamicLimitLabels: MS_LIMIT_LABELS,
        playlistInstructionLabel: 'Ingin memuat turun Senarai Main?',
        playlistInstructionText: 'Ikuti arahan ini untuk memuat turun Senarai Main:',
        channelInstructionLabel: 'Ingin memuat turun Saluran?',
        channelInstructionText: 'Ikuti arahan ini untuk memuat turun Saluran:',
        instructionStep1: 'Klik ikon <b>Tetapan</b> di sudut kiri bawah input',
        instructionStep2Playlist: 'Dayakan <b>Mod Senarai Main</b>',
        instructionStep2Channel: 'Dayakan <b>Mod Saluran</b>',
        gotItButton: 'Tutup'
    },
    pt: {
        dailyLimitLabel: 'Limite diário atingido',
        dailyLimitText: 'Volte em',
        dailyLimitCtaTitle: 'Downloads ilimitados e acesso a todos os recursos',
        dailyLimitDescription: 'Desbloqueie downloads ilimitados e acesso total a todos os recursos.',
        dailyLimitButton: 'Obter ilimitado',
        bulkDailyLimitTitle: 'Você atingiu o limite diário para download de vários vídeos',
        bulkDailyLimitDescription: 'Seu limite diário para download de vários vídeos foi atingido. Você ainda pode continuar com downloads de URL única abaixo.',
        continueSingleUrlButton: 'Continuar download de URL única',
        videoLimitLabel: 'Limite de vídeo excedido',
        videoLimitText: 'Máx',
        videoLimitCtaTitle: 'Downloads ilimitados e acesso a todos os recursos',
        videoLimitDescription: 'Desbloqueie downloads ilimitados e acesso total a todos os recursos.',
        videoLimitButton: 'Obter ilimitado',
        maybeLater: 'Talvez mais tarde',
        maintenanceBadge: 'Manutenção',
        maintenanceTitle: 'O recurso está sendo atualizado',
        maintenanceDescription: 'Estamos atualizando este recurso. Enquanto isso, visite nossa página de download de vídeo único.',
        maintenanceButton: 'Iniciar download único',
        dynamicLimitLabels: PT_LIMIT_LABELS,
        playlistInstructionLabel: 'Quer baixar uma lista de reprodução?',
        playlistInstructionText: 'Siga estas instruções para baixar uma lista de reprodução:',
        channelInstructionLabel: 'Quer baixar um canal?',
        channelInstructionText: 'Siga estas instruções para baixar um canal:',
        instructionStep1: 'Clique no ícone de <b>Configurações</b> no canto inferior esquerdo da entrada',
        instructionStep2Playlist: 'Ative o <b>Modo de Lista de Reprodução</b>',
        instructionStep2Channel: 'Ative o <b>Modo de Canal</b>',
        gotItButton: 'Fechar'
    },
    ru: {
        dailyLimitLabel: 'Дневной лимит достигнут',
        dailyLimitText: 'Вернитесь через',
        dailyLimitCtaTitle: 'Безлимитные загрузки и доступ ко всем функциям',
        dailyLimitDescription: 'Разблокируйте безлимитные загрузки и полный доступ ко всем функциям.',
        dailyLimitButton: 'Получить безлимит',
        bulkDailyLimitTitle: 'Вы достигли дневного лимита по одновременной загрузке нескольких видео',
        bulkDailyLimitDescription: 'Ваш дневной лимит на загрузку нескольких видео исчерпан. Вы можете продолжить скачивание по одной ссылке ниже.',
        continueSingleUrlButton: 'Продолжить скачивание по одной ссылке',
        videoLimitLabel: 'Лимит видео превышен',
        videoLimitText: 'Макс',
        videoLimitCtaTitle: 'Безлимитные загрузки и доступ ко всем функциям',
        videoLimitDescription: 'Разблокируйте безлимитные загрузки и полный доступ ко всем функциям.',
        videoLimitButton: 'Получить безлимит',
        maybeLater: 'Может позже',
        maintenanceBadge: 'Техзаблуживание',
        maintenanceTitle: 'Функция обновляется',
        maintenanceDescription: 'Мы обновляем эту функцию. Пока что воспользуйтесь нашей страницей для разовой загрузки видео.',
        maintenanceButton: 'Начать разовую загрузку',
        dynamicLimitLabels: RU_LIMIT_LABELS,
        playlistInstructionLabel: 'Хотите скачать плейлист?',
        playlistInstructionText: 'Следуйте этим инструкциям, чтобы скачать плейлист:',
        channelInstructionLabel: 'Хотите скачать канал?',
        channelInstructionText: 'Следуйте этим инструкциям, чтобы скачать канал:',
        instructionStep1: 'Нажмите на иконку <b>Настройки</b> в левом нижнем углу ввода',
        instructionStep2Playlist: 'Включите <b>Режим плейлиста</b>',
        instructionStep2Channel: 'Включите <b>Режим канала</b>',
        gotItButton: 'Закрыть'
    },
    th: {
        dailyLimitLabel: 'ขีดจำกัดรายวันถึงเกณฑ์แล้ว',
        dailyLimitText: 'กลับมาใหม่ในอีก',
        dailyLimitCtaTitle: 'ดาวน์โหลดไม่จำกัดและเข้าถึงทุกฟีเจอร์',
        dailyLimitDescription: 'ปลดล็อกการดาวน์โหลดไม่จำกัดและเข้าถึงฟีเจอร์ทั้งหมดได้อย่างเต็มที่',
        dailyLimitButton: 'รับแบบไม่จำกัด',
        bulkDailyLimitTitle: 'คุณใช้งานเกินขีดจำกัดรายวันสำหรับการดาวน์โหลดหลายวิดีโอแล้ว',
        bulkDailyLimitDescription: 'ขีดจำกัดรายวันสำหรับการดาวน์โหลดหลายวิดีโอของคุณมาถึงแล้ว คุณยังสามารถดาวน์โหลดแบบ URL เดียวต่อได้ที่ด้านล่าง',
        continueSingleUrlButton: 'ดาวน์โหลดแบบ URL เดียวต่อ',
        videoLimitLabel: 'เกินขีดจำกัดจำนวนวิดีโอ',
        videoLimitText: 'สูงสุด',
        videoLimitCtaTitle: 'ดาวน์โหลดไม่จำกัดและเข้าถึงทุกฟีเจอร์',
        videoLimitDescription: 'ปลดล็อกการดาวน์โหลดไม่จำกัดและเข้าถึงฟีเจอร์ทั้งหมดได้อย่างเต็มที่',
        videoLimitButton: 'รับแบบไม่จำกัด',
        maybeLater: 'ไว้วันหลัง',
        maintenanceBadge: 'การบำรุงรักษา',
        maintenanceTitle: 'กำลังอัปเดตฟีเจอร์',
        maintenanceDescription: 'เรากำลังอัปเดตฟีเจอร์นี้ ในระหว่างนี้ โปรดไปที่หน้าดาวน์โหลดวิดีโอแบบครั้งเดียวเพื่อทำการดาวน์โหลดต่อ',
        maintenanceButton: 'เริ่มการดาวน์โหลดแบบครั้งเดียว',
        dynamicLimitLabels: TH_LIMIT_LABELS,
        playlistInstructionLabel: 'คุณต้องการดาวน์โหลดเพลย์ลิสต์ใช่หรือไม่?',
        playlistInstructionText: 'ทำตามคำแนะนำเหล่านี้เพื่อดาวน์โหลดเพลย์ลิสต์:',
        channelInstructionLabel: 'คุณต้องการดาวน์โหลดช่องใช่หรือไม่?',
        channelInstructionText: 'ทำตามคำแนะนำเหล่านี้เพื่อดาวน์โหลดช่อง:',
        instructionStep1: 'คลิกไอคอน <b>การตั้งค่า</b> ที่มุมล่างซ้ายของช่องใส่ URL',
        instructionStep2Playlist: 'เปิดใช้งาน <b>โหมดเพลย์ลิสต์</b>',
        instructionStep2Channel: 'เปิดใช้งาน <b>โหมดช่อง</b>',
        gotItButton: 'ปิด'
    },
    tr: {
        dailyLimitLabel: 'Günlük Limite Ulaşıldı',
        dailyLimitText: 'Şu kadar süre sonra dönün:',
        dailyLimitCtaTitle: 'Sınırsız İndirme ve Tüm Özelliklere Erişim',
        dailyLimitDescription: 'Sınırsız indirmeyi başlatın ve tüm özelliklere tam erişim sağlayın.',
        dailyLimitButton: 'Sınırsız Al',
        bulkDailyLimitTitle: 'Çoklu Video İndirme için günlük limite ulaştınız',
        bulkDailyLimitDescription: 'Çoklu video indirme için günlük limitiniz doldu. Aşağıdan tekli URL indirmelerine devam edebilirsiniz.',
        continueSingleUrlButton: 'Tekli URL İndirmeye Devam Et',
        videoLimitLabel: 'Video Limiti Aşıldı',
        videoLimitText: 'Maks',
        videoLimitCtaTitle: 'Sınırsız İndirme ve Tüm Özelliklere Erişim',
        videoLimitDescription: 'Sınırsız indirmeyi başlatın ve tüm özelliklere tam erişim sağlayın.',
        videoLimitButton: 'Sınırsız Al',
        maybeLater: 'Belki sonra',
        maintenanceBadge: 'Bakım',
        maintenanceTitle: 'Özellik güncelleniyor',
        maintenanceDescription: 'Bu özelliği güncelliyoruz. Bu sırada, videonuzu indirmek için lütfen Tek Seferlik Video İndirme sayfamızı ziyaret edin.',
        maintenanceButton: 'Tek Seferlik İndirmeyi Başlat',
        dynamicLimitLabels: TR_LIMIT_LABELS,
        playlistInstructionLabel: 'Bir oynatma listesi mi indirmek istiyorsunuz?',
        playlistInstructionText: 'Oynatma listesi indirmek için bu talimatları izleyin:',
        channelInstructionLabel: 'Bir kanal mı indirmek istiyorsunuz?',
        channelInstructionText: 'Kanal indirmek için bu talimatları izleyin:',
        instructionStep1: 'Giriş alanının sol alt köşesindeki <b>Ayarlar</b> simgesine tıklayın',
        instructionStep2Playlist: '<b>Oynatma Listesi Modunu</b> etkinleştirin',
        instructionStep2Channel: '<b>Kanal Modunu</b> etkinleştirin',
        gotItButton: 'Kapat'
    },
    ur: {
        dailyLimitLabel: 'روزانہ کی حد مکمل ہو گئی ہے',
        dailyLimitText: 'دوبارہ آئیں',
        dailyLimitCtaTitle: 'لامحدود ڈاؤن لوڈز اور تمام خصوصیات تک رسائی',
        dailyLimitDescription: 'لامحدود ڈاؤن لوڈز اور تمام خصوصیات تک مکمل رسائی ان لاک کریں۔',
        dailyLimitButton: 'لامحدود حاصل کریں',
        bulkDailyLimitTitle: 'آپ بیک وقت کئی ویڈیوز ڈاؤن لوڈ کرنے کی روزانہ کی حد تک پہنچ گئے ہیں',
        bulkDailyLimitDescription: 'کئی ویڈیوز ڈاؤن لوڈ کرنے کی آپ کی روزانہ کی حد ختم ہو گئی ہے۔ آپ نیچے ایک ایک کر کے ڈاؤن لوڈ جاری رکھ سکتے ہیں۔',
        continueSingleUrlButton: 'ایک ایک کر کے ڈاؤن لوڈ جاری رکھیں',
        videoLimitLabel: 'ویڈیو کی حد تجاوز کر گئی ہے',
        videoLimitText: 'زیادہ سے زیادہ',
        videoLimitCtaTitle: 'لامحدود ڈاؤن لوڈز اور تمام خصوصیات تک رسائی',
        videoLimitDescription: 'لامحدود ڈاؤن لوڈز اور تمام خصوصیات تک مکمل رسائی ان لاک کریں۔',
        videoLimitButton: 'لامحدود حاصل کریں',
        maybeLater: 'شاید بعد میں',
        maintenanceBadge: 'دیکھ بھال',
        maintenanceTitle: 'خصوصیت کو اپ ڈیٹ کیا جا رہا ہے',
        maintenanceDescription: 'ہم اس خصوصیت کو اپ ڈیٹ کر رہے ہیں۔ اس دورانیے میں، اپنی ویڈیو ڈاؤن لوڈ کرنے کے لیے براہ کرم ہمارے ون-ٹائم ویڈیو ڈاؤن لوڈ پیج پر جائیں۔',
        maintenanceButton: 'ون-ٹائم ڈاؤن لوڈ شروع کریں',
        dynamicLimitLabels: UR_LIMIT_LABELS,
        playlistInstructionLabel: 'کیا آپ پلے لسٹ ڈاؤن لوڈ کرنا چاہتے ہیں؟',
        playlistInstructionText: 'پلے لسٹ ڈاؤن لوڈ کرنے کے لیے ان ہدایات پر عمل کریں:',
        channelInstructionLabel: 'کیا آپ چینل ڈاؤن لوڈ کرنا چاہتے ہیں؟',
        channelInstructionText: 'چینل ڈاؤن لوڈ کرنے کے لیے ان ہدایات پر عمل کریں:',
        instructionStep1: 'ان پٹ کے نیچے بائیں کونے میں <b>Settings</b> آئیکن پر کلک کریں',
        instructionStep2Playlist: '<b>Playlist Mode</b> کو فعال کریں',
        instructionStep2Channel: '<b>Channel Mode</b> کو فعال کریں',
        gotItButton: 'بند کریں'
    },
};

function getMessages(): PopupMessages {
    const lang = document.documentElement.lang?.toLowerCase() || 'en';
    return TRANSLATIONS[lang] || TRANSLATIONS[lang.split('-')[0]] || TRANSLATIONS.en;
}

function getSecondsUntilNextMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

function formatCountdown(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.max(0, totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function closeOverlay(overlay: HTMLElement, box: HTMLElement, tickerId?: number): void {
    if (typeof tickerId === 'number') {
        window.clearInterval(tickerId);
    }
    overlay.classList.remove('is-visible');
    box.classList.remove('is-visible');
    window.setTimeout(() => overlay.remove(), 250);
}

function mountPopup(
    overlayId: string,
    kind: PopupKind,
    boxHtml: string,
    config: MaintenancePopupConfig,
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
        config.logEvent?.(`${kind}_popup_overlay_click`, { popup: kind });
        closeOverlay(overlay, box, tickerId);
    });

    const closeButton = box.querySelector('[data-popup-close]');
    closeButton?.addEventListener('click', () => {
        config.logEvent?.(`${kind}_popup_close_click`, { popup: kind, action: 'maybe_later' });
        closeOverlay(overlay, box, tickerId);
    });

    const actionButtons = Array.from(box.querySelectorAll<HTMLElement>('[data-popup-action]'));
    actionButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const action = button.getAttribute('data-popup-action') || 'cta';
            config.logEvent?.(`${kind}_popup_action_click`, { popup: kind, action });
            closeOverlay(overlay, box, tickerId);
        });
    });
}

const LIMIT_MODE_LABELS: Record<string, string> = {
    batch: 'Multi Download',
    playlist: 'Playlist Download',
    channel: 'Channel Download',
    trim: 'Trim/Cut',
    high_quality_4k: '4K Download',
    high_quality_2k: '2K Download',
    high_quality_320k: '320kbps Download',
};

export function showLimitReachedPopup(_config: MaintenancePopupConfig, mode?: string, dailyLimit?: number): void {
    const label = mode ? LIMIT_MODE_LABELS[mode] || mode : undefined;
    const title = label && typeof dailyLimit === 'number'
        ? `${label} Limit: ${dailyLimit}/day`
        : label
            ? `${label} Limit Reached`
            : 'Daily Limit Reached';
    // @ts-ignore — runtime CDN module
    import('https://media.ytmp3.gg/poppurchase.v3.js?v=11').then((m: any) => m.show(mode || undefined, { title }));
}

export function showVideoLimitPopup(_config: MaintenancePopupConfig, maxVideos = 10): void {
    // @ts-ignore — runtime CDN module
    import('https://media.ytmp3.gg/poppurchase.v3.js?v=11').then((m: any) => m.show('none_title', { title: `Limit ${maxVideos} items per convert`, noCountdown: true }));
}

export function showMaintenancePopup(_config: MaintenancePopupConfig): void {
    // @ts-ignore — runtime CDN module
    import('https://media.ytmp3.gg/poppurchase.v3.js?v=11').then((m: any) => m.show('maintenance'));
}

export function showSupporterUpsellPopup(_config: MaintenancePopupConfig): void {
    // @ts-ignore — runtime CDN module
    import('https://media.ytmp3.gg/poppurchase.v3.js?v=11').then((m: any) => m.show());
}

export function showPlaylistInstructionPopup(config: MaintenancePopupConfig): void {
    const t = getMessages();

    mountPopup(
        'playlist-instruction-overlay',
        'instruction',
        `
            <div class="maintenance-popup-hero-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" fill="none" viewBox="0 0 24 24" stroke="#f97316" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
            </div>
            <h3 class="maintenance-popup-title">${t.playlistInstructionLabel}</h3>
            <p class="maintenance-popup-description">${t.playlistInstructionText}</p>
            
            <div style="background: rgba(120, 120, 120, 0.05); padding: 16px; border-radius: 8px; margin: 20px 0; display: flex; flex-direction: column; gap: 12px; border: 1px solid rgba(120, 120, 120, 0.2); text-align: left;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: rgba(120, 120, 120, 0.15); border-radius: 50%; color: inherit; flex-shrink: 0;">
                        <span style="font-weight: 700; font-size: 13px;">1</span>
                    </div>
                    <span style="font-size: 14.5px; opacity: 0.9; margin-top: 1px;">${t.instructionStep1}</span>
                    <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; margin-left: auto; flex-shrink: 0;">
                        <svg class="adv-settings-icon" width="20" height="20" viewBox="0 0 20 20" fill="#333" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="flex-shrink: 0;"><path d="M10.5488 2C11.3503 2 12 2.64973 12 3.45117C12 3.64554 12.1376 3.85418 12.3848 3.95215C12.4534 3.97933 12.5215 4.00769 12.5889 4.03711L12.6797 4.06934C12.8914 4.12916 13.094 4.07583 13.2148 3.95508C13.7824 3.38817 14.7023 3.38882 15.2695 3.95605L16.0439 4.73047L16.1436 4.84082C16.6091 5.41137 16.5761 6.25346 16.0439 6.78516C15.9061 6.92297 15.8568 7.16748 15.9629 7.41016L16.0479 7.61523L16.0898 7.70215C16.1981 7.8943 16.3787 7.99998 16.5488 8C17.3503 8 18 8.64973 18 9.45117V10.5488C18 11.3503 17.3503 12 16.5488 12C16.3787 12 16.1982 12.1057 16.0898 12.2979L16.0479 12.3848C16.0206 12.4533 15.9923 12.5216 15.9629 12.5889C15.8567 12.8317 15.9059 13.0768 16.0439 13.2148C16.6113 13.7823 16.6113 14.7021 16.0439 15.2695L15.2695 16.0439C14.7021 16.6113 13.7823 16.6113 13.2148 16.0439C13.0941 15.9232 12.8914 15.87 12.6797 15.9297L12.5889 15.9629C12.5219 15.9921 12.4539 16.0198 12.3857 16.0469C12.1385 16.1449 12.0002 16.3534 12 16.5479C12 17.3496 11.3496 18 10.5479 18H9.45215C8.6504 18 8 17.3496 8 16.5479C7.99981 16.3776 7.89419 16.1969 7.70215 16.0889L7.61523 16.0469C7.5465 16.0197 7.4777 15.9914 7.41016 15.9619C7.16721 15.8561 6.92289 15.9062 6.78516 16.0439C6.25346 16.5761 5.41137 16.6091 4.84082 16.1436L4.73047 16.0439L3.95605 15.2695C3.38882 14.7023 3.38817 13.7824 3.95508 13.2148L4.00293 13.1582C4.089 13.0359 4.1206 12.8611 4.06934 12.6797L4.03711 12.5889C4.00769 12.5215 3.97933 12.4534 3.95215 12.3848C3.85418 12.1376 3.64554 12 3.45117 12C2.64973 12 2 11.3503 2 10.5488V9.45117C2 8.64973 2.64973 8 3.45117 8C3.64551 7.99998 3.85336 7.86221 3.95117 7.61523L4.03711 7.41016L4.06934 7.31934C4.12058 7.13786 4.0891 6.963 4.00293 6.84082L3.95508 6.78516C3.38796 6.21804 3.38796 5.29759 3.95508 4.73047L4.73047 3.95508L4.84082 3.85547C5.41121 3.39018 6.25345 3.42338 6.78516 3.95508C6.92296 4.09285 7.16718 4.14308 7.41016 4.03711C7.47794 4.00754 7.54625 3.97848 7.61523 3.95117C7.86221 3.85336 7.99998 3.64551 8 3.45117C8 2.64973 8.64973 2 9.45117 2H10.5488ZM9.45117 3C9.20202 3 9 3.20202 9 3.45117C8.99998 4.12476 8.54338 4.66017 7.9834 4.88184C7.92515 4.9049 7.86686 4.92814 7.80957 4.95312C7.25608 5.19449 6.55378 5.13969 6.07715 4.66309C5.92261 4.50854 5.68432 4.48855 5.50879 4.60449L5.43848 4.66309L4.66309 5.43848C4.48649 5.61507 4.48649 5.90055 4.66309 6.07715C5.10986 6.52395 5.18607 7.1692 4.99512 7.7041L4.95312 7.80957C4.92814 7.86686 4.9049 7.92515 4.88184 7.9834C4.66017 8.54338 4.12476 8.99998 3.45117 9C3.20202 9 3 9.20202 3 9.45117V10.5488C3 10.798 3.20202 11 3.45117 11C4.12476 11 4.65999 11.4569 4.88184 12.0166C4.90472 12.0743 4.92834 12.1317 4.95312 12.1885C5.1948 12.7421 5.13958 13.4449 4.66309 13.9219C4.48628 14.0988 4.48621 14.3856 4.66309 14.5625L5.4375 15.3369L5.50879 15.3955C5.6843 15.5112 5.92272 15.4914 6.07715 15.3369C6.55382 14.8599 7.25685 14.8044 7.81055 15.0459C7.86752 15.0707 7.92546 15.0943 7.9834 15.1172L8.08691 15.1631C8.59842 15.4071 8.99981 15.9165 9 16.5479C9 16.7973 9.20268 17 9.45215 17H10.5479C10.7973 17 11 16.7973 11 16.5479C11.0002 15.8742 11.4568 15.3391 12.0166 15.1172C12.0743 15.0943 12.1317 15.0707 12.1885 15.0459L12.2939 15.0039C12.8292 14.8126 13.4747 14.8898 13.9219 15.3369C14.0988 15.5138 14.3856 15.5138 14.5625 15.3369L15.3369 14.5625C15.5138 14.3856 15.5138 14.0988 15.3369 13.9219C14.86 13.445 14.8046 12.7424 15.0469 12.1885C15.0718 12.1315 15.0952 12.0735 15.1182 12.0156L15.1641 11.9121C15.4084 11.4013 15.9175 11 16.5488 11C16.798 11 17 10.798 17 10.5488V9.45117C17 9.20202 16.798 9 16.5488 9C15.9172 8.99998 15.4081 8.59825 15.1641 8.08691L15.1182 7.9834L15.0459 7.81055C14.8038 7.25675 14.8599 6.55381 15.3369 6.07715C15.4914 5.92272 15.5112 5.6843 15.3955 5.50879L15.3369 5.4375L14.5625 4.66309C14.4079 4.50844 14.169 4.48878 13.9932 4.60449L13.9219 4.66309C13.4449 5.13958 12.7421 5.1948 12.1885 4.95312L12.0166 4.88184C11.4569 4.65999 11 4.12476 11 3.45117C11 3.20202 10.798 3 10.5488 3H9.45117ZM10 7C11.6569 7 13 8.34315 13 10C13 11.6569 11.6569 13 10 13C8.34315 13 7 11.6569 7 10C7 8.34315 8.34315 7 10 7ZM10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8Z"></path></svg>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: rgba(120, 120, 120, 0.15); border-radius: 50%; color: inherit; flex-shrink: 0;">
                        <span style="font-weight: 700; font-size: 13px;">2</span>
                    </div>
                    <span style="font-size: 14.5px; opacity: 0.9; margin-top: 1px;">${t.instructionStep2Playlist}</span>
                    <div class="mode-switch" aria-checked="true" style="pointer-events: none; flex-shrink: 0; margin-left: auto;">
                        <span class="mode-switch-thumb"></span>
                    </div>
                </div>
            </div>

            <button type="button" class="maintenance-popup-primary-button" style="background: var(--brand, #C65D3B);" data-popup-close>${t.gotItButton}</button>
        `,
        config
    );
}

export function showChannelInstructionPopup(config: MaintenancePopupConfig): void {
    const t = getMessages();

    mountPopup(
        'channel-instruction-overlay',
        'instruction',
        `
            <div class="maintenance-popup-hero-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" fill="none" viewBox="0 0 24 24" stroke="#f97316" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
            </div>
            <h3 class="maintenance-popup-title">${t.channelInstructionLabel}</h3>
            <p class="maintenance-popup-description">${t.channelInstructionText}</p>
            
            <div style="background: rgba(120, 120, 120, 0.05); padding: 16px; border-radius: 8px; margin: 20px 0; display: flex; flex-direction: column; gap: 12px; border: 1px solid rgba(120, 120, 120, 0.2); text-align: left;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: rgba(120, 120, 120, 0.15); border-radius: 50%; color: inherit; flex-shrink: 0;">
                        <span style="font-weight: 700; font-size: 13px;">1</span>
                    </div>
                    <span style="font-size: 14.5px; opacity: 0.9; margin-top: 1px;">${t.instructionStep1}</span>
                    <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; margin-left: auto; flex-shrink: 0;">
                        <svg class="adv-settings-icon" width="20" height="20" viewBox="0 0 20 20" fill="#333" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="flex-shrink: 0;"><path d="M10.5488 2C11.3503 2 12 2.64973 12 3.45117C12 3.64554 12.1376 3.85418 12.3848 3.95215C12.4534 3.97933 12.5215 4.00769 12.5889 4.03711L12.6797 4.06934C12.8914 4.12916 13.094 4.07583 13.2148 3.95508C13.7824 3.38817 14.7023 3.38882 15.2695 3.95605L16.0439 4.73047L16.1436 4.84082C16.6091 5.41137 16.5761 6.25346 16.0439 6.78516C15.9061 6.92297 15.8568 7.16748 15.9629 7.41016L16.0479 7.61523L16.0898 7.70215C16.1981 7.8943 16.3787 7.99998 16.5488 8C17.3503 8 18 8.64973 18 9.45117V10.5488C18 11.3503 17.3503 12 16.5488 12C16.3787 12 16.1982 12.1057 16.0898 12.2979L16.0479 12.3848C16.0206 12.4533 15.9923 12.5216 15.9629 12.5889C15.8567 12.8317 15.9059 13.0768 16.0439 13.2148C16.6113 13.7823 16.6113 14.7021 16.0439 15.2695L15.2695 16.0439C14.7021 16.6113 13.7823 16.6113 13.2148 16.0439C13.0941 15.9232 12.8914 15.87 12.6797 15.9297L12.5889 15.9629C12.5219 15.9921 12.4539 16.0198 12.3857 16.0469C12.1385 16.1449 12.0002 16.3534 12 16.5479C12 17.3496 11.3496 18 10.5479 18H9.45215C8.6504 18 8 17.3496 8 16.5479C7.99981 16.3776 7.89419 16.1969 7.70215 16.0889L7.61523 16.0469C7.5465 16.0197 7.4777 15.9914 7.41016 15.9619C7.16721 15.8561 6.92289 15.9062 6.78516 16.0439C6.25346 16.5761 5.41137 16.6091 4.84082 16.1436L4.73047 16.0439L3.95605 15.2695C3.38882 14.7023 3.38817 13.7824 3.95508 13.2148L4.00293 13.1582C4.089 13.0359 4.1206 12.8611 4.06934 12.6797L4.03711 12.5889C4.00769 12.5215 3.97933 12.4534 3.95215 12.3848C3.85418 12.1376 3.64554 12 3.45117 12C2.64973 12 2 11.3503 2 10.5488V9.45117C2 8.64973 2.64973 8 3.45117 8C3.64551 7.99998 3.85336 7.86221 3.95117 7.61523L4.03711 7.41016L4.06934 7.31934C4.12058 7.13786 4.0891 6.963 4.00293 6.84082L3.95508 6.78516C3.38796 6.21804 3.38796 5.29759 3.95508 4.73047L4.73047 3.95508L4.84082 3.85547C5.41121 3.39018 6.25345 3.42338 6.78516 3.95508C6.92296 4.09285 7.16718 4.14308 7.41016 4.03711C7.47794 4.00754 7.54625 3.97848 7.61523 3.95117C7.86221 3.85336 7.99998 3.64551 8 3.45117C8 2.64973 8.64973 2 9.45117 2H10.5488ZM9.45117 3C9.20202 3 9 3.20202 9 3.45117C8.99998 4.12476 8.54338 4.66017 7.9834 4.88184C7.92515 4.9049 7.86686 4.92814 7.80957 4.95312C7.25608 5.19449 6.55378 5.13969 6.07715 4.66309C5.92261 4.50854 5.68432 4.48855 5.50879 4.60449L5.43848 4.66309L4.66309 5.43848C4.48649 5.61507 4.48649 5.90055 4.66309 6.07715C5.10986 6.52395 5.18607 7.1692 4.99512 7.7041L4.95312 7.80957C4.92814 7.86686 4.9049 7.92515 4.88184 7.9834C4.66017 8.54338 4.12476 8.99998 3.45117 9C3.20202 9 3 9.20202 3 9.45117V10.5488C3 10.798 3.20202 11 3.45117 11C4.12476 11 4.65999 11.4569 4.88184 12.0166C4.90472 12.0743 4.92834 12.1317 4.95312 12.1885C5.1948 12.7421 5.13958 13.4449 4.66309 13.9219C4.48628 14.0988 4.48621 14.3856 4.66309 14.5625L5.4375 15.3369L5.50879 15.3955C5.6843 15.5112 5.92272 15.4914 6.07715 15.3369C6.55382 14.8599 7.25685 14.8044 7.81055 15.0459C7.86752 15.0707 7.92546 15.0943 7.9834 15.1172L8.08691 15.1631C8.59842 15.4071 8.99981 15.9165 9 16.5479C9 16.7973 9.20268 17 9.45215 17H10.5479C10.7973 17 11 16.7973 11 16.5479C11.0002 15.8742 11.4568 15.3391 12.0166 15.1172C12.0743 15.0943 12.1317 15.0707 12.1885 15.0459L12.2939 15.0039C12.8292 14.8126 13.4747 14.8898 13.9219 15.3369C14.0988 15.5138 14.3856 15.5138 14.5625 15.3369L15.3369 14.5625C15.5138 14.3856 15.5138 14.0988 15.3369 13.9219C14.86 13.445 14.8046 12.7424 15.0469 12.1885C15.0718 12.1315 15.0952 12.0735 15.1182 12.0156L15.1641 11.9121C15.4084 11.4013 15.9175 11 16.5488 11C16.798 11 17 10.798 17 10.5488V9.45117C17 9.20202 16.798 9 16.5488 9C15.9172 8.99998 15.4081 8.59825 15.1641 8.08691L15.1182 7.9834L15.0459 7.81055C14.8038 7.25675 14.8599 6.55381 15.3369 6.07715C15.4914 5.92272 15.5112 5.6843 15.3955 5.50879L15.3369 5.4375L14.5625 4.66309C14.4079 4.50844 14.169 4.48878 13.9932 4.60449L13.9219 4.66309C13.4449 5.13958 12.7421 5.1948 12.1885 4.95312L12.0166 4.88184C11.4569 4.65999 11 4.12476 11 3.45117C11 3.20202 10.798 3 10.5488 3H9.45117ZM10 7C11.6569 7 13 8.34315 13 10C13 11.6569 11.6569 13 10 13C8.34315 13 7 11.6569 7 10C7 8.34315 8.34315 7 10 7ZM10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8Z"></path></svg>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: rgba(120, 120, 120, 0.15); border-radius: 50%; color: inherit; flex-shrink: 0;">
                        <span style="font-weight: 700; font-size: 13px;">2</span>
                    </div>
                    <span style="font-size: 14.5px; opacity: 0.9; margin-top: 1px;">${t.instructionStep2Channel}</span>
                    <div class="mode-switch" aria-checked="true" style="pointer-events: none; flex-shrink: 0; margin-left: auto;">
                        <span class="mode-switch-thumb"></span>
                    </div>
                </div>
            </div>

            <button type="button" class="maintenance-popup-primary-button" style="background: var(--brand, #C65D3B);" data-popup-close>${t.gotItButton}</button>
        `,
        config
    );
}
