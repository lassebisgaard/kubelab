const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all projects with template info
router.get('/', async (req, res) => {
    try {
        console.log('Fetching projects...');
        const [projects] = await pool.execute(`
            SELECT 
                p.*,
                t.TemplateName,
                t.Description as TemplateDescription
            FROM Projects p
            LEFT JOIN Templates t ON p.TemplateId = t.TemplateId
        `);
        
        console.log('Found projects:', projects);
        res.json(projects);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch projects',
            details: error.message 
        });
    }
});

// Get specific project with template info
router.get('/:id', async (req, res) => {
    try {
        const [project] = await pool.execute(`
            SELECT p.*, t.TemplateName, t.Description as TemplateDescription
            FROM Projects p
            LEFT JOIN Templates t ON p.TemplateId = t.TemplateId
            WHERE p.ProjectId = ?
        `, [req.params.id]);

        if (!project || project.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(project[0]);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
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
            `INSERT INTO Projects (ProjectName, Domain, Description, UserId, TemplateId, DateCreated) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [name, domain, description, userId, templateId]
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