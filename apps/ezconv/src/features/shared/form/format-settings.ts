/**
 * Format Settings
 * Shared format/quality read, save, and toggle functions
 * used across multi-mode, multi-downloader, and playlist-downloader pages.
 */

import { VideoItemSettings } from '../../downloader/state/multiple-download-types';

// ==========================================
// Read current settings from UI
// ==========================================

export function getCurrentSettings(): Partial<VideoItemSettings> {
    const activeFormatBtn = document.querySelector('.multi-format-toggle .multi-format-btn.active');
    const qualitySelectMp3 = document.getElementById('multi-quality-select-mp3') as HTMLSelectElement | null;
    const qualitySelectMp4 = document.getElementById('multi-quality-select-mp4') as HTMLSelectElement | null;
    const audioTrackValue = document.getElementById('multi-audio-track-value') as HTMLInputElement | null;

    const format = (activeFormatBtn?.getAttribute('data-format') || 'mp4') as 'mp3' | 'mp4';
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

    return { format, quality, audioFormat, audioBitrate, videoQuality, audioTrack };
}

// ==========================================
// Persist preferences to localStorage
// ==========================================

export function saveFormatPreferences(): void {
    try {
        const settings = getCurrentSettings();
        const audioFmt = settings.audioFormat || 'mp3';
        const prefs = {
            selectedFormat: settings.format || 'mp4',
            videoQuality: settings.videoQuality ? settings.videoQuality + 'p' : '720p',
            audioFormat: audioFmt,
            audioBitrate: audioFmt === 'mp3' ? (settings.audioBitrate || '128') : '',
            timestamp: Date.now(),
        };
        // Avoid double 'p' suffix for special containers
        if (prefs.videoQuality === 'webmp' || prefs.videoQuality === 'mkvp') {
            prefs.videoQuality = settings.videoQuality!;
        }
        localStorage.setItem('Ezconv_format_preferences', JSON.stringify(prefs));
    } catch (_) {}
}

// ==========================================
// Wire format/quality toggle listeners
// ==========================================

export function initFormatToggle(): void {
    const formatBtns = document.querySelectorAll('.multi-format-toggle .multi-format-btn');
    const qualitySelectMp3 = document.getElementById('multi-quality-select-mp3') as HTMLSelectElement | null;
    const qualitySelectMp4 = document.getElementById('multi-quality-select-mp4') as HTMLSelectElement | null;

    if (!qualitySelectMp3 || !qualitySelectMp4) return;

    formatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            formatBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.documentElement.dataset.format = btn.getAttribute('data-format') || 'mp4';
            saveFormatPreferences();
        });
    });

    qualitySelectMp3.addEventListener('change', saveFormatPreferences);
    qualitySelectMp4.addEventListener('change', saveFormatPreferences);
}
