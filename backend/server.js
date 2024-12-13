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
const accountCreationRoutes = require('./routes/account_creation');
const usersPageRoutes = require('./routes/users_page');
const teamsPageRoutes = require('./routes/teams_page');
const { verifyToken, verifyAdmin } = require('./middleware/auth');

// Public routes (no authentication required)
app.use('/api/account-creation', accountCreationRoutes);
app.use('/api/auth', require('./routes/auth'));

// Protected routes (require authentication)
app.use('/api/projects', verifyToken, projectRoutes);
app.use('/api/templates', verifyToken, (req, res, next) => {
    if (req.method === 'GET') {
        return next();
    }
    verifyAdmin(req, res, next);
}, templateRoutes);
app.use('/api/services', verifyToken, (req, res, next) => {
    if (req.method === 'GET') {
        return next();
    }
    verifyAdmin(req, res, next);
}, serviceRoutes);
app.use('/api/users', verifyToken, verifyAdmin, userRoutes);
app.use('/api/teams', verifyToken, verifyAdmin, teamRoutes);
app.use('/api/users-page', verifyToken, usersPageRoutes);
app.use('/api/teams-page', verifyToken, teamsPageRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server is serving static files from: ${path.join(__dirname, '../frontend')}`);
    console.log('Visit http://localhost:3000 to view the application');
});
