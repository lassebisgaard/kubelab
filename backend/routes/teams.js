const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Hent alle teams med detaljerede informationer
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste af teams med medlemmer
 *   post:
 *     summary: Opret nyt team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teamName
 *               - expiration
 *             properties:
 *               teamName:
 *                 type: string
 *               expiration:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Team oprettet
 *
 * /api/teams/{id}:
 *   put:
 *     summary: Opdater team
 *     tags: [Teams]
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
 *               teamName:
 *                 type: string
 *               expiration:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Team opdateret
 *
 *   delete:
 *     summary: Slet team
 *     tags: [Teams]
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
 *         description: Team slettet
 *       409:
 *         description: Team kan ikke slettes (har medlemmer)
 */

// Get all teams
router.get('/', async (req, res) => {
    try {
        // Først henter vi teams med deres medlem antal
        const [teams] = await pool.execute(`
            SELECT 
                t.TeamId,
                t.TeamName,
                t.Expiration,
                COUNT(u.UserId) as MemberCount
            FROM Teams t
            LEFT JOIN Users u ON t.TeamId = u.TeamId
            GROUP BY t.TeamId
            ORDER BY t.TeamName
        `);

        // For hvert team henter vi deres medlemmer med projekt antal
        for (let team of teams) {
            const [members] = await pool.execute(`
                SELECT 
                    u.UserId,
                    u.Name,
                    u.Mail,
                    (SELECT COUNT(*) FROM Projects p WHERE p.UserId = u.UserId) as ProjectCount
                FROM Users u
                WHERE u.TeamId = ?
                ORDER BY u.Name
            `, [team.TeamId]);
            
            team.Members = members;
        }
        
        res.json(teams);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch teams',
            details: error.message
        });
    }
});

// Create new team
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { name, expiration, description, members } = req.body;
        
        // Validér input data
        if (!name || !expiration) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                missing: {
                    name: !name,
                    expiration: !expiration
                }
            });
        }

        console.log('Creating team with data:', { name, expiration, description, members });
        
        // Opret team
        const [result] = await connection.execute(
            'INSERT INTO Teams (TeamName, Description, Expiration) VALUES (?, ?, ?)',
            [name, description || null, expiration]
        );
        
        const teamId = result.insertId;

        // Opdater brugere med det nye team ID hvis der er members
        if (members && members.length > 0) {
            for (const member of members) {
                if (member.userId) {  // Tjek at userId eksisterer
                    await connection.execute(
                        'UPDATE Users SET TeamId = ? WHERE UserId = ?',
                        [teamId, member.userId]
                    );
                }
            }
        }
        
        await connection.commit();
        
        res.status(201).json({
            id: teamId,
            name,
            expiration,
            members: members || []
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating team:', error);
        res.status(500).json({ 
            error: 'Failed to create team',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

module.exports = router; 