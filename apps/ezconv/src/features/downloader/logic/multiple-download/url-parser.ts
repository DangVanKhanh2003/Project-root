
import { extractVideoId, extractPlaylistId, isYouTubeUrl, isPlaylistUrl } from '@downloader/core';

export interface ParsedUrl {
    url: string;
    videoId: string | null;
    playlistId: string | null;
}

export function parseYouTubeURLs(inputText: string): ParsedUrl[] {

    // Normalize: replace all types of line endings and whitespace
    const normalized = inputText
        .replace(/\r\n/g, '\n')  // Windows line endings
        .replace(/\r/g, '\n')    // Old Mac line endings
        .replace(/\t/g, ' ')     // Tabs to spaces
        .trim();

    // Split by newlines, spaces, or commas (one or more)
    const tokens = normalized.split(/[\n\s,]+/).filter(Boolean);

    const results: ParsedUrl[] = [];

    for (const token of tokens) {
        const isValid = isYouTubeUrl(token);
        if (!isValid) continue;

        const videoId = extractVideoId(token);
        const playlistId = extractPlaylistId(token);

        // No deduplication - accept all valid URLs
        results.push({
            url: videoId ? normalizeURL(videoId) : token,
            videoId,
            playlistId,
        });
    }

    return results;
}

export function normalizeURL(videoIdOrUrl: string): string {
    // If it's already a full URL, extract the video ID first
    if (videoIdOrUrl.startsWith('http')) {
        const vid = extractVideoId(videoIdOrUrl);
        if (vid) return `https://www.youtube.com/watch?v=${vid}`;
        return videoIdOrUrl;
    }
    // Assume it's a video ID
    return `https://www.youtube.com/watch?v=${videoIdOrUrl}`;
}

export function generateItemId(videoId: string | null): string {
    const base = videoId || 'item';
    const time = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 6);
    return `${base}_${time}_${rand}`;
}
