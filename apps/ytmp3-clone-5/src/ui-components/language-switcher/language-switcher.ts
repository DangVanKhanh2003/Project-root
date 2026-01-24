/**
 * Language Switcher Component
 * Redirects users to language-specific pages (no i18n package dependency)
 */

const LANGUAGES = [
  { code: 'en', nativeName: 'English' },
  { code: 'ar', nativeName: 'Arabic' },
  { code: 'bn', nativeName: 'Bengali' },
  { code: 'de', nativeName: 'German' },
  { code: 'es', nativeName: 'Spanish' },
  { code: 'fr', nativeName: 'French' },
  { code: 'hi', nativeName: 'Hindi' },
  { code: 'id', nativeName: 'Indonesian' },
  { code: 'it', nativeName: 'Italian' },
  { code: 'ja', nativeName: 'Japanese' },
  { code: 'ko', nativeName: 'Korean' },
  { code: 'ms', nativeName: 'Malay' },
  { code: 'my', nativeName: 'Burmese' },
  { code: 'pt', nativeName: 'Portuguese' },
  { code: 'ru', nativeName: 'Russian' },
  { code: 'th', nativeName: 'Thai' },
  { code: 'tr', nativeName: 'Turkish' },
  { code: 'ur', nativeName: 'Urdu' },
  { code: 'vi', nativeName: 'Vietnamese' }
] as const;

function getCurrentLanguage(): string {
  const htmlLang = document.documentElement.getAttribute('lang') || 'en';
  return htmlLang.toLowerCase().split('-')[0] || 'en';
}

function navigateToLanguage(code: string): void {
  const path = window.location.pathname || '/';
  const basePath = path.replace(/^\/([a-z]{2})(\/|$)/, '/');
  const normalized = basePath.startsWith('/') ? basePath : `/${basePath}`;
  const suffix = normalized === '/' ? '' : normalized;
  const target = code === 'en' ? (suffix || '/') : `/${code}${suffix}`;
  window.location.href = target;
}

/**
 * Render language switcher dropdown
 */
export function renderLanguageSwitcher(containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn('[LanguageSwitcher] Container not found:', containerId);
    return;
  }

  const currentLang = getCurrentLanguage();
  const languages = LANGUAGES;

  const html = `
    <div class="language-switcher">
      <select id="language-select" class="language-select" aria-label="Select language">
        ${languages.map(lang => `
          <option value="${lang.code}" ${lang.code === currentLang ? 'selected' : ''}>
            ${lang.nativeName}
          </option>
        `).join('')}
      </select>
      <svg class="language-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke-width="2"/>
        <path d="M2 12H22" stroke-width="2"/>
        <path d="M12 2C14.5 4.5 16 8 16 12C16 16 14.5 19.5 12 22C9.5 19.5 8 16 8 12C8 8 9.5 4.5 12 2Z" stroke-width="2"/>
      </svg>
    </div>
  `;

  container.innerHTML = html;

  // Add event listener - navigates to different language page
  const select = document.getElementById('language-select') as HTMLSelectElement;
  if (select) {
    select.addEventListener('change', (e) => {
      const newLang = (e.target as HTMLSelectElement).value;
      navigateToLanguage(newLang as any);
    });
  }
}
