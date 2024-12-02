async function loadTemplates() {
    try {
        const response = await fetch('http://localhost:3000/api/templates');
        const templates = await response.json();
        
        const templateGrid = document.querySelector('.project-template-grid');
        if (!templateGrid) return;

        templateGrid.innerHTML = templates.map(template => `
            <div class="card template-card" data-id="${template.TemplateId}">
                <div class="template-header">
                    <h2>${template.TemplateName || 'Unnamed Template'}</h2>
                    <div class="template-actions">
                        <button class="action-button edit-button" title="Edit template">
                            <i class='bx bx-edit'></i>
                            Edit
                        </button>
                        <button class="action-button delete-button" title="Delete template">
                            <i class='bx bx-trash'></i>
                            Delete
                        </button>
                    </div>
                </div>
                <p class="text-secondary">${template.Description || 'No description'}</p>
                
                <div class="card-content">
                    <div class="service-tags">
                        ${template.service_ids ? window.renderServiceTags(template.service_ids.split(','), {
                            isStatic: true
                        }) : ''}
                    </div>
                </div>
                
                <div class="template-meta text-secondary">
                    <span>Created: ${new Date(template.DateCreated).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');

        // Remove loading indicator
        templateGrid.querySelector('.loading-indicator')?.remove();

        // Add event listeners
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

function initTemplateActions() {
    document.querySelectorAll('.template-card').forEach(card => {
        const templateId = card.dataset.id;
        
        // Edit button
        card.querySelector('.edit-button')?.addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = `/pages/create_template.html?edit=${templateId}`;
        });
        
        // Delete button
        card.querySelector('.delete-button')?.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Delete clicked for template:', templateId);
            
            showDeleteConfirmation(
                'Delete Template',
                'Are you sure you want to delete this template?',
                async () => {
                    try {
                        console.log('Sending delete request for template:', templateId);
                        const response = await fetch(`http://localhost:3000/api/templates/${templateId}`, {
                            method: 'DELETE'
                        });
                        
                        console.log('Delete response:', response);
                        
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Failed to delete template');
                        }

                        card.remove();
                        showError('Template deleted successfully', 'success');
                    } catch (error) {
                        console.error('Error deleting template:', error);
                        showError(error.message || 'Failed to delete template');
                        throw error; // Re-throw for the confirmation handler
                    }
                }
            );
        });

        // Gør hele kortet klikbart
        card.addEventListener('click', () => {
            window.location.href = `/pages/create_template.html?edit=${templateId}`;
        });
    });
}

// Opdateret showError funktion der kan håndtere forskellige typer
function showError(message, type = 'error') {
    const errorDiv = document.createElement('div');
    errorDiv.className = `toast-message ${type}`;
    errorDiv.innerHTML = `
        <i class='bx ${type === 'success' ? 'bx-check' : 'bx-error'}'></i>
        <span>${message}</span>
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => {
        errorDiv.classList.add('fade-out');
        setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
}

function showDeleteConfirmation(title, message, onConfirm) {
    const dialog = document.createElement('div');
    dialog.className = 'modal delete-confirmation-dialog';
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
    dialog.classList.add('show');

    const closeDialog = () => {
        dialog.classList.remove('show');
        setTimeout(() => dialog.remove(), 300);
    };

    dialog.querySelector('.close-modal')?.addEventListener('click', closeDialog);
    dialog.querySelector('#cancelDelete')?.addEventListener('click', closeDialog);
    dialog.querySelector('#confirmDelete')?.addEventListener('click', async () => {
        try {
            await onConfirm();
            closeDialog();
        } catch (error) {
            console.error('Error in delete confirmation:', error);
            showError('Failed to delete template');
        }
    });
} 