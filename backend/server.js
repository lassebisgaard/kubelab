require('dotenv').config();

// Tjek for nødvendige miljøvariabler
const requiredEnvVars = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const swaggerUi = require('swagger-ui-express');
const specs = require('./config/swagger');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public routes - these should be before the protected routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

app.get('/pages/account_creation.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/account_creation.html'));
});

app.get('/pages/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

// Import routes
const projectRoutes = require('./routes/projects');
const templateRoutes = require('./routes/templates');
const serviceRoutes = require('./routes/services');
const userRoutes = require('./routes/users');
const teamRoutes = require('./routes/teams');
const accountCreationRoutes = require('./routes/account_creation');
const { verifyToken, verifyAdmin } = require('./middleware/auth');

// Public routes (no authentication required)
app.use('/api/account-creation', accountCreationRoutes);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/public/teams', require('./routes/public/teams'));

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
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/teams', verifyToken, (req, res, next) => {
    if (req.method === 'GET') {
        return next();
    }
    verifyAdmin(req, res, next);
}, teamRoutes);

// Tilføj Swagger dokumentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server is serving static files from: ${path.join(__dirname, '../frontend')}`);
    console.log('Visit http://localhost:3000 to view the application');
});
