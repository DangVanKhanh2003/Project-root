/**
 * Input Form Controller - TypeScript (Simplified for Phase 4B)
 * Handles form submission and basic input logic
 */

import { api, coreServices } from '../../../api';
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
} from '../state';
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
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      duration: '--:--',
      source: 'YouTube',
      originalUrl: url,
      isFakeData: true
    },
    formats: {
      video: [
        { quality: '2160p (4K)', format: 'mp4', videoId, type: 'video', size: '~500MB' },
        { quality: '1440p (2K)', format: 'mp4', videoId, type: 'video', size: '~300MB' },
        { quality: '1080p (Full HD)', format: 'mp4', videoId, type: 'video', size: '~150MB' },
        { quality: '720p (HD)', format: 'mp4', videoId, type: 'video', size: '~80MB' },
        { quality: '480p', format: 'mp4', videoId, type: 'video', size: '~40MB' },
        { quality: '360p', format: 'mp4', videoId, type: 'video', size: '~20MB' },
      ],
      audio: [
        { quality: '320kbps', format: 'mp3', videoId, type: 'audio', size: '~8MB' },
        { quality: '256kbps', format: 'mp3', videoId, type: 'audio', size: '~6MB' },
        { quality: '192kbps', format: 'mp3', videoId, type: 'audio', size: '~5MB' },
        { quality: '128kbps', format: 'mp3', videoId, type: 'audio', size: '~3MB' },
        { quality: '64kbps', format: 'mp3', videoId, type: 'audio', size: '~2MB' },
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
      console.warn('⚠️ oEmbed API failed:', response.status);
      return null;
    }

    const data = await response.json();
    return {
      title: data.title || 'Unknown Title',
      author: data.author_name || 'Unknown Channel'
    };
  } catch (error) {
    console.error('❌ oEmbed fetch error:', error);
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
 * Scroll to content area after form submission
 * Implements smart desktop/mobile logic like project cũ
 */
function scrollToContentArea(searchType: 'url' | 'keyword'): void {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = prefersReducedMotion ? 'auto' : 'smooth';

  // Determine scroll target based on search type and viewport
  let targetElement: HTMLElement | null = null;

  if (searchType === 'keyword') {
    // Keyword search → scroll to input (mobile only)
    if (window.innerWidth <= 768) {
      targetElement = document.querySelector('#videoUrl');
    } else {
      // Desktop: don't scroll for keyword searches
      return;
    }
  } else {
    // URL search → scroll to content area
    if (window.innerWidth > 768) {
      // Desktop: scroll to input container
      targetElement = document.querySelector('.input-container') ||
                     document.querySelector('#videoUrl') ||
                     document.querySelector('#content-area');
    } else {
      // Mobile: scroll to content area
      targetElement = document.querySelector('#content-area');
    }
  }

  if (targetElement) {
    console.log(`📜 Scrolling to ${searchType} content area`);

    // Calculate offset (navbar height + padding)
    const navbar = document.querySelector('.navbar') as HTMLElement;
    const navbarHeight = navbar ? navbar.offsetHeight : 60;
    const offset = navbarHeight + 20; // 20px padding

    // Get target position
    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

    // Smooth scroll
    window.scrollTo({
      top: targetPosition,
      behavior: behavior as ScrollBehavior
    });
  }
}

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

  console.log('📱 Mobile input clicked - scrolling to input');

  // Scroll to input field
  scrollToContentArea('keyword');
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
    console.error('Form elements not found');
    return false;
  }

  // Attach event listeners
  form.addEventListener('submit', handleSubmit);
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

  console.log('✅ Input form initialized');
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

  console.log('⌨️ handleInput - value:', value, 'length:', value.length);

  // Clear error when user types
  clearError();

  // Update current query state
  setQuery(value);

  // Update button visibility
  const hasContent = value.length > 0;
  console.log('🔘 Updating button visibility - hasContent:', hasContent);
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
  console.log('🔍 Fetching suggestions for query:', query);

  try {
    const result = await api.getSuggestions({ q: query });

    console.log('📥 Suggestions API result:', result);

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

      console.log('✅ Got suggestions (converted to array):', suggestions);
      console.log('📊 Array check:', {
        isArray: Array.isArray(suggestions),
        length: suggestions.length,
        type: typeof suggestions
      });

      if (Array.isArray(suggestions) && suggestions.length > 0) {
        console.log('📝 Setting suggestions in state');
        setSuggestions(suggestions);
      } else {
        console.log('❌ No suggestions or invalid format, hiding dropdown');
        hideSuggestions();
      }
    } else {
      console.warn('⚠️ Suggestions API returned not ok:', result);
      hideSuggestions();
    }
  } catch (error) {
    console.error('❌ Failed to fetch suggestions:', error);
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

  console.log('⌨️ Key pressed:', event.key, 'Current highlightedIndex:', state.highlightedIndex);

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

  console.log('⬇️ Navigate down:', state.highlightedIndex, '→', newIndex);

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

  console.log('⬆️ Navigate up:', state.highlightedIndex, '→', newIndex);

  setHighlightedIndex(newIndex);
  setQuery(displaySuggestions[newIndex]);
  setInputValueInRenderer(displaySuggestions[newIndex]);
}

/**
 * Select current highlighted suggestion and submit
 */
function selectCurrentSuggestion(state: ReturnType<typeof getState>): void {
  console.log('✅ Selecting suggestion at index:', state.highlightedIndex);

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
  console.log('🔙 Returning to original query:', state.originalQuery);

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

  console.log('🖱️ Suggestion clicked:', suggestionText, 'at index:', suggestionIndex);

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

  console.log('📝 Form submitted with value:', value);

  // Blur input to hide keyboard on mobile
  if (input) {
    input.blur();
    console.log('⌨️ Input blurred - keyboard hidden on mobile');
  }

  // Clear previous results
  setResults([]);
  clearError();
  hideSuggestions();
  setLoading(true);

  // Get input type to show appropriate skeleton
  const state = getState();

  try {
    if (state.inputType === 'url') {
      // Show detail skeleton for video extraction
      showLoading('detail');

      // Scroll to content area after skeleton renders (50ms delay)
      setTimeout(() => {
        scrollToContentArea('url');
      }, 50);

      await handleExtractMedia(value);
    } else {
      // Show list skeleton (12 cards) for keyword search
      showLoading('list');

      // Scroll to content area after skeleton renders (50ms delay)
      setTimeout(() => {
        scrollToContentArea('keyword');
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
    console.log('✅ Form submission complete, isSubmitting reset to false');
  }
}

/**
 * Handle media extraction (URL input)
 * Implements dual workflow: YouTube (fake data) vs Non-YouTube (API-first)
 */
async function handleExtractMedia(url: string): Promise<void> {
  console.log('🎬 Extracting media from URL:', url);

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

      console.log('📺 YouTube URL detected, using fake data workflow');
      console.log('🎬 Video ID:', videoId);

      // Fire-and-forget: Add video to queue API (analytics/preloading notification)
      coreServices.queue.addVideoToQueue(videoId).then((success: boolean) => {
        if (success) {
          console.log('✅ Video added to queue:', videoId);
        } else {
          console.log('⚠️ Failed to add video to queue (silent)');
        }
      }).catch((error: Error) => {
        console.log('⚠️ Queue API error (silent):', error);
      });

      // Wait 300ms for skeleton animation (like old project)
      setTimeout(async () => {
        // 1. Generate fake data with pre-defined quality options
        const fakeData = generateFakeYouTubeData(videoId, url);
        console.log('✨ Generated fake data:', fakeData);

        // 2. Render fake data with proper download options UI
        renderVideoDownloadOptions(fakeData, 'video');

        // 3. Background: Enhance metadata using oEmbed API (non-blocking)
        console.log('🔄 Fetching real metadata from oEmbed...');
        const metadata = await enhanceYouTubeMetadata(videoId);

        if (metadata) {
          console.log('✅ Real metadata fetched:', metadata);

          // Update fake data with real title & author
          fakeData.meta.title = metadata.title;
          fakeData.meta.author = metadata.author;
          fakeData.meta.isFakeData = false; // Mark as enhanced with real data

          // Re-render with updated metadata
          renderVideoDownloadOptions(fakeData, 'video');
        } else {
          console.warn('⚠️ Could not fetch real metadata, keeping fake data');
        }

        // Reset isFromListItemClick flag after YouTube workflow completes
        const state = getState();
        if (state.isFromListItemClick) {
          setIsFromListItemClick(false);
          console.log('✅ Reset isFromListItemClick flag (YouTube workflow complete)');
        }
      }, 300); // 300ms delay for skeleton animation

    } else {
      // ┌─────────────────────────────────────────────────┐
      // │ NON-YOUTUBE WORKFLOW: Traditional API Call      │
      // └─────────────────────────────────────────────────┘

      console.log('🌐 Non-YouTube URL, calling extract API...');

      const result = await api.extractMedia({ url });

      console.log('📡 Extract result:', result);

      if (result.ok && result.data) {
        console.log('✅ Media extracted:', result.data);
        const data = result.data as any;

        // Add original URL to meta for retry functionality
        if (data.meta) {
          data.meta.originalUrl = url;
        }

        // Check if this is gallery content or single video
        if (data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
          console.log('🖼️ Gallery content detected:', data.gallery.length, 'items');
          setGalleryDetail(data);

          // Dynamic import and render gallery
          import('../ui-render/gallery-renderer').then(({ renderGallery }) => {
            const contentArea = document.getElementById('content-area');
            if (contentArea) {
              renderGallery(data, contentArea);
              console.log('✅ Gallery rendered');
            }
          });
        } else {
          console.log('🎬 Single video content detected');
          setVideoDetail(data);
          renderVideoDownloadOptions(data, 'video');
          console.log('✅ Video download options rendered');
        }
      } else {
        const errorMsg = result.message || 'Failed to extract media';
        setError(errorMsg);
        renderMessage(errorMsg, 'error');
      }
    }
  } catch (error) {
    console.error('❌ Extract error:', error);
    throw error;
  }
}

/**
 * Transform SearchV2ItemDto to VideoData format
 * Formats duration, views, and date for display
 */
function transformSearchItemToVideoData(item: any): VideoData {
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
      console.warn('Failed to parse upload date:', item.uploadDate);
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
  console.log('🔍 Searching for:', keyword);

  try {
    // Use Search V2 API for better results
    const result = await api.searchV2(keyword, {
      limit: 20
    });

    console.log('Search result:', result);

    if (result.ok && result.data) {
      // Success - show search results
      // result.data is SearchV2Dto object with structure: { videos, items, pagination, ... }
      const searchData = result.data as any;
      const rawVideos = searchData.videos || searchData.items || [];

      console.log('✅ Search data:', searchData);
      console.log('✅ Found raw videos:', rawVideos.length);

      // Transform SearchV2ItemDto[] to VideoData[] for rendering
      const transformedVideos: VideoData[] = rawVideos.map(transformSearchItemToVideoData);

      console.log('✅ Transformed videos:', transformedVideos.length);
      console.log('📊 First transformed video:', transformedVideos[0]);

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
    console.error('Search error:', error);
    throw error;
  }
}

/**
 * Handle action button click (Paste or Clear based on data-action)
 */
function handleActionButton(): void {
  if (!pasteBtn) return;

  const action = pasteBtn.dataset.action;
  console.log('🔘 Action button clicked - action:', action);

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

  console.log('📋 Paste button clicked');

  try {
    const text = await navigator.clipboard.readText();
    const trimmedText = text.trim();

    console.log('📋 Pasted text:', trimmedText);

    // Set input value
    input.value = trimmedText;

    // Dispatch input event to trigger handleInput (updates button visibility)
    input.dispatchEvent(new Event('input', { bubbles: true }));

    console.log('📋 Input event dispatched - should update button visibility');

    // Auto-submit if looks like URL
    if (trimmedText.startsWith('http')) {
      console.log('🔗 URL detected - auto-submitting');
      form?.requestSubmit();
    }
  } catch (error) {
    console.error('❌ Paste failed:', error);
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
    console.log('📱 Auto focus skipped - mobile viewport');
    return;
  }

  // Respect user accessibility preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    console.log('♿ Auto focus skipped - user prefers reduced motion');
    return;
  }

  // Skip if user has already interacted with the page
  if (userHasInteracted) {
    console.log('👆 Auto focus skipped - user already interacted');
    return;
  }

  console.log('🎯 Auto focus enabled - will focus after 150ms delay');

  // Apply timing delay to prevent blocking page load
  setTimeout(() => {
    // Double-check interaction status before focusing
    if (!userHasInteracted && input) {
      try {
        input.focus();
        console.log('✅ Input auto-focused');
      } catch (error) {
        console.warn('⚠️ Auto focus failed:', error);
      }
    } else {
      console.log('⏭️ Auto focus cancelled - user interacted during delay');
    }
  }, 150); // 150ms delay to prevent blocking page load
}

/**
 * Sets up user interaction detection to prevent auto focus after user activity
 */
function setupUserInteractionDetection(): void {
  function markUserInteraction(): void {
    userHasInteracted = true;
    console.log('👆 User interaction detected - disabling auto focus');

    // Remove listeners after first interaction for performance
    USER_INTERACTION_EVENTS.forEach(eventType => {
      document.removeEventListener(eventType, markUserInteraction, { capture: true });
    });
  }

  // Listen for user interactions
  USER_INTERACTION_EVENTS.forEach(eventType => {
    document.addEventListener(eventType, markUserInteraction, { capture: true, once: true });
  });

  console.log('🎧 User interaction detection setup');
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
