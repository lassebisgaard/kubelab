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
        
        // Validér input data
        if (!name || !email || !teamId || !role || !expiration) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                missing: {
                    name: !name,
                    email: !email,
                    teamId: !teamId,
                    role: !role,
                    expiration: !expiration
                }
            });
        }
        
        // Generate password uden hashing
        const defaultPassword = Math.random().toString(36).slice(-8);
        
        // Create user med almindeligt password
        const [userResult] = await connection.execute(
            'INSERT INTO Users (Name, Mail, TeamId, Password, Expiration) VALUES (?, ?, ?, ?, ?)',
            [name, email, teamId, defaultPassword, expiration]
        );
        
        // Opret rolle for brugeren
        const [roleResult] = await connection.execute(
            'INSERT INTO Roles (UserId, IsAdmin) VALUES (?, ?)',
            [userResult.insertId, role === 'admin' ? 1 : 0]
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
            role: role,
            defaultPassword
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
            error: 'Failed to create user',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

// Tilføj denne nye route til at hente brugerdetaljer
router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Hent bruger information inklusiv team og rolle
        const [users] = await pool.execute(`
            SELECT Users.*, Teams.TeamName, Roles.IsAdmin 
            FROM Users 
            LEFT JOIN Teams ON Users.TeamId = Teams.TeamId
            LEFT JOIN Roles ON Users.UserId = Roles.UserId
            WHERE Users.UserId = ?
        `, [userId]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'Bruger ikke fundet' });
        }

        const user = users[0];
        const userData = {
            name: user.Name,
            email: user.Mail,
            team: user.TeamName || 'Intet team',
            role: user.IsAdmin ? 'Administrator' : 'Studerende',
        };

        res.json(userData);
    } catch (error) {
        console.error('Fejl ved hentning af brugerdata:', error);
        res.status(500).json({ error: 'Der opstod en fejl ved hentning af brugerdata' });
    }
});

module.exports = router; 