
import { extractVideoId, extractPlaylistId, isYouTubeUrl, isPlaylistUrl } from '@downloader/core';

export interface ParsedUrl {
    url: string;
    videoId: string | null;
    playlistId: string | null;
}

function parseUrlLike(input: string): URL | null {
    const value = input.trim();
    if (!value) return null;

    try {
        return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    } catch {
        return null;
    }
}

function isGenericUrl(input: string): boolean {
    const parsed = parseUrlLike(input);
    if (!parsed) return false;

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
    }

    const host = parsed.hostname.trim();
    if (!host) return false;

    const isIpv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
    const isLocalhost = host === 'localhost';
    const hasDot = host.includes('.');

    return isIpv4 || isLocalhost || hasDot;
}

function normalizeGenericUrl(input: string): string {
    return parseUrlLike(input)?.toString() || input;
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

export function parseConvertibleURLs(inputText: string): ParsedUrl[] {
    const normalized = inputText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, ' ')
        .trim();

    const tokens = normalized.split(/[\n\s,]+/).filter(Boolean);
    const results: ParsedUrl[] = [];

    for (const token of tokens) {
        if (isYouTubeUrl(token)) {
            const videoId = extractVideoId(token);
            const playlistId = extractPlaylistId(token);

            results.push({
                url: videoId ? normalizeURL(videoId) : normalizeGenericUrl(token),
                videoId,
                playlistId,
            });
            continue;
        }

        if (!isGenericUrl(token)) {
            continue;
        }

        results.push({
            url: normalizeGenericUrl(token),
            videoId: null,
            playlistId: null,
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
