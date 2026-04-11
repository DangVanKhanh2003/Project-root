/**
 * Shared scroll behavior utilities.
 * Follows ytmp3.gg style: native smooth scroll + reduced-motion support.
 */

const MOBILE_BREAKPOINT = 768;
let pendingRafId: number | null = null;

export function isMobileViewport(): boolean {
    return window.innerWidth <= MOBILE_BREAKPOINT;
}

export function performScroll(position: number): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
        top: Math.max(position, 0),
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
}

export function scrollToElementWithOffset(target: Element, offset: number): void {
    // Avoid stacked scroll calls when UI updates rapidly.
    if (pendingRafId !== null) {
        cancelAnimationFrame(pendingRafId);
        pendingRafId = null;
    }

    // Close keyboard/focus first to prevent viewport jump on mobile.
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }

    // Delay to let keyboard fully close and viewport settle before scrolling.
    setTimeout(() => {
        pendingRafId = requestAnimationFrame(() => {
            pendingRafId = null;
            const targetTop = target.getBoundingClientRect().top + window.pageYOffset - offset;
            performScroll(targetTop);
        });
    }, 350);
}
