/**
 * Supporter Tag Badge
 * Appends a badge image next to target element (e.g. header logo) for Level 3+ users.
 * Ported from: ytmp3.gg/src/script/features/tag-supporter-user.js
 */

let containerEl: HTMLElement | null = null;
let styleInjected = false;

function ensureStyles(): void {
    if (styleInjected) return;
    const style = document.createElement('style');
    style.setAttribute('data-supporter-tag-style', 'true');
    style.textContent = `
        .supporter-tag-img {
            display: block;
            width: auto;
            height: 65px;
        }

        .supporter-tag-tooltip {
            visibility: hidden;
            width: 220px;
            background-color: #333;
            color: #fff;
            text-align: center;
            border-radius: 6px;
            padding: 8px 12px;
            position: absolute;
            z-index: 1000;
            top: 110%;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0;
            transition: opacity 0.3s, visibility 0.3s;
            font-size: 13px;
            line-height: 1.4;
            font-family: inherit;
            pointer-events: none;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .supporter-tag-tooltip::after {
            content: "";
            position: absolute;
            bottom: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: transparent transparent #333 transparent;
        }

        .supporter-tag:hover .supporter-tag-tooltip {
            visibility: visible;
            opacity: 1;
        }

        @media (max-width: 850px) {
            .supporter-tag-img {
                height: 50px;
            }
        }
    `;
    document.head.appendChild(style);
    styleInjected = true;
}

/**
 * Initialize the supporter badge inside a target element.
 * @param targetSelector - CSS selector for the target container (e.g. '.header-logo')
 */
export function init(targetSelector: string): HTMLElement | null {
    if (!targetSelector) return null;

    if (containerEl) {
        const target = document.querySelector(targetSelector);
        if (target && !target.contains(containerEl)) {
            target.appendChild(containerEl);
        }
        return containerEl;
    }

    const targetEl = document.querySelector(targetSelector);
    if (!targetEl) return null;

    ensureStyles();

    const el = targetEl as HTMLElement;
    if (!el.style.display && window.getComputedStyle(el).display !== 'flex') {
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.gap = '6px';
    }

    const container = document.createElement('div');
    container.className = 'supporter-tag';
    container.style.display = 'none';
    container.style.marginLeft = '8px';
    container.style.cursor = 'pointer';
    container.style.position = 'relative';

    const tooltip = document.createElement('div');
    tooltip.className = 'supporter-tag-tooltip';
    tooltip.textContent = 'A badge for users who support and sustain the site';
    container.appendChild(tooltip);

    const img = document.createElement('img');
    img.className = 'supporter-tag-img';
    img.src = '/images/tag-supporter.png';
    img.alt = 'Supporter badge';
    container.appendChild(img);

    containerEl = container;
    targetEl.appendChild(containerEl);

    return containerEl;
}

/** Show the supporter badge. */
export function show(): void {
    if (!containerEl) return;
    containerEl.style.display = 'block';
}

/** Hide the supporter badge. */
export function hide(): void {
    if (!containerEl) return;
    containerEl.style.display = 'none';
}
