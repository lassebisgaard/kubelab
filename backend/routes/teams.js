const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Serve static teams page
router.get('/', (req, res) => {
    res.sendFile('teams.html', { root: './frontend/pages' });
});

// API: Get all teams
router.get('/api/teams', async (req, res) => {
    try {
        const [teams] = await pool.execute(`
            SELECT t.*, 
                   GROUP_CONCAT(DISTINCT u.UserId) as member_ids,
                   GROUP_CONCAT(DISTINCT u.Username) as member_names,
                   GROUP_CONCAT(DISTINCT u.Email) as member_emails,
                   GROUP_CONCAT(DISTINCT u.ProfileImage) as member_images
            FROM Teams t
            LEFT JOIN team_members tm ON t.TeamId = tm.team_id
            LEFT JOIN Users u ON tm.user_id = u.UserId
            GROUP BY t.TeamId
        `);

        // Format teams med deres members
        const formattedTeams = teams.map(team => ({
            id: team.TeamId,
            name: team.TeamName,
            description: team.Description,
            dateCreated: team.DateCreated,
            expirationDate: team.ExpirationDate,
            members: team.member_ids ? 
                team.member_ids.split(',').map((id, index) => ({
                    id,
                    name: team.member_names.split(',')[index],
                    email: team.member_emails.split(',')[index],
                    image: team.member_images.split(',')[index]
                })) : []
        }));

        res.json(formattedTeams);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// API: Create new team
router.post('/api/teams', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { name, description, expirationDate, members = [] } = req.body;

        // Insert team
        const [result] = await connection.execute(
            'INSERT INTO Teams (TeamName, Description, DateCreated, ExpirationDate) VALUES (?, ?, NOW(), ?)',
            [name, description, expirationDate]
        );

        const teamId = result.insertId;

        // Insert team members
        if (members.length > 0) {
            const memberValues = members.map(userId => [teamId, userId]);
            await connection.execute(
                'INSERT INTO team_members (team_id, user_id) VALUES ?',
                [memberValues]
            );
        }

        await connection.commit();
        res.status(201).json({ 
            id: teamId,
            name,
            description,
            expirationDate,
            members 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to create team' });
    } finally {
        connection.release();
    }
});

// API: Delete team
router.delete('/api/teams/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Delete team members first
        await connection.execute(
            'DELETE FROM team_members WHERE team_id = ?',
            [req.params.id]
        );

        // Then delete team
        await connection.execute(
            'DELETE FROM Teams WHERE TeamId = ?',
            [req.params.id]
        );

        await connection.commit();
        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to delete team' });
    } finally {
        connection.release();
    }
});

module.exports = router; 