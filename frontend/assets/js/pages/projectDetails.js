async function loadProjectDetails() {
    try {
        // Get project ID from URL
        const projectId = new URLSearchParams(window.location.search).get('id');
        if (!projectId) {
            window.location.href = 'projects.html';
            return;
        }

        // Load services first
        await window.loadServices();
        
        // Get project data
        const response = await fetch(`http://localhost:3000/api/projects/${projectId}`);
        if (!response.ok) {
            throw new Error('Failed to load project');
        }
        
        const project = await response.json();
        console.log('Project data:', project); // For debugging

        // Render using Handlebars (som vi gør i templates.js og projects.js)
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
            dateCreated: new Date(project.DateCreated).toLocaleDateString(),
            serviceTagsHtml: project.service_ids ? 
                window.renderServiceTags(project.service_ids.split(','), { isStatic: true }) : 
                '<span class="text-secondary">No services added</span>'
        };

        document.getElementById('project-details-container').innerHTML = 
            templateFunction(templateData);

        // Initialize controls efter rendering (som i templates.js)
        initProjectControls(projectId);

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
    document.querySelectorAll('.project-controls .action-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (button.title === 'Power') {
                handlePowerToggle(projectId, button);
            } else if (button.title === 'Restart') {
                handleRestart(projectId, button);
            }
        });
    });
    
    // Sæt initial tilstand på power knap
    const powerButton = document.querySelector('.action-button[title="Power"]');
    const statusBadge = document.querySelector('.status-badge');
    if (powerButton && statusBadge) {
        powerButton.classList.toggle('active', statusBadge.textContent === 'online');
    }
}

async function handlePowerToggle(projectId, button) {
    try {
        const controls = button.closest('.project-controls');
        controls.querySelectorAll('.action-button').forEach(btn => {
            btn.disabled = true;
        });
        
        const statusBadge = document.querySelector('.status-badge');
        const isRunning = statusBadge.textContent === 'online';
        const action = isRunning ? 'stop' : 'start';
        
        // Vis transitioning status med animation
        statusBadge.textContent = isRunning ? 'stopping...' : 'starting...';
        statusBadge.className = 'status-badge transitioning';
        button.classList.add('transitioning');
        
        const response = await fetch(`http://localhost:3000/api/projects/${projectId}/${action}`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(`Failed to ${action} project`);
        }

        const result = await response.json();
        button.classList.toggle('active', result.status === 'online');
        
        statusBadge.textContent = result.status;
        statusBadge.className = `status-badge ${result.status}`;
        
    } catch (error) {
        console.error('Error toggling project state:', error);
        alert(`Failed to toggle project state. Please try again.`);
        // Reset status ved fejl
        const statusBadge = document.querySelector('.status-badge');
        const currentStatus = button.classList.contains('active') ? 'online' : 'offline';
        statusBadge.textContent = currentStatus;
        statusBadge.className = `status-badge ${currentStatus}`;
    } finally {
        button.classList.remove('transitioning');
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
        
        const statusBadge = document.querySelector('.status-badge');
        statusBadge.textContent = 'restarting...';
        statusBadge.className = 'status-badge transitioning';
        
        button.classList.add('rotating');
        const response = await fetch(`http://localhost:3000/api/projects/${projectId}/restart`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Failed to restart project');
        }

        const result = await response.json();
        statusBadge.textContent = result.status;
        statusBadge.className = `status-badge ${result.status}`;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
        console.error('Error restarting project:', error);
        alert('Failed to restart project. Please try again.');
        // Reset status ved fejl
        const statusBadge = document.querySelector('.status-badge');
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
    try {
        const response = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete project');
        
        window.location.href = 'projects.html';
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete project. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', loadProjectDetails); 