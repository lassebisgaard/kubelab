const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/', async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Check if user exists and password matches
        const [users] = await pool.execute(`
            SELECT 
                u.UserId, 
                u.Name, 
                u.Mail, 
                u.TeamId,
                t.TeamName
            FROM Users u
            LEFT JOIN Teams t ON u.TeamId = t.TeamId
            WHERE u.Mail = ? AND u.Password = ?`,
            [email, password]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Get user role
        const [roles] = await pool.execute(
            'SELECT IsAdmin FROM Roles WHERE UserId = ?',
            [users[0].UserId]
        );

        const user = {
            ...users[0],
            role: roles[0]?.IsAdmin ? 'admin' : 'student'
        };

        // You might want to implement proper session management here
        res.json({ 
            message: 'Login successful',
            user: user
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
});

module.exports = router;
