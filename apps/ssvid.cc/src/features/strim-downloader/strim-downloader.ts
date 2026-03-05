import { scrollManager } from '@downloader/ui-shared';
import { show as showPaywall } from 'https://media.ytmp3.gg/poppurchase.v3.js';
import { handleAutoDownload, handleExtractMedia, handleSearch } from '../downloader/logic/input-form';
import { clearContent, showLoading } from '../downloader/ui-render/content-renderer';
import { showResultView } from '../downloader/ui-render/view-switcher';
import { onAfterSubmit } from '../widget-level-manager';
import {
  getState,
  setAudioBitrate,
  setAudioFormat,
  setSelectedFormat,
  setVideoQuality,
} from '../downloader/state';
import { initAudioDropdown } from '../downloader/ui-render/dropdown-logic';
import { checkLimit } from '../download-limit';
import { FEATURE_KEYS } from '@downloader/core';

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

let player: YTPlayerApi | null = null;
let slider: NoUiSliderApi | null = null;
let videoDuration = 0;
let currentVideoId: string | null = null;
let startTime = 0;
let endTime = 0;
let seekPreviewPauseTimer: number | null = null;

function extractVideoId(url: string): string | null {
  const normalized = (url || '').trim();
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) return match[1];
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(normalized)) return normalized;
  return null;
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
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

function getEditor(): HTMLElement | null {
  return document.getElementById('stream-editor');
}

function getStartInput(): HTMLInputElement | null {
  return document.getElementById('trim-start') as HTMLInputElement | null;
}

function getEndInput(): HTMLInputElement | null {
  return document.getElementById('trim-end') as HTMLInputElement | null;
}

function getSliderElement(): HTMLElement | null {
  return document.getElementById('trim-slider');
}

function getStartButton(): HTMLElement | null {
  return document.getElementById('stream-start-btn');
}

function getStreamAudioTrackInput(): HTMLInputElement | null {
  return document.getElementById('stream-selected-audio-track') as HTMLInputElement | null;
}

function getMainAudioTrackInput(): HTMLInputElement | null {
  return document.getElementById('audio-track-value') as HTMLInputElement | null;
}

function setEditorVisible(visible: boolean): void {
  const editor = getEditor();
  if (!editor) return;
  if (visible) {
    editor.hidden = false;
    editor.removeAttribute('aria-hidden');
    editor.style.removeProperty('display');
    return;
  }
  editor.hidden = true;
  editor.setAttribute('aria-hidden', 'true');
  editor.style.setProperty('display', 'none', 'important');
}

function setStartButtonVisible(visible: boolean): void {
  const startBtn = getStartButton();
  if (!startBtn) return;
  if (visible) {
    startBtn.hidden = false;
    startBtn.removeAttribute('aria-hidden');
    startBtn.style.removeProperty('display');
    return;
  }
  startBtn.hidden = true;
  startBtn.setAttribute('aria-hidden', 'true');
  startBtn.style.setProperty('display', 'none', 'important');
}

function updateTimeInputs(): void {
  const startInput = getStartInput();
  const endInput = getEndInput();
  if (startInput && document.activeElement !== startInput) {
    startInput.value = formatTime(startTime);
  }
  if (endInput && document.activeElement !== endInput) {
    endInput.value = formatTime(endTime);
  }
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

function applyQualityValueToState(format: 'mp3' | 'mp4', value: string): void {
  if (format === 'mp4') {
    if (value.startsWith('mp4-')) {
      setVideoQuality(`${value.split('-')[1]}p`);
    } else {
      setVideoQuality(value);
    }
    return;
  }

  if (value.startsWith('mp3-')) {
    const bitrate = value.split('-')[1];
    setAudioFormat('mp3');
    setAudioBitrate(bitrate);
    return;
  }

  setAudioFormat(value as 'wav' | 'm4a' | 'opus' | 'ogg' | 'flac' | 'mp3');
  setAudioBitrate('128');
}

function getCurrentQualityValue(format: 'mp3' | 'mp4'): string {
  const state = getState();
  if (format === 'mp4') {
    if (state.videoQuality === 'webm' || state.videoQuality === 'mkv') {
      return state.videoQuality;
    }
    return `mp4-${(state.videoQuality || '720p').replace('p', '')}`;
  }

  if (state.audioFormat === 'mp3') {
    return `mp3-${state.audioBitrate || '128'}`;
  }
  return state.audioFormat || 'mp3-128';
}

function renderQualityOptions(format: 'mp3' | 'mp4'): void {
  const select = document.getElementById('stream-quality-select') as HTMLSelectElement | null;
  if (!select) return;

  const options = format === 'mp4'
    ? [
      { value: 'mp4-2160', label: 'MP4 - 4K' },
      { value: 'mp4-1440', label: 'MP4 - 2K' },
      { value: 'mp4-1080', label: 'MP4 - 1080p' },
      { value: 'mp4-720', label: 'MP4 - 720p' },
      { value: 'mp4-480', label: 'MP4 - 480p' },
      { value: 'mp4-360', label: 'MP4 - 360p' },
      { value: 'mp4-144', label: 'MP4 - 144p' },
      { value: 'webm', label: 'WEBM' },
      { value: 'mkv', label: 'MKV' },
    ]
    : [
      { value: 'mp3-320', label: 'MP3 - 320kbps' },
      { value: 'mp3-192', label: 'MP3 - 192kbps' },
      { value: 'mp3-128', label: 'MP3 - 128kbps' },
      { value: 'wav', label: 'WAV - Lossless' },
      { value: 'm4a', label: 'M4A - 128kbps' },
      { value: 'opus', label: 'Opus - 128kbps' },
      { value: 'ogg', label: 'OGG - 128kbps' },
      { value: 'flac', label: 'FLAC - Lossless' },
    ];

  select.innerHTML = options
    .map((item) => `<option value="${item.value}">${item.label}</option>`)
    .join('');
  select.value = getCurrentQualityValue(format);
  applyQualityValueToState(format, select.value);
}

function syncStreamControlsFromState(): void {
  const state = getState();
  const format = (state.selectedFormat || 'mp3') as 'mp3' | 'mp4';
  const formatButtons = document.querySelectorAll('#stream-format-toggle .format-btn');
  formatButtons.forEach((btn) => {
    const button = btn as HTMLElement;
    if (button.dataset.format === format) {
      button.classList.add('selected');
    } else {
      button.classList.remove('selected');
    }
  });
  renderQualityOptions(format);
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

function initSlider(): void {
  const sliderElement = getSliderElement();
  if (!sliderElement || !window.noUiSlider) return;

  if (slider) {
    slider.destroy();
    slider = null;
  }

  const hasDuration = videoDuration > 0;
  // If no duration yet, set dummy max but keep handles at 0 instead of max
  const max = hasDuration ? videoDuration : 100;
  const end = hasDuration ? videoDuration : 0;

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
    // Always update inputs so it shows 0:00 before duration is loaded
    updateTimeInputs();
  });

  slider.on('slide', (values, handle) => {
    const next = Number(values[handle]);
    seekPlayer(next, true);
  });
}

function createPlayer(videoId: string): void {
  const playerContainer = document.getElementById('stream-player');
  if (!playerContainer || !window.YT?.Player) return;

  if (player) {
    player.destroy();
  }

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
          endTime = duration;
          initSlider();
        }
      },
      onStateChange: (event) => {
        if (event.data === window.YT?.PlayerState.PLAYING && videoDuration < 1) {
          const duration = event.target.getDuration();
          if (duration > 0) {
            videoDuration = duration;
            endTime = duration;
            initSlider();
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

function resetStreamEditorData(): void {
  currentVideoId = null;
  videoDuration = 0;
  startTime = 0;
  endTime = 0;

  if (slider) {
    slider.destroy();
    slider = null;
  }

  if (player) {
    player.destroy();
    player = null;
  }

  const container = document.getElementById('stream-player');
  if (container) {
    container.innerHTML = '';
  }

  const startInput = getStartInput();
  const endInput = getEndInput();
  if (startInput) startInput.value = '0:00';
  if (endInput) endInput.value = '0:00';

  const streamTrackInput = getStreamAudioTrackInput();
  if (streamTrackInput) {
    streamTrackInput.value = 'original';
  }
  const mainTrackInput = getMainAudioTrackInput();
  if (mainTrackInput) {
    mainTrackInput.value = 'original';
  }

  syncStreamControlsFromState();
}

async function loadVideo(url: string): Promise<void> {
  const videoId = extractVideoId(url);
  if (!videoId) return;
  if (videoId === currentVideoId) return;

  currentVideoId = videoId;
  videoDuration = 0;
  startTime = 0;
  endTime = 0;
  clearContent();
  setEditorVisible(true);

  if (scrollManager.isMobile()) {
    const editor = getEditor();
    if (editor) {
      setTimeout(() => {
        window.scrollTo({ top: editor.getBoundingClientRect().top + window.scrollY - 16, behavior: 'smooth' });
      }, 50);
    }
  }

  await loadNoUiSlider();
  initSlider();
  await loadYouTubeApi();
  createPlayer(videoId);
}

function setupEventListeners(): void {
  const startBtn = getStartButton();
  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      const input = document.getElementById('videoUrl') as HTMLInputElement | null;
      const value = input?.value.trim() || '';
      if (!value) return;

      const videoId = extractVideoId(value);
      if (videoId) {
        await loadVideo(value);
        await handleExtractMedia(value, { autoDownload: false, skipResultView: true });
      } else {
        setEditorVisible(false);
        showLoading('list');
        await handleSearch(value);
      }
    });
  }

  const streamToggle = document.getElementById('stream-format-toggle');
  if (streamToggle) {
    streamToggle.addEventListener('click', (event) => {
      const target = (event.target as HTMLElement).closest('.format-btn') as HTMLElement | null;
      if (!target) return;
      const nextFormat = (target.dataset.format || 'mp3') as 'mp3' | 'mp4';
      setSelectedFormat(nextFormat);
      syncStreamControlsFromState();
    });
  }

  const qualitySelect = document.getElementById('stream-quality-select') as HTMLSelectElement | null;
  if (qualitySelect) {
    qualitySelect.addEventListener('change', () => {
      const format = (getState().selectedFormat || 'mp3') as 'mp3' | 'mp4';
      applyQualityValueToState(format, qualitySelect.value);
    });
  }

  const convertBtn = document.getElementById('stream-convert-btn');
  if (convertBtn) {
    convertBtn.addEventListener('click', async () => {
      const input = document.getElementById('videoUrl') as HTMLInputElement | null;
      const url = input?.value.trim() || '';
      const videoId = extractVideoId(url);
      if (!url || !videoId) return;

      // ── Quality Limit Check (before conversion starts) ──────────────────────
      const currentState = getState();
      const fmt = (currentState.selectedFormat || 'mp3') as 'mp3' | 'mp4';
      const is4K = fmt === 'mp4' && (currentState.videoQuality || '') === '2160p';
      const is2K = fmt === 'mp4' && (currentState.videoQuality || '') === '1440p';
      const is320kbps = fmt === 'mp3' && currentState.audioFormat === 'mp3' && currentState.audioBitrate === '320';

      if (is4K) {
        const limitResult = checkLimit(FEATURE_KEYS.HIGH_QUALITY_4K);
        if (!limitResult.allowed) {
          showPaywall('download_4k');
          return;
        }
      }
      if (is2K) {
        const limitResult = checkLimit(FEATURE_KEYS.HIGH_QUALITY_2K);
        if (!limitResult.allowed) {
          showPaywall('download_2k');
          return;
        }
      }
      if (is320kbps) {
        const limitResult = checkLimit(FEATURE_KEYS.HIGH_QUALITY_320K);
        if (!limitResult.allowed) {
          showPaywall('download_320kbps');
          return;
        }
      }
      // ───────────────────────────────────────────────────────────────────────

      const streamAudioTrack = getStreamAudioTrackInput()?.value || 'original';
      const mainAudioTrack = getMainAudioTrackInput();
      if (mainAudioTrack) {
        mainAudioTrack.value = streamAudioTrack;
      }

      setEditorVisible(false);
      setStartButtonVisible(false);

      showLoading('detail');
      showResultView();
      onAfterSubmit();

      await handleAutoDownload(url, videoId, {
        trimStart: startTime,
        trimEnd: endTime,
        trimRangeLabel: `${formatTime(startTime)} - ${formatTime(endTime)}`,
      });
    });
  }

  const startInput = getStartInput();
  if (startInput) {
    startInput.addEventListener('blur', () => syncInputToSlider('trim-start'));
    startInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        syncInputToSlider('trim-start');
      }
    });
  }

  const endInput = getEndInput();
  if (endInput) {
    endInput.addEventListener('blur', () => syncInputToSlider('trim-end'));
    endInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        syncInputToSlider('trim-end');
      }
    });
  }

  document.addEventListener('resetForm', () => {
    resetStreamEditorData();
    setEditorVisible(false);
    setStartButtonVisible(true);
  });

  const urlInput = document.getElementById('videoUrl') as HTMLInputElement | null;
  if (urlInput) {
    urlInput.addEventListener('input', () => {
      const val = urlInput.value.trim();
      if (!val) {
        setEditorVisible(false);
        currentVideoId = null;
      } else {
        // Preload scripts when a URL is likely pasted
        const maybeId = extractVideoId(val);
        if (maybeId) {
          loadNoUiSlider().catch(() => { });
          loadYouTubeApi().catch(() => { });
        }
      }
    });
  }
}

function initStreamAudioDropdown(): void {
  initAudioDropdown({
    dropdownId: 'stream-audio-track-dropdown',
    hiddenInputId: 'stream-selected-audio-track',
  });

  const streamInput = getStreamAudioTrackInput();
  const mainInput = getMainAudioTrackInput();
  if (!streamInput || !mainInput) return;

  streamInput.addEventListener('change', () => {
    mainInput.value = streamInput.value;
  });
}

export function init(): void {
  setEditorVisible(false);
  setStartButtonVisible(true);
  initStreamAudioDropdown();
  syncStreamControlsFromState();
  setupEventListeners();
}
