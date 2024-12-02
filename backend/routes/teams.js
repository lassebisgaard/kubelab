const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const [teams] = await pool.execute('SELECT * FROM Teams');
        res.json(teams);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

module.exports = router; 