// Define services as a regular object (no localStorage)
window.SERVICES = {};

// Update saveService to not use localStorage, but keep window.SERVICES functionality
window.saveService = function(service) {
    window.SERVICES[service.id] = service;
};

// Update the sidebar toggle initialization
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

// Update the DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', () => {
    // Initialize sidebar toggle
    initSidebarToggle();

    // Theme toggle setup
    const toggleSwitch = document.getElementById('dark-mode-toggle');
    const rootElement = document.documentElement;

    if (toggleSwitch) {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme) {
            rootElement.classList.add(currentTheme);
            toggleSwitch.checked = currentTheme === 'dark-mode';
        }

        toggleSwitch.addEventListener('change', () => {
            if (toggleSwitch.checked) {
                rootElement.classList.remove('light-mode');
                rootElement.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark-mode'); 
            } else {
                rootElement.classList.remove('dark-mode');
                rootElement.classList.add('light-mode');
                localStorage.setItem('theme', 'light-mode'); 
            }
        });
    }

    // Initialize other functionality
    initServiceFilters();
    loadServices();
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

function initServiceFilters() {
    const filterContainer = document.querySelector('.services-filter');
    const templateGrid = document.querySelector('.project-template-grid');
    
    if (filterContainer && templateGrid) {
        filterContainer.innerHTML = window.renderServiceTags(
            Object.keys(window.SERVICES),
            { isSelectable: true }
        );

        const filterTags = filterContainer.querySelectorAll('.service-tag');
        filterTags.forEach(tag => {
            tag.addEventListener('click', () => {
                tag.classList.toggle('active');
                
                const activeFilters = Array.from(filterTags)
                    .filter(t => t.classList.contains('active'))
                    .map(t => t.dataset.service);

                templateGrid.querySelectorAll('.project-template-card').forEach(card => {
                    const cardServices = Array.from(card.querySelectorAll('.service-tag'))
                        .map(t => t.dataset.service);
                    
                    if (activeFilters.length === 0 || 
                        activeFilters.some(filter => cardServices.includes(filter))) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }
}

function handlePageTransition(url) {
    document.body.classList.add('transition-active');
    
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}
// Fetch services from database
async function loadServices() {
    try {
        console.log('Starting service fetch...');
        const response = await fetch('http://localhost:3000/api/services');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const services = await response.json();
        
        // Update global services object
        services.forEach(service => {
            window.SERVICES[service.ServiceId] = {
                id: service.ServiceId,
                name: service.ServiceName,
                icon: service.Icon
            };
        });
        
        // Initialize service filters if they exist
        initServiceFilters();
    } catch (error) {
        console.error('Failed to load services:', error);
    }
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
    document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
    initializeTheme();
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark-mode';
    toggleTheme(savedTheme === 'dark-mode');
}
