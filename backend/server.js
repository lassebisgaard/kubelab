const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const projectRoutes = require('./routes/projects');
const templateRoutes = require('./routes/templates');
const serviceRoutes = require('./routes/services');
const userRoutes = require('./routes/users');
const teamRoutes = require('./routes/teams');

// Use routes
app.use('/api/projects', projectRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server is serving static files from: ${path.join(__dirname, '../frontend')}`);
    console.log('Visit http://localhost:3000 to view the application');
});
