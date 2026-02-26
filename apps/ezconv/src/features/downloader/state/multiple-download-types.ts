
import { VideoMeta } from './types.js';
import { MediaFormatsDto } from '@downloader/core';

export type MultipleDownloadStatus = 'idle' | 'analyzing' | 'ready' | 'downloading' | 'completed' | 'error';

export type ProgressPhase = 'extracting' | 'processing' | 'merging';

export interface VideoItemSettings {
    format: 'mp3' | 'mp4';
    quality: string;
    audioFormat?: string;
    audioBitrate?: string;
    videoQuality?: string;
    audioTrack?: string;
    trimStart?: number;
    trimEnd?: number;
    trimRangeLabel?: string;
    filenameStyle?: 'classic' | 'basic' | 'pretty' | 'nerdy';
    enableMetadata?: boolean;
}

export interface VideoItem {
    id: string;
    url: string;
    meta: VideoMeta;
    status: 'pending' | 'analyzing' | 'fetching_metadata' | 'ready' | 'queued' | 'downloading' | 'converting' | 'completed' | 'error' | 'cancelled';
    progress: number;
    progressPhase?: ProgressPhase;
    error?: string;
    settings: VideoItemSettings;
    downloadUrl?: string;
    filename?: string;
    isSelected: boolean;
    isDownloaded: boolean;
    formats?: MediaFormatsDto;
    abortController?: AbortController;
    groupId?: string;
    groupTitle?: string;
    availableAudioLanguages?: string[];
    audioLanguageChanged?: boolean;
}

export interface MultipleDownloadsState {
    isEnabled: boolean;
    mode: 'playlist' | 'batch';
    items: VideoItem[];
    globalStatus: MultipleDownloadStatus;
    totalProgress: number;
    expandedGroupId?: string;
    isZipAvailable: boolean;
    zipUrl?: string;
}

// Store event types
export type VideoStoreEventName =
    | 'item:added'
    | 'item:removed'
    | 'item:updated'
    | 'item:progress'
    | 'items:cleared'
    | 'items:selection-changed'
    | 'items:settings-changed'
    | 'group:updated';

export interface VideoStoreEvent {
    name: VideoStoreEventName;
    data: any;
}
