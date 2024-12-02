const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Serve static project page
router.get('/', (req, res) => {
    res.sendFile('project.html', { root: './frontend/pages' });
});

// API: Get all projects
router.get('/api/projects', async (req, res) => {
    try {
        const [projects] = await pool.execute(`
            SELECT p.*, 
                   t.TemplateName as template_name,
                   t.Description as template_description
            FROM Projects p
            LEFT JOIN Templates t ON p.TemplateId = t.TemplateId
        `);
        res.json(projects);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// API: Create new project
router.post('/api/projects', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { name, domain, description, templateId } = req.body;

        // Insert project
        const [result] = await connection.execute(
            `INSERT INTO Projects 
            (ProjectName, Domain, Description, TemplateId, DateCreated) 
            VALUES (?, ?, ?, ?, NOW())`,
            [name, domain, description, templateId]
        );

        await connection.commit();
        
        res.status(201).json({
            id: result.insertId,
            name,
            domain,
            description,
            templateId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    } finally {
        connection.release();
    }
});

// API: Delete project
router.delete('/api/projects/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        await connection.execute(
            'DELETE FROM Projects WHERE ProjectId = ?',
            [req.params.id]
        );

        await connection.commit();
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    } finally {
        connection.release();
    }
});

// API: Update project status
router.patch('/api/projects/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await pool.execute(
            'UPDATE Projects SET Status = ? WHERE ProjectId = ?',
            [status, req.params.id]
        );
        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

module.exports = router; 