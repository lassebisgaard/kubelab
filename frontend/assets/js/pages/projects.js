async function loadProjects() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/projects', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            window.location.href = '/pages/login.html';
            return;
        }
        
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
    const myProjectsGrid = document.querySelector('.section:first-child .project-template-grid');
    const studentsSection = document.querySelector('.students-section');
    const studentsProjectsGrid = document.querySelector('.students-section .project-template-grid');
    
    if (!myProjectsGrid) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user?.isAdmin;

    // Filter projects
    const myProjects = projects.filter(p => p.ProjectType === 'own');
    const studentProjects = projects.filter(p => p.ProjectType === 'other');

    const templateSource = document.getElementById('project-card-template');
    const templateFunction = Handlebars.compile(templateSource.innerHTML);

    // Render My Projects
    myProjectsGrid.innerHTML = myProjects.map(project => templateFunction({
        id: project.ProjectId,
        name: project.ProjectName,
        status: project.Status || 'offline',
        template: project.TemplateName || 'Not specified',
        domain: `${project.Domain}.kubelab.dk`
    })).join('');

    // Render Students Projects if admin
    if (isAdmin && studentProjects.length > 0) {
        studentsSection.style.display = 'block';
        const tableBody = studentsSection.querySelector('.table-body');
        tableBody.innerHTML = studentProjects.map(project => `
            <div class="table-row" data-project-id="${project.ProjectId}">
                <div class="col-name">${project.ProjectName}</div>
                <div class="col-domain">${project.Domain}.kubelab.dk</div>
                <div class="col-owner">${project.UserName || 'Not specified'}</div>
                <div class="col-status">
                    <div class="status-badge ${project.Status || 'offline'}">${project.Status || 'offline'}</div>
                </div>
                <div class="col-controls project-controls">
                    <button class="action-button" title="Power">
                        <i class='bx bx-power-off'></i>
                    </button>
                    <button class="action-button" title="Restart">
                        <i class='bx bx-refresh'></i>
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        studentsSection.style.display = 'none';
    }

    initProjectControls();
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
    // Håndter både projekt kort og student projekt rækker
    document.querySelectorAll('.project-controls .action-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Find projekt ID fra enten kort eller række
            const container = button.closest('.project-card, .table-row');
            const projectId = container.dataset.projectId;
            
            if (button.title === 'Power') {
                handlePowerToggle(projectId, button);
            } else if (button.title === 'Restart') {
                handleRestart(projectId, button);
            }
        });

        // Sæt initial power button state
        if (button.title === 'Power') {
            const container = button.closest('.project-card, .table-row');
            const statusElement = container.querySelector('.status-badge');
            if (statusElement) {
                button.classList.toggle('active', statusElement.textContent === 'online');
            }
        }
    });
}

async function handlePowerToggle(projectId, button) {
    let action;
    const container = button.closest('.project-card, .table-row');
    const statusBadge = container.querySelector('.status-badge');
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

        if (!response.ok) throw new Error(`Failed to ${action} project`);

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

function initializeSearchFields() {
    // My projects search
    const myProjectsSearch = document.getElementById('project-search');
    if (myProjectsSearch) {
        myProjectsSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const projectCards = document.querySelector('.project-template-grid')
                .querySelectorAll('.project-card');
            
            projectCards.forEach(card => {
                const projectName = card.querySelector('h3').textContent.toLowerCase();
                const template = card.querySelector('.info-row:first-child span:last-child').textContent.toLowerCase();
                const domain = card.querySelector('.info-row:nth-child(2) span:last-child').textContent.toLowerCase();
                
                card.style.display = (projectName.includes(searchTerm) || 
                    template.includes(searchTerm) || 
                    domain.includes(searchTerm)) ? '' : 'none';
            });
        });
    }

    // Students projects search
    const studentProjectsSearch = document.getElementById('student-project-search');
    if (studentProjectsSearch) {
        studentProjectsSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const tableRows = document.querySelectorAll('.table-row');
            
            tableRows.forEach(row => {
                const projectName = row.querySelector('.col-name').textContent.toLowerCase();
                const domain = row.querySelector('.col-domain').textContent.toLowerCase();
                const owner = row.querySelector('.col-owner')?.textContent.toLowerCase() || '';
                const status = row.querySelector('.status-badge').textContent.toLowerCase();
                
                row.style.display = (projectName.includes(searchTerm) || 
                    domain.includes(searchTerm) || 
                    owner.includes(searchTerm) || 
                    status.includes(searchTerm)) ? '' : 'none';
            });
        });
    }
}

// Tilføj denne linje efter at projekterne er blevet indlæst
document.addEventListener('DOMContentLoaded', () => {
    loadProjects().then(() => {
        initializeSearchFields();
    });
}); 