const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const multer = require('multer');
const upload = multer();  // Simpel multer setup uden ekstra config

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
router.post('/', upload.single('yaml'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Debug logs
        console.log('File received:', req.file);
        console.log('File content:', req.file?.buffer?.toString('utf8'));
        console.log('Form data:', req.body);
        
        // Insert template med YAML
        const yamlContent = req.file?.buffer?.toString('utf8') || null;
        console.log('YAML content to be inserted:', yamlContent);
        
        const [result] = await connection.execute(
            'INSERT INTO Templates (TemplateName, Description, YamlContent, DateCreated) VALUES (?, ?, ?, NOW())',
            [req.body.name, req.body.description, yamlContent]
        );

        // Parse services fra string til array
        if (req.body.services) {
            const services = JSON.parse(req.body.services);
            const serviceValues = services.map(serviceId => [result.insertId, serviceId]);
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
            services: req.body.services ? JSON.parse(req.body.services) : []
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