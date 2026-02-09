
import { extractVideoId, extractPlaylistId, isYouTubeUrl, isPlaylistUrl } from '@downloader/core';

export interface ParsedUrl {
    url: string;
    videoId: string | null;
    playlistId: string | null;
}

export function parseYouTubeURLs(inputText: string): ParsedUrl[] {
    const tokens = inputText.split(/[\s,]+/).filter(Boolean);
    const seen = new Set<string>();
    const results: ParsedUrl[] = [];

    for (const token of tokens) {
        if (!isYouTubeUrl(token)) continue;

        const videoId = extractVideoId(token);
        const playlistId = extractPlaylistId(token);

        // Deduplicate by videoId
        const key = videoId || token;
        if (seen.has(key)) continue;
        seen.add(key);

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
