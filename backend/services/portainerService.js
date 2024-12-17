const axios = require('axios');
const https = require('https');
const pool = require('../config/database');

class PortainerService {
    constructor() {
        this.portainerUrl = 'https://portainer.kubelab.dk';
        this.portainerUsername = process.env.PORTAINER_USERNAME;
        this.portainerPassword = process.env.PORTAINER_PASSWORD;
        this.portainerToken = null;
        this.tokenExpiration = null;
        
        // Create axios instance that accepts self-signed certificates
        this.client = axios.create({
            httpsAgent: new https.Agent({  
                rejectUnauthorized: false
            })
        });

        // Add response interceptor for token handling
        this.client.interceptors.response.use(
            response => response,
            async error => {
                if (error.response?.status === 401) {
                    this.portainerToken = null;
                    this.tokenExpiration = null;
                    // Retry the request once
                    const config = error.config;
                    config.headers = await this.getAuthHeaders();
                    return this.client.request(config);
                }
                return Promise.reject(error);
            }
        );
    }

    async login() {
        try {
            const response = await this.client.post(`${this.portainerUrl}/api/auth`, {
                username: this.portainerUsername,
                password: this.portainerPassword
            });
            
            this.portainerToken = response.data.jwt;
            // Set token expiration to 7 hours from now
            this.tokenExpiration = Date.now() + (7 * 60 * 60 * 1000);
            return this.portainerToken;
        } catch (error) {
            console.error('Portainer login failed:', error);
            throw error;
        }
    }

    async getAuthHeaders() {
        // Check if token is expired or will expire in the next 5 minutes
        if (!this.portainerToken || !this.tokenExpiration || 
            Date.now() > (this.tokenExpiration - 5 * 60 * 1000)) {
            await this.login();
        }
        return {
            'Authorization': `Bearer ${this.portainerToken}`
        };
    }

    async getStackConfig(templateId) {
        try {
            const [rows] = await pool.execute(
                'SELECT YamlContent FROM Templates WHERE TemplateId = ?', 
                [templateId]
            );

            if (!rows?.[0]?.YamlContent) {
                throw new Error('No YAML found for template');
            }

            return rows[0].YamlContent;
        } catch (error) {
            console.error('Failed to get stack config:', error);
            return null;
        }
    }

    async getStacks() {
        try {
            const response = await this.client.get(
                `${this.portainerUrl}/api/stacks`,
                { headers: await this.getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Failed to get stacks:', error);
            throw error;
        }
    }

    async getStack(stackName) {
        try {
            const stacks = await this.getStacks();
            return stacks.find(s => s.Name === stackName);
        } catch (error) {
            console.error('Failed to get stack:', error);
            return null;
        }
    }

    async getStackStatus(stackName) {
        try {
            const stack = await this.getStack(stackName);
            if (!stack) {
                console.log(`Stack ${stackName} not found in Portainer`);
                return 'offline';
            }

            if (stack.Status === 1 || stack.Status === 'active') {
                return 'online';
            }
            
            return 'offline';
            
        } catch (error) {
            console.error(`Error getting status for stack ${stackName}:`, error);
            return 'offline';
        }
    }

    async createStack(projectData) {
        try {
            // Get stack template
            const stackContent = await this.getStackConfig(projectData.templateId);
            if (!stackContent) {
                throw new Error('Template not found');
            }

            // Configure stack content with correct domain names
            const configuredStack = stackContent
                .replace(/CHANGEME01/g, projectData.name)
                .replace(/CHANGEME02/g, `${projectData.name}-phpmyadmin`)
                .replace(/SUBDOMAIN01/g, `${projectData.domain}`)
                .replace(/SUBDOMAIN02/g, `db.${projectData.domain}`);

            console.log('Creating stack:', {
                name: projectData.name,
                domains: {
                    wordpress: `${projectData.domain}.kubelab.dk`,
                    phpmyadmin: `db.${projectData.domain}.kubelab.dk`
                }
            });

            // Deploy stack
            const headers = await this.getAuthHeaders();
            const response = await this.client.post(
                `${this.portainerUrl}/api/stacks/create/swarm/string?endpointId=5`,
                {
                    name: projectData.name,
                    stackFileContent: configuredStack,
                    swarmID: "myst1l6mbp6kysq7rinrzzvda"
                },
                { headers }
            );

            // Vent og tjek status 3 gange
            let status = 'unknown';
            for(let i = 0; i < 3; i++) {
                await new Promise(resolve => setTimeout(resolve, 7000));
                status = await this.getStackStatus(projectData.name);
                if(status === 'online') break;
            }
            
            return { 
                success: true, 
                status: status,
                data: response.data,
                domains: {
                    wordpress: `${projectData.domain}.kubelab.dk`,
                    phpmyadmin: `db.${projectData.domain}.kubelab.dk`
                }
            };
        } catch (error) {
            console.error('Stack deployment failed:', error);
            if (error.response) {
                console.error('Portainer error response:', error.response.data);
            }
            return { success: false, message: error.message };
        }
    }

    async startStack(stackName) {
        try {
            console.log(`Starting stack ${stackName}`);
            const stack = await this.getStack(stackName);
            if (!stack) {
                console.log(`Stack ${stackName} not found`);
                return false;
            }

            if (stack.Status === 1) {
                console.log(`Stack ${stackName} is already running`);
                return true;
            }

            const response = await this.client.post(
                `${this.portainerUrl}/api/stacks/${stack.Id}/start?endpointId=5`,
                {},
                { headers: await this.getAuthHeaders() }
            );
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const success = response.status === 200;
            console.log(`Stack ${stackName} start result:`, success);
            return success;
        } catch (error) {
            console.error(`Error starting stack ${stackName}:`, error);
            return false;
        }
    }

    async stopStack(stackName) {
        try {
            console.log(`Stopping stack ${stackName}`);
            const stack = await this.getStack(stackName);
            if (!stack) {
                console.log(`Stack ${stackName} not found`);
                return false;
            }

            if (stack.Status === 2) {
                console.log(`Stack ${stackName} is already stopped`);
                return true;
            }

            const response = await this.client.post(
                `${this.portainerUrl}/api/stacks/${stack.Id}/stop?endpointId=5`,
                {},
                { headers: await this.getAuthHeaders() }
            );

            await new Promise(resolve => setTimeout(resolve, 2000));

            const success = response.status === 200;
            console.log(`Stack ${stackName} stop result:`, success);
            return success;
        } catch (error) {
            console.error(`Error stopping stack ${stackName}:`, error);
            return false;
        }
    }

    async deleteStack(stackName) {
        try {
            // Først henter vi stack ID baseret på navnet
            const stacks = await this.getStacks();
            const stack = stacks.find(s => s.Name === stackName);
            
            if (!stack) {
                throw new Error(`Stack ${stackName} not found`);
            }

            // Derefter sletter vi stacken
            const response = await fetch(`${this.portainerUrl}/api/stacks/${stack.Id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.portainerToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete stack: ${response.statusText}`);
            }

            return true;
        } catch (error) {
            console.error('Error deleting stack:', error);
            throw error;
        }
    }
}

module.exports = PortainerService; 