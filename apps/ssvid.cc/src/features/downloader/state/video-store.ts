
import { VideoItem, VideoItemSettings, VideoStoreEventName, ProgressPhase } from './multiple-download-types';
import { VideoMeta } from './types';

type StoreListener = (eventName: VideoStoreEventName, data: any) => void;

const DOWNLOADABLE_STATUSES: VideoItem['status'][] = ['ready', 'error', 'cancelled'];

const DEFAULT_SETTINGS: VideoItemSettings = {
    format: 'mp4',
    quality: '720p',
    videoQuality: '720',
    audioFormat: 'mp3',
    audioBitrate: '128',
    audioTrack: 'origin',
};

class VideoStore {
    private items: Map<string, VideoItem> = new Map();
    private listeners: Set<StoreListener> = new Set();
    private groupMeta: Map<string, { isLoading: boolean; title: string }> = new Map();

    // ==========================================
    // CRUD
    // ==========================================

    addItem(item: VideoItem): void {
        if (this.items.has(item.id)) return;
        // Ensure defaults
        item.settings = { ...DEFAULT_SETTINGS, ...item.settings };
        this.items.set(item.id, item);
        this.notify('item:added', item);
    }

    removeItem(id: string): void {
        const item = this.items.get(id);
        if (!item) return;
        this.items.delete(id);
        this.notify('item:removed', item);
    }

    getItem(id: string): VideoItem | undefined {
        return this.items.get(id);
    }

    getAllItems(): VideoItem[] {
        return Array.from(this.items.values());
    }

    getItemsByGroup(groupId: string): VideoItem[] {
        return this.getAllItems().filter(item => item.groupId === groupId);
    }

    getCount(): number {
        return this.items.size;
    }

    clearAll(): void {
        this.items.clear();
        this.groupMeta.clear();
        this.notify('items:cleared', null);
    }

    // ==========================================
    // Group Meta (loading state + title)
    // ==========================================

    setGroupMeta(groupId: string, isLoading: boolean, title: string): void {
        this.groupMeta.set(groupId, { isLoading, title });
        this.notify('group:updated', { groupId, isLoading, title });
    }

    getGroupMeta(groupId: string): { isLoading: boolean; title: string } | undefined {
        return this.groupMeta.get(groupId);
    }

    hasItem(id: string): boolean {
        return this.items.has(id);
    }

    hasUrl(url: string): boolean {
        return this.getAllItems().some(item => item.url === url);
    }

    // ==========================================
    // Selection
    // ==========================================

    toggleSelect(id: string): void {
        const item = this.items.get(id);
        if (!item) return;
        // Only allow toggling for downloadable/completed items
        if (!this.isSelectableStatus(item.status)) return;
        item.isSelected = !item.isSelected;
        this.notify('items:selection-changed', item);
    }

    selectAll(): void {
        for (const item of this.items.values()) {
            if (this.isSelectableStatus(item.status)) {
                item.isSelected = true;
            }
        }
        this.notify('items:selection-changed', null);
    }

    deselectAll(): void {
        for (const item of this.items.values()) {
            item.isSelected = false;
        }
        this.notify('items:selection-changed', null);
    }

    setGroupSelection(groupId: string, selected: boolean): void {
        for (const item of this.items.values()) {
            if (item.groupId === groupId) {
                if (selected) {
                    if (this.isSelectableStatus(item.status)) {
                        item.isSelected = true;
                    }
                } else {
                    item.isSelected = false;
                }
            }
        }
        this.notify('items:selection-changed', null);
    }

    /**
     * Batch-select/deselect a list of item IDs and fire ONE event.
     * Use this instead of calling toggleSelect() in a loop.
     */
    setItemsSelection(ids: string[], selected: boolean): void {
        for (const id of ids) {
            const item = this.items.get(id);
            if (!item) continue;
            if (selected) {
                if (this.isSelectableStatus(item.status)) item.isSelected = true;
            } else {
                item.isSelected = false;
            }
        }
        this.notify('items:selection-changed', null);
    }

    getSelectedItems(): VideoItem[] {
        return this.getAllItems().filter(item => item.isSelected);
    }

    getSelectedCount(): number {
        let count = 0;
        for (const item of this.items.values()) {
            if (item.isSelected) count++;
        }
        return count;
    }

    // ==========================================
    // Status & Progress
    // ==========================================

    setStatus(id: string, status: VideoItem['status']): void {
        const item = this.items.get(id);
        if (!item) return;
        item.status = status;
        if (status === 'ready' || status === 'error' || status === 'cancelled') {
            item.progress = 0;
            item.progressPhase = undefined;
        }
        this.notify('item:updated', item);
    }

    setCompleted(id: string, downloadUrl: string, filename?: string): void {
        const item = this.items.get(id);
        if (!item) return;
        item.status = 'completed';
        item.progress = 100;
        item.downloadUrl = downloadUrl;
        item.filename = filename;
        item.isDownloaded = false;
        item.progressPhase = undefined;
        this.notify('item:updated', item);
    }

    setError(id: string, message: string): void {
        const item = this.items.get(id);
        if (!item) return;
        item.status = 'error';
        item.error = message;
        item.progress = 0;
        item.progressPhase = undefined;
        this.notify('item:updated', item);
    }

    setCancelled(id: string): void {
        const item = this.items.get(id);
        if (!item) return;
        item.status = 'cancelled';
        item.progress = 0;
        item.progressPhase = undefined;
        this.notify('item:updated', item);
    }

    updateProgress(id: string, progress: number, phase?: ProgressPhase): void {
        const item = this.items.get(id);
        if (!item) return;
        // Progress floor - never go backwards
        if (progress > item.progress) {
            item.progress = progress;
        }
        if (phase) {
            item.progressPhase = phase;
        }
        this.notify('item:progress', item);
    }

    setAbortController(id: string, controller: AbortController | undefined): void {
        const item = this.items.get(id);
        if (!item) return;
        item.abortController = controller;
    }

    markDownloaded(id: string): void {
        const item = this.items.get(id);
        if (!item) return;
        item.isDownloaded = true;
        this.notify('item:updated', item);
    }

    // ==========================================
    // Settings
    // ==========================================

    updateSettings(id: string, settings: Partial<VideoItemSettings>): void {
        const item = this.items.get(id);
        if (!item) return;
        item.settings = { ...item.settings, ...settings };
        this.notify('item:updated', item);
    }

    applySettingsToAll(settings: Partial<VideoItemSettings>): void {
        for (const item of this.items.values()) {
            item.settings = { ...item.settings, ...settings };
        }
        this.notify('items:settings-changed', { settings });
    }

    /**
     * Update metadata for an item.
     * Auto-sets status to 'ready' if current status is 'pending' or 'fetching_metadata'.
     * This fires a SINGLE event with both metadata and status updated.
     */
    updateMetadata(id: string, meta: Partial<VideoMeta>): void {
        const item = this.items.get(id);
        if (!item) {
            console.log('[VideoStore] updateMetadata failed - item not found:', id);
            return;
        }

        console.log('[VideoStore] updateMetadata:', id, 'status before:', item.status);
        item.meta = { ...item.meta, ...meta };

        // Auto-transition from loading → ready (like ytmp3.gg)
        if (item.status === 'pending' || item.status === 'fetching_metadata') {
            item.status = 'ready';
        }

        console.log('[VideoStore] updateMetadata:', id, 'status after:', item.status, 'firing item:updated');

        this.notify('item:updated', item);
    }

    setAudioLanguages(id: string, languages: string[]): void {
        const item = this.items.get(id);
        if (!item) return;
        item.availableAudioLanguages = languages;
        this.notify('item:updated', item);
    }

    setAudioTrackInfo(id: string, languages: string[], changed: boolean): void {
        const item = this.items.get(id);
        if (!item) return;
        item.availableAudioLanguages = languages;
        item.audioLanguageChanged = changed;
        this.notify('item:updated', item);
    }

    triggerUpdate(): void {
        this.notify('item:updated', null);
    }

    // ==========================================
    // Query helpers
    // ==========================================

    getItemsByStatus(...statuses: VideoItem['status'][]): VideoItem[] {
        return this.getAllItems().filter(item => statuses.includes(item.status));
    }

    getDownloadableItems(): VideoItem[] {
        return this.getAllItems().filter(item => DOWNLOADABLE_STATUSES.includes(item.status));
    }

    getSelectedDownloadable(): VideoItem[] {
        return this.getAllItems().filter(item =>
            item.isSelected && DOWNLOADABLE_STATUSES.includes(item.status)
        );
    }

    getGroupIds(): string[] {
        const ids = new Set<string>();
        for (const item of this.items.values()) {
            if (item.groupId) ids.add(item.groupId);
        }
        return Array.from(ids);
    }

    // ==========================================
    // Observer
    // ==========================================

    subscribe(callback: StoreListener): () => void {
        this.listeners.add(callback);
        return () => {
            this.listeners.delete(callback);
        };
    }

    private notify(eventName: VideoStoreEventName, data: any): void {
        for (const listener of this.listeners) {
            try {
                listener(eventName, data);
            } catch (err) {
                console.error('[VideoStore] Listener error:', err);
            }
        }
    }

    // ==========================================
    // Private helpers
    // ==========================================

    private isSelectableStatus(status: VideoItem['status']): boolean {
        return DOWNLOADABLE_STATUSES.includes(status) || status === 'completed';
    }
}

// Singleton
export const videoStore = new VideoStore();
