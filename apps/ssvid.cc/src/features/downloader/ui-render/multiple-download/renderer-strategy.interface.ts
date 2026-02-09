
import { VideoItem, VideoItemSettings } from '../../state/multiple-download-types';

/**
 * Interface for Video Item Renderer Strategies
 * Allows different rendering logic for Multi-Download vs Playlist modes
 */
export interface RendererStrategy {
    /**
     * Build the HTML for the settings area (badges or dropdowns)
     */
    buildSettingsContent(item: VideoItem): string;

    /**
     * Get the action button HTML (download, specific actions)
     */
    getActionButton(item: VideoItem, context: { isFileDownloading?: boolean, currentDownloadingItemId?: string }): string;

    /**
     * Get additional classes for the settings container
     */
    getSettingsClass(item: VideoItem): string;

    /**
     * Get the checkbox HTML (or empty string if not applicable)
     */
    getCheckboxHtml(item: VideoItem): string;

    /**
     * Build status badge HTML
     */
    getStatusHtml(item: VideoItem): string;
}
