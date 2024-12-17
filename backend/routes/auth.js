const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');

// Brug en default secret key for udvikling
const JWT_SECRET = 'development_secret_key_123';

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verificer JWT token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token er valid
 *       401:
 *         description: Invalid eller manglende token
 */
router.get('/verify', verifyToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login bruger
 *     tags: [Auth]
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
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Direkte password sammenligning
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
        
        const token = jwt.sign(
            { userId: user.UserId, email: user.Mail, isAdmin: isAdmin },
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

// Fjern eller udkommenter disse routes da de ikke bruges i prototypen
// router.post('/forgot-password', async (req, res) => { ... });
// router.post('/reset-password', async (req, res) => { ... });

module.exports = router; 