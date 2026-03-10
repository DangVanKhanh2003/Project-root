import type { IHttpClient } from '../../http/http-client.interface';

export interface AllowedFeaturesResponse {
    allowed_features: string[];
    country: string;
}

export interface CheckKeyUserInfo {
    email: string;
    name: string;
}

export interface CheckKeyResponse {
    valid: boolean;
    message?: string;
    status?: string;
    planType?: string;
    activatedAt?: string;
    expiresAt?: string | null;
    isExpired?: boolean;
    daysRemaining?: number | null;
    tierPurchased?: number;
    user?: CheckKeyUserInfo;
}

export interface SupporterPricingPlan {
    price?: number;
    kofi_link?: string;
}

export interface SupporterPricingResponse {
    country: string;
    tier: number;
    kofilink?: string;
    plans: Record<string, SupporterPricingPlan>;
}

export interface ResetKeyResponse {
    success: boolean;
    message?: string;
}

export interface ISupporterService {
    fetchAllowedFeatures(): Promise<AllowedFeaturesResponse>;
    checkLicenseKey(key: string): Promise<CheckKeyResponse>;
    fetchPricing(): Promise<SupporterPricingResponse>;
    resetKey(email: string): Promise<ResetKeyResponse>;
}

class SupporterServiceImpl implements ISupporterService {
    constructor(
        private readonly ytMetaClient: IHttpClient,
        private readonly supporterClient: IHttpClient,
    ) { }

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

        const user = response?.user as Record<string, unknown> | undefined;

        return {
            valid: response?.valid === true,
            message: typeof response?.message === 'string' ? response.message : undefined,
            status: typeof response?.status === 'string' ? response.status : undefined,
            planType: typeof response?.planType === 'string' ? response.planType : undefined,
            activatedAt: typeof response?.activatedAt === 'string' ? response.activatedAt : undefined,
            expiresAt: typeof response?.expiresAt === 'string' ? response.expiresAt : (response?.expiresAt === null ? null : undefined),
            isExpired: typeof response?.isExpired === 'boolean' ? response.isExpired : undefined,
            daysRemaining: typeof response?.daysRemaining === 'number' ? response.daysRemaining : (response?.daysRemaining === null ? null : undefined),
            tierPurchased: typeof response?.tierPurchased === 'number' ? response.tierPurchased : undefined,
            user: user && typeof user.email === 'string' && typeof user.name === 'string'
                ? { email: user.email, name: user.name }
                : undefined,
        };
    }

    async resetKey(email: string): Promise<ResetKeyResponse> {
        const response = await this.supporterClient.post<Record<string, unknown>>('/api/reset-key', { email });

        return {
            success: response?.success === true || response?.message !== undefined,
            message: typeof response?.message === 'string' ? response.message : undefined,
        };
    }

    async fetchPricing(): Promise<SupporterPricingResponse> {
        const response = await this.supporterClient.get<Record<string, unknown>>('/api/pricing');
        const rawPlans = response?.plans as Record<string, unknown> | undefined;
        const plans: Record<string, SupporterPricingPlan> = {};

        if (rawPlans && typeof rawPlans === 'object') {
            Object.entries(rawPlans).forEach(([planName, planValue]) => {
                if (!planValue || typeof planValue !== 'object') return;

                const plan = planValue as Record<string, unknown>;
                plans[planName] = {
                    price: typeof plan.price === 'number' ? plan.price : undefined,
                    kofi_link: typeof plan.kofi_link === 'string' ? plan.kofi_link : undefined,
                };
            });
        }

        return {
            country: typeof response?.country === 'string' ? response.country : '',
            tier: typeof response?.tier === 'number' ? response.tier : 0,
            kofilink: typeof response?.kofilink === 'string'
                ? response.kofilink
                : (typeof response?.kofi_link === 'string' ? response.kofi_link : undefined),
            plans,
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
