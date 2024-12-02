const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all services
router.get('/', async (req, res) => {
    try {
        const [services] = await pool.execute('SELECT * FROM Services');
        res.json(services);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

module.exports = router;