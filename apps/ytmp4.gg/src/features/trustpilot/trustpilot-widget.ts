/**
 * Trustpilot Review Collector Widget
 * WHY: Show official Trustpilot embedded widget after successful downloads.
 * CONTRACT: Exposes show/hide/preload APIs called by widget-level-manager.
 *
 * Based on: ytmp3.gg/src/script/features/downloader/trustpilot-widget.js
 */

import {
    showDarkTrustpilotWidget,
    showDarkTrustpilotCard,
    hideDarkTrustpilotWidget
} from './trustpilot-dark-mode';

const TRUSTPILOT_SCRIPT_ID = 'trustpilot-bootstrap-script';
const TRUSTPILOT_WIDGET_ID = 'trustpilot-review-collector';
const TRUSTPILOT_WRAPPER_ID = 'trustpilot-widget-wrapper';
const TRUSTPILOT_CARD_WRAPPER_ID = 'trustpilot-card-wrapper';
const TRUSTPILOT_REVIEW_URL = 'https://www.trustpilot.com/review/ytmp4.gg?utm_medium=trustbox&utm_source=TrustBoxReviewCollector';
const THEME_DARK = 'dark';

let showWidgetTimeoutId: ReturnType<typeof setTimeout> | null = null;
let showCardTimeoutId: ReturnType<typeof setTimeout> | null = null;

function isDarkThemeEnabled(): boolean {
    return document.documentElement.getAttribute('data-theme') === THEME_DARK;
}

function removeLightTrustpilotDom(): void {
    const widget = document.getElementById(TRUSTPILOT_WIDGET_ID);
    const wrapper = document.getElementById(TRUSTPILOT_WRAPPER_ID);
    const cardWrapper = document.getElementById(TRUSTPILOT_CARD_WRAPPER_ID);
    if (widget) widget.remove();
    if (wrapper) wrapper.remove();
    if (cardWrapper) cardWrapper.remove();
}

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
        widget.innerHTML = `<a href="${TRUSTPILOT_REVIEW_URL}" target="_blank" rel="noopener nofollow">Trustpilot</a>`;
        widget.style.marginTop = '20px';

        if (attachToDom) {
            const fallbackHost =
                document.querySelector('.conversion-state-wrapper') ||
                document.querySelector('.main-content-card') ||
                document.getElementById('content-area') ||
                document.body;
            fallbackHost!.appendChild(widget);
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
 * Show Trustpilot Widget (afterDownload, level 1 only)
 * Placement: Inside .conversion-state-wrapper, after #action-container
 */
export function showTrustpilotWidget(): void {
    if (showWidgetTimeoutId) clearTimeout(showWidgetTimeoutId);
    if (showCardTimeoutId) clearTimeout(showCardTimeoutId);
    showWidgetTimeoutId = null;
    showCardTimeoutId = null;

    showWidgetTimeoutId = setTimeout(() => {
        showWidgetTimeoutId = null;
        if (isDarkThemeEnabled()) {
            removeLightTrustpilotDom();
            showDarkTrustpilotWidget();
            return;
        }

        hideDarkTrustpilotWidget();
        const widget = ensureTrustpilotWidget();
        const conversionWrapper = document.querySelector('.conversion-state-wrapper');
        if (!conversionWrapper) return;

        // Create or get wrapper with fixed height to prevent layout shift
        let wrapper = document.getElementById(TRUSTPILOT_WRAPPER_ID);
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = TRUSTPILOT_WRAPPER_ID;
            wrapper.style.height = '52px';
            wrapper.style.width = '100%';
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'center';
            wrapper.style.marginTop = '20px';
        }

        // Move widget into wrapper
        if (widget.parentNode !== wrapper) {
            widget.style.marginTop = '0';
            wrapper.appendChild(widget);
        }

        // Append at the end of .conversion-state-wrapper
        // min-height on the wrapper reserves space before trustpilot is injected
        if (wrapper.parentNode !== conversionWrapper) {
            conversionWrapper.appendChild(wrapper);
        }

        widget.style.display = 'block';

        ensureTrustpilotScriptLoaded()
            .then(() => {
                if ((window as any).Trustpilot && typeof (window as any).Trustpilot.loadFromElement === 'function') {
                    (window as any).Trustpilot.loadFromElement(widget, true);
                }
            })
            .catch(() => { });
    }, 410);
}

/**
 * Show Trustpilot Card (afterSubmit, level 2/3/supporter)
 * Placement: After specific anchor element (Supporter Banner or other widget)
 */
export function showTrustpilotCard(anchorElement: HTMLElement | null): void {
    if (showCardTimeoutId) clearTimeout(showCardTimeoutId);
    if (showWidgetTimeoutId) clearTimeout(showWidgetTimeoutId);
    showCardTimeoutId = null;
    showWidgetTimeoutId = null;

    if (isDarkThemeEnabled()) {
        removeLightTrustpilotDom();
        showDarkTrustpilotCard(anchorElement);
        return;
    }

    hideDarkTrustpilotWidget();
    const widget = ensureTrustpilotWidget();

    // Create or get wrapper with fixed height
    let wrapper = document.getElementById(TRUSTPILOT_CARD_WRAPPER_ID);
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = TRUSTPILOT_CARD_WRAPPER_ID;
        wrapper.style.height = '52px';
        wrapper.style.width = '100%';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        wrapper.style.marginTop = '10px';
    }

    // Move widget into wrapper
    if (widget.parentNode !== wrapper) {
        widget.style.marginTop = '0';
        wrapper.appendChild(widget);
    }

    // Place wrapper after anchor if provided
    if (anchorElement && anchorElement.parentNode) {
        if (wrapper.previousElementSibling !== anchorElement) {
            anchorElement.insertAdjacentElement('afterend', wrapper);
        }
    } else {
        // Fallback
        const fallback = document.querySelector('.main-content-card');
        if (fallback) fallback.appendChild(wrapper);
    }

    widget.style.display = 'block';

    ensureTrustpilotScriptLoaded()
        .then(() => {
            if ((window as any).Trustpilot && typeof (window as any).Trustpilot.loadFromElement === 'function') {
                (window as any).Trustpilot.loadFromElement(widget, true);
            }
        })
        .catch(() => { });
}

function ensureTrustpilotLinksPreloaded(): void {
    const head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return;

    const links: Array<{ rel: string; href: string; crossorigin?: string }> = [
        { rel: 'dns-prefetch', href: '//widget.trustpilot.com' },
        { rel: 'preconnect', href: 'https://widget.trustpilot.com', crossorigin: '' },
        { rel: 'dns-prefetch', href: '//www.trustpilot.com' },
        { rel: 'preconnect', href: 'https://www.trustpilot.com', crossorigin: '' }
    ];

    links.forEach(({ rel, href, crossorigin }) => {
        const selector = `link[rel="${rel}"][href="${href}"]`;
        if (document.querySelector(selector)) return;
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        if (crossorigin !== undefined) {
            link.setAttribute('crossorigin', crossorigin);
        }
        head.appendChild(link);
    });
}

/**
 * Preload Trustpilot widget + bootstrap script ahead of display.
 * Call on first form submit so widget loads instantly when needed.
 */
export function preloadTrustpilotWidget(): void {
    ensureTrustpilotLinksPreloaded();
    ensureTrustpilotScriptLoaded().catch(() => { });
}

/**
 * Hide and remove all Trustpilot widget DOM elements.
 */
export function hideTrustpilotWidget(): void {
    const widget = document.getElementById(TRUSTPILOT_WIDGET_ID);
    const wrapper = document.getElementById(TRUSTPILOT_WRAPPER_ID);
    const cardWrapper = document.getElementById(TRUSTPILOT_CARD_WRAPPER_ID);

    if (showWidgetTimeoutId) {
        clearTimeout(showWidgetTimeoutId);
        showWidgetTimeoutId = null;
    }
    if (showCardTimeoutId) {
        clearTimeout(showCardTimeoutId);
        showCardTimeoutId = null;
    }

    if (widget) widget.remove();
    if (wrapper) wrapper.remove();
    if (cardWrapper) cardWrapper.remove();
    hideDarkTrustpilotWidget();
}
