/**
 * Allowed Features — Country Cache for Priority Extract Routing
 *
 * Minimal implementation: only fetches and caches country code from
 * yt-meta.ytconvert.org/allowed-features for use by priority-extract-router.
 *
 * At page init, call initAllowedFeatures() to pre-warm the cache.
 */

import { getSearchV2BaseUrl } from '../environment';
import { STORAGE_KEYS } from '../utils/storage-keys';

// ============================================================
// CONFIGURATION
// ============================================================

const LS_CACHE_KEY = STORAGE_KEYS.ALLOWED_FEATURES;
const LS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_ATTEMPTS = 2;

// ============================================================
// CACHE TYPES
// ============================================================

interface StoredAllowedState {
  country: string;
  allowedFeatures: string[];
  timestamp: number;
}

// ============================================================
// LOCALSTORAGE CACHE
// ============================================================

function readLocalStorageCache(): StoredAllowedState | null {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY);
    if (!raw) return null;
    const parsed: StoredAllowedState = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > LS_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalStorageCache(country: string, allowedFeatures: string[]): void {
  try {
    const data: StoredAllowedState = {
      country,
      allowedFeatures,
      timestamp: Date.now(),
    };
    localStorage.setItem(LS_CACHE_KEY, JSON.stringify(data));
  } catch { }
}

// ============================================================
// API FETCH
// ============================================================

let inflightPromise: Promise<void> | null = null;

async function fetchAndCacheAllowedFeatures(): Promise<void> {
  if (inflightPromise) return inflightPromise;

  inflightPromise = (async () => {
    const baseUrl = getSearchV2BaseUrl();

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(`${baseUrl}/allowed-features`);
        if (!response.ok) continue;

        const data = await response.json();
        const country = typeof data?.country === 'string' ? data.country : '';
        const features = Array.isArray(data?.allowed_features)
          ? data.allowed_features.filter((f: unknown): f is string => typeof f === 'string')
          : [];

        writeLocalStorageCache(country, features);
        return;
      } catch {
        // Continue to next attempt
      }
    }
  })().finally(() => {
    inflightPromise = null;
  });

  return inflightPromise;
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Pre-warm the allowed features cache at page init.
 * Checks localStorage first; if expired or missing, fetches from API in background.
 */
export function initAllowedFeatures(): void {
  if (readLocalStorageCache()) return;
  fetchAndCacheAllowedFeatures().catch(() => { });
}
