/**
 * View Switcher - Controls 2-view structure
 * Switches between search view and result view
 */

// Cache DOM elements
let searchView: HTMLElement | null = null;
let resultView: HTMLElement | null = null;
let isInitialized = false;

/**
 * Initialize view switcher
 * Query DOM elements and set default state
 */
export function initViewSwitcher(): boolean {
  searchView = document.getElementById('search-view');
  resultView = document.getElementById('result-view');

  if (!searchView || !resultView) {
    console.error('View switcher: Required view elements not found');
    console.error('searchView:', searchView);
    console.error('resultView:', resultView);
    return false;
  }

  // Set default state: search visible, result hidden
  searchView.classList.remove('hidden');
  resultView.classList.add('hidden');

  isInitialized = true;
  return true;
}

/**
 * Show search view, hide result view
 */
export function showSearchView(): void {
  if (!isInitialized || !searchView || !resultView) {
    console.warn('View switcher not initialized');
    return;
  }

  searchView.classList.remove('hidden');
  resultView.classList.add('hidden');
}

/**
 * Show result view, hide search view
 */
export function showResultView(): void {
  if (!isInitialized || !searchView || !resultView) {
    console.warn('View switcher not initialized');
    return;
  }

  searchView.classList.add('hidden');
  resultView.classList.remove('hidden');
}
