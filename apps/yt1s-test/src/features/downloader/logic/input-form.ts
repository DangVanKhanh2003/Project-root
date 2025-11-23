/**
 * Input Form Controller - TypeScript (Simplified for Phase 4B)
 * Handles form submission and basic input logic
 */

import { api, coreServices } from '../../../api';
import { scrollManager } from '@downloader/ui-shared';
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
  setQuery,
  setOriginalQuery,
  setHighlightedIndex,
  getDisplaySuggestions,
  setSubmitting,
  setIsFromListItemClick,
  setVideoDetail,
  setGalleryDetail,
  setSearchPagination,
} from '../state';
import { clearDetailStates } from '../state/media-detail-state';
import { clearConversionTasks } from '../state/conversion-state';
import { clearDownloadStates } from '../state/download-state';
import { renderResults, renderMessage, renderVideoDownloadOptions, showLoading, clearContent } from '../ui-render/content-renderer';
import { getInputValue as getInputValueFromRenderer, setInputValue as setInputValueInRenderer } from '../ui-render/ui-renderer';
import type { VideoData } from '../../../ui-components/search-result-card/search-result-card';

// ============================================
// YOUTUBE HELPERS
// ============================================

/**
 * Check if URL is YouTube
 */
function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(url);
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeVideoId(url: string): string | null {
  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/watch?v=VIDEO_ID
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (longMatch) return longMatch[1];

  // youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}

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
          quality: '2160p (4K)',
          format: 'mp4',
          vid: videoId,
          type: 'VIDEO',  // Changed to uppercase to match API
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'video',
            videoQuality: '2160',
            youtubeVideoContainer: 'mp4'
          }
        },
        {
          quality: '1440p (2K)',
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
          quality: '1080p (Full HD)',
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
          quality: '720p (HD)',
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
            audioQuality: '320',
            youtubeAudioContainer: 'mp3'
          }
        },
        {
          quality: '256kbps',
          format: 'mp3',
          vid: videoId,
          type: 'AUDIO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'audio',
            audioQuality: '256',
            youtubeAudioContainer: 'mp3'
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
            audioQuality: '192',
            youtubeAudioContainer: 'mp3'
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
            audioQuality: '128',
            youtubeAudioContainer: 'mp3'
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
            audioQuality: '64',
            youtubeAudioContainer: 'mp3'
          }
        },
      ]
    }
  };
}

/**
 * Enhance YouTube metadata using oEmbed API (background)
 */
async function enhanceYouTubeMetadata(videoId: string): Promise<{ title: string; author: string } | null> {
  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oEmbedUrl);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      title: data.title || 'Unknown Title',
      author: data.author_name || 'Unknown Channel'
    };
  } catch (error) {
    return null;
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
  if (window.innerWidth > 768) {
    return;
  }

  // Throttle clicks to prevent scroll spam
  const now = Date.now();
  if (now - lastClickTime < CLICK_THROTTLE_MS) {
    return;
  }
  lastClickTime = now;

  // Scroll to input field using the centralized scroll manager
  scrollManager.scrollToElement('#videoUrl');
}

/**
 * Handle paste event on the input field to auto-submit the form.
 */
function handlePasteAndSubmit(event: ClipboardEvent): void {
  // Don't interfere if the form is already submitting
  if (getState().isSubmitting) {
    return;
  }

  // Use a short timeout to allow the input's value to update from the paste event
  setTimeout(() => {
    if (form && input && input.value.trim() !== '') {
      form.requestSubmit();
    }
  }, 0);
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

  // Attach event listeners
  form.addEventListener('submit', handleSubmit);
  input.addEventListener('input', handleInput);
  input.addEventListener('keydown', handleKeyDown); // Keyboard navigation
  input.addEventListener('click', handleInputClick); // Mobile click-to-scroll
  input.addEventListener('paste', handlePasteAndSubmit); // Auto-submit on paste

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

// Debounce timer for suggestions
let suggestionTimer: number | null = null;

/**
 * Handle input changes
 */
function handleInput(event: Event): void {
  if (!input) return;

  const value = input.value.trim();


  // Clear error when user types
  clearError();

  // Update current query state
  setQuery(value);

  // Update button visibility
  const hasContent = value.length > 0;
  updateButtonVisibility(hasContent);

  // Detect input type (simple version)
  const isUrl = value.startsWith('http://') || value.startsWith('https://');
  setInputType(isUrl ? 'url' : 'keyword');

  // Hide suggestions when typing URL
  if (isUrl) {
    hideSuggestions();
    if (suggestionTimer) {
      clearTimeout(suggestionTimer);
    }
    return;
  }

  // Handle suggestions for keyword input
  if (value.length >= 2) {
    // Set original query when starting to fetch suggestions
    setOriginalQuery(value);

    // Clear previous timer
    if (suggestionTimer) {
      clearTimeout(suggestionTimer);
    }

    // Debounce: wait 300ms after user stops typing
    suggestionTimer = window.setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  } else {
    hideSuggestions();
  }
}

/**
 * Fetch suggestions from API
 */
async function fetchSuggestions(query: string): Promise<void> {

  try {
    const result = await api.getSuggestions({ q: query });


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
  }

  hideSuggestions();
  setHighlightedIndex(-1);

  // Trigger form submission
  if (form) {
    form.requestSubmit();
  }
}

/**
 * Return to original query and clear highlights
 */
function returnToOriginal(state: ReturnType<typeof getState>): void {

  // Cancel any pending suggestion fetches
  if (suggestionTimer) {
    clearTimeout(suggestionTimer);
  }

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
    // Set submitting flag to prevent suggestion interference
    setSubmitting(true);

    // Cancel any pending suggestion fetches
    if (suggestionTimer) {
      clearTimeout(suggestionTimer);
    }

    // Update input value + submit immediately
    setQuery(suggestionText);
    setInputValueInRenderer(suggestionText);
    setHighlightedIndex(suggestionIndex);
    hideSuggestions();

    // Auto-submit after slight delay
    setTimeout(() => {
      if (form) {
        form.requestSubmit();
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


  // Blur input to hide keyboard on mobile
  if (input) {
    input.blur();
  }

  // Clear ALL previous state to prevent conflicts
  setResults([]);              // Clear search results
  clearError();                // Clear error messages
  hideSuggestions();           // Hide suggestions dropdown
  clearDetailStates();         // Clear videoDetail/galleryDetail
  clearConversionTasks();      // Clear conversion tasks
  clearDownloadStates();       // Clear download button states
  setLoading(true);

  // Get input type to show appropriate skeleton
  const state = getState();

  try {
    if (state.inputType === 'url') {
      // Show detail skeleton for video extraction
      showLoading('detail');

      // Scroll to content area after skeleton renders (50ms delay)
      setTimeout(() => {
        const target = scrollManager.isDesktop() ? '.input-container' : '#content-area';
        scrollManager.scrollToElement(target);
      }, 50);

      await handleExtractMedia(value);
    } else {
      // Show list skeleton (12 cards) for keyword search
      showLoading('list');

      // Scroll to content area after skeleton renders (50ms delay)
      setTimeout(() => {
        // Only scroll on mobile for keyword searches
        if (scrollManager.isMobile()) {
          scrollManager.scrollToElement('#videoUrl');
        }
      }, 50);

      await handleSearch(value);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    setError(message);
    renderMessage(message, 'error');
  } finally {
    setLoading(false);
    // 🚨 CRITICAL: Reset submitting flag to allow suggestions again
    setSubmitting(false);
  }
}

/**
 * Handle media extraction (URL input)
 * Implements dual workflow: YouTube (fake data) vs Non-YouTube (API-first)
 */
async function handleExtractMedia(url: string): Promise<void> {

  try {
    // ═══════════════════════════════════════════════════════
    // FORK: YouTube vs Non-YouTube Workflow
    // ═══════════════════════════════════════════════════════

    if (isYouTubeUrl(url)) {
      // ┌─────────────────────────────────────────────────┐
      // │ YOUTUBE WORKFLOW: Fake Data → Instant UI        │
      // └─────────────────────────────────────────────────┘

      const videoId = extractYouTubeVideoId(url);

      if (!videoId) {
        throw new Error('Invalid YouTube URL - cannot extract video ID');
      }

      // Fire-and-forget: Add video to queue API (analytics/preloading notification)
      coreServices.queue.addVideoToQueue(videoId).then((success: boolean) => {
        if (success) {
        } else {
        }
      }).catch((error: Error) => {
      });

      // Wait 300ms for skeleton animation (like old project)
      setTimeout(async () => {
        // 1. Generate fake data with pre-defined quality options
        const fakeData = generateFakeYouTubeData(videoId, url);

        // 2. Set fake data to state before rendering
        setVideoDetail(fakeData);

        // 3. Render fake data with proper download options UI
        renderVideoDownloadOptions(fakeData, 'video');

        // 3. Background: Enhance metadata using oEmbed API (non-blocking)
        const metadata = await enhanceYouTubeMetadata(videoId);

        if (metadata) {

          // Update fake data with real title & author
          fakeData.meta.title = metadata.title;
          fakeData.meta.author = metadata.author;
          fakeData.meta.isFakeData = false; // Mark as enhanced with real data

          // Update state with enhanced metadata
          setVideoDetail(fakeData);

          // Re-render with updated metadata
          renderVideoDownloadOptions(fakeData, 'video');
        } else {
        }

        // Reset isFromListItemClick flag after YouTube workflow completes
        const state = getState();
        if (state.isFromListItemClick) {
          setIsFromListItemClick(false);
        }
      }, 300); // 300ms delay for skeleton animation

    } else {
      // ┌─────────────────────────────────────────────────┐
      // │ NON-YOUTUBE WORKFLOW: Traditional API Call      │
      // └─────────────────────────────────────────────────┘


      const result = await api.extractMediaDirect({ url });


      if (result.ok && result.data) {
        const data = result.data as any;


        // Add original URL to meta for retry functionality
        if (data.meta) {
          data.meta.originalUrl = url;
        }

        // Check if this is gallery content or single video
        if (data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
          setGalleryDetail(data);

          // Dynamic import and render gallery
          import('../ui-render/gallery-renderer').then(({ renderGallery }) => {
            const contentArea = document.getElementById('content-area');
            if (contentArea) {
              renderGallery(data, contentArea);
            }
          });
        } else {
          setVideoDetail(data);

          renderVideoDownloadOptions(data, 'video');

          // Log state after render
          const state = getState();
        }
      } else {
        const errorMsg = result.message || 'Failed to extract media';
        setError(errorMsg);
        renderMessage(errorMsg, 'error');
      }
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
async function handleSearch(keyword: string): Promise<void> {

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
 */
function handleActionButton(): void {
  if (!pasteBtn) return;

  const action = pasteBtn.dataset.action;

  if (action === 'clear') {
    handleClear();
  } else {
    handlePaste();
  }
}

/**
 * Handle paste button click
 */
async function handlePaste(): Promise<void> {
  if (!input) return;


  try {
    const text = await navigator.clipboard.readText();
    const trimmedText = text.trim();


    // Set input value
    input.value = trimmedText;

    // Dispatch input event to trigger handleInput (updates button visibility)
    input.dispatchEvent(new Event('input', { bubbles: true }));


    // Auto-submit if looks like URL
    if (trimmedText.startsWith('http')) {
      form?.requestSubmit();
    }
  } catch (error) {
  }
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
  setResults([]);
  hideSuggestions();
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
