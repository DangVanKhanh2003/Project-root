/**
 * Centralized Scroll Management System
 *
 * Handles all scroll-related functionality in a unified, responsive manner.
 * Replaces scattered scroll logic across multiple files with single source of truth.
 */

// Default configuration with mobile-first responsive design
const DEFAULT_CONFIG = {
    breakpoints: {
        mobile: 600,    // Match CSS breakpoint from base.css
        desktop: 840,   // Match CSS breakpoint from base.css
    },
    navbar: {
        selector: '.navbar',
        offsetPadding: 20, // Base padding value for calculations
        cssVariable: '--navbar-height',
    },
    timing: {
        smoothScrollDuration: 500,
        throttleDelay: 16,    // 60fps for smooth animations
        debounceDelay: 150,   // For infinite scroll triggers
    },
    infiniteScroll: {
        thresholds: {
            mobile: 600,   // Distance from bottom to trigger load
            desktop: 800,  // Distance from bottom to trigger load
        }
    },
    debug: false, // Enable console logging for development
};

/**
 * Centralized scroll manager class
 * Provides unified API for all scroll operations in the application
 */
class ScrollManager {
    constructor(config = {}) {
        this.config = this.mergeConfig(DEFAULT_CONFIG, config);
        this.isInitialized = false;

        // Cache frequently accessed elements
        this.cache = {
            navbar: null,
            lastNavbarHeight: null,
        };

        // Active scroll listeners and handlers
        this.listeners = new Map();

        // Throttled/debounced function cache
        this.throttledFunctions = new Map();
        this.debouncedFunctions = new Map();

        this.log('ScrollManager initialized with config:', this.config);
    }

    /**
     * Initialize the scroll manager and set up all handlers
     */
    init() {
        if (this.isInitialized) {
            this.log('ScrollManager already initialized, skipping');
            return;
        }

        try {
            // Cache navbar element
            this.cacheNavbarElement();

            // Set up CSS custom property for navbar height
            this.updateNavbarHeightCSS();

            // Initialize scroll handlers (will be implemented in later steps)
            this.setupScrollHandlers();

            this.isInitialized = true;
            this.log('ScrollManager successfully initialized');
        } catch (error) {
        }
    }

    /**
     * Get current navbar height dynamically
     * Handles responsive design changes automatically
     */
    getNavbarHeight() {
        try {
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
     * Calculate scroll target position with responsive offset
     */
    calculateTarget(element, customOffset = null) {
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
     * Unified scroll to element method with smooth behavior
     */
    scrollToElement(target, options = {}) {
        const element = typeof target === 'string'
            ? document.querySelector(target)
            : target;

        if (!element) {
            this.log(`scrollToElement: Element not found: ${target}`);
            return Promise.resolve();
        }

        const scrollOptions = {
            behavior: 'smooth',
            offset: null,
            onComplete: null,
            ...options,
        };

        try {
            const targetPosition = this.calculateTarget(element, scrollOptions.offset);

            this.log(`Scrolling to position: ${targetPosition}px`);

            window.scrollTo({
                top: targetPosition,
                behavior: scrollOptions.behavior,
            });

            // Return promise for completion tracking
            return new Promise((resolve) => {
                if (scrollOptions.behavior === 'smooth') {
                    // Estimate completion time for smooth scroll
                    setTimeout(() => {
                        if (scrollOptions.onComplete) {
                            scrollOptions.onComplete();
                        }
                        resolve();
                    }, this.config.timing.smoothScrollDuration);
                } else {
                    // Immediate completion for instant scroll
                    if (scrollOptions.onComplete) {
                        scrollOptions.onComplete();
                    }
                    resolve();
                }
            });

        } catch (error) {
            return Promise.resolve();
        }
    }

    /**
     * Check if current viewport is mobile based on configured breakpoint
     */
    isMobile() {
        return window.innerWidth <= this.config.breakpoints.mobile;
    }

    /**
     * Check if current viewport is desktop based on configured breakpoint
     */
    isDesktop() {
        return window.innerWidth >= this.config.breakpoints.desktop;
    }

    /**
     * Get appropriate threshold based on current viewport
     */
    getInfiniteScrollThreshold() {
        return this.isMobile()
            ? this.config.infiniteScroll.thresholds.mobile
            : this.config.infiniteScroll.thresholds.desktop;
    }

    /**
     * Throttle function with caching to avoid recreation
     */
    throttle(key, fn, delay = this.config.timing.throttleDelay) {
        if (!this.throttledFunctions.has(key)) {
            let lastTime = 0;
            const throttled = (...args) => {
                const now = Date.now();
                if (now - lastTime >= delay) {
                    lastTime = now;
                    return fn.apply(this, args);
                }
            };
            this.throttledFunctions.set(key, throttled);
        }
        return this.throttledFunctions.get(key);
    }

    /**
     * Debounce function with caching to avoid recreation
     */
    debounce(key, fn, delay = this.config.timing.debounceDelay) {
        if (!this.debouncedFunctions.has(key)) {
            let timeoutId;
            const debounced = (...args) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => fn.apply(this, args), delay);
            };
            this.debouncedFunctions.set(key, debounced);
        }
        return this.debouncedFunctions.get(key);
    }

    /**
     * Set up centralized scroll event handlers
     * Single scroll listener that distributes to multiple handlers
     */
    setupScrollHandlers() {
        try {
            // Remove any existing scroll listener
            if (this.listeners.has('main-scroll')) {
                window.removeEventListener('scroll', this.listeners.get('main-scroll'));
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
    handleScroll() {
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
    handleNavbarScrollEffects() {
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
    handleInfiniteScrollDetection() {
        // This will be implemented during migration of content-renderer.js
        // For now, just check if infinite scroll should trigger
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
                } else {
                }
            }
        } catch (error) {
        }
    }

    /**
     * Get distance from bottom of page
     */
    getDistanceFromPageBottom() {
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
    shouldUpdateNavbarHeight() {
        // Update navbar height on viewport changes
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
    getBreakpointName(width) {
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
    scrollToElement(target, options = {}) {
        const element = typeof target === 'string'
            ? document.querySelector(target)
            : target;

        if (!element) {
            this.log(`scrollToElement: Element not found: ${target}`);
            return Promise.resolve();
        }

        const scrollOptions = {
            behavior: 'smooth',
            offset: 'auto', // 'auto' uses navbar height + padding
            customOffset: null,
            onStart: null,
            onComplete: null,
            useNativeScrollPadding: false, // Use CSS scroll-padding-top instead
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
    scrollWithNativePadding(element, options) {
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
    scrollWithCalculatedOffset(element, options) {
        try {
            let offset;

            if (options.customOffset !== null) {
                offset = options.customOffset;
            } else if (options.offset === 'auto') {
                offset = this.getNavbarHeight() + this.config.navbar.offsetPadding;
            } else {
                offset = options.offset || 0;
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
    scrollToTop(options = {}) {
        const scrollOptions = {
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
    registerInfiniteScrollCallback(callback) {
        this.infiniteScrollCallback = callback;
        this.log('Infinite scroll callback registered');
    }

    /**
     * Unregister infinite scroll callback
     */
    unregisterInfiniteScrollCallback() {
        this.infiniteScrollCallback = null;
        this.log('Infinite scroll callback unregistered');
    }

    /**
     * Force update navbar height (useful after dynamic content changes)
     */
    forceUpdateNavbarHeight() {
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
    cacheNavbarElement() {
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
    updateNavbarHeightCSS() {
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
    mergeConfig(defaultConfig, userConfig) {
        const merged = { ...defaultConfig };

        for (const key in userConfig) {
            if (typeof userConfig[key] === 'object' && userConfig[key] !== null) {
                merged[key] = { ...defaultConfig[key], ...userConfig[key] };
            } else {
                merged[key] = userConfig[key];
            }
        }

        return merged;
    }

    /**
     * Debug logging utility
     */
    log(...args) {
        if (this.config.debug) {
        }
    }

    /**
     * Clean up resources and remove event listeners
     */
    destroy() {
        try {
            // Remove all event listeners
            this.listeners.forEach((listener, key) => {
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

// Export singleton instance and class
export { ScrollManager };

// Export default instance for immediate use
export default new ScrollManager({
    debug: process.env.NODE_ENV === 'development', // Enable debug in development
});