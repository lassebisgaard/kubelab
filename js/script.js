// Tilføj i toppen af filen
console.log('script.js loaded');

// Services data - dette vil senere komme fra MySQL
const SERVICES = {
    wordpress: {
        id: 'wordpress',
        name: 'WordPress',
        icon: 'bxl-wordpress',
        description: 'Latest version of WordPress CMS'
    },
    mysql: {
        id: 'mysql',
        name: 'MySQL',
        icon: 'bx-data',
        description: 'MySQL Database Server'
    },
    phpmyadmin: {
        id: 'phpmyadmin',
        name: 'phpMyAdmin',
        icon: 'bx-server',
        description: 'Database Management Tool'
    },
    nginx: {
        id: 'nginx',
        name: 'Nginx',
        icon: 'bx-server',
        description: 'Web Server'
    },
    php: {
        id: 'php',
        name: 'PHP',
        icon: 'bxl-php',
        description: 'PHP Runtime'
    }
};

// Vent på at DOM er loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    console.log('Handlebars available:', typeof Handlebars !== 'undefined');
    
    // Site-wide initialization
    initNavigation();
    initThemeToggle();

    // Vent på at Handlebars er loaded før vi initialiserer services
    if (typeof Handlebars !== 'undefined') {
        const templateSource = document.getElementById('service-tag-template');
        console.log('Template source found:', templateSource !== null);
        
        if (templateSource) {
            // Compile Handlebars template
            const serviceTagTemplate = Handlebars.compile(templateSource.innerHTML);
            console.log('Template compiled');

            // Gør services og render funktion tilgængelig globalt
            window.SERVICES = SERVICES;
            window.renderServiceTags = function(serviceIds, isRemovable = false) {
                console.log('Rendering services:', serviceIds);
                return serviceIds.map(id => {
                    const service = SERVICES[id];
                    if (!service) {
                        console.warn('Service not found:', id);
                        return '';
                    }
                    return serviceTagTemplate({
                        ...service,
                        name: service.name,
                        isRemovable
                    });
                }).join('');
            };

            // Initialiser services på siden
            initializePageServices();
        }
    }

    // Tilføj initialisering af template filtering
    initProjectTemplateFiltering();
});

function initializePageServices() {
    // Template creation page
    const servicesSelection = document.querySelector('.services-selection');
    if (servicesSelection) {
        servicesSelection.innerHTML = window.renderServiceTags(Object.keys(SERVICES), true);
    }

    // Project creation page
    const templateCards = document.querySelectorAll('.project-template-card');
    templateCards.forEach(card => {
        const services = card.dataset.services?.split(',') || [];
        const servicesContainer = card.querySelector('.services');
        if (servicesContainer) {
            servicesContainer.innerHTML = window.renderServiceTags(services, false);
        }
    });
}

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

// Tilføj denne funktion til at håndtere filtrering
function initProjectTemplateFiltering() {
    const servicesFilterContainer = document.querySelector('.services-filter');
    const templateGrid = document.querySelector('.project-template-grid');
    const templateCards = document.querySelectorAll('.project-template-card');
    
    if (!servicesFilterContainer || !templateGrid) return;

    // Render alle services som filter tags
    servicesFilterContainer.innerHTML = window.renderServiceTags(Object.keys(SERVICES), false);
    
    // Tilføj click handlers til service tags
    servicesFilterContainer.addEventListener('click', (e) => {
        const serviceTag = e.target.closest('.service-tag');
        if (!serviceTag) return;
        
        serviceTag.classList.toggle('active');
        
        // Find alle aktive filters
        const activeFilters = Array.from(servicesFilterContainer.querySelectorAll('.service-tag.active'))
            .map(tag => tag.dataset.service);
        
        // Filtrer templates
        templateCards.forEach(card => {
            const cardServices = card.dataset.services?.split(',') || [];
            
            if (activeFilters.length === 0) {
                // Hvis ingen filtre er valgt, vis alle templates
                card.style.display = '';
            } else {
                // Tjek om template indeholder ALLE valgte services
                const hasAllServices = activeFilters.every(filter => 
                    cardServices.includes(filter)
                );
                card.style.display = hasAllServices ? '' : 'none';
            }
        });
    });
}