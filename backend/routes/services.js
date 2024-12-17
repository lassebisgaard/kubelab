const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Håndtering af services
 */

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Hent alle services
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste af services
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ServiceId:
 *                     type: integer
 *                   ServiceName:
 *                     type: string
 *                   Icon:
 *                     type: string
 *   post:
 *     summary: Opret ny service (kun admin)
 *     tags: [Services]
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
 *               - icon
 *             properties:
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service oprettet
 *       403:
 *         description: Ikke tilladelse (kun admin)
 */

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Slet service (kun admin)
 *     tags: [Services]
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
 *         description: Service slettet
 *       403:
 *         description: Ikke tilladelse
 *       409:
 *         description: Service kan ikke slettes (i brug)
 */

// Get all services
router.get('/', verifyToken, async (req, res) => {
    try {
        const [services] = await pool.execute('SELECT * FROM Services');
        res.json(services);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// Create new service (admin only)
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { name, icon } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO Services (ServiceName, Icon) VALUES (?, ?)',
            [name, icon]
        );
        res.status(201).json({ id: result.insertId, name, icon });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to create service' });
    }
});

// Delete service
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Check if service is being used
        const [templates] = await connection.execute(
            'SELECT COUNT(*) as count FROM template_services WHERE service_id = ?',
            [req.params.id]
        );
        
        if (templates[0].count > 0) {
            await connection.rollback();
            return res.status(409).json({ 
                error: 'Service cannot be deleted as it is being used by one or more templates' 
            });
        }
        
        // Delete service if not in use
        const [result] = await connection.execute(
            'DELETE FROM Services WHERE ServiceId = ?',
            [req.params.id]
        );
        
        await connection.commit();
        
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Service not found' });
        } else {
            res.json({ message: 'Service deleted successfully' });
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Failed to delete service' });
    } finally {
        connection.release();
    }
});

module.exports = router;