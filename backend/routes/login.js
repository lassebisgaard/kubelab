const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Login og authentication endpoints
 */

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login bruger
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     UserId:
 *                       type: integer
 *                     Name:
 *                       type: string
 *                     Mail:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [admin, student]
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Email and password are required
 */

router.post('/', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Check if user exists and password matches
        const [users] = await pool.execute(
            'SELECT UserId, Name, Mail, TeamId FROM Users WHERE Mail = ? AND Password = ?',
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

        const isAdmin = roles[0]?.IsAdmin === 1;
        
        // Create JWT token
        const token = jwt.sign(
            { 
                userId: users[0].UserId,
                email: users[0].Mail,
                isAdmin: isAdmin
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const user = {
            ...users[0],
            role: isAdmin ? 'admin' : 'student'
        };

        res.json({ 
            message: 'Login successful',
            user,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
});

module.exports = router;
