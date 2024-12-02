const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const [teams] = await pool.execute('SELECT * FROM Teams');
        res.json(teams);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { name, expiration, members } = req.body;
        
        // Opret team
        const [result] = await connection.execute(
            'INSERT INTO Teams (TeamName, Expiration) VALUES (?, ?)',
            [name, expiration]
        );
        
        const teamId = result.insertId;

        // Opdater brugere med det nye team ID
        if (members && members.length > 0) {
            for (const member of members) {
                await connection.execute(
                    'UPDATE Users SET TeamId = ? WHERE UserId = ?',
                    [teamId, member.userId]
                );
            }
        }
        
        await connection.commit();
        
        res.status(201).json({
            id: teamId,
            name,
            expiration,
            members
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating team:', error);
        res.status(500).json({ error: 'Failed to create team' });
    } finally {
        connection.release();
    }
});

module.exports = router; 