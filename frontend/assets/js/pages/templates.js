async function loadTemplates() {
    try {
        await window.loadServices();

        const response = await fetch('http://localhost:3000/api/templates');
        const templates = await response.json();
        
        const templateGrid = document.querySelector('.project-template-grid');
        if (!templateGrid) return;

        templateGrid.innerHTML = templates.map(template => `
            <div class="project-template-card" 
                 data-id="${template.TemplateId}" 
                 data-services="${template.service_ids || ''}">
                <div class="template-header">
                    <h3>${template.TemplateName}</h3>
                    <div class="template-actions">
                        <button class="action-button edit-button" title="Edit template">
                            <i class='bx bx-edit'></i>
                        </button>
                        <button class="action-button delete-button" title="Delete template">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </div>
                <p class="text-secondary">${template.Description || 'No description'}</p>
                <div class="preview-container preview-container--template">
                    <img src="${template.Image || '../assets/images/placeholder.webp'}" alt="Template preview">
                </div>
                <div class="author text-secondary">By: ${template.Owner || 'Unknown'}</div>
                <div class="included-services text-secondary">Included services:</div>
                <div class="service-tags-container">
                    ${template.service_ids ? window.renderServiceTags(template.service_ids.split(','), { isStatic: true }) : 
                    '<span class="text-secondary">No services added</span>'}
                </div>
                <div class="template-meta text-secondary">
                    <span>Created: ${new Date(template.DateCreated).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');

        initTemplateActions();
    } catch (error) {
        console.error('Error loading templates:', error);
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