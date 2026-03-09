const HERO_FEATURE_LINKS_SELECTOR = '.hero-feature-links-wrap';

function getHeroFeatureLinkWrappers(): NodeListOf<HTMLElement> {
    return document.querySelectorAll<HTMLElement>(HERO_FEATURE_LINKS_SELECTOR);
}

export function initHeroFeatureLinks(): void {
    const mobileButtons = document.querySelectorAll<HTMLButtonElement>(
        '.hero-feature-links-mobile .hero-feature-link-mobile[data-href]'
    );

    mobileButtons.forEach((button) => {
        if (button.dataset.bound === '1') return;
        button.dataset.bound = '1';

        button.addEventListener('click', () => {
            const targetUrl = button.dataset.href?.trim();
            if (!targetUrl) return;
            window.location.assign(targetUrl);
        });
    });
}

export function hideHeroFeatureLinks(): void {
    getHeroFeatureLinkWrappers().forEach((wrapper) => {
        wrapper.classList.add('hidden');
        wrapper.setAttribute('aria-hidden', 'true');
    });
}

export function showHeroFeatureLinks(): void {
    getHeroFeatureLinkWrappers().forEach((wrapper) => {
        wrapper.classList.remove('hidden');
        wrapper.removeAttribute('aria-hidden');
    });
}
