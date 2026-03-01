/**
 * Allowed Features API Service
 * Fetches country-level feature access flags from yt-meta.
 *
 * Uses the existing ytMetaHttpClient from the API layer.
 */

import { createHttpClient } from '@downloader/core';
import { getYtMetaBaseUrl, getTimeout } from '../environment';

// Create a dedicated HTTP client for allowed-features
// Uses the same ytMetaBaseUrl, keeping API concerns in the API layer
const ytMetaHttpClient = createHttpClient({
    baseUrl: getYtMetaBaseUrl(),
    timeout: getTimeout('playlist'),
});

export interface AllowedFeaturesResponse {
    allowed_features: string[];
    country: string;
}

/**
 * Fetch the allowed features list for the current user's country.
 * GET {ytMetaBaseUrl}/allowed-features
 *
 * @returns Raw API response with allowed_features array and country code
 */
export async function fetchAllowedFeaturesApi(): Promise<AllowedFeaturesResponse> {
    const response = await ytMetaHttpClient.get<Record<string, unknown>>('/allowed-features');

    return {
        allowed_features: Array.isArray(response?.allowed_features)
            ? (response.allowed_features as unknown[]).filter((f): f is string => typeof f === 'string')
            : [],
        country: typeof response?.country === 'string' ? response.country : '',
    };
}
