const LICENSE_STORAGE_KEY = 'ezconv:license_key';
const LICENSE_EVENT_NAME = 'ezconv:license-key-changed';

export interface LicenseKeyChangeDetail {
    key: string | null;
}

declare global {
    interface DocumentEventMap {
        'ezconv:license-key-changed': CustomEvent<LicenseKeyChangeDetail>;
    }
}

function normalizeLicenseKey(value: string | null | undefined): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized ? normalized : null;
}

function dispatchLicenseKeyChanged(key: string | null): void {
    if (typeof document === 'undefined') return;

    document.dispatchEvent(new CustomEvent(LICENSE_EVENT_NAME, {
        detail: { key }
    }));
}

export function getLicenseStorageKey(): string {
    return LICENSE_STORAGE_KEY;
}

export function getStoredLicenseKey(): string | null {
    try {
        return normalizeLicenseKey(localStorage.getItem(LICENSE_STORAGE_KEY));
    } catch {
        return null;
    }
}

export function hasStoredLicenseKey(): boolean {
    return getStoredLicenseKey() !== null;
}

export function saveLicenseKey(key: string): string | null {
    const normalized = normalizeLicenseKey(key);
    if (!normalized) {
        clearStoredLicenseKey();
        return null;
    }

    try {
        localStorage.setItem(LICENSE_STORAGE_KEY, normalized);
    } catch {
        return null;
    }

    dispatchLicenseKeyChanged(normalized);
    return normalized;
}

export function clearStoredLicenseKey(): void {
    try {
        localStorage.removeItem(LICENSE_STORAGE_KEY);
    } catch {
        // localStorage unavailable
    }

    dispatchLicenseKeyChanged(null);
}
