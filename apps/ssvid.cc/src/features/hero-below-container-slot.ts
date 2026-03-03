const HERO_CONTAINER_SELECTOR = '.hero-container';
const HERO_SECTION_SELECTOR = '.hero-section';
const HERO_BELOW_CONTAINER_SLOT_CLASSES = ['container', 'hero-below-container-slot'];

type HeroBelowContainerSlotOptions = {
    className?: string;
    marginTop?: string;
    marginBottom?: string;
};

export function ensureHeroBelowContainerSlot(
    id: string,
    options: HeroBelowContainerSlotOptions = {}
): HTMLElement | null {
    const heroContainer = document.querySelector(HERO_CONTAINER_SELECTOR) as HTMLElement | null;
    if (!heroContainer) return null;

    const heroSection = heroContainer.closest(HERO_SECTION_SELECTOR) as HTMLElement | null;
    if (!heroSection) return null;

    let wrapper = document.getElementById(id) as HTMLElement | null;
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = id;
    }

    wrapper.classList.add(...HERO_BELOW_CONTAINER_SLOT_CLASSES);
    if (options.className) {
        wrapper.classList.add(...options.className.split(/\s+/).filter(Boolean));
    }
    wrapper.style.width = '100%';

    if (options.marginTop) {
        wrapper.style.marginTop = options.marginTop;
    } else {
        wrapper.style.removeProperty('margin-top');
    }

    if (options.marginBottom) {
        wrapper.style.marginBottom = options.marginBottom;
    } else {
        wrapper.style.removeProperty('margin-bottom');
    }

    if (wrapper.parentElement !== heroSection || wrapper.previousElementSibling !== heroContainer) {
        heroContainer.insertAdjacentElement('afterend', wrapper);
    }

    return wrapper;
}
