
import { apiV3, v3Config } from '../../../../api/v3';
import { mapToV3DownloadRequest } from '@downloader/core';
import { retryWithBackoff, RETRY_CONFIGS, isTimeoutError } from '../conversion/retry-helper';
import { VideoItemSettings, ProgressPhase } from '../../state/multiple-download-types';

export interface DownloadCallbacks {
    onPhaseChange: (phase: ProgressPhase) => void;
    onProgress: (progress: number, phase?: ProgressPhase) => void;
    onComplete: (downloadUrl: string, filename?: string) => void;
    onError: (message: string) => void;
    onAudioTrackInfo?: (languages: string[], changed: boolean) => void;
}

export interface DownloadConfig {
    url: string;
    settings: VideoItemSettings;
    signal: AbortSignal;
    callbacks: DownloadCallbacks;
}

const POLLING_INTERVAL = 2000;
const MAX_POLL_ITERATIONS = 5400; // 3 hours at 2s intervals
const MAX_JOB_ATTEMPTS = 2; // Total full-flow attempts: extract + poll
const TERMINAL_JOB_STATUSES = new Set(['error', 'not_found', 'failed', 'faild']);

export async function runSingleDownload(config: DownloadConfig): Promise<void> {
    const { url, settings, signal, callbacks } = config;
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_JOB_ATTEMPTS; attempt++) {
        if (signal.aborted) return;

        try {
            // Phase 1: Extract (create job)
            callbacks.onPhaseChange('extracting');

            const jobResponse = await extractWithRetries(url, settings, signal);

            if (signal.aborted) return;

            const response: any = (jobResponse && (jobResponse as any).data) ? (jobResponse as any).data : jobResponse;
            const statusUrl = response?.statusUrl || jobResponse?.statusUrl;
            const title = response?.title || jobResponse?.title;
            const audioLanguageChanged = response?.audioLanguageChanged ?? response?.audio_language_changed ?? jobResponse?.audioLanguageChanged;
            const availableAudioLanguages = response?.availableAudioLanguages ?? response?.available_audio_languages ?? jobResponse?.availableAudioLanguages;

            if (!statusUrl) {
                throw new Error('No status URL returned');
            }

            // Report audio track info if available
            if (callbacks.onAudioTrackInfo && (availableAudioLanguages || audioLanguageChanged !== undefined)) {
                callbacks.onAudioTrackInfo(availableAudioLanguages || [], audioLanguageChanged || false);
            }

            // Phase 2: Poll status
            callbacks.onPhaseChange('processing');
            await pollStatus(statusUrl, signal, callbacks);
            return;
        } catch (error: any) {
            if (signal.aborted || error?.name === 'AbortError') return;
            lastError = error;

            // Retry full flow (extract + poll) if attempts remain.
            if (attempt < MAX_JOB_ATTEMPTS) {
                continue;
            }
        }
    }

    throw lastError || new Error('Download failed');
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
    callbacks: DownloadCallbacks
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
            if (statusData.detail) {
                if (statusData.detail.video === 100 && statusData.detail.audio === 100) {
                    phase = 'merging';
                }
            }

            callbacks.onProgress(lastProgress, phase);

            if (normalizedStatus === 'completed') {
                if (statusData.downloadUrl) {
                    const filename = statusData.title
                        ? `${statusData.title}.${getExtension(callbacks)}`
                        : undefined;
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

const VIDEO_CONTAINERS = new Set(['webm', 'mkv']);
const AUDIO_FORMATS = new Set(['ogg', 'wav', 'opus', 'm4a', 'flac']);

function buildV3Request(url: string, settings: VideoItemSettings) {
    const isAudio = settings.format === 'mp3';
    const isFormatOverride = isAudio && AUDIO_FORMATS.has(settings.audioBitrate || '');
    const isContainerOverride = !isAudio && VIDEO_CONTAINERS.has(settings.quality || '');

    return mapToV3DownloadRequest(url, {
        downloadMode: isAudio ? 'audio' : 'video',
        videoQuality: isContainerOverride ? undefined : (settings.quality?.replace('p', '') || '720'),
        youtubeVideoContainer: isAudio ? undefined : (isContainerOverride ? settings.quality : 'mp4'),
        audioFormat: isAudio ? (isFormatOverride ? settings.audioBitrate : (settings.audioFormat || 'mp3')) : undefined,
        audioBitrate: isFormatOverride ? undefined : (settings.audioBitrate || '128'),
        trackId: settings.audioTrack,
        ...(Number.isFinite(settings.trimStart) ? { trimStart: settings.trimStart } : {}),
        ...(Number.isFinite(settings.trimEnd) ? { trimEnd: settings.trimEnd } : {}),
    });
}

function getExtension(callbacks: DownloadCallbacks): string {
    // Default, actual extension comes from server
    return 'mp4';
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
