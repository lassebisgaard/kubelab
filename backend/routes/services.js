const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Get all services
router.get('/', verifyToken, async (req, res) => {
    try {
        const [services] = await pool.execute('SELECT * FROM Services');
        res.json(services);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// Create new service (admin only)
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { name, icon } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO Services (ServiceName, Icon) VALUES (?, ?)',
            [name, icon]
        );
        res.status(201).json({ id: result.insertId, name, icon });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to create service' });
    }
});

// Delete service
router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Check if service is being used
        const [templates] = await connection.execute(
            'SELECT COUNT(*) as count FROM template_services WHERE service_id = ?',
            [req.params.id]
        );
        
        if (templates[0].count > 0) {
            await connection.rollback();
            return res.status(409).json({ 
                error: 'Service cannot be deleted as it is being used by one or more templates' 
            });
        }
        
        // Delete service if not in use
        const [result] = await connection.execute(
            'DELETE FROM Services WHERE ServiceId = ?',
            [req.params.id]
        );
        
        await connection.commit();
        
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Service not found' });
        } else {
            res.json({ message: 'Service deleted successfully' });
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Failed to delete service' });
    } finally {
        connection.release();
    }
});

module.exports = router;