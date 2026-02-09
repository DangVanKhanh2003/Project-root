
import { api } from '../../../../../api';
import { extractPlaylistId, isPlaylistUrl, PlaylistDto } from '@downloader/core';
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
            isSelected: true,
            isDownloaded: false,
        }));

        // Add to store (triggers 'item:added' per item)
        for (const item of newItems) {
            videoStore.addItem(item);
        }

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

        const result = await api.playlistV3.extractPlaylist(playlistId);

        if (!result.ok || !result.data) {
            throw new Error(result.message || 'Failed to fetch playlist');
        }

        const playlist = result.data as PlaylistDto;
        const groupId = `${playlistId}_${Date.now()}`;
        const groupTitle = playlist.title || 'Playlist';

        // Create items with preloaded metadata
        const videoItems: VideoItem[] = (playlist.items || []).map((video: any) => ({
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
            isSelected: true,
            isDownloaded: false,
            groupId,
            groupTitle,
        }));

        for (const item of videoItems) {
            videoStore.addItem(item);
        }

        return {
            title: groupTitle,
            thumbnail: playlist.thumbnail || '',
            itemCount: videoItems.length,
        };
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
        const zipName = `ssvid_cc_${timestamp}.zip`;

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

        this.queue.add(id, (signal) => {
            return this.executeDownload(id, signal);
        }).catch(() => {
            // Cancelled or error — handled in executeDownload
        });
    }

    startAllDownloads(): void {
        const items = videoStore.getDownloadableItems();
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
                        videoStore.setCompleted(id, downloadUrl, filename);
                    },
                    onError: (message) => {
                        videoStore.setError(id, message);
                    },
                    onAudioTrackInfo: (languages, changed) => {
                        videoStore.setAudioLanguages(id, languages);
                        const currentItem = videoStore.getItem(id);
                        if (currentItem) {
                            currentItem.audioLanguageChanged = changed;
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
