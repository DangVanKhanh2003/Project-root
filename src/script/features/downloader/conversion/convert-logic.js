import { createVerifiedService } from '../../../libs/downloader-lib-standalone/index.js';
import { getApiBaseUrl, getTimeout, getExpiryTime, getIOSStreamMaxSize } from '../../../environment.js';
import { withCaptchaProtection } from '../../../libs/captcha-core/captcha-ui.js';
import { setConversionTask, updateConversionTask, getConversionTask, getState, setVideoDetail, setGalleryDetail, updateVideoDetailFormat } from '../state.js';
import { getPollingManager } from '../concurrent-polling.js';
import { isLinkExpired, DOWNLOAD_LINK_TTL } from '../../../utils/link-validator.js';
import { getConversionModal } from '../../../ui-components/modal/conversion-modal.js';
import { openLinkInNewTab, triggerDownload, isIOS, isWindows } from '../../../utils.js';
import { isYouTubeUrl } from '../../../libs/downloader-lib-standalone/api/youtube/validator.js';
import { downloadStreamToRAM } from '../../../libs/downloader-lib-standalone/transfer/strategies/stream-to-ram.js';
import { PollingProgressMapper } from '../../../libs/downloader-lib-standalone/utils/polling-progress-mapper.js';

const service = createVerifiedService({
    apiBaseUrl: getApiBaseUrl(),
    timeout: getTimeout('default')
}, {}, withCaptchaProtection);

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
 * @param {object} task - Conversion task object
 * @param {object} videoDetail - Video detail from state (optional for YouTube)
 * @param {object} galleryDetail - Gallery detail from state (optional)
 * @returns {number} Timestamp to use for expiration check
 */
function getExpirationTime(task, videoDetail = null, galleryDetail = null) {
    // YouTube items have vid - use conversion completedAt
    if (task.formatData && task.formatData.vid) {
        return task.completedAt; // YouTube conversion time
    }

    // Social Media items - use extract completedAt from detail
    const detail = videoDetail || galleryDetail;
    if (detail && detail.completedAt) {
        return detail.completedAt; // API extract time
    }

    // Fallback to task completedAt if detail not available
    return task.completedAt;
}

/**
 * Detect platform and routing requirements for download phase - 5 distinct cases
 * @param {object} extractResponse - API response with size, status, etc.
 * @param {object} formatData - Format data with type info
 * @returns {object} Routing decision object
 */
function detectPlatformRouting(extractResponse, formatData) {
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
        if (size && size > getIOSStreamMaxSize()) {
            // iOS Large Stream → Polling
            return {
                platform: 'iOS',
                size, iosMaxSize: getIOSStreamMaxSize(),
                status, routeType: 'ios-stream-polling',
                description: `iOS large stream (${Math.round(size/1024/1024)}MB > 150MB) → polling`
            };
        } else {
            // iOS Small Stream → RAM Download
            const result = {
                platform: 'iOS',
                size, iosMaxSize: getIOSStreamMaxSize(),
                status, routeType: 'ios-stream-ram',
                description: 'iOS small stream (≤150MB) → RAM download'
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

/**
 * Setup modal and start extract phase with dynamic target
 * iOS/Windows MP4: 0% → 30%, Others: 0% → 95%
 * @param {object} params - Setup parameters
 * @returns {Promise<ProgressBarManager>} Progress bar manager instance
 */
async function setupExtractPhase({ formatId, formatData, videoTitle, videoUrl }) {
    const conversionModal = getConversionModal();

    // Open modal if not already open
    if (!conversionModal.isOpen()) {
        conversionModal.open({
            provider: 'youtube',
            formatId: formatId,
            formatData: formatData,
            videoTitle: videoTitle,
            videoUrl: videoUrl
        });
    }

    // Create conversion task
    setConversionTask(formatId, {
        sourceId: formatData.vid,
        quality: formatData.quality || 'Unknown',
        format: formatData.type || 'mp4',
        state: 'Extracting',
        statusText: 'Extracting...',
        showProgressBar: true,
        startedAt: Date.now(),
        formatData: formatData,
        autoDownloadOnComplete: false
    });

    // Determine extract target based platform/format
    let extractTarget;

    // 🔍 DEBUG: Platform detection details
    const isIOSDevice = isIOS();
    const isWindowsDevice = isWindows();
    const formatType = formatData.type;


    if (isIOSDevice) {
        extractTarget = 28; // iOS: 0% → 28% (gap before download phase at 30%)
    } else if (isWindowsDevice && formatType === 'mp4') {
        extractTarget = 28; // Windows MP4: 0% → 28% (gap before download phase at 30%)
    } else {
        extractTarget = 95; // Others: 0% → 95%
    }


    // Wait for progress bar to be initialized (up to 1 second)
    let progressBar = null;
    let attempts = 0;
    const maxAttempts = 20; // 20 attempts * 50ms = 1 second max wait

    while (!progressBar && attempts < maxAttempts) {
        progressBar = conversionModal.getProgressBarManager();
        if (!progressBar) {
            await new Promise(resolve => setTimeout(resolve, 50)); // Wait 50ms
            attempts++;
        }
    }

    if (!progressBar) {
        throw new Error('Progress bar not initialized after modal open');
    }

    // Start extract phase with dynamic target
    progressBar.startExtractPhase(extractTarget);
    return progressBar;
}

/**
 * Handle static direct download case (Case 1: Static → a.click)
 * Since this is direct download, skip download phase and complete at 100%
 */
/**
 * Helper: Update both conversionTask AND videoDetailFormat with extracted URL
 * Ensures URL persists in state for future clicks (no re-extraction needed)
 *
 * @param {string} formatId - Format identifier
 * @param {string} url - Download URL from extract API
 * @param {Object} formatData - Format metadata (quality, type, etc.)
 * @param {Object} extractResponse - Full extract response from API (optional)
 * @param {Object} additionalTaskData - Additional fields for conversionTask (optional)
 */
function updateFormatWithExtractedUrl(formatId, url, formatData, extractResponse = null, additionalTaskData = {}) {
    const completedAt = Date.now();

    const taskUpdate = {
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
        const formatUpdate = {
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

function handleStaticDirectDownload({ progressBar, formatId, url, formatData, extractResponse }) {
    // 🔍 DEBUG: Static direct download handler

    // Skip download phase - complete extract to 100% directly
    progressBar.completeExtractToFull(() => {
        updateFormatWithExtractedUrl(formatId, url, formatData, extractResponse);
        conversionModal.showDownloadButton(url);
    });
}

/**
 * Handle iOS stream RAM download case (Case 2: iOS stream ≤150MB → RAM)
 */
function handleIOSStreamRAM({ progressBar, formatId, url, filename, size }) {

    progressBar.resumeToDownloadPhase('stream', {
        isIOSRAM: true,
        totalSize: size,
        needsSpecialHandling: true, // ✅ Bypass direct jump to 100%
        onComplete: () => {
            // 🎯 Show download button only after progress bar reaches 100%
            conversionModal.showDownloadButton(url, {
                buttonText: 'Download from RAM',
                downloadMode: 'ram'
            });
        },
        onProgress: async (onProgressCallback) => {

            try {
                const blob = await downloadStreamToRAM(url, onProgressCallback);


                updateConversionTask(formatId, {
                    state: 'Success',
                    downloadUrl: url, // Keep for fallback
                    completedAt: Date.now(),
                    ramBlob: blob,      // ✅ Store blob reference
                    filename: filename  // ✅ Store filename for download
                });

                // Note: Download button will be shown by progress bar completion callback
            } catch (error) {
                conversionModal.transitionToError(error.message || 'Download failed');
            }
        }
    });
}

/**
 * Handle iOS stream polling download case (Case 3: iOS stream >150MB → polling)
 */
async function handleIOSStreamPolling({ progressBar, formatId, url, size, extractResponse, formatData }) {

    const sizeMB = Math.round(size / (1024 * 1024));

    // Start real polling flow
    await startPollingFlow({
        progressBar,
        formatId,
        extractResponse,
        formatData,
        pollingReason: 'ios-large-stream',
        warningMessage: `Large stream file (${sizeMB}MB) may cause memory issues on iOS.`,
        size
    });
}

/**
 * Handle Windows MP4 stream download case (Case 4: Windows MP4 stream)
 */
async function handleWindowsMP4Stream({ progressBar, formatId, url, filename, size, extractResponse, formatData }) {
    const sizeMB = size ? Math.round(size / (1024 * 1024)) : 0;


    // Start real polling flow
    await startPollingFlow({
        progressBar,
        formatId,
        extractResponse,
        formatData,
        pollingReason: 'windows-mp4',
        warningMessage: null, // No warning for Windows MP4
        size
    });
}

/**
 * Handle other stream download case (Case 5: Other platform streams)
 * Since this ends up as direct link, skip download phase and complete at 100%
 */
function handleOtherStream({ progressBar, formatId, url, filename, size }) {

    // Skip download phase - complete extract to 100% directly
    progressBar.completeExtractToFull(() => {
        updateConversionTask(formatId, {
            state: 'Success',
            downloadUrl: url,
            completedAt: Date.now(),
            streamMetadata: {
                contentType: 'stream',
                platform: 'Other',
                filename: filename
            }
        });

        const sizeMB = size ? Math.round(size / (1024 * 1024)) : 0;
        conversionModal.showDownloadButton(url, {
            buttonText: sizeMB ? `Download Stream (${sizeMB}MB)` : 'Download Stream',
            downloadMode: 'stream'
        });
    });
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
async function startPollingFlow({ progressBar, formatId, extractResponse, formatData, pollingReason, warningMessage, size }) {
    try {

        // Get format and file size for progress mapping
        // NOTE: Polling only for files >150MB, fallback 200 shouldn't happen in practice
        const format = formatData.format || formatData.type || 'mp4';
        const fileSizeMB = size ? Math.round(size / (1024 * 1024)) : 200;

        // Initialize progress mapper
        const progressMapper = new PollingProgressMapper(format, fileSizeMB);
        const category = progressMapper.getSizeCategory();

        // Setup polling state in conversion task
        updateConversionTask(formatId, {
            state: 'Polling',
            statusText: progressMapper.getStatusText('processing', 30),
            showProgressBar: true,
            pollingPhase: 'processing',
            pollingData: {
                videoProgress: 0,
                audioProgress: 0,
                status: 'in_progress',
                mergedUrl: null
            },
            warningMessage: warningMessage,
            progressMapper: progressMapper // Store for updates
        });

        // Configure progress bar for polling mode
        // 🔍 DEBUG: Polling phase transition

        progressBar.resumeToDownloadPhase('polling', {
            onProgress: (displayProgress, phase) => {
            },
            onPhaseTransition: (fromPhase, toPhase) => {
            },
            onComplete: (downloadUrl) => {
            }
        });

        // ONLY use progressUrl polling - no fallbacks
        if (!extractResponse.progressUrl) {
            throw new Error('No progressUrl in extract response - polling not supported for this request');
        }

        await startRichProgressPolling(formatId, extractResponse.progressUrl, progressMapper);

    } catch (error) {

        updateConversionTask(formatId, {
            state: 'Failed',
            statusText: 'Polling failed',
            showProgressBar: false,
            error: error.message || 'Polling error',
            completedAt: Date.now()
        });

        conversionModal.transitionToError(error.message || 'Polling failed');
    }
}

/**
 * Start rich progress polling using progressUrl (preferred method)
 */
async function startRichProgressPolling(formatId, progressUrl, progressMapper) {

    const pollingManager = getPollingManager();

    // Create custom polling task for progress URL
    const customPollData = {
        formatId: formatId,
        progressUrl: progressUrl,
        pollType: 'progress', // vs 'status' for simple polling
        onProgressUpdate: async (apiData) => {
            await handleProgressUpdate(formatId, apiData, progressMapper);
        }
    };

    // Start polling with ConcurrentPollingManager
    pollingManager.startPolling(formatId, customPollData);
}

// Removed obsolete checkTask polling - only progressUrl polling is used now

/**
 * Handle progress update from rich progress polling
 */
async function handleProgressUpdate(formatId, apiData, progressMapper) {
    const { videoProgress, audioProgress, status, mergedUrl, filename } = apiData;
    const task = getConversionTask(formatId);


    // Phase detection based on API response
    // When mergedUrl exists → conversion is completely done
    if (mergedUrl) {
        await completePolling(formatId, mergedUrl);
        return;
    }

    // No mergedUrl yet → still processing or transitioning to merging
    const currentPhase = task.pollingPhase || 'processing';

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

        progressMapper.startMergingPhase();

        updateConversionTask(formatId, {
            pollingPhase: 'merging',
            statusText: progressMapper.getStatusText('merging', progressMapper.lastProgress),
            pollingData: { videoProgress, audioProgress, status, mergedUrl, filename }
        });

        // Update progress bar for merging phase
        const conversionModal = getConversionModal();
        const progressBarManager = conversionModal.getProgressBarManager();
        if (progressBarManager) {
            const displayProgress = progressMapper.mapProgress('merging', apiData);
            const statusText = progressMapper.getStatusText('merging', displayProgress);
            progressBarManager.setPollingProgress(displayProgress, statusText);
        }

    } else {
        // Continue current phase (either still processing or merging in progress)
        const displayProgress = progressMapper.mapProgress(currentPhase, apiData);

        updateConversionTask(formatId, {
            statusText: progressMapper.getStatusText(currentPhase, displayProgress),
            pollingData: { videoProgress, audioProgress, status, mergedUrl, filename }
        });

        // Update progress bar with mapped progress
        const conversionModal = getConversionModal();
        const progressBarManager = conversionModal.getProgressBarManager();
        if (progressBarManager) {
            progressBarManager.updatePollingProgress(apiData, currentPhase);

            // Update visual progress with mapped percentage
            const statusText = progressMapper.getStatusText(currentPhase, displayProgress);
            progressBarManager.setPollingProgress(displayProgress, statusText);
        }
    }
}

// Removed obsolete status update handler - only progressUrl updates are used now

/**
 * Complete polling and show download button
 */
async function completePolling(formatId, downloadUrl) {

    const pollingManager = getPollingManager();
    pollingManager.stopPolling(formatId);

    // Complete progress bar animation
    const conversionModal = getConversionModal();
    const progressBarManager = conversionModal.getProgressBarManager();
    if (progressBarManager) {
        progressBarManager.completePollingProgress();
    }

    // Update task state
    updateConversionTask(formatId, {
        state: 'Success',
        statusText: 'Ready',
        showProgressBar: false,
        downloadUrl: downloadUrl,
        completedAt: Date.now()
    });

    // Show success in modal
    conversionModal.transitionToSuccess(downloadUrl);
}

/**
 * Route download phase to appropriate handler - 5 distinct cases
 */
function routeDownloadPhase({ routing, progressBar, formatId, extractResponse, formatData }) {
    const { url, filename, size } = extractResponse;


    // Update task state
    updateConversionTask(formatId, {
        state: 'Processing',
        statusText: 'Processing...',
        extractResponse: extractResponse
    });


    // Route to appropriate handler based on 5 distinct cases
    switch (routing.routeType) {
        case 'static-direct':
            handleStaticDirectDownload({ progressBar, formatId, url, formatData, extractResponse });
            break;

        case 'ios-stream-ram':
            handleIOSStreamRAM({ progressBar, formatId, url, filename, size });
            break;

        case 'ios-stream-polling':
            handleIOSStreamPolling({ progressBar, formatId, url, size, extractResponse, formatData });
            break;

        case 'windows-mp4-stream':
            handleWindowsMP4Stream({ progressBar, formatId, url, filename, size, extractResponse, formatData });
            break;

        case 'other-stream':
            handleOtherStream({ progressBar, formatId, url, filename, size });
            break;

        default:
            handleStaticDirectDownload({ progressBar, formatId, url }); // Fallback to static
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
export async function smartConvert(formatId) {
    try {
        // Get current state
        const state = getState();
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
            const downloadUrl = existingTask?.downloadUrl || formatData.url || formatData.encryptedUrl;

            // Create/update conversion task with existing URL
            setConversionTask(formatId, {
                sourceId: formatData.vid,
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
            if (status === 'stream') {
            } else if (!hasExistingUrl) {
            } else if (!isDataValid) {
            }

            await handleYouTubeDownload(formatData, false);
            return;
        }

        // CASE 3: Fallback (shouldn't reach here)
        await handleYouTubeDownload(formatData, false);

    } catch (error) {
        // Show error in modal if possible
        if (conversionModal.isOpen()) {
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
async function getFormatDataFromState(formatId) {
    try {
        const state = getState();
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
        const { processFormatArray } = await import('../../libs/downloader-lib-standalone/processors/format-processor.js');
        const processedFormats = processFormatArray(formatArray, category);

        // Find matching format by ID
        const format = processedFormats.find(f => f.id === formatId);

        if (!format) {
            return null;
        }

        // Build complete format data
        const formatData = {
            id: format.id,
            category: format.category,
            type: format.type,
            quality: format.quality,
            size: format.size || null,
            sizeText: format.sizeText,
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

/**
 * 2-Phase YouTube Download Handler
 * Phase 1: Extract (0% → 30%), Phase 2: Download (30% → 100%)
 * @param {object} formatData - The format data object with extractV2Options
 * @param {boolean} autoDownload - Auto-download when conversion completes
 * @returns {Promise<object>} Result object
 */
export async function handleYouTubeDownload(formatData, autoDownload = false) {
    const formatId = formatData.id;

    try {
        // Get video info from state
        const state = getState();
        const videoDetail = state.videoDetail;
        const videoTitle = videoDetail?.meta?.title || 'Video';
        const videoUrl = videoDetail?.meta?.originalUrl || `https://www.youtube.com/watch?v=${formatData.vid}`;

        // ========================================
        // STEP 1: SETUP EXTRACT PHASE
        // ========================================

        const progressBar = await setupExtractPhase({
            formatId,
            formatData,
            videoTitle,
            videoUrl
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
                const { findFormatById } = await import('../../libs/downloader-lib-standalone/api/youtube/constants.js');
                const fallbackFormat = findFormatById(cleanId, formatData.vid);
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


        const result = await service.extractV2_stream(videoUrl, extractOptions);


        // ========================================
        // STEP 3: PROCESS EXTRACT RESPONSE & START DOWNLOAD PHASE
        // ========================================

        if (result.ok && result.data && result.data.url) {
            // ========================================
            // STEP 3: ROUTE DOWNLOAD PHASE
            // ========================================

            const routing = detectPlatformRouting(result.data, formatData);
            routeDownloadPhase({
                routing,
                progressBar,
                formatId,
                extractResponse: result.data,
                formatData
            });

            return { ok: true, data: result.data };

        } else {
            // Extract failed
            progressBar.stop();

            const errorMessage = result.message || 'Failed to extract download URL';
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

    } catch (error) {

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
 * @param {object} formatData - The format data object with id, url, etc.
 * @param {boolean} forceNew - Force new conversion, skip existing task check (default: true)
 * @returns {Promise<object>} Result object
 */
export async function handleSocialDecode(formatData) {
    const formatId = formatData.id;

    // Expiration check for Social Media links removed as per user request.
    // The logic used to be here.

    try {

        // Create conversion task in state
        setConversionTask(formatId, {
            sourceId: formatData.url,
            quality: formatData.quality || 'Default',
            format: formatData.format || 'mp4',
            state: 'Converting',
            statusText: 'Decoding...',
            showProgressBar: true,
            startedAt: Date.now(),
            formatData: formatData
        });

        // Call decode URL service
        const result = await service.decodeUrl(formatData.url);


        if (result.ok && result.data && result.data.url) {
            // Success - direct download available
            updateConversionTask(formatId, {
                state: 'Success',
                statusText: 'Ready ',
                showProgressBar: false,
                downloadUrl: result.data.url,
                completedAt: Date.now()
            });

            return { ok: true, data: result.data };

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

    } catch (error) {

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
 * @param {string} formatId - Format identifier
 */
export function cancelConversion(formatId) {

    // Stop polling if active
    pollingManager.cancelPolling(formatId);

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
 * @param {string} formatId - Format identifier
 */
export async function retryConversion(formatId) {

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
 * @param {string} formatId - Format identifier
 */
export async function downloadConvertedFile(formatId) {
    const task = getConversionTask(formatId);
    if (!task || task.state !== 'Success' || !task.downloadUrl) {
        return;
    }

    // 🔍 DEBUG: Log task details to understand download type

    // Get current state for expiration check
    const state = getState();
    const videoDetail = state.videoDetail;

    // Check expire only for YouTube (has vid)
    if (task.formatData && task.formatData.vid) {
        const galleryDetail = state.galleryDetail;

        // Check if download link has expired
        const expirationTime = getExpirationTime(task, videoDetail, galleryDetail);
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
            if (!conversionModal.isOpen()) {
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
        const { triggerBlobDownload } = await import('../../utils.js');

        // Download from RAM blob
        triggerBlobDownload(task.ramBlob, task.filename);

        // Clean up blob from memory to free RAM
        updateConversionTask(formatId, {
            ...task,
            ramBlob: null // Clear blob reference
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
 * @param {string} formatId - Format identifier
 */
export async function reConvert(formatId) {

    const task = getConversionTask(formatId);
    if (!task || !task.formatData) {
        return;
    }

    // Get video detail from state to determine platform and original URL
    const state = getState();
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
        } catch (error) {
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
            } catch (error) {
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
