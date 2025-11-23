/**
 * Centralized Scroll Management System
 *
 * Handles all scroll-related functionality in a unified, responsive manner.
 * Replaces scattered scroll logic across multiple files with single source of truth.
 */

import { BREAKPOINTS, INFINITE_SCROLL_THRESHOLDS } from './responsive-utils';

export interface ScrollConfig {
  breakpoints?: {
    mobile?: number;
    desktop?: number;
  };
  navbar?: {
    selector?: string;
    offsetPadding?: number;
    cssVariable?: string;
  };
  header?: {
    isFixed?: boolean;       // Whether header is fixed/sticky position
    height?: number | null;  // Custom header height (null = auto-detect from navbar)
  };
  timing?: {
    smoothScrollDuration?: number;
    throttleDelay?: number;
    debounceDelay?: number;
  };
  infiniteScroll?: {
    thresholds?: {
      mobile?: number;
      desktop?: number;
    };
  };
  debug?: boolean;
}

export interface ScrollOptions {
  behavior?: ScrollBehavior;
  offset?: number | 'auto';
  customOffset?: number | null;
  onStart?: () => void;
  onComplete?: () => void;
  useNativeScrollPadding?: boolean;
}

interface CachedElements {
  navbar: HTMLElement | null;
  lastNavbarHeight: number | null;
}

interface EventListener {
  remove: () => void;
}

type InfiniteScrollCallback = (distanceFromBottom: number) => void;

// Default configuration with mobile-first responsive design
const DEFAULT_CONFIG: Required<ScrollConfig> = {
  breakpoints: {
    mobile: BREAKPOINTS.MOBILE,    // From shared responsive-utils
    desktop: BREAKPOINTS.DESKTOP,  // From shared responsive-utils
  },
  navbar: {
    selector: '.navbar',
    offsetPadding: 20, // Base padding value for calculations
    cssVariable: '--navbar-height',
  },
  header: {
    isFixed: true,    // Default: header is fixed position
    height: null,     // Default: auto-detect from navbar element
  },
  timing: {
    smoothScrollDuration: 500,
    throttleDelay: 16,    // 60fps for smooth animations
    debounceDelay: 150,   // For infinite scroll triggers
  },
  infiniteScroll: {
    thresholds: {
      mobile: INFINITE_SCROLL_THRESHOLDS.MOBILE,   // From shared responsive-utils
      desktop: INFINITE_SCROLL_THRESHOLDS.DESKTOP, // From shared responsive-utils
    },
  },
  debug: false,
};

/**
 * Centralized scroll manager class
 * Provides unified API for all scroll operations in the application
 */
export class ScrollManager {
  private config: Required<ScrollConfig>;
  private isInitialized: boolean = false;
  private cache: CachedElements;
  private listeners: Map<string, EventListener>;
  private throttledFunctions: Map<string, (...args: any[]) => any>;
  private debouncedFunctions: Map<string, (...args: any[]) => any>;
  private infiniteScrollCallback: InfiniteScrollCallback | null = null;
  private lastViewportWidth?: number;

  constructor(config: ScrollConfig = {}) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config);
    this.cache = {
      navbar: null,
      lastNavbarHeight: null,
    };
    this.listeners = new Map();
    this.throttledFunctions = new Map();
    this.debouncedFunctions = new Map();

    this.log('ScrollManager initialized with config:', this.config);
  }

  /**
   * Initialize the scroll manager and set up all handlers
   */
  init(): void {
    if (this.isInitialized) {
      this.log('ScrollManager already initialized, skipping');
      return;
    }

    try {
      // Cache navbar element
      this.cacheNavbarElement();

      // Set up CSS custom property for navbar height
      this.updateNavbarHeightCSS();

      // Initialize scroll handlers
      this.setupScrollHandlers();

      this.isInitialized = true;
      this.log('ScrollManager successfully initialized');
    } catch (error) {
    }
  }

  /**
   * Get current navbar/header height dynamically
   * Handles responsive design changes automatically
   * Respects isHeaderFixed and custom headerHeight config
   */
  getNavbarHeight(): number {
    try {
      // If header is not fixed, no offset needed for scroll calculations
      if (!this.config.header.isFixed) {
        this.log('Header is not fixed, returning 0 offset');
        return 0;
      }

      // If custom header height is set, use it
      if (this.config.header.height !== null) {
        this.log(`Using custom header height: ${this.config.header.height}px`);
        return this.config.header.height;
      }

      // Auto-detect from navbar element
      if (!this.cache.navbar) {
        this.cacheNavbarElement();
      }

      if (this.cache.navbar) {
        const height = this.cache.navbar.getBoundingClientRect().height;
        this.cache.lastNavbarHeight = height;
        this.log(`Navbar height calculated: ${height}px`);
        return height;
      }

      // Fallback to cached value or default
      const fallbackHeight = this.cache.lastNavbarHeight || 80;
      this.log(`Navbar element not found, using fallback: ${fallbackHeight}px`);
      return fallbackHeight;
    } catch (error) {
      return 80; // Safe fallback
    }
  }

  /**
   * Check if header is fixed/sticky
   */
  isHeaderFixed(): boolean {
    return this.config.header.isFixed;
  }

  /**
   * Get configured header height (or null if auto-detect)
   */
  getHeaderHeight(): number | null {
    return this.config.header.height;
  }

  /**
   * Update header config at runtime
   */
  setHeaderConfig(config: { isFixed?: boolean; height?: number | null }): void {
    if (config.isFixed !== undefined) {
      this.config.header.isFixed = config.isFixed;
    }
    if (config.height !== undefined) {
      this.config.header.height = config.height;
    }
    this.log('Header config updated:', this.config.header);
  }

  /**
   * Calculate scroll target position with responsive offset
   */
  calculateTarget(element: Element, customOffset: number | null = null): number {
    if (!element) {
      this.log('calculateTarget: Invalid element provided');
      return 0;
    }

    try {
      const rect = element.getBoundingClientRect();
      const scrollTop = window.scrollY || window.pageYOffset;

      // Use custom offset or calculate dynamic navbar offset
      const offset = customOffset !== null
        ? customOffset
        : this.getNavbarHeight() + this.config.navbar.offsetPadding;

      const targetPosition = rect.top + scrollTop - offset;

      this.log(`Calculated scroll target: ${targetPosition}px (offset: ${offset}px)`);
      return Math.max(0, targetPosition); // Don't scroll above page top
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if current viewport is mobile based on configured breakpoint
   */
  isMobile(): boolean {
    return window.innerWidth <= this.config.breakpoints.mobile;
  }

  /**
   * Check if current viewport is desktop based on configured breakpoint
   */
  isDesktop(): boolean {
    return window.innerWidth >= this.config.breakpoints.desktop;
  }

  /**
   * Get appropriate threshold based on current viewport
   */
  getInfiniteScrollThreshold(): number {
    return this.isMobile()
      ? this.config.infiniteScroll.thresholds.mobile
      : this.config.infiniteScroll.thresholds.desktop;
  }

  /**
   * Throttle function with caching to avoid recreation
   */
  throttle<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number = this.config.timing.throttleDelay
  ): T {
    if (!this.throttledFunctions.has(key)) {
      let lastTime = 0;
      const throttled = ((...args: any[]) => {
        const now = Date.now();
        if (now - lastTime >= delay) {
          lastTime = now;
          return fn.apply(this, args);
        }
      }) as T;
      this.throttledFunctions.set(key, throttled);
    }
    return this.throttledFunctions.get(key) as T;
  }

  /**
   * Debounce function with caching to avoid recreation
   */
  debounce<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number = this.config.timing.debounceDelay
  ): T {
    if (!this.debouncedFunctions.has(key)) {
      let timeoutId: ReturnType<typeof setTimeout>;
      const debounced = ((...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
      }) as T;
      this.debouncedFunctions.set(key, debounced);
    }
    return this.debouncedFunctions.get(key) as T;
  }

  /**
   * Set up centralized scroll event handlers
   * Single scroll listener that distributes to multiple handlers
   */
  private setupScrollHandlers(): void {
    try {
      // Remove any existing scroll listener
      if (this.listeners.has('main-scroll')) {
        const listener = this.listeners.get('main-scroll');
        listener?.remove();
      }

      // Create main scroll handler
      const mainScrollHandler = this.throttle('main-scroll', () => {
        this.handleScroll();
      }, this.config.timing.throttleDelay);

      // Add passive listener for better performance
      window.addEventListener('scroll', mainScrollHandler, { passive: true });
      this.listeners.set('main-scroll', {
        remove: () => window.removeEventListener('scroll', mainScrollHandler)
      });

      this.log('Centralized scroll handlers set up successfully');
    } catch (error) {
    }
  }

  /**
   * Main scroll event handler - distributes to sub-handlers
   */
  private handleScroll(): void {
    try {
      // Handle navbar scroll effects
      this.handleNavbarScrollEffects();

      // Handle infinite scroll detection (if enabled)
      this.handleInfiniteScrollDetection();

      // Update navbar height CSS if needed
      if (this.shouldUpdateNavbarHeight()) {
        this.updateNavbarHeightCSS();
      }
    } catch (error) {
    }
  }

  /**
   * Handle navbar visual effects on scroll
   */
  private handleNavbarScrollEffects(): void {
    if (!this.cache.navbar) return;

    try {
      const scrollY = window.scrollY || window.pageYOffset;
      const threshold = 50; // Scroll threshold for navbar effects

      // Add or remove scrolled class based on scroll position
      if (scrollY > threshold) {
        if (!this.cache.navbar.classList.contains('scrolled')) {
          this.cache.navbar.classList.add('scrolled');
          this.log('Navbar scrolled state: active');
        }
      } else {
        if (this.cache.navbar.classList.contains('scrolled')) {
          this.cache.navbar.classList.remove('scrolled');
          this.log('Navbar scrolled state: inactive');
        }
      }
    } catch (error) {
    }
  }

  /**
   * Handle infinite scroll detection
   */
  private handleInfiniteScrollDetection(): void {
    try {
      const threshold = this.getInfiniteScrollThreshold();
      const distanceFromBottom = this.getDistanceFromPageBottom();

      if (distanceFromBottom <= threshold) {
        // Trigger infinite scroll callback if registered
        if (this.infiniteScrollCallback) {
          this.debounce('infinite-scroll', () => {
            if (this.infiniteScrollCallback) {
              this.infiniteScrollCallback(distanceFromBottom);
            }
          }, this.config.timing.debounceDelay)();
        }
      }
    } catch (error) {
    }
  }

  /**
   * Get distance from bottom of page
   */
  private getDistanceFromPageBottom(): number {
    try {
      const scrollTop = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      return documentHeight - (scrollTop + windowHeight);
    } catch (error) {
      return Infinity; // Safe fallback
    }
  }

  /**
   * Check if navbar height should be updated
   */
  private shouldUpdateNavbarHeight(): boolean {
    const currentWidth = window.innerWidth;

    if (!this.lastViewportWidth) {
      this.lastViewportWidth = currentWidth;
      return true;
    }

    // Check if we've crossed a major breakpoint
    const previousBreakpoint = this.getBreakpointName(this.lastViewportWidth);
    const currentBreakpoint = this.getBreakpointName(currentWidth);

    if (previousBreakpoint !== currentBreakpoint) {
      this.lastViewportWidth = currentWidth;
      this.log(`Breakpoint changed: ${previousBreakpoint} → ${currentBreakpoint}`);
      return true;
    }

    return false;
  }

  /**
   * Get current breakpoint name for viewport width
   */
  private getBreakpointName(width: number): string {
    if (width <= 350) return 'extra-small';
    if (width <= this.config.breakpoints.mobile) return 'mobile';
    if (width <= this.config.breakpoints.desktop) return 'tablet';
    if (width <= 1240) return 'desktop';
    if (width <= 1920) return 'large';
    if (width <= 2560) return 'extra-large';
    return 'ultra-large';
  }

  /**
   * Enhanced scroll to element with modern scroll API
   */
  scrollToElement(
    target: string | Element,
    options: ScrollOptions = {}
  ): Promise<void> {
    const element = typeof target === 'string'
      ? document.querySelector(target)
      : target;

    if (!element) {
      this.log(`scrollToElement: Element not found: ${target}`);
      return Promise.resolve();
    }

    const scrollOptions: Required<ScrollOptions> = {
      behavior: 'smooth',
      offset: 'auto',
      customOffset: null,
      onStart: null,
      onComplete: null,
      useNativeScrollPadding: false,
      ...options,
    };

    try {
      // Call onStart callback
      if (scrollOptions.onStart) {
        scrollOptions.onStart();
      }

      // Choose scroll method based on options
      if (scrollOptions.useNativeScrollPadding) {
        return this.scrollWithNativePadding(element, scrollOptions);
      } else {
        return this.scrollWithCalculatedOffset(element, scrollOptions);
      }
    } catch (error) {
      return Promise.resolve();
    }
  }

  /**
   * Scroll using CSS scroll-padding-top (browser native)
   */
  private scrollWithNativePadding(
    element: Element,
    options: Required<ScrollOptions>
  ): Promise<void> {
    try {
      element.scrollIntoView({
        behavior: options.behavior,
        block: 'start',
        inline: 'nearest',
      });

      return new Promise((resolve) => {
        setTimeout(() => {
          if (options.onComplete) options.onComplete();
          resolve();
        }, this.config.timing.smoothScrollDuration);
      });
    } catch (error) {
      return Promise.resolve();
    }
  }

  /**
   * Scroll with manually calculated offset (more precise control)
   */
  private scrollWithCalculatedOffset(
    element: Element,
    options: Required<ScrollOptions>
  ): Promise<void> {
    try {
      let offset: number;

      if (options.customOffset !== null) {
        offset = options.customOffset;
      } else if (options.offset === 'auto') {
        offset = this.getNavbarHeight() + this.config.navbar.offsetPadding;
      } else {
        offset = options.offset as number;
      }

      const targetPosition = this.calculateTarget(element, offset);

      this.log(`Scrolling to position: ${targetPosition}px (offset: ${offset}px)`);

      window.scrollTo({
        top: targetPosition,
        behavior: options.behavior,
      });

      return new Promise((resolve) => {
        setTimeout(() => {
          if (options.onComplete) options.onComplete();
          resolve();
        }, this.config.timing.smoothScrollDuration);
      });
    } catch (error) {
      return Promise.resolve();
    }
  }

  /**
   * Scroll to top of page
   */
  scrollToTop(options: Partial<ScrollOptions> = {}): Promise<void> {
    const scrollOptions: Partial<ScrollOptions> = {
      behavior: 'smooth',
      onComplete: null,
      ...options,
    };

    try {
      window.scrollTo({
        top: 0,
        behavior: scrollOptions.behavior,
      });

      return new Promise((resolve) => {
        setTimeout(() => {
          if (scrollOptions.onComplete) scrollOptions.onComplete();
          resolve();
        }, this.config.timing.smoothScrollDuration);
      });
    } catch (error) {
      return Promise.resolve();
    }
  }

  /**
   * Register infinite scroll callback
   */
  registerInfiniteScrollCallback(callback: InfiniteScrollCallback): void {
    this.infiniteScrollCallback = callback;
    this.log('Infinite scroll callback registered');
  }

  /**
   * Unregister infinite scroll callback
   */
  unregisterInfiniteScrollCallback(): void {
    this.infiniteScrollCallback = null;
    this.log('Infinite scroll callback unregistered');
  }

  /**
   * Force update navbar height (useful after dynamic content changes)
   */
  forceUpdateNavbarHeight(): void {
    try {
      this.cache.navbar = null; // Clear cache
      this.cacheNavbarElement(); // Re-cache
      this.updateNavbarHeightCSS(); // Update CSS
      this.log('Navbar height force updated');
    } catch (error) {
    }
  }

  /**
   * Cache navbar element for performance
   */
  private cacheNavbarElement(): void {
    try {
      this.cache.navbar = document.querySelector(this.config.navbar.selector);
      if (this.cache.navbar) {
        this.log('Navbar element cached successfully');
      } else {
        this.log(`Warning: Navbar element not found with selector: ${this.config.navbar.selector}`);
      }
    } catch (error) {
    }
  }

  /**
   * Update CSS custom property with current navbar height
   */
  private updateNavbarHeightCSS(): void {
    try {
      const height = this.getNavbarHeight();
      document.documentElement.style.setProperty(
        this.config.navbar.cssVariable,
        `${height}px`
      );
      this.log(`CSS variable ${this.config.navbar.cssVariable} set to ${height}px`);
    } catch (error) {
    }
  }

  /**
   * Deep merge configuration objects
   */
  private mergeConfig(
    defaultConfig: Required<ScrollConfig>,
    userConfig: ScrollConfig
  ): Required<ScrollConfig> {
    const merged = { ...defaultConfig } as any;

    for (const key in userConfig) {
      const typedKey = key as keyof ScrollConfig;
      const value = userConfig[typedKey];
      if (typeof value === 'object' && value !== null) {
        merged[typedKey] = { ...defaultConfig[typedKey] as any, ...value as any };
      } else {
        merged[typedKey] = value;
      }
    }

    return merged;
  }

  /**
   * Debug logging utility
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
    }
  }

  /**
   * Clean up resources and remove event listeners
   */
  destroy(): void {
    try {
      // Remove all event listeners
      this.listeners.forEach((listener) => {
        listener.remove();
      });
      this.listeners.clear();

      // Clear cached functions
      this.throttledFunctions.clear();
      this.debouncedFunctions.clear();

      // Clear element cache
      this.cache.navbar = null;
      this.cache.lastNavbarHeight = null;

      this.isInitialized = false;
      this.log('ScrollManager destroyed successfully');
    } catch (error) {
    }
  }
}

// Export default instance for immediate use
const defaultInstance = new ScrollManager({
  debug: false, // Can be enabled in development
});

export default defaultInstance;
