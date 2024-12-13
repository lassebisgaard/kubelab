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
        const templateGrid = document.querySelector('.project-template-grid');
        if (!templateGrid) return;

        // Compile Handlebars template
        const templateSource = document.getElementById('template-card-template');
        const templateFunction = Handlebars.compile(templateSource.innerHTML);

        // Map templates data til template format
        const templatesHtml = templates.map(template => ({
            id: template.TemplateId,
            name: template.TemplateName,
            description: template.Description || 'No description',
            image: template.PreviewImage ? 
                `http://localhost:3000/uploads/images/${template.PreviewImage}` : 
                '../assets/images/placeholder.webp',
            author: template.UserName || 'Unknown',
            dateCreated: new Date(template.DateCreated).toLocaleDateString(),
            services: template.service_ids || '',
            serviceTagsHtml: template.service_ids ? 
                window.renderServiceTags(template.service_ids.split(','), { isStatic: true }) : 
                '<span class="text-secondary">No services added</span>'
        })).map(templateFunction).join('');

        templateGrid.innerHTML = templatesHtml;
        
        // Initialize template actions
        initTemplateActions();
        
        // Hide loading indicator
        document.querySelector('.loading-indicator')?.classList.add('hidden');
    } catch (error) {
        console.error('Error:', error);
        document.querySelector('.loading-indicator')?.classList.add('hidden');
        // Vis fejlbesked til brugeren
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Failed to load templates';
        document.querySelector('.content-wrapper')?.appendChild(errorMessage);
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

function initSearch() {
    const searchInput = document.getElementById('template-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.project-template-card');

        cards.forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            const isVisible = name.includes(searchTerm) || description.includes(searchTerm);
            card.style.display = isVisible ? '' : 'none';
        });
    });
}

function initTemplateActions() {
    document.querySelectorAll('.project-template-card').forEach(card => {
        const templateId = card.dataset.id;
        
        // Edit knap handler
        card.querySelector('.edit-button')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:3000/api/templates/${templateId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) throw new Error('Failed to fetch template');
                
                const template = await response.json();
                
                // Gem template data i localStorage
                localStorage.setItem('editTemplate', JSON.stringify({
                    name: template.TemplateName,
                    description: template.Description,
                    services: template.service_ids ? template.service_ids.split(',') : [],
                    previewImage: template.PreviewImage,
                    yamlContent: template.YamlContent
                }));
                
                // Redirect til edit side
                window.location.href = `create_template.html?edit=${templateId}`;
            } catch (error) {
                console.error('Error fetching template:', error);
            }
        });
        
        // Delete knap handler
        card.querySelector('.delete-button')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.showDeleteConfirmation) {
                window.showDeleteConfirmation(
                    'Delete Template',
                    'Are you sure you want to delete this template?',
                    async () => {
                        try {
                            const token = localStorage.getItem('token');
                            const response = await fetch(`http://localhost:3000/api/templates/${templateId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            
                            if (!response.ok) throw new Error('Failed to delete template');
                            
                            card.remove();
                        } catch (error) {
                            console.error('Error deleting template:', error);
                        }
                    }
                );
            }
        });
    });
}

// Initialiser søgning og templates når siden loades
document.addEventListener('DOMContentLoaded', async () => {
    await loadServices();
    await loadTemplates();
    initSearch();
}); 