import { LANGUAGES, type Language } from '../data/languages';

/**
 * Initialize custom audio dropdown logic
 */
export function initAudioDropdown(): void {
    const dropdown = document.getElementById('audio-track-dropdown');
    if (!dropdown) return;

    const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement;
    const menu = dropdown.querySelector('.dropdown-menu') as HTMLElement;
    const optionsContainer = dropdown.querySelector('.dropdown-options') as HTMLElement;
    const searchInput = dropdown.querySelector('.dropdown-search input') as HTMLInputElement;
    const hiddenInput = document.getElementById('audio-track-value') as HTMLInputElement;
    const selectedText = dropdown.querySelector('.selected-text') as HTMLElement;
    const selectedFlag = dropdown.querySelector('.selected-flag') as HTMLElement;

    if (!trigger || !menu || !optionsContainer || !searchInput || !hiddenInput) return;

    // Render initial options
    renderOptions(LANGUAGES);

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent closing immediately
        toggleDropdown();
    });

    // Handle outside click to close
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target as Node)) {
            closeDropdown();
        }
    });

    // Handle search input
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        const filtered = LANGUAGES.filter(lang =>
            lang.name.toLowerCase().includes(query) ||
            lang.code.toLowerCase().includes(query)
        );
        renderOptions(filtered);
    });

    // Delegate click for options
    optionsContainer.addEventListener('click', (e) => {
        const option = (e.target as HTMLElement).closest('.dropdown-option') as HTMLElement;
        if (!option) return;

        const code = option.dataset.code;
        const name = option.dataset.name;
        const flag = option.dataset.flag;

        if (code && name && flag) {
            selectOption(code, name, flag);
            closeDropdown();
        }
    });

    // Keyboard navigation for accessibility
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
        searchInput.focus();
    }

    function closeDropdown() {
        menu.classList.add('hidden');
        dropdown.classList.remove('active');
        trigger.setAttribute('aria-expanded', 'false');
        // Clear search input and restore full list
        if (searchInput.value) {
            searchInput.value = '';
            renderOptions(LANGUAGES);
        }
    }

    function selectOption(code: string, name: string, _flag: string) {
        hiddenInput.value = code;
        selectedText.textContent = name;
        // Flag hidden in trigger as per new design
        // selectedFlag.textContent = flag; 

        // Highlight selected option
        const options = optionsContainer.querySelectorAll('.dropdown-option');
        options.forEach(opt => {
            if ((opt as HTMLElement).dataset.code === code) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });

        // Trigger change event if needed for other listeners
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function renderOptions(items: Language[]) {
        if (items.length === 0) {
            optionsContainer.innerHTML = '<div class="dropdown-option" style="cursor: default; color: var(--text-muted);">No results found</div>';
            return;
        }

        const currentVal = hiddenInput.value;

        optionsContainer.innerHTML = items.map(lang => {
            const isOriginal = lang.code === 'original';
            const flagHtml = isOriginal
                ? lang.flag
                : `<img src="${lang.flag}" alt="${lang.name}" decoding="async" style="width: 100%; height: 100%; object-fit: cover; display: block;">`;

            return `
            <div class="dropdown-option ${lang.code === currentVal ? 'selected' : ''}" 
                 data-code="${lang.code}" 
                 data-name="${lang.name}"
                 data-flag="${isOriginal ? 'original' : lang.flag}"
                 role="option"
                 aria-selected="${lang.code === currentVal}">
                <div class="flag-wrapper" style="width: 24px; height: 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 2px; background: rgba(255,255,255,0.05);">
                    ${flagHtml}
                </div>
                <span class="name">${lang.name}</span>
            </div>`;
        }).join('');
    }
}
