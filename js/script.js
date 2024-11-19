document.addEventListener('DOMContentLoaded', () => {
    // Site-wide initialization
    initNavigation();
    initThemeToggle();
    initForms();
});

function initNavigation() {
    const resizeBtn = document.querySelector('[data-resize-btn]');
    if (resizeBtn) {
        resizeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.toggle('sb-expanded');
        });
    }
}

function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            document.body.classList.toggle('light-mode');
        });
    }
}

function initForms() {
    // Initialize appropriate form based on page
    const templateConfigGrid = document.querySelector('.template-config-grid');
    const configGrid = document.querySelector('.config-grid');
    const projectStep = document.querySelector('.project-step');
    
    if (templateConfigGrid || configGrid) {
        new BaseStepForm('template');
    } else if (projectStep) {
        new BaseStepForm('project');
    }
}