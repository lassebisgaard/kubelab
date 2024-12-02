const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all users
router.get('/', async (req, res) => {
    try {
        const [users] = await pool.execute(`
            SELECT u.*, t.TeamName 
            FROM Users u
            LEFT JOIN Teams t ON u.TeamId = t.TeamId
        `);
        res.json(users);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create new user
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { name, email, teamId, role, expiration } = req.body;
        
        // Generate a random default password (in production you'd want to handle this differently)
        const defaultPassword = Math.random().toString(36).slice(-8);
        
        // Create user
        const [result] = await connection.execute(
            'INSERT INTO Users (Name, Mail, TeamId, Password, Expiration) VALUES (?, ?, ?, ?, ?)',
            [name, email, teamId, defaultPassword, expiration]
        );
        
        await connection.commit();
        
        res.status(201).json({
            id: result.insertId,
            name,
            email,
            teamId,
            expiration,
            defaultPassword // I produktion ville man sende dette via email i stedet
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    } finally {
        connection.release();
    }
});

module.exports = router; 