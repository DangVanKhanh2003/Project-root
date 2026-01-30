/**
 * Format Selector Component
 * MP3/MP4 toggle + unified quality dropdown + audio track dropdown
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
import { initAudioDropdown } from '../../features/downloader/ui-render/audio-dropdown';

// ==========================================
// Helpers
// ==========================================

function updateFormatButtonState(container: HTMLElement, selectedFormat: FormatType): void {
  const formatButtons = container.querySelectorAll('.format-btn');
  formatButtons.forEach((btn) => {
    const format = (btn as HTMLElement).dataset.format;
    if (format === selectedFormat) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function setHiddenUnifiedValue(container: Element, value: string): void {
  const hiddenInput = container.querySelector('#unified-format-select') as HTMLInputElement | null;
  if (hiddenInput) {
    hiddenInput.value = value;
  }
}

function applySelectionToDropdown(container: Element, value: string): void {
  const selectedText = container.querySelector('.dropdown-selected-text') as HTMLElement | null;
  const options = container.querySelectorAll('.quality-dropdown-wrapper .dropdown-option');
  let label = '';

  options.forEach(opt => {
    const optEl = opt as HTMLElement;
    const isSelected = optEl.dataset.value === value;
    optEl.classList.toggle('selected', isSelected);
    if (isSelected) {
      label = optEl.textContent?.trim() || '';
    }
  });

  if (selectedText && label) {
    selectedText.textContent = label;
  }

  setHiddenUnifiedValue(container, value);
}

function getValueFromState(state: ReturnType<typeof getState>): string {
  if (state.selectedFormat === 'mp4') {
    const vq = state.videoQuality || '720p';
    if (vq === 'webm' || vq === 'mkv') {
      return `video|${vq}`;
    }
    return `video|mp4-${vq.replace('p', '')}`;
  }

  const af = state.audioFormat || 'mp3';
  if (af === 'mp3') {
    return `audio|mp3-${state.audioBitrate || '128'}`;
  }
  return `audio|${af}`;
}

function applyStateToDropdown(container: Element): void {
  const value = getValueFromState(getState());
  applySelectionToDropdown(container, value);
}

// ==========================================
// Dropdown control
// ==========================================

let isDropdownOpen = false;
let clickOutsideHandler: ((e: MouseEvent) => void) | null = null;

function openDropdown(wrapper: Element): void {
  if (isDropdownOpen) return;
  isDropdownOpen = true;
  wrapper.classList.add('open');

  const trigger = wrapper.querySelector('.custom-dropdown-trigger');
  if (trigger) {
    trigger.setAttribute('aria-expanded', 'true');
  }

  // Support legacy HTML that uses .custom-dropdown-menu + hidden attribute.
  const menu = wrapper.querySelector('.dropdown-menu, .custom-dropdown-menu') as HTMLElement | null;
  if (menu) {
    menu.classList.add('dropdown-menu');
    menu.removeAttribute('hidden');
    menu.classList.remove('hidden');
    menu.style.display = '';
  }

  clickOutsideHandler = (e: MouseEvent) => {
    if (!wrapper.contains(e.target as Node)) {
      closeDropdown(wrapper);
    }
  };

  setTimeout(() => {
    document.addEventListener('click', clickOutsideHandler!);
  }, 0);
}

function closeDropdown(wrapper: Element): void {
  if (!isDropdownOpen) return;
  isDropdownOpen = false;
  wrapper.classList.remove('open');

  const trigger = wrapper.querySelector('.custom-dropdown-trigger');
  if (trigger) {
    trigger.setAttribute('aria-expanded', 'false');
  }

  const menu = wrapper.querySelector('.dropdown-menu, .custom-dropdown-menu') as HTMLElement | null;
  if (menu) {
    menu.setAttribute('hidden', '');
    menu.classList.add('hidden');
    menu.style.display = '';
  }

  if (clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler);
    clickOutsideHandler = null;
  }
}

function toggleDropdown(wrapper: Element): void {
  if (isDropdownOpen) {
    closeDropdown(wrapper);
  } else {
    openDropdown(wrapper);
  }
}

// ==========================================
// Event handlers
// ==========================================

function handleUnifiedValueSelection(value: string, container: HTMLElement): void {
  if (value.startsWith('video|')) {
    const rest = value.replace('video|', '');
    setSelectedFormat('mp4');
    document.documentElement.dataset.format = 'mp4';
    updateFormatButtonState(container, 'mp4');

    if (rest === 'webm' || rest === 'mkv') {
      setVideoQuality(rest);
    } else {
      const q = rest.replace('mp4-', '');
      setVideoQuality(`${q}p`);
    }
    return;
  }

  const rest = value.replace('audio|', '');
  setSelectedFormat('mp3');
  document.documentElement.dataset.format = 'mp3';
  updateFormatButtonState(container, 'mp3');

  if (rest.startsWith('mp3-')) {
    const bitrate = rest.replace('mp3-', '');
    setAudioFormat('mp3');
    setAudioBitrate(bitrate);
  } else {
    setAudioFormat(rest as AudioFormatType);
    setAudioBitrate('');
  }
}

function handleFormatChange(format: FormatType, container: HTMLElement): void {
  setSelectedFormat(format);
  document.documentElement.dataset.format = format;
  updateFormatButtonState(container, format);
  applyStateToDropdown(container);
}

function handleDropdownClick(event: Event): void {
  const target = event.target as HTMLElement;
  const container = target.closest('#format-selector-container') as HTMLElement | null;
  if (!container) return;

  const formatBtn = target.closest('.format-btn') as HTMLElement | null;
  if (formatBtn) {
    const format = formatBtn.dataset.format as FormatType;
    if (format) {
      handleFormatChange(format, container);
    }
    return;
  }

  const trigger = target.closest('.custom-dropdown-trigger') as HTMLElement | null;
  if (trigger) {
    event.preventDefault();
    const wrapper = trigger.closest('.quality-dropdown-wrapper') as HTMLElement | null;
    if (!wrapper) return;
    toggleDropdown(wrapper);
    return;
  }

  const option = target.closest('.quality-dropdown-wrapper .dropdown-option') as HTMLElement | null;
  if (option && option.dataset.value) {
    applySelectionToDropdown(container, option.dataset.value);
    handleUnifiedValueSelection(option.dataset.value, container);

    const wrapper = option.closest('.quality-dropdown-wrapper');
    if (wrapper) {
      closeDropdown(wrapper);
    }
  }
}

function handleDropdownKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return;
  const target = event.target as HTMLElement;
  const wrapper = target.closest('.quality-dropdown-wrapper');
  if (wrapper) {
    closeDropdown(wrapper);
  }
}

// ==========================================
// Public API
// ==========================================

export function initFormatSelector(containerSelector: string = '#format-selector-container'): void {
  const container = document.querySelector(containerSelector) as HTMLElement | null;
  if (!container) {
    console.warn('Format selector container not found:', containerSelector);
    return;
  }

  const state = getState();
  document.documentElement.dataset.format = state.selectedFormat;
  updateFormatButtonState(container, state.selectedFormat);
  applyStateToDropdown(container);

  container.addEventListener('click', handleDropdownClick);
  container.addEventListener('keydown', handleDropdownKeydown);

  initCustomTooltips(container);
  initAudioDropdown();
}

export function cleanupFormatSelector(): void {
  if (clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler);
    clickOutsideHandler = null;
  }
  isDropdownOpen = false;
}

/**
 * Initialize custom tooltips with 0.5s delay
 */
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
