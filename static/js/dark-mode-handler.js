/**
 * Dark Mode Handler
 * This script ensures consistent dark mode behavior across all pages
 */

document.addEventListener('DOMContentLoaded', function() {
    // Apply dark mode to modals
    function applyDarkModeToModals() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const modals = document.querySelectorAll('.modal-content');
        
        modals.forEach(modal => {
            if (isDarkMode) {
                modal.classList.add('dark-mode-modal');
            } else {
                modal.classList.remove('dark-mode-modal');
            }
        });
    }
    
    // Set up a MutationObserver to detect new modals being added to the DOM
    const bodyObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    if (node.classList && node.classList.contains('modal')) {
                        applyDarkModeToModals();
                    }
                }
            }
        });
    });
    
    // Start observing the body for added modals
    bodyObserver.observe(document.body, { childList: true, subtree: true });
    
    // Observe body for dark mode class changes
    const darkModeObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                applyDarkModeToModals();
                
                // Fix any inline styles that might be using light colors
                if (document.body.classList.contains('dark-mode')) {
                    fixInlineStyles();
                }
            }
        });
    });
    
    darkModeObserver.observe(document.body, { attributes: true });
    
    // Fix inline styles that might be using light colors
    function fixInlineStyles() {
        // Elements with white background
        const whiteBackgroundElements = document.querySelectorAll('[style*="background: white"], [style*="background-color: white"], [style*="background: #fff"], [style*="background-color: #fff"], [style*="background: #ffffff"], [style*="background-color: #ffffff"]');
        
        whiteBackgroundElements.forEach(el => {
            el.style.backgroundColor = '#1e1e1e';
            el.style.color = '#f0f0f0';
        });
        
        // Elements with black text
        const blackTextElements = document.querySelectorAll('[style*="color: black"], [style*="color: #000"], [style*="color: #000000"]');
        
        blackTextElements.forEach(el => {
            el.style.color = '#f0f0f0';
        });
    }
    
    // Run once on page load
    if (document.body.classList.contains('dark-mode')) {
        applyDarkModeToModals();
        fixInlineStyles();
    }
}); 