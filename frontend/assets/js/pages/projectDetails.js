async function loadProjectDetails() {
    try {
        const token = localStorage.getItem('token');
        const projectId = new URLSearchParams(window.location.search).get('id');
        
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
        console.log('Project data:', project);

        // Hent status fra Portainer
        const portainerResponse = await fetch(`http://localhost:3000/api/projects/${projectId}/status`);
        if (portainerResponse.ok) {
            const statusData = await portainerResponse.json();
            project.Status = statusData.status;
        }

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
            dateCreated: new Date(project.DateCreated).toLocaleDateString(),
            serviceTagsHtml: project.service_ids ? 
                window.renderServiceTags(project.service_ids.split(','), { isStatic: true }) : 
                '<span class="text-secondary">No services added</span>'
        };

        document.getElementById('project-details-container').innerHTML = 
            templateFunction(templateData);

        // Initialize controls efter rendering
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
    
    // Tilføj delete handler
    const deleteButton = document.querySelector('.button.delete');
    console.log('Found delete button:', deleteButton);
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                try {
                    const response = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        throw new Error('Failed to delete project');
                    }

                    window.location.href = '/pages/projects.html';
                } catch (error) {
                    console.error('Error deleting project:', error);
                    alert('Failed to delete project. Please try again.');
                }
            }
        });
    }
    
    // Sæt initial tilstand på power knap
    const powerButton = document.querySelector('.action-button[title="Power"]');
    const statusBadge = document.querySelector('.status-badge');
    if (powerButton && statusBadge) {
        powerButton.classList.toggle('active', statusBadge.textContent === 'online');
    }
}

async function handlePowerToggle(projectId, button) {
    try {
        const token = localStorage.getItem('token');
        const statusBadge = document.querySelector('.status-badge');
        const isRunning = statusBadge.textContent === 'online';
        const action = isRunning ? 'stop' : 'start';
        
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
        showErrorMessage(`Failed to ${action} project`);
    }
}

async function handleRestart(projectId, button) {
    try {
        const token = localStorage.getItem('token');
        const statusBadge = document.querySelector('.status-badge');
        statusBadge.textContent = 'restarting...';
        statusBadge.className = 'status-badge transitioning';
        
        button.classList.add('rotating');
        const response = await fetch(`http://localhost:3000/api/projects/${projectId}/restart`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            window.location.href = '/pages/login.html';
            return;
        }

        const result = await response.json();
        statusBadge.textContent = result.status;
        statusBadge.className = `status-badge ${result.status}`;
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Failed to restart project');
    }
}

async function deleteProject(projectId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            window.location.href = '/pages/login.html';
            return;
        }

        if (!response.ok) throw new Error('Failed to delete project');
        
        window.location.href = '/pages/projects.html';
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Failed to delete project');
    }
}

document.addEventListener('DOMContentLoaded', loadProjectDetails); 