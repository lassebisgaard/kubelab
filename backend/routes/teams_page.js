const express = require('express');
const router = express.Router();
const pool = require('../config/database');

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
        console.error('Detaljeret fejl:', error);
        res.status(500).json({ 
            error: 'Failed to fetch teams',
            details: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;
