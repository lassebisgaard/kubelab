// Define services as a regular object (no localStorage)
window.SERVICES = {
    wordpress: {
        id: 'wordpress',
        name: 'WordPress',
        icon: 'bxl-wordpress'
    },
    mysql: {
        id: 'mysql',
        name: 'MySQL',
        icon: 'bx-data'
    },
    phpmyadmin: {
        id: 'phpmyadmin',
        name: 'phpMyAdmin',
        icon: 'bx-server'
    },
    nginx: {
        id: 'nginx',
        name: 'Nginx',
        icon: 'bx-server'
    },
    php: {
        id: 'php',
        name: 'PHP',
        icon: 'bxl-php'
    }
};

// Update saveService to not use localStorage
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

    // Initialize form if we're on a form page
    const formType = document.body.dataset.formType;
    if (formType) {
        new BaseStepForm(formType);
    }

    // Initialize service filters if they exist
    initServiceFilters();

    // Add transition container to body
    const transitionDiv = document.createElement('div');
    transitionDiv.className = 'transition-container';
    document.body.appendChild(transitionDiv);

    // Handle link clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link || !link.href || link.target === '_blank') return;
        
        e.preventDefault();
        handlePageTransition(link.href);
    });

    // Remove transition class when page loads
    window.addEventListener('pageshow', () => {
        document.body.classList.remove('transition-active');
    });

    // Fetch services from database
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

document.addEventListener('DOMContentLoaded', initServiceFilters);

function handlePageTransition(url) {
    document.body.classList.add('transition-active');
    
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}

const toggleSwitch = document.getElementById('dark-mode-toggle');
const rootElement = document.documentElement;

// Load the current theme from localStorage (if any)
const currentTheme = localStorage.getItem('theme');
if (currentTheme) {
  rootElement.classList.add(currentTheme);
  toggleSwitch.checked = currentTheme === 'dark-mode'; // Sync the toggle switch state
}

// Wrap toggle switch code in a check
if (toggleSwitch) {  // Only add listener if element exists
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

// Fetch services from database
async function loadServices() {
    try {
        // Check om services allerede er loaded
        if (Object.keys(window.SERVICES).length > 0) {
            return;
        }

        console.log('Starting service fetch...');
        const response = await fetch('http://localhost:3000/api/services');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const services = await response.json();
        
        // Reset services object før vi tilføjer nye
        window.SERVICES = {};
        
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
