
import { api } from '../../../../../api';
import { extractPlaylistId, extractVideoId, isPlaylistUrl, PlaylistDto } from '@downloader/core';
import { getApiBaseUrlV3, getYtMetaBaseUrl } from '../../../../../environment';
import { videoStore } from '../../../state/video-store';
import { VideoItem, VideoItemSettings } from '../../../state/multiple-download-types';
import { VideoMeta } from '../../../state/types';
import { DownloadQueue } from '../download-queue';
import { runSingleDownload } from '../download-runner';
import { fetchMetadataBatch } from '../metadata-fetcher';
import { parseYouTubeURLs, generateItemId, normalizeURL, extractChannelHandle } from '../url-parser';
import { recordDownloadError, type DownloadMethod } from '../../../../download-limit';
import { incrementDownloadCount } from '../../../../widget-level-manager';

function inferDownloadMethod(item: VideoItem): DownloadMethod {
    if (item.groupId?.startsWith('channel_')) return 'channel';
    if (item.groupId?.startsWith('single_')) return Number.isFinite(item.settings.trimStart) || Number.isFinite(item.settings.trimEnd)
        ? 'trim'
        : 'single';
    if (item.groupId?.startsWith('multi_')) {
        const groupItems = item.groupId ? videoStore.getItemsByGroup(item.groupId) : [];
        const isBulkDownload = groupItems.length >= 2;

        if (Number.isFinite(item.settings.trimStart) || Number.isFinite(item.settings.trimEnd)) {
            return 'trim';
        }

        return isBulkDownload ? 'batch' : 'single';
    }
    return 'playlist';
}

export class MultiDownloadService {
    private queue = new DownloadQueue(5);

    // ==========================================
    // Add URLs (batch mode)
    // ==========================================

    async addUrls(
        rawText: string,
        globalSettings?: Partial<VideoItemSettings>,
        onItemsAdded?: () => void
    ): Promise<string | null> {
        const parsed = parseYouTubeURLs(rawText);
        console.log('[MultiDownloadService] Parsed URLs:', parsed.length, parsed);

        if (parsed.length === 0) return null;
        const groupId = `multi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

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
                filenameStyle: globalSettings?.filenameStyle,
                enableMetadata: globalSettings?.enableMetadata,
                trimStart: globalSettings?.trimStart,
                trimEnd: globalSettings?.trimEnd,
                trimRangeLabel: globalSettings?.trimRangeLabel,
            },
            isSelected: false,
            isDownloaded: false,
            groupId,
            groupTitle: 'Multiple',
        }));

        // Add to store in chunks to allow UI to breathe
        const CHUNK_SIZE = 5;
        let didNotifyAdded = false;
        for (let i = 0; i < newItems.length; i += CHUNK_SIZE) {
            const batch = newItems.slice(i, i + CHUNK_SIZE);
            for (const item of batch) {
                videoStore.addItem(item);
            }
            if (!didNotifyAdded) {
                didNotifyAdded = true;
                onItemsAdded?.();
            }
            // Yield to browser to render the added items
            await yieldToBrowser();
        }

        videoStore.setGroupMeta(groupId, false, 'Multiple', null);

        // 2. Fetch metadata in parallel
        // updateMetadata auto-sets status to 'ready' when current status is 'fetching_metadata'
        await fetchMetadataBatch(
            newItems.map(i => ({ id: i.id, url: i.url })),
            (result) => {
                if (result.success && result.meta) {
                    videoStore.updateMetadata(result.id, result.meta);
                } else {
                    videoStore.setError(result.id, result.error || 'Failed to fetch info');
                }
            }
        );
        return groupId;
    }

    // ==========================================
    // Add Playlist
    // ==========================================

    async addPlaylist(
        playlistUrl: string,
        globalSettings?: Partial<VideoItemSettings>,
        onItemsAdded?: () => void
    ): Promise<{
        title: string;
        thumbnail: string;
        itemCount: number;
    }> {
        const playlistId = extractPlaylistId(playlistUrl);
        if (!playlistId) {
            throw new Error('Could not extract playlist ID');
        }

        const groupId = `${playlistId}_${Date.now()}`;
        // Mark group as loading immediately so renderer keeps DOM stable during skeleton -> real items transition.
        videoStore.setGroupMeta(groupId, true, 'Playlist', null);

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
                filenameStyle: globalSettings?.filenameStyle,
                enableMetadata: globalSettings?.enableMetadata,
            },
            isSelected: false,
            isDownloaded: false,
            groupId,
            groupTitle: 'Playlist',
        }));

        let didNotifyAdded = false;
        for (let i = 0; i < skeletonItems.length; i += 4) {
            const batch = skeletonItems.slice(i, i + 4);
            for (const item of batch) videoStore.addItem(item);
            if (!didNotifyAdded) {
                didNotifyAdded = true;
                onItemsAdded?.();
            }
            await yieldToBrowser();
        }

        // Fetch page 1
        let page1: PlaylistPageResult;
        try {
            page1 = await fetchPlaylistPage(playlistId);
        } catch (error) {
            videoStore.setGroupMeta(groupId, false, 'Playlist', null);
            for (const item of skeletonItems) videoStore.removeItem(item.id);
            throw error;
        }

        if (!page1.items || page1.items.length === 0) {
            videoStore.setGroupMeta(groupId, false, 'Playlist', null);
            for (const item of skeletonItems) videoStore.removeItem(item.id);
            throw new Error('Playlist is empty or could not be fetched');
        }

        const realTitle = page1.title || 'Playlist';

        // Remove skeletons then append real items in the same task to avoid an empty-frame flicker.
        for (const item of skeletonItems) {
            videoStore.removeItem(item.id);
        }

        // Add page 1 items in chunks
        const page1Items = this.buildVideoItems(page1.items, groupId, realTitle, globalSettings);
        for (let i = 0; i < page1Items.length; i += 5) {
            const batch = page1Items.slice(i, i + 5);
            for (const item of batch) videoStore.addItem(item);
            if (i + 5 < page1Items.length) await yieldToBrowser();
        }


        // Set group meta after items are visible — shows Load more button if more pages exist
        videoStore.setGroupMeta(groupId, false, realTitle, page1.nextPageToken ?? null);
        await incrementDownloadCount('playlist', playlistUrl);

        return {
            title: realTitle,
            thumbnail: '',
            itemCount: page1Items.length,
        };
    }

    // ==========================================
    // Add Single Video as Group
    // ==========================================

    async addSingleVideoAsGroup(
        videoUrl: string,
        globalSettings?: Partial<VideoItemSettings>,
        onItemsAdded?: () => void
    ): Promise<string> {
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
                filenameStyle: globalSettings?.filenameStyle,
                enableMetadata: globalSettings?.enableMetadata,
                trimStart: globalSettings?.trimStart,
                trimEnd: globalSettings?.trimEnd,
                trimRangeLabel: globalSettings?.trimRangeLabel,
            },
            isSelected: false,
            isDownloaded: false,
            groupId,
            groupTitle: 'Video',
        };

        videoStore.addItem(skeletonItem);
        onItemsAdded?.();
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

        return groupId;
    }

    // ==========================================
    // Add Channel
    // ==========================================

    async addChannel(
        channelUrl: string,
        globalSettings?: Partial<VideoItemSettings>,
        onItemsAdded?: () => void
    ): Promise<{
        title: string;
        itemCount: number;
    }> {
        const channelId = extractChannelHandle(channelUrl);
        if (!channelId) {
            throw new Error('Could not extract channel ID from URL');
        }

        const groupId = `channel_${channelId}_${Date.now()}`;
        // Mark group as loading immediately
        videoStore.setGroupMeta(groupId, true, 'Channel', null);

        // Add 8 skeleton items for visual loading
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
                filenameStyle: globalSettings?.filenameStyle,
                enableMetadata: globalSettings?.enableMetadata,
            },
            isSelected: false,
            isDownloaded: false,
            groupId,
            groupTitle: 'Channel',
        }));

        let didNotifyAdded = false;
        for (let i = 0; i < skeletonItems.length; i += 4) {
            const batch = skeletonItems.slice(i, i + 4);
            for (const item of batch) videoStore.addItem(item);
            if (!didNotifyAdded) {
                didNotifyAdded = true;
                onItemsAdded?.();
            }
            await yieldToBrowser();
        }

        // Fetch page 1
        let page1: ChannelPageResult;
        try {
            page1 = await fetchChannelPage(channelId);
        } catch (error) {
            videoStore.setGroupMeta(groupId, false, 'Channel', null);
            for (const item of skeletonItems) videoStore.removeItem(item.id);
            throw error;
        }

        if (!page1.items || page1.items.length === 0) {
            videoStore.setGroupMeta(groupId, false, 'Channel', null);
            for (const item of skeletonItems) videoStore.removeItem(item.id);
            throw new Error('Channel has no videos or could not be fetched');
        }

        // Use the channel name from the first item, fallback to channelId
        const realTitle = page1.items[0]?.channel || channelId;

        // Remove skeletons then append real items
        for (const item of skeletonItems) {
            videoStore.removeItem(item.id);
        }

        // Add page 1 items in chunks
        const page1Items = this.buildVideoItems(page1.items.map(v => ({
            id: v.id,
            title: v.title,
            thumbnail: v.thumbnail,
        })), groupId, realTitle, globalSettings);
        for (let i = 0; i < page1Items.length; i += 5) {
            const batch = page1Items.slice(i, i + 5);
            for (const item of batch) videoStore.addItem(item);
            if (i + 5 < page1Items.length) await yieldToBrowser();
        }

        videoStore.setGroupMeta(groupId, false, realTitle, page1.nextPageToken ?? null);
        await incrementDownloadCount('channel', channelUrl);

        return {
            title: realTitle,
            itemCount: page1Items.length,
        };
    }

    async loadMoreGroup(groupId: string): Promise<void> {
        const meta = videoStore.getGroupMeta(groupId);
        if (!meta || !meta.nextPageToken || meta.isLoading) return;

        const playlistId = groupId.slice(0, groupId.lastIndexOf('_'));
        const settings = videoStore.getItemsByGroup(groupId)[0]?.settings;
        const savedToken = meta.nextPageToken;

        // Determine if this is a channel group or playlist group
        const isChannelGroup = groupId.startsWith('channel_');
        // Extract the original ID for API calls
        let apiId: string;
        if (isChannelGroup) {
            // groupId format: channel_{channelId}_{timestamp}
            apiId = groupId.slice('channel_'.length, groupId.lastIndexOf('_'));
        } else {
            apiId = groupId.slice(0, groupId.lastIndexOf('_'));
        }

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

        videoStore.setGroupMeta(groupId, true, meta.title, meta.nextPageToken);
        for (const item of skeletonItems) videoStore.addItem(item);

        try {
            let page: { items: Array<any>; nextPageToken?: string | null };
            if (isChannelGroup) {
                page = await fetchChannelPage(apiId, savedToken);
                // Normalize channel response items to match buildVideoItems input
                page.items = (page.items || []).map((v: any) => ({
                    id: v.id,
                    title: v.title,
                    thumbnail: v.thumbnail,
                }));
            } else {
                page = await fetchPlaylistPage(apiId, savedToken);
            }

            // Remove skeletons and add real items in the same task to prevent visual blink.
            for (const item of skeletonItems) videoStore.removeItem(item.id);

            if (page.items && page.items.length > 0) {
                const items = this.buildVideoItems(page.items, groupId, meta.title, settings);
                for (let i = 0; i < items.length; i += 5) {
                    const batch = items.slice(i, i + 5);
                    for (const item of batch) videoStore.addItem(item);
                    if (i + 5 < items.length) await yieldToBrowser();
                }
            }
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
                filenameStyle: globalSettings?.filenameStyle,
                enableMetadata: globalSettings?.enableMetadata,
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
        const zipName = `Ezconv_cc_${timestamp}.zip`;

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
        videoStore.setStatus(id, 'queued');
        this.enqueueJob(id);
    }

    startAllDownloads(): void {
        const items = videoStore.getDownloadableItems();
        const ids = items.map(i => i.id);
        videoStore.batchSetQueued(ids);
        for (const id of ids) this.enqueueJob(id);
    }

    startSelectedDownloads(): void {
        const items = videoStore.getSelectedDownloadable();
        const ids = items.map(i => i.id);
        videoStore.batchSetQueued(ids);
        for (const id of ids) this.enqueueJob(id);
    }

    startGroupDownloads(groupId: string): void {
        const items = videoStore.getAllItems().filter(i =>
            i.groupId === groupId && ['ready', 'error', 'cancelled'].includes(i.status)
        );
        const ids = items.map(i => i.id);
        videoStore.batchSetQueued(ids);
        for (const id of ids) this.enqueueJob(id);
    }

    startSelectedGroupDownloads(groupId: string): void {
        const items = videoStore.getAllItems().filter(i =>
            i.groupId === groupId && i.isSelected && ['ready', 'error', 'cancelled'].includes(i.status)
        );
        const ids = items.map(i => i.id);
        videoStore.batchSetQueued(ids);
        for (const id of ids) this.enqueueJob(id);
    }

    /** Add item to execution queue only (status must already be set). */
    private enqueueJob(id: string): void {
        this.queue.add(id, (signal) => {
            return this.executeDownload(id, signal);
        }).catch(() => {});
    }

    cancelGroupDownloads(groupId: string): void {
        const active = videoStore.getAllItems().filter(i =>
            i.groupId === groupId && ['queued', 'downloading', 'converting'].includes(i.status)
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
        const active = videoStore.getItemsByStatus('queued', 'downloading', 'converting');
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
        const method = inferDownloadMethod(item);

        const controller = new AbortController();
        videoStore.setAbortController(id, controller);

        // Link the queue signal to our controller
        signal.addEventListener('abort', () => controller.abort(), { once: true });

        videoStore.setStatus(id, 'converting');

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
                        if (method !== 'playlist' && method !== 'channel' && method !== 'batch') {
                            void incrementDownloadCount(method, item.meta.url || item.url);
                        }

                        // Keep merging UI visible briefly so users can see progress reach 100%.
                        const completeAfterMs = 350;
                        window.setTimeout(() => {
                            // Item may have been cancelled/removed while waiting.
                            const latest = videoStore.getItem(id);
                            if (!latest || latest.status !== 'converting') return;
                            videoStore.setCompleted(id, downloadUrl, filename);
                        }, completeAfterMs);
                    },
                    onError: (message) => {
                        videoStore.setError(id, message);
                    },
                    onAudioTrackInfo: (languages, changed) => {
                        videoStore.setAudioTrackInfo(id, languages, changed);
                    },
                },
            });
        } catch (error: any) {
            if (error.name === 'AbortError' || signal.aborted) {
                videoStore.setCancelled(id);
            } else {
                void recordDownloadError({
                    method: `group_${method}_convert`,
                    url: item.meta.url || item.url,
                    endpoint: `${getApiBaseUrlV3()}/api/download`,
                    requestData: {
                        itemId: item.id,
                        groupId: item.groupId || null,
                        groupTitle: item.groupTitle || null,
                        itemTitle: item.meta.title || null,
                        settings: {
                            format: item.settings.format,
                            quality: item.settings.quality,
                            audioFormat: item.settings.audioFormat,
                            audioBitrate: item.settings.audioBitrate,
                            videoQuality: item.settings.videoQuality,
                            audioTrack: item.settings.audioTrack,
                            trimStart: item.settings.trimStart,
                            trimEnd: item.settings.trimEnd,
                            filenameStyle: item.settings.filenameStyle,
                            enableMetadata: item.settings.enableMetadata,
                        },
                    },
                    errorData: {
                        message: error?.message || 'Download failed',
                        name: error?.name || 'Error',
                        stack: error?.stack || null,
                    },
                });
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

const yieldToBrowser = () => new Promise(resolve => setTimeout(resolve, 0));

async function fetchPlaylistPage(playlistId: string, pageToken?: string): Promise<PlaylistPageResult> {
    const baseUrl = getYtMetaBaseUrl();
    const url = new URL(`${baseUrl}/playlist`);
    url.searchParams.set('id', playlistId);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Playlist API error: ${response.status}`);
    return response.json();
}

// ==========================================
// Channel pagination API helper
// ==========================================

interface ChannelPageResult {
    items: Array<{ id: string; title?: string; channel?: string; thumbnail?: string }>;
    nextPageToken: string | null;
}

async function fetchChannelPage(channelId: string, pageToken?: string): Promise<ChannelPageResult> {
    const baseUrl = getYtMetaBaseUrl();
    const url = new URL(`${baseUrl}/channel-videos`);
    url.searchParams.set('id', channelId);
    url.searchParams.set('maxResults', '50');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Channel API error: ${response.status}`);
    return response.json();
}
