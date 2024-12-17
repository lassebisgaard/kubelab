const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Hent alle brugere med detaljerede informationer
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste af brugere med deres projekter
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserDetailed'
 *
 *   post:
 *     summary: Opret ny bruger
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - teamId
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               teamId:
 *                 type: integer
 *               role:
 *                 type: string
 *                 enum: [admin, student]
 *               expiration:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Bruger oprettet
 */

// Opdater swagger.js med ny schema definition:
/**
 * @swagger
 * components:
 *   schemas:
 *     UserDetailed:
 *       type: object
 *       properties:
 *         UserId:
 *           type: integer
 *         Name:
 *           type: string
 *         Mail:
 *           type: string
 *         Expiration:
 *           type: string
 *           format: date
 *         TeamName:
 *           type: string
 *         ProjectCount:
 *           type: integer
 *         Projects:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               ProjectId:
 *                 type: integer
 *               ProjectName:
 *                 type: string
 */

// Get all users with detailed information
router.get('/', async (req, res) => {
    try {
        // Hent brugere med deres team og projekt antal
        const [users] = await pool.execute(`
            SELECT 
                u.UserId,
                u.Name,
                u.Mail,
                u.Expiration,
                t.TeamName,
                (SELECT COUNT(*) 
                 FROM Projects p 
                 WHERE p.UserId = u.UserId) as ProjectCount
            FROM Users u
            LEFT JOIN Teams t ON u.TeamId = t.TeamId
            ORDER BY u.Name
        `);

        // For hver bruger henter vi deres projekter
        for (let user of users) {
            const [projects] = await pool.execute(`
                SELECT 
                    ProjectId,
                    ProjectName
                FROM Projects
                WHERE UserId = ?
                ORDER BY ProjectName
            `, [user.UserId]);
            
            user.Projects = projects;
        }
        
        res.json(users);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch users',
            details: error.message
        });
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
        
        // Generer tilfældig avatar seed
        const avatarStyles = [
            { seed: 'happy1', color: 'b6e3f4' },
            { seed: 'happy2', color: 'c0aede' },
            { seed: 'happy3', color: 'ffd5dc' },
            { seed: 'happy4', color: 'ffdfbf' },
            { seed: 'cool1', color: 'ff9ff3' },
            { seed: 'cool2', color: 'feca57' },
            { seed: 'cool3', color: '48dbfb' },
            { seed: 'cool4', color: '1dd1a1' },
            { seed: 'cute1', color: 'ff6b6b' },
            { seed: 'cute2', color: '4ecdc4' },
            { seed: 'cute3', color: '45b7d1' },
            { seed: 'cute4', color: '96ceb4' }
        ];
        const randomAvatar = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
        
        // Generate password uden hashing
        const defaultPassword = Math.random().toString(36).slice(-8);
        
        // Create user med almindeligt password og avatar
        const [userResult] = await connection.execute(
            'INSERT INTO Users (Name, Mail, TeamId, Password, Expiration, AvatarSeed) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, teamId, defaultPassword, expiration, randomAvatar.seed]
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

/**
 * @swagger
 * /api/users/options:
 *   get:
 *     summary: Hent bruger valgmuligheder
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste af roller og teams
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: string
 *                 teams:
 *                   type: array
 *                   items:
 *                     type: string
 */
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
            avatarSeed: user.AvatarSeed
        };

        res.json(userData);
    } catch (error) {
        console.error('Fejl ved hentning af brugerdata:', error);
        res.status(500).json({ error: 'Der opstod en fejl ved hentning af brugerdata' });
    }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Hent specifik bruger
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bruger detaljer
 *       404:
 *         description: Bruger ikke fundet
 *
 *   put:
 *     summary: Opdater bruger
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               teamId:
 *                 type: integer
 *               role:
 *                 type: string
 *                 enum: [admin, student]
 *     responses:
 *       200:
 *         description: Bruger opdateret
 *       404:
 *         description: Bruger ikke fundet
 *
 *   delete:
 *     summary: Slet bruger
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bruger slettet
 *       404:
 *         description: Bruger ikke fundet
 */
router.put('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const requestingUser = req.user;
        const { name, email, team, role, avatarSeed } = req.body;

        console.log('Received update request:', { userId, avatarSeed, body: req.body });

        if (userId !== requestingUser.userId.toString()) {
            return res.status(403).json({ error: 'Ikke tilladelse til at opdatere andre brugere' });
        }

        // Hent brugerens nuværende data
        const [currentUser] = await pool.execute(`
            SELECT Users.*, Teams.TeamName, Roles.IsAdmin 
            FROM Users 
            LEFT JOIN Teams ON Users.TeamId = Teams.TeamId
            LEFT JOIN Roles ON Users.UserId = Roles.UserId
            WHERE Users.UserId = ?
        `, [userId]);

        if (!currentUser.length) {
            return res.status(404).json({ error: 'Bruger ikke fundet' });
        }

        // Hvis vi har et nyt avatar seed, opdater det
        if (avatarSeed) {
            console.log('Updating avatar seed:', avatarSeed);
            try {
                await pool.execute(
                    'UPDATE Users SET AvatarSeed = ? WHERE UserId = ?',
                    [avatarSeed, userId]
                );
                console.log('Avatar seed updated successfully');
                return res.json({ 
                    message: 'Avatar opdateret',
                    avatarSeed: avatarSeed
                });
            } catch (dbError) {
                console.error('Database error:', dbError);
                throw dbError;
            }
        }

        // Resten af den eksisterende kode for andre opdateringer...
        const updates = {
            name,
            email,
            team: !requestingUser.isAdmin ? currentUser[0].TeamName : team, // Behold eksisterende team hvis ikke admin
            role: !requestingUser.isAdmin ? (currentUser[0].IsAdmin ? 'Administrator' : 'Studerende') : role // Behold eksisterende rolle hvis ikke admin
        };

        // Opdater basis information
        await pool.execute(
            'UPDATE Users SET Name = ?, Mail = ? WHERE UserId = ?',
            [updates.name, updates.email, userId]
        );

        // Kun opdater team og role hvis brugeren er admin
        if (requestingUser.isAdmin) {
            if (updates.team) {
                const [teams] = await pool.execute('SELECT TeamId FROM Teams WHERE TeamName = ?', [updates.team]);
                if (teams.length > 0) {
                    await pool.execute(
                        'UPDATE Users SET TeamId = ? WHERE UserId = ?',
                        [teams[0].TeamId, userId]
                    );
                }
            }

            if (updates.role) {
                const isAdmin = updates.role.toLowerCase() === 'administrator' ? 1 : 0;
                await pool.execute(
                    'UPDATE Roles SET IsAdmin = ? WHERE UserId = ?',
                    [isAdmin, userId]
                );
            }
        }

        res.json({ 
            message: 'Bruger opdateret',
            updates: {
                name: updates.name,
                email: updates.email,
                team: updates.team,
                role: updates.role
            }
        });
    } catch (error) {
        console.error('Error in PUT endpoint:', error);
        res.status(500).json({ 
            error: 'Der opstod en fejl ved opdatering af brugeren',
            details: error.message 
        });
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