async function loadProjectDetails() {
    try {
        const projectId = new URLSearchParams(window.location.search).get('id');
        if (!projectId) {
            window.location.href = 'projects.html';
            return;
        }

        const token = localStorage.getItem('token');
        
        // Hent projekt og status samtidigt
        const [projectResponse, statusResponse] = await Promise.all([
            fetch(`http://localhost:3000/api/projects/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`http://localhost:3000/api/projects/${projectId}/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        if (!projectResponse.ok) {
            throw new Error('Failed to load project');
        }

        const project = await projectResponse.json();
        
        // Sæt status direkte fra status response
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            project.Status = statusData.status;
            project.isRunning = statusData.status === 'online';
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
        
        // Initialiser controls og start status opdateringer
        initProjectControls();
        startStatusUpdates();

    } catch (error) {
        console.error('Error loading project details:', error);
        showErrorMessage('Failed to load project details');
    }
}

// Genbruger de fælles funktioner fra projects.js
function startStatusUpdates() {
    setInterval(() => {
        const projectId = new URLSearchParams(window.location.search).get('id');
        if (projectId) {
            updateProjectStatus(projectId);
        }
    }, 10000);
}

// Start når siden er loaded
document.addEventListener('DOMContentLoaded', loadProjectDetails); 