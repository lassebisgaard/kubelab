const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * @swagger
 * tags:
 *   name: Account
 *   description: Account creation and management
 */

/**
 * @swagger
 * /api/account-creation:
 *   post:
 *     summary: Opret ny bruger konto
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - teamId
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               teamId:
 *                 type: integer
 *               role:
 *                 type: string
 *                 enum: [studerende, admin]
 *                 default: studerende
 *     responses:
 *       201:
 *         description: Bruger oprettet
 *       400:
 *         description: Manglende påkrævede felter
 */

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
        
        const { name, email, password, teamId, role, expiration } = req.body;
        
        // Validér input data
        if (!name || !email || !password || !teamId) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                missing: {
                    name: !name,
                    email: !email,
                    password: !password,
                    teamId: !teamId
                }
            });
        }

        // Gem password direkte uden hashing
        const [userResult] = await connection.execute(
            'INSERT INTO Users (Name, Mail, Password, TeamId, Expiration) VALUES (?, ?, ?, ?, ?)',
            [name, email, password, teamId, expiration]
        );
        
        // Opret rolle for brugeren
        const [roleResult] = await connection.execute(
            'INSERT INTO Roles (UserId, IsAdmin) VALUES (?, ?)',
            [userResult.insertId, role === 'studerende' ? 0 : 1]
        );
        
        await connection.commit();
        
        // Hent den oprettede bruger med team navn
        const [newUser] = await connection.execute(`
            SELECT u.*, t.TeamName 
            FROM Users u
            LEFT JOIN Teams t ON u.TeamId = t.TeamId
            WHERE u.UserId = ?
        `, [userResult.insertId]);
        
        res.status(201).json({
            ...newUser[0],
            role: role
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error creating user:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                error: 'A user with this email already exists'
            });
        }
        
        res.status(500).json({ 
            error: 'Could not create user',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

module.exports = router; 

