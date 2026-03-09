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
