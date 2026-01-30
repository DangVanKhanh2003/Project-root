import { LANGUAGES, Language } from '../data/languages';

export function initAudioDropdown(): void {
    const dropdown = document.getElementById('audio-track-dropdown');
    if (!dropdown) return;

    const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement;
    if (trigger) trigger.setAttribute('title', 'Select available audio track from YouTube video');
    const menu = dropdown.querySelector('.dropdown-menu') as HTMLElement;
    const optionsContainer = dropdown.querySelector('.dropdown-options') as HTMLElement;
    const searchInput = dropdown.querySelector('.dropdown-search input') as HTMLInputElement;
    const hiddenInput = document.getElementById('audio-track-value') as HTMLInputElement;
    const selectedText = dropdown.querySelector('.selected-text') as HTMLElement;
    const selectedIconContainer = dropdown.querySelector('.selected-icon') as HTMLElement;

    if (!trigger || !menu || !optionsContainer || !searchInput || !hiddenInput || !selectedIconContainer) return;

    // Initial Render
    renderOptions(LANGUAGES);

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
        const query = (e.target as HTMLInputElement).value.toLowerCase();
        const filtered = LANGUAGES.filter(lang =>
            lang.name.toLowerCase().includes(query) ||
            lang.code.toLowerCase().includes(query)
        );
        renderOptions(filtered);
    });

    // Select Option Logic
    function selectOption(code: string, name: string) {
        hiddenInput.value = code;
        selectedText.textContent = name;

        // Update Icon
        const lang = LANGUAGES.find(l => l.code === code);
        if (lang) {
            // Check if it's an SVG string or an image path
            if (lang.flag.startsWith('<svg') || lang.flag.startsWith('<g')) {
                // For "Original" or other SVG content
                if (lang.code === 'original') {
                    // Keep the original icon structure if needed, or just replace innerHTML
                    selectedIconContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="16" viewBox="0 0 44 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-audio-language-horizontal"><g fill="currentColor" stroke="none" transform="translate(-2 0)"><path d="M19.4 .2C19.29 .27 19.20 .37 19.13 .49C19.07 .60 19.02 .72 19.01 .85C18.99 .98 18.99 1.12 19.03 1.24C19.06 1.37 19.12 1.49 19.2 1.6L20.8 .4C20.64 .18 20.40 .04 20.14 .01C19.87 -0.02 19.61 .04 19.4 .2ZM20.8 .4L20 1L19.2 1.59C20.37 3.16 21.00 5.06 21.00 7.01C20.99 8.97 20.35 10.87 19.17 12.42C19.01 12.64 18.94 12.90 18.98 13.16C19.02 13.43 19.16 13.66 19.37 13.83C19.58 13.99 19.84 14.05 20.11 14.02C20.37 13.98 20.61 13.84 20.77 13.63C22.21 11.73 22.99 9.41 23 7.02C23.00 4.63 22.23 2.31 20.8 .4ZM10 2C8.67 2 7.40 2.52 6.46 3.46C5.52 4.40 5 5.67 5 7C5 8.32 5.52 9.59 6.46 10.53C7.40 11.47 8.67 12 10 12C11.32 12 12.59 11.47 13.53 10.53C14.47 9.59 15 8.32 15 7C15 5.67 14.47 4.40 13.53 3.46C12.59 2.52 11.32 2 10 2ZM16.17 2.29C15.97 2.48 15.86 2.73 15.86 2.99C15.85 3.26 15.95 3.51 16.14 3.71C16.98 4.58 17.44 5.68 17.49 6.80L17.5 7.02C17.49 8.22 17.01 9.40 16.10 10.32C15.92 10.51 15.83 10.77 15.83 11.03C15.84 11.29 15.95 11.53 16.13 11.71C16.32 11.90 16.57 12.00 16.83 12.00C17.09 12.00 17.34 11.90 17.53 11.72C18.78 10.44 19.49 8.77 19.5 7.03L19.49 6.71C19.42 5.09 18.74 3.53 17.58 2.32C17.49 2.23 17.38 2.15 17.26 2.10C17.14 2.05 17.01 2.02 16.88 2.01C16.75 2.01 16.62 2.03 16.49 2.08C16.37 2.13 16.26 2.20 16.17 2.29ZM10.39 13.01L10 13C8.01 12.99 6.10 13.73 4.63 15.06L4.34 15.34C3.60 16.08 3.01 16.96 2.60 17.93C2.20 18.90 1.99 19.94 2 21C2 21.26 2.10 21.51 2.29 21.70C2.48 21.89 2.73 22 3 22C3.26 22 3.51 21.89 3.70 21.70C3.89 21.51 4 21.26 4 21C4.00 19.40 4.63 17.88 5.75 16.75L5.97 16.55C7.07 15.55 8.51 15 10 15L10.29 15.00C11.78 15.08 13.18 15.70 14.24 16.75L14.44 16.97C15.44 18.07 16 19.51 16 21C16 21.26 16.10 21.51 16.29 21.70C16.48 21.89 16.73 22 17 22C17.26 22 17.51 21.89 17.70 21.70C17.89 21.51 18 21.26 18 21C18.00 19.01 17.26 17.10 15.93 15.63L15.65 15.34C14.25 13.93 12.37 13.10 10.39 13.01Z"></path></g><g transform="translate(23.8 1.6) scale(0.75)"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></g></svg>`;
                } else {
                    selectedIconContainer.innerHTML = lang.flag;
                }
            } else {
                selectedIconContainer.innerHTML = `<img src="${lang.flag}" alt="${lang.name}" width="24" height="16">`;
            }
        }

        // Highlight selected
        const options = optionsContainer.querySelectorAll('.dropdown-option');
        options.forEach(opt => {
            if ((opt as HTMLElement).dataset.value === code) {
                opt.classList.add('selected');
                opt.scrollIntoView({ block: 'nearest' });
            } else {
                opt.classList.remove('selected');
            }
        });

        closeDropdown();

        // Dispatch change event to notify other components (e.g. content-renderer)
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

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
        dropdown.classList.add('active'); // Helpful for mobile styling
        trigger.setAttribute('aria-expanded', 'true');
        // searchInput.focus();
    }

    function closeDropdown() {
        menu.classList.add('hidden');
        dropdown.classList.remove('active');
        trigger.setAttribute('aria-expanded', 'false');
    }

    function renderOptions(items: Language[]) {
        optionsContainer.innerHTML = items.map(lang => {
            const isSelected = hiddenInput.value === lang.code;
            let iconHtml = '';

            if (lang.flag.startsWith('<svg') || lang.flag.startsWith('<g')) {
                if (lang.code === 'original') {
                    // Full SVG for list (same as trigger)
                    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 44 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-audio-language-horizontal"><g fill="currentColor" stroke="none" transform="translate(-2 0)"><path d="M19.4 .2C19.29 .27 19.20 .37 19.13 .49C19.07 .60 19.02 .72 19.01 .85C18.99 .98 18.99 1.12 19.03 1.24C19.06 1.37 19.12 1.49 19.2 1.6L20.8 .4C20.64 .18 20.40 .04 20.14 .01C19.87 -0.02 19.61 .04 19.4 .2ZM20.8 .4L20 1L19.2 1.59C20.37 3.16 21.00 5.06 21.00 7.01C20.99 8.97 20.35 10.87 19.17 12.42C19.01 12.64 18.94 12.90 18.98 13.16C19.02 13.43 19.16 13.66 19.37 13.83C19.58 13.99 19.84 14.05 20.11 14.02C20.37 13.98 20.61 13.84 20.77 13.63C22.21 11.73 22.99 9.41 23 7.02C23.00 4.63 22.23 2.31 20.8 .4ZM10 2C8.67 2 7.40 2.52 6.46 3.46C5.52 4.40 5 5.67 5 7C5 8.32 5.52 9.59 6.46 10.53C7.40 11.47 8.67 12 10 12C11.32 12 12.59 11.47 13.53 10.53C14.47 9.59 15 8.32 15 7C15 5.67 14.47 4.40 13.53 3.46C12.59 2.52 11.32 2 10 2ZM16.17 2.29C15.97 2.48 15.86 2.73 15.86 2.99C15.85 3.26 15.95 3.51 16.14 3.71C16.98 4.58 17.44 5.68 17.49 6.80L17.5 7.02C17.49 8.22 17.01 9.40 16.10 10.32C15.92 10.51 15.83 10.77 15.83 11.03C15.84 11.29 15.95 11.53 16.13 11.71C16.32 11.90 16.57 12.00 16.83 12.00C17.09 12.00 17.34 11.90 17.53 11.72C18.78 10.44 19.49 8.77 19.5 7.03L19.49 6.71C19.42 5.09 18.74 3.53 17.58 2.32C17.49 2.23 17.38 2.15 17.26 2.10C17.14 2.05 17.01 2.02 16.88 2.01C16.75 2.01 16.62 2.03 16.49 2.08C16.37 2.13 16.26 2.20 16.17 2.29ZM10.39 13.01L10 13C8.01 12.99 6.10 13.73 4.63 15.06L4.34 15.34C3.60 16.08 3.01 16.96 2.60 17.93C2.20 18.90 1.99 19.94 2 21C2 21.26 2.10 21.51 2.29 21.70C2.48 21.89 2.73 22 3 22C3.26 22 3.51 21.89 3.70 21.70C3.89 21.51 4 21.26 4 21C4.00 19.40 4.63 17.88 5.75 16.75L5.97 16.55C7.07 15.55 8.51 15 10 15L10.29 15.00C11.78 15.08 13.18 15.70 14.24 16.75L14.44 16.97C15.44 18.07 16 19.51 16 21C16 21.26 16.10 21.51 16.29 21.70C16.48 21.89 16.73 22 17 22C17.26 22 17.51 21.89 17.70 21.70C17.89 21.51 18 21.26 18 21C18.00 19.01 17.26 17.10 15.93 15.63L15.65 15.34C14.25 13.93 12.37 13.10 10.39 13.01Z"></path></g><g transform="translate(23.8 1.6) scale(0.75)"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></g></svg>`;
                } else {
                    iconHtml = lang.flag; // Might need scaling
                }
            } else {
                iconHtml = `<img src="${lang.flag}" alt="${lang.name}" width="20" height="14">`;
            }

            return `
                <div class="dropdown-option ${isSelected ? 'selected' : ''}" data-value="${lang.code}" role="option" aria-selected="${isSelected}">
                    <span class="option-icon" style="width: 20px; display: flex; align-items: center;">${iconHtml}</span>
                    <span class="option-text">${lang.name}</span>
                </div>
            `;
        }).join('');

        // Re-attach listeners to new options
        optionsContainer.querySelectorAll('.dropdown-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                const code = (opt as HTMLElement).dataset.value!;
                const name = (opt as HTMLElement).querySelector('.option-text')!.textContent!;
                selectOption(code, name);
            });
        });
    }
}
