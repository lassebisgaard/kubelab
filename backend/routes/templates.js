const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all templates
router.get('/', async (req, res) => {
    try {
        console.log('Fetching templates...');
        const [templates] = await pool.execute(`
            SELECT t.*, 
                   GROUP_CONCAT(s.ServiceId) as service_ids,
                   GROUP_CONCAT(s.ServiceName) as service_names
            FROM Templates t
            LEFT JOIN template_services ts ON t.TemplateId = ts.template_id
            LEFT JOIN Services s ON ts.service_id = s.ServiceId
            GROUP BY t.TemplateId
        `);
        
        console.log('Templates fetched:', templates);
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
        console.log('Creating template with data:', req.body);
        
        // Validate required fields
        const { name, description } = req.body;
        if (!name || !description) {
            return res.status(400).json({ 
                error: 'Name and description are required' 
            });
        }

        await connection.beginTransaction();

        // Insert template with validated data
        const [result] = await connection.execute(
            `INSERT INTO Templates (TemplateName, Description, DateCreated) 
             VALUES (?, ?, NOW())`,
            [name, description]
        );

        const templateId = result.insertId;

        // Handle services if they exist
        const services = req.body.services || [];
        if (services.length > 0) {
            const serviceValues = services.map(serviceId => [templateId, serviceId]);
            await connection.query(
                'INSERT INTO template_services (template_id, service_id) VALUES ?',
                [serviceValues]
            );
        }

        await connection.commit();
        
        res.status(201).json({
            id: templateId,
            name,
            description,
            services
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating template:', error);
        res.status(500).json({ 
            error: 'Failed to create template',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Delete template
router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const templateId = req.params.id;
        console.log('Attempting to delete template:', templateId);
        
        await connection.beginTransaction();

        // Check om templaten eksisterer
        const [template] = await connection.execute(
            'SELECT * FROM Templates WHERE TemplateId = ?',
            [templateId]
        );

        if (template.length === 0) {
            throw new Error('Template not found');
        }

        // Slet service associations
        console.log('Deleting template services...');
        await connection.execute(
            'DELETE FROM template_services WHERE template_id = ?',
            [templateId]
        );

        // Slet template
        console.log('Deleting template...');
        const [result] = await connection.execute(
            'DELETE FROM Templates WHERE TemplateId = ?',
            [templateId]
        );

        await connection.commit();
        console.log('Template deleted successfully');
        
        res.json({ 
            message: 'Template deleted successfully',
            templateId 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting template:', error);
        
        if (error.message === 'Template not found') {
            res.status(404).json({ error: 'Template not found' });
        } else {
            res.status(500).json({ 
                error: 'Failed to delete template',
                details: error.message 
            });
        }
    } finally {
        connection.release();
    }
});

// Update template
router.put('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const templateId = req.params.id;
        const { name, description, services = [] } = req.body;

        await connection.beginTransaction();

        // Opdater template
        await connection.execute(
            `UPDATE Templates 
             SET TemplateName = ?, Description = ?
             WHERE TemplateId = ?`,
            [name, description, templateId]
        );

        // Opdater services
        await connection.execute(
            'DELETE FROM template_services WHERE template_id = ?',
            [templateId]
        );

        if (services.length > 0) {
            const serviceValues = services.map(serviceId => [templateId, serviceId]);
            await connection.query(
                'INSERT INTO template_services (template_id, service_id) VALUES ?',
                [serviceValues]
            );
        }

        await connection.commit();
        res.json({ 
            id: templateId,
            name,
            description,
            services
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating template:', error);
        res.status(500).json({ 
            error: 'Failed to update template',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Get single template
router.get('/:id', async (req, res) => {
    try {
        const [templates] = await pool.execute(`
            SELECT t.*, 
                   GROUP_CONCAT(s.ServiceId) as service_ids,
                   GROUP_CONCAT(s.ServiceName) as service_names
            FROM Templates t
            LEFT JOIN template_services ts ON t.TemplateId = ts.template_id
            LEFT JOIN Services s ON ts.service_id = s.ServiceId
            WHERE t.TemplateId = ?
            GROUP BY t.TemplateId
        `, [req.params.id]);

        if (templates.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.json(templates[0]);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});

module.exports = router;