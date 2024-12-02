const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all projects
router.get('/', async (req, res) => {
    try {
        console.log('Fetching projects...');
        const [projects] = await pool.execute(`
            SELECT 
                p.ProjectId,
                p.ProjectName,
                p.Domain,
                p.Description,
                p.DateCreated,
                p.UserId,
                t.TemplateName,
                t.Description as TemplateDescription
            FROM Projects p
            LEFT JOIN Templates t ON p.ProjectId = t.ProjectId
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
        console.log('Creating project with data:', req.body);
        await connection.beginTransaction();
        
        const { name, domain, description, templateId, userId } = req.body;

        const [result] = await connection.execute(
            `INSERT INTO Projects 
            (ProjectName, Domain, Description, UserId, DateCreated) 
            VALUES (?, ?, ?, ?, NOW())`,
            [name, domain, description, userId]
        );

        // Hvis der er valgt en template, opdater template med project ID
        if (templateId) {
            await connection.execute(
                `UPDATE Templates SET ProjectId = ? WHERE TemplateId = ?`,
                [result.insertId, templateId]
            );
        }

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

module.exports = router; 