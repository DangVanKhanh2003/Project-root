
import { extractVideoId, extractPlaylistId } from '@downloader/core';

/**
 * Extract channel handle or ID from YouTube channel URLs.
 * Supports: /@handle, /channel/UCxxx, /c/name, /@handle/videos etc.
 */
export function extractChannelHandle(url: string): string | null {
    try {
        const u = new URL(url);
        if (!u.hostname.includes('youtube.com')) return null;
        const path = u.pathname;

        // /@handle or /@handle/videos
        const handleMatch = path.match(/^\/@([^/]+)/);
        if (handleMatch) return '@' + handleMatch[1];

        // /channel/UCxxxx
        const channelIdMatch = path.match(/^\/channel\/([^/]+)/);
        if (channelIdMatch) return channelIdMatch[1];

        // /c/customname
        const customMatch = path.match(/^\/c\/([^/]+)/);
        if (customMatch) return customMatch[1];

        return null;
    } catch {
        return null;
    }
}

export function isChannelUrl(url: string): boolean {
    return extractChannelHandle(url) !== null;
}

export interface ParsedUrl {
    url: string;
    videoId: string | null;
    playlistId: string | null;
}

export function parseYouTubeURLs(inputText: string): ParsedUrl[] {
    console.log('[parseYouTubeURLs] Raw input:', JSON.stringify(inputText));
    console.log('[parseYouTubeURLs] Input length:', inputText.length);

    // Normalize: replace all types of line endings and whitespace
    const normalized = inputText
        .replace(/\r\n/g, '\n')  // Windows line endings
        .replace(/\r/g, '\n')    // Old Mac line endings
        .replace(/\t/g, ' ')     // Tabs to spaces
        .trim();

    console.log('[parseYouTubeURLs] Normalized:', JSON.stringify(normalized));

    // Split by newlines, spaces, or commas (one or more)
    const tokens = normalized.split(/[\n\s,]+/).filter(Boolean);
    console.log('[parseYouTubeURLs] Tokens after split:', tokens.length, tokens);

    const results: ParsedUrl[] = [];

    for (const token of tokens) {
        const videoId = extractVideoId(token);
        const playlistId = extractPlaylistId(token);
        const normalized = normalizeURL(token);

        console.log('[parseYouTubeURLs] Token:', token, '| normalized:', normalized, '| videoId:', videoId, '| playlistId:', playlistId);

        // No URL validation - accept every non-empty token
        results.push({
            url: normalized,
            videoId,
            playlistId,
        });
    }

    return results;
}

export function normalizeURL(videoIdOrUrl: string): string {
    const value = (videoIdOrUrl || '').trim();
    if (!value) return value;

    // If it's already a full URL, extract the video ID first
    if (/^https?:\/\//i.test(value)) {
        const vid = extractVideoId(value);
        if (vid) return `https://www.youtube.com/watch?v=${vid}`;
        return value;
    }

    // Accept bare domains/links by auto-prefixing https://
    if (/^[^\s]+\.[^\s]+/.test(value)) {
        const asUrl = `https://${value}`;
        const vid = extractVideoId(asUrl);
        if (vid) return `https://www.youtube.com/watch?v=${vid}`;
        return asUrl;
    }

    // Support raw YouTube video IDs (11 chars), otherwise keep token as-is
    if (/^[A-Za-z0-9_-]{11}$/.test(value)) {
        return `https://www.youtube.com/watch?v=${value}`;
    }

    return value;
}

export function generateItemId(videoId: string | null): string {
    const base = videoId || 'item';
    const time = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 6);
    return `${base}_${time}_${rand}`;
}
