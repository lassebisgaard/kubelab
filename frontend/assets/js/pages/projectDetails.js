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

        // Render using Handlebars (som vi gør i templates.js og projects.js)
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
    // Power button
    document.querySelector('[title="Power"]')?.addEventListener('click', () => {
        console.log('Power toggle clicked');
    });

    // Restart button
    document.querySelector('[title="Restart"]')?.addEventListener('click', () => {
        console.log('Restart clicked');
    });

    // Delete button
    document.querySelector('.button.delete')?.addEventListener('click', () => {
        if (window.showDeleteConfirmation) {
            window.showDeleteConfirmation(
                'Delete Project',
                'Are you sure you want to delete this project?',
                () => deleteProject(projectId)
            );
        }
    });
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