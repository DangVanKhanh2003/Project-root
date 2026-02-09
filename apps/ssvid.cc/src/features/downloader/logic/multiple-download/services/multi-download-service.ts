
import { api } from '../../../../../api';
import { isYouTubeUrl } from '@downloader/core';
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

        // Fetch metadata and create items using V3-compatible API
        const items: VideoItem[] = [];
        for (const url of urls) {
            try {
                const result = await api.getMetadataYoutube(url);
                if (result.ok && result.data) {
                    const data = result.data as any;
                    const meta: VideoMeta = {
                        title: data.meta?.title || 'Unknown Video',
                        originalUrl: url,
                        status: 'ready',
                        author: data.meta?.author || 'Unknown Channel',
                        thumbnail: data.meta?.thumbnail || '',
                        duration: data.meta?.duration || 0,
                        url: url,
                        vid: data.meta?.vid || '',
                        source: 'youtube',
                        isFakeData: false
                    };
                    const id = meta.vid || Date.now().toString(36) + Math.random().toString(36).substr(2);
                    const defaultSettings: VideoItemSettings = { format: 'mp4', quality: '720p' };
                    items.push({
                        id,
                        url,
                        meta,
                        status: 'ready',
                        progress: 0,
                        settings: defaultSettings,
                        isSelected: true,
                        formats: data.formats
                    });
                }
            } catch (error) {
                console.error(`Error fetching metadata for ${url}:`, error);
            }
            await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit
        }

        if (items.length > 0) {
            addVideoItems(items);
            setGlobalStatus('ready');
        } else {
            setGlobalStatus('error');
        }
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
    private readonly MAX_CONCURRENT = 3; 

    /**
     * Start Batch Download (formerly Desktop Zip)
     */
    private async startDesktopZipSession() {
        const state = getAppState();
        const items = state.items || [];
        const selectedItems = items.filter(i => i.isSelected && i.status !== 'error');

        if (selectedItems.length === 0) {
            return;
        }

        setGlobalStatus('downloading');

        // Reset queue and add items
        this.queue = selectedItems.map(i => i.id);
        
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
     * Process a single V3 item
     */
    private async processItemV3(itemId: string) {
        const item = this.getVideoItemById(itemId);
        if (!item || item.status === 'cancelled') return;

        try {
            updateVideoItem(itemId, { status: 'converting', progress: 0 });

            // 1. Create Job
            const request = {
                url: item.meta.url,
                output: {
                    type: 'video' as const,
                    format: 'mp4' as const 
                }
            };

            const jobResult = await api.downloadV3.createJob(request);

            if (!jobResult.ok || !jobResult.data) {
                throw new Error(jobResult.message || 'Job creation failed');
            }

            const { statusUrl } = jobResult.data as any; 
            
            if (!statusUrl) {
                throw new Error('No status URL returned');
            }

            // 2. Poll Status
            await this.pollV3Status(itemId, statusUrl);

        } catch (error: any) {
            console.error('Download error for', itemId, error);
            updateVideoItem(itemId, { 
                status: 'error', 
                error: error.message || 'Download failed' 
            });
        }
    }

    /**
     * Poll V3 Job Status
     */
    private async pollV3Status(itemId: string, statusUrl: string) {
        const POLL_INTERVAL = 2000;
        const MAX_RETRIES = 180; // 6 minutes timeout
        let retries = 0;

        while (retries < MAX_RETRIES) {
            const currentItem = this.getVideoItemById(itemId);
            if (!currentItem || currentItem.status === 'cancelled') return;

            try {
                const result = await api.downloadV3.getStatusByUrl(statusUrl);

                if (result.ok && result.data) {
                    const statusData = result.data as any;
                    
                    if (statusData.progress) {
                         updateVideoItem(itemId, { progress: statusData.progress });
                    }

                    if (statusData.status === 'completed') {
                        updateVideoItem(itemId, { 
                            status: 'completed',
                            progress: 100,
                            downloadUrl: statusData.downloadUrl,
                            filename: statusData.title ? `${statusData.title}.mp4` : undefined
                        });
                        return;
                    } else if (statusData.status === 'error') {
                        throw new Error(statusData.jobError || 'Job failed');
                    }
                }
            } catch (error) {
                console.warn('Polling error', error);
            }

            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            retries++;
        }

        throw new Error('Polling timed out');
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
