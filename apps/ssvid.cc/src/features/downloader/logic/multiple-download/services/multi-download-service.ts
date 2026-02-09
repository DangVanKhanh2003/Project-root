
import { api } from '../../../../../api';
import { apiV3, v3Config } from '../../../../../api/v3';
import { isYouTubeUrl, mapToV3DownloadRequest } from '@downloader/core';
import { retryWithBackoff, RETRY_CONFIGS, isTimeoutError } from '../../conversion/retry-helper';
import { isMobileDevice } from '../../../../../utils';
import {
    addVideoItems,
    updateVideoItem,
    setGlobalStatus,
    updateGlobalProgress,
    setMultipleDownloadMode
} from '../../../state/multiple-download-actions';
import { getState as getAppState } from '../../../state/index';
import { VideoItem, VideoItemSettings } from '../../../state/multiple-download-types';
import { VideoMeta } from '../../../state/types';

export class MultiDownloadService {
    private abortControllers: Map<string, AbortController> = new Map();
    private isProcessingMobile = false;

    /**
     * Parse URLs from text
     */
    private parseVideoUrls(text: string): string[] {
        return text.split(/[\s,]+/).filter(url => isYouTubeUrl(url));
    }

    /**
     * Add URLs to the list (V3 flow - no validation layer)
     * Uses youtubePublicApi for metadata fetching
     */
    async addUrls(rawText: string) {
        setGlobalStatus('analyzing');
        const urls = this.parseVideoUrls(rawText);

        if (urls.length === 0) {
            setGlobalStatus('idle');
            return;
        }

        // 1. Create initial items with 'fetching_metadata' status (Skeleton)
        const newItems: VideoItem[] = urls.map(url => {
            // Generate ID deterministically or randomly
            const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
            return {
                id,
                url,
                meta: {
                    title: 'Loading...',
                    originalUrl: url,
                    status: 'analyzing', // will be used for skeleton
                    author: '',
                    thumbnail: '', // Empty thumbnail for skeleton
                    duration: 0,
                    url: url,
                    vid: '',
                    source: 'youtube',
                    isFakeData: true
                },
                status: 'fetching_metadata',
                progress: 0,
                settings: { format: 'mp4', quality: '720p' },
                isSelected: true
            };
        });

        addVideoItems(newItems);

        // 2. Fetch metadata in parallel (with concurrency limit ideally, but simple for now)
        // We update items as they finish
        let successCount = 0;

        for (const item of newItems) {
            try {
                const result = await api.getMetadataYoutube(item.url);

                if (result.ok && result.data) {
                    const data = result.data as any;
                    // FIX: Handle flat structure (oEmbed-like) or nested meta
                    // User logs show flat structure with camelCase keys (authorName, thumbnailUrl)

                    const title = data.title || data.meta?.title || 'Unknown Video';
                    const author = data.authorName || data.author_name || data.meta?.author || 'Unknown Channel';
                    const thumbnail = data.thumbnailUrl || data.thumbnail_url || data.meta?.thumbnail || '';
                    const duration = data.duration || data.meta?.duration || 0;
                    const vid = data.vid || data.meta?.vid || this.extractVideoId(item.url);

                    const meta: VideoMeta = {
                        title: title,
                        originalUrl: item.url,
                        status: 'ready',
                        author: author,
                        thumbnail: thumbnail,
                        duration: duration,
                        url: item.url,
                        vid: vid,
                        source: 'youtube',
                        isFakeData: false
                    };

                    updateVideoItem(item.id, {
                        meta,
                        status: 'ready',
                        formats: data.formats // If available
                    });
                    successCount++;
                } else {
                    updateVideoItem(item.id, { status: 'error', error: 'Metadata check failed' });
                }
            } catch (error: any) {
                console.error(`Error fetching metadata for ${item.url}:`, error);
                updateVideoItem(item.id, { status: 'error', error: error.message || 'Failed to fetch info' });
            }
            // Small delay to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const state = getAppState();
        // Update global status based on results
        if (successCount > 0) {
            setGlobalStatus('ready');
        } else if (state.items.filter(i => i.status === 'ready').length > 0) {
            setGlobalStatus('ready');
        } else {
            setGlobalStatus('error');
        }
    }

    private extractVideoId(url: string): string {
        const match = url.match(/[?&]v=([^&]+)/);
        return match ? match[1] : '';
    }

    /**
     * Start Download
     * Dispatches based on device type
     */
    async startDownload(itemId?: string) {
        if (isMobileDevice()) {
            if (itemId) {
                await this.processSingleMobileItem(itemId);
            } else {
                await this.processAllMobileItems();
            }
        } else {
            // Desktop: ZIP Flow (itemId is ignored, we download all "ready" items)
            await this.startDesktopZipSession();
        }
    }

    /**
     * Cancel Download
     */
    cancelDownload(itemId?: string) {
        if (itemId) {
            const controller = this.abortControllers.get(itemId);
            if (controller) {
                controller.abort();
                this.abortControllers.delete(itemId);
                updateVideoItem(itemId, { status: 'cancelled' });
            }
        } else {
            // Cancel All
            this.abortControllers.forEach(controller => controller.abort());
            this.abortControllers.clear();

            setGlobalStatus('idle');
        }
    }

    // ============================================================
    // MOBILE FLOW (Sequential / Individual)
    // ============================================================

    private async processAllMobileItems() {
        if (this.isProcessingMobile) return;
        this.isProcessingMobile = true;
        setGlobalStatus('downloading');

        const readyItems = this.getReadyItems();

        // Simple sequential processing
        for (const item of readyItems) {
            // Check if cancelled or state changed
            const currentItem = this.getVideoItemById(item.id);
            if (!currentItem || currentItem.status !== 'ready') continue;

            await this.processSingleMobileItem(item.id);
        }

        this.isProcessingMobile = false;

        // Check if all done
        const remaining = this.getReadyItems();
        if (remaining.length === 0) {
            setGlobalStatus('completed');
        } else {
            setGlobalStatus('ready'); // Partial completion or paused
        }
    }

    /**
     * Process single mobile item using V3 API
     * Same as desktop V3 flow - Create Job -> Poll Status
     */
    private async processSingleMobileItem(itemId: string) {
        const item = this.getVideoItemById(itemId);
        if (!item) return;

        const controller = new AbortController();
        this.abortControllers.set(itemId, controller);

        try {
            // Use V3 download flow (same as desktop)
            await this.processItemV3(itemId);
        } catch (error: any) {
            if (error.name === 'AbortError') {
                updateVideoItem(itemId, { status: 'cancelled' });
            } else {
                updateVideoItem(itemId, { status: 'error', error: error.message });
            }
        } finally {
            this.abortControllers.delete(itemId);
        }
    }

    // ============================================================
    // DESKTOP FLOW (ZIP / Orchestrator)
    // ============================================================

    /**
     * Start Desktop "Zip" Session (now batch V3 download)
     */
    private queue: string[] = [];
    private activeDownloads = 0;
    private readonly MAX_CONCURRENT = 5;

    /**
     * Start Batch Download (formerly Desktop Zip)
     */
    private async startDesktopZipSession() {
        const state = getAppState();
        const items = state.items || [];
        // Filter only items that allow downloading (Ready or Error)
        // Exclude 'converting', 'downloading' (already active) and 'completed' (already done)
        const selectedItems = items.filter(i =>
            i.isSelected &&
            (i.status === 'ready' || i.status === 'error' || i.status === 'cancelled')
        );

        if (selectedItems.length === 0) {
            return;
        }

        setGlobalStatus('downloading');

        // Append to queue (avoid duplicates)
        const newQueueItems = selectedItems.filter(i => !this.queue.includes(i.id));
        this.queue.push(...newQueueItems.map(i => i.id));

        // Visually set them to queued
        newQueueItems.forEach(i => {
            updateVideoItem(i.id, { status: 'queued' });
        });

        // Trigger processing
        this.processQueue();
    }

    /**
     * Process the download queue
     */
    private processQueue() {
        while (this.activeDownloads < this.MAX_CONCURRENT && this.queue.length > 0) {
            const itemId = this.queue.shift();
            if (itemId) {
                this.activeDownloads++;
                this.processItemV3(itemId).finally(() => {
                    this.activeDownloads--;
                    this.checkCompletion();
                    this.processQueue();
                });
            }
        }
    }

    /**
     * Check if all downloads are complete
     */
    private checkCompletion() {
        if (this.activeDownloads === 0 && this.queue.length === 0) {
            setGlobalStatus('ready');
        }
    }

    /**
     * Process a single V3 item (with retry on createJob)
     */
    private async processItemV3(itemId: string) {
        const item = this.getVideoItemById(itemId);
        if (!item || item.status === 'cancelled') return;

        try {
            updateVideoItem(itemId, { status: 'converting', progress: 0 });

            // 1. Create Job with retry (same as convert-logic-v3)
            const settings = item.settings || { format: 'mp4', quality: '720p' };
            const isAudio = settings.format === 'mp3';
            const request = mapToV3DownloadRequest(item.meta.url, {
                downloadMode: isAudio ? 'audio' : 'video',
                videoQuality: settings.quality?.replace('p', '') || '720',
                youtubeVideoContainer: isAudio ? undefined : settings.format,
                audioFormat: isAudio ? settings.format : undefined,
                audioBitrate: '128',
            });

            const jobResponse = await retryWithBackoff(
                () => apiV3.createJob(request),
                RETRY_CONFIGS.extracting
            );

            const { statusUrl } = jobResponse;

            if (!statusUrl) {
                throw new Error('No status URL returned');
            }

            // 2. Poll Status with consecutive error tracking
            await this.pollV3Status(itemId, statusUrl);

        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('Download error for', itemId, error);
            updateVideoItem(itemId, {
                status: 'error',
                error: error.message || 'Download failed'
            });
        }
    }

    /**
     * Poll V3 Job Status (with consecutive error tracking like convert-logic-v3)
     */
    private async pollV3Status(itemId: string, statusUrl: string) {
        const pollingInterval = v3Config.timeout.pollingInterval;
        const { maxConsecutiveErrors } = RETRY_CONFIGS.polling;
        let consecutiveErrors = 0;

        while (true) {
            const currentItem = this.getVideoItemById(itemId);
            if (!currentItem || currentItem.status === 'cancelled') return;

            try {
                const statusData = await apiV3.getStatusByUrl(statusUrl);

                // Reset consecutive errors on success
                consecutiveErrors = 0;

                if (statusData.progress) {
                    updateVideoItem(itemId, { progress: statusData.progress });
                }

                if (statusData.status === 'completed') {
                    if (statusData.downloadUrl) {
                        updateVideoItem(itemId, {
                            status: 'completed',
                            progress: 100,
                            downloadUrl: statusData.downloadUrl,
                            filename: statusData.title ? `${statusData.title}.mp4` : undefined
                        });
                        return;
                    }
                    throw new Error('Completed but no download URL');
                } else if (statusData.status === 'error') {
                    throw new Error(statusData.jobError || 'Job failed');
                }
            } catch (error: any) {
                // Timeout is NOT an error - continue polling
                if (isTimeoutError(error)) {
                    continue;
                }

                // Job error from API - stop immediately
                if (error.isJobError || error.response?.status === 'error') {
                    throw error;
                }

                // Network/API error - track consecutive errors
                consecutiveErrors++;
                console.warn(`[MultiDownload] Poll error (${consecutiveErrors}/${maxConsecutiveErrors}):`, error);

                if (consecutiveErrors >= maxConsecutiveErrors) {
                    throw new Error('Network error - please try again');
                }
            }

            await new Promise(resolve => setTimeout(resolve, pollingInterval));
        }
    }

    private getVideoItemById(id: string): VideoItem | undefined {
        const state = getAppState();
        return state.items?.find(i => i.id === id);
    }

    private getReadyItems(): VideoItem[] {
        const state = getAppState();
        // Filter items that are ready for download
        return state.items?.filter(i => i.status === 'ready' || i.status === 'error') || [];
    }
}

export const multiDownloadService = new MultiDownloadService();
