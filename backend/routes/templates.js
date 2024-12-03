const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all templates
router.get('/', async (req, res) => {
    try {
        // Simpel JOIN der henter templates med deres services
        const [templates] = await pool.execute(`
            SELECT t.*, 
                   GROUP_CONCAT(ts.service_id) as service_ids
            FROM Templates t
            LEFT JOIN template_services ts ON t.TemplateId = ts.template_id
            GROUP BY t.TemplateId
        `);
        res.json(templates);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// Create new template
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Insert template
        const [result] = await connection.execute(
            'INSERT INTO Templates (TemplateName, Description, DateCreated) VALUES (?, ?, NOW())',
            [req.body.name, req.body.description]
        );

        // Insert service relations hvis der er nogle
        if (req.body.services?.length > 0) {
            const serviceValues = req.body.services.map(serviceId => [result.insertId, serviceId]);
            await connection.query(
                'INSERT INTO template_services (template_id, service_id) VALUES ?',
                [serviceValues]
            );
        }

        await connection.commit();
        res.status(201).json({
            id: result.insertId,
            name: req.body.name,
            description: req.body.description,
            services: req.body.services || []
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    } finally {
        connection.release();
    }
});

// Delete template
router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Slet service relations og template i én transaktion
        await connection.execute(
            'DELETE FROM template_services WHERE template_id = ?',
            [req.params.id]
        );
        
        const [result] = await connection.execute(
            'DELETE FROM Templates WHERE TemplateId = ?',
            [req.params.id]
        );
        
        await connection.commit();
        
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Template not found' });
        } else {
            res.json({ message: 'Template deleted successfully' });
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    } finally {
        connection.release();
    }
});

module.exports = router;