import { extractVideoId, extractPlaylistId, isYouTubeUrl } from './youtube-url-validator';

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
