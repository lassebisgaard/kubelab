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

// Flyt options route FØR :id route
router.get('/options', async (req, res) => {
    try {
        // Hent alle unikke roller fra Roles tabellen
        const [roles] = await pool.execute(`
            SELECT DISTINCT 
                CASE 
                    WHEN IsAdmin = 1 THEN 'Administrator'
                    ELSE 'Studerende'
                END as RoleName
            FROM Roles
        `);

        // Hent alle teams fra Teams tabellen
        const [teams] = await pool.execute('SELECT TeamId, TeamName FROM Teams');

        res.json({
            roles: roles.map(r => r.RoleName),
            teams: teams.map(t => t.TeamName)
        });
    } catch (error) {
        console.error('Fejl ved hentning af options:', error);
        res.status(500).json({ error: 'Kunne ikke hente valgmuligheder' });
    }
});

// Derefter kommer ID route
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

// Tilføj denne nye route til at opdatere bruger
router.put('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, team, role } = req.body;

        // Først opdater Users tabellen
        await pool.execute(
            'UPDATE Users SET Name = ?, Mail = ? WHERE UserId = ?',
            [name, email, userId]
        );

        // Hvis team er ændret, opdater TeamId
        if (team) {
            const [teams] = await pool.execute('SELECT TeamId FROM Teams WHERE TeamName = ?', [team]);
            if (teams.length > 0) {
                await pool.execute(
                    'UPDATE Users SET TeamId = ? WHERE UserId = ?',
                    [teams[0].TeamId, userId]
                );
            }
        }

        // Hvis role er ændret, opdater Roles tabellen
        if (role) {
            const isAdmin = role.toLowerCase() === 'administrator' ? 1 : 0;
            await pool.execute(
                'UPDATE Roles SET IsAdmin = ? WHERE UserId = ?',
                [isAdmin, userId]
            );
        }

        res.json({ message: 'Bruger opdateret' });
    } catch (error) {
        console.error('Fejl ved opdatering af bruger:', error);
        res.status(500).json({ error: 'Der opstod en fejl ved opdatering af brugeren' });
    }
});

// Tilføj denne nye route til at slette bruger
router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const userId = req.params.id;

        // Slet brugerens rolle først (pga. foreign key)
        await connection.execute('DELETE FROM Roles WHERE UserId = ?', [userId]);
        
        // Derefter slet brugeren
        await connection.execute('DELETE FROM Users WHERE UserId = ?', [userId]);
        
        await connection.commit();
        res.json({ message: 'Bruger slettet' });
    } catch (error) {
        await connection.rollback();
        console.error('Fejl ved sletning af bruger:', error);
        res.status(500).json({ error: 'Der opstod en fejl ved sletning af brugeren' });
    } finally {
        connection.release();
    }
});

module.exports = router; 