const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const PortainerService = require('../services/portainerService');
const portainerService = new PortainerService();

// Get all projects
router.get('/', async (req, res) => {
    try {
        const portainer = new PortainerService();
        const [projects] = await pool.execute('SELECT * FROM Projects');
        
        // Hent status for hvert projekt
        const projectsWithStatus = await Promise.all(projects.map(async (project) => {
            const status = await portainer.getStackStatus(project.ProjectName);
            return {
                ...project,
                Status: status
            };
        }));
        
        res.json(projectsWithStatus);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get specific project by ID
router.get('/:id', async (req, res) => {
    try {
        const [project] = await pool.execute(`
            SELECT p.*, 
                   t.TemplateName,
                   t.Description as TemplateDescription,
                   GROUP_CONCAT(ts.service_id) as service_ids,
                   GROUP_CONCAT(s.ServiceName) as service_names
            FROM Projects p
            LEFT JOIN Templates t ON t.ProjectId = p.ProjectId
            LEFT JOIN template_services ts ON t.TemplateId = ts.template_id
            LEFT JOIN Services s ON ts.service_id = s.ServiceId
            WHERE p.ProjectId = ?
            GROUP BY p.ProjectId, t.TemplateName, t.Description
        `, [req.params.id]);

        if (!project || project.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({
            ProjectId: project[0].ProjectId,
            ProjectName: project[0].ProjectName,
            Status: project[0].Status || 'offline',
            Owner: 'Admin',
            TeamName: 'Default Team',
            Domain: project[0].Domain,
            TemplateName: project[0].TemplateName || project[0].Description,
            DateCreated: project[0].DateCreated,
            service_ids: project[0].service_ids
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch project details' });
    }
});

// Create new project
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { 
            name, 
            domain, 
            description, 
            templateId, 
            userId = 1 
        } = req.body;
        
        console.log('Creating project with data:', { name, domain, description, templateId, userId });
        
        const [result] = await connection.execute(
            `INSERT INTO Projects (ProjectName, Domain, Description, UserId, DateCreated) 
             VALUES (?, ?, ?, ?, NOW())`,
            [name, domain, description, userId]
        );

        const portainer = new PortainerService();
        await portainer.createStack({
            name,
            domain,
            templateId
        });

        await connection.commit();
        
        res.status(201).json({
            id: result.insertId,
            name,
            domain,
            description,
            templateId,
            userId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating project:', error);
        res.status(500).json({ 
            error: 'Failed to create project',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Delete project
router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const [project] = await connection.execute(
            'SELECT ProjectName FROM Projects WHERE ProjectId = ?',
            [req.params.id]
        );

        if (project && project[0]) {
            try {
                await portainerService.deleteStack(project[0].ProjectName);
            } catch (portainerError) {
                console.error('Portainer deletion failed:', portainerError);
            }
        }

        const [result] = await connection.execute(
            'DELETE FROM Projects WHERE ProjectId = ?',
            [req.params.id]
        );
        
        await connection.commit();
        
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Project not found' });
        } else {
            res.json({ message: 'Project deleted successfully' });
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    } finally {
        connection.release();
    }
});

// Start project
router.post('/:id/start', async (req, res) => {
    try {
        const [project] = await pool.execute(
            'SELECT ProjectName FROM Projects WHERE ProjectId = ?',
            [req.params.id]
        );

        if (!project || project.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const success = await portainerService.startStack(project[0].ProjectName);
        if (success) {
            res.json({ status: 'online' });
        } else {
            res.status(500).json({ error: 'Failed to start project' });
        }
    } catch (error) {
        console.error('Error starting project:', error);
        res.status(500).json({ error: 'Failed to start project' });
    }
});

// Stop project
router.post('/:id/stop', async (req, res) => {
    try {
        const [project] = await pool.execute(
            'SELECT ProjectName FROM Projects WHERE ProjectId = ?',
            [req.params.id]
        );

        if (!project || project.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const success = await portainerService.stopStack(project[0].ProjectName);
        if (success) {
            res.json({ status: 'offline' });
        } else {
            res.status(500).json({ error: 'Failed to stop project' });
        }
    } catch (error) {
        console.error('Error stopping project:', error);
        res.status(500).json({ error: 'Failed to stop project' });
    }
});

// Restart project
router.post('/:id/restart', async (req, res) => {
    try {
        const [project] = await pool.execute(
            'SELECT ProjectName FROM Projects WHERE ProjectId = ?',
            [req.params.id]
        );

        if (!project || project.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        await portainerService.stopStack(project[0].ProjectName);
        const success = await portainerService.startStack(project[0].ProjectName);

        if (success) {
            res.json({ status: 'online' });
        } else {
            res.status(500).json({ error: 'Failed to restart project' });
        }
    } catch (error) {
        console.error('Error restarting project:', error);
        res.status(500).json({ error: 'Failed to restart project' });
    }
});

module.exports = router; 