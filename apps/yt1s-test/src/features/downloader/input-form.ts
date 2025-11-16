/**
 * Input Form Controller - TypeScript (Simplified for Phase 4B)
 * Handles form submission and basic input logic
 */

import { api } from '../../api';
import {
  getState,
  setState,
  setLoading,
  setError,
  clearError,
  setInputType,
  updateButtonVisibility,
  setResults,
  hideSuggestions,
} from './state';
import { renderResults, renderMessage, showLoading, clearContent } from './content-renderer';

// DOM Elements
let form: HTMLFormElement | null = null;
let input: HTMLInputElement | null = null;
let pasteBtn: HTMLButtonElement | null = null;
let clearBtn: HTMLButtonElement | null = null;

/**
 * Initialize input form
 */
export function initInputForm(): boolean {
  // Get DOM elements
  form = document.getElementById('downloadForm') as HTMLFormElement;
  input = document.getElementById('urlInput') as HTMLInputElement;
  pasteBtn = document.getElementById('pasteButton') as HTMLButtonElement;
  clearBtn = document.getElementById('clearButton') as HTMLButtonElement;

  if (!form || !input) {
    console.error('Form elements not found');
    return false;
  }

  // Attach event listeners
  form.addEventListener('submit', handleSubmit);
  input.addEventListener('input', handleInput);

  if (pasteBtn) {
    pasteBtn.addEventListener('click', handlePaste);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', handleClear);
  }

  console.log('✅ Input form initialized');
  return true;
}

/**
 * Handle input changes
 */
function handleInput(event: Event): void {
  if (!input) return;

  const value = input.value.trim();

  // Clear error when user types
  clearError();

  // Update button visibility
  updateButtonVisibility(value.length > 0);

  // Detect input type (simple version)
  const isUrl = value.startsWith('http://') || value.startsWith('https://');
  setInputType(isUrl ? 'url' : 'keyword');

  // Hide suggestions when typing URL
  if (isUrl) {
    hideSuggestions();
  }
}

/**
 * Handle form submission
 */
async function handleSubmit(event: Event): Promise<void> {
  event.preventDefault();

  if (!input) return;

  const value = input.value.trim();

  if (!value) {
    setError('Please enter a URL or keyword');
    return;
  }

  // Clear previous results
  setResults([]);
  clearError();
  clearContent();
  setLoading(true);
  hideSuggestions();
  showLoading();

  try {
    const state = getState();

    if (state.inputType === 'url') {
      // Extract media from URL
      await handleExtractMedia(value);
    } else {
      // Search by keyword
      await handleSearch(value);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    setError(message);
    renderMessage(message, 'error');
  } finally {
    setLoading(false);
  }
}

/**
 * Handle media extraction (URL input)
 */
async function handleExtractMedia(url: string): Promise<void> {
  console.log('🎬 Extracting media from URL:', url);

  try {
    const result = await api.extractMedia({ url });

    console.log('Extract result:', result);

    if (result.ok && result.data) {
      // Success - show video info
      console.log('✅ Media extracted:', result.data);
      const title = result.data.title || 'Video';
      const meta = result.data.meta || {};
      renderMessage(`✅ Video extracted: ${title}`, 'success');
    } else {
      // Error from API
      const errorMsg = result.message || 'Failed to extract media';
      setError(errorMsg);
      renderMessage(errorMsg, 'error');
    }
  } catch (error) {
    console.error('Extract error:', error);
    throw error;
  }
}

/**
 * Handle search (keyword input)
 */
async function handleSearch(keyword: string): Promise<void> {
  console.log('🔍 Searching for:', keyword);

  try {
    const result = await api.searchTitle({
      keyword,
      from: 'youtube'
    });

    console.log('Search result:', result);

    if (result.ok && result.data) {
      // Success - show search results
      const videos = result.data.videos || [];
      console.log('✅ Found videos:', videos.length);
      setResults(videos);

      if (videos.length > 0) {
        renderResults(videos);
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
 * Handle paste button click
 */
async function handlePaste(): Promise<void> {
  if (!input) return;

  try {
    const text = await navigator.clipboard.readText();
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Auto-submit if looks like URL
    if (text.trim().startsWith('http')) {
      form?.requestSubmit();
    }
  } catch (error) {
    console.error('Paste failed:', error);
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
