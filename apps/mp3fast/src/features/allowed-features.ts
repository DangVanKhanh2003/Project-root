/**
 * Allowed Features — mp3fast (simplified)
 * Only handles country cache for priority extract routing.
 * No license key or supporter features — mp3fast doesn't support those.
 *
 * At page init, call initAllowedFeatures() to pre-warm the country cache.
 */

import { createHttpClient } from '@downloader/core';
import { getSearchV2BaseUrl, getTimeout } from '../environment';
import { STORAGE_KEYS } from '../utils/storage-keys';

// ============================================================
// CONFIGURATION
// ============================================================

const LS_CACHE_KEY = STORAGE_KEYS.ALLOWED_FEATURES;
const LS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_ATTEMPTS = 2;

// ============================================================
// CACHE STATE
// ============================================================

interface StoredAllowedState {
  country: string;
  allowedFeatures: string[];
  timestamp: number;
}

let inflightApiPromise: Promise<void> | null = null;

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

function writeLocalStorageCache(country: string, features: string[]): void {
  try {
    const data: StoredAllowedState = {
      country,
      allowedFeatures: features,
      timestamp: Date.now(),
    };
    localStorage.setItem(LS_CACHE_KEY, JSON.stringify(data));
  } catch { }
}

// ============================================================
// API FETCH
// ============================================================

/**
 * Fetch allowed features from yt-meta API and cache result.
 * Deduplicates concurrent calls.
 */
async function fetchAndCache(): Promise<void> {
  if (inflightApiPromise) {
    await inflightApiPromise;
    return;
  }

  inflightApiPromise = (async () => {
    const httpClient = createHttpClient({
      baseUrl: getSearchV2BaseUrl(),
      timeout: getTimeout('default'),
    });

    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await httpClient.get<Record<string, unknown>>('/allowed-features');

        const country = typeof response?.country === 'string' ? response.country : '';
        const features = Array.isArray(response?.allowed_features)
          ? (response.allowed_features as unknown[]).filter((f): f is string => typeof f === 'string')
          : [];

        writeLocalStorageCache(country, features);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError ?? new Error('allowed-features request failed');
  })().finally(() => {
    inflightApiPromise = null;
  });

  return inflightApiPromise;
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
  fetchAndCache().catch(() => { });
}
