const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const [users] = await pool.execute('SELECT * FROM Users');
        res.json(users);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

module.exports = router; 