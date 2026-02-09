
import { VideoItem, VideoItemSettings } from '../../state/multiple-download-types';

/**
 * Interface for Video Item Renderer Strategies
 * Allows different rendering logic for Multi-Download vs Playlist modes
 */
export interface RendererStrategy {
    buildSettingsContent(item: VideoItem): string;
    getActionButton(item: VideoItem, context: { isFileDownloading?: boolean, currentDownloadingItemId?: string }): string;
    getSettingsClass(item: VideoItem): string;
    getCheckboxHtml(item: VideoItem): string;
    getStatusHtml(item: VideoItem): string;
    afterRender?(el: HTMLElement, item: VideoItem): void;
}
