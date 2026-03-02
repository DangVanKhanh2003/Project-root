/**
 * Convert Submit Controller
 * Handles the Convert button click — reads settings snapshot and routes
 * to the correct download flow based on current mode.
 */


import { multiDownloadService } from '../downloader/logic/multiple-download/services/multi-download-service';
import { VideoItemSettings } from '../downloader/state/multiple-download-types';
import { parseConvertibleURLs, parseYouTubeURLs, normalizeURL } from '../downloader/logic/multiple-download/url-parser';
import { isPlaylistMode, isTrimMode, isChannelMode } from './advanced-settings-controller';
import { getTrimStart, getTrimEnd, getTrimRangeLabel, resetTrimEditor } from './trim-controller';
import { isMobileViewport, scrollToElementWithOffset } from '../shared/scroll/scroll-behavior';
import { checkLimit } from '../download-limit';
import { evaluateFeatureAccess, type FeatureAccessReason, type FeatureAccessResult } from '../feature-access';
import { FEATURE_KEYS, FEATURE_ACCESS_REASONS } from '@downloader/core';
import { showLimitReachedPopup, showVideoLimitPopup, showSupporterUpsellPopup } from '@downloader/ui-shared';
import { POPUP_CONFIG } from '../supporter-popup-config';
import { incrementDownloadCount } from '../widget-level-manager';

const MAX_BATCH_URLS = 100; // Physical technical limit, business limit is checked via checkLimit

export interface ConvertFormConfig {
    getSettings: () => Partial<VideoItemSettings>;
    getTrimStart: () => number;
    getTrimEnd: () => number;
}

function dismissKeyboard(target: HTMLInputElement | HTMLTextAreaElement): void {
    window.setTimeout(() => target.blur(), 0);
}

function showPopupForLimitResult(limit: Awaited<ReturnType<typeof checkLimit>>): void {
    if (limit.type === 'bulk_video_count') {
        showVideoLimitPopup(POPUP_CONFIG, limit.limit ?? undefined);
        return;
    }

    showLimitReachedPopup(POPUP_CONFIG, limit.mode ?? undefined);
}

function showPopupForAccessResult(result: FeatureAccessResult): void {
    if (result.reason === FEATURE_ACCESS_REASONS.NOT_ALLOWED || result.reason === FEATURE_ACCESS_REASONS.API_UNAVAILABLE) {
        showSupporterUpsellPopup(POPUP_CONFIG);
        return;
    }
    if (result.reason === FEATURE_ACCESS_REASONS.VIDEO_LIMIT_EXCEEDED) {
        showVideoLimitPopup(POPUP_CONFIG, result.limit ?? undefined);
        return;
    }
    showLimitReachedPopup(POPUP_CONFIG, result.limitMode ?? undefined);
}

export function initConvertForm(config: ConvertFormConfig): void {
    const urlsInput = document.getElementById('urlsInput') as HTMLTextAreaElement | null;
    const addUrlsBtn = document.getElementById('addUrlsBtn');
    const errorMessage = document.getElementById('error-message') as HTMLElement | null;

    if (!urlsInput || !addUrlsBtn) return;
    updateConvertButtonCount(addUrlsBtn, urlsInput.value);

    // Enter to submit, Ctrl+Enter to insert newline
    urlsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (e.ctrlKey || e.metaKey) {
                // Ctrl+Enter: insert a newline at cursor position
                e.preventDefault();
                const start = urlsInput.selectionStart;
                const end = urlsInput.selectionEnd;
                urlsInput.value = urlsInput.value.substring(0, start) + '\n' + urlsInput.value.substring(end);
                urlsInput.selectionStart = urlsInput.selectionEnd = start + 1;
                urlsInput.dispatchEvent(new Event('input'));
            } else {
                const hasValidUrls = isTrimMode() || isPlaylistMode()
                    ? parseYouTubeURLs(urlsInput.value).length > 0
                    : parseConvertibleURLs(urlsInput.value).length > 0;
                if (!hasValidUrls) return;
                // Enter: submit
                e.preventDefault();
                addUrlsBtn.click();
                dismissKeyboard(urlsInput);
            }
        }
    });

    // Auto-format on paste: one URL per line
    urlsInput.addEventListener('paste', () => {
        setTimeout(() => {
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
        updateConvertButtonCount(addUrlsBtn, urlsInput.value);
    });

    addUrlsBtn.addEventListener('click', async () => {
        const rawText = urlsInput.value.trim();
        let isSuccess = false;
        let hasScrolledOnFlowStart = false;

        if (!rawText) {
            showError(errorMessage, 'Please paste at least one URL.');
            return;
        }

        document.dispatchEvent(new CustomEvent('multi-download:convert-click'));
        clearError(errorMessage);
        setLoading(addUrlsBtn, true);

        // Clear input immediately — don't wait for API response
        urlsInput.value = '';
        updateConvertButtonCount(addUrlsBtn, '');

        let proceeded = true;
        try {
            const settings = config.getSettings();
            const onItemsAdded = () => {
                if (hasScrolledOnFlowStart) return;
                hasScrolledOnFlowStart = true;
                scrollAfterSuccessfulConvert();
            };

            if (isTrimMode()) {
                proceeded = await handleTrimConvert(rawText, settings, onItemsAdded);
            } else if (isChannelMode()) {
                proceeded = await handleChannelModeConvert(rawText, settings, onItemsAdded);
            } else if (isPlaylistMode()) {
                proceeded = await handlePlaylistModeConvert(rawText, settings, onItemsAdded);
            } else {
                proceeded = await handleBatchConvert(rawText, settings, onItemsAdded);
            }
            if (proceeded) isSuccess = true;
        } catch (err) {
            showError(errorMessage, err instanceof Error ? err.message : 'Failed to process URLs.');
        } finally {
            // Restore input if a limit popup was shown (no actual processing happened)
            if (!proceeded) {
                urlsInput.value = rawText;
                updateConvertButtonCount(addUrlsBtn, rawText);
            }
            if (isSuccess && isTrimMode()) {
                resetTrimEditor();
            }
            if (isSuccess && !hasScrolledOnFlowStart) {
                scrollAfterSuccessfulConvert();
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
): Promise<boolean> {
    // In batch mode, URLs are treated as individual videos.
    // YouTube watch URLs with list= are normalized to the canonical watch URL.
    // A pure playlist URL (no v= param) cannot be treated as a single video — warn the user.
    const parsed = parseConvertibleURLs(rawText);
    if (parsed.length === 0) throw new Error('No valid URLs found.');
    if (parsed.length > MAX_BATCH_URLS) {
        throw new Error(`Multiple mode supports up to ${MAX_BATCH_URLS} URLs per convert.`);
    }

    const isBulkDownload = parsed.length >= 2;

    if (isBulkDownload) {
        const limitResult = await checkLimit({
            kind: 'batch',
            itemCount: parsed.length
        });
        if (!limitResult.allowed) {
            showPopupForLimitResult(limitResult);
            return false;
        }
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
        if (isBulkDownload) {
            await incrementDownloadCount('batch', parsed.map((entry) => entry.url).join('\n'));
        }
        multiDownloadService.startGroupDownloads(groupId);
    }
    return true;
}

async function handlePlaylistModeConvert(
    rawText: string,
    settings: Partial<VideoItemSettings>,
    onItemsAdded?: () => void
): Promise<boolean> {
    const parsed = parseYouTubeURLs(rawText);
    if (parsed.length === 0) throw new Error('No valid YouTube URLs found.');
    if (parsed.length > 1) {
        throw new Error('Playlist Mode only supports 1 URL at a time.');
    }

    const accessResult = await evaluateFeatureAccess(FEATURE_KEYS.PLAYLIST_DOWNLOAD, { kind: 'playlist' });
    if (!accessResult.allowed) {
        showPopupForAccessResult(accessResult);
        return false;
    }

    const playlistUrls = parsed.filter(p => !!p.playlistId);

    const tasks = parsed.map(async (p) => {
        if (p.playlistId) {
            // Reconstruct a clean playlist URL - p.url was normalized to watch?v=...
            // which strips the list= param, so extractPlaylistId would fail on it.
            const playlistUrl = `https://www.youtube.com/playlist?list=${p.playlistId}`;
            await multiDownloadService.addPlaylist(playlistUrl, settings, onItemsAdded);
        } else {
            const groupId = await multiDownloadService.addSingleVideoAsGroup(p.url, settings, onItemsAdded);
            // In playlist mode, single-video URLs should auto-start after metadata is ready.
            multiDownloadService.startGroupDownloads(groupId);
        }
    });

    const results = await Promise.allSettled(tasks);
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failed.length > 0) {
        const first = failed[0].reason;
        throw new Error(first instanceof Error ? first.message : 'Failed to load one or more groups.');
    }

    // Successfully added playlist/single videos in playlist mode
    await incrementDownloadCount('playlist', rawText);
    // Playlist mode: no auto-start - user chooses per-group via Convert Selected
    return true;
}

async function handleChannelModeConvert(
    rawText: string,
    settings: Partial<VideoItemSettings>,
    onItemsAdded?: () => void
): Promise<boolean> {
    const urls = rawText.trim().split(/[\n\s,]+/).filter(Boolean);
    if (urls.length === 0) throw new Error('Please paste a YouTube channel URL.');
    if (urls.length > 1) throw new Error('Channel Mode only supports 1 URL at a time.');

    const accessResult = await evaluateFeatureAccess(FEATURE_KEYS.CHANNEL_DOWNLOAD, { kind: 'channel' });
    if (!accessResult.allowed) {
        showPopupForAccessResult(accessResult);
        return false;
    }

    await multiDownloadService.addChannel(urls[0], settings, onItemsAdded);
    await incrementDownloadCount('channel', rawText);
    // Channel mode: no auto-start - user chooses per-group via Convert Selected
    return true;
}

export async function handleTrimConvert(
    rawText: string,
    settings: Partial<VideoItemSettings>,
    onItemsAdded?: () => void
): Promise<boolean> {
    const parsed = parseYouTubeURLs(rawText);
    if (parsed.length === 0) throw new Error('No valid YouTube URLs found.');
    if (parsed.length > 1) throw new Error('Trim/Cut mode requires exactly 1 URL.');

    const p = parsed[0];
    if (!p.videoId) throw new Error('Could not extract a video ID from the URL.');

    const limitResult = await checkLimit({ kind: 'trim' });
    if (!limitResult.allowed) {
        showPopupForLimitResult(limitResult);
        return false;
    }

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
    return true;
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
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
}

function scrollAfterSuccessfulConvert(): void {
    const advancedPanel = document.getElementById('advanced-settings-panel');
    const advancedToggle = document.getElementById('advanced-settings-toggle');
    const isPanelOpenByHidden = !!advancedPanel && !advancedPanel.hasAttribute('hidden');
    const isPanelOpenByAria = advancedToggle?.getAttribute('aria-expanded') === 'true';
    if (!isPanelOpenByHidden && !isPanelOpenByAria) return;

    const isMobile = isMobileViewport();
    const target = isMobile
        ? document.querySelector('.video-list-section')
        : document.querySelector('#multi-download-form, .multiple-download-card');

    if (!target) return;

    const offset = isMobile ? 20 : 15;
    scrollToElementWithOffset(target, offset);
}
