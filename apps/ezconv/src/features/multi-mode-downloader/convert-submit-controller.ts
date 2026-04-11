/**
 * Convert Submit Controller
 * Handles the Convert button click — reads settings snapshot and routes
 * to the correct download flow based on current mode.
 */


import { multiDownloadService } from '../downloader/logic/multiple-download/services/multi-download-service';
import { VideoItemSettings } from '../downloader/state/multiple-download-types';
import { parseConvertibleURLs, parseYouTubeURLs, normalizeURL, isChannelUrl } from '../downloader/logic/multiple-download/url-parser';
import { isPlaylistMode, isTrimMode, isChannelMode } from './advanced-settings-controller';
import { getTrimStart, getTrimEnd, getTrimRangeLabel, resetTrimEditor } from './trim-controller';
import { isMobileViewport, scrollToElementWithOffset } from '../shared/scroll/scroll-behavior';
import { checkLimit, recordStartUsage, DAILY_PLAYLIST_DOWNLOAD_LIMIT, DAILY_CHANNEL_DOWNLOAD_LIMIT } from '../download-limit';
import { evaluateFeatureAccess, type FeatureAccessResult } from '../feature-access';
import { FEATURE_KEYS } from '@downloader/core';
import { showPlaylistInstructionPopup, showChannelInstructionPopup } from '@downloader/ui-shared';
import { POPUP_CONFIG } from '../supporter-popup-config';
import { showPaywall } from '../paywall-popup';
import { incrementDownloadCount, onAfterSubmit, onReset } from '../widget-level-manager';
import { logButtonClick } from '../../libs/firebase/firebase-analytics';

const MAX_BATCH_URLS = 100; // Physical technical limit, business limit is checked via checkLimit

/** Map limit kind → paywall type */
const LIMIT_PAYWALL_MAP: Record<string, string> = {
    batch: 'download_multi',
    playlist: 'download_playlist',
    channel: 'download_channel',
    trim: 'cut_video_youtube',
    '4k': 'download_4k',
    '2k': 'download_2k',
    '320kbps': 'download_320kbps',
};

export interface ConvertFormConfig {
    getSettings: () => Partial<VideoItemSettings>;
    getTrimStart: () => number;
    getTrimEnd: () => number;
}

function dismissKeyboard(target: HTMLInputElement | HTMLTextAreaElement): void {
    window.setTimeout(() => target.blur(), 0);
}

function showPopupForLimitResult(limit: Awaited<ReturnType<typeof checkLimit>>): void {
    const paywallType = LIMIT_PAYWALL_MAP[limit.mode ?? ''] ?? 'none_title';
    showPaywall(paywallType);
}

function showPopupForAccessResult(_result: FeatureAccessResult, mode?: string, _dailyLimit?: number): void {
    const paywallType = LIMIT_PAYWALL_MAP[mode ?? ''] ?? 'none_title';
    showPaywall(paywallType);
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

        const mode = isTrimMode() ? 'trim' : isChannelMode() ? 'channel' : isPlaylistMode() ? 'playlist' : 'batch';
        const urlCount = rawText.split(/[\n\s,]+/).filter(Boolean).length;
        logButtonClick('convert_button', { mode, url_count: urlCount });

        document.dispatchEvent(new CustomEvent('multi-download:convert-click'));
        clearError(errorMessage);
        setLoading(addUrlsBtn, true);

        // Show support banner immediately on submit — don't wait for API response
        onAfterSubmit();

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
            if (proceeded) {
                isSuccess = true;
            }
        } catch (err) {
            showError(errorMessage, err instanceof Error ? err.message : 'Failed to process URLs.');
        } finally {
            // Restore input & hide banner if a limit popup was shown (no actual processing happened)
            if (!proceeded) {
                urlsInput.value = rawText;
                updateConvertButtonCount(addUrlsBtn, rawText);
                onReset();
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
        // Show skeleton while checking limit
        const skeletonGroupId = multiDownloadService.createSkeletonGroup('Multiple', parsed.length, settings);
        onItemsAdded?.();

        const limitResult = await checkLimit({
            kind: 'batch',
            itemCount: parsed.length
        });
        if (!limitResult.allowed) {
            multiDownloadService.removeGroup(skeletonGroupId);
            showPopupForLimitResult(limitResult);
            return false;
        }

        // Access allowed — remove temp skeleton and proceed with real loading
        multiDownloadService.removeGroup(skeletonGroupId);
    }

    const purePlaylistUrls = parsed.filter(p => !p.videoId && p.playlistId);
    if (purePlaylistUrls.length > 0) {
        showPlaylistInstructionPopup(POPUP_CONFIG);
        return false;
    }

    const channelUrls = parsed.filter(p => !p.videoId && isChannelUrl(p.url));
    if (channelUrls.length > 0) {
        showChannelInstructionPopup(POPUP_CONFIG);
        return false;
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

    // Show skeleton while checking access
    const skeletonGroupId = multiDownloadService.createSkeletonGroup('Playlist', 10, settings);
    onItemsAdded?.();

    const accessResult = await evaluateFeatureAccess(FEATURE_KEYS.PLAYLIST_DOWNLOAD);
    if (!accessResult.allowed) {
        multiDownloadService.removeGroup(skeletonGroupId);
        showPopupForAccessResult(accessResult, 'playlist', DAILY_PLAYLIST_DOWNLOAD_LIMIT);
        return false;
    }

    // Access allowed — record start usage and proceed
    recordStartUsage(FEATURE_KEYS.PLAYLIST_DOWNLOAD);
    multiDownloadService.removeGroup(skeletonGroupId);

    const p = parsed[0];
    if (p.playlistId) {
        const playlistUrl = `https://www.youtube.com/playlist?list=${p.playlistId}`;
        await multiDownloadService.addPlaylist(playlistUrl, settings, onItemsAdded);
    } else {
        const groupId = await multiDownloadService.addSingleVideoAsGroup(p.url, settings, onItemsAdded);
        multiDownloadService.startGroupDownloads(groupId);
    }

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

    // Show skeleton while checking access
    const skeletonGroupId = multiDownloadService.createSkeletonGroup('Channel', 10, settings);
    onItemsAdded?.();

    const accessResult = await evaluateFeatureAccess(FEATURE_KEYS.CHANNEL_DOWNLOAD);
    if (!accessResult.allowed) {
        multiDownloadService.removeGroup(skeletonGroupId);
        showPopupForAccessResult(accessResult, 'channel', DAILY_CHANNEL_DOWNLOAD_LIMIT);
        return false;
    }

    // Access allowed — record start usage and proceed
    recordStartUsage(FEATURE_KEYS.CHANNEL_DOWNLOAD);
    multiDownloadService.removeGroup(skeletonGroupId);

    await multiDownloadService.addChannel(urls[0], settings, onItemsAdded);
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

    // Show skeleton while checking limit
    const skeletonGroupId = multiDownloadService.createSkeletonGroup('Trim/Cut', 1, settings);
    onItemsAdded?.();

    const limitResult = await checkLimit({ kind: 'trim' });
    if (!limitResult.allowed) {
        multiDownloadService.removeGroup(skeletonGroupId);
        showPopupForLimitResult(limitResult);
        return false;
    }

    // Access allowed — remove temp skeleton and proceed with real loading
    multiDownloadService.removeGroup(skeletonGroupId);

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
    const isMobile = isMobileViewport();
    const target = isMobile
        ? document.querySelector('.video-list-section')
        : document.getElementById('support-banner-wrapper') || document.querySelector('.video-list-section');

    if (!target) return;

    const offset = isMobile ? 20 : 15;
    scrollToElementWithOffset(target, offset);
}
