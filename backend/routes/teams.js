const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all teams
router.get('/', async (req, res) => {
    try {
        console.log('Fetching teams...');
        const [teams] = await pool.execute('SELECT * FROM Teams');
        console.log('Found teams:', teams);
        res.json(teams);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
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
            'INSERT INTO Teams (TeamName, Expiration) VALUES (?, ?)',
            [name, expiration]
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