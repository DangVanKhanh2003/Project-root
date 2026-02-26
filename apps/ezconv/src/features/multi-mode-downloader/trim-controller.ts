/**
 * Trim Controller
 * Manages the YouTube player and noUiSlider for the Trim/Cut mode
 * on the unified download page.
 *
 * Reuses player/slider patterns from trim-downloader.ts adapted for multi-mode:
 * - No format/quality/audio controls (those live in the main form)
 * - No start/convert buttons (unified Convert button handles submit)
 * - loadVideoForTrim() triggered externally by advanced-settings-controller
 */

import { extractVideoId } from '@downloader/core';

// ==========================================
// Types (mirrored from trim-downloader.ts)
// ==========================================

type SliderTuple = [number | string, number | string];

interface NoUiSliderApi {
    on: (eventName: string, callback: (values: SliderTuple, handle: number) => void) => void;
    set: (values: [number | null, number | null]) => void;
    destroy: () => void;
}

interface NoUiSliderFactory {
    create: (
        target: HTMLElement,
        options: {
            start: [number, number];
            connect: boolean;
            range: { min: number; max: number };
            step: number;
            behaviour: string;
        }
    ) => NoUiSliderApi;
}

interface YTPlayerApi {
    destroy: () => void;
    getDuration: () => number;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    pauseVideo: () => void;
    playVideo: () => void;
}

declare global {
    interface Window {
        YT?: {
            Player: new (
                elementId: string,
                config: {
                    videoId: string;
                    playerVars: Record<string, number>;
                    events: {
                        onReady: (event: { target: YTPlayerApi }) => void;
                        onStateChange: (event: { data: number; target: YTPlayerApi }) => void;
                    };
                }
            ) => YTPlayerApi;
            PlayerState: { PLAYING: number; ENDED: number };
        };
        onYouTubeIframeAPIReady?: () => void;
        noUiSlider?: NoUiSliderFactory;
    }
}

// ==========================================
// Module state
// ==========================================

let player: YTPlayerApi | null = null;
let slider: NoUiSliderApi | null = null;
let videoDuration = 0;
let currentVideoId: string | null = null;
let startTime = 0;
let endTime = 0;
let seekPreviewPauseTimer: number | null = null;

function renderEmptyPreview(): void {
    const container = document.getElementById('stream-player');
    if (!container) return;
    container.innerHTML = `
        <div class="trim-empty-preview" aria-label="Empty trim preview">
            <svg viewBox="0 0 24 24" width="42" height="42" aria-hidden="true" focusable="false">
                <path d="M10 8l6 4-6 4V8z" fill="currentColor"></path>
                <rect x="3" y="5" width="18" height="14" rx="3" ry="3" fill="none" stroke="currentColor" stroke-width="1.5"></rect>
            </svg>
            <span>Add more links</span>
        </div>
    `;
}

// ==========================================
// Public accessors
// ==========================================

export function getTrimStart(): number { return startTime; }
export function getTrimEnd(): number { return endTime; }

export function getTrimRangeLabel(): string {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

// ==========================================
// Helpers
// ==========================================

function formatTime(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
}

function parseTime(value: string): number | null {
    const parts = value.trim().split(':').map(Number);
    if (parts.some(Number.isNaN)) return null;
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
}

function updateTimeInputs(): void {
    const startInput = document.getElementById('trim-start') as HTMLInputElement | null;
    const endInput = document.getElementById('trim-end') as HTMLInputElement | null;
    if (startInput && document.activeElement !== startInput) startInput.value = formatTime(startTime);
    if (endInput && document.activeElement !== endInput) endInput.value = formatTime(endTime);
}

function seekPlayer(time: number, preview = false): void {
    if (!player) return;
    player.seekTo(time, true);

    if (seekPreviewPauseTimer !== null) {
        window.clearTimeout(seekPreviewPauseTimer);
        seekPreviewPauseTimer = null;
    }

    if (preview) {
        player.playVideo();
        seekPreviewPauseTimer = window.setTimeout(() => {
            player?.seekTo(time, true);
            player?.pauseVideo();
            seekPreviewPauseTimer = null;
        }, 50);
        return;
    }
    player.pauseVideo();
}

function syncInputToSlider(inputId: 'trim-start' | 'trim-end'): void {
    if (!slider || videoDuration <= 0) return;
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (!input) return;

    const parsed = parseTime(input.value);
    if (parsed === null) return;
    const clamped = Math.max(0, Math.min(videoDuration, parsed));

    if (inputId === 'trim-start') {
        startTime = Math.min(clamped, endTime);
        slider.set([startTime, null]);
        seekPlayer(startTime);
    } else {
        endTime = Math.max(clamped, startTime);
        slider.set([null, endTime]);
        seekPlayer(endTime);
    }
}

function nudgeTimeInput(inputId: 'trim-start' | 'trim-end', deltaSeconds: number): void {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (!input) return;

    const fallback = inputId === 'trim-start' ? startTime : endTime;
    const base = parseTime(input.value);
    const current = base === null ? fallback : base;
    const minBound = inputId === 'trim-start' ? 0 : Math.max(0, startTime);
    const maxBoundRaw = inputId === 'trim-start'
        ? (videoDuration > 0 ? Math.min(videoDuration, endTime) : endTime)
        : (videoDuration > 0 ? videoDuration : Number.POSITIVE_INFINITY);
    const maxBound = Math.max(minBound, maxBoundRaw);
    const next = Math.min(maxBound, Math.max(minBound, current + deltaSeconds));

    input.value = formatTime(next);
    syncInputToSlider(inputId);
}

// ==========================================
// CDN loaders
// ==========================================

async function loadNoUiSlider(): Promise<void> {
    if (window.noUiSlider) return;
    await new Promise<void>((resolve, reject) => {
        if (!document.querySelector('link[href*="nouislider"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/nouislider@15.7.1/dist/nouislider.min.css';
            document.head.appendChild(link);
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/nouislider@15.7.1/dist/nouislider.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load noUiSlider'));
        document.head.appendChild(script);
    });
}

async function loadYouTubeApi(): Promise<void> {
    if (window.YT?.Player) return;
    await new Promise<void>((resolve) => {
        const previous = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            previous?.();
            resolve();
        };
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            const script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(script);
        }
    });
}

// ==========================================
// Slider
// ==========================================

function initSlider(): void {
    const sliderElement = document.getElementById('trim-slider');
    if (!sliderElement || !window.noUiSlider) return;

    if (slider) { slider.destroy(); slider = null; }

    const max = videoDuration > 0 ? videoDuration : 100;
    const end = videoDuration > 0 ? videoDuration : 100;

    slider = window.noUiSlider.create(sliderElement, {
        start: [0, end],
        connect: true,
        range: { min: 0, max },
        step: 1,
        behaviour: 'drag-tap',
    });

    slider.on('update', (values) => {
        startTime = Math.round(Number(values[0]));
        endTime = Math.round(Number(values[1]));
        if (videoDuration > 0) updateTimeInputs();
    });

    slider.on('slide', (values, handle) => {
        seekPlayer(Number(values[handle]), true);
    });
}

// ==========================================
// Player
// ==========================================

function createPlayer(videoId: string): void {
    const container = document.getElementById('stream-player');
    if (!container || !window.YT?.Player) return;

    if (player) { player.destroy(); }

    player = new window.YT.Player('stream-player', {
        videoId,
        playerVars: {
            autoplay: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            fs: 0,
            disablekb: 1,
            playsinline: 1,
        },
        events: {
            onReady: (event) => {
                const duration = event.target.getDuration();
                if (duration > 0) {
                    videoDuration = duration;
                    startTime = 0;
                    endTime = duration;
                    initSlider();
                    updateTimeInputs();
                }
            },
            onStateChange: (event) => {
                if (event.data === window.YT?.PlayerState.PLAYING && videoDuration < 1) {
                    const duration = event.target.getDuration();
                    if (duration > 0) {
                        videoDuration = duration;
                        startTime = 0;
                        endTime = duration;
                        initSlider();
                        updateTimeInputs();
                    }
                    event.target.pauseVideo();
                }
                if (event.data === window.YT?.PlayerState.ENDED) {
                    event.target.seekTo(startTime, true);
                    event.target.pauseVideo();
                }
            },
        },
    });
}

// ==========================================
// Public API
// ==========================================

export function resetTrimEditor(): void {
    currentVideoId = null;
    videoDuration = 0;
    startTime = 0;
    endTime = 0;

    if (seekPreviewPauseTimer !== null) {
        window.clearTimeout(seekPreviewPauseTimer);
        seekPreviewPauseTimer = null;
    }

    if (slider) { slider.destroy(); slider = null; }
    if (player) { player.destroy(); player = null; }

    renderEmptyPreview();

    const startInput = document.getElementById('trim-start') as HTMLInputElement | null;
    const endInput = document.getElementById('trim-end') as HTMLInputElement | null;
    if (startInput) startInput.value = '0:00';
    if (endInput) endInput.value = '0:00';

    // Keep slider visible in default state after reset.
    initSlider();
}

export async function loadVideoForTrim(url: string): Promise<void> {
    const videoId = extractVideoId(url);
    if (!videoId) return;
    if (videoId === currentVideoId) return;

    currentVideoId = videoId;
    videoDuration = 0;

    await loadNoUiSlider();
    initSlider();
    await loadYouTubeApi();
    createPlayer(videoId);
}

export function initTrimController(): void {
    const startInput = document.getElementById('trim-start') as HTMLInputElement | null;
    if (startInput) {
        startInput.addEventListener('blur', () => syncInputToSlider('trim-start'));
        startInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); syncInputToSlider('trim-start'); }
            if (e.key === 'ArrowUp') { e.preventDefault(); nudgeTimeInput('trim-start', 1); }
            if (e.key === 'ArrowDown') { e.preventDefault(); nudgeTimeInput('trim-start', -1); }
        });
    }

    const endInput = document.getElementById('trim-end') as HTMLInputElement | null;
    if (endInput) {
        endInput.addEventListener('blur', () => syncInputToSlider('trim-end'));
        endInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); syncInputToSlider('trim-end'); }
            if (e.key === 'ArrowUp') { e.preventDefault(); nudgeTimeInput('trim-end', 1); }
            if (e.key === 'ArrowDown') { e.preventDefault(); nudgeTimeInput('trim-end', -1); }
        });
    }
}
