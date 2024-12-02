const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all projects
router.get('/', async (req, res) => {
    try {
        console.log('Fetching projects...');
        const [projects] = await pool.execute(`
            SELECT p.*, 
                   t.TemplateName,
                   t.Description as TemplateDescription,
                   GROUP_CONCAT(DISTINCT ts.service_id) as service_ids,
                   GROUP_CONCAT(DISTINCT s.ServiceName) as service_names
            FROM Projects p
            LEFT JOIN Templates t ON p.ProjectId = t.ProjectId
            LEFT JOIN template_services ts ON t.TemplateId = ts.template_id
            LEFT JOIN Services s ON ts.service_id = s.ServiceId
            GROUP BY p.ProjectId, t.TemplateName, t.Description
        `);
        
        console.log('Projects fetched:', projects);
        res.json(projects);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Create new project
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { name, domain, description, templateId, userId } = req.body;
        
        const [result] = await connection.execute(
            `INSERT INTO Projects (ProjectName, Domain, Description, ProjectId, UserId, DateCreated) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [name, domain, description, templateId, userId]
        );

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
        res.status(500).json({ error: 'Failed to create project' });
    } finally {
        connection.release();
    }
});

// Delete project
router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
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

module.exports = router; 