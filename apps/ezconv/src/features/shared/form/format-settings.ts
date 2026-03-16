/**
 * Format Settings
 * Shared format/quality read, save, and toggle functions
 * used across multi-mode, multi-downloader, and playlist-downloader pages.
 */

import { VideoItemSettings } from '../../downloader/state/multiple-download-types';
import { autoResizeSelect } from '../../../utils/dom-utils';
import { STORAGE_KEYS } from '../../../utils/storage-keys';

// ==========================================
// Filename style preview templates
// ==========================================

const FILENAME_PREVIEWS: Record<string, { video: string; audio: string }> = {
    classic: {
        video: 'youtube_dQw4w9WgXcQ_1080p.mp4',
        audio: 'youtube_dQw4w9WgXcQ_audio.mp3',
    },
    basic: {
        video: 'Video Title - Author (1080p).mp4',
        audio: 'Video Title - Author (192k).mp3',
    },
    pretty: {
        video: 'Video Title - Author (1080p, youtube).mp4',
        audio: 'Video Title - Author (192k, youtube).mp3',
    },
    nerdy: {
        video: 'Video Title - Author (1080p, youtube, dQw4w9WgXcQ).mp4',
        audio: 'Video Title - Author (192k, youtube, dQw4w9WgXcQ).mp3',
    },
};

const QUALITY_SELECT_EXTRA_WIDTH = 30;
const MOBILE_BREAKPOINT_QUERY = '(max-width: 900px)';

// ==========================================
// Read current settings from UI
// ==========================================

export function getCurrentSettings(): Partial<VideoItemSettings> {
    const formatSelect = document.getElementById('multi-format-select') as HTMLSelectElement | null;
    const qualitySelectMp3 = document.getElementById('multi-quality-select-mp3') as HTMLSelectElement | null;
    const qualitySelectMp4 = document.getElementById('multi-quality-select-mp4') as HTMLSelectElement | null;
    const audioTrackValue = document.getElementById('multi-audio-track-value') as HTMLInputElement | null;

    const format = (formatSelect?.value || 'mp4') as 'mp3' | 'mp4';
    const audioTrack = audioTrackValue?.value || 'original';

    let quality = '720p';
    let audioFormat: string | undefined;
    let audioBitrate: string | undefined;
    let videoQuality: string | undefined;

    if (format === 'mp3' && qualitySelectMp3) {
        const val = qualitySelectMp3.value;
        if (val.includes('-')) {
            audioFormat = val.split('-')[0];
            audioBitrate = val.split('-')[1];
            quality = audioBitrate + 'kbps';
        } else {
            audioFormat = val;
            // Keep parity with per-item playlist dropdown contract:
            // non-MP3 formats are stored as audioBitrate override values.
            audioBitrate = val;
            quality = val;
        }
    } else if (qualitySelectMp4) {
        const val = qualitySelectMp4.value;
        if (val.includes('-')) {
            videoQuality = val.split('-')[1];
            quality = videoQuality + 'p';
        } else {
            videoQuality = val;
            quality = val;
        }
    }

    // Read filename style from active tab
    const activeStyleTab = document.querySelector('#filename-style-tabs .fs-tab.active') as HTMLElement | null;
    const filenameStyle = activeStyleTab?.dataset.style as VideoItemSettings['filenameStyle'] | undefined;

    // Read embed metadata from toggle
    const metadataToggle = document.getElementById('metadata-mode-toggle');
    const enableMetadata = metadataToggle ? metadataToggle.getAttribute('aria-checked') === 'true' : undefined;

    return { format, quality, audioFormat, audioBitrate, videoQuality, audioTrack, filenameStyle, enableMetadata };
}

// ==========================================
// Persist preferences to localStorage
// ==========================================

export function saveFormatPreferences(): void {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.FORMAT_PREFERENCES) || '{}') as {
            filenameStyle?: VideoItemSettings['filenameStyle'];
            enableMetadata?: boolean;
        };
        const settings = getCurrentSettings();
        const audioFmt = settings.audioFormat || 'mp3';
        const prefs = {
            selectedFormat: settings.format || 'mp4',
            videoQuality: settings.videoQuality ? settings.videoQuality + 'p' : '720p',
            audioFormat: audioFmt,
            audioBitrate: audioFmt === 'mp3' ? (settings.audioBitrate || '320') : '',
            filenameStyle: settings.filenameStyle || stored.filenameStyle || 'basic',
            enableMetadata: typeof settings.enableMetadata === 'boolean'
                ? settings.enableMetadata
                : (stored.enableMetadata === true),
            timestamp: Date.now(),
        };
        // Avoid double 'p' suffix for special containers
        if (prefs.videoQuality === 'webmp' || prefs.videoQuality === 'mkvp') {
            prefs.videoQuality = settings.videoQuality!;
        }
        localStorage.setItem(STORAGE_KEYS.FORMAT_PREFERENCES, JSON.stringify(prefs));
    } catch (_) { }
}

// ==========================================
// Update filename preview
// ==========================================

function syncFilenamePreviewVisibility(format: 'mp3' | 'mp4'): void {
    const videoRow = document.getElementById('fp-video-row');
    const audioRow = document.getElementById('fp-audio-row');
    if (videoRow) videoRow.style.display = (format === 'mp4') ? 'flex' : 'none';
    if (audioRow) audioRow.style.display = (format === 'mp3') ? 'flex' : 'none';
}

function updateFilenamePreview(style: string): void {
    const preview = FILENAME_PREVIEWS[style] || FILENAME_PREVIEWS.basic;
    const videoEl = document.getElementById('fp-video-name');
    const audioEl = document.getElementById('fp-audio-name');
    if (videoEl) videoEl.textContent = preview.video;
    if (audioEl) audioEl.textContent = preview.audio;
}

function syncQualitySelectWidth(select: HTMLSelectElement | null): void {
    if (!select) return;

    if (window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches) {
        // Let mobile CSS keep full-width behavior.
        select.style.width = '';
        return;
    }

    autoResizeSelect(select);
    const measuredWidth = parseFloat(select.style.width);
    if (Number.isFinite(measuredWidth) && measuredWidth > 0) {
        select.style.width = `${Math.ceil(measuredWidth + QUALITY_SELECT_EXTRA_WIDTH)}px`;
    }
}

function syncAllQualitySelectWidths(
    qualitySelectMp3: HTMLSelectElement | null,
    qualitySelectMp4: HTMLSelectElement | null
): void {
    syncQualitySelectWidth(qualitySelectMp3);
    syncQualitySelectWidth(qualitySelectMp4);
}

// ==========================================
// Wire format/quality toggle listeners
// ==========================================

export function initFormatToggle(): void {
    const formatSelect = document.getElementById('multi-format-select') as HTMLSelectElement | null;
    const qualitySelectMp3 = document.getElementById('multi-quality-select-mp3') as HTMLSelectElement | null;
    const qualitySelectMp4 = document.getElementById('multi-quality-select-mp4') as HTMLSelectElement | null;

    formatSelect?.addEventListener('change', () => {
        const format = (formatSelect.value || 'mp4') as 'mp3' | 'mp4';
        document.documentElement.dataset.format = format;
        syncFilenamePreviewVisibility(format);
        syncAllQualitySelectWidths(qualitySelectMp3, qualitySelectMp4);
        saveFormatPreferences();
    });

    qualitySelectMp3?.addEventListener('change', () => {
        syncQualitySelectWidth(qualitySelectMp3);
        saveFormatPreferences();
    });
    qualitySelectMp4?.addEventListener('change', () => {
        syncQualitySelectWidth(qualitySelectMp4);
        saveFormatPreferences();
    });

    // --- Filename Style tabs ---
    const styleTabs = document.querySelectorAll('#filename-style-tabs .fs-tab');
    styleTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            styleTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const style = (tab as HTMLElement).dataset.style || 'basic';
            updateFilenamePreview(style);
            saveFormatPreferences();
        });
    });

    // --- Metadata toggle ---
    const metadataToggle = document.getElementById('metadata-mode-toggle');
    if (metadataToggle) {
        metadataToggle.addEventListener('click', () => {
            const isOn = metadataToggle.getAttribute('aria-checked') === 'true';
            metadataToggle.setAttribute('aria-checked', String(!isOn));
            saveFormatPreferences();
        });
    }

    // --- Restore from localStorage ---
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.FORMAT_PREFERENCES) || '{}');

        // Restore format visibility
        if (stored.selectedFormat) {
            syncFilenamePreviewVisibility(stored.selectedFormat);
            if (formatSelect) formatSelect.value = stored.selectedFormat;
        } else {
            // Default visibility
            const currentFormat = (formatSelect?.value || 'mp4') as 'mp3' | 'mp4';
            syncFilenamePreviewVisibility(currentFormat);
        }

        // Restore filename style
        if (stored.filenameStyle && FILENAME_PREVIEWS[stored.filenameStyle]) {
            styleTabs.forEach(t => {
                t.classList.toggle('active', (t as HTMLElement).dataset.style === stored.filenameStyle);
            });
            updateFilenamePreview(stored.filenameStyle);
        }

        // Restore metadata toggle (default OFF)
        if (metadataToggle) {
            if (typeof stored.enableMetadata === 'boolean') {
                metadataToggle.setAttribute('aria-checked', String(stored.enableMetadata));
            } else {
                metadataToggle.setAttribute('aria-checked', 'false');
            }
        }
    } catch (_) { }

    syncAllQualitySelectWidths(qualitySelectMp3, qualitySelectMp4);

    let rafId = 0;
    window.addEventListener('resize', () => {
        if (rafId) {
            cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(() => {
            syncAllQualitySelectWidths(qualitySelectMp3, qualitySelectMp4);
            rafId = 0;
        });
    });
}
