import { LANGUAGES, Language } from '../data/languages';

/**
 * Initialize custom audio dropdown logic
 * Refactored to match ytmp3.my logic + event delegation
 */
export function initAudioDropdown(): void {
    const dropdown = document.getElementById('audio-track-dropdown');
    if (!dropdown) return;

    const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement;

    // Tooltip setup (specific to 4kvideopro)
    if (trigger) {
        trigger.removeAttribute('title');
        trigger.setAttribute('data-tooltip', 'Select available audio track from YouTube video');
        if (!trigger.querySelector('.custom-tooltip')) {
            const tooltipSpan = document.createElement('span');
            tooltipSpan.className = 'custom-tooltip';
            tooltipSpan.textContent = 'Select available audio track from YouTube video';
            trigger.appendChild(tooltipSpan);
        }
    }

    const menu = dropdown.querySelector('.dropdown-menu') as HTMLElement;
    const optionsContainer = dropdown.querySelector('.dropdown-options') as HTMLElement;
    const searchInput = dropdown.querySelector('.dropdown-search input') as HTMLInputElement;
    const hiddenInput = document.getElementById('audio-track-value') as HTMLInputElement;
    const selectedText = dropdown.querySelector('.selected-text') as HTMLElement;
    const selectedIconContainer = dropdown.querySelector('.selected-icon') as HTMLElement;

    if (!trigger || !menu || !optionsContainer || !searchInput || !hiddenInput || !selectedIconContainer) return;

    // Render initial options
    renderOptions(LANGUAGES);

    // Initialize Custom Tooltip
    initCustomTooltips(trigger);

    // Toggle Dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target as Node)) {
            closeDropdown();
        }
    });

    // Search Functionality
    searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value.toLowerCase().trim();
        const filtered = LANGUAGES.filter(lang =>
            lang.name.toLowerCase().includes(query) ||
            lang.code.toLowerCase().includes(query)
        );
        renderOptions(filtered);
    });

    // Event Delegation for Options (More robust)
    optionsContainer.addEventListener('click', (e) => {
        const option = (e.target as HTMLElement).closest('.dropdown-option') as HTMLElement;
        if (!option) return;

        const code = option.dataset.code;
        const name = option.dataset.name;

        if (code && name) {
            selectOption(code, name);
            closeDropdown();
        }
    });

    // Keyboard navigation
    dropdown.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDropdown();
        }
    });

    // FUNCTIONS

    function toggleDropdown() {
        const isHidden = menu.classList.contains('hidden');
        if (isHidden) {
            openDropdown();
        } else {
            closeDropdown();
        }
    }

    function openDropdown() {
        menu.classList.remove('hidden');
        dropdown.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
        menu.classList.add('hidden');
        dropdown.classList.remove('active');
        trigger.setAttribute('aria-expanded', 'false');
        // Clear search
        if (searchInput.value) {
            searchInput.value = '';
            renderOptions(LANGUAGES);
        }
    }

    function selectOption(code: string, name: string) {
        hiddenInput.value = code;
        selectedText.textContent = name;

        // Update Icon
        const lang = LANGUAGES.find(l => l.code === code);
        if (lang) {
            if (lang.flag.trim().startsWith('<svg') || lang.flag.trim().startsWith('<g')) {
                selectedIconContainer.innerHTML = lang.flag;
            } else {
                selectedIconContainer.innerHTML = `<img src="${lang.flag}" alt="${lang.name}" class="current-flag-img" style="width: 28px; height: 20px; object-fit: cover; border-radius: 2px;">`;
            }
        }

        // Highlight selected
        const options = optionsContainer.querySelectorAll('.dropdown-option');
        options.forEach(opt => {
            if ((opt as HTMLElement).dataset.code === code) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });

        // Dispatch change event
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function renderOptions(items: Language[]) {
        if (items.length === 0) {
            optionsContainer.innerHTML = '<div class="dropdown-option" style="cursor: default; color: var(--text-muted); padding: 8px 12px;">No results found</div>';
            return;
        }

        const currentVal = hiddenInput.value;

        optionsContainer.innerHTML = items.map(lang => {
            const isSelected = currentVal === lang.code;
            let iconHtml = '';

            // Handle SVG vs Image flags
            if (lang.flag.trim().startsWith('<svg') || lang.flag.trim().startsWith('<g')) {
                // If it's the "Original" icon or similar SVG
                if (lang.code === 'original') {
                    // Use the full SVG for consistent sizing
                    iconHtml = lang.flag;
                } else {
                    iconHtml = lang.flag;
                }
            } else {
                // Image flag
                iconHtml = `<img src="${lang.flag}" alt="${lang.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;">`;
            }

            return `
            <div class="dropdown-option ${isSelected ? 'selected' : ''}" 
                 data-code="${lang.code}" 
                 data-name="${lang.name}"
                 role="option"
                 aria-selected="${isSelected}">
                <div class="flag-wrapper" style="width: 24px; height: 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 2px; background: rgba(255,255,255,0.05);">
                    ${iconHtml}
                </div>
                <!-- Add margin/gap via style or class if CSS .dropdown-option gap doesn't apply -->
                <span class="name" style="margin-left: 10px;">${lang.name}</span>
            </div>`;
        }).join('');
    }
}

/**
 * Initialize custom tooltip with delay
 */
function initCustomTooltips(element: HTMLElement): void {
    let tooltipTimer: number | null = null;

    element.addEventListener('mouseenter', () => {
        tooltipTimer = window.setTimeout(() => {
            element.classList.add('show-tooltip');
        }, 500); // 0.5s delay
    });

    element.addEventListener('mouseleave', () => {
        if (tooltipTimer) {
            clearTimeout(tooltipTimer);
            tooltipTimer = null;
        }
        element.classList.remove('show-tooltip');
    });
}
