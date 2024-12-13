const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const saltRounds = 12;

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
    console.log('Received request body:', req.body); // Debug log
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { name, email, password, teamId, role, expiration } = req.body;
        
        console.log('Extracted data:', { name, email, teamId, role, expiration }); // Debug log
        
        // Validér input data
        if (!name || !email || !password || !teamId) {
            console.log('Validation failed:', { name, email, password, teamId }); // Debug log
            return res.status(400).json({ 
                error: 'Manglende påkrævede felter',
                missing: {
                    name: !name,
                    email: !email,
                    password: !password,
                    teamId: !teamId
                }
            });
        }

        console.log('Attempting to create user...'); // Debug log
        
        // Hash password før det gemmes
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Opret bruger med hashet password
        const [userResult] = await connection.execute(
            'INSERT INTO Users (Name, Mail, Password, TeamId, Expiration) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, teamId, expiration]
        );
        
        console.log('User created:', userResult); // Debug log
        
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
        console.error('Detailed error:', error); // Mere detaljeret error logging
        console.error('Fejl ved oprettelse af bruger:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                error: 'En bruger med denne email findes allerede'
            });
        }
        
        res.status(500).json({ 
            error: 'Kunne ikke oprette bruger',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

module.exports = router; 

