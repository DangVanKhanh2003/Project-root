/**
 * Main entry point for Legal Pages (Terms of Service, Privacy Policy)
 * Loads only essential CSS for legal document pages
 */

// Prevent scroll restoration from browser
history.scrollRestoration = 'manual';

// ========================================
// CRITICAL CSS - Legal Pages
// Base CSS + minimal spacing adjustments
// ========================================
import '../styles/reset.css';
import '../styles/base.css';
import '../styles/common.css'; // For navbar
import '../styles/features/footer.css'; // Footer grid layout
import '../styles/features/legal-spacing.css'; // Minimal spacing fixes

/**
 * Initialize legal page
 */
function initLegalPage() {
    // Navbar mobile menu toggle
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarModal = document.querySelector('.navbar-modal');
    const navbarClose = document.querySelector('.navbar-close');

    if (navbarToggler && navbarModal) {
        navbarToggler.addEventListener('click', () => {
            navbarModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (navbarClose && navbarModal) {
        navbarClose.addEventListener('click', () => {
            navbarModal.classList.remove('active');
            document.body.style.overflow = '';
        });

        // Close on backdrop click
        navbarModal.addEventListener('click', (e) => {
            if (e.target === navbarModal) {
                navbarModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add print functionality
    const printButton = document.getElementById('print-page');
    if (printButton) {
        printButton.addEventListener('click', () => {
            window.print();
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLegalPage);
} else {
    initLegalPage();
}
