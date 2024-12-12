async function loadProjects() {
    try {
        const response = await fetch('http://localhost:3000/api/projects');
        const projects = await response.json();
        
        // Tjek hvilken side vi er på
        const isDetailsPage = window.location.pathname.includes('project_details.html');
        
        if (isDetailsPage) {
            await loadProjectDetails(projects);
        } else {
            await loadProjectsList(projects);
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Failed to load projects. Please try again.');
    }
}

async function loadProjectsList(projects) {
    const projectGrid = document.querySelector('.project-grid');
    if (!projectGrid) return;

    const templateSource = document.getElementById('project-card-template');
    const templateFunction = Handlebars.compile(templateSource.innerHTML);

    const projectsHtml = projects.map(project => ({
        id: project.ProjectId,
        name: project.ProjectName,
        status: project.Status || 'offline',
        template: project.TemplateName || 'Not specified',
        domain: `${project.Domain}.kubelab.dk`
    })).map(templateFunction).join('');

    projectGrid.innerHTML = projectsHtml;
    initProjectControls();
    
    // Sæt initial tilstand på power knapper
    document.querySelectorAll('.project-controls .action-button[title="Power"]').forEach(button => {
        const statusBadge = button.closest('.project-card').querySelector('.status-badge');
        button.classList.toggle('active', statusBadge.textContent === 'online');
    });
}

async function loadProjectDetails(projects) {
    const projectId = new URLSearchParams(window.location.search).get('id');
    if (!projectId) {
        window.location.href = 'projects.html';
        return;
    }

    const project = projects.find(p => p.ProjectId.toString() === projectId);
    if (!project) {
        showErrorMessage('Project not found');
        return;
    }

    const templateSource = document.getElementById('project-details-template');
    const templateFunction = Handlebars.compile(templateSource.innerHTML);

    const templateData = {
        id: project.ProjectId,
        name: project.ProjectName,
        status: project.Status || 'offline',
        owner: project.Owner || 'Not specified',
        team: project.TeamName || 'Not specified',
        domain: `${project.Domain}.kubelab.dk`,
        template: project.TemplateName || 'Not specified',
        dateCreated: new Date(project.DateCreated).toLocaleDateString(),
        serviceTagsHtml: project.service_ids ? 
            window.renderServiceTags(project.service_ids.split(','), { isStatic: true }) : 
            '<span class="text-secondary">No services added</span>'
    };

    document.getElementById('project-details-container').innerHTML = templateFunction(templateData);
    initProjectControls();
}

function initProjectControls() {
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
        
        statusBadge.textContent = isRunning ? 'stopping...' : 'starting...';
        statusBadge.className = 'status-badge transitioning';
        
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

function showErrorMessage(message) {
    const container = document.querySelector('.project-grid') || 
                     document.getElementById('project-details-container');
    
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <i class='bx bx-error'></i>
                <p>${message}</p>
                <button class="button secondary" onclick="loadProjects()">Try Again</button>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', loadProjects); 