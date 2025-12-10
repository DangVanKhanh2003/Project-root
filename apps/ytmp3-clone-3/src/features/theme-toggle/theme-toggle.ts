/**
 * Theme Toggle Module
 * Handles dark/light theme switching with localStorage persistence
 */

type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'ytmp3-theme';
const DEFAULT_THEME: Theme = 'dark';

/**
 * Get current theme from localStorage or default
 */
function getCurrentTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  return DEFAULT_THEME;
}

/**
 * Save theme to localStorage
 */
function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Apply theme to document
 */
function applyTheme(theme: Theme): void {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);

  // Update icon visibility for both desktop and mobile
  updateThemeIcons(theme);
}

/**
 * Update sun/moon icons based on current theme
 */
function updateThemeIcons(theme: Theme): void {
  // Desktop icons
  const desktopSunIcon = document.querySelector('#theme-toggle .sun-icon');
  const desktopMoonIcon = document.querySelector('#theme-toggle .moon-icon');

  // Mobile icons
  const mobileSunIcon = document.querySelector('#mobile-theme-toggle .sun-icon');
  const mobileMoonIcon = document.querySelector('#mobile-theme-toggle .moon-icon');

  if (theme === 'light') {
    // Light theme → Show sun icon (currently in light mode)
    desktopSunIcon?.classList.remove('hidden');
    desktopMoonIcon?.classList.add('hidden');
    mobileSunIcon?.classList.remove('hidden');
    mobileMoonIcon?.classList.add('hidden');
  } else {
    // Dark theme → Show moon icon (currently in dark mode)
    desktopSunIcon?.classList.add('hidden');
    desktopMoonIcon?.classList.remove('hidden');
    mobileSunIcon?.classList.add('hidden');
    mobileMoonIcon?.classList.remove('hidden');
  }
}

/**
 * Toggle theme between dark and light
 */
function toggleTheme(): void {
  const current = getCurrentTheme();
  const next: Theme = current === 'dark' ? 'light' : 'dark';

  applyTheme(next);
  saveTheme(next);

  console.log(`Theme switched: ${current} → ${next}`);
}

/**
 * Initialize theme on page load
 */
export function initThemeToggle(): void {
  // Apply saved theme immediately (before page renders)
  const savedTheme = getCurrentTheme();
  applyTheme(savedTheme);

  // Setup desktop toggle button
  const desktopToggle = document.getElementById('theme-toggle');
  if (desktopToggle) {
    desktopToggle.addEventListener('click', toggleTheme);
  }

  // Setup mobile toggle button
  const mobileToggle = document.getElementById('mobile-theme-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', toggleTheme);
  }

  console.log('Theme toggle initialized. Current theme:', savedTheme);
}

/**
 * Get current theme (for external use)
 */
export function getTheme(): Theme {
  return getCurrentTheme();
}

/**
 * Set theme programmatically (for external use)
 */
export function setTheme(theme: Theme): void {
  applyTheme(theme);
  saveTheme(theme);
}
