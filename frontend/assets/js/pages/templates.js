async function loadTemplates() {
    try {
        await window.loadServices();

        const response = await fetch('http://localhost:3000/api/templates');
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
            image: template.PreviewImage || '../assets/images/placeholder.webp',
            author: template.Owner || 'Unknown',
            service_ids: template.service_ids,
            dateCreated: new Date(template.DateCreated).toLocaleDateString(),
            serviceTagsHtml: template.service_ids ? 
                window.renderServiceTags(template.service_ids.split(','), { isStatic: true }) : 
                '<span class="text-secondary">No services added</span>'
        })).map(templateFunction).join('');

        templateGrid.innerHTML = templatesHtml;

        // Fjern loading indicator
        const loadingIndicator = templateGrid.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }

        initTemplateActions();
    } catch (error) {
        console.error('Error loading templates:', error);
        const templateGrid = document.querySelector('.project-template-grid');
        templateGrid.innerHTML = `
            <div class="error-message">
                <i class='bx bx-error'></i>
                <p>Failed to load templates</p>
                <button class="button secondary" onclick="loadTemplates()">Try Again</button>
            </div>
        `;
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
                const response = await fetch(`http://localhost:3000/api/templates/${templateId}`);
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
        
        // Delete knap handler (uændret)
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

// Initialiser søgning og templates når siden loades
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
    initSearch();
}); 