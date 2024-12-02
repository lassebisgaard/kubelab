const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all services
router.get('/', async (req, res) => {
    try {
        // Log for at se hvad der sker
        console.log('Fetching services...');
        
        const [services] = await pool.execute(`
            SELECT ServiceId, ServiceName, Icon 
            FROM Services
        `);
        
        console.log('Services fetched:', services);
        res.json(services);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch services',
            details: error.message 
        });
    }
});

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ message: 'Services route is working' });
});

module.exports = router;