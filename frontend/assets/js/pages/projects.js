// Projekt Manager klasse
class ProjectManager {
    constructor() {
        this.projects = [];
        this.initializePage();
    }

    async initializePage() {
        const isProjectsPage = window.location.pathname.includes('projects.html');
        const isDetailsPage = window.location.pathname.includes('project_details.html');
        const isCreateProject = window.location.pathname.includes('create_project.html');

        if (isProjectsPage || isDetailsPage) {
            await this.loadProjects();
            if (isProjectsPage) {
                await this.loadProjectsList();
            } else {
                await this.loadProjectDetails();
            }
            this.initializeSearchFields();
            this.startStatusUpdates();
        } else if (isCreateProject) {
            this.initProjectCreation();
        }
    }

    async loadProjects() {
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
            
            this.projects = await response.json();
            const user = JSON.parse(localStorage.getItem('user'));

            await Promise.all(this.projects.map(async (project) => {
                try {
                    const statusResponse = await fetch(`http://localhost:3000/api/projects/${project.ProjectId}/status`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (statusResponse.ok) {
                        const statusData = await statusResponse.json();
                        project.Status = statusData.status;
                        project.isRunning = statusData.status === 'online';
                    }
                } catch (error) {
                    project.Status = 'unknown';
                    project.isRunning = false;
                }
            }));

            this.projects.forEach(project => {
                project.ProjectType = project.UserId === user.UserId ? 'own' : 'other';
            });

        } catch (error) {
            showErrorMessage('Failed to load projects');
        }
    }

    async loadProjectsList() {
        const myProjectsGrid = document.querySelector('.section:first-child .project-template-grid');
        const studentsSection = document.querySelector('.students-section');
        
        if (!myProjectsGrid) return;

        const user = JSON.parse(localStorage.getItem('user'));
        const isAdmin = user?.isAdmin;

       
        const myProjects = this.projects.filter(p => p.ProjectType === 'own');
        const studentProjects = this.projects.filter(p => p.ProjectType === 'other');

        const templateSource = document.getElementById('project-card-template');
        const templateFunction = Handlebars.compile(templateSource.innerHTML);

      
        myProjectsGrid.innerHTML = myProjects.map(project => templateFunction({
            id: project.ProjectId,
            name: project.ProjectName,
            status: project.Status,
            template: project.TemplateName || 'Not specified',
            domain: `${project.Domain}.kubelab.dk`
        })).join('');

        // Render Students Projects if admin
        if (isAdmin && studentProjects.length > 0) {
            studentsSection.style.display = 'block';
            const tableBody = studentsSection.querySelector('.table-body');
            tableBody.innerHTML = studentProjects.map(project => `
                <div class="table-row" 
                     data-project-id="${project.ProjectId}"
                     onclick="window.location.href='project_details.html?id=${project.ProjectId}'"
                     role="button"
                     tabindex="0">
                    <div class="col-name">${project.ProjectName}</div>
                    <div class="col-domain">${project.Domain}.kubelab.dk</div>
                    <div class="col-owner">${project.Owner || 'Not specified'}</div>
                    <div class="col-status">
                        <div class="status-badge ${project.Status}">${project.Status}</div>
                    </div>
                    <div class="col-controls project-controls">
                        <button class="action-button ${project.isRunning ? 'active' : ''}" 
                                title="Power" 
                                onclick="event.stopPropagation()">
                            <i class='bx bx-power-off'></i>
                        </button>
                        <button class="action-button" 
                                title="Restart" 
                                onclick="event.stopPropagation()">
                            <i class='bx bx-refresh'></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            studentsSection.style.display = 'none';
        }

        this.initProjectControls();
    }

    async loadProjectDetails() {
        const projectId = new URLSearchParams(window.location.search).get('id');
        if (!projectId) {
            window.location.href = 'projects.html';
            return;
        }

        const project = this.projects.find(p => p.ProjectId.toString() === projectId);
        if (!project) {
            showErrorMessage('Project not found');
            return;
        }

        const templateSource = document.getElementById('project-details-template');
        const templateFunction = Handlebars.compile(templateSource.innerHTML);

        const templateData = {
            id: project.ProjectId,
            name: project.ProjectName,
            status: project.Status,
            isRunning: project.isRunning,
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
        this.initProjectControls();
        this.initDeleteButton();
    }

    async updateProjectStatus(projectId) {
        try {
            const token = localStorage.getItem('token');
            const statusResponse = await fetch(`http://localhost:3000/api/projects/${projectId}/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                
                const projectElements = document.querySelectorAll(`[data-project-id="${projectId}"]`);
                projectElements.forEach(element => {
                    const statusBadge = element.querySelector('.status-badge');
                    const powerButton = element.querySelector('.action-button[title="Power"]');
                    
                    if (statusBadge) {
                        statusBadge.textContent = statusData.status;
                        statusBadge.className = `status-badge ${statusData.status}`;
                    }

                    if (powerButton) {
                        powerButton.classList.toggle('active', statusData.status === 'online');
                    }
                });

                return statusData.status;
            }
        } catch (error) {
        }
        return 'unknown';
    }

    async handlePowerToggle(projectId, button) {
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

            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.updateProjectStatus(projectId);
            
        } catch (error) {
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

    initProjectControls() {
        document.querySelectorAll('.project-controls .action-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                const container = button.closest('.project-card, .table-row');
                const projectId = container.dataset.projectId;
                
                if (button.title === 'Power') {
                    await this.handlePowerToggle(projectId, button);
                } else if (button.title === 'Restart') {
                    
                    const powerButton = container.querySelector('[title="Power"]');
                    await this.handlePowerToggle(projectId, powerButton);  
                    await this.handlePowerToggle(projectId, powerButton);  
                }
            });
        });
    }

    initializeSearchFields() {
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

    startStatusUpdates() {
        setInterval(() => {
            document.querySelectorAll('[data-project-id]').forEach(container => {
                const projectId = container.dataset.projectId;
                this.updateProjectStatus(projectId);
            });
        }, 10000);
    }

    initDeleteButton() {
        const deleteButton = document.querySelector('.danger-zone .delete');
        if (!deleteButton) return;

        deleteButton.addEventListener('click', () => {
            if (window.showDeleteConfirmation) {
                window.showDeleteConfirmation(
                    'Delete Project',
                    'Are you sure you want to delete this project? This action cannot be undone.',
                    async () => {
                        try {
                            const projectId = new URLSearchParams(window.location.search).get('id');
                            const token = localStorage.getItem('token');
                            const response = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });

                            if (!response.ok) throw new Error('Failed to delete project');

                            // Redirect back to projects page after successful deletion
                            window.location.href = '/pages/projects.html';
                        } catch (error) {
                            console.error('Error:', error);
                            showErrorMessage('Failed to delete project');
                        }
                    }
                );
            }
        });
    }

    async handleDelete(projectId) {
        try {
            const container = document.querySelector(`[data-project-id="${projectId}"]`);
            if (container) {
                container.classList.add('loading');  // Tilføj loading state
            }

            const response = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete project');
            
            // Redirect eller opdater UI
            window.location.href = '/pages/projects.html';
        } catch (error) {
            console.error('Error:', error);
            showErrorMessage('Failed to delete project');
        } finally {
            const container = document.querySelector(`[data-project-id="${projectId}"]`);
            if (container) {
                container.classList.remove('loading');
            }
        }
    }
}

// Initialiser når siden er loaded
document.addEventListener('DOMContentLoaded', () => {
    window.projectManager = new ProjectManager();
}); 