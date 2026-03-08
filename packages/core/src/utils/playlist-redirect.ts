import { extractVideoId, extractPlaylistId, isYouTubeUrl } from './youtube-url-validator';

function isChannelUrlInternal(url: string): boolean {
    try {
        const u = new URL(url);
        if (!u.hostname.includes('youtube.com')) return false;
        const path = u.pathname;
        return /^\/@[^/]+/.test(path) || /^\/channel\/[^/]+/.test(path) || /^\/c\/[^/]+/.test(path);
    } catch {
        return false;
    }
}

/**
 * Check if the given URL is a channel URL (not a video or playlist).
 */
export function shouldPromptChannelRedirect(url: string): boolean {
    return isChannelUrlInternal(url);
}

/**
 * Returns 'channel' if the URL is a channel URL,
 * 'playlist' if it's a playlist-only URL (no video ID),
 * or null if it's a normal video URL or unrecognized.
 *
 * Use this to decide whether to show a redirect popup before processing.
 */
export type UrlRedirectTarget = 'channel' | 'playlist' | null;

export function getUrlRedirectTarget(url: string): UrlRedirectTarget {
    if (isChannelUrlInternal(url)) return 'channel';
    if (shouldPromptPlaylistRedirect(url)) return 'playlist';
    return null;
}

/**
 * Check if the given URL is a playlist-only URL (has playlist ID but no video ID).
 */
export function shouldPromptPlaylistRedirect(url: string): boolean {
    const videoId = extractVideoId(url);
    const playlistId = extractPlaylistId(url);
    return !videoId && !!playlistId;
}

/**
 * Check if a batch of raw text contains at least one playlist-only URL
 * and NO video URLs at all, to prompt redirect for multi-downloader.
 */
export function shouldPromptPlaylistRedirectForMulti(rawText: string): boolean {
    const tokens = rawText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, ' ')
        .trim()
        .split(/[\n\s,]+/)
        .filter(Boolean)
        .filter(token => isYouTubeUrl(token));

    if (tokens.length === 0) return false;

    const hasVideoUrl = tokens.some(token => !!extractVideoId(token));
    const hasPlaylistOnlyUrl = tokens.some(token => !extractVideoId(token) && !!extractPlaylistId(token));

    return hasPlaylistOnlyUrl && !hasVideoUrl;
}
