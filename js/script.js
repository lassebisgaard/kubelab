//<!-- Navigation and Theme Toggle -->//

document.addEventListener('DOMContentLoaded', () => {
    const resizeBtn = document.querySelector('[data-resize-btn]');
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;

    if (resizeBtn) {
        resizeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.body.classList.toggle('sb-expanded');
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            body.classList.toggle('light-mode');
        });
    }
});