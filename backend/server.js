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
const serviceRoutes = require('./routes/services');

// API routes
app.use('/api/projects', projectRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/services', serviceRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
