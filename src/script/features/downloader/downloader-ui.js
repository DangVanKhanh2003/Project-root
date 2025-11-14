// Import MVC components for InputForm
import { setRenderCallback, getState } from './state.js';
import { initRenderer, render } from './ui-renderer.js';
import { initInputForm } from './input-form.js';
import { initContentRenderer, renderContent } from './content-renderer.js';
import { initSuggestionRenderer, render as renderSuggestions } from '../../ui-components/suggestion-dropdown/suggestion-renderer.js';

// Import centralized scroll manager
import scrollManager from '../../libs/scroll-core/scroll-manager.js';

// Lazy CSS loading removed - all CSS now statically imported in main.js



function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // Use scroll manager for unified scroll behavior
                scrollManager.scrollToElement(targetElement, {
                    offset: 'auto', // Dynamic navbar height calculation
                    onStart: () => {
                    }
                }).catch(error => {
                });
            } else {
            }
        });
    });
}

function setupNavbar() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        // Navbar scroll effects are now handled by ScrollManager
        // The centralized scroll handler manages navbar state changes
    }

    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarModal = document.querySelector('.navbar-modal');
    const navbarCollapse = document.querySelector('.navbar-collapse');

    if (navbarToggler && navbarModal && navbarCollapse) {
        navbarToggler.addEventListener('click', () => {
            navbarModal.classList.toggle('active');
            navbarCollapse.classList.toggle('active');
        });

        // Close button inside drawer
        const navbarClose = document.querySelector('.navbar-close');
        if (navbarClose) {
            navbarClose.addEventListener('click', () => {
                navbarModal.classList.remove('active');
                navbarCollapse.classList.remove('active');
            });
        }

        // Optional: close drawer when clicking a nav link
        const navLinks = navbarCollapse.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navbarModal.classList.remove('active');
                navbarCollapse.classList.remove('active');
            });
        });

        // Close drawer when clicking on the modal background
        navbarModal.addEventListener('click', (e) => {
            if (e.target === navbarModal) {
                navbarModal.classList.remove('active');
                navbarCollapse.classList.remove('active');
            }
        });
    }

    const platformToggler = document.querySelector('.platform-toggler');
    const platformNav = document.querySelector('.platform-nav');
    if (platformToggler && platformNav) {
        platformToggler.addEventListener('click', () => {
            platformNav.classList.toggle('active');
            // Close main menu when opening platform menu
            if (navbarCollapse) {
                navbarModal.classList.remove('active');
                navbarCollapse.classList.remove('active');
            }
        });
    }
}



// Scroll reveal animations removed for better UX and performance
// Elements now visible immediately without fade-in effects

function setupFAQ() {
    const items = document.querySelectorAll('.faq-accordion .faq-item');
    if (!items || items.length === 0) return;

    items.forEach(item => {
        const btn = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        if (!btn) return;

        // Initialize ARIA state
        btn.setAttribute('aria-expanded', 'false');
        if (answer) answer.setAttribute('aria-hidden', 'true');

        btn.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');

            // Close all
            items.forEach(i => {
                i.classList.remove('open');
                const b = i.querySelector('.faq-question');
                const a = i.querySelector('.faq-answer');
                if (b) b.setAttribute('aria-expanded', 'false');
                if (a) a.setAttribute('aria-hidden', 'true');
            });

            // Toggle current
            if (!isOpen) {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
                if (answer) answer.setAttribute('aria-hidden', 'false');
            }
        });
    });
}

/**
 * Setup InputForm MVC architecture with Suggestions
 * This is the orchestrator that connects Model-View-Controller
 */
async function setupInputForm() {

    // Step 1: Initialize Views (DOM element references)
    const formRendererInitialized = initRenderer();
    const contentRendererInitialized = initContentRenderer();
    const suggestionRendererInitialized = initSuggestionRenderer();

    if (!formRendererInitialized) {
        return;
    }

    if (!contentRendererInitialized) {
        return;
    }

    if (!suggestionRendererInitialized) {
        return;
    }

    

    // Step 2b: Setup Model-View bridge (State changes trigger View updates)
    setRenderCallback(async (currentState, prevState) => {
        try {
           
            // Render form UI (button text, loading state, error styling)
            render(currentState, prevState);

            // Render suggestions dropdown
            renderSuggestions(currentState, prevState);

            // Render content based on state (gallery/video detail)
            // Only render content when not loading to avoid interfering with skeleton display
            if (!currentState.isLoading) {
                await renderContent(currentState, prevState);
            } else {
            }



        } catch (error) {
        }
    });

    // Step 3: Initialize Controller (Event listeners and business logic)
    const controllerInitialized = initInputForm();
    if (!controllerInitialized) {
        return;
    }

    // Step 4: Perform initial render with current state
    const initialState = getState();
    try {
        render(initialState);
        renderSuggestions(initialState);
    } catch (error) {
    }

    // Content area starts empty - will be populated by user interactions

}

/**
 * Prefetch all feature modules after critical UI is ready
 * Non-blocking background loading for instant user interactions
 */
function prefetchFeatureModules() {

    // Prefetch all feature modules in parallel (don't await)
    const prefetches = [
        import('./gallery-renderer.js'),
        import('./download-rendering.js'),
        import('./multifile-ui.js'),
        import('./conversion-modal.js'),
        import('./convert-logic.js')
    ];

    // Log prefetch completion (background)
    Promise.all(prefetches)
        .then(() => {
        })
        .catch((error) => {
        });
}

export async function init() {
    // Initialize centralized scroll manager first
    try {
        scrollManager.init();
    } catch (error) {
    }

    setupSmoothScrolling();
    setupNavbar();
    await setupInputForm(); // Replace setupDownloadForm with our new MVC setup

    // Critical UI is ready - user can interact immediately

    // Start prefetching all feature modules in background
    prefetchFeatureModules();

    // CSS lazy loading removed - all CSS bundled in main.js
    // Scroll reveal animations removed - elements visible immediately

    setupFAQ();

    // Force update navbar height after all setup is complete
    setTimeout(() => {
        scrollManager.forceUpdateNavbarHeight();
    }, 100); // Small delay to ensure DOM is fully rendered
}
