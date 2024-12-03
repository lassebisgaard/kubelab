async function loadTemplates() {
    try {
        await window.loadServices();

        const response = await fetch('http://localhost:3000/api/templates');
        const templates = await response.json();
        
        console.log('Loaded templates:', templates);
        
        const templateGrid = document.querySelector('.project-template-grid');
        if (!templateGrid) return;

        const templateSource = document.getElementById('template-card-template');
        const templateFunction = Handlebars.compile(templateSource.innerHTML);

        const templatesHtml = templates.map(template => {
            const serviceIds = template.service_ids ? 
                template.service_ids.split(',').filter(id => id && id.trim()) : 
                [];

            return templateFunction({
                id: template.TemplateId,
                name: template.TemplateName,
                description: template.Description,
                dateCreated: new Date(template.DateCreated).toLocaleDateString(),
                service_ids: template.service_ids,
                serviceTagsHtml: serviceIds.length > 0 ? 
                    window.renderServiceTags(serviceIds, { isStatic: true }) : 
                    '<span class="text-secondary">No services added</span>'
            });
        }).join('');

        templateGrid.innerHTML = templatesHtml;

        initSearch();
        initTemplateActions();
    } catch (error) {
        console.error('Error loading templates:', error);
        const templateGrid = document.querySelector('.project-template-grid');
        if (templateGrid) {
            templateGrid.innerHTML = `
                <div class="error-message">
                    <i class='bx bx-error'></i>
                    <p>Failed to load templates. Please try again.</p>
                    <button class="button secondary" onclick="loadTemplates()">Try Again</button>
                </div>
            `;
        }
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
        
        card.querySelector('.edit-button')?.addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = `create_template.html?edit=${templateId}`;
        });
        
        card.querySelector('.delete-button')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.showDeleteConfirmation) {
                window.showDeleteConfirmation(
                    'Delete Template',
                    'Are you sure you want to delete this template?',
                    async () => {
                        try {
                            const response = await fetch(`http://localhost:3000/api/templates/${templateId}`, {
                                method: 'DELETE'
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

document.addEventListener('DOMContentLoaded', loadTemplates); 