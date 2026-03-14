/**
 * Page Freshness Manager
 *
 * Detects when a page has been open too long without a reload
 * and forces a refresh to ensure users get the latest assets.
 *
 * Usage:
 *   1. Call `recordPageLoad()` once at app startup
 *   2. Call `reloadIfStale()` at key interaction points (e.g. "Start Over")
 *      — returns `true` if a reload was triggered, so the caller can bail out
 */

// ============================================================
// CONFIGURATION
// ============================================================

/** Maximum page age before forcing a reload (default: 72 hours) */
const MAX_PAGE_AGE_MS = 72 * 60 * 60 * 1000;

/**
 * Key used in sessionStorage (not localStorage).
 * sessionStorage is per-tab, so each tab tracks its own load time
 * independently — no cross-tab overwrite issues.
 */
const SESSION_KEY = 'pageLoadedAt';

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Record the current timestamp as the last page-load time.
 * Call once during app initialization.
 */
export function recordPageLoad(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, String(Date.now()));
  } catch {
    // sessionStorage may be unavailable (private browsing, quota exceeded)
  }
}

/**
 * Check whether the page has been open longer than MAX_PAGE_AGE_MS.
 */
export function isPageStale(): boolean {
  try {
    const loadedAt = Number(sessionStorage.getItem(SESSION_KEY));
    if (!loadedAt) return false;
    return Date.now() - loadedAt > MAX_PAGE_AGE_MS;
  } catch {
    return false;
  }
}

/**
 * If the page is stale, trigger a full reload and return `true`.
 * Otherwise return `false` so the caller can continue normally.
 */
export function reloadIfStale(): boolean {
  if (!isPageStale()) return false;
  location.reload();
  return true;
}
