/**
 * Input Form Controller - TypeScript (Simplified for Phase 4B)
 * Handles form submission and basic input logic
 */

import { api, coreServices } from '../../../api';
import { submitForm } from '../../../utils/dom-utils';
import { logEvent } from '../../../libs/firebase';
import { scrollManager, confirmRedirectPopup } from '@downloader/ui-shared';
import {
  getState,
  setState,
  setLoading,
  setError,
  clearError,
  setInputType,
  updateButtonVisibility,
  setResults,
  setSuggestions,
  hideSuggestions,
  clearSuggestions,
  setQuery,
  setOriginalQuery,
  setHighlightedIndex,
  getDisplaySuggestions,
  setSubmitting,
  setIsFromListItemClick,
  setVideoDetail,
  setGalleryDetail,
  setSearchPagination,
  setYouTubePreview,
  updateYouTubePreviewMetadata,
  setVideoQuality,
  setAudioBitrate,
} from '../state';
import { renderResults, renderMessage, renderPreviewCard, showLoading, clearContent, clearHeroMessage } from '../ui-render/content-renderer';
import { updateVideoTitle } from '../ui-render/download-rendering';
import { onAfterSubmit, onDownloadFailed } from '../../widget-level-manager';
import { getInputValue as getInputValueFromRenderer, setInputValue as setInputValueInRenderer } from '../ui-render/ui-renderer';
import type { VideoData } from '@downloader/ui-components';
import { navigateToVideo } from '../routing/url-manager';
import { setVideoPageSEO } from '../routing/seo-manager';
import { showResultView } from '../ui-render/view-switcher';
import { MaterialPopup } from '../../../ui-components/material-popup/material-popup';
import { getUrlRedirectTarget, looksLikeUrl } from '@downloader/core';
import { evaluateFeatureAccess } from '../../allowed-features';
import { show as showPaywall } from 'https://media.ytmp3.gg/poppurchase.v3.js?v=15';
import { checkLimit } from '../../download-limit';
import { FEATURE_KEYS, FEATURE_ACCESS_REASONS } from '@downloader/core';
import { hideHeroFeatureLinks } from '../../hero-feature-links';
import { startConversion } from './conversion';
import { preloadTrustpilotWidget } from '../../trustpilot/trustpilot-widget';


/**
 * Generate fake YouTube data for instant UI
 * Returns pre-defined quality options before API call
 */
function generateFakeYouTubeData(videoId: string, url: string): any {
  return {
    meta: {
      vid: videoId,
      title: `Loading video information...`,
      author: 'Please wait...',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/0.jpg`,
      duration: '--:--',
      source: 'YouTube',
      originalUrl: url,
      isFakeData: true
    },
    formats: {
      video: [
        {
          quality: '2160p',
          format: 'mp4',
          vid: videoId,
          type: 'VIDEO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'video',
            videoQuality: '2160',
            youtubeVideoContainer: 'mp4'
          }
        },
        {
          quality: '1080p',
          format: 'mp4',
          vid: videoId,
          type: 'VIDEO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'video',
            videoQuality: '1080',
            youtubeVideoContainer: 'mp4'
          }
        },
        {
          quality: '1440p',
          format: 'mp4',
          vid: videoId,
          type: 'VIDEO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'video',
            videoQuality: '1440',
            youtubeVideoContainer: 'mp4'
          }
        },
        {
          quality: '480p',
          format: 'mp4',
          vid: videoId,
          type: 'VIDEO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'video',
            videoQuality: '480',
            youtubeVideoContainer: 'mp4'
          }
        },
        {
          quality: '360p',
          format: 'mp4',
          vid: videoId,
          type: 'VIDEO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'video',
            videoQuality: '360',
            youtubeVideoContainer: 'mp4'
          }
        },
        {
          quality: '720p',
          format: 'mp4',
          vid: videoId,
          type: 'VIDEO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'video',
            videoQuality: '720',
            youtubeVideoContainer: 'mp4'
          }
        },
        {
          quality: '144p',
          format: 'mp4',
          vid: videoId,
          type: 'VIDEO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'video',
            videoQuality: '144',
            youtubeVideoContainer: 'mp4'
          }
        },
      ],
      audio: [
        {
          quality: '320kbps',
          format: 'mp3',
          vid: videoId,
          type: 'AUDIO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'audio',
            audioBitrate: '320',
            audioFormat: 'mp3'
          }
        },
        {
          quality: '192kbps',
          format: 'mp3',
          vid: videoId,
          type: 'AUDIO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'audio',
            audioBitrate: '192',
            audioFormat: 'mp3'
          }
        },
        {
          quality: '128kbps',
          format: 'mp3',
          vid: videoId,
          type: 'AUDIO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'audio',
            audioBitrate: '128',
            audioFormat: 'mp3'
          }
        },
        {
          quality: '64kbps',
          format: 'mp3',
          vid: videoId,
          type: 'AUDIO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'audio',
            audioBitrate: '64',
            audioFormat: 'mp3'
          }
        },
        {
          quality: 'OGG',
          format: 'ogg',
          vid: videoId,
          type: 'AUDIO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'audio',
            audioFormat: 'ogg'
          }
        },
        {
          quality: 'WAV',
          format: 'wav',
          vid: videoId,
          type: 'AUDIO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'audio',
            audioFormat: 'wav'
          }
        },
        {
          quality: 'Opus',
          format: 'opus',
          vid: videoId,
          type: 'AUDIO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'audio',
            audioFormat: 'opus'
          }
        },
      ]
    }
  };
}

/**
 * Handle auto-download after preview is shown
 * Builds formatData from FormatSelector state and triggers conversion
 */
interface AutoDownloadOptions {
  trimStart?: number;
  trimEnd?: number;
  trimRangeLabel?: string;
}

export async function handleAutoDownload(
  url: string,
  videoId: string,
  options: AutoDownloadOptions = {}
): Promise<void> {
  try {
    console.log('[Auto-Download] Starting auto-download for:', videoId);

    // Get current format/quality selection from state
    const state = getState();

    const selectedFormat = state.selectedFormat; // 'mp4' or 'mp3'
    const videoQuality = state.videoQuality; // e.g., '720p'
    const audioFormat = state.audioFormat; // e.g., 'mp3'
    const audioBitrate = state.audioBitrate; // e.g., '128'
    const streamAudioTrackInput = document.getElementById('stream-selected-audio-track') as HTMLInputElement | null;
    const audioTrackInput = document.getElementById('audio-track-value') as HTMLInputElement | null;
    const rawTrackId = streamAudioTrackInput?.value?.trim() || audioTrackInput?.value?.trim();
    const trackId = rawTrackId && rawTrackId !== 'original' ? rawTrackId : undefined;

    console.log('[Auto-Download] Selected format:', selectedFormat);
    console.log('[Auto-Download] Video quality:', videoQuality);
    console.log('[Auto-Download] Audio format:', audioFormat, 'Bitrate:', audioBitrate);

    // Build formatData with extractV2Options based on user selection
    let formatData: any;
    let formatId: string;

    if (selectedFormat === 'mp4') {
      const normalizedVideoQuality = (videoQuality || '720p').toLowerCase();
      const groupedMatch = normalizedVideoQuality.match(/^(webm|mkv)-(\d+)p$/);
      const targetContainer = groupedMatch ? groupedMatch[1] : 'mp4';
      const resolvedQuality = groupedMatch ? `${groupedMatch[2]}p` : normalizedVideoQuality;
      const qualityNumber = resolvedQuality.replace('p', '');
      const finalQuality = resolvedQuality === '144p' ? '144p' : qualityNumber;
      const videoAudioBitrate = '128';

      formatData = {
        id: `video|${targetContainer}-${resolvedQuality}`,
        vid: videoId,
        category: 'video',
        type: 'VIDEO',
        format: targetContainer,
        quality: resolvedQuality,
        sizeText: 'Processing...',
        isFakeData: true,
        extractV2Options: {
          downloadMode: 'video',
          videoQuality: finalQuality,
          youtubeVideoContainer: targetContainer,
          audioBitrate: videoAudioBitrate,
          trackId,
          ...(Number.isFinite(options.trimStart) ? { trimStart: options.trimStart } : {}),
          ...(Number.isFinite(options.trimEnd) ? { trimEnd: options.trimEnd } : {})
        }
      };
      formatId = `video|${targetContainer}-${resolvedQuality}`;

    } else {
      if (audioFormat === 'mp3') {
        const finalBitrate = audioBitrate || '128';

        formatData = {
          id: `audio|mp3-${finalBitrate}kbps`,
          vid: videoId,
          category: 'audio',
          type: 'AUDIO',
          format: 'mp3',
          quality: `${finalBitrate}kbps`,
          sizeText: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'audio',
            audioBitrate: finalBitrate,
            audioFormat: 'mp3',
            trackId,
            ...(Number.isFinite(options.trimStart) ? { trimStart: options.trimStart } : {}),
            ...(Number.isFinite(options.trimEnd) ? { trimEnd: options.trimEnd } : {})
          }
        };
      } else {
        formatData = {
          id: `audio|${audioFormat}`,
          vid: videoId,
          category: 'audio',
          type: 'AUDIO',
          format: audioFormat,
          quality: `${audioFormat.toUpperCase()} - 128kbps`,
          sizeText: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'audio',
            audioFormat: audioFormat,
            audioBitrate: '128',
            trackId,
            ...(Number.isFinite(options.trimStart) ? { trimStart: options.trimStart } : {}),
            ...(Number.isFinite(options.trimEnd) ? { trimEnd: options.trimEnd } : {})
          }
        };
      }

      formatId = formatData.id;
    }

    console.log('[Auto-Download] Built formatData:', formatData);

    if (state.youtubePreview) {
      setYouTubePreview({
        ...state.youtubePreview,
        trimRangeLabel: options.trimRangeLabel
      });
      renderPreviewCard(null);
    }

    // Get video title for conversion
    const videoTitle = state.youtubePreview?.title || 'Loading video information...';

    // Trigger conversion with built formatData
    console.log('[Auto-Download] Triggering conversion...');
    await startConversion({
      formatId,
      videoUrl: url,
      videoTitle,
      onExtracted: (info) => {
        const currentState = getState();
        const currentPreview = currentState.youtubePreview;

        if (!currentPreview) {
          setYouTubePreview({
            videoId: '',
            title: info.title?.trim() || url,
            author: '',
            thumbnail: info.thumbnail?.trim() || '',
            url,
            isLoading: false,
          });
          renderPreviewCard(null);
          return;
        }

        const nextTitle = info.title?.trim() || currentPreview.title;
        const nextThumbnail = info.thumbnail?.trim() || currentPreview.thumbnail;

        const shouldUpdate =
          nextTitle !== currentPreview.title ||
          nextThumbnail !== currentPreview.thumbnail ||
          currentPreview.isLoading;

        if (!shouldUpdate) return;

        setYouTubePreview({
          ...currentPreview,
          title: nextTitle,
          thumbnail: nextThumbnail,
          isLoading: false,
        });
        renderPreviewCard(null);
      },
      extractV2Options: formatData.extractV2Options || {}
    });

    console.log('[Auto-Download] Conversion triggered successfully');

  } catch (error) {
    console.error('[Auto-Download] Error:', error);
  }
}

// ============================================
// DOM Elements
// ============================================
let form: HTMLFormElement | null = null;
let input: HTMLInputElement | null = null;
let pasteBtn: HTMLButtonElement | null = null;
let clearBtn: HTMLButtonElement | null = null;

// User interaction detection for auto focus
let userHasInteracted = false;
const USER_INTERACTION_EVENTS = ['mousedown', 'keydown', 'touchstart'];

// Mobile click-to-scroll throttling
let lastClickTime = 0;
const CLICK_THROTTLE_MS = 300;

/**
 * Handle mobile input click to trigger scroll behavior
 * Matches old project behavior: scroll to input when clicked on mobile
 */
function handleInputClick(event: MouseEvent): void {
  // Only apply on mobile viewports
  // Disabled: No scroll on input click
  // User experience improvement - avoid unexpected scroll behavior
  return;
}


/**
 * Initialize input form
 */
export function initInputForm(): boolean {
  // Get DOM elements
  form = document.getElementById('downloadForm') as HTMLFormElement;
  input = document.getElementById('videoUrl') as HTMLInputElement;
  pasteBtn = document.getElementById('input-action-button') as HTMLButtonElement;
  clearBtn = null; // Not present in current HTML

  if (!form || !input) {
    return false;
  }

  // Preload Trustpilot resources on first submit only
  let trustpilotPreloaded = false;
  const preloadTrustpilotOnce = (event: Event) => {
    if (event && (event as any).isTrusted === false) return;
    if (trustpilotPreloaded) return;
    trustpilotPreloaded = true;
    preloadTrustpilotWidget();
  };

  // Attach event listeners
  form.addEventListener('submit', handleSubmit);
  form.addEventListener('submit', preloadTrustpilotOnce, { capture: true });

  // Enable submit button now that preventDefault handler is attached
  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  if (submitBtn) submitBtn.disabled = false;
  input.addEventListener('input', handleInput);
  input.addEventListener('keydown', handleKeyDown); // Keyboard navigation
  input.addEventListener('click', handleInputClick); // Mobile click-to-scroll

  // Action button handles both Paste and Clear based on data-action attribute
  if (pasteBtn) {
    pasteBtn.addEventListener('click', handleActionButton);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', handleClear);
  }

  // Suggestion click handling (event delegation)
  document.addEventListener('click', handleDocumentClick);

  // Setup user interaction detection before auto focus
  setupUserInteractionDetection();

  // Enhanced auto-focus on desktop with accessibility safeguards
  enhancedAutoFocus();

  return true;
}

// Throttle timer and state for suggestion API calls
let suggestionTimer: number | null = null;
let lastSuggestionCallTime = 0;
const SUGGESTION_THROTTLE_MS = 300;

/**
 * Throttled fetch suggestions - calls immediately on first input,
 * then at most once every 300ms while typing continues
 */
function throttledFetchSuggestions(query: string): void {
  const now = Date.now();
  const timeSinceLastCall = now - lastSuggestionCallTime;

  if (timeSinceLastCall >= SUGGESTION_THROTTLE_MS) {
    // Enough time passed → call immediately
    lastSuggestionCallTime = now;
    fetchSuggestions(query);
  } else {
    // Not enough time → schedule call for remaining time
    if (suggestionTimer) {
      clearTimeout(suggestionTimer);
    }

    const remainingTime = SUGGESTION_THROTTLE_MS - timeSinceLastCall;
    suggestionTimer = window.setTimeout(() => {
      lastSuggestionCallTime = Date.now();
      fetchSuggestions(query);
    }, remainingTime);
  }
}

/**
 * Handle input changes
 */
function handleInput(event: Event): void {
  if (!input) return;

  const value = input.value.trim();


  // Clear error when user types
  clearError();
  clearHeroMessage();

  // Update current query state
  setQuery(value);

  // Update button visibility
  const hasContent = value.length > 0;
  updateButtonVisibility(hasContent);

  // Detect input type (handles URLs with or without protocol prefix)
  const isUrl = looksLikeUrl(value);
  setInputType(isUrl ? 'url' : 'keyword');

  // Clear suggestions completely when typing URL
  if (isUrl) {
    // Cancel any pending suggestion fetches
    if (suggestionTimer) {
      clearTimeout(suggestionTimer);
      suggestionTimer = null;
    }
    lastSuggestionCallTime = 0; // Reset throttle state

    // Clear suggestions completely (not just hide)
    clearSuggestions();
    return;
  }

  // Handle suggestions for keyword input
  if (value.length >= 1) {
    // Set original query when starting to fetch suggestions
    setOriginalQuery(value);

    // Throttle: call immediately on first input, then every 300ms
    throttledFetchSuggestions(value);
  } else {
    // Clear suggestions when input is empty
    clearSuggestions();
  }
}

/**
 * Fetch suggestions from API
 */
async function fetchSuggestions(query: string): Promise<void> {
  // Check if form is being submitted or loading before making API call
  const stateBefore = getState();
  if (stateBefore.isSubmitting || stateBefore.isLoading) {
    return;
  }

  try {
    const result = await api.getSuggestions({ q: query });

    // Check again after API call completes (might have submitted during fetch)
    const stateAfter = getState();
    if (stateAfter.isSubmitting || stateAfter.isLoading) {
      return;
    }

    if (result.ok && result.data) {
      // API might return object instead of array - convert to array
      let suggestions: string[];

      if (Array.isArray(result.data)) {
        // Already an array
        suggestions = result.data;
      } else if (typeof result.data === 'object' && result.data !== null) {
        // Convert object to array (e.g., {0: 'a', 1: 'b'} → ['a', 'b'])
        suggestions = Object.values(result.data);
      } else {
        suggestions = [];
      }


      if (Array.isArray(suggestions) && suggestions.length > 0) {
        setSuggestions(suggestions);
      } else {
        hideSuggestions();
      }
    } else {
      hideSuggestions();
    }
  } catch (error) {
    // Silently fail - don't disrupt user experience
  }
}

/**
 * Handle keyboard navigation for suggestions
 */
function handleKeyDown(event: KeyboardEvent): void {
  const state = getState();

  // Only handle navigation when suggestions are visible
  if (!state.showSuggestions || state.suggestions.length === 0) {
    return; // Let default behavior proceed
  }

  const displaySuggestions = getDisplaySuggestions(state);


  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      navigateDown(state, displaySuggestions);
      break;

    case 'ArrowUp':
      event.preventDefault();
      navigateUp(state, displaySuggestions);
      break;

    case 'Enter':
      event.preventDefault();
      setSubmitting(true); // Prevent suggestions from reappearing
      selectCurrentSuggestion(state);
      break;

    case 'Escape':
      event.preventDefault();
      returnToOriginal(state);
      break;

    default:
      // Allow other keys to proceed normally
      break;
  }
}

/**
 * Navigate down in suggestion list (with circular wrap)
 */
function navigateDown(state: ReturnType<typeof getState>, displaySuggestions: string[]): void {
  let newIndex: number;

  if (state.highlightedIndex === displaySuggestions.length - 1) {
    // Wrap: cuối → đầu
    newIndex = 0;
  } else if (state.highlightedIndex === -1) {
    // No selection → select first
    newIndex = 0;
  } else {
    newIndex = state.highlightedIndex + 1;
  }


  setHighlightedIndex(newIndex);
  setQuery(displaySuggestions[newIndex]);
  setInputValueInRenderer(displaySuggestions[newIndex]);
}

/**
 * Navigate up in suggestion list (with circular wrap)
 */
function navigateUp(state: ReturnType<typeof getState>, displaySuggestions: string[]): void {
  let newIndex: number;

  if (state.highlightedIndex <= 0) {
    // Wrap: đầu → cuối
    newIndex = displaySuggestions.length - 1;
  } else {
    newIndex = state.highlightedIndex - 1;
  }


  setHighlightedIndex(newIndex);
  setQuery(displaySuggestions[newIndex]);
  setInputValueInRenderer(displaySuggestions[newIndex]);
}

/**
 * Select current highlighted suggestion and submit
 */
function selectCurrentSuggestion(state: ReturnType<typeof getState>): void {

  // Cancel any pending suggestion fetches
  if (suggestionTimer) {
    clearTimeout(suggestionTimer);
    suggestionTimer = null;
  }
  lastSuggestionCallTime = 0; // Reset throttle state

  hideSuggestions();
  setHighlightedIndex(-1);

  // Trigger form submission
  if (form) {
    submitForm(form);
  }
}

/**
 * Return to original query and clear highlights
 */
function returnToOriginal(state: ReturnType<typeof getState>): void {

  // Cancel any pending suggestion fetches
  if (suggestionTimer) {
    clearTimeout(suggestionTimer);
    suggestionTimer = null;
  }
  lastSuggestionCallTime = 0; // Reset throttle state

  setQuery(state.originalQuery);
  setInputValueInRenderer(state.originalQuery);
  setHighlightedIndex(-1);
  hideSuggestions();
}

/**
 * Handle suggestion click events
 */
function handleSuggestionClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const suggestionItem = target.closest('.suggestion-item') as HTMLElement;

  if (!suggestionItem) return;

  const suggestionText = suggestionItem.dataset.suggestionText;
  const suggestionIndex = parseInt(suggestionItem.dataset.suggestionIndex || '-1', 10);


  if (suggestionText) {
    logEvent('suggestion_click', {
      suggestion_text: suggestionText,
      suggestion_index: suggestionIndex
    });

    // Set submitting flag to prevent suggestion interference
    setSubmitting(true);

    // Cancel any pending suggestion fetches
    if (suggestionTimer) {
      clearTimeout(suggestionTimer);
      suggestionTimer = null;
    }
    lastSuggestionCallTime = 0; // Reset throttle state

    // Update input value + submit immediately
    setQuery(suggestionText);
    setInputValueInRenderer(suggestionText);
    setHighlightedIndex(suggestionIndex);
    hideSuggestions();

    // Auto-submit after slight delay
    setTimeout(() => {
      if (form) {
        submitForm(form);
      }
    }, 50);
  }
}

/**
 * Handle document click for click-outside-to-hide
 */
function handleDocumentClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const suggestionContainer = document.getElementById('suggestion-container');

  // Check if click is inside suggestion container → handle click
  if (suggestionContainer?.contains(target)) {
    handleSuggestionClick(event);
    return;
  }

  // Check if click is on input → do nothing
  if (target === input) {
    return;
  }

  // Click outside → hide suggestions
  hideSuggestions();
  setHighlightedIndex(-1);
}

/**
 * Handle form submission
 */
async function handleSubmit(event: Event): Promise<void> {
  event.preventDefault();

  // 🚨 CRITICAL: Set submitting flag IMMEDIATELY to prevent suggestion interference
  setSubmitting(true);

  if (!input) {
    setSubmitting(false);
    return;
  }

  const value = input.value.trim();

  if (!value) {
    setError('Please enter a URL or keyword');
    setSubmitting(false); // Reset flag on early return
    return;
  }

  // Log form submission
  logEvent('form_submit', {
    input_type: getState().inputType,
    query_length: value.length
  });


  // Blur input to hide keyboard on mobile
  if (input) {
    input.blur();
  }

  // Cancel any pending suggestion fetches
  if (suggestionTimer) {
    clearTimeout(suggestionTimer);
    suggestionTimer = null;
  }
  lastSuggestionCallTime = 0; // Reset throttle state

  // Clear remaining UI state
  setResults([]);              // Clear search results
  clearError();                // Clear error messages
  clearHeroMessage();          // Hide inline messages
  clearSuggestions();          // Clear suggestions completely (array + state + flags)
  setLoading(true);

  // Re-detect input type from actual value (don't rely on state which may be stale)
  const isUrl = looksLikeUrl(value);
  setInputType(isUrl ? 'url' : 'keyword');

  try {
    if (isUrl) {
      // Check feature access before download (only for URL, not keyword search)
      const access = evaluateFeatureAccess('download_single');
      if (!access.allowed) {
        setLoading(false);
        if (access.reason === FEATURE_ACCESS_REASONS.GEO_RESTRICTED) {
          showPaywall();
        } else {
          showPaywall();
        }
        setSubmitting(false);
        return;
      }

      const redirectTarget = getUrlRedirectTarget(value);
      if (redirectTarget) {
        setLoading(false);
        const go = await confirmRedirectPopup({ popup: MaterialPopup, target: redirectTarget });
        if (go) {
          window.location.href = redirectTarget === 'channel'
            ? '/download-youtube-channel'
            : redirectTarget === 'playlist'
              ? '/download-youtube-playlist'
              : '/multi-youtube-downloader';
          return;
        }
        setLoading(true);
      }

      hideHeroFeatureLinks();
      onAfterSubmit();
      await handleExtractMedia(value);
    } else {
      // Show list skeleton (12 cards) for keyword search
      showLoading('list');

      // Scroll to content area after skeleton renders (50ms delay)
      setTimeout(() => {
        // Only scroll on mobile for keyword searches
        if (scrollManager.isMobile()) {
          scrollManager.scrollToElement('.hero-card');
        }
      }, 50);

      await handleSearch(value);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    setError(message);
    renderMessage(message, 'error');
    onDownloadFailed();
  } finally {
    setLoading(false);
    // 🚨 CRITICAL: Reset submitting flag to allow suggestions again
    setSubmitting(false);
  }
}

/**
 * Extract YouTube video ID from a URL.
 * Returns null if the URL is not a YouTube URL.
 */
function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      return parsed.pathname.slice(1).split('/')[0] || null;
    }
    if (host === 'youtube.com' || host === 'music.youtube.com') {
      const v = parsed.searchParams.get('v');
      if (v) return v;
      // /shorts/ID, /embed/ID, /live/ID
      const m = parsed.pathname.match(/\/(?:shorts|embed|live)\/([^/?&]+)/);
      if (m) return m[1];
    }
    return null;
  } catch {
    return null;
  }
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

/**
 * Handle media extraction (URL input)
 * Supports any URL (not just YouTube). YouTube URLs get preview thumbnail + metadata.
 */
interface ExtractMediaOptions {
  autoDownload?: boolean;
  skipResultView?: boolean;
}

export async function handleExtractMedia(
  url: string,
  options: ExtractMediaOptions = {}
): Promise<void> {

  try {
    const { autoDownload = true, skipResultView = false } = options;

    // ── Early Limit Check (Before Skeleton UI) ────────────────────────
    if (autoDownload) {
      const state = getState();
      const selectedResolution = getVideoResolutionLabel(state.videoQuality);
      const is4K = selectedResolution === '2160p';
      const is320kbps = state.selectedFormat === 'mp3' && state.audioFormat === 'mp3' && state.audioBitrate === '320';

      if (is4K) {
        const limitResult = checkLimit(FEATURE_KEYS.HIGH_QUALITY_4K);
        if (!limitResult.allowed) {
          showPaywall('download_4k', {
            secondaryLabel: 'Continue without 4K',
            onSecondaryClick: () => {
              setVideoQuality('720p');
              const badge = document.querySelector('.badge-main-quality');
              if (badge) badge.textContent = '720p';
              const sel = document.getElementById('quality-select-mp4') as HTMLSelectElement | null;
              if (sel) sel.value = 'mp4-720';
              setLoading(true);
              setSubmitting(true);
              handleExtractMedia(url);
            },
          });
          setSubmitting(false);
          setLoading(false);
          return;
        }
      }

      const is2K = selectedResolution === '1440p';
      if (is2K) {
        const limitResult = checkLimit(FEATURE_KEYS.HIGH_QUALITY_2K);
        if (!limitResult.allowed) {
          showPaywall('download_2k', {
            secondaryLabel: 'Continue without 2K',
            onSecondaryClick: () => {
              setVideoQuality('720p');
              const badge = document.querySelector('.badge-main-quality');
              if (badge) badge.textContent = '720p';
              const sel = document.getElementById('quality-select-mp4') as HTMLSelectElement | null;
              if (sel) sel.value = 'mp4-720';
              setLoading(true);
              setSubmitting(true);
              handleExtractMedia(url);
            },
          });
          setSubmitting(false);
          setLoading(false);
          return;
        }
      }

      if (is320kbps) {
        const limitResult = checkLimit(FEATURE_KEYS.HIGH_QUALITY_320K);
        if (!limitResult.allowed) {
          showPaywall('download_320kbps', {
            secondaryLabel: 'Continue without 320kbps',
            onSecondaryClick: () => {
              setAudioBitrate('128');
              const badge = document.querySelector('.badge-main-quality');
              if (badge) badge.textContent = '128kbps';
              const sel = document.getElementById('quality-select-mp3') as HTMLSelectElement | null;
              if (sel) sel.value = 'mp3-128';
              setLoading(true);
              setSubmitting(true);
              handleExtractMedia(url);
            },
          });
          setSubmitting(false);
          setLoading(false);
          return;
        }
      }
    }
    // ───────────────────────────────────────────────────────────────────────

    // ═══════════════════════════════════════════════════════
    // YOUTUBE-SPECIFIC PREVIEW (optional, graceful fallback)
    // ═══════════════════════════════════════════════════════
    const videoId = extractYouTubeVideoId(url);
    const isYouTube = !!videoId;

    // ✅ Push URL to browser history (enables back navigation) — YouTube only
    if (isYouTube && videoId) {
      const state = getState();
      const audioTrackInput = document.getElementById('audio-track-value') as HTMLInputElement | null;
      const audioTrack = audioTrackInput?.value?.trim();
      const urlAudioTrack = (audioTrack && audioTrack !== 'original' && audioTrack !== 'default') ? audioTrack : undefined;

      if (state.selectedFormat === 'mp4') {
        navigateToVideo(videoId, { format: 'mp4', quality: state.videoQuality || undefined, audioTrack: urlAudioTrack });
      } else {
        const audioQuality = state.audioFormat === 'mp3' ? (state.audioBitrate || undefined) : '128';
        navigateToVideo(videoId, { format: state.audioFormat || 'mp3', quality: audioQuality, audioTrack: urlAudioTrack });
      }

      // Clean query params from URL after pushState — reload will go to home, back still works
      const basePath = window.location.pathname.replace(/\/$/, '') || '/';
      history.replaceState({ type: 'home' }, '', basePath);
    }

    // ✅ Update SEO meta tags (noindex for result pages)
    setVideoPageSEO();

    // Thumbnail: YouTube only
    const thumbnail = isYouTube && videoId
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : '';

    // Show preview skeleton
    if (!skipResultView) {
      showLoading('detail');
      showResultView();
      // Scroll after skeleton renders (50ms delay)
      setTimeout(() => {
        if (scrollManager.isDesktop()) {
          scrollManager.scrollToTop();
        } else {
          scrollManager.scrollToElement('.hero-card');
        }
      }, 50);
    }

    // 4. Fetch metadata (YouTube only) or use URL as title for other URLs
    (async () => {
      let metadata: { title?: string; authorName?: string } | null = null;

      if (isYouTube) {
        try {
          console.log('[YouTube Metadata] Fetching metadata for:', url);
          metadata = await coreServices.youtubePublicApi.getMetadata(url);
          console.log('[YouTube Metadata] Response:', metadata);
        } catch (error) {
          console.error('[YouTube Metadata] Error:', error);
        }
      }

      // Delay 1s before update (UX smoothness)
      await new Promise(resolve => setTimeout(resolve, isYouTube ? 1000 : 0));

      // Keep skeleton for non-YouTube in auto-download flow.
      // Preview card will be filled by onExtracted callback after API create-job returns metadata.
      if (!isYouTube && autoDownload) {
        return;
      }

      setYouTubePreview({
        videoId: videoId || '',
        title: metadata?.title || url,
        author: metadata?.authorName || '',
        thumbnail,
        url,
        isLoading: false
      });
      if (!skipResultView) {
        renderPreviewCard(null);
      }
    })();

    // 5. Auto-download in default flow (fire-and-forget)
    if (autoDownload) {
      handleAutoDownload(url, videoId || '', {}).then(() => {
        const currentState = getState();
        if (currentState.isFromListItemClick) {
          setIsFromListItemClick(false);
        }
      }).catch((error) => {
        console.error('[Auto Download] Error:', error);
      });
    }

  } catch (error) {
    throw error;
  }
}

/**
 * Transform SearchV2ItemDto to VideoData format
 * Formats duration, views, and date for display
 */
export function transformSearchItemToVideoData(item: any): VideoData {
  // Format duration (seconds → "MM:SS" or "HH:MM:SS")
  let displayDuration = '';
  if (item.duration !== null && item.duration !== undefined) {
    const totalSeconds = Math.floor(item.duration);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      displayDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      displayDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  // Format views (number → "2.3M views", "1.2K views", etc.)
  let displayViews = '';
  if (item.viewCount !== null && item.viewCount !== undefined) {
    const count = item.viewCount;
    if (count >= 1_000_000) {
      displayViews = `${(count / 1_000_000).toFixed(1)}M views`;
    } else if (count >= 1_000) {
      displayViews = `${(count / 1_000).toFixed(1)}K views`;
    } else {
      displayViews = `${count} views`;
    }
  }

  // Format date (ISO string → "2 weeks ago", "3 months ago", etc.)
  let displayDate = '';
  if (item.uploadDate) {
    try {
      const uploadTime = new Date(item.uploadDate).getTime();
      const now = Date.now();
      const diffMs = now - uploadTime;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      if (diffYears > 0) {
        displayDate = `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
      } else if (diffMonths > 0) {
        displayDate = `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
      } else if (diffWeeks > 0) {
        displayDate = `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
      } else if (diffDays > 0) {
        displayDate = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else {
        displayDate = 'Today';
      }
    } catch (e) {
    }
  }

  // Extract video ID from full URL (if needed)
  let videoId = item.id;
  if (videoId && videoId.includes('youtube.com/watch?v=')) {
    const match = videoId.match(/[?&]v=([^&]+)/);
    if (match) {
      videoId = match[1];
    }
  }

  return {
    id: videoId,
    title: item.title,
    thumbnailUrl: item.thumbnailUrl,
    displayDuration,
    displayViews,
    displayDate,
    metadata: {
      uploaderName: item.uploaderName,
    },
  };
}

/**
 * Handle search (keyword input)
 */
export async function handleSearch(keyword: string): Promise<void> {

  try {
    // Use Search V2 API for better results
    const result = await api.searchV2(keyword, {
      limit: 20
    });


    if (result.ok && result.data) {
      // Success - show search results
      // result.data is SearchV2Dto object with structure: { videos, items, pagination, ... }
      const searchData = result.data as any;
      const rawVideos = searchData.videos || searchData.items || [];


      // Transform SearchV2ItemDto[] to VideoData[] for rendering
      const transformedVideos: VideoData[] = rawVideos.map(transformSearchItemToVideoData);


      // ✅ CRITICAL: Save pagination data for load more functionality
      if (searchData.pagination) {
        setSearchPagination({
          nextPageToken: searchData.pagination.nextPageToken || null,
          hasNextPage: Boolean(searchData.pagination.hasMore || searchData.pagination.hasNextPage),
        });
      } else {
      }

      setResults(transformedVideos as any);

      if (transformedVideos.length > 0) {
        renderResults(transformedVideos);
      } else {
        renderMessage('No videos found', 'info');
      }
    } else {
      // Warning or error
      const errorMsg = result.message || 'No results found';
      setError(errorMsg);
      renderMessage(errorMsg, 'info');
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Handle action button click (Paste or Clear based on data-action)
 * CRITICAL: For iOS Safari compatibility, clipboard.readText() MUST be called
 * directly in this synchronous click handler to preserve "user gesture context"
 */
function handleActionButton(): void {
  if (!pasteBtn || !input) return;

  const action = pasteBtn.dataset.action;

  // Always shift focus back to the text input so keyboard ENTER submits the form
  input.focus();

  if (action === 'clear') {
    logEvent('clear_click');
    handleClear();
    return;
  } else {
    logEvent('paste_click');
    // ✅ Read clipboard IMMEDIATELY in click handler (iOS Safari requirement)
    // Do NOT delegate to async function - it breaks the gesture context
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText()
        .then(text => {
          processPastedText(text);
        })
        .catch(error => {
          handlePasteError(error);
        });
    } else {
      // Fallback for browsers without Clipboard API
      const errorMsg = 'Clipboard API not supported in this browser';
      setError(errorMsg);
      renderMessage(errorMsg, 'error');
    }
  }
}

/**
 * Process pasted text from clipboard
 * Called after clipboard.readText() succeeds in click handler
 */
function processPastedText(text: string): void {
  if (!input) return;

  const trimmedText = text.trim();

  // ❌ Check if clipboard is empty
  if (!text || !trimmedText) {
    const errorMsg = 'Clipboard is empty. Please copy a YouTube URL first.';
    setError(errorMsg);
    renderMessage(errorMsg, 'error');
    return;
  }

  // Set input value
  input.value = trimmedText;

  // Dispatch input event to trigger handleInput (updates button visibility)
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Handle clipboard read errors
 * Provides user-friendly error messages for different error types
 */
function handlePasteError(error: unknown): void {
  let errorMsg = 'Failed to read clipboard';

  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      errorMsg = 'Clipboard permission denied. Please allow clipboard access in your browser settings.';
    } else if (error.name === 'NotFoundError') {
      errorMsg = 'No clipboard data available. Please copy something first.';
    }
  }

  console.error('[Paste Error]:', error);
  setError(errorMsg);
  renderMessage(errorMsg, 'error');
}

/**
 * Handle clear button click
 */
function handleClear(): void {
  if (!input) return;

  input.value = '';
  input.focus();
  input.dispatchEvent(new Event('input', { bubbles: true }));

  // Clear state
  clearError();
  clearHeroMessage();
  setResults([]);
  clearSuggestions();
}

/**
 * Enhanced auto focus function with timing control and accessibility safeguards
 */
function enhancedAutoFocus(): void {
  // Only apply on desktop viewports
  if (window.innerWidth <= 768) {
    return;
  }

  // Respect user accessibility preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return;
  }

  // Skip if user has already interacted with the page
  if (userHasInteracted) {
    return;
  }


  // Apply timing delay to prevent blocking page load
  setTimeout(() => {
    // Double-check interaction status before focusing
    if (!userHasInteracted && input) {
      try {
        input.focus();
      } catch (error) {
      }
    } else {
    }
  }, 150); // 150ms delay to prevent blocking page load
}

/**
 * Sets up user interaction detection to prevent auto focus after user activity
 */
function setupUserInteractionDetection(): void {
  function markUserInteraction(): void {
    userHasInteracted = true;

    // Remove listeners after first interaction for performance
    USER_INTERACTION_EVENTS.forEach(eventType => {
      document.removeEventListener(eventType, markUserInteraction, { capture: true });
    });
  }

  // Listen for user interactions
  USER_INTERACTION_EVENTS.forEach(eventType => {
    document.addEventListener(eventType, markUserInteraction, { capture: true, once: true });
  });

}

/**
 * Get current input value
 */
export function getInputValue(): string {
  return input?.value.trim() || '';
}

/**
 * Set input value
 */
export function setInputValue(value: string): void {
  if (input) {
    input.value = value;
  }
}
