async function loadProjectDetails() {
    try {
        const token = localStorage.getItem('token');
        const projectId = new URLSearchParams(window.location.search).get('id');
        
        if (!projectId) {
            window.location.href = '/pages/projects.html';
            return;
        }

        const response = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            window.location.href = '/pages/login.html';
            return;
        }

        const project = await response.json();

        // Render using Handlebars
        const templateSource = document.getElementById('project-details-template');
        const templateFunction = Handlebars.compile(templateSource.innerHTML);

        const templateData = {
            id: project.ProjectId,
            name: project.ProjectName,
            status: project.Status || 'offline',
            owner: project.UserName || 'Not specified',
            team: project.TeamName || 'Not specified',
            domain: `${project.Domain}.kubelab.dk`,
            template: project.TemplateName || 'Not specified',
            dateCreated: new Date(project.DateCreated).toLocaleDateString()
        };

        document.getElementById('project-details-container').innerHTML = 
            templateFunction(templateData);

        // Initialize controls efter rendering
        initProjectControls(project.ProjectId);

    } catch (error) {
        console.error('Error loading project details:', error);
        document.getElementById('project-details-container').innerHTML = `
            <div class="error-message">
                <i class='bx bx-error'></i>
                <p>Failed to load project details. Please try again.</p>
                <button class="button secondary" onclick="loadProjectDetails()">Try Again</button>
            </div>
        `;
    }
}

function initProjectControls(projectId) {
    const projectCard = document.querySelector('.project-card');
    if (!projectCard) return;

    // Power og Restart knapper
    projectCard.querySelectorAll('.project-controls .action-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (button.title === 'Power') {
                handlePowerToggle(projectId, button);
            } else if (button.title === 'Restart') {
                handleRestart(projectId, button);
            }
        });
    });
    
    // Delete handler
    const deleteButton = projectCard.querySelector('.button.delete');
    if (deleteButton) {
        deleteButton.addEventListener('click', () => deleteProject(projectId));
    }
    
    // Initial power button state
    const powerButton = projectCard.querySelector('.action-button[title="Power"]');
    const statusBadge = projectCard.querySelector('.status-badge');
    if (powerButton && statusBadge) {
        powerButton.classList.toggle('active', statusBadge.textContent === 'online');
    }
}

async function handlePowerToggle(projectId, button) {
    let action;
    const statusBadge = button.closest('.project-card').querySelector('.status-badge');
    const isRunning = statusBadge.textContent === 'online';
    try {
        const controls = button.closest('.project-controls');
        controls.querySelectorAll('.action-button').forEach(btn => {
            btn.disabled = true;
        });
        
        action = isRunning ? 'stop' : 'start';
        const token = localStorage.getItem('token');
        
        statusBadge.textContent = isRunning ? 'stopping...' : 'starting...';
        statusBadge.className = 'status-badge transitioning';
        
        const response = await fetch(`http://localhost:3000/api/projects/${projectId}/${action}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to ${action} project`);
        }

        const result = await response.json();
        button.classList.toggle('active', result.status === 'online');
        
        statusBadge.textContent = result.status;
        statusBadge.className = `status-badge ${result.status}`;
        
    } catch (error) {
        console.error('Error:', error);
        alert(`Failed to ${action} project. Please try again.`);
        statusBadge.textContent = isRunning ? 'online' : 'offline';
        statusBadge.className = `status-badge ${isRunning ? 'online' : 'offline'}`;
    } finally {
        const controls = button.closest('.project-controls');
        controls.querySelectorAll('.action-button').forEach(btn => {
            btn.disabled = false;
        });
    }
}

async function handleRestart(projectId, button) {
    try {
        const controls = button.closest('.project-controls');
        controls.querySelectorAll('.action-button').forEach(btn => {
            btn.disabled = true;
        });
        
        const statusBadge = button.closest('.project-card').querySelector('.status-badge');
        statusBadge.textContent = 'restarting...';
        statusBadge.className = 'status-badge transitioning';
        
        const token = localStorage.getItem('token');
        button.classList.add('rotating');
        
        const response = await fetch(`http://localhost:3000/api/projects/${projectId}/restart`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to restart project');
        }

        const result = await response.json();
        statusBadge.textContent = result.status;
        statusBadge.className = `status-badge ${result.status}`;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to restart project. Please try again.');
        const statusBadge = button.closest('.project-card').querySelector('.status-badge');
        statusBadge.textContent = 'offline';
        statusBadge.className = 'status-badge offline';
    } finally {
        button.classList.remove('rotating');
        const controls = button.closest('.project-controls');
        controls.querySelectorAll('.action-button').forEach(btn => {
            btn.disabled = false;
        });
    }
}

async function deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete project');
            
            window.location.href = '/pages/projects.html';
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to delete project. Please try again.');
        }
    }
}

document.addEventListener('DOMContentLoaded', loadProjectDetails); 