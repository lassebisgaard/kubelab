class ProjectDetails {
    constructor() {
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        });
    }

    init() {
        this.projectId = new URLSearchParams(window.location.search).get('id');
        console.log('Project ID:', this.projectId); // Debug log

        if (!this.projectId) {
            console.log('No project ID found, redirecting...'); // Debug log
            window.location.href = 'projects.html';
            return;
        }

        this.template = Handlebars.compile(document.getElementById('project-details-template').innerHTML);
        this.loadProjectDetails();
    }

    async loadProjectDetails() {
        try {
            await window.loadServices();
            
            const response = await fetch(`http://localhost:3000/api/projects/${this.projectId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const project = await response.json();

            const templateData = {
                name: project.ProjectName,
                status: project.Status || 'offline',
                owner: project.Owner || 'Not specified',
                team: project.TeamName || 'Not specified',
                domain: `${project.Domain}.kubelab.dk`,
                template: project.TemplateName || 'Not specified',
                dateCreated: new Date(project.DateCreated).toLocaleDateString(),
                services: this.formatServices(project.service_ids)
            };

            document.getElementById('project-details-container').innerHTML = 
                this.template(templateData);

            this.initializeControls();

        } catch (error) {
            console.error('Error loading project details:', error);
            document.getElementById('project-details-container').innerHTML = 
                '<div class="error-message">Failed to load project details. Please try again later.</div>';
        }
    }

    formatServices(serviceIds) {
        if (!serviceIds) return [];
        
        return serviceIds.split(',').map(id => {
            const service = window.SERVICES?.[id];
            return service ? {
                name: service.name,
                icon: service.icon
            } : null;
        }).filter(Boolean);
    }

    initializeControls() {
        document.querySelector('[title="Power"]')?.addEventListener('click', () => {
            console.log('Power toggle clicked');
        });

        document.querySelector('[title="Restart"]')?.addEventListener('click', () => {
            console.log('Restart clicked');
        });

        document.querySelector('.button.delete')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                this.deleteProject();
            }
        });
    }

    async deleteProject() {
        try {
            const response = await fetch(`http://localhost:3000/api/projects/${this.projectId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                window.location.href = 'projects.html';
            } else {
                throw new Error('Failed to delete project');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Failed to delete project. Please try again.');
        }
    }
}

new ProjectDetails(); 