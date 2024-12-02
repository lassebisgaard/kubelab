const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Import routes
try {
    const projectRoutes = require('./routes/projects');
    const templateRoutes = require('./routes/templates');
    const teamRoutes = require('./routes/teams');
    const serviceRoutes = require('./routes/services');
    const userRoutes = require('./routes/users');

    // Use routes
    app.use('/api/projects', projectRoutes);
    app.use('/api/templates', templateRoutes);
    app.use('/api/teams', teamRoutes);
    app.use('/api/services', serviceRoutes);
    app.use('/api/users', userRoutes);
} catch (error) {
    console.error('Error loading routes:', error);
}

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// Handle all other routes by serving the requested HTML file
app.get('/:page', (req, res) => {
    const page = req.params.page;
    res.sendFile(path.join(__dirname, `../frontend/pages/${page}.html`));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server is serving static files from: ${path.join(__dirname, '../frontend')}`);
    console.log(`Visit http://localhost:${PORT} to view the application`);
});
