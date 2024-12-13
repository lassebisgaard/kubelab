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

        // Brug samme template struktur som templates.html
        templateGrid.innerHTML = templates.map(template => `
            <div class="project-template-card" data-id="${template.TemplateId}">
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
                        renderServiceTags(template.service_ids.split(','), { isStatic: true }) : 
                        '<span class="text-secondary">No services</span>'
                    }
                </div>
                <div class="template-meta text-secondary">
                    <span>Created: ${new Date(template.DateCreated).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');

        // Add click handlers
        document.querySelectorAll('.project-template-card').forEach(card => {
            card.addEventListener('click', () => selectTemplate(card.dataset.id));
        });

    } catch (error) {
        console.error('Error loading templates:', error);
        showErrorMessage('Failed to load templates');
    }
}

async function loadServices() {
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
        console.log('Loaded services:', services); // Debug log

        const servicesContainer = document.querySelector('.services-filter');
        if (!servicesContainer) {
            console.error('Services container not found');
            return;
        }

        servicesContainer.innerHTML = services.map(service => `
            <div class="service-tag service-tag--selectable" data-service="${service.ServiceId}">
                <i class='bx ${service.Icon}'></i>
                <span>${service.ServiceName}</span>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading services:', error);
        showErrorMessage('Failed to load services');
    }
}

// Kald loadTemplates når siden loader
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
    loadServices();
}); 