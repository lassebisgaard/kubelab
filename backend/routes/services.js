const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all services - simpel og lige til
router.get('/', async (req, res) => {
    console.log('Services GET route called');
    try {
        const [services] = await pool.execute('SELECT ServiceId, ServiceName, Icon FROM Services');
        res.json(services);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// Create new service - kun de nødvendige felter
router.post('/', async (req, res) => {
    try {
        const { name, icon } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO Services (ServiceName, Icon) VALUES (?, ?)',
            [name, icon]
        );
        
        res.status(201).json({
            id: result.insertId,
            name,
            icon
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to create service' });
    }
});

// Delete service - TILFØJ DENNE NYE ROUTE
router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Først slet fra template_services (foreign key relations)
        await connection.execute(
            'DELETE FROM template_services WHERE service_id = ?',
            [req.params.id]
        );
        
        // Derefter slet selve servicen
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
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to delete service' });
    } finally {
        connection.release();
    }
});

module.exports = router;