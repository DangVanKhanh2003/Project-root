
import { apiV3, v3Config } from '../../../../api/v3';
import { mapToV3DownloadRequest, FEATURE_KEYS } from '@downloader/core';
import { retryWithBackoff, RETRY_CONFIGS, isTimeoutError } from '../conversion/retry-helper';
import { VideoItemSettings, ProgressPhase } from '../../state/multiple-download-types';
import { extractMediaInfoFromCreateJob, hasExtractedMediaInfo, type ExtractedMediaInfo } from '../conversion/v3/extract-media-info';
import { checkLimit, recordUsage } from '../../../download-limit';

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

export async function runSingleDownload(config: DownloadConfig): Promise<void> {
    const { url, settings, signal, callbacks } = config;
    enforceQualityLimits(settings);

    // Phase 1: Extract (create job)
    callbacks.onPhaseChange('extracting');

    const jobResponse = await extractWithRetries(url, settings, signal);

    if (signal.aborted) return;

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

    // Report audio track info if available
    if (callbacks.onAudioTrackInfo && (availableAudioLanguages || audioLanguageChanged !== undefined)) {
        callbacks.onAudioTrackInfo(availableAudioLanguages || [], audioLanguageChanged || false);
    }

    // Phase 2: Poll status
    callbacks.onPhaseChange('processing');
    await pollStatus(statusUrl, signal, callbacks, settings);
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

            if (statusData.status === 'completed') {
                if (statusData.downloadUrl) {
                    const filename = statusData.title
                        ? `${statusData.title}.${getExtension(callbacks)}`
                        : undefined;
                    recordQualityUsage(settings);
                    callbacks.onComplete(statusData.downloadUrl, filename);
                    return;
                }
                throw new Error('Completed but no download URL');
            }

            if (statusData.status === 'error' || statusData.status === 'not_found' || statusData.status === 'failed') {
                // Terminal status - stop polling immediately, no retry
                throw new Error(statusData.jobError || 'Job failed');
            }
        } catch (error: any) {
            if (signal.aborted || error.name === 'AbortError') return;

            // Timeout is NOT an error - continue polling
            if (isTimeoutError(error)) {
                await sleep(pollingInterval);
                continue;
            }

            // Job error from API - check retries
            if (error.isJobError || error.message?.includes('Job failed')) {
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
