const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const multer = require('multer'); // For file uploads
const path = require('path');
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// Serve uploads directory
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = file.fieldname === 'yaml' ? 'uploads/yaml' : 'uploads/images';
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// === Mock Database ===
const mockDatabase = {
    services: {
        wordpress: {
            id: 'wordpress',
            name: 'WordPress',
            icon: 'bxl-wordpress',
            description: 'Latest version of WordPress CMS'
        },
        mysql: {
            id: 'mysql',
            name: 'MySQL',
            icon: 'bx-data',
            description: 'MySQL Database Server'
        },
        phpmyadmin: {
            id: 'phpmyadmin',
            name: 'phpMyAdmin',
            icon: 'bx-server',
            description: 'Database Management Tool'
        },
        nginx: {
            id: 'nginx',
            name: 'Nginx',
            icon: 'bx-server',
            description: 'Web Server'
        },
        php: {
            id: 'php',
            name: 'PHP',
            icon: 'bxl-php',
            description: 'PHP Runtime'
        }
    },
    
    templates: [
        {
            id: 1,
            name: "WordPress Kenneth",
            description: "WordPress installation med MySQL og phpMyAdmin. Perfekt til 2. semester projekter.",
            author: "Kenneth",
            services: ["wordpress", "mysql", "phpmyadmin"],
            image: "/assets/images/placeholder.webp",
            yamlFile: "/uploads/yaml/wordpress-kenneth.yml"
        },
        {
            id: 2,
            name: "WordPress Basic",
            description: "Simpel WordPress installation. Til mindre projekter.",
            author: "Jakob",
            services: ["wordpress", "mysql"],
            image: "/assets/images/placeholder.webp",
            yamlFile: "/uploads/yaml/wordpress-basic.yml"
        },
        {
            id: 3,
            name: "NGINX PHP Stack",
            description: "Standard NGINX og PHP stack til web udvikling.",
            author: "Lasse",
            services: ["nginx", "php", "mysql"],
            image: "/assets/images/placeholder.webp",
            yamlFile: "/uploads/yaml/nginx-php.yml"
        }
    ],
    
    projects: [
        {
            id: 1,
            name: "Semesterprojekt",
            domain: "semester.kubelab.dk",
            description: "2. semester hovedprojekt",
            template: "WordPress Kenneth",
            status: "Online",
            services: [
                { name: "WordPress", icon: "bxl-wordpress" },
                { name: "MySQL", icon: "bx-data" },
                { name: "phpMyAdmin", icon: "bx-server" }
            ]
        },
        {
            id: 2,
            name: "Test Project",
            domain: "test.kubelab.dk",
            description: "Test af NGINX setup",
            template: "NGINX PHP Stack",
            status: "Offline",
            services: [
                { name: "NGINX", icon: "bx-server" },
                { name: "PHP", icon: "bxl-php" }
            ]
        }
    ]
};

// === API Endpoints ===

// Get all services
app.get('/api/services', (req, res) => {
    res.json(mockDatabase.services);
});

// Get all templates
app.get('/api/templates', (req, res) => {
    res.json(mockDatabase.templates);
});

// Get all projects
app.get('/api/projects', (req, res) => {
    res.json(mockDatabase.projects);
});

// Create new template
app.post('/api/templates', upload.fields([
    { name: 'yaml', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]), async (req, res) => {
    try {
        const { name, description, services } = req.body;
        const yamlFile = req.files.yaml?.[0];
        const imageFile = req.files.image?.[0];

        // Create new template
        const newTemplate = {
            id: mockDatabase.templates.length + 1,
            name,
            description,
            services: JSON.parse(services),
            author: "Test User",
            image: imageFile ? `/${imageFile.path}` : "/assets/images/placeholder.webp",
            yamlFile: yamlFile ? `/${yamlFile.path}` : null
        };

        // Add to mock database
        mockDatabase.templates.push(newTemplate);

        res.json({ 
            message: 'Template created successfully',
            template: newTemplate
        });
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ message: 'Failed to create template' });
    }
});

// Create new project
app.post('/api/projects', async (req, res) => {
    try {
        const { name, domain, description, template } = req.body;
        
        // Create new project
        const newProject = {
            id: mockDatabase.projects.length + 1,
            name,
            domain: `${domain}.kubelab.dk`,
            description,
            template: template.name,
            status: 'Offline',
            services: template.services.map(serviceId => ({
                name: mockDatabase.services[serviceId].name,
                icon: mockDatabase.services[serviceId].icon
            }))
        };

        // Add to mock database
        mockDatabase.projects.push(newProject);

        res.json({ 
            message: 'Project created successfully',
            project: newProject
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: 'Failed to create project' });
    }
});

// Add delete template endpoint
app.delete('/api/templates/:id', (req, res) => {
    try {
        const templateId = parseInt(req.params.id);
        const templateIndex = mockDatabase.templates.findIndex(t => t.id === templateId);
        
        if (templateIndex === -1) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Remove template from database
        mockDatabase.templates.splice(templateIndex, 1);
        
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ message: 'Failed to delete template' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
