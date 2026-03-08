/**
 * Format Selector Component
 * Reusable MP3/MP4 toggle + Quality dropdown
 */

import {
  getState,
  setSelectedFormat,
  setVideoQuality,
  setAudioFormat,
  setAudioBitrate,
  type FormatType,
  type AudioFormatType
} from '../../features/downloader/state';
import { logEvent } from '../../libs/firebase';

const VIDEO_RESOLUTIONS = ['2160', '1440', '1080', '720', '480', '360', '144'] as const;
type VideoGroup = 'mp4' | 'webm' | 'mkv';
const VIDEO_GROUPS: readonly VideoGroup[] = ['mp4', 'webm', 'mkv'];

const AUDIO_OPTIONS = [
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

let globalDropdownListenersBound = false;

function parseVideoSelectValue(value: string): string {
  const match = value.match(/^(mp4|webm|mkv)-(\d+)$/);
  if (!match) return '720p';
  const container = match[1];
  const resolution = `${match[2]}p`;
  return container === 'mp4' ? resolution : `${container}-${resolution}`;
}

function toVideoSelectValue(videoQuality: string): string {
  const normalized = (videoQuality || '720p').toLowerCase();
  const groupedMatch = normalized.match(/^(webm|mkv)-(\d+)p$/);
  if (groupedMatch) {
    return `${groupedMatch[1]}-${groupedMatch[2]}`;
  }

  const resolutionMatch = normalized.match(/^(\d+)p$/);
  if (resolutionMatch) {
    return `mp4-${resolutionMatch[1]}`;
  }

  return 'mp4-720';
}

function toAudioSelectValue(audioFormat: AudioFormatType, audioBitrate: string): string {
  if (audioFormat === 'mp3') {
    return `mp3-${audioBitrate || '128'}`;
  }
  return audioFormat;
}

function getQualityLabel(resolution: string): string {
  if (resolution === '2160') return '4K';
  if (resolution === '1440') return '2K';
  return `${resolution}p`;
}

function getVideoGroup(value: string): VideoGroup | null {
  const match = value.match(/^(mp4|webm|mkv)-\d+$/);
  return (match ? match[1] : null) as VideoGroup | null;
}

function getVideoOptionLabel(value: string): string {
  const match = value.match(/^(mp4|webm|mkv)-(\d+)$/);
  if (!match) return value;
  return `${match[1]} - ${getQualityLabel(match[2])}`;
}

function buildVideoOptions(container: VideoGroup): string {
  return VIDEO_RESOLUTIONS.map((resolution) => {
    const value = `${container}-${resolution}`;
    const label = `${container} - ${getQualityLabel(resolution)}`;
    return `<option value="${value}">${label}</option>`;
  }).join('');
}

function getNativeVideoSelectFromDropdown(dropdown: HTMLElement): HTMLSelectElement | null {
  const wrapper = dropdown.closest('.quality-dropdown-wrapper') as HTMLElement | null;
  if (!wrapper) return null;
  return wrapper.querySelector('.quality-select--mp4[data-quality-select]') as HTMLSelectElement | null;
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
    const selectedGroup = getVideoGroup(selectedValue) || 'mp4';
    groups.add(selectedGroup);
  }

  return groups;
}

function setOpenGroups(dropdown: HTMLElement, groups: Set<VideoGroup>): void {
  dropdown.dataset.openGroups = Array.from(groups).join(',');
}

function renderGroupedVideoDropdown(dropdown: HTMLElement, selectedValue: string): void {
  const openGroups = parseOpenGroups(dropdown.dataset.openGroups, selectedValue);
  const menuOpen = dropdown.dataset.menuOpen === '1';
  const selectedLabel = getVideoOptionLabel(selectedValue);

  const groupHtml = VIDEO_GROUPS.map((group) => {
    const isOpen = openGroups.has(group);
    const headerIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>';
    const itemsHtml = VIDEO_RESOLUTIONS.map((resolution) => {
      const value = `${group}-${resolution}`;
      const selectedClass = value === selectedValue ? ' is-selected' : '';
      const label = `${group} - ${getQualityLabel(resolution)}`;
      return `<button type="button" class="video-group-item${selectedClass}" data-group-item="${value}">${label}</button>`;
    }).join('');

    return `
      <div class="video-group-section${isOpen ? ' is-open' : ''}" data-video-group="${group}">
        <button type="button" class="video-group-header" data-group-toggle="${group}">
          <span class="video-group-header-icon">${headerIcon}</span>
          <span class="video-group-header-label">${group.toUpperCase()}</span>
        </button>
        <div class="video-group-items"${isOpen ? '' : ' hidden'}>
          ${itemsHtml}
        </div>
      </div>
    `;
  }).join('');

  dropdown.innerHTML = `
    <button type="button" class="video-group-trigger" data-video-group-trigger aria-expanded="${menuOpen ? 'true' : 'false'}">
      <span class="video-group-trigger-label">${selectedLabel}</span>
      <span class="video-group-trigger-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </span>
    </button>
    <div class="video-group-menu"${menuOpen ? '' : ' hidden'}>
      ${groupHtml}
    </div>
  `;
}

function syncGroupedVideoDropdown(select: HTMLSelectElement): void {
  const wrapper = select.closest('.quality-dropdown-wrapper') as HTMLElement | null;
  if (!wrapper) return;

  wrapper.classList.add('quality-dropdown-wrapper--grouped');
  select.classList.add('quality-select--native-hidden');

  let dropdown = wrapper.querySelector('[data-video-group-dropdown]') as HTMLElement | null;
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.className = 'video-group-dropdown';
    dropdown.setAttribute('data-video-group-dropdown', '');
    wrapper.appendChild(dropdown);
  }

  renderGroupedVideoDropdown(dropdown, select.value || 'mp4-720');
}

function toggleGroupedVideoMenu(dropdown: HTMLElement): void {
  const isOpen = dropdown.dataset.menuOpen === '1';
  dropdown.dataset.menuOpen = isOpen ? '0' : '1';
  const select = getNativeVideoSelectFromDropdown(dropdown);
  if (!select) return;
  renderGroupedVideoDropdown(dropdown, select.value || 'mp4-720');
}

function closeGroupedVideoMenu(dropdown: HTMLElement): void {
  dropdown.dataset.menuOpen = '0';
  const select = getNativeVideoSelectFromDropdown(dropdown);
  if (!select) return;
  renderGroupedVideoDropdown(dropdown, select.value || 'mp4-720');
}

function toggleVideoGroupSection(dropdown: HTMLElement, group: VideoGroup): void {
  const select = getNativeVideoSelectFromDropdown(dropdown);
  if (!select) return;

  const groups = parseOpenGroups(dropdown.dataset.openGroups, select.value || 'mp4-720');
  if (groups.has(group)) {
    groups.delete(group);
  } else {
    groups.add(group);
  }

  setOpenGroups(dropdown, groups);
  dropdown.dataset.menuOpen = '1';
  renderGroupedVideoDropdown(dropdown, select.value || 'mp4-720');
}

function selectVideoGroupItem(dropdown: HTMLElement, value: string): void {
  const select = getNativeVideoSelectFromDropdown(dropdown);
  if (!select) return;

  select.value = value;

  const selectedGroup = getVideoGroup(value);
  const groups = parseOpenGroups(dropdown.dataset.openGroups, value);
  if (selectedGroup) {
    groups.add(selectedGroup);
  }
  setOpenGroups(dropdown, groups);

  dropdown.dataset.menuOpen = '0';
  renderGroupedVideoDropdown(dropdown, value);

  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function closeAllGroupedVideoMenus(): void {
  document.querySelectorAll<HTMLElement>('[data-video-group-dropdown]').forEach((dropdown) => {
    if (dropdown.dataset.menuOpen === '1') {
      closeGroupedVideoMenu(dropdown);
    }
  });
}

function initGroupedVideoDropdown(container: Element): void {
  const select = container.querySelector('.quality-select--mp4[data-quality-select]') as HTMLSelectElement | null;
  if (!select) return;

  const selectedValue = toVideoSelectValue(getState().videoQuality);
  if (selectedValue && select.value !== selectedValue) {
    select.value = selectedValue;
  }

  syncGroupedVideoDropdown(select);
}

/**
 * Render format selector HTML
 * Returns HTML string for the format selector component
 */
function renderFormatSelector(): string {
  const state = getState();
  const { selectedFormat, videoQuality, audioFormat, audioBitrate } = state;

  const qualityDropdownHTML = selectedFormat === 'mp4'
    ? renderVideoQualityDropdown(videoQuality)
    : renderAudioQualityDropdown(audioFormat, audioBitrate);

  const convertText = 'Convert';

  return `
    <div class="format-selector">
      <div class="format-toggle">
        <button type="button" class="format-btn ${selectedFormat === 'mp3' ? 'active' : ''}" data-format="mp3">MP3</button>
        <button type="button" class="format-btn ${selectedFormat === 'mp4' ? 'active' : ''}" data-format="mp4">MP4</button>
      </div>
      <div class="quality-wrapper">
        ${qualityDropdownHTML}
        <div class="select-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </div>
      <button type="submit" class="btn-convert">
        <span>${convertText}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
      </button>
    </div>
  `;
}

function renderVideoQualityDropdown(selectedQuality: string): string {
  const selectedValue = toVideoSelectValue(selectedQuality);
  const selectedGroup = getVideoGroup(selectedValue) || 'mp4';

  return `
    <select id="quality-select" class="quality-select quality-select--mp4" aria-label="Quality selector" data-quality-select>
      <optgroup label="MP4">${buildVideoOptions('mp4')}</optgroup>
      <optgroup label="WEBM">${buildVideoOptions('webm')}</optgroup>
      <optgroup label="MKV">${buildVideoOptions('mkv')}</optgroup>
    </select>
    <div class="video-group-dropdown" data-video-group-dropdown data-open-groups="${selectedGroup}">
    </div>
  `;
}

function renderAudioQualityDropdown(selectedAudioFormat: AudioFormatType, selectedBitrate: string): string {
  const selectedValue = toAudioSelectValue(selectedAudioFormat, selectedBitrate);

  return `
    <div class="quality-dropdown-wrapper">
      <select id="quality-select" class="quality-select" aria-label="Quality selector" data-quality-select>
        ${AUDIO_OPTIONS.map(option => {
    const isSelected = option.value === selectedValue;
    return `<option value="${option.value}"${isSelected ? ' selected' : ''}>${option.label}</option>`;
  }).join('')}
      </select>
    </div>
  `;
}

export function initFormatSelector(containerSelector: string = '#previewCard'): void {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.warn('Format selector container not found:', containerSelector);
    return;
  }

  initGroupedVideoDropdown(container);

  container.addEventListener('click', handleFormatSelectorClick);
  container.addEventListener('change', handleQualityChange);
  initCustomTooltips(container);

  if (!globalDropdownListenersBound) {
    document.addEventListener('click', (event) => {
      const path = event.composedPath ? event.composedPath() : [];
      const isInside = path.some((node) => {
        const el = node as HTMLElement;
        return !!el?.closest?.('[data-video-group-dropdown]');
      });
      if (!isInside) {
        closeAllGroupedVideoMenus();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeAllGroupedVideoMenus();
      }
    });
    globalDropdownListenersBound = true;
  }
}

function handleFormatSelectorClick(event: Event): void {
  const target = event.target as HTMLElement;

  const formatBtn = target.closest('.format-btn') as HTMLElement | null;
  if (formatBtn) {
    const format = formatBtn.dataset.format as FormatType;
    if (format) {
      logEvent('format_change', { format });
      handleFormatChange(format);
      const container = formatBtn.closest('#format-selector-container');
      if (container) {
        initGroupedVideoDropdown(container);
      }
    }
    return;
  }

  const trigger = target.closest('[data-video-group-trigger]') as HTMLElement | null;
  if (trigger) {
    event.stopPropagation();
    const dropdown = trigger.closest('[data-video-group-dropdown]') as HTMLElement | null;
    if (!dropdown) return;
    toggleGroupedVideoMenu(dropdown);
    return;
  }

  const groupToggle = target.closest('[data-group-toggle]') as HTMLElement | null;
  if (groupToggle) {
    event.stopPropagation();
    const dropdown = groupToggle.closest('[data-video-group-dropdown]') as HTMLElement | null;
    if (!dropdown) return;
    const group = (groupToggle.dataset.groupToggle || '').toLowerCase() as VideoGroup;
    if (group === 'mp4' || group === 'webm' || group === 'mkv') {
      toggleVideoGroupSection(dropdown, group);
    }
    return;
  }

  const groupItem = target.closest('[data-group-item]') as HTMLElement | null;
  if (groupItem) {
    event.stopPropagation();
    const dropdown = groupItem.closest('[data-video-group-dropdown]') as HTMLElement | null;
    if (!dropdown) return;
    const value = groupItem.dataset.groupItem || '';
    if (value) {
      selectVideoGroupItem(dropdown, value);
    }
  }
}

function handleQualityChange(event: Event): void {
  const target = event.target as HTMLSelectElement;
  if (!target.matches('[data-quality-select]')) {
    return;
  }

  const value = target.value;
  const state = getState();

  if (state.selectedFormat === 'mp4') {
    logEvent('quality_change', { quality: value });
    setVideoQuality(parseVideoSelectValue(value));
    syncGroupedVideoDropdown(target);
    return;
  }

  logEvent('quality_change', { quality: value });
  if (value.startsWith('mp3-')) {
    const bitrate = value.split('-')[1] || '128';
    setAudioFormat('mp3');
    setAudioBitrate(bitrate);
    return;
  }

  setAudioFormat(value as AudioFormatType);
  setAudioBitrate('128');
}

function handleFormatChange(format: FormatType): void {
  setSelectedFormat(format);
  document.documentElement.dataset.format = format;
}

function initCustomTooltips(container: Element): void {
  const tooltipElements = container.querySelectorAll('[data-tooltip]');

  tooltipElements.forEach((element) => {
    let tooltipTimer: number | null = null;
    const tooltipText = element.getAttribute('data-tooltip');
    const tooltipElement = element.querySelector('.custom-tooltip');

    if (tooltipElement && tooltipText) {
      tooltipElement.textContent = tooltipText;
    }

    element.addEventListener('mouseenter', () => {
      tooltipTimer = window.setTimeout(() => {
        element.classList.add('show-tooltip');
      }, 500);
    });

    element.addEventListener('mouseleave', () => {
      if (tooltipTimer) {
        clearTimeout(tooltipTimer);
        tooltipTimer = null;
      }
      element.classList.remove('show-tooltip');
    });
  });
}

export function cleanupFormatSelector(): void {
  // Event delegation is used; no cleanup required here.
}
