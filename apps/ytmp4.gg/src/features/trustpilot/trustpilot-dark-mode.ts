/**
 * Trustpilot Dark Mode Widget
 * WHY: Trustpilot's official embed doesn't support dark backgrounds well.
 * CONTRACT: Renders a custom "Review us on Trustpilot" button when dark theme is active.
 *
 * Based on: ytmp3.gg/src/script/features/downloader/trustpilot-dark-mode.js
 */

const TRUSTPILOT_REVIEW_URL = 'https://www.trustpilot.com/review/ytmp4.gg?utm_medium=trustbox&utm_source=TrustBoxReviewCollector';
const STYLE_ID = 'trustpilot-dark-mode-style';
const WIDGET_ID = 'trustpilot-dark-mode-widget';
const WIDGET_WRAPPER_ID = 'trustpilot-dark-widget-wrapper';
const CARD_WRAPPER_ID = 'trustpilot-dark-card-wrapper';

function ensureDarkModeStyles(): void {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        .tp-dark-host {
            width: 100%;
            display: flex;
            justify-content: center;
            background: rgba(0, 255, 0, 0.3); /* DEBUG: green bg to spot layout shift */
        }
        .tp-dark-shell {
            width: 100%;
            font-family: Inter, system-ui, sans-serif;
            display: flex;
            justify-content: center;
            border-radius: 8px;
        }
        .tp-review-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            height: 50px;
            padding: 0 18px;
            font-size: 16px;
            text-decoration: none;
            color: #ffffff;
            background: #262626;
            border: 2px solid #00b67a;
            border-radius: 4px;
            transition: all 0.2s ease;
            white-space: nowrap;
        }
        .tp-review-btn:hover {
            background: #00b67a;
            color: #ffffff;
        }
        .tp-star {
            color: #00b67a;
            font-size: 18px;
            line-height: 1;
        }
        .tp-review-btn:hover .tp-star {
            color: #ffffff;
        }
        @media (max-width: 768px) {
            .tp-review-btn {
                height: 40px;
                font-size: 14px;
                padding: 0 14px;
            }
        }
    `;

    document.head.appendChild(style);
}

function ensureDarkModeWidget(): HTMLElement {
    let widget = document.getElementById(WIDGET_ID);
    if (!widget) {
        widget = document.createElement('div');
        widget.id = WIDGET_ID;
        widget.className = 'tp-dark-shell';
        widget.innerHTML = `
            <a href="${TRUSTPILOT_REVIEW_URL}" class="tp-review-btn" target="_blank" rel="noopener noreferrer nofollow">
                <span class="tp-star">&#9733;</span>
                Review us on <strong>Trustpilot</strong>
            </a>
        `;

        const reviewBtn = widget.querySelector('.tp-review-btn');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', async () => {
                try {
                    const { logEvent } = await import('../../libs/firebase');
                    logEvent('click_trustpilot_widget', {
                        widget_id: WIDGET_ID,
                        link_url: TRUSTPILOT_REVIEW_URL
                    });
                } catch {
                    // Silent fallback
                }
            });
        }
    }

    return widget;
}

function ensureWrapper(wrapperId: string, marginTop: string): HTMLElement {
    let wrapper = document.getElementById(wrapperId);
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = wrapperId;
        wrapper.className = 'tp-dark-host';
        wrapper.style.marginTop = marginTop;
    }
    return wrapper;
}

/**
 * Show dark-mode Trustpilot widget inside .conversion-state-wrapper
 */
export function showDarkTrustpilotWidget(): void {
    ensureDarkModeStyles();
    const widget = ensureDarkModeWidget();
    const conversionWrapper = document.querySelector('.conversion-state-wrapper');
    if (!conversionWrapper) return;

    const wrapper = ensureWrapper(WIDGET_WRAPPER_ID, '20px');
    if (widget.parentNode !== wrapper) {
        wrapper.appendChild(widget);
    }

    const actionContainer = conversionWrapper.querySelector('#action-container');
    if (actionContainer && actionContainer.parentNode) {
        actionContainer.parentNode.insertBefore(wrapper, actionContainer.nextSibling);
    } else {
        conversionWrapper.appendChild(wrapper);
    }
}

/**
 * Show dark-mode Trustpilot card after an anchor element
 */
export function showDarkTrustpilotCard(anchorElement: HTMLElement | null): void {
    ensureDarkModeStyles();
    const widget = ensureDarkModeWidget();

    const wrapper = ensureWrapper(CARD_WRAPPER_ID, '10px');
    if (widget.parentNode !== wrapper) {
        wrapper.appendChild(widget);
    }

    if (anchorElement && anchorElement.parentNode) {
        if (wrapper.previousElementSibling !== anchorElement) {
            anchorElement.insertAdjacentElement('afterend', wrapper);
        }
    } else {
        const fallback = document.querySelector('.main-content-card');
        if (fallback) fallback.appendChild(wrapper);
    }
}

/**
 * Hide and remove all dark-mode Trustpilot DOM elements
 */
export function hideDarkTrustpilotWidget(): void {
    const widget = document.getElementById(WIDGET_ID);
    const wrapper = document.getElementById(WIDGET_WRAPPER_ID);
    const cardWrapper = document.getElementById(CARD_WRAPPER_ID);

    if (widget) widget.remove();
    if (wrapper) wrapper.remove();
    if (cardWrapper) cardWrapper.remove();
}
