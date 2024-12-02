const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));
app.use('/pages', express.static(path.join(__dirname, '../frontend/pages')));

// Import routes
const projectRoutes = require('./routes/projects');
const templateRoutes = require('./routes/templates');
const teamRoutes = require('./routes/teams');

// API routes
app.use('/api/projects', projectRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/teams', teamRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

app.get('/create', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/create.html'));
});

app.get('/templates', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/templates.html'));
});

// Test database connection
app.get('/api/test', async (req, res) => {
    try {
        const [result] = await pool.execute('SELECT 1 + 1 AS test');
        res.json({ message: 'Database connected!', result: result[0] });
    } catch (error) {
        console.error('Database test failed:', error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
