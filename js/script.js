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

// Consolidate all DOMContentLoaded events
document.addEventListener('DOMContentLoaded', () => {
    // Handle sidebar toggle
    const resizeBtn = document.querySelector('[data-resize-btn]');
    if (resizeBtn) {
        resizeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.documentElement.classList.toggle('sb-expanded');
            // Save state
            localStorage.setItem('sidebarExpanded', document.documentElement.classList.contains('sb-expanded'));
        });
    }

    // Initialize form if we're on a form page
    const formType = document.body.dataset.formType;
    if (formType) {
        new BaseStepForm(formType);
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

