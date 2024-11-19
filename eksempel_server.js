// === This code is just an example of how to make a server
// === and communicate with the database and templates ===


const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'kubelab'
});

// === Template Routes ===

// Get all templates
app.get('/api/templates', async (req, res) => {
    try {
        const [templates] = await pool.query(`
            SELECT t.*, GROUP_CONCAT(s.id) as services
            FROM templates t
            LEFT JOIN template_services ts ON t.id = ts.template_id
            LEFT JOIN services s ON ts.service_id = s.id
            GROUP BY t.id
        `);
        
        // Format services as array
        templates.forEach(template => {
            template.services = template.services ? template.services.split(',') : [];
        });
        
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching templates' });
    }
});

// Create new template
app.post('/api/templates', async (req, res) => {
    const { name, description, services, author } = req.body;
    
    try {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Insert template
            const [result] = await connection.query(
                'INSERT INTO templates (name, description, author) VALUES (?, ?, ?)',
                [name, description, author]
            );
            
            const templateId = result.insertId;
            
            // Insert services
            if (services && services.length) {
                const serviceValues = services.map(service => [templateId, service]);
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
                author, 
                services 
            });
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: 'Error creating template' });
    }
});

// Update template
app.put('/api/templates/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, services } = req.body;
    
    try {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Update template
            await connection.query(
                'UPDATE templates SET name = ?, description = ? WHERE id = ?',
                [name, description, id]
            );
            
            // Update services
            await connection.query(
                'DELETE FROM template_services WHERE template_id = ?',
                [id]
            );
            
            if (services && services.length) {
                const serviceValues = services.map(service => [id, service]);
                await connection.query(
                    'INSERT INTO template_services (template_id, service_id) VALUES ?',
                    [serviceValues]
                );
            }
            
            await connection.commit();
            res.json({ id, name, description, services });
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: 'Error updating template' });
    }
});

// Delete template
app.delete('/api/templates/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Delete template services first (foreign key constraint)
            await connection.query(
                'DELETE FROM template_services WHERE template_id = ?',
                [id]
            );
            
            // Delete template
            await connection.query(
                'DELETE FROM templates WHERE id = ?',
                [id]
            );
            
            await connection.commit();
            res.status(204).send();
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: 'Error deleting template' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 