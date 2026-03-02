import type { IHttpClient } from '../../http/http-client.interface';

export interface AllowedFeaturesResponse {
    allowed_features: string[];
    country: string;
}

export interface CheckKeyResponse {
    valid: boolean;
    message?: string;
}

export interface ISupporterService {
    fetchAllowedFeatures(): Promise<AllowedFeaturesResponse>;
    checkLicenseKey(key: string): Promise<CheckKeyResponse>;
}

class SupporterServiceImpl implements ISupporterService {
    constructor(
        private readonly ytMetaClient: IHttpClient,
        private readonly supporterClient: IHttpClient,
    ) {}

    async fetchAllowedFeatures(): Promise<AllowedFeaturesResponse> {
        const response = await this.ytMetaClient.get<Record<string, unknown>>('/allowed-features');

        return {
            allowed_features: Array.isArray(response?.allowed_features)
                ? (response.allowed_features as unknown[]).filter((f): f is string => typeof f === 'string')
                : [],
            country: typeof response?.country === 'string' ? response.country : '',
        };
    }

    async checkLicenseKey(key: string): Promise<CheckKeyResponse> {
        const response = await this.supporterClient.post<Record<string, unknown>>('/api/check-key', { key });

        return {
            valid: response?.valid === true,
            message: typeof response?.message === 'string' ? response.message : undefined,
        };
    }
}

/**
 * @param ytMetaClient   - HTTP client for yt-meta.ytconvert.org (geo check)
 * @param supporterClient - HTTP client for ytmp3-supporter.ytmp3.gg (license key)
 */
export function createSupporterService(
    ytMetaClient: IHttpClient,
    supporterClient: IHttpClient,
): ISupporterService {
    return new SupporterServiceImpl(ytMetaClient, supporterClient);
}
