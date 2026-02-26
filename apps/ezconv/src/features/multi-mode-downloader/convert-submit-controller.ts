/**
 * Convert Submit Controller
 * Handles the Convert button click — reads settings snapshot and routes
 * to the correct download flow based on current mode.
 */

import { multiDownloadService } from '../downloader/logic/multiple-download/services/multi-download-service';
import { VideoItemSettings } from '../downloader/state/multiple-download-types';
import { parseYouTubeURLs, normalizeURL } from '../downloader/logic/multiple-download/url-parser';
import { isPlaylistMode, isTrimMode } from './advanced-settings-controller';
import { getTrimStart, getTrimEnd, getTrimRangeLabel, resetTrimEditor } from './trim-controller';

const MAX_BATCH_URLS = 50;

export interface ConvertFormConfig {
    getSettings: () => Partial<VideoItemSettings>;
    getTrimStart: () => number;
    getTrimEnd: () => number;
}

export function initConvertForm(config: ConvertFormConfig): void {
    const urlsInput = document.getElementById('urlsInput') as HTMLTextAreaElement | null;
    const addUrlsBtn = document.getElementById('addUrlsBtn');
    const errorMessage = document.getElementById('error-message') as HTMLElement | null;
    const successMessage = document.getElementById('success-message') as HTMLElement | null;

    if (!urlsInput || !addUrlsBtn) return;
    updateConvertButtonCount(addUrlsBtn, urlsInput.value);

    // Ctrl+Enter to submit
    urlsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            addUrlsBtn.click();
        }
    });

    // Auto-format on paste: one URL per line
    urlsInput.addEventListener('paste', () => {
        setTimeout(() => {
            clearSuccess(successMessage);
            const val = urlsInput.value;
            let formatted = val.split(/[\s,]+/).filter(Boolean).join('\n');
            if (formatted && !formatted.endsWith('\n')) formatted += '\n';
            if (formatted !== val) {
                urlsInput.value = formatted;
                urlsInput.scrollTop = urlsInput.scrollHeight;
            }
            updateConvertButtonCount(addUrlsBtn, urlsInput.value);
        }, 0);
    });
    urlsInput.addEventListener('input', () => {
        clearSuccess(successMessage);
        updateConvertButtonCount(addUrlsBtn, urlsInput.value);
    });

    addUrlsBtn.addEventListener('click', async () => {
        const rawText = urlsInput.value.trim();
        let isSuccess = false;
        let hasShownAddedSuccess = false;
        const showAddedSuccessOnce = () => {
            if (hasShownAddedSuccess) return;
            hasShownAddedSuccess = true;
            showSuccess(successMessage, 'Added to list successfully.');
        };

        if (!rawText) {
            clearSuccess(successMessage);
            showError(errorMessage, 'Please paste at least one YouTube URL.');
            return;
        }

        clearError(errorMessage);
        clearSuccess(successMessage);
        setLoading(addUrlsBtn, true);

        // Clear input immediately — don't wait for API response
        urlsInput.value = '';
        updateConvertButtonCount(addUrlsBtn, '');

        try {
            const settings = config.getSettings();

            if (isTrimMode()) {
                await handleTrimConvert(rawText, settings, showAddedSuccessOnce);
            } else if (isPlaylistMode()) {
                await handlePlaylistModeConvert(rawText, settings, showAddedSuccessOnce);
            } else {
                await handleBatchConvert(rawText, settings, showAddedSuccessOnce);
            }
            isSuccess = true;
        } catch (err) {
            clearSuccess(successMessage);
            showError(errorMessage, err instanceof Error ? err.message : 'Failed to process URLs.');
        } finally {
            if (isSuccess && isTrimMode()) {
                resetTrimEditor();
            }
            setLoading(addUrlsBtn, false);
        }
    });
}

// ==========================================
// Mode handlers
// ==========================================

async function handleBatchConvert(
    rawText: string,
    settings: Partial<VideoItemSettings>,
    onItemsAdded?: () => void
): Promise<void> {
    // In batch mode, URLs are treated as individual videos.
    // A URL like watch?v=XXX&list=PLyyy is already normalized to watch?v=XXX by parseYouTubeURLs.
    // A pure playlist URL (no v= param) cannot be treated as a single video — warn the user.
    const parsed = parseYouTubeURLs(rawText);
    if (parsed.length === 0) throw new Error('No valid YouTube URLs found.');
    if (parsed.length > MAX_BATCH_URLS) {
        throw new Error(`Multiple mode supports up to ${MAX_BATCH_URLS} URLs per convert.`);
    }

    const purePlaylistUrls = parsed.filter(p => !p.videoId && p.playlistId);
    if (purePlaylistUrls.length > 0) {
        throw new Error(
            'One or more URLs are playlist-only links (no video ID). ' +
            'Enable Playlist Mode to load them as groups.'
        );
    }

    const groupId = await multiDownloadService.addUrls(rawText, settings, onItemsAdded);
    if (groupId) {
        multiDownloadService.startGroupDownloads(groupId);
    }
}

async function handlePlaylistModeConvert(
    rawText: string,
    settings: Partial<VideoItemSettings>,
    onItemsAdded?: () => void
): Promise<void> {
    const parsed = parseYouTubeURLs(rawText);
    if (parsed.length === 0) throw new Error('No valid YouTube URLs found.');

    const playlistUrls = parsed.filter(p => !!p.playlistId);
    if (playlistUrls.length > 1) {
        throw new Error('Playlist Mode only supports 1 playlist URL at a time.');
    }

    const tasks = parsed.map(async (p) => {
        if (p.playlistId) {
            // Reconstruct a clean playlist URL - p.url was normalized to watch?v=...
            // which strips the list= param, so extractPlaylistId would fail on it.
            const playlistUrl = `https://www.youtube.com/playlist?list=${p.playlistId}`;
            await multiDownloadService.addPlaylist(playlistUrl, settings, onItemsAdded);
        } else {
            await multiDownloadService.addSingleVideoAsGroup(p.url, settings, onItemsAdded);
        }
    });

    const results = await Promise.allSettled(tasks);
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failed.length > 0) {
        const first = failed[0].reason;
        throw new Error(first instanceof Error ? first.message : 'Failed to load one or more groups.');
    }
    // Playlist mode: no auto-start - user chooses per-group via Convert Selected
}

async function handleTrimConvert(
    rawText: string,
    settings: Partial<VideoItemSettings>,
    onItemsAdded?: () => void
): Promise<void> {
    const parsed = parseYouTubeURLs(rawText);
    if (parsed.length === 0) throw new Error('No valid YouTube URLs found.');
    if (parsed.length > 1) throw new Error('Trim/Cut mode requires exactly 1 URL.');

    const p = parsed[0];
    if (!p.videoId) throw new Error('Could not extract a video ID from the URL.');

    const trimStart = getTrimStart();
    const trimEnd = getTrimEnd();

    const trimSettings: Partial<VideoItemSettings> = {
        ...settings,
        trimStart,
        trimEnd,
        trimRangeLabel: getTrimRangeLabel(),
    };

    // Normalize to canonical watch URL (strips playlist params)
    const normalizedUrl = normalizeURL(p.videoId);

    const groupId = await multiDownloadService.addUrls(normalizedUrl, trimSettings, onItemsAdded);
    if (groupId) {
        multiDownloadService.startGroupDownloads(groupId);
    }
}

// ==========================================
// UI helpers
// ==========================================

function showError(el: HTMLElement | null, msg: string): void {
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
}

function clearError(el: HTMLElement | null): void {
    if (!el) return;
    el.textContent = '';
    el.style.display = 'none';
}

function showSuccess(el: HTMLElement | null, msg: string): void {
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    window.setTimeout(() => {
        if (el.textContent === msg) {
            el.style.display = 'none';
        }
    }, 3500);
}

function clearSuccess(el: HTMLElement | null): void {
    if (!el) return;
    el.textContent = '';
    el.style.display = 'none';
}

function setLoading(btn: HTMLElement, loading: boolean): void {
    if (loading) {
        btn.classList.add('loading');
        btn.setAttribute('disabled', 'true');
    } else {
        btn.classList.remove('loading');
        btn.removeAttribute('disabled');
    }
}

function updateConvertButtonCount(btn: HTMLElement, rawText: string): void {
    const count = rawText
        .trim()
        .split(/[\n\s,]+/)
        .filter(Boolean)
        .length;

    const label = count > 0 ? `Convert (${count})` : 'Convert';
    const textNode = btn.querySelector('span');
    if (textNode) {
        textNode.textContent = label;
    } else {
        btn.textContent = label;
    }
}

