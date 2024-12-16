async function loadTemplates() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/templates', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            window.location.href = '/pages/login.html';
            return;
        }

        const templates = await response.json();
        console.log('Loaded templates:', templates);

        const templateGrid = document.querySelector('.project-template-grid');
        if (!templateGrid) {
            console.error('Template grid not found');
            return;
        }

        templateGrid.innerHTML = templates.map(template => `
            <div class="project-template-card" 
                 data-id="${template.TemplateId}"
                 data-services="${template.service_ids || ''}"
                 role="button"
                 tabindex="0">
                <div class="template-header">
                    <h3>${template.TemplateName}</h3>
                </div>
                <p class="text-secondary">${template.Description || 'No description'}</p>
                <div class="preview-container preview-container--template">
                    <img src="${template.PreviewImage ? 
                        `http://localhost:3000/uploads/images/${template.PreviewImage}` : 
                        '../assets/images/placeholder.webp'}" 
                         alt="Template preview" 
                         class="template-preview-image">
                </div>
                <div class="author text-secondary">By: ${template.UserName || 'Unknown'}</div>
                <div class="included-services text-secondary">Included services:</div>
                <div class="service-tags-container">
                    ${template.service_ids ? 
                        window.renderServiceTags(template.service_ids.split(','), { isStatic: true }) : 
                        '<span class="text-secondary">No services</span>'
                    }
                </div>
            </div>
        `).join('');

        // Add click handlers
        templateGrid.querySelectorAll('.project-template-card').forEach(card => {
            card.addEventListener('click', () => {
                templateGrid.querySelectorAll('.project-template-card')
                    .forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                if (window.projectForm) {
                    window.projectForm.formData = {
                        template: {
                            id: card.dataset.id,
                            name: card.querySelector('h3').textContent,
                            description: card.querySelector('p').textContent,
                            services: card.dataset.services?.split(',') || []
                        }
                    };
                    window.projectForm.nextButton.disabled = false;
                }
            });
        });

    } catch (error) {
        console.error('Error loading templates:', error);
        showErrorMessage('Failed to load templates');
    }
}

async function loadServices() {
    try {
        const services = await window.initializeServices();
        console.log('Loaded services:', services);

        const servicesContainer = document.querySelector('.services-filter');
        if (!servicesContainer) {
            console.error('Services container not found');
            return;
        }

        servicesContainer.innerHTML = services.map(service => `
            <div class="service-tag service-tag--selectable" 
                 data-service="${service.ServiceId}"
                 role="button"
                 tabindex="0">
                <i class='bx ${service.Icon}'></i>
                <span>${service.ServiceName}</span>
            </div>
        `).join('');

        // Initialize service filters
        window.initServiceFilters();

    } catch (error) {
        console.error('Error loading services:', error);
        showErrorMessage('Failed to load services');
    }
}

// Add this function to handle search
function initSearchFunctionality() {
    const searchInput = document.getElementById('template-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const templateCards = document.querySelectorAll('.project-template-card');
        
        templateCards.forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            const matches = name.includes(searchTerm) || description.includes(searchTerm);
            
            // Hvis der er aktive service-filtre, tjek også dem
            const activeFilters = Array.from(
                document.querySelectorAll('.service-tag--selectable.active')
            ).map(tag => tag.dataset.service);

            const cardServices = card.dataset.services?.split(',') || [];
            const matchesFilters = activeFilters.length === 0 || 
                                 activeFilters.every(filter => cardServices.includes(filter));

            card.style.display = (matches && matchesFilters) ? '' : 'none';
        });
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await loadServices();
    await loadTemplates();
    initSearchFunctionality();
}); 