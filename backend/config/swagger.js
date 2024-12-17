const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kubelab API',
      version: '1.0.0',
      description: 'API dokumentation for Kubelab projektet',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            UserId: {
              type: 'integer'
            },
            Name: {
              type: 'string'
            },
            Mail: {
              type: 'string',
              format: 'email'
            },
            TeamId: {
              type: 'integer'
            },
            role: {
              type: 'string',
              enum: ['admin', 'student']
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string'
            },
            details: {
              type: 'string'
            }
          }
        },
        Service: {
          type: 'object',
          properties: {
            ServiceId: {
              type: 'integer'
            },
            ServiceName: {
              type: 'string'
            },
            Icon: {
              type: 'string'
            }
          }
        },
        Template: {
          type: 'object',
          properties: {
            TemplateId: {
              type: 'integer'
            },
            TemplateName: {
              type: 'string'
            },
            Description: {
              type: 'string'
            },
            YamlContent: {
              type: 'string'
            },
            PreviewImage: {
              type: 'string'
            },
            UserId: {
              type: 'integer'
            }
          }
        },
        Project: {
          type: 'object',
          properties: {
            ProjectId: {
              type: 'integer'
            },
            ProjectName: {
              type: 'string'
            },
            Description: {
              type: 'string'
            },
            Status: {
              type: 'string',
              enum: ['online', 'offline']
            },
            UserId: {
              type: 'integer'
            },
            TemplateId: {
              type: 'integer'
            }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'], // Sti til dine route filer
};

const specs = swaggerJsdoc(options);

module.exports = specs; 