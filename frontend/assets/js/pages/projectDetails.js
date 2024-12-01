class ProjectDetails {
    constructor() {
        // Flyt hele initialiseringen ind i DOMContentLoaded
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        });
    }

    init() {
        // Get ID from URL
        this.projectId = new URLSearchParams(window.location.search).get('id');
        console.log('Project ID:', this.projectId); // Debug log

        // Redirect if no ID
        if (!this.projectId) {
            console.log('No project ID found, redirecting...'); // Debug log
            window.location.href = 'projects.html';
            return;
        }

        // Compile template and load data
        this.template = Handlebars.compile(document.getElementById('project-details-template').innerHTML);
        this.loadProjectDetails();
    }

    async loadProjectDetails() {
        try {
            console.log('Fetching project details for ID:', this.projectId); // Debug log
            
            // Brug den korrekte API sti
            const response = await fetch(`http://localhost:3000/api/projects/${this.projectId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const project = await response.json();
            console.log('Project data:', project); // Debug log

            // Format data for template
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

            // Render template
            document.getElementById('project-details-container').innerHTML = 
                this.template(templateData);

            // Initialize controls after rendering
            this.initializeControls();

        } catch (error) {
            console.error('Error loading project details:', error);
            document.getElementById('project-details-container').innerHTML = 
                '<div class="error-message">Failed to load project details. Please try again later.</div>';
        }
    }

    formatServices(serviceIds) {
        if (!serviceIds) return [];
        
        // Definer services hvis window.SERVICES ikke findes
        const SERVICES = {
            wordpress: { name: 'WordPress', icon: 'bxl-wordpress' },
            mysql: { name: 'MySQL', icon: 'bx-data' },
            phpmyadmin: { name: 'phpMyAdmin', icon: 'bx-server' }
            // Tilføj flere services efter behov
        };

        return serviceIds.split(',').map(id => {
            const service = SERVICES[id] || window.SERVICES?.[id];
            return service ? {
                name: service.name,
                icon: service.icon
            } : null;
        }).filter(Boolean);
    }

    initializeControls() {
        // Power button
        document.querySelector('[title="Power"]')?.addEventListener('click', () => {
            // Toggle power state
            console.log('Power toggle clicked');
        });

        // Restart button
        document.querySelector('[title="Restart"]')?.addEventListener('click', () => {
            // Restart project
            console.log('Restart clicked');
        });

        // Delete button
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

// Initialize
new ProjectDetails(); 