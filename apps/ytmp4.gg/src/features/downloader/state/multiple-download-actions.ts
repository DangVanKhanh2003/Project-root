
import { setState, getState } from './state-manager.js';
import { VideoItem, MultipleDownloadStatus, MultipleDownloadsState } from './multiple-download-types.js';

// ==========================================
// Multiple Downloads Actions
// ==========================================

export function setMultipleDownloadMode(isEnabled: boolean, mode: 'playlist' | 'batch' = 'batch') {
    setState({
        isEnabled,
        mode,
        // Reset state when entering mode if needed, but for now we keep it simple
        items: isEnabled ? getState().items : [], // Clear items if disabling
        globalStatus: 'idle',
        totalProgress: 0
    } as Partial<MultipleDownloadsState>);
}

export function addVideoItems(newItems: VideoItem[]) {
    const currentItems = getState().items || [];
    // Filter duplicates based on ID or URL if necessary
    const uniqueItems = newItems.filter(newItem => !currentItems.some(existing => existing.id === newItem.id));

    setState({
        items: [...currentItems, ...uniqueItems]
    } as Partial<MultipleDownloadsState>);
}

export function removeVideoItem(itemId: string) {
    const currentItems = getState().items || [];
    setState({
        items: currentItems.filter(item => item.id !== itemId)
    } as Partial<MultipleDownloadsState>);
}

export function updateVideoItem(itemId: string, updates: Partial<VideoItem>) {
    const currentItems = getState().items || [];
    const itemIndex = currentItems.findIndex(item => item.id === itemId);

    if (itemIndex > -1) {
        const updatedItems = [...currentItems];
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], ...updates };
        setState({ items: updatedItems } as Partial<MultipleDownloadsState>);
    }
}

export function setGlobalStatus(status: MultipleDownloadStatus) {
    setState({ globalStatus: status } as Partial<MultipleDownloadsState>);
}

export function updateGlobalProgress(progress: number) {
    setState({ totalProgress: progress } as Partial<MultipleDownloadsState>);
}

export function setZipUrl(url: string) {
    setState({ zipUrl: url, isZipAvailable: true } as Partial<MultipleDownloadsState>);
}

export function resetMultipleDownloads() {
    setState({
        isEnabled: false,
        items: [],
        globalStatus: 'idle',
        totalProgress: 0,
        isZipAvailable: false,
        zipUrl: undefined
    } as Partial<MultipleDownloadsState>);
}

// Helper to get video item by ID
export function getVideoItem(itemId: string): VideoItem | undefined {
    return getState().items?.find(item => item.id === itemId);
}
