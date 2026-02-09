
import { VideoMeta } from './types.js';
import { MediaFormatsDto } from '@downloader/core';

export type MultipleDownloadStatus = 'idle' | 'analyzing' | 'ready' | 'downloading' | 'completed' | 'error';

export interface VideoItemSettings {
    format: 'mp3' | 'mp4';
    quality: string;
    audioTrack?: string;
}

export interface VideoItem {
    id: string; // Unique ID (e.g., from URL or random)
    url: string;
    meta: VideoMeta;
    status: 'pending' | 'analyzing' | 'fetching_metadata' | 'ready' | 'queued' | 'downloading' | 'converting' | 'completed' | 'error' | 'cancelled';
    progress: number;
    error?: string;
    settings: VideoItemSettings;
    downloadUrl?: string; // Result URL
    filename?: string;
    isSelected: boolean;
    formats?: MediaFormatsDto;
}

export interface MultipleDownloadsState {
    isEnabled: boolean; // Toggle between Single/Multi mode
    mode: 'playlist' | 'batch'; // Context
    items: VideoItem[];
    globalStatus: MultipleDownloadStatus;
    totalProgress: number; // 0-100
    expandedGroupId?: string; // For playlist grouping if needed
    isZipAvailable: boolean; // Desktop only
    zipUrl?: string;
}
