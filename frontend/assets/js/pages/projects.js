async function loadProjects() {
    try {
        const response = await fetch('http://localhost:3000/api/projects');
        const projects = await response.json();
        
        const projectGrid = document.querySelector('.project-grid');
        if (!projectGrid) return;

        projectGrid.innerHTML = projects.map(project => `
            <div class="project-card" data-id="${project.ProjectId}">
                <div class="project-header">
                    <h3>${project.ProjectName}</h3>
                    <span class="status-badge ${project.Status?.toLowerCase() || 'offline'}">
                        ${project.Status || 'Offline'}
                    </span>
                </div>
                <div class="project-info">
                    <div class="info-row">
                        <span class="info-label">Domain:</span>
                        <a href="https://${project.Domain}.kubelab.dk" 
                           class="domain-link" 
                           target="_blank">
                            ${project.Domain}.kubelab.dk
                            <i class='bx bx-link-external'></i>
                        </a>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Template:</span>
                        <span class="info-value">${project.TemplateName || 'Custom'}</span>
                    </div>
                </div>
                <div class="project-controls">
                    <button class="power-button ${project.Status === 'Online' ? 'active' : ''}" 
                            title="Power ${project.Status === 'Online' ? 'off' : 'on'}">
                        <i class='bx bx-power-off'></i>
                    </button>
                    <button class="restart-button" 
                            title="Restart" 
                            ${project.Status !== 'Online' ? 'disabled' : ''}>
                        <i class='bx bx-refresh'></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        initProjectActions();
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function initProjectActions() {
    document.querySelectorAll('.project-card').forEach(card => {
        const projectId = card.dataset.id;
        
        // Power button
        card.querySelector('.power-button')?.addEventListener('click', async () => {
            const isActive = card.querySelector('.power-button').classList.contains('active');
            try {
                const response = await fetch(`/api/projects/${projectId}/power`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ power: !isActive })
                });
                if (response.ok) {
                    loadProjects(); // Reload to update status
                }
            } catch (error) {
                console.error('Error toggling power:', error);
            }
        });
        
        // Restart button
        card.querySelector('.restart-button')?.addEventListener('click', async () => {
            if (card.querySelector('.restart-button').disabled) return;
            
            try {
                const response = await fetch(`/api/projects/${projectId}/restart`, {
                    method: 'POST'
                });
                if (response.ok) {
                    loadProjects(); // Reload to update status
                }
            } catch (error) {
                console.error('Error restarting project:', error);
            }
        });
    });
} 