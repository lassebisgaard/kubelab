async function loadProjects() {
    try {
        const response = await fetch('/api/projects');
        const projects = await response.json();
        
        const projectGrid = document.querySelector('.project-grid');
        if (!projectGrid) return;

        const templateSource = document.getElementById('project-card-template');
        const templateFunction = Handlebars.compile(templateSource.innerHTML);

        // Render project cards
        projectGrid.innerHTML = projects.map(project => templateFunction({
            id: project.ProjectId,
            name: project.ProjectName,
            status: 'offline',  // Hardcoded for now
            template: project.Description,
            domain: `${project.Domain}.kubelab.dk`
        })).join('');

        initProjectControls();
    } catch (error) {
        console.error('Error loading projects:', error);
        showErrorMessage('Failed to load projects. Please try again.');
    }
}

function initProjectControls() {
    document.querySelectorAll('.project-card').forEach(card => {
        const projectId = card.dataset.id;
        const powerBtn = card.querySelector('.control-button[title="Power"]');
        const restartBtn = card.querySelector('.control-button[title="Restart"]');
        const statusBadge = card.querySelector('.status-badge');
        
        // Power button handler
        powerBtn?.addEventListener('click', async () => {
            const isRunning = powerBtn.classList.contains('active');
            try {
                const action = isRunning ? 'stop' : 'start';
                const response = await fetch(`/api/projects/${projectId}/${action}`);

                if (response.ok) {
                    powerBtn.classList.toggle('active');
                    restartBtn.disabled = !powerBtn.classList.contains('active');
                    
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
        });

        // Restart button handler
        restartBtn?.addEventListener('click', async () => {
            try {
                restartBtn.classList.add('rotating');
                const response = await fetch(`/api/projects/${projectId}/restart`);

                if (response.ok) {
                    setTimeout(() => restartBtn.classList.remove('rotating'), 1000);
                }
            } catch (error) {
                console.error('Error restarting project:', error);
                restartBtn.classList.remove('rotating');
            }
        });
    });
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

document.addEventListener('DOMContentLoaded', loadProjects); 