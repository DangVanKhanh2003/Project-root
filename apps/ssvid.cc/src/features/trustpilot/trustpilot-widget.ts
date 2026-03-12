/**
 * Trustpilot Review Collector Widget
 * WHY: Show official Trustpilot embedded widget after successful downloads.
 * CONTRACT: Exposes show/hide/preload APIs called by widget-level-manager.
 *
 * Based on: ytmp3.gg/src/script/features/downloader/trustpilot-widget.js
 */

const TRUSTPILOT_SCRIPT_ID = 'trustpilot-bootstrap-script';
const TRUSTPILOT_WIDGET_ID = 'trustpilot-review-collector';
const TRUSTPILOT_WRAPPER_ID = 'trustpilot-widget-wrapper';
const TRUSTPILOT_REVIEW_URL = 'https://www.trustpilot.com/review/ssvid.cc';

let showWidgetTimeoutId: ReturnType<typeof setTimeout> | null = null;

// ============================================================
// SCRIPT LOADER
// ============================================================

function ensureTrustpilotScriptLoaded(): Promise<void> {
    if (
        (window as any).Trustpilot &&
        typeof (window as any).Trustpilot.loadFromElement === 'function'
    ) {
        return Promise.resolve();
    }

    const existingScript = document.getElementById(TRUSTPILOT_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
        if (existingScript.dataset.loaded === '1') {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            existingScript.addEventListener('load', () => resolve(), { once: true });
            existingScript.addEventListener('error', () => reject(new Error('Trustpilot script failed')), { once: true });
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.id = TRUSTPILOT_SCRIPT_ID;
        script.type = 'text/javascript';
        script.src = '//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
        script.async = true;
        script.onload = () => {
            script.dataset.loaded = '1';
            resolve();
        };
        script.onerror = () => reject(new Error('Trustpilot script failed'));
        document.head.appendChild(script);
    });
}

// ============================================================
// WIDGET DOM
// ============================================================

function ensureTrustpilotWidget(attachToDom = true): HTMLElement {
    let widget = document.getElementById(TRUSTPILOT_WIDGET_ID);
    if (!widget) {
        widget = document.createElement('div');
        widget.id = TRUSTPILOT_WIDGET_ID;
        widget.className = 'trustpilot-widget';
        widget.setAttribute('data-locale', 'en-US');
        widget.setAttribute('data-template-id', '56278e9abfbbba0bdcd568bc');
        widget.setAttribute('data-businessunit-id', '6998778492d37a2f7c7afeb6');
        widget.setAttribute('data-style-height', '52px');
        widget.setAttribute('data-style-width', '100%');
        widget.setAttribute('data-token', '28a35c2e-ddaa-47cf-8bd4-a08c016ed263');
        widget.innerHTML = `<a href="${TRUSTPILOT_REVIEW_URL}" target="_blank" rel="noopener">Trustpilot</a>`;
        widget.style.marginTop = '20px';

        if (attachToDom) {
            const fallbackHost =
                document.querySelector('.conversion-state-wrapper') ||
                document.getElementById('content-area') ||
                document.body;
            fallbackHost.appendChild(widget);
        }
    }

    attachTrustpilotClickTracking(widget);
    return widget;
}

function attachTrustpilotClickTracking(widget: HTMLElement): void {
    if (!widget || widget.dataset.clickTracked === '1') return;
    widget.dataset.clickTracked = '1';

    widget.addEventListener('click', async (event: Event) => {
        const target = event.target as HTMLElement;
        const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
        if (!anchor) return;

        try {
            const { logEvent } = await import('../../libs/firebase');
            logEvent('click_trustpilot_widget', {
                widget_id: TRUSTPILOT_WIDGET_ID,
                link_url: anchor.href || TRUSTPILOT_REVIEW_URL
            });
        } catch {
            // Silent fallback
        }
    });
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Show Trustpilot widget after successful download.
 * Placement: Inside .conversion-state-wrapper, after #action-container
 */
export function showTrustpilotWidget(): void {
    if (showWidgetTimeoutId) clearTimeout(showWidgetTimeoutId);
    showWidgetTimeoutId = null;

    showWidgetTimeoutId = setTimeout(() => {
        showWidgetTimeoutId = null;

        const widget = ensureTrustpilotWidget(false);

        // Ensure wrapper exists in DOM
        let wrapper = document.getElementById(TRUSTPILOT_WRAPPER_ID);
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = TRUSTPILOT_WRAPPER_ID;
            wrapper.style.width = '100%';
            wrapper.style.height = '52px';
            wrapper.style.overflow = 'hidden';

            // Insert inside conversion-state-wrapper, after action-container
            const conversionWrapper = document.querySelector('.conversion-state-wrapper');
            if (conversionWrapper) {
                conversionWrapper.appendChild(wrapper);
            } else {
                // Fallback
                const contentArea = document.getElementById('content-area');
                if (contentArea) {
                    contentArea.appendChild(wrapper);
                }
            }
        }

        // Attach widget to wrapper
        if (!wrapper.contains(widget)) {
            wrapper.appendChild(widget);
        }

        // Load and initialize Trustpilot
        ensureTrustpilotScriptLoaded()
            .then(() => {
                if (
                    (window as any).Trustpilot &&
                    typeof (window as any).Trustpilot.loadFromElement === 'function'
                ) {
                    (window as any).Trustpilot.loadFromElement(widget, true);
                }
            })
            .catch(() => {
                // Silent fallback - widget will show fallback link
            });
    }, 410);
}

/**
 * Hide and remove Trustpilot widget from DOM.
 */
export function hideTrustpilotWidget(): void {
    if (showWidgetTimeoutId) {
        clearTimeout(showWidgetTimeoutId);
        showWidgetTimeoutId = null;
    }

    const wrapper = document.getElementById(TRUSTPILOT_WRAPPER_ID);
    if (wrapper) wrapper.remove();

    const widget = document.getElementById(TRUSTPILOT_WIDGET_ID);
    if (widget) widget.remove();
}

/**
 * Preload Trustpilot resources (dns-prefetch + preconnect + script preload).
 * Call this early (e.g., after form submit) so widget loads instantly later.
 */
export function preloadTrustpilotWidget(): void {
    // DNS prefetch
    if (!document.querySelector('link[href*="widget.trustpilot.com"][rel="dns-prefetch"]')) {
        const dns = document.createElement('link');
        dns.rel = 'dns-prefetch';
        dns.href = '//widget.trustpilot.com';
        document.head.appendChild(dns);
    }

    // Preconnect
    if (!document.querySelector('link[href*="widget.trustpilot.com"][rel="preconnect"]')) {
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = 'https://widget.trustpilot.com';
        preconnect.crossOrigin = '';
        document.head.appendChild(preconnect);
    }

    // Preload script
    if (!document.querySelector('link[href*="tp.widget.bootstrap"][rel="preload"]')) {
        const preload = document.createElement('link');
        preload.rel = 'preload';
        preload.as = 'script';
        preload.href = '//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
        document.head.appendChild(preload);
    }
}
