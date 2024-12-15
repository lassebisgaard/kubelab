const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsPath = path.join(__dirname, '..', 'uploads', 'images');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Konfigurer multer til kun at håndtere preview billeder
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'preview') {
        cb(null, true);
    } else {
        cb(new Error('Unexpected field'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
});

// Get all templates
router.get('/', async (req, res) => {
    try {
        const [templates] = await pool.execute(`
            SELECT t.*, 
                   GROUP_CONCAT(ts.service_id) as service_ids,
                   u.Name as UserName
            FROM Templates t
            LEFT JOIN template_services ts ON t.TemplateId = ts.template_id
            LEFT JOIN Users u ON t.UserId = u.UserId
            GROUP BY t.TemplateId
        `);
        res.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
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
router.post('/', upload.single('preview'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Debug logs
        console.log('File received:', req.file);
        console.log('Form data:', req.body);
        
        // Get YAML content directly from the request body
        const yamlContent = req.body.yamlContent;
        if (!yamlContent) {
            throw new Error('YAML content is required');
        }

        const previewPath = req.file?.filename || null;
        const userId = req.body.userId || null;
        
        // Insert template with UserId and YamlContent
        const [result] = await connection.execute(
            'INSERT INTO Templates (TemplateName, Description, YamlContent, PreviewImage, DateCreated, UserId) VALUES (?, ?, ?, ?, NOW(), ?)',
            [
                req.body.name || '', 
                req.body.description || '', 
                yamlContent,
                previewPath,
                userId
            ]
        );

        // Handle services
        if (req.body.services) {
            try {
                const services = JSON.parse(req.body.services);
                if (Array.isArray(services) && services.length > 0) {
                    const serviceValues = services.map(serviceId => [result.insertId, serviceId]);
                    await connection.query(
                        'INSERT INTO template_services (template_id, service_id) VALUES ?',
                        [serviceValues]
                    );
                }
            } catch (e) {
                console.error('Error parsing services:', e);
            }
        }

        await connection.commit();
        
        // Fetch the created template with all details
        const [newTemplate] = await connection.execute(`
            SELECT t.*, u.Name as UserName
            FROM Templates t
            LEFT JOIN Users u ON t.UserId = u.UserId
            WHERE t.TemplateId = ?
        `, [result.insertId]);

        res.status(201).json(newTemplate[0]);
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

// Update template
router.put('/:id', upload.single('preview'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const updates = [];
        const values = [];
        
        // Mere detaljeret debug logging
        console.log('Update request:', {
            body: req.body,
            file: req.file
        });
        
        if (req.body.name) {
            updates.push('TemplateName = ?');
            values.push(req.body.name);
        }
        if (req.body.description) {
            updates.push('Description = ?');
            values.push(req.body.description);
        }
        if (req.body.yamlContent) {
            updates.push('YamlContent = ?');
            values.push(req.body.yamlContent);
        }
        if (req.file) {
            updates.push('PreviewImage = ?');
            values.push(req.file.filename);
        }
        
        values.push(req.params.id);
        
        if (updates.length > 0) {
            const query = `UPDATE Templates SET ${updates.join(', ')} WHERE TemplateId = ?`;
            console.log('Final update query:', query);
            console.log('Final values:', values);
            await connection.execute(query, values);
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