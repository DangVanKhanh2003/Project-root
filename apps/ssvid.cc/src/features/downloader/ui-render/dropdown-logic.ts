import { LANGUAGES, type Language } from '../logic/data/languages';
import { logEvent } from '../../../libs/firebase';

interface AudioDropdownConfig {
    dropdownId?: string;
    hiddenInputId?: string;
}

/**
 * Initialize custom audio dropdown logic
 */
export function initAudioDropdown(config?: AudioDropdownConfig): void {
    const dropdownId = config?.dropdownId || 'audio-track-dropdown';
    const hiddenInputId = config?.hiddenInputId || 'audio-track-value';

    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement;
    const menu = dropdown.querySelector('.dropdown-menu') as HTMLElement;
    const optionsContainer = dropdown.querySelector('.dropdown-options') as HTMLElement;
    const searchInput = dropdown.querySelector('.dropdown-search input') as HTMLInputElement;
    const hiddenInput = document.getElementById(hiddenInputId) as HTMLInputElement;
    const selectedText = dropdown.querySelector('.selected-text') as HTMLElement;

    // New: wrapper for the dynamic icon
    const selectedIconContainer = dropdown.querySelector('.selected-icon') as HTMLElement;

    if (!trigger || !menu || !optionsContainer || !searchInput || !hiddenInput || !selectedIconContainer) return;

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
        // const flag = option.dataset.flag; // We'll look up from LANGUAGES data to be safe/clean

        if (code && name) {
            selectOption(code, name);
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
        // searchInput.focus();
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

    function selectOption(code: string, name: string) {
        logEvent('audio_track_change', { language_code: code, language_name: name });
        hiddenInput.value = code;
        selectedText.textContent = name;

        // Find the language object to get the flag
        const langData = LANGUAGES.find(l => l.code === code);
        if (langData) {
            // Update the icon
            // If it starts with <svg, it's the original/default icon
            // Otherwise, it's an image path
            if (langData.flag.trim().startsWith('<svg')) {
                selectedIconContainer.innerHTML = langData.flag;
            } else {
                // It's an image path (country flag)
                // Use style to match the size we want (e.g. 24x16 or similar to the list item)
                // The container .selected-icon might need flex centering if not already
                selectedIconContainer.innerHTML = `<img src="${langData.flag}" alt="${langData.name}" class="current-flag-img" style="width: 28px; height: 20px; object-fit: cover; border-radius: 2px;">`;
            }
        }

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

/**
 * Programmatically set the audio track
 * @param code - Language code to select
 * @param config - Optional config with custom element IDs
 */
export function setAudioTrack(code: string, config?: AudioDropdownConfig): void {
    const dropdownId = config?.dropdownId || 'audio-track-dropdown';
    const hiddenInputId = config?.hiddenInputId || 'audio-track-value';

    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    const optionsContainer = dropdown.querySelector('.dropdown-options') as HTMLElement;
    const hiddenInput = document.getElementById(hiddenInputId) as HTMLInputElement;
    const selectedText = dropdown.querySelector('.selected-text') as HTMLElement;
    const selectedIconContainer = dropdown.querySelector('.selected-icon') as HTMLElement;

    if (!optionsContainer || !hiddenInput || !selectedText || !selectedIconContainer) return;

    // Helper logic duplicated from internal selectOption to avoid major refactor
    // In a larger refactor, we'd extract this logic fully.

    hiddenInput.value = code;

    // Find the language object
    const langData = LANGUAGES.find(l => l.code === code);
    if (langData) {
        selectedText.textContent = langData.name;

        if (langData.flag.trim().startsWith('<svg')) {
            selectedIconContainer.innerHTML = langData.flag;
        } else {
            selectedIconContainer.innerHTML = `<img src="${langData.flag}" alt="${langData.name}" class="current-flag-img" style="width: 28px; height: 20px; object-fit: cover; border-radius: 2px;">`;
        }
    } else if (code === 'original') {
        // Fallback for 'original' if not found in list (though it should be)
        selectedText.textContent = "Original Audio"; // Default text
        // Reset icon if needed, but 'original' usually exists in LANGUAGES
    }

    // Highlight selected option
    const options = optionsContainer.querySelectorAll('.dropdown-option');
    options.forEach(opt => {
        if ((opt as HTMLElement).dataset.code === code) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });

    // Trigger change event
    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
}

