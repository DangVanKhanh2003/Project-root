import { supporterService } from '../api';

const SUPPORTER_PRICING_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedTipMessageKoFiLink: string | null = null;
let cachedTipMessageKoFiLinkAt = 0;
let inflightTipMessageKoFiLinkPromise: Promise<string | null> | null = null;

function normalizeKoFiLink(value?: string): string | null {
    if (typeof value !== 'string') return null;

    const trimmedValue = value.trim();
    return trimmedValue || null;
}

export async function getTipMessageKoFiLink(forceRefresh = false): Promise<string | null> {
    const now = Date.now();

    if (!forceRefresh && cachedTipMessageKoFiLink && now - cachedTipMessageKoFiLinkAt < SUPPORTER_PRICING_CACHE_TTL_MS) {
        return cachedTipMessageKoFiLink;
    }

    if (!forceRefresh && inflightTipMessageKoFiLinkPromise) {
        return inflightTipMessageKoFiLinkPromise;
    }

    inflightTipMessageKoFiLinkPromise = supporterService.fetchPricing()
        .then((pricing) => {
            const koFiLink = normalizeKoFiLink(pricing.kofilink);
            cachedTipMessageKoFiLink = koFiLink;
            cachedTipMessageKoFiLinkAt = Date.now();
            return koFiLink;
        })
        .catch((error) => {
            console.warn('[supporter-pricing] Failed to fetch pricing:', error);
            return cachedTipMessageKoFiLink;
        })
        .finally(() => {
            inflightTipMessageKoFiLinkPromise = null;
        });

    return inflightTipMessageKoFiLinkPromise;
}
