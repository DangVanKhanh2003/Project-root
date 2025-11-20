import { api } from '../../../../api';
import { getExpiryTime, getIOSStreamMaxSize } from '../../../../environment';
import { setConversionTask, updateConversionTask, getConversionTask, getState, setVideoDetail, setGalleryDetail, updateVideoDetailFormat } from '../../state';
import { getPollingManager } from '../concurrent-polling';
import { isLinkExpired, DOWNLOAD_LINK_TTL } from '../../../../utils/link-validator';
import { getConversionModal } from '../../../../ui-components/modal/conversion-modal';
import { triggerDownload, isIOS, isWindows } from '../../../../utils';
import { PollingProgressMapper } from '../../../../utils/polling-progress-mapper';
import { downloadStreamToRAM } from '../../../../utils/download-stream';
import { YOUTUBE_API_CONSTANTS } from '../../../../constants/youtube-constants';

// Simple YouTube URL validator
function isYouTubeUrl(url: string): boolean {
    return /(?:youtube\.com|youtu\.be)/.test(url);
}

// Type Definitions
interface FormatData {
    id: string;
    category: string;
    type: string;
    quality: string;
    size: number | null;
    sizeText: string;
    url: string | null;
    vid: string | null;
    key: string | null;
    encryptedUrl: string | null;
    isConverted: boolean;
    q_text: string | null;
    fps: number | null;
    bitrate: number | null;
    isFakeData: boolean;
    extractV2Options: any | null;
    duration: number | null;
    format?: string;
    filename?: string;
    completedAt?: number;
    updatedAt?: number;
}

interface ConversionTask {
    sourceId?: string;
    quality?: string;
    format?: string;
    state?: 'Idle' | 'Extracting' | 'Processing' | 'Polling' | 'Converting' | 'Success' | 'Failed' | 'Canceled';
    statusText?: string;
    showProgressBar?: boolean;
    startedAt?: number;
    formatData?: FormatData;
    autoDownloadOnComplete?: boolean;
    completedAt?: number;
    downloadUrl?: string;
    error?: string;
    extractResponse?: ExtractResponse;
    pollingPhase?: string;
    pollingData?: any;
    warningMessage?: string | null;
    progressMapper?: PollingProgressMapper;
    ramBlob?: Blob;
    filename?: string;
    streamMetadata?: {
        contentType: string;
        platform: string;
        filename: string;
    };
}

interface VideoDetail {
    meta: {
        title: string;
        originalUrl: string;
        status: string;
        vid?: string;
        duration?: number;
        completedAt?: number;
        isFakeData?: boolean;
        thumbnail?: string;
        source?: string;
    };
    formats: {
        video: any[];
        audio: any[];
    };
    completedAt?: number;
}

interface GalleryDetail {
    meta: any;
    gallery: any[];
    completedAt?: number;
}

interface ExtractResponse {
    url: string;
    filename?: string;
    size?: number;
    status: 'static' | 'stream';
    progressUrl?: string;
}

interface PollingData {
    videoProgress: number;
    audioProgress: number;
    status: string;
    mergedUrl: string | null;
    filename?: string;
}

interface PlatformRouting {
    platform: string;
    size?: number;
    iosMaxSize?: number;
    status: string;
    routeType: 'static-direct' | 'ios-stream-ram' | 'ios-stream-polling' | 'windows-mp4-stream' | 'other-stream';
    description: string;
}

interface SetupExtractPhaseParams {
    formatId: string;
    formatData: FormatData;
    videoTitle: string;
    videoUrl: string;
}

interface ProgressBarManager {
    startDownloadingPhase(options: {
        totalSize: number;
        onProgress: (callback: (loaded: number, total: number) => void) => Promise<void>;
        onComplete?: () => void;
    }): void;
    startPollingPhase(): void;
    updatePollingProgress(displayProgress: number, statusText: string): void;
    completePollingPhase(onComplete?: () => void): void;
    stop(): void;
}

interface ConversionModal {
    open(config: any): void;
    close(): void;
    isOpen: boolean;  // ✅ Property getter, not function
    getProgressBarManager(): ProgressBarManager | null;
    getAbortSignal(): AbortSignal | null;
    showDownloadButton(url: string, options?: any): void;
    transitionToError(message: string): void;
    transitionToSuccess(url: string): void;
    transitionToExpired(videoTitle: string): void;
}

interface PollingManager {
    startPolling(formatId: string, data: any): void;
    stopPolling(formatId: string): void;
}

interface AppState {
    videoDetail?: VideoDetail;
    galleryDetail?: GalleryDetail;
}

// Initialize concurrent polling manager
const pollingManager = getPollingManager({
    maxConcurrent: 5,
    pollInterval: 1000,
    maxPollingDuration: 10 * 60 * 1000
});

// Get conversion modal singleton instance
const conversionModal = getConversionModal();


/**
 * Get the relevant completedAt timestamp for expiration checking
 * @param task - Conversion task object
 * @param videoDetail - Video detail from state (optional for YouTube)
 * @param galleryDetail - Gallery detail from state (optional)
 * @returns Timestamp to use for expiration check
 */
function getExpirationTime(task: ConversionTask, videoDetail: VideoDetail | null = null, galleryDetail: GalleryDetail | null = null): number {
    // YouTube items have vid - use conversion completedAt
    if (task.formatData && task.formatData.vid) {
        return task.completedAt || 0; // YouTube conversion time
    }

    // Social Media items - use extract completedAt from detail
    const detail = videoDetail || galleryDetail;
    if (detail && detail.completedAt) {
        return detail.completedAt; // API extract time
    }

    // Fallback to task completedAt if detail not available
    return task.completedAt || 0;
}

/**
 * Detect platform and routing requirements for download phase - 5 distinct cases
 * @param extractResponse - API response with size, status, etc.
 * @param formatData - Format data with type info
 * @returns Routing decision object
 */
function detectPlatformRouting(extractResponse: ExtractResponse, formatData: FormatData): PlatformRouting {
    const { size, status } = extractResponse;

    // 🔍 DEBUG: Platform routing decision
    const sizeMB = size ? Math.round(size / (1024 * 1024)) : 0;
    const userAgent = navigator?.userAgent || 'undefined';
    const maxTouchPoints = navigator?.maxTouchPoints || 0;


    // 🎯 CASE 1: Static Content - Direct Download (a.click)
    if (status === 'static') {
        return {
            platform: 'Any',
            size, status,
            routeType: 'static-direct',
            description: 'Static file direct download (a.click)'
        };
    }

    // 🎯 CASE 2 & 3: iOS Stream Content
    if (isIOS() && status === 'stream') {
        // If size is unknown, default to polling for safety
        if (!size) {
            return {
                platform: 'iOS',
                size, iosMaxSize: getIOSStreamMaxSize(),
                status, routeType: 'ios-stream-polling',
                description: 'iOS stream (unknown size) → polling (safe default)'
            };
        }

        if (size > getIOSStreamMaxSize()) {
            // iOS Large Stream → Polling
            return {
                platform: 'iOS',
                size, iosMaxSize: getIOSStreamMaxSize(),
                status, routeType: 'ios-stream-polling',
                description: `iOS large stream (${Math.round(size/1024/1024)}MB > 150MB) → polling`
            };
        } else {
            // iOS Small Stream → RAM Download
            const result: PlatformRouting = {
                platform: 'iOS',
                size, iosMaxSize: getIOSStreamMaxSize(),
                status, routeType: 'ios-stream-ram',
                description: `iOS small stream (${Math.round(size/1024/1024)}MB ≤150MB) → RAM download`
            };
            return result;
        }
    }

    // 🎯 CASE 4: Windows MP4 Stream
    if (isWindows() && formatData.type === 'mp4' && status === 'stream') {
        return {
            platform: 'Windows',
            size, status,
            routeType: 'windows-mp4-stream',
            description: 'Windows MP4 stream → special handling'
        };
    }

    // 🎯 CASE 5: Other Stream Cases
    if (status === 'stream') {
        return {
            platform: isWindows() ? 'Windows' : 'Other',
            size, status,
            routeType: 'other-stream',
            description: 'Other platform stream → stream download'
        };
    }

    // ❓ Fallback (shouldn't happen)
    return {
        platform: 'Unknown', size, status,
        routeType: 'static-direct',
        description: 'Fallback to static direct'
    };
}

// ❌ REMOVED: setupExtractPhase() function
// New architecture: Phase 1 (EXTRACTING) has no progress bar
// Phase 2 (CONVERTING) is handled directly by routeDownloadPhase()

/**
 * Helper: Update both conversionTask AND videoDetailFormat with extracted URL
 * Ensures URL persists in state for future clicks (no re-extraction needed)
 *
 * @param formatId - Format identifier
 * @param url - Download URL from extract API
 * @param formatData - Format metadata (quality, type, etc.)
 * @param extractResponse - Full extract response from API (optional)
 * @param additionalTaskData - Additional fields for conversionTask (optional)
 */
function updateFormatWithExtractedUrl(formatId: string, url: string, formatData: FormatData, extractResponse: ExtractResponse | null = null, additionalTaskData: Partial<ConversionTask> = {}): void {
    const completedAt = Date.now();

    const taskUpdate: Partial<ConversionTask> = {
        state: 'Success',
        downloadUrl: url,
        completedAt: completedAt,
        ...additionalTaskData
    };

    // Update conversion task
    updateConversionTask(formatId, taskUpdate);

    // ✅ CRITICAL: Update videoDetail.formats with URL and metadata
    // This allows subsequent clicks to reuse URL without API call
    if (formatData) {
        const formatUpdate: any = {
            url: url,
            quality: formatData.quality,
            type: formatData.type,
            isFakeData: false,

            // ✅ Add timestamp for expiry check
            completedAt: completedAt,
            updatedAt: completedAt,
        };

        // Add data from extract response if available
        if (extractResponse) {
            if (extractResponse.size) {
                formatUpdate.size = extractResponse.size;
            }
            if (extractResponse.status) {
                formatUpdate.status = extractResponse.status; // 'static' or 'stream'
            }
            if (extractResponse.filename) {
                formatUpdate.filename = extractResponse.filename;
            }
        }

        updateVideoDetailFormat(formatId, formatUpdate);
    }
}

interface HandleStaticDirectDownloadParams {
    formatId: string;
    url: string;
    formatData: FormatData;
    extractResponse: ExtractResponse;
}

/**
 * Handle static direct download case (Case 1: Static → direct download ready)
 * No progress bar animation needed - download URL is ready immediately
 */
function handleStaticDirectDownload({ formatId, url, formatData, extractResponse }: HandleStaticDirectDownloadParams): void {
    // Update format with extracted URL
    updateFormatWithExtractedUrl(formatId, url, formatData, extractResponse);

    // Show download button immediately (no progress animation)
    const conversionModal = getConversionModal();
    conversionModal.showDownloadButton(url);
}

interface HandleIOSStreamRAMParams {
    formatId: string;
    url: string;
    filename?: string;
    size?: number;
}

/**
 * Handle iOS stream RAM download case (Case 2: iOS stream ≤150MB → RAM)
 * Downloads stream to RAM with real-time progress (0% → 100%)
 */
function handleIOSStreamRAM({ formatId, url, filename, size }: HandleIOSStreamRAMParams): void {
    const conversionModal = getConversionModal();
    const progressBarManager = conversionModal.getProgressBarManager();

    if (!progressBarManager) {
        throw new Error('Progress bar not initialized');
    }

    // Start downloading phase with real progress
    progressBarManager.startDownloadingPhase({
        totalSize: size || 0,
        onProgress: async (onProgressCallback: (loaded: number, total: number) => void) => {
            try {
                const blob = await downloadStreamToRAM(url, {
                    onProgress: ({ loaded, total }) => onProgressCallback(loaded, total)
                });

                updateConversionTask(formatId, {
                    state: 'Success',
                    downloadUrl: url,
                    completedAt: Date.now(),
                    ramBlob: blob,
                    filename: filename
                });

            } catch (error: any) {
                conversionModal.transitionToError(error.message || 'Download failed');
            }
        },
        onComplete: () => {
            // Show download button after progress reaches 100%
            conversionModal.showDownloadButton(url, {
                buttonText: 'Download from RAM',
                downloadMode: 'ram'
            });
        }
    });
}

interface HandleIOSStreamPollingParams {
    formatId: string;
    url: string;
    size?: number;
    extractResponse: ExtractResponse;
    formatData: FormatData;
}

/**
 * Handle iOS stream polling download case (Case 3: iOS stream >150MB → polling)
 */
async function handleIOSStreamPolling({ formatId, url, size, extractResponse, formatData }: HandleIOSStreamPollingParams): Promise<void> {
    const sizeMB = size ? Math.round(size / (1024 * 1024)) : 0;

    // Start real polling flow
    await startPollingFlow({
        formatId,
        extractResponse,
        formatData,
        pollingReason: 'ios-large-stream',
        warningMessage: `Large stream file (${sizeMB}MB) may cause memory issues on iOS.`,
        size
    });
}

interface HandleWindowsMP4StreamParams {
    formatId: string;
    url: string;
    filename?: string;
    size?: number;
    extractResponse: ExtractResponse;
    formatData: FormatData;
}

/**
 * Handle Windows MP4 stream download case (Case 4: Windows MP4 stream)
 */
async function handleWindowsMP4Stream({ formatId, url, filename, size, extractResponse, formatData }: HandleWindowsMP4StreamParams): Promise<void> {
    const sizeMB = size ? Math.round(size / (1024 * 1024)) : 0;

    // Start real polling flow
    await startPollingFlow({
        formatId,
        extractResponse,
        formatData,
        pollingReason: 'windows-mp4',
        warningMessage: null, // No warning for Windows MP4
        size
    });
}

interface HandleOtherStreamParams {
    formatId: string;
    url: string;
    filename?: string;
    size?: number;
}

/**
 * Handle other stream download case (Case 5: Other platform streams)
 * Direct download ready immediately (no progress animation)
 */
function handleOtherStream({ formatId, url, filename, size }: HandleOtherStreamParams): void {
    // Update task state
    updateConversionTask(formatId, {
        state: 'Success',
        downloadUrl: url,
        completedAt: Date.now(),
        streamMetadata: {
            contentType: 'stream',
            platform: 'Other',
            filename: filename || ''
        }
    });

    // Show download button immediately
    const conversionModal = getConversionModal();
    const sizeMB = size ? Math.round(size / (1024 * 1024)) : 0;
    conversionModal.showDownloadButton(url, {
        buttonText: sizeMB ? `Download Stream (${sizeMB}MB)` : 'Download Stream',
        downloadMode: 'stream'
    });
}

interface StartPollingFlowParams {
    formatId: string;
    extractResponse: ExtractResponse;
    formatData: FormatData;
    pollingReason: string;
    warningMessage: string | null;
    size?: number;
}

/**
 * Start polling flow with format-specific progress mapping
 *
 * WHY: Implement real polling for iOS large streams and Windows MP4 with 2-phase progress
 * CONTRACT: (options:object) → Promise<void> - manages polling lifecycle
 * PRE: Valid progressUrl in extractResponse, ConcurrentPollingManager available
 * POST: Updates conversion task state through polling phases, triggers modal completion
 * EDGE: No progressUrl → fallback to checkTask polling; API errors → transition to error
 * USAGE: await startPollingFlow({ progressBar, formatId, extractResponse, formatData });
 */
async function startPollingFlow({ formatId, extractResponse, formatData, pollingReason, warningMessage, size }: StartPollingFlowParams): Promise<void> {
    try {
        // Get format and file size for progress mapping
        const format = formatData.format || formatData.type || 'mp4';
        const fileSizeMB = size ? Math.round(size / (1024 * 1024)) : 200;

        // Reset polling mapper with format and file size
        PollingProgressMapper.reset(format, fileSizeMB);

        // Get progress bar manager
        const conversionModal = getConversionModal();
        const progressBarManager = conversionModal.getProgressBarManager();

        if (!progressBarManager) {
            throw new Error('Progress bar not initialized');
        }

        // Start polling phase (0%)
        progressBarManager.startPollingPhase();

        // Setup polling state
        updateConversionTask(formatId, {
            state: 'Polling',
            statusText: 'Processing...',
            showProgressBar: true,
            pollingPhase: 'processing',
            pollingData: {
                videoProgress: 0,
                audioProgress: 0,
                status: 'in_progress',
                mergedUrl: null
            },
            warningMessage: warningMessage
        });

        // ONLY use progressUrl polling - no fallbacks
        if (!extractResponse.progressUrl) {
            throw new Error('No progressUrl in extract response - polling not supported for this request');
        }

        await startRichProgressPolling(formatId, extractResponse.progressUrl);

    } catch (error: any) {
        updateConversionTask(formatId, {
            state: 'Failed',
            statusText: 'Polling failed',
            showProgressBar: false,
            error: error.message || 'Polling error',
            completedAt: Date.now()
        });

        const conversionModal = getConversionModal();
        conversionModal.transitionToError(error.message || 'Polling failed');
    }
}

/**
 * Start rich progress polling using progressUrl (preferred method)
 */
async function startRichProgressPolling(formatId: string, progressUrl: string): Promise<void> {

    const pollingManager = getPollingManager({
        maxConcurrent: 5,
        pollInterval: 1000,
        maxPollingDuration: 10 * 60 * 1000
    });

    // Create custom polling task for progress URL
    const customPollData = {
        formatId: formatId,
        progressUrl: progressUrl,
        pollType: 'progress', // vs 'status' for simple polling
        onProgressUpdate: async (apiData: PollingData) => {
            await handleProgressUpdate(formatId, apiData);
        }
    };

    // Start polling with ConcurrentPollingManager
    pollingManager.startPolling(formatId, customPollData);
}

// Removed obsolete checkTask polling - only progressUrl polling is used now

/**
 * Handle progress update from rich progress polling
 */
async function handleProgressUpdate(formatId: string, apiData: PollingData): Promise<void> {
    const { videoProgress, audioProgress, status, mergedUrl, filename } = apiData;
    const task = getConversionTask(formatId);


    // Phase detection based on API response
    // When mergedUrl exists → conversion is completely done
    if (mergedUrl) {
        await completePolling(formatId, mergedUrl);
        return;
    }

    // No mergedUrl yet → still processing or transitioning to merging
    const currentPhase = task?.pollingPhase || 'processing';

    // Check if we should transition to merging phase
    // This happens when processing progress is high (both video and audio near completion)
    // For audio-only formats (MP3), only audioProgress matters since videoProgress is 0
    const isAudioOnly = formatId.startsWith('audio|');
    const progressComplete = isAudioOnly
        ? (audioProgress >= 100)
        : (videoProgress >= 100 && audioProgress >= 100);

    const isProcessingComplete = progressComplete ||
                                (status && (status.toLowerCase().includes('merg') || status.toLowerCase() === 'completed'));


    if (isProcessingComplete && currentPhase === 'processing') {
        // Transition: Processing → Merging
        PollingProgressMapper.startMergingPhase();

        updateConversionTask(formatId, {
            pollingPhase: 'merging',
            statusText: 'Merging files...',
            pollingData: { videoProgress, audioProgress, status, mergedUrl, filename }
        });

        // Update progress bar for merging phase
        const conversionModal = getConversionModal();
        const progressBarManager = conversionModal.getProgressBarManager();

        if (progressBarManager) {
            const displayProgress = PollingProgressMapper.mapProgress(apiData);
            const statusText = PollingProgressMapper.getStatusText(apiData);
            progressBarManager.updatePollingProgress(displayProgress, statusText);
        }

    } else {
        // Continue current phase (either still processing or merging in progress)
        const displayProgress = PollingProgressMapper.mapProgress(apiData);
        const statusText = PollingProgressMapper.getStatusText(apiData);

        updateConversionTask(formatId, {
            statusText: statusText,
            pollingData: { videoProgress, audioProgress, status, mergedUrl, filename }
        });

        // Update progress bar with mapped progress
        const conversionModal = getConversionModal();
        const progressBarManager = conversionModal.getProgressBarManager();

        if (progressBarManager) {
            // Update visual progress with mapped percentage
            progressBarManager.updatePollingProgress(displayProgress, statusText);
        }
    }
}

// Removed obsolete status update handler - only progressUrl updates are used now

/**
 * Complete polling and show download button
 */
async function completePolling(formatId: string, downloadUrl: string): Promise<void> {

    const pollingManager = getPollingManager({
        maxConcurrent: 5,
        pollInterval: 1000,
        maxPollingDuration: 10 * 60 * 1000
    });
    pollingManager.stopPolling(formatId);

    // Complete progress bar animation
    const conversionModal = getConversionModal();
    const progressBarManager = conversionModal.getProgressBarManager();
    if (progressBarManager) {
        progressBarManager.completePollingPhase(() => {
            // Transition to success after animation completes
            conversionModal.transitionToSuccess(downloadUrl);
        });
    } else {
        // Fallback if no progress bar
        conversionModal.transitionToSuccess(downloadUrl);
    }

    // Update task state
    updateConversionTask(formatId, {
        state: 'Success',
        statusText: 'Ready',
        showProgressBar: false,
        downloadUrl: downloadUrl,
        completedAt: Date.now()
    });
}

interface RouteDownloadPhaseParams {
    routing: PlatformRouting;
    formatId: string;
    extractResponse: ExtractResponse;
    formatData: FormatData;
}

/**
 * Route download phase to appropriate handler - 5 distinct cases
 */
function routeDownloadPhase({ routing, formatId, extractResponse, formatData }: RouteDownloadPhaseParams): void {
    const { url, filename, size } = extractResponse;


    // Update task state
    updateConversionTask(formatId, {
        state: 'Processing',
        statusText: 'Processing...',
        extractResponse: extractResponse,
        showProgressBar: true // Enable progress bar for phase 2
    });


    // Route to appropriate handler based on 5 distinct cases
    switch (routing.routeType) {
        case 'static-direct':
            handleStaticDirectDownload({ formatId, url, formatData, extractResponse });
            break;

        case 'ios-stream-ram':
            handleIOSStreamRAM({ formatId, url, filename, size });
            break;

        case 'ios-stream-polling':
            handleIOSStreamPolling({ formatId, url, size, extractResponse, formatData });
            break;

        case 'windows-mp4-stream':
            handleWindowsMP4Stream({ formatId, url, filename, size, extractResponse, formatData });
            break;

        case 'other-stream':
            handleOtherStream({ formatId, url, filename, size });
            break;

        default:
            handleStaticDirectDownload({ formatId, url, formatData, extractResponse }); // Fallback to static
    }
}

/**
 * Smart Convert - Entry point for all convert button clicks
 * Checks status (stream/static) and expiry to route to appropriate flow
 *
 * WHY: Unified convert flow - always open modal, smart routing inside
 * CONTRACT: (formatId:string) → Promise<void> - opens modal and routes to correct flow
 * PRE: Valid formatId, videoDetail exists in state with meta.status
 * POST: Modal opened with appropriate state (CONVERTING or READY)
 * EDGE: No videoDetail → error; invalid status → default to extract
 * USAGE: await smartConvert('video|720p|mp4');
 */
export async function smartConvert(formatId: string): Promise<void> {

    try {
        // Get current state
        const state = getState() as AppState;
        const videoDetail = state.videoDetail;


        if (!videoDetail || !videoDetail.meta) {
            throw new Error('Video information not available. Please try searching again.');
        }

        // Get format data from state
        const formatData = await getFormatDataFromState(formatId);


        if (!formatData) {
            throw new Error('Format data not found. Please try again.');
        }

        // Get video info for modal
        const videoTitle = videoDetail.meta.title || 'Video';
        const videoUrl = videoDetail.meta.originalUrl || `https://www.youtube.com/watch?v=${formatData.vid}`;
        const status = videoDetail.meta.status || '';


        // PRIORITY 1: Check existing conversion task (from previous convert)
        const existingTask = getConversionTask(formatId);
        const isTaskSuccess = existingTask?.state === 'Success';
        const hasTaskUrl = !!(existingTask?.downloadUrl && isTaskSuccess); // Only use URL if task succeeded
        const taskCompletedAt = existingTask?.completedAt;

        // PRIORITY 2: Check formatData URL (from initial extract or updated after convert)
        const hasFormatUrl = !!(formatData.url || formatData.encryptedUrl);
        const formatCompletedAt = formatData.completedAt || formatData.updatedAt;

        // Determine which timestamp to use for expiry check
        // Priority: task > format > videoDetail
        const completedAt = taskCompletedAt || formatCompletedAt || videoDetail.completedAt;
        const staticExpireTime = getExpiryTime('static');
        const isDataValid = completedAt && (Date.now() - completedAt) <= staticExpireTime;


        // CASE 1: Has existing URL + Data still valid → Use existing (NO API CALL)
        const hasExistingUrl = hasTaskUrl || hasFormatUrl;

        if (hasExistingUrl && isDataValid) {
            const remainingMinutes = Math.round((staticExpireTime - (Date.now() - completedAt)) / 1000 / 60);

            // Priority: Task URL > Format URL (task URL is fresher)
            const downloadUrl = existingTask?.downloadUrl || formatData.url || formatData.encryptedUrl || '';


            // Create/update conversion task with existing URL
            setConversionTask(formatId, {
                sourceId: formatData.vid || '',
                quality: formatData.quality || 'Unknown',
                format: formatData.type || 'mp4',
                state: 'Success',
                statusText: 'Ready',
                showProgressBar: false,
                downloadUrl: downloadUrl,
                completedAt: completedAt,
                startedAt: completedAt,
                formatData: formatData
            });

            // ✅ Open modal DIRECTLY in SUCCESS state
            // No progress bar, no conversion animation
            // Just show "Ready to Download" immediately
            conversionModal.open({
                provider: 'youtube',
                formatId: formatId,
                formatData: formatData,
                videoTitle: videoTitle,
                videoUrl: videoUrl,
                initialStatus: 'SUCCESS',  // ← Skip CONVERTING state
                downloadUrl: downloadUrl    // ← URL ready for download
            });

            return;
        }

        // CASE 2: Stream status OR No existing URL OR Data expired → Extract fresh
        if (status === 'stream' || !hasExistingUrl || !isDataValid) {

            await handleYouTubeDownload(formatData, false);
            return;
        }

        // CASE 3: Fallback (shouldn't reach here)
        await handleYouTubeDownload(formatData, false);

    } catch (error: any) {
        // Show error in modal if possible
        if (conversionModal.isOpen) {
            conversionModal.transitionToError(error.message || 'Failed to start conversion');
        } else {
            // If modal not open, just log (UI should show error somewhere else)
        }
        throw error;
    }
}

/**
 * Helper function to extract format data from state
 * (Extracted from download-rendering.js for reuse)
 */
async function getFormatDataFromState(formatId: string): Promise<FormatData | null> {
    try {
        const state = getState() as AppState;
        const videoDetail = state.videoDetail;

        if (!videoDetail || !videoDetail.formats) {
            return null;
        }

        const { formats, meta } = videoDetail;

        // Parse formatId to get category
        const parts = formatId.split('|');
        if (parts.length < 2) {
            return null;
        }

        const category = parts[0]; // 'video' or 'audio'

        // Get format array based on category
        const formatArray = category === 'video' ? formats.video : formats.audio;

        if (!Array.isArray(formatArray)) {
            return null;
        }

        // Process formats using format-processor
        const { processFormatArray } = await import('../../../../utils/format-utils');
        const processedFormats = processFormatArray(formatArray, category);

        // Find matching format by ID
        const format = processedFormats.find((f: any) => f.id === formatId);

        if (!format) {
            return null;
        }

        // Build complete format data
        const formatData: FormatData = {
            id: format.id,
            category: format.category,
            type: format.type,
            quality: format.quality,
            size: typeof format.size === 'number' ? format.size : null,
            sizeText: format.sizeText || format.size || '',
            url: format.url || null,
            vid: meta.vid || format.vid || null,
            key: format.key || null,
            encryptedUrl: format.url || null,
            isConverted: format.isConverted,
            q_text: format.q_text || null,
            fps: format.fps || null,
            bitrate: format.bitrate || null,
            isFakeData: format.isFakeData || false,
            extractV2Options: format.extractV2Options || null,
            duration: format.duration || meta.duration || null
        };

        return formatData;

    } catch (error) {
        return null;
    }
}

interface ApiResult {
    ok: boolean;
    data?: any;
    message?: string;
}

/**
 * 2-Phase YouTube Download Handler
 * Phase 1: Extract (0% → 30%), Phase 2: Download (30% → 100%)
 * @param formatData - The format data object with extractV2Options
 * @param autoDownload - Auto-download when conversion completes
 * @returns Result object
 */
export async function handleYouTubeDownload(formatData: FormatData, autoDownload: boolean = false): Promise<ApiResult> {
    const formatId = formatData.id;

    try {
        // Get video info from state
        const state = getState() as AppState;
        const videoDetail = state.videoDetail;
        const videoTitle = videoDetail?.meta?.title || 'Video';
        const videoUrl = videoDetail?.meta?.originalUrl || `https://www.youtube.com/watch?v=${formatData.vid}`;


        // ========================================
        // PHASE 1: EXTRACTING (No progress bar)
        // ========================================

        // Open modal in EXTRACTING state
        const conversionModal = getConversionModal();
        const isModalOpen = conversionModal.isOpen;

        if (!isModalOpen) {
            conversionModal.open({
                provider: 'youtube',
                formatId: formatId,
                formatData: formatData,
                videoTitle: videoTitle,
                videoUrl: videoUrl,
                initialStatus: 'EXTRACTING' // Open in EXTRACTING state (no progress bar)
            });
        }

        // Create conversion task
        setConversionTask(formatId, {
            sourceId: formatData.vid || '',
            quality: formatData.quality || 'Unknown',
            format: formatData.type || 'mp4',
            state: 'Extracting',
            statusText: 'Extracting...',
            showProgressBar: false, // No progress bar in extract phase
            startedAt: Date.now(),
            formatData: formatData,
            autoDownloadOnComplete: false
        });

        // ========================================
        // STEP 2: CALL EXTRACT V2 API
        // ========================================

        let extractOptions = formatData.extractV2Options;

        // Handle format ID mismatch between constants and processed formats
        if (!extractOptions) {

            // Try to find matching format from constants by cleaning the ID
            const cleanId = formatData.id
                .replace('|direct', '')     // Remove "|direct" suffix
                .toLowerCase();             // Convert to lowercase to match constants


            // Look up in constants using cleaned ID
            try {
                // TODO: Implement findFormatById in youtube-constants if needed
                // For now, fallback format lookup is disabled
                const fallbackFormat = null; // findFormatById(cleanId, formatData.vid || '');
                if (fallbackFormat?.extractV2Options) {
                    extractOptions = fallbackFormat.extractV2Options;
                } else {
                }
            } catch (error) {
            }
        }

        if (!extractOptions) {
            throw new Error(`No extractV2Options found for format: ${formatData.id} (also tried fallback lookup)`);
        }


        // ✅ PHASE 2: Get AbortSignal from modal
        const abortSignal = conversionModal.getAbortSignal();

        // Prepare request body for YouTube Download API (V2)
        const downloadRequest = {
            url: videoUrl,
            downloadMode: extractOptions.downloadMode,
            brandName: 'yt1s.cx',
            videoQuality: extractOptions.videoQuality,
            youtubeVideoContainer: extractOptions.youtubeVideoContainer,
            audioQuality: extractOptions.audioQuality,
            youtubeAudioContainer: extractOptions.youtubeAudioContainer,
        };


        // Call YouTube Download API V2 (sv-190.y2mp3.co)
        const result = await api.downloadYouTube(downloadRequest, abortSignal || undefined);



        // ========================================
        // STEP 3: PROCESS EXTRACT RESPONSE & START DOWNLOAD PHASE
        // ========================================


        // YouTube Download API V2 returns wrapped response: {ok, status, data: {status, url, filename}}
        // Extract the actual data from the wrapper
        const extractData = (result as any)?.data || result as any;


        if (extractData && extractData.url) {
            // ========================================
            // PHASE 2: CONVERTING (Transition from EXTRACTING)
            // ========================================

            // Transition modal: EXTRACTING → CONVERTING
            conversionModal.transitionToConverting();

            const routing = detectPlatformRouting(extractData as ExtractResponse, formatData);

            await routeDownloadPhase({
                routing,
                formatId,
                extractResponse: extractData as ExtractResponse,
                formatData
            });

            return { ok: true, data: extractData as ExtractResponse };

        } else {
            // Extract failed
            const errorMessage = 'Failed to extract download URL';
            updateConversionTask(formatId, {
                state: 'Failed',
                statusText: 'Extraction failed',
                showProgressBar: false,
                error: errorMessage,
                completedAt: Date.now()
            });

            conversionModal.transitionToError(errorMessage);
            return { ok: false, message: errorMessage };
        }

    } catch (error: any) {

        // ✅ PHASE 2: Handle AbortError specially (user cancelled)
        if (error.reason === 'cancelled' || error.name === 'AbortError') {
            // Don't update task or show error - modal is already closed
            return { ok: false, message: 'Cancelled by user' };
        }

        const errorMessage = error.message || 'Network error during extraction';

        updateConversionTask(formatId, {
            state: 'Failed',
            statusText: 'Connection error',
            showProgressBar: false,
            error: errorMessage,
            completedAt: Date.now()
        });

        conversionModal.transitionToError(errorMessage);
        return { ok: false, message: errorMessage };
    }
}

/**
 * Handles social media downloads with inline conversion (unified approach)
 * @param formatData - The format data object with id, url, etc.
 * @param forceNew - Force new conversion, skip existing task check (default: true)
 * @returns Result object
 */
export async function handleSocialDecode(formatData: FormatData): Promise<ApiResult> {
    const formatId = formatData.id;

    // Expiration check for Social Media links removed as per user request.
    // The logic used to be here.

    try {

        // Create conversion task in state
        setConversionTask(formatId, {
            sourceId: formatData.url || '',
            quality: formatData.quality || 'Default',
            format: formatData.format || 'mp4',
            state: 'Converting',
            statusText: 'Decoding...',
            showProgressBar: true,
            startedAt: Date.now(),
            formatData: formatData
        });

        // Call decode URL service
        const result = await api.decodeUrl({ encrypted_url: formatData.url });

        // Type assertion for DecodeDto
        const decodeData = result.data as { success: boolean; url?: string; error?: string; reason?: string };

        if (result.ok && decodeData && decodeData.url) {
            // Success - direct download available
            updateConversionTask(formatId, {
                state: 'Success',
                statusText: 'Ready ',
                showProgressBar: false,
                downloadUrl: decodeData.url,
                completedAt: Date.now()
            });

            return { ok: true, data: decodeData };

        } else {
            // Decode failed
            const errorMessage = result.message || 'Failed to decode download link';

            updateConversionTask(formatId, {
                state: 'Failed',
                statusText: 'Decode failed',
                showProgressBar: false,
                error: errorMessage,
                completedAt: Date.now()
            });

            return { ok: false, message: errorMessage };
        }

    } catch (error: any) {

        updateConversionTask(formatId, {
            state: 'Failed',
            statusText: 'Connection error',
            showProgressBar: false,
            error: error.message || 'Network error',
            completedAt: Date.now()
        });

        return { ok: false, message: error.message };
    }
}

/**
 * Cancel a conversion task
 * @param formatId - Format identifier
 */
export function cancelConversion(formatId: string): void {

    // Stop polling if active
    const pollingManager = getPollingManager({
        maxConcurrent: 5,
        pollInterval: 1000,
        maxPollingDuration: 10 * 60 * 1000
    });

    pollingManager.stopPolling(formatId);

    // Update task state
    updateConversionTask(formatId, {
        state: 'Canceled',
        statusText: 'Conversion canceled',
        showProgressBar: false,
        completedAt: Date.now()
    });

}

/**
 * Retry a failed conversion
 * @param formatId - Format identifier
 */
export async function retryConversion(formatId: string): Promise<void> {

    const task = getConversionTask(formatId);

    if (!task || !task.formatData) {
        return;
    }

    // Note: handleYouTubeDownload will re-open modal with fresh CONVERTING state
    // The old modal state is destroyed and new state is created
    // This is correct behavior for retry flow

    // Determine conversion type and retry
    if (task.formatData.vid) {
        await handleYouTubeDownload(task.formatData, false); // false = don't auto-download
    } else {
        await handleSocialDecode(task.formatData);
    }
}

/**
 * Trigger download for completed conversion with smart link detection
 * @param formatId - Format identifier
 */
export async function downloadConvertedFile(formatId: string): Promise<void> {
    const task = getConversionTask(formatId);
    if (!task || task.state !== 'Success' || !task.downloadUrl) {
        return;
    }

    // 🔍 DEBUG: Log task details to understand download type

    // Get current state for expiration check
    const state = getState() as AppState;
    const videoDetail = state.videoDetail;

    // Check expire only for YouTube (has vid)
    if (task.formatData && task.formatData.vid) {
        const galleryDetail = state.galleryDetail;

        // Check if download link has expired
        const expirationTime = getExpirationTime(task, videoDetail || null, galleryDetail || null);
        if (isLinkExpired(expirationTime)) {
            if (!videoDetail || !videoDetail.meta) {
                return;
            }

            // Get video info for modal
            const videoTitle = videoDetail.meta.title || 'Video';
            const videoUrl = task.formatData.vid ? `https://www.youtube.com/watch?v=${task.formatData.vid}` : null;

            // ✅ Open modal DIRECTLY in EXPIRED state
            // Prevents auto-retry and shows "Retry" button for user to click
            const conversionModal = getConversionModal();
            if (!conversionModal.isOpen) {
                conversionModal.open({
                    provider: 'youtube',
                    formatId: formatId,
                    formatData: task.formatData,
                    videoTitle: videoTitle,
                    videoUrl: videoUrl,
                    initialStatus: 'EXPIRED' // ← Open directly in EXPIRED state
                });
            } else {
                // If modal already open, just transition
                conversionModal.transitionToExpired(videoTitle);
            }
            return;
        }
    }

    // Check if this is a RAM download (blob available)
    if (task.ramBlob && task.filename) {

        // Import triggerBlobDownload function
        const { triggerBlobDownload } = await import('../../../../utils');

        // Download from RAM blob
        triggerBlobDownload(task.ramBlob, task.filename);

        // Clean up blob from memory to free RAM
        updateConversionTask(formatId, {
            ...task,
            ramBlob: undefined // Clear blob reference
        });

    } else {
        // Traditional URL download

        // Extract filename from task or generate default
        const filename = task.filename ||
                        task.formatData?.filename ||
                        `download.${task.formatData?.format || 'mp4'}`;

        triggerDownload(task.downloadUrl, filename);
    }

    setTimeout(() => {
        conversionModal.close();
    }, 300);
}

/**
 * ReConvert function - handles YouTube stream/static status, fallback for other platforms
 * @param formatId - Format identifier
 */
export async function reConvert(formatId: string): Promise<void> {

    const task = getConversionTask(formatId);
    if (!task || !task.formatData) {
        return;
    }

    // Get video detail from state to determine platform and original URL
    const state = getState() as AppState;
    const videoDetail = state.videoDetail;
    const galleryDetail = state.galleryDetail;
    const detail = videoDetail || galleryDetail;

    // Get original URL for platform detection
    const originalUrl = detail?.meta?.originalUrl ||
        (task.formatData.vid ? `https://www.youtube.com/watch?v=${task.formatData.vid}` : null);

    // Check if this is YouTube using proper URL validation
    const isYouTubePlatform = originalUrl && isYouTubeUrl(originalUrl);

    if (!isYouTubePlatform) {
        // Other platforms: simple retry logic
        await handleSocialDecode(task.formatData);
        return;
    }

    // YouTube platform: Handle stream/static status
    const extractStatus = detail?.meta?.status || 'unknown';

    // CASE 1: Status = "stream" - Must refresh by calling conversion directly
    if (extractStatus === 'stream') {

        // For YouTube with stream status, directly proceed to conversion
        // The extractV2 API will handle fresh stream extraction during conversion
        try {
            await handleYouTubeDownload(task.formatData, false);
        } catch (error: any) {
            updateConversionTask(formatId, {
                state: 'Failed',
                statusText: 'Conversion failed',
                showProgressBar: false,
                error: error.message || 'Failed to convert stream data',
                completedAt: Date.now()
            });
        }
        return;
    }

    // CASE 2: Status = "static" - Check configured expiry time
    if (extractStatus === 'static') {
        const staticExpireTime = getExpiryTime('static');

        const extractTime = detail?.completedAt || detail?.meta?.completedAt;

        if (extractTime && (Date.now() - extractTime) <= staticExpireTime) {
            // Static data still valid - proceed with conversion
            const remainingMinutes = Math.round((staticExpireTime - (Date.now() - extractTime)) / 1000 / 60);
            await handleYouTubeDownload(task.formatData, false);
            return;
        } else {
            // Static data expired - proceed with fresh conversion
            try {
                // For YouTube, extractV2 API will handle fresh data during conversion
                await handleYouTubeDownload(task.formatData, false);
            } catch (error: any) {
                updateConversionTask(formatId, {
                    state: 'Failed',
                    statusText: 'Conversion failed',
                    showProgressBar: false,
                    error: error.message || 'Failed to convert expired static data',
                    completedAt: Date.now()
                });
            }
        }
        return;
    }

    // CASE 3: Unknown status - fallback to regular YouTube retry
    await handleYouTubeDownload(task.formatData, false);
}
