const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const [services] = await pool.execute(`
            SELECT ServiceId, ServiceName, Icon 
            FROM Services
        `);
        res.json(services);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// Create new service
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

module.exports = router;