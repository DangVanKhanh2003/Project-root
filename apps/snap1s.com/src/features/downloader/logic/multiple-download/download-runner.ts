
import { apiV3, v3Config } from '../../../../api/v3';
import { mapToV3DownloadRequest, FEATURE_KEYS, type ExtractV2Options } from '@downloader/core';
import { retryWithBackoff, RETRY_CONFIGS, isTimeoutError } from '../conversion/retry-helper';
import { VideoItemSettings, ProgressPhase } from '../../state/multiple-download-types';
import { extractMediaInfoFromCreateJob, hasExtractedMediaInfo, type ExtractedMediaInfo } from '../conversion/v3/extract-media-info';
import { checkLimit, recordUsage } from '../../../download-limit';
import { resolveExtractStrategy, callExternalExtract, EXTRACT_STRATEGY } from '../priority-extract-router';

export interface DownloadCallbacks {
    onPhaseChange: (phase: ProgressPhase) => void;
    onProgress: (progress: number, phase?: ProgressPhase) => void;
    onComplete: (downloadUrl: string, filename?: string) => void;
    onError: (message: string) => void;
    onAudioTrackInfo?: (languages: string[], changed: boolean) => void;
    onExtracted?: (info: ExtractedMediaInfo) => void;
}

export interface DownloadConfig {
    url: string;
    settings: VideoItemSettings;
    signal: AbortSignal;
    callbacks: DownloadCallbacks;
}

const POLLING_INTERVAL = 2000;
const MAX_POLL_ITERATIONS = 5400; // 3 hours at 2s intervals
const TERMINAL_JOB_STATUSES = new Set(['error', 'not_found', 'failed', 'faild']);

export async function runSingleDownload(config: DownloadConfig): Promise<void> {
    const { url, settings, signal, callbacks } = config;
    enforceQualityLimits(settings);

    // Resolve extract strategy
    const extractOptions = buildExtractV2Options(settings);
    const strategy = resolveExtractStrategy(extractOptions);

    callbacks.onPhaseChange('extracting');

    if (strategy === EXTRACT_STRATEGY.EXTERNAL_FIRST) {
        // Try External Extract first -> V3 fallback
        const extResult = await callExternalExtract(url, extractOptions, signal);
        if (signal.aborted) return;

        if (extResult.ok && extResult.data) {
            recordQualityUsage(settings);
            callbacks.onProgress(100, 'processing');
            callbacks.onComplete(extResult.data.url, extResult.data.filename);
            return;
        }

        // External failed -> silent fallback to V3
    }

    // V3 flow (primary or fallback from external-first)
    const v3Success = await runV3Flow(url, settings, signal, callbacks);

    if (v3Success || signal.aborted) return;

    // V3 failed -> try External Extract as fallback (only for v3-first + mp3/mp4)
    if (strategy === EXTRACT_STRATEGY.V3_FIRST) {
        const outputFormat = extractOptions.downloadMode === 'video'
            ? (extractOptions.youtubeVideoContainer || 'mp4')
            : (extractOptions.audioFormat || 'mp3');

        if (outputFormat === 'mp3' || outputFormat === 'mp4') {
            const extResult = await callExternalExtract(url, extractOptions, signal);
            if (signal.aborted) return;

            if (extResult.ok && extResult.data) {
                recordQualityUsage(settings);
                callbacks.onProgress(100, 'processing');
                callbacks.onComplete(extResult.data.url, extResult.data.filename);
                return;
            }
        }
    }

    // Both failed
    callbacks.onError('Download failed. Please try again.');
}

/**
 * Run V3 flow: create job -> poll status.
 * Returns true if successful, false if failed.
 */
async function runV3Flow(
    url: string,
    settings: VideoItemSettings,
    signal: AbortSignal,
    callbacks: DownloadCallbacks,
): Promise<boolean> {
    try {
        const jobResponse = await extractWithRetries(url, settings, signal);
        if (signal.aborted) return false;

        const response: any = (jobResponse && (jobResponse as any).data) ? (jobResponse as any).data : jobResponse;
        const extractedInfo = extractMediaInfoFromCreateJob(response);
        const statusUrl = response?.statusUrl || jobResponse?.statusUrl;
        const audioLanguageChanged = response?.audioLanguageChanged ?? response?.audio_language_changed ?? jobResponse?.audioLanguageChanged;
        const availableAudioLanguages = response?.availableAudioLanguages ?? response?.available_audio_languages ?? jobResponse?.availableAudioLanguages;

        if (!statusUrl) {
            throw new Error('No status URL returned');
        }

        if (callbacks.onExtracted && hasExtractedMediaInfo(extractedInfo)) {
            callbacks.onExtracted(extractedInfo);
        }

        if (callbacks.onAudioTrackInfo && (availableAudioLanguages || audioLanguageChanged !== undefined)) {
            callbacks.onAudioTrackInfo(availableAudioLanguages || [], audioLanguageChanged || false);
        }

        callbacks.onPhaseChange('processing');
        await pollStatus(statusUrl, signal, callbacks, settings);
        return true;
    } catch (error: any) {
        if (signal.aborted || error.name === 'AbortError') return false;
        return false;
    }
}

/**
 * Build ExtractV2Options from VideoItemSettings for strategy resolution.
 */
function buildExtractV2Options(settings: VideoItemSettings): ExtractV2Options {
    const isAudio = settings.format === 'mp3';
    const quality = settings.quality || '720p';
    const groupedMatch = quality.match(/^(webm|mkv)-(\d+)p$/i);
    const resolutionMatch = quality.match(/^(\d+)p$/i);
    const youtubeVideoContainer = groupedMatch ? groupedMatch[1].toLowerCase() : 'mp4';
    const videoQuality = groupedMatch
        ? groupedMatch[2]
        : (resolutionMatch ? resolutionMatch[1] : '720');

    return {
        downloadMode: isAudio ? 'audio' : 'video',
        videoQuality: isAudio ? undefined : videoQuality,
        youtubeVideoContainer: isAudio ? undefined : youtubeVideoContainer,
        audioFormat: isAudio ? (settings.audioFormat || 'mp3') : undefined,
        audioBitrate: isAudio ? (settings.audioBitrate || '128') : undefined,
    };
}

function getVideoResolutionLabel(quality: string | undefined): string {
    const normalized = (quality || '').toLowerCase();
    const grouped = normalized.match(/^(?:mp4|webm|mkv)-(\d+)p$/);
    if (grouped) return `${grouped[1]}p`;

    const plain = normalized.match(/^(\d+)p$/);
    if (plain) return `${plain[1]}p`;

    return '';
}

function enforceQualityLimits(settings: VideoItemSettings): void {
    const format = (settings.format || 'mp4').toLowerCase();

    if (format !== 'mp3') {
        const resolution = getVideoResolutionLabel(settings.quality || settings.videoQuality || '720p');
        if (resolution === '2160p') {
            const limitResult = checkLimit(FEATURE_KEYS.HIGH_QUALITY_4K);
            if (!limitResult.allowed) {
                throw new Error('4K daily limit reached. Add license key to continue.');
            }
        }

        if (resolution === '1440p') {
            const limitResult = checkLimit(FEATURE_KEYS.HIGH_QUALITY_2K);
            if (!limitResult.allowed) {
                throw new Error('2K daily limit reached. Add license key to continue.');
            }
        }
        return;
    }

    const audioFormat = (settings.audioFormat || 'mp3').toLowerCase();
    const bitrate = settings.audioBitrate || '128';
    if (audioFormat === 'mp3' && bitrate === '320') {
        const limitResult = checkLimit(FEATURE_KEYS.HIGH_QUALITY_320K);
        if (!limitResult.allowed) {
            throw new Error('320kbps daily limit reached. Add license key to continue.');
        }
    }
}

function recordQualityUsage(settings: VideoItemSettings): void {
    const format = (settings.format || 'mp4').toLowerCase();

    if (format !== 'mp3') {
        const resolution = getVideoResolutionLabel(settings.quality || settings.videoQuality || '720p');
        if (resolution === '2160p') recordUsage(FEATURE_KEYS.HIGH_QUALITY_4K);
        if (resolution === '1440p') recordUsage(FEATURE_KEYS.HIGH_QUALITY_2K);
        return;
    }

    const audioFormat = (settings.audioFormat || 'mp3').toLowerCase();
    const bitrate = settings.audioBitrate || '128';
    if (audioFormat === 'mp3' && bitrate === '320') {
        recordUsage(FEATURE_KEYS.HIGH_QUALITY_320K);
    }
}

async function extractWithRetries(
    url: string,
    settings: VideoItemSettings,
    signal: AbortSignal
): Promise<any> {
    const request = buildV3Request(url, settings);

    return retryWithBackoff(
        async () => {
            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
            return apiV3.createJob(request);
        },
        RETRY_CONFIGS.extracting
    );
}

async function pollStatus(
    statusUrl: string,
    signal: AbortSignal,
    callbacks: DownloadCallbacks,
    settings: VideoItemSettings
): Promise<void> {
    const pollingInterval = v3Config.timeout.pollingInterval || POLLING_INTERVAL;
    const { maxConsecutiveErrors } = RETRY_CONFIGS.polling;
    let consecutiveErrors = 0;
    let lastProgress = 0;

    for (let i = 0; i < MAX_POLL_ITERATIONS; i++) {
        if (signal.aborted) return;

        try {
            const statusData = await apiV3.getStatusByUrl(statusUrl);
            const normalizedStatus = normalizeStatus(statusData.status);
            consecutiveErrors = 0;

            // Progress floor - never go backwards
            const progress = statusData.progress || 0;
            if (progress > lastProgress) {
                lastProgress = progress;
            }

            // Phase detection
            let phase: ProgressPhase = 'processing';
            if (normalizedStatus === 'pending' && lastProgress >= 100) {
                phase = 'merging';
            }
            if (statusData.detail) {
                if (statusData.detail.video === 100 && statusData.detail.audio === 100) {
                    phase = 'merging';
                }
            }

            callbacks.onProgress(lastProgress, phase);

            if (normalizedStatus === 'completed') {
                if (statusData.downloadUrl) {
                    if (lastProgress < 100) {
                        await animateProgressTo100(lastProgress, 'processing', signal, callbacks.onProgress);
                    }
                    callbacks.onProgress(100, 'merging');
                    const filename = statusData.title
                        ? `${statusData.title}.${getExtension(callbacks)}`
                        : undefined;
                    recordQualityUsage(settings);
                    callbacks.onComplete(statusData.downloadUrl, filename);
                    return;
                }
                throw new Error('Completed but no download URL');
            }

            if (
                normalizedStatus === 'error' ||
                normalizedStatus === 'not_found' ||
                normalizedStatus === 'failed' ||
                normalizedStatus === 'faild'
            ) {
                // Terminal status - stop polling immediately, no retry
                throw createTerminalJobError(statusData.jobError || 'Job failed');
            }
        } catch (error: any) {
            if (signal.aborted || error.name === 'AbortError') return;

            // Timeout is NOT an error - continue polling
            if (isTimeoutError(error)) {
                await sleep(pollingInterval);
                continue;
            }

            // Job error from API - check retries
            if (error.isJobError || isTerminalJobError(error)) {
                throw error;
            }

            consecutiveErrors++;
            if (consecutiveErrors >= maxConsecutiveErrors) {
                throw new Error('Network error - please try again');
            }
        }

        await sleep(pollingInterval);
    }

    throw new Error('Download timed out');
}

function buildV3Request(url: string, settings: VideoItemSettings) {
    const isAudio = settings.format === 'mp3';
    const quality = settings.quality || '720p';
    const groupedMatch = quality.match(/^(webm|mkv)-(\d+)p$/i);
    const resolutionMatch = quality.match(/^(\d+)p$/i);
    const youtubeVideoContainer = groupedMatch ? groupedMatch[1].toLowerCase() : 'mp4';
    const videoQuality = groupedMatch
        ? groupedMatch[2]
        : (resolutionMatch ? resolutionMatch[1] : '720');

    const audioFormat = settings.audioFormat || 'mp3';
    const audioBitrate = audioFormat === 'mp3' ? (settings.audioBitrate || '128') : '128';

    return mapToV3DownloadRequest(url, {
        downloadMode: isAudio ? 'audio' : 'video',
        videoQuality: isAudio ? undefined : videoQuality,
        youtubeVideoContainer: isAudio ? undefined : youtubeVideoContainer,
        audioFormat: isAudio ? audioFormat : undefined,
        audioBitrate: isAudio ? audioBitrate : undefined,
        trackId: settings.audioTrack,
    });
}

function getExtension(callbacks: DownloadCallbacks): string {
    // Default, actual extension comes from server
    return 'mp4';
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function animateProgressTo100(
    from: number,
    phase: ProgressPhase,
    signal: AbortSignal,
    onProgress: (progress: number, phase?: ProgressPhase) => void
): Promise<void> {
    const start = Math.max(0, Math.min(100, Math.round(from)));
    if (start >= 100) return;

    const durationMs = 450;
    const stepMs = 30;
    const steps = Math.max(1, Math.floor(durationMs / stepMs));

    for (let i = 1; i <= steps; i++) {
        if (signal.aborted) return;
        const next = Math.min(100, Math.round(start + ((100 - start) * i) / steps));
        onProgress(next, phase);
        await sleep(stepMs);
        if (next >= 100) return;
    }
}

function isTerminalJobError(error: unknown): boolean {
    const e = error as any;
    const normalizedMessage = String(e?.message || '').toLowerCase();
    const responseStatus = normalizeStatus(e?.response?.status);

    if (responseStatus && TERMINAL_JOB_STATUSES.has(responseStatus)) {
        return true;
    }

    if (typeof e?.status === 'number' && e.status >= 400 && e.status < 500 && e.status !== 429) {
        return true;
    }

    return (
        normalizedMessage.includes('not_found') ||
        normalizedMessage.includes('not found') ||
        normalizedMessage.includes('job failed') ||
        normalizedMessage.includes('invalid_job_id') ||
        normalizedMessage.includes('job_not_found') ||
        normalizedMessage.includes('extract_failed')
    );
}

function normalizeStatus(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function createTerminalJobError(message: string): Error & { isJobError: true } {
    const error = new Error(message) as Error & { isJobError: true };
    error.isJobError = true;
    return error;
}
