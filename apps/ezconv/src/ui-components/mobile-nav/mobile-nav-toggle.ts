/**
 * Mobile Navigation Toggle Module
 * Handles hamburger menu toggle with animation and accessibility
 */

// State
let isMenuOpen = false;
let toggler: HTMLElement | null = null;
let menu: HTMLElement | null = null;

/**
 * Toggle menu open/close state
 */
function toggleMenu(): void {
  if (!toggler || !menu) return;

  isMenuOpen = !isMenuOpen;

  // Update classes
  toggler.classList.toggle('active', isMenuOpen);
  menu.classList.toggle('collapse', isMenuOpen);
  document.body.classList.toggle('menu-open', isMenuOpen);

  // Update ARIA
  toggler.setAttribute('aria-expanded', String(isMenuOpen));

  // Lock/unlock body scroll
  if (isMenuOpen) {
    lockBodyScroll();
  } else {
    unlockBodyScroll();
  }
}

/**
 * Close menu explicitly
 */
function closeMenu(): void {
  if (!isMenuOpen) return;
  toggleMenu();
}

/**
 * Lock body scroll when menu is open
 */
function lockBodyScroll(): void {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  // Prevent layout shift from scrollbar disappearing
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
}

/**
 * Unlock body scroll when menu is closed
 */
function unlockBodyScroll(): void {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}

/**
 * Handle ESC key press to close menu
 */
function handleEscKey(event: KeyboardEvent): void {
  if (event.key === 'Escape' && isMenuOpen) {
    closeMenu();
    // Return focus to toggler button
    toggler?.focus();
  }
}

/**
 * Handle click outside menu to close
 */
function handleClickOutside(event: MouseEvent): void {
  if (!isMenuOpen) return;

  const target = event.target as HTMLElement;

  // Close if click is outside menu and toggler
  if (!menu?.contains(target) && !toggler?.contains(target)) {
    closeMenu();
  }
}

/**
 * Handle window resize - close menu on desktop breakpoint
 */
function handleResize(): void {
  // Close menu if window resized to desktop (≥768px)
  if (window.innerWidth >= 768 && isMenuOpen) {
    closeMenu();
  }
}

/**
 * Add click listeners to nav links to close menu on navigation
 */
function addNavLinkListeners(): void {
  if (!menu) return;

  const navLinks = menu.querySelectorAll('.menu-navbar a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      // Close menu when navigating (except language dropdown toggle)
      if (!link.getAttribute('href')?.startsWith('javascript:')) {
        closeMenu();
      }
    });
  });
}

/**
 * Initialize mobile navigation toggle
 */
export function initMobileNavToggle(): void {
  // Get DOM elements
  toggler = document.querySelector('.navbar-toggler');
  menu = document.querySelector('.header-menu');

  if (!toggler || !menu) {
    console.warn('Mobile nav toggle: required elements not found');
    return;
  }

  // Add click listener to toggler button
  toggler.addEventListener('click', toggleMenu);

  // Add ESC key listener
  document.addEventListener('keydown', handleEscKey);

  // Add click outside listener
  document.addEventListener('click', handleClickOutside);

  // Add resize listener
  window.addEventListener('resize', handleResize);

  // Add nav link listeners
  addNavLinkListeners();
}
