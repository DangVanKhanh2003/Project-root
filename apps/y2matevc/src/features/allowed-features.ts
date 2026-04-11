/**
 * Allowed Features — y2matevc
 * Simplified version: only fetches and caches country for priority extract routing.
 * No license key or download limit logic needed for this site.
 *
 * At page init, call initAllowedFeatures() to pre-warm the country cache.
 */

import { createHttpClient, createSupporterService } from '@downloader/core';
import { getSearchV2BaseUrl, getTimeout } from '../environment';
import { STORAGE_KEYS } from '../utils/storage-keys';

// ============================================================
// CONFIGURATION
// ============================================================

const LS_CACHE_KEY = STORAGE_KEYS.ALLOWED_FEATURES;
const LS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_ATTEMPTS = 2;

// ============================================================
// SERVICE SETUP
// ============================================================

// Reuse the yt-meta HTTP client (same domain as searchV2)
const ytMetaHttpClient = createHttpClient({
  baseUrl: getSearchV2BaseUrl(),
  timeout: getTimeout('searchV2'),
});

// Dummy supporter client (not used — no license key features on this site)
const dummyHttpClient = createHttpClient({
  baseUrl: 'https://unused.example.com',
  timeout: 5000,
});

const supporterService = createSupporterService(ytMetaHttpClient, dummyHttpClient);

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
// INTERNAL HELPERS
// ============================================================

async function fetchAndCacheAllowedFeatures(): Promise<void> {
  if (inflightApiPromise) return inflightApiPromise;

  inflightApiPromise = (async () => {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await supporterService.fetchAllowedFeatures();
        const country = typeof response?.country === 'string' ? response.country : '';
        const features = Array.isArray(response?.allowed_features)
          ? response.allowed_features.filter((f): f is string => typeof f === 'string')
          : [];

        writeLocalStorageCache(country, features);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    // Silent fail — app works without country cache
    console.warn('[AllowedFeatures] Failed to fetch:', lastError);
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
  fetchAndCacheAllowedFeatures().catch(() => { });
}
