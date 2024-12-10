const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const multer = require('multer');
const upload = multer();

// Get all templates
router.get('/', async (req, res) => {
    try {
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

// Get single template by ID
router.get('/:id', async (req, res) => {
    try {
        const [templates] = await pool.execute(`
            SELECT t.*, 
                   GROUP_CONCAT(ts.service_id) as service_ids
            FROM Templates t
            LEFT JOIN template_services ts ON t.TemplateId = ts.template_id
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

// Create new template
router.post('/', upload.fields([
    { name: 'yaml', maxCount: 1 }
]), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Debug logs
        console.log('File received:', req.files);
        console.log('File content:', req.files?.yaml?.[0]?.buffer?.toString('utf8'));
        console.log('Form data:', req.body);
        
        // Håndter YAML fil
        const yamlContent = req.files?.yaml?.[0]?.buffer?.toString('utf8') || null;
        const previewBase64 = req.body.preview || null;
        
        // Insert template
        const [result] = await connection.execute(
            'INSERT INTO Templates (TemplateName, Description, YamlContent, PreviewImage, DateCreated) VALUES (?, ?, ?, ?, NOW())',
            [req.body.name, req.body.description, yamlContent, previewBase64]
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

// Update template
router.put('/:id', upload.fields([
    { name: 'yaml', maxCount: 1 }
]), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const updates = [];
        const values = [];
        
        if (req.body.name) {
            updates.push('TemplateName = ?');
            values.push(req.body.name);
        }
        if (req.body.description) {
            updates.push('Description = ?');
            values.push(req.body.description);
        }
        if (req.files?.yaml) {
            updates.push('YamlContent = ?');
            values.push(req.files.yaml[0].buffer.toString('utf8'));
        }
        if (req.body.preview) {
            updates.push('PreviewImage = ?');
            values.push(req.body.preview);
        }
        
        values.push(req.params.id);
        
        if (updates.length > 0) {
            await connection.execute(
                `UPDATE Templates SET ${updates.join(', ')} WHERE TemplateId = ?`,
                values
            );
        }
        
        if (req.body.services) {
            await connection.execute(
                'DELETE FROM template_services WHERE template_id = ?',
                [req.params.id]
            );
            
            const services = JSON.parse(req.body.services);
            if (services.length > 0) {
                const serviceValues = services.map(serviceId => [req.params.id, serviceId]);
                await connection.query(
                    'INSERT INTO template_services (template_id, service_id) VALUES ?',
                    [serviceValues]
                );
            }
        }
        
        await connection.commit();
        res.json({ message: 'Template updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Failed to update template' });
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