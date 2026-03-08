import { api } from '../../../../../api';
import { apiLogger } from '../../../../../libs/api-logger/api-logger';
import { extractPlaylistId, extractVideoId, isPlaylistUrl, PlaylistDto, isYouTubeUrl } from '@downloader/core';
import { getYtMetaBaseUrl } from '../../../../../environment';
import { videoStore } from '../../../state/video-store';
import { VideoItem, VideoItemSettings } from '../../../state/multiple-download-types';
import { VideoMeta } from '../../../state/types';
import { DownloadQueue } from '../download-queue';
import { runSingleDownload } from '../download-runner';
import { fetchMetadataBatch } from '../metadata-fetcher';
import { parseYouTubeURLs, generateItemId, normalizeURL } from '../url-parser';

export class MultiDownloadService {
    private queue = new DownloadQueue(5);

    // ==========================================
    // Add URLs (batch mode)
    // ==========================================

    async addUrls(rawText: string, globalSettings?: Partial<VideoItemSettings>): Promise<void> {
        const parsed = parseYouTubeURLs(rawText);
        console.log('[MultiDownloadService] Parsed URLs:', parsed.length, parsed);

        if (parsed.length === 0) return;

        // No deduplication - accept all URLs
        console.log('[MultiDownloadService] Adding all URLs:', parsed.length);

        // 1. Create skeleton items
        const newItems: VideoItem[] = parsed.map(p => ({
            id: generateItemId(p.videoId),
            url: p.url,
            meta: {
                title: 'Loading...',
                originalUrl: p.url,
                status: 'analyzing',
                author: '',
                thumbnail: '',
                duration: 0,
                url: p.url,
                vid: p.videoId || '',
                source: p.videoId ? 'youtube' : 'url',
                isFakeData: true,
            },
            status: 'fetching_metadata' as const,
            progress: 0,
            settings: {
                format: globalSettings?.format || 'mp4',
                quality: globalSettings?.quality || '720p',
                audioFormat: globalSettings?.audioFormat,
                audioBitrate: globalSettings?.audioBitrate,
                videoQuality: globalSettings?.videoQuality,
                audioTrack: globalSettings?.audioTrack,
            },
            isSelected: false,
            isDownloaded: false,
        }));

        // Add to store (triggers 'item:added' per item)
        for (const item of newItems) {
            videoStore.addItem(item);
        }

        // 2. Fetch metadata in parallel
        // Only prefetch metadata for YouTube URLs.
        // Non-YouTube URLs stay in skeleton state until extract/create-job returns metadata.
        const youtubeItems = newItems.filter(i => isYouTubeUrl(i.url));
        if (youtubeItems.length > 0) {
            // updateMetadata auto-sets status to 'ready' when current status is 'fetching_metadata'
            await fetchMetadataBatch(
                youtubeItems.map(i => ({ id: i.id, url: i.url })),
                (result) => {
                    if (result.meta) {
                        videoStore.updateMetadata(result.id, result.meta);
                    } else {
                        videoStore.setError(result.id, result.error || 'Failed to fetch info');
                    }
                }
            );
        }
    }

    // ==========================================
    // Add Playlist
    // ==========================================

    async addPlaylist(playlistUrl: string, globalSettings?: Partial<VideoItemSettings>): Promise<{
        title: string;
        thumbnail: string;
        itemCount: number;
    }> {
        const playlistId = extractPlaylistId(playlistUrl);
        if (!playlistId) {
            throw new Error('Could not extract playlist ID');
        }

        const groupId = `${playlistId}_${Date.now()}`;

        // Add 8 skeleton items for visual loading while fetching page 1
        const skeletonItems: VideoItem[] = Array.from({ length: 8 }).map((_, i) => ({
            id: generateItemId(`skeleton_${groupId}_${i}`),
            url: '',
            meta: {
                title: 'Loading...',
                originalUrl: '',
                status: 'analyzing',
                author: '',
                thumbnail: '',
                duration: 0,
                url: '',
                vid: '',
                source: 'youtube',
                isFakeData: true,
            },
            status: 'fetching_metadata' as const,
            progress: 0,
            settings: {
                format: globalSettings?.format || 'mp4',
                quality: globalSettings?.quality || '720p',
                audioFormat: globalSettings?.audioFormat,
                audioBitrate: globalSettings?.audioBitrate,
                videoQuality: globalSettings?.videoQuality,
                audioTrack: globalSettings?.audioTrack,
            },
            isSelected: false,
            isDownloaded: false,
            groupId,
            groupTitle: 'Playlist',
        }));

        for (const item of skeletonItems) {
            videoStore.addItem(item);
        }

        // Fetch page 1
        let page1: PlaylistPageResult;
        try {
            page1 = await fetchPlaylistPage(playlistId);
        } catch (error) {
            for (const item of skeletonItems) videoStore.removeItem(item.id);
            throw error;
        }

        if (!page1.items || page1.items.length === 0) {
            for (const item of skeletonItems) videoStore.removeItem(item.id);
            throw new Error('Playlist is empty or could not be fetched');
        }

        const realTitle = page1.title || 'Playlist';

        // Add page 1 items
        const page1Items = this.buildVideoItems(page1.items, groupId, realTitle, globalSettings);
        for (const item of page1Items) {
            videoStore.addItem(item);
        }

        // Remove skeletons after real items are added
        for (const item of skeletonItems) {
            videoStore.removeItem(item.id);
        }

        // Set group meta after items are visible — shows Load more button if more pages exist
        videoStore.setGroupMeta(groupId, false, realTitle, page1.nextPageToken ?? null);

        return {
            title: realTitle,
            thumbnail: '',
            itemCount: page1Items.length,
        };
    }

    // ==========================================
    // Add Single Video as Group
    // ==========================================

    async addSingleVideoAsGroup(videoUrl: string, globalSettings?: Partial<VideoItemSettings>): Promise<void> {
        const videoId = extractVideoId(videoUrl) || `video_${Date.now()}`;
        const groupId = `single_${videoId}_${Date.now()}`;
        const normalizedUrl = normalizeURL(videoId);

        // Create skeleton item with groupId
        const skeletonItem: VideoItem = {
            id: generateItemId(videoId),
            url: normalizedUrl,
            meta: {
                title: 'Loading...',
                originalUrl: videoUrl,
                status: 'analyzing',
                author: '',
                thumbnail: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '',
                duration: 0,
                url: normalizedUrl,
                vid: videoId,
                source: 'youtube',
                isFakeData: true,
            },
            status: 'fetching_metadata' as const,
            progress: 0,
            settings: {
                format: globalSettings?.format || 'mp4',
                quality: globalSettings?.quality || '720p',
                audioFormat: globalSettings?.audioFormat,
                audioBitrate: globalSettings?.audioBitrate,
                videoQuality: globalSettings?.videoQuality,
                audioTrack: globalSettings?.audioTrack,
            },
            isSelected: false,
            isDownloaded: false,
            groupId,
            groupTitle: 'Video',
        };

        videoStore.addItem(skeletonItem);
        videoStore.setGroupMeta(groupId, false, 'Video', null);

        // Fetch metadata
        await fetchMetadataBatch(
            [{ id: skeletonItem.id, url: normalizedUrl }],
            (result) => {
                if (result.success && result.meta) {
                    videoStore.updateMetadata(result.id, result.meta);
                    // Update group title with actual video title
                    videoStore.setGroupMeta(groupId, false, result.meta.title || 'Video', null);
                } else {
                    videoStore.setError(result.id, result.error || 'Failed to fetch info');
                }
            }
        );
    }

    async loadMoreGroup(groupId: string): Promise<void> {
        const meta = videoStore.getGroupMeta(groupId);
        if (!meta || !meta.nextPageToken || meta.isLoading) return;

        const playlistId = groupId.slice(0, groupId.lastIndexOf('_'));
        const settings = videoStore.getItemsByGroup(groupId)[0]?.settings;
        const savedToken = meta.nextPageToken;

        // Add skeletons at the bottom of the group while fetching
        const skeletonItems: VideoItem[] = Array.from({ length: 5 }).map((_, i) => ({
            id: generateItemId(`skeleton_loadmore_${groupId}_${i}`),
            url: '',
            meta: {
                title: 'Loading...',
                originalUrl: '',
                status: 'analyzing',
                author: '',
                thumbnail: '',
                duration: 0,
                url: '',
                vid: '',
                source: 'youtube',
                isFakeData: true,
            },
            status: 'fetching_metadata' as const,
            progress: 0,
            settings: settings || { format: 'mp4', quality: '720p' },
            isSelected: false,
            isDownloaded: false,
            groupId,
            groupTitle: meta.title,
        }));

        for (const item of skeletonItems) videoStore.addItem(item);
        videoStore.setGroupMeta(groupId, true, meta.title, meta.nextPageToken);

        try {
            const page = await fetchPlaylistPage(playlistId, savedToken);

            if (page.items && page.items.length > 0) {
                const items = this.buildVideoItems(page.items, groupId, meta.title, settings);
                for (let i = 0; i < items.length; i += 5) {
                    const batch = items.slice(i, i + 5);
                    for (const item of batch) videoStore.addItem(item);
                    if (i + 5 < items.length) await yieldToBrowser();
                }
            }

            for (const item of skeletonItems) videoStore.removeItem(item.id);
            videoStore.setGroupMeta(groupId, false, meta.title, page.nextPageToken ?? null);
        } catch {
            for (const item of skeletonItems) videoStore.removeItem(item.id);
            // Restore token on error so user can retry
            videoStore.setGroupMeta(groupId, false, meta.title, savedToken);
        }
    }

    private buildVideoItems(
        videos: Array<{ id: string; title?: string; author?: string; thumbnail?: string; duration?: number }>,
        groupId: string,
        groupTitle: string,
        globalSettings?: Partial<VideoItemSettings>
    ): VideoItem[] {
        return videos.map((video: any) => ({
            id: generateItemId(video.id),
            url: normalizeURL(video.id),
            meta: {
                title: video.title || 'Unknown Title',
                originalUrl: `https://www.youtube.com/watch?v=${video.id}`,
                status: 'ready',
                author: video.author || 'Unknown',
                thumbnail: video.thumbnail || '',
                duration: video.duration || 0,
                url: `https://www.youtube.com/watch?v=${video.id}`,
                vid: video.id,
                source: 'youtube',
                isFakeData: false,
            },
            status: 'ready' as const,
            progress: 0,
            settings: {
                format: globalSettings?.format || 'mp4',
                quality: globalSettings?.quality || '720p',
                audioFormat: globalSettings?.audioFormat,
                audioBitrate: globalSettings?.audioBitrate,
                videoQuality: globalSettings?.videoQuality,
                audioTrack: globalSettings?.audioTrack,
            },
            isSelected: false,
            isDownloaded: false,
            groupId,
            groupTitle,
        }));
    }

    // ==========================================
    // ZIP Download
    // ==========================================

    async createZipDownload(ids: string[]): Promise<string> {
        const items = ids.map(id => videoStore.getItem(id)).filter(Boolean) as VideoItem[];
        const urls = items.filter(item => item.status === 'completed' && item.downloadUrl).map(item => item.downloadUrl!);

        if (urls.length === 0) {
            throw new Error('No completed downloads found to ZIP');
        }

        const timestamp = Date.now();
        const zipName = `ytmp4_cc_${timestamp}.zip`;

        const result = await api.zipDownload.createZipDownload({
            files: urls,
            zipName: zipName
        });

        if (result.ok && result.data?.downloadUrl) {
            // Mark items as downloaded after ZIP creation
            for (const id of ids) {
                videoStore.markDownloaded(id);
            }
            return result.data.downloadUrl;
        }

        throw new Error(result.message || 'Failed to create ZIP download');
    }

    // ==========================================
    // Download Control
    // ==========================================

    startDownload(id: string): void {
        const item = videoStore.getItem(id);
        if (!item) return;

        // Keep non-YouTube skeleton visible until extract response returns preview metadata.
        const shouldKeepSkeleton = item.status === 'fetching_metadata' && item.meta.source === 'url';
        if (!shouldKeepSkeleton) {
            videoStore.setStatus(id, 'queued');
        }

        this.queue.add(id, (signal) => {
            return this.executeDownload(id, signal);
        }).catch(() => {
            // Cancelled or error — handled in executeDownload
        });
    }

    startAllDownloads(): void {
        const items = videoStore.getAllItems().filter(i =>
            ['ready', 'error', 'cancelled', 'fetching_metadata'].includes(i.status)
        );
        for (const item of items) {
            this.startDownload(item.id);
        }
    }

    startSelectedDownloads(): void {
        const items = videoStore.getSelectedDownloadable();
        for (const item of items) {
            this.startDownload(item.id);
        }
    }

    startGroupDownloads(groupId: string): void {
        const items = videoStore.getAllItems().filter(i =>
            i.groupId === groupId && ['ready', 'error', 'cancelled'].includes(i.status)
        );
        for (const item of items) {
            this.startDownload(item.id);
        }
    }

    startSelectedGroupDownloads(groupId: string): void {
        const items = videoStore.getAllItems().filter(i =>
            i.groupId === groupId && i.isSelected && ['ready', 'error', 'cancelled'].includes(i.status)
        );
        for (const item of items) {
            this.startDownload(item.id);
        }
    }

    cancelGroupDownloads(groupId: string): void {
        const active = videoStore.getAllItems().filter(i =>
            i.groupId === groupId && ['fetching_metadata', 'queued', 'downloading', 'converting'].includes(i.status)
        );
        for (const item of active) {
            this.cancelDownload(item.id);
        }
    }

    removeGroup(groupId: string): void {
        const items = videoStore.getAllItems().filter(i => i.groupId === groupId);
        for (const item of items) {
            videoStore.removeItem(item.id);
        }
    }

    cancelDownload(id: string): void {
        this.queue.cancel(id);
        const item = videoStore.getItem(id);
        if (item && item.abortController) {
            item.abortController.abort();
        }
        videoStore.setCancelled(id);
    }

    cancelAllDownloads(): void {
        // Cancel all items that are queued/downloading/converting
        const active = videoStore.getItemsByStatus('fetching_metadata', 'queued', 'downloading', 'converting');
        for (const item of active) {
            if (item.abortController) {
                item.abortController.abort();
            }
            videoStore.setCancelled(item.id);
        }
        this.queue.cancelAll();
    }

    retryDownload(id: string): void {
        videoStore.setStatus(id, 'ready');
        this.startDownload(id);
    }

    // ==========================================
    // Private
    // ==========================================

    private async executeDownload(id: string, signal: AbortSignal): Promise<void> {
        const item = videoStore.getItem(id);
        if (!item) return;
        const shouldKeepSkeleton = item.status === 'fetching_metadata' && item.meta.source === 'url';

        const controller = new AbortController();
        videoStore.setAbortController(id, controller);

        // Link the queue signal to our controller
        signal.addEventListener('abort', () => controller.abort(), { once: true });

        if (!shouldKeepSkeleton) {
            videoStore.setStatus(id, 'converting');
        }

        try {
            await runSingleDownload({
                url: item.meta.url || item.url,
                settings: item.settings,
                signal: controller.signal,
                callbacks: {
                    onPhaseChange: (phase) => {
                        videoStore.updateProgress(id, item.progress || 0, phase);
                    },
                    onProgress: (progress, phase) => {
                        videoStore.updateProgress(id, progress, phase);
                    },
                    onComplete: (downloadUrl, filename) => {
                        videoStore.setCompleted(id, downloadUrl, filename);
                    },
                    onError: (message) => {
                        videoStore.setError(id, message);
                    },
                    onAudioTrackInfo: (languages, changed) => {
                        videoStore.setAudioTrackInfo(id, languages, changed);
                    },
                    onExtracted: (info) => {
                        const currentItem = videoStore.getItem(id);
                        if (!currentItem) return;

                        const nextTitle = info.title?.trim() || currentItem.meta.title;
                        const nextThumbnail = info.thumbnail?.trim() || currentItem.meta.thumbnail;

                        videoStore.updateMetadata(id, {
                            title: nextTitle,
                            thumbnail: nextThumbnail,
                            duration: typeof info.duration === 'number' ? info.duration : currentItem.meta.duration,
                            source: nextThumbnail ? 'external' : currentItem.meta.source,
                            isFakeData: false,
                        });

                        // Once extract returns metadata, transition from skeleton to converting state.
                        if (shouldKeepSkeleton) {
                            videoStore.setStatus(id, 'converting');
                        }
                    },
                },
            });
        } catch (error: any) {
            if (error.name === 'AbortError' || signal.aborted) {
                videoStore.setCancelled(id);
            } else {
                videoStore.setError(id, error.message || 'Download failed');
            }
        } finally {
            videoStore.setAbortController(id, undefined);
        }
    }

    getQueueStatus() {
        return this.queue.getStatus();
    }
}

export const multiDownloadService = new MultiDownloadService();

// ==========================================
// Playlist pagination API helper
// ==========================================

interface PlaylistPageResult {
    items: Array<{ id: string; title?: string; author?: string; thumbnail?: string; duration?: number }>;
    nextPageToken: string | null;
    title?: string;
}

function yieldToBrowser(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}

async function fetchPlaylistPage(playlistId: string, pageToken?: string): Promise<PlaylistPageResult> {
    const baseUrl = getYtMetaBaseUrl();
    const url = new URL(`${baseUrl}/playlist`);
    url.searchParams.set('id', playlistId);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    try {
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`Playlist API error: ${response.status}`);
        const data = await response.json();

        apiLogger.log({
            type: 'success',
            endpoint: 'fetchPlaylistPage',
            requestData: { playlistId, pageToken },
            responseData: { itemsCount: data.items?.length }
        });

        return data;
    } catch (error: any) {
        apiLogger.log({
            type: 'error',
            endpoint: 'fetchPlaylistPage',
            requestData: { playlistId, pageToken },
            errorData: error.message
        });
        throw error;
    }
}
