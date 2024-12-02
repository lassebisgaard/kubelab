async function loadProjects() {
    try {
        const response = await fetch('http://localhost:3000/api/projects');
        const projects = await response.json();
        
        const projectGrid = document.querySelector('.project-grid');
        if (!projectGrid) return;

        const templateSource = document.getElementById('project-card-template');
        const templateFunction = Handlebars.compile(templateSource.innerHTML);

        // Render project cards
        const projectsHtml = projects.map(project => {
            const templateData = {
                id: project.ProjectId,
                name: project.ProjectName,
                status: project.Status || 'offline',
                template: project.TemplateName || 'Not specified',
                domain: `${project.Domain}.kubelab.dk`
            };
            
            return templateFunction(templateData);
        }).join('');

        projectGrid.innerHTML = projectsHtml;

        // Add click handlers for controls
        document.querySelectorAll('.project-controls .action-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const projectCard = button.closest('.project-card');
                const projectId = projectCard.dataset.projectId;
                
                if (button.title === 'Power') {
                    handlePowerToggle(projectId, button);
                } else if (button.title === 'Restart') {
                    handleRestart(projectId, button);
                }
            });
        });

    } catch (error) {
        console.error('Error loading projects:', error);
        showErrorMessage('Failed to load projects. Please try again.');
    }
}

function initProjectControls() {
    // Stop event propagation på control buttons så de ikke trigger card click
    document.querySelectorAll('.project-controls .action-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop event fra at boble op til card
            
            const projectCard = button.closest('.project-card');
            const projectId = projectCard.getAttribute('data-project-id');
            
            if (button.title === 'Power') {
                handlePowerToggle(projectId, button);
            } else if (button.title === 'Restart') {
                handleRestart(projectId, button);
            }
        });
    });
}

async function handlePowerToggle(projectId, button) {
    const isRunning = button.classList.contains('active');
    try {
        const action = isRunning ? 'stop' : 'start';
        const response = await fetch(`http://localhost:3000/api/projects/${projectId}/${action}`, {
            method: 'POST'
        });

        if (response.ok) {
            button.classList.toggle('active');
            const card = button.closest('.project-card');
            const statusBadge = card.querySelector('.status-badge');
            
            if (isRunning) {
                statusBadge.textContent = 'Offline';
                statusBadge.className = 'status-badge offline';
            } else {
                statusBadge.textContent = 'Online';
                statusBadge.className = 'status-badge online';
            }
        }
    } catch (error) {
        console.error('Error toggling project state:', error);
    }
}

async function handleRestart(projectId, button) {
    try {
        button.classList.add('rotating');
        const response = await fetch(`http://localhost:3000/api/projects/${projectId}/restart`, {
            method: 'POST'
        });

        if (response.ok) {
            setTimeout(() => button.classList.remove('rotating'), 1000);
        }
    } catch (error) {
        console.error('Error restarting project:', error);
        button.classList.remove('rotating');
    }
}

function showErrorMessage(message) {
    const projectGrid = document.querySelector('.project-grid');
    if (projectGrid) {
        projectGrid.innerHTML = `
            <div class="error-message">
                <i class='bx bx-error'></i>
                <p>${message}</p>
                <button class="button secondary" onclick="location.reload()">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', loadProjects); 