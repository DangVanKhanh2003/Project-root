import { scrollManager } from '@downloader/ui-shared';
import { show as showPaywall } from 'https://media.ytmp3.gg/poppurchase.v3.js?v=15';
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
const VIDEO_RESOLUTIONS = ['2160', '1440', '1080', '720', '480', '360', '144'] as const;
type VideoGroup = 'mp4' | 'webm' | 'mkv';
const VIDEO_GROUPS: readonly VideoGroup[] = ['mp4', 'webm', 'mkv'];
let streamGroupListenersBound = false;

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
    const videoMatch = value.match(/^(mp4|webm|mkv)-(\d+)$/);
    if (videoMatch) {
      const container = videoMatch[1];
      const resolution = `${videoMatch[2]}p`;
      setVideoQuality(container === 'mp4' ? resolution : `${container}-${resolution}`);
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
    const groupedMatch = (state.videoQuality || '').match(/^(webm|mkv)-(\d+)p$/);
    if (groupedMatch) {
      return `${groupedMatch[1]}-${groupedMatch[2]}`;
    }

    const resolution = (state.videoQuality || '720p').replace('p', '');
    return `mp4-${resolution}`;
  }

  if ((state.audioFormat || 'mp3') === 'mp3') {
    return `mp3-${state.audioBitrate || '128'}`;
  }

  return state.audioFormat || 'mp3';
}

function getVideoResolutionLabel(videoQuality: string | undefined): string {
  const normalized = (videoQuality || '').toLowerCase();
  const grouped = normalized.match(/^(?:mp4|webm|mkv)-(\d+)p$/);
  if (grouped) return `${grouped[1]}p`;

  const plain = normalized.match(/^(\d+)p$/);
  if (plain) return `${plain[1]}p`;

  const numeric = normalized.match(/^(\d+)$/);
  if (numeric) return `${numeric[1]}p`;

  return '';
}

function getQualityLabel(resolution: string): string {
  if (resolution === '2160') return '4K';
  if (resolution === '1440') return '2K';
  return `${resolution}P`;
}

function getGroupFromVideoValue(value: string): VideoGroup | null {
  const match = value.match(/^(mp4|webm|mkv)-\d+$/);
  return (match ? match[1] : null) as VideoGroup | null;
}

function getVideoOptionLabel(value: string): string {
  const match = value.match(/^(mp4|webm|mkv)-(\d+)$/);
  if (!match) return value;
  return `${match[1].toUpperCase()} - ${getQualityLabel(match[2])}`;
}

function buildVideoOptions(container: VideoGroup): string {
  return VIDEO_RESOLUTIONS.map((resolution) => {
    const value = `${container}-${resolution}`;
    const label = `${container.toUpperCase()} - ${getQualityLabel(resolution)}`;
    return `<option value="${value}">${label}</option>`;
  }).join('');
}

function parseOpenGroups(raw: string | undefined, selectedValue: string): Set<VideoGroup> {
  const groups = new Set<VideoGroup>();
  if (raw !== undefined) {
    raw.split(',').forEach((part) => {
      const normalized = part.trim().toLowerCase();
      if (normalized === 'mp4' || normalized === 'webm' || normalized === 'mkv') {
        groups.add(normalized as VideoGroup);
      }
    });
  } else {
    groups.add(getGroupFromVideoValue(selectedValue) || 'mp4');
  }

  return groups;
}

function setOpenGroups(dropdown: HTMLElement, groups: Set<VideoGroup>): void {
  dropdown.dataset.openGroups = Array.from(groups).join(',');
}

function getStreamSelectFromDropdown(dropdown: HTMLElement): HTMLSelectElement | null {
  const wrapper = dropdown.closest('.quality-dropdown-wrapper') as HTMLElement | null;
  if (!wrapper) return null;
  return wrapper.querySelector('#stream-quality-select') as HTMLSelectElement | null;
}

function renderStreamGroupedDropdown(dropdown: HTMLElement, selectedValue: string): void {
  const openGroups = parseOpenGroups(dropdown.dataset.openGroups, selectedValue);
  const menuOpen = dropdown.dataset.menuOpen === '1';

  const groupsHtml = VIDEO_GROUPS.map((group) => {
    const isOpen = openGroups.has(group);
    const icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>';
    const items = VIDEO_RESOLUTIONS.map((resolution) => {
      const value = `${group}-${resolution}`;
      const label = `${group.toUpperCase()} - ${getQualityLabel(resolution)}`;
      const selectedClass = value === selectedValue ? ' is-selected' : '';
      return `<button type="button" class="video-group-item${selectedClass}" data-stream-group-item="${value}">${label}</button>`;
    }).join('');

    return `
      <div class="video-group-section${isOpen ? ' is-open' : ''}" data-video-group="${group}">
        <button type="button" class="video-group-header" data-stream-group-toggle="${group}">
          <span class="video-group-header-icon">${icon}</span>
          <span class="video-group-header-label">${group.toUpperCase()}</span>
        </button>
        <div class="video-group-items"${isOpen ? '' : ' hidden'}>${items}</div>
      </div>
    `;
  }).join('');

  dropdown.innerHTML = `
    <button type="button" class="video-group-trigger" data-stream-group-trigger aria-expanded="${menuOpen ? 'true' : 'false'}">
      <span class="video-group-trigger-label">${getVideoOptionLabel(selectedValue)}</span>
      <span class="video-group-trigger-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </span>
    </button>
    <div class="video-group-menu"${menuOpen ? '' : ' hidden'}>
      ${groupsHtml}
    </div>
  `;

  const trigger = dropdown.querySelector('[data-stream-group-trigger]') as HTMLElement | null;
  if (trigger) {
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleStreamGroupMenu(dropdown);
    });
  }

  dropdown.querySelectorAll<HTMLElement>('[data-stream-group-toggle]').forEach((toggle) => {
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const group = (toggle.dataset.streamGroupToggle || '').toLowerCase() as VideoGroup;
      if (group === 'mp4' || group === 'webm' || group === 'mkv') {
        toggleStreamGroupSection(dropdown, group);
      }
    });
  });

  dropdown.querySelectorAll<HTMLElement>('[data-stream-group-item]').forEach((item) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      const value = item.dataset.streamGroupItem || '';
      if (value) {
        selectStreamGroupItem(dropdown, value);
      }
    });
  });
}

function syncStreamGroupedDropdown(select: HTMLSelectElement): void {
  const wrapper = select.closest('.quality-dropdown-wrapper') as HTMLElement | null;
  if (!wrapper) return;

  wrapper.classList.add('quality-dropdown-wrapper--grouped');
  select.classList.add('quality-select--native-hidden');

  let dropdown = wrapper.querySelector('[data-stream-group-dropdown]') as HTMLElement | null;
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.className = 'video-group-dropdown stream-video-group-dropdown';
    dropdown.setAttribute('data-stream-group-dropdown', '');
    wrapper.appendChild(dropdown);
  }

  renderStreamGroupedDropdown(dropdown, select.value || 'mp4-720');
}

function toggleStreamGroupMenu(dropdown: HTMLElement): void {
  const select = getStreamSelectFromDropdown(dropdown);
  if (!select) return;

  const willOpen = dropdown.dataset.menuOpen !== '1';
  dropdown.dataset.menuOpen = willOpen ? '1' : '0';

  if (willOpen) {
    const selected = select.value || 'mp4-720';
    const selectedGroup = getGroupFromVideoValue(selected) || 'mp4';
    const groups = parseOpenGroups(dropdown.dataset.openGroups, selected);
    if (groups.size === 0) {
      groups.add(selectedGroup);
      setOpenGroups(dropdown, groups);
    }
  }

  renderStreamGroupedDropdown(dropdown, select.value || 'mp4-720');
}

function closeStreamGroupMenu(dropdown: HTMLElement): void {
  dropdown.dataset.menuOpen = '0';
  const select = getStreamSelectFromDropdown(dropdown);
  if (!select) return;
  renderStreamGroupedDropdown(dropdown, select.value || 'mp4-720');
}

function closeAllStreamGroupMenus(): void {
  document.querySelectorAll<HTMLElement>('[data-stream-group-dropdown]').forEach((dropdown) => {
    if (dropdown.dataset.menuOpen === '1') {
      closeStreamGroupMenu(dropdown);
    }
  });
}

function toggleStreamGroupSection(dropdown: HTMLElement, group: VideoGroup): void {
  const select = getStreamSelectFromDropdown(dropdown);
  if (!select) return;
  const groups = parseOpenGroups(dropdown.dataset.openGroups, select.value || 'mp4-720');
  if (groups.has(group)) groups.delete(group);
  else groups.add(group);
  setOpenGroups(dropdown, groups);
  dropdown.dataset.menuOpen = '1';
  renderStreamGroupedDropdown(dropdown, select.value || 'mp4-720');
}

function selectStreamGroupItem(dropdown: HTMLElement, value: string): void {
  const select = getStreamSelectFromDropdown(dropdown);
  if (!select) return;
  select.value = value;

  const selectedGroup = getGroupFromVideoValue(value);
  const groups = parseOpenGroups(dropdown.dataset.openGroups, value);
  if (selectedGroup) groups.add(selectedGroup);
  setOpenGroups(dropdown, groups);

  dropdown.dataset.menuOpen = '0';
  renderStreamGroupedDropdown(dropdown, value);
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function renderQualityOptions(format: 'mp3' | 'mp4'): void {
  const select = document.getElementById('stream-quality-select') as HTMLSelectElement | null;
  if (!select) return;

  if (format === 'mp4') {
    select.innerHTML = `
      <optgroup label="MP4">${buildVideoOptions('mp4')}</optgroup>
      <optgroup label="WEBM">${buildVideoOptions('webm')}</optgroup>
      <optgroup label="MKV">${buildVideoOptions('mkv')}</optgroup>
    `;
  } else {
    const options = [
      { value: 'mp3-320', label: 'MP3 - 320kbps' },
      { value: 'mp3-192', label: 'MP3 - 192kbps' },
      { value: 'mp3-128', label: 'MP3 - 128kbps' },
      { value: 'mp3-64', label: 'MP3 - 64kbps' },
      { value: 'wav', label: 'WAV - 128kbps' },
      { value: 'm4a', label: 'M4A - 128kbps' },
      { value: 'ogg', label: 'OGG - 128kbps' },
      { value: 'opus', label: 'Opus - 128kbps' },
      { value: 'flac', label: 'FLAC - 128kbps' },
    ];
    select.innerHTML = options.map((item) => `<option value="${item.value}">${item.label}</option>`).join('');
  }

  select.value = getCurrentQualityValue(format);
  if (!select.value) {
    select.selectedIndex = 0;
  }
  applyQualityValueToState(format, select.value);
  if (format === 'mp4') {
    syncStreamGroupedDropdown(select);
  } else {
    const wrapper = select.closest('.quality-dropdown-wrapper');
    wrapper?.classList.remove('quality-dropdown-wrapper--grouped');
    select.classList.remove('quality-select--native-hidden');
    const dropdown = wrapper?.querySelector('[data-stream-group-dropdown]');
    if (dropdown) dropdown.remove();
  }
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
      if (format === 'mp4') syncStreamGroupedDropdown(qualitySelect);
    });
  }

  if (!streamGroupListenersBound) {
    document.addEventListener('click', (event) => {
      const path = event.composedPath ? event.composedPath() : [];
      const isInside = path.some((node) => {
        const el = node as HTMLElement;
        return !!el?.closest?.('[data-stream-group-dropdown]');
      });
      if (!isInside) {
        closeAllStreamGroupMenus();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeAllStreamGroupMenus();
      }
    });
    streamGroupListenersBound = true;
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
      const selectedResolution = getVideoResolutionLabel(currentState.videoQuality);
      const is4K = selectedResolution === '2160p';
      const is2K = selectedResolution === '1440p';
      const is320kbps = fmt === 'mp3' && currentState.audioFormat === 'mp3' && currentState.audioBitrate === '320';

      const proceedWithConversion = async () => {
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
      };

      if (is4K) {
        const limitResult = checkLimit(FEATURE_KEYS.HIGH_QUALITY_4K);
        if (!limitResult.allowed) {
          showPaywall('download_4k', {
            secondaryLabel: 'Continue with 720p',
            onSecondaryClick: () => {
              setVideoQuality('720p');
              const badge = document.querySelector('.badge-main-quality');
              if (badge) badge.textContent = '720p';
              proceedWithConversion();
            },
          });
          return;
        }
      }
      if (is2K) {
        const limitResult = checkLimit(FEATURE_KEYS.HIGH_QUALITY_2K);
        if (!limitResult.allowed) {
          showPaywall('download_2k', {
            secondaryLabel: 'Continue with 720p',
            onSecondaryClick: () => {
              setVideoQuality('720p');
              const badge = document.querySelector('.badge-main-quality');
              if (badge) badge.textContent = '720p';
              proceedWithConversion();
            },
          });
          return;
        }
      }
      if (is320kbps) {
        const limitResult = checkLimit(FEATURE_KEYS.HIGH_QUALITY_320K);
        if (!limitResult.allowed) {
          showPaywall('download_320kbps', {
            secondaryLabel: 'Continue with 128kbps',
            onSecondaryClick: () => {
              setAudioBitrate('128');
              const badge = document.querySelector('.badge-main-quality');
              if (badge) badge.textContent = '128kbps';
              proceedWithConversion();
            },
          });
          return;
        }
      }
      // ───────────────────────────────────────────────────────────────────────

      await proceedWithConversion();
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
