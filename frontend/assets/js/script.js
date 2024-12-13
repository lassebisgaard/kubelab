// Define services as a regular object (no localStorage)
window.SERVICES = {};

// Update saveService to not use localStorage, but keep window.SERVICES functionality
window.saveService = function(service) {
    window.SERVICES[service.id] = service;
};

// Add this function to initialize services
window.initializeServices = async function() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/services', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            window.location.href = '/pages/login.html';
            return;
        }

        const services = await response.json();
        services.forEach(service => {
            window.SERVICES[service.ServiceId] = {
                id: service.ServiceId,
                name: service.ServiceName,
                icon: service.Icon
            };
        });
        return services;
    } catch (error) {
        console.error('Error initializing services:', error);
        throw error;
    }
};

// Update initServiceFilters function
function initServiceFilters() {
    const filterContainer = document.querySelector('.services-filter');
    const templateGrid = document.querySelector('.project-template-grid');
    
    if (!filterContainer || !templateGrid) return;

    // Remove any existing event listeners
    const newFilterContainer = filterContainer.cloneNode(true);
    filterContainer.parentNode.replaceChild(newFilterContainer, filterContainer);
    
    newFilterContainer.addEventListener('click', (e) => {
        const tag = e.target.closest('.service-tag');
        if (!tag) return;
        
        // Toggle active state
        tag.classList.toggle('active');
        
        // Get all active filters
        const activeFilters = Array.from(newFilterContainer.querySelectorAll('.service-tag.active'))
            .map(tag => tag.dataset.service);
        
        console.log('Active filters:', activeFilters); // Debug log
        
        // Filter template cards
        templateGrid.querySelectorAll('.project-template-card').forEach(card => {
            const cardServices = (card.dataset.services || '').split(',').filter(Boolean);
            console.log('Card services:', cardServices); // Debug log
            
            const isVisible = activeFilters.length === 0 || 
                            activeFilters.some(filter => cardServices.includes(filter));
            
            card.style.display = isVisible ? '' : 'none';
        });
    });
}

// Update the DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize services first
        await window.initializeServices();
        
        // Then initialize other components
        initializeTheme();
        initSidebarToggle();
        await renderNavigation();
        
        // Initialize service filters if we're on a page that uses them
        if (document.querySelector('.services-filter')) {
            initServiceFilters();
        }
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

window.renderServiceTags = function(serviceIds, options = {}) {
    const defaults = {
        isSelectable: false,
        isStatic: false,
        isRemovable: false
    };
    options = { ...defaults, ...options };

    if (!serviceIds || !Array.isArray(serviceIds)) return '';

    return serviceIds.map(id => {
        const service = window.SERVICES[id];
        if (!service) return '';
        
        return `
            <span class="service-tag ${options.isSelectable ? 'service-tag--selectable' : ''} ${options.isStatic ? 'service-tag--static' : ''}"
                  data-service="${service.id}">
                <i class='bx ${service.icon}'></i>
                <span>${service.name}</span>
                ${options.isRemovable ? `
                    <button class="service-tag--remove" title="Remove service">
                        <i class='bx bx-x'></i>
                    </button>
                ` : ''}
            </span>
        `;
    }).join('');
};

function showDeleteConfirmation(title, message, onConfirm) {
    const dialog = document.createElement('div');
    dialog.className = 'modal delete-confirmation-dialog show';
    dialog.innerHTML = `
        <div class="modal-content small">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-modal">
                    <i class='bx bx-x'></i>
                </button>
            </div>
            <div class="modal-body">
                <p>${message}</p>
                <div class="warning-message">
                    <i class='bx bx-error'></i>
                    <div>
                        <div class="warning-title">Warning</div>
                        <div class="warning-text">This action cannot be undone.</div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="button secondary" id="cancelDelete">Cancel</button>
                <button class="button delete" id="confirmDelete">Delete</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    const closeDialog = () => {
        dialog.classList.remove('show');
        setTimeout(() => dialog.remove(), 300);
    };

    dialog.querySelector('.close-modal')?.addEventListener('click', closeDialog);
    dialog.querySelector('#cancelDelete')?.addEventListener('click', closeDialog);
    dialog.querySelector('#confirmDelete')?.addEventListener('click', async () => {
        await onConfirm();
        closeDialog();
    });
}

function handlePageTransition(url) {
    document.body.classList.add('transition-active');
    
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}

// Mobile navigation
document.querySelector('.burger-menu')?.addEventListener('click', () => {
    const aside = document.querySelector('aside');
    const overlay = document.querySelector('.mobile-nav-overlay');
    
    // Toggle mobile navigation
    aside.classList.toggle('mobile-nav-open');
    overlay.classList.toggle('active');
    
    // Ensure sidebar is expanded on mobile
    document.documentElement.classList.add('sb-expanded');
});

document.querySelector('.mobile-nav-overlay')?.addEventListener('click', () => {
    const aside = document.querySelector('aside');
    const overlay = document.querySelector('.mobile-nav-overlay');
    
    // Close mobile navigation
    aside.classList.remove('mobile-nav-open');
    overlay.classList.remove('active');
});



// Funktion til at skifte mellem light og dark mode
function toggleTheme(isDark) {
    const root = document.documentElement;
    const body = document.body;
    
    if (isDark) {
        root.classList.remove('light-mode');
        root.classList.add('dark-mode');
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark-mode');
    } else {
        root.classList.remove('dark-mode');
        root.classList.add('light-mode');
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        localStorage.setItem('theme', 'light-mode');
    }
}

// Indlæs gemt theme preference når siden loader
document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('dark-mode-toggle');
    if (!toggleSwitch) {
        console.error('Toggle switch not found');
        return;
    }

    const savedTheme = localStorage.getItem('theme') || 'dark-mode';
    console.log('Saved theme:', savedTheme); // Debug log
    
    // Sæt initial theme
    toggleTheme(savedTheme === 'dark-mode');
    toggleSwitch.checked = savedTheme === 'dark-mode';

    // Lyt efter ændringer på toggle switch
    toggleSwitch.addEventListener('change', (e) => {
        console.log('Toggle changed:', e.target.checked); // Debug log
        toggleTheme(e.target.checked);
    });
});

// Kør theme check med det samme i tilfælde af at DOMContentLoaded allerede er fyret
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeTheme();
        renderNavigation();
    });
} else {
    initializeTheme();
    renderNavigation();
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark-mode';
    toggleTheme(savedTheme === 'dark-mode');
    
    // Ignorer fejl hvis toggle switch ikke findes
    const toggleSwitch = document.getElementById('dark-mode-toggle');
    if (toggleSwitch) {
        toggleSwitch.checked = savedTheme === 'dark-mode';
        toggleSwitch.addEventListener('change', (e) => {
            toggleTheme(e.target.checked);
        });
    }
}

async function renderNavigation() {
    try {
        const currentPath = window.location.pathname;
        const publicPages = ['/', '/index.html', '/pages/login.html', '/pages/account_creation.html'];
        
        // Don't render navigation for public pages
        if (publicPages.some(page => currentPath.endsWith(page))) {
            return;
        }

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user) {
            return;
        }

        // Rest of your existing renderNavigation code...
        const response = await fetch('../templates/navigation.html');
        const templateText = await response.text();
        
        const template = Handlebars.compile(templateText);
        const navigationHtml = template({
            user: user,
            isProjectsPage: currentPath === 'projects.html',
            isTemplatesPage: currentPath === 'templates.html',
            isTeamsPage: currentPath === 'teams.html',
            isUsersPage: currentPath === 'users.html'
        });
        
        document.querySelector('aside').innerHTML = navigationHtml;
        initializeNavigationEvents();
    } catch (error) {
        console.error('Error rendering navigation:', error);
    }
}

// Tilføj denne funktion for at håndtere navigation events
function initializeNavigationEvents() {
    // Burger menu toggle
    const burgerMenu = document.querySelector('.burger-menu');
    const aside = document.querySelector('aside');
    const overlay = document.querySelector('.mobile-nav-overlay');
    
    if (burgerMenu) {
        burgerMenu.addEventListener('click', () => {
            aside.classList.toggle('mobile-nav-open');
            overlay.classList.toggle('active');
        });
    }
    
    // Overlay click handler
    if (overlay) {
        overlay.addEventListener('click', () => {
            aside.classList.remove('mobile-nav-open');
            overlay.classList.remove('active');
        });
    }
    
    // Logout handler
    const logoutButton = document.querySelector('.logout button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
}

// Add initSidebarToggle function
function initSidebarToggle() {
    const resizeBtn = document.querySelector('[data-resize-btn]');
    if (resizeBtn) {
        resizeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.documentElement.classList.toggle('sb-expanded');
            localStorage.setItem('sidebarExpanded', 
                document.documentElement.classList.contains('sb-expanded'));
        });
    }
}
