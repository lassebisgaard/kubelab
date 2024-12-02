const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Serve static templates page
router.get('/', (req, res) => {
    res.sendFile('templates.html', { root: './frontend/pages' });
});

// API: Get all templates
router.get('/api/templates', async (req, res) => {
    try {
        const [templates] = await pool.execute(`
            SELECT t.*, 
                   GROUP_CONCAT(s.ServiceId) as service_ids,
                   GROUP_CONCAT(s.ServiceName) as service_names,
                   GROUP_CONCAT(s.Icon) as service_icons
            FROM Templates t
            LEFT JOIN template_services ts ON t.TemplateId = ts.template_id
            LEFT JOIN Services s ON ts.service_id = s.ServiceId
            GROUP BY t.TemplateId
        `);

        // Format templates med deres services
        const formattedTemplates = templates.map(template => ({
            id: template.TemplateId,
            name: template.TemplateName,
            description: template.Description,
            dateCreated: template.DateCreated,
            services: template.service_ids ? 
                template.service_ids.split(',').map((id, index) => ({
                    id,
                    name: template.service_names.split(',')[index],
                    icon: template.service_icons.split(',')[index]
                })) : []
        }));

        res.json(formattedTemplates);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// API: Create new template
router.post('/api/templates', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { name, description, services = [] } = req.body;

        // Insert template
        const [result] = await connection.execute(
            'INSERT INTO Templates (TemplateName, Description, DateCreated) VALUES (?, ?, NOW())',
            [name, description]
        );

        const templateId = result.insertId;

        // Insert template services
        if (services.length > 0) {
            const serviceValues = services.map(serviceId => [templateId, serviceId]);
            await connection.execute(
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
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to create template' });
    } finally {
        connection.release();
    }
});

// API: Delete template
router.delete('/api/templates/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Delete template services first
        await connection.execute(
            'DELETE FROM template_services WHERE template_id = ?',
            [req.params.id]
        );

        // Then delete template
        await connection.execute(
            'DELETE FROM Templates WHERE TemplateId = ?',
            [req.params.id]
        );

        await connection.commit();
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    } finally {
        connection.release();
    }
});

module.exports = router;