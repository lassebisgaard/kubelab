const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

// Verify token endpoint
router.get('/verify', verifyToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// Login endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Check if user exists and password matches
        const [users] = await pool.execute(
            `SELECT u.*, t.TeamName, r.IsAdmin 
             FROM Users u 
             LEFT JOIN Teams t ON u.TeamId = t.TeamId
             LEFT JOIN Roles r ON u.UserId = r.UserId
             WHERE u.Mail = ? AND u.Password = ?`,
            [email, password]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        const isAdmin = user.IsAdmin === 1;

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: user.UserId,
                email: user.Mail,
                isAdmin: isAdmin
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            user: {
                ...user,
                isAdmin: isAdmin
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
});

module.exports = router; 