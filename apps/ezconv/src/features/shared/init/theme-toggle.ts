/**
 * Theme Toggle Controller
 * Manages light/dark theme switching with localStorage persistence.
 * Default: light theme.
 */

const THEME_KEY = 'ezconv-theme';

function getStoredTheme(): string | null {
    try {
        return localStorage.getItem(THEME_KEY);
    } catch {
        return null;
    }
}

function setTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme);
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch {
        // localStorage unavailable
    }
    updateToggleIcons(theme);
}

function updateToggleIcons(theme: string): void {
    const toggles = document.querySelectorAll('.theme-toggle-btn');
    toggles.forEach(btn => {
        const sunIcon = btn.querySelector('.theme-icon--sun') as HTMLElement;
        const moonIcon = btn.querySelector('.theme-icon--moon') as HTMLElement;
        if (sunIcon && moonIcon) {
            if (theme === 'dark') {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
            } else {
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
            }
        }
    });
}

export function initThemeToggle(): void {
    // Apply stored theme or default to light
    const stored = getStoredTheme();
    const theme = (stored === 'dark') ? 'dark' : 'light';
    setTheme(theme);

    // Bind toggle buttons
    const toggles = document.querySelectorAll<HTMLButtonElement>('.theme-toggle-btn');
    toggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            setTheme(next);
        });
    });
}
