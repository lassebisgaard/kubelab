const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const PortainerService = require('../services/portainerService');
const portainerService = new PortainerService();

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Hent alle projekter
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste af projekter
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ProjectId:
 *                     type: integer
 *                   ProjectName:
 *                     type: string
 *                   UserId:
 *                     type: integer
 *                   Status:
 *                     type: string
 *                     enum: [online, offline]
 *   post:
 *     summary: Opret nyt projekt
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectName
 *               - templateId
 *             properties:
 *               projectName:
 *                 type: string
 *               templateId:
 *                 type: integer
 * 
 * /api/projects/{id}:
 *   delete:
 *     summary: Slet projekt
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Projekt slettet
 *       404:
 *         description: Projekt ikke fundet
 *       500:
 *         description: Server fejl
 * 
 *   get:
 *     summary: Hent specifikt projekt
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Projekt detaljer
 *
 * /api/projects/{id}/start:
 *   post:
 *     summary: Start projekt
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Projekt startet
 *
 * /api/projects/{id}/stop:
 *   post:
 *     summary: Stop projekt
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Projekt stoppet
 *
 * /api/projects/{id}/restart:
 *   post:
 *     summary: Genstart projekt
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Projekt genstartet
 *
 * /api/projects/{id}/status:
 *   get:
 *     summary: Hent projekt status
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Projekt status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [online, offline]
 */

// Get all projects with template, team and user info
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const isAdmin = req.user.isAdmin;

        // Base query for user's own projects
        let query = `
            SELECT 
                p.*,
                t.TemplateName,
                t.Description as TemplateDescription,
                u.Name as UserName,
                u.Name as Owner,
                tm.TeamName,
                CASE 
                    WHEN p.UserId = ? THEN 'own'
                    ELSE 'other'
                END as ProjectType
            FROM Projects p
            LEFT JOIN Templates t ON p.TemplateId = t.TemplateId
            LEFT JOIN Users u ON p.UserId = u.UserId
            LEFT JOIN Teams tm ON u.TeamId = tm.TeamId
            WHERE p.UserId = ?
        `;
        
        let queryParams = [userId, userId];

        // If admin, get all projects
        if (isAdmin) {
            query = `
                SELECT 
                    p.*,
                    t.TemplateName,
                    t.Description as TemplateDescription,
                    u.Name as UserName,
                    u.Name as Owner,
                    tm.TeamName,
                    CASE 
                        WHEN p.UserId = ? THEN 'own'
                        ELSE 'other'
                    END as ProjectType
                FROM Projects p
                LEFT JOIN Templates t ON p.TemplateId = t.TemplateId
                LEFT JOIN Users u ON p.UserId = u.UserId
                LEFT JOIN Teams tm ON u.TeamId = tm.TeamId
            `;
            queryParams = [userId];
        }
        
        const [projects] = await pool.execute(query, queryParams);
        
        // Hent status for hvert projekt
        const projectsWithStatus = await Promise.all(projects.map(async (project) => {
            const status = await portainerService.getStackStatus(project.ProjectName);
            return {
                ...project,
                Status: status
            };
        }));
        
        res.json(projectsWithStatus);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get specific project with all info
router.get('/:id', async (req, res) => {
    try {
        const [project] = await pool.execute(`
            SELECT 
                p.*,
                t.TemplateName,
                t.Description as TemplateDescription,
                u.Name as UserName,
                tm.TeamName
            FROM Projects p
            LEFT JOIN Templates t ON p.TemplateId = t.TemplateId
            LEFT JOIN Users u ON p.UserId = u.UserId
            LEFT JOIN Teams tm ON u.TeamId = tm.TeamId
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
        console.log('Received request body:', req.body);
        
        const projectData = {
            name: req.body.name,
            domain: req.body.domain,
            description: req.body.description || '',
            templateId: req.body.templateId,
            userId: req.user.userId,
            dateCreated: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };

        console.log('Project Data:', projectData);
        
        // Create project in database
        const [result] = await connection.execute(
            'INSERT INTO Projects (ProjectName, Description, Domain, UserId, TemplateId, DateCreated) VALUES (?, ?, ?, ?, ?, ?)',
            [projectData.name, projectData.description, projectData.domain, projectData.userId, projectData.templateId, projectData.dateCreated]
        );

        // Create stack in Portainer
        const deployResult = await portainerService.createStack(projectData);
        if (!deployResult.success) {
            // If Portainer creation fails, delete from database
            await connection.execute('DELETE FROM Projects WHERE ProjectId = ?', [result.insertId]);
            throw new Error(deployResult.message || 'Failed to create stack in Portainer');
        }

        res.json({
            message: 'Project created successfully',
            projectId: result.insertId,
            status: deployResult.status || 'online',
            deploymentMessage: deployResult.message
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project', details: error.message });
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
                // Slet stack i Portainer
                await portainerService.deleteStack(project[0].ProjectName);
            } catch (portainerError) {
                // Hvis fejlen er "not found", er det okay - fortsæt bare
                if (!portainerError.message?.includes('not found')) {
                    console.error('Portainer deletion failed:', portainerError);
                }
                // Vi fortsætter med at slette fra databasen uanset hvad
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

// Get project status
router.get('/:id/status', async (req, res) => {
    try {
        const [project] = await pool.execute(
            'SELECT ProjectName FROM Projects WHERE ProjectId = ?',
            [req.params.id]
        );

        if (!project || project.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const projectName = project[0].ProjectName;
        
        const status = await portainerService.getStackStatus(projectName);

        res.json({ status });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get project status' });
    }
});

module.exports = router; 