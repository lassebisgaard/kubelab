// Class to handle all template-related functionality
class TemplateManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', async () => {
            await this.loadServices();
            await this.loadTemplates();
            this.initSearch();
        });
    }

    async loadTemplates() {
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

            // Map templates data to template format
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
            this.initTemplateActions();
            
            // Hide loading indicator
            document.querySelector('.loading-indicator')?.classList.add('hidden');
        } catch (error) {
            console.error('Error:', error);
            document.querySelector('.loading-indicator')?.classList.add('hidden');
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Failed to load templates';
            document.querySelector('.content-wrapper')?.appendChild(errorMessage);
        }
    }

    async loadServices() {
        try {
            const services = await window.initializeServices();
            const servicesContainer = document.querySelector('.services-filter');
            if (!servicesContainer) return;

            servicesContainer.innerHTML = services.map(service => `
                <div class="service-tag service-tag--selectable" 
                     data-service="${service.ServiceId}"
                     role="button"
                     tabindex="0">
                    <i class='bx ${service.Icon}'></i>
                    <span>${service.ServiceName}</span>
                </div>
            `).join('');

            this.initServiceFilters();
        } catch (error) {
            console.error('Error loading services:', error);
            this.showErrorMessage('Failed to load services');
        }
    }

    initServiceFilters() {
        const filterContainer = document.querySelector('.services-filter');
        const templateGrid = document.querySelector('.project-template-grid');
        
        if (!filterContainer || !templateGrid) return;

        const filterTags = filterContainer.querySelectorAll('.service-tag');
        filterTags.forEach(tag => {
            tag.addEventListener('click', () => {
                tag.classList.toggle('active');
                
                const activeFilters = Array.from(filterTags)
                    .filter(t => t.classList.contains('active'))
                    .map(t => t.dataset.service);

                templateGrid.querySelectorAll('.project-template-card').forEach(card => {
                    const cardServices = (card.dataset.services || '').split(',');
                    card.style.display = activeFilters.length === 0 || 
                        activeFilters.some(filter => cardServices.includes(filter)) ? '' : 'none';
                });
            });
        });
    }

    initSearch() {
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

    initTemplateActions() {
        document.querySelectorAll('.project-template-card').forEach(card => {
            const templateId = card.dataset.id;
            
            // Edit button handler
            card.querySelector('.edit-button')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.handleTemplateEdit(templateId);
            });
            
            // Delete button handler
            card.querySelector('.delete-button')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.handleTemplateDelete(templateId, card);
            });
        });
    }

    async handleTemplateEdit(templateId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/templates/${templateId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch template');
            
            const template = await response.json();
            
            localStorage.setItem('editTemplate', JSON.stringify({
                name: template.TemplateName,
                description: template.Description,
                services: template.service_ids ? template.service_ids.split(',') : [],
                previewImage: template.PreviewImage,
                yamlContent: template.YamlContent
            }));
            
            window.location.href = `create_template.html?edit=${templateId}`;
        } catch (error) {
            console.error('Error fetching template:', error);
            this.showErrorMessage('Failed to fetch template');
        }
    }

    async handleTemplateDelete(templateId, card) {
        if (!window.showDeleteConfirmation) return;

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
                    this.showErrorMessage('Failed to delete template');
                }
            }
        );
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class='bx bx-error'></i>
            <p>${message}</p>
        `;
        document.querySelector('.content-wrapper')?.appendChild(errorDiv);
        
        // Remove error after 5 seconds
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// Initialize the template manager
new TemplateManager(); 