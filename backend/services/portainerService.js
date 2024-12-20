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
        
    
        this.client = axios.create({
            httpsAgent: new https.Agent({  
                rejectUnauthorized: false
            })
        });


        this.client.interceptors.response.use(
            response => response,
            async error => {
                if (error.response?.status === 401) {
                    this.portainerToken = null;
                    this.tokenExpiration = null;
    
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
            this.tokenExpiration = Date.now() + (7 * 60 * 60 * 1000);
            return this.portainerToken;
        } catch (error) {
            console.error('Portainer login failed:', error);
            throw error;
        }
    }

    async getAuthHeaders() {
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

            console.log('All stacks from Portainer:', response.data.map(stack => ({
                name: stack.Name,
                id: stack.Id,
                status: stack.Status,
                endpointId: stack.EndpointId,
                swarmId: stack.SwarmId
            })));

            return response.data;
        } catch (error) {
            console.error('Failed to get stacks:', error);
            throw error;
        }
    }

    async getStack(stackName) {
        try {
            const stacks = await this.getStacks();
            const normalizedSearchName = stackName.toLowerCase().replace(/\s+/g, '');
            const stack = stacks.find(s => s.Name.toLowerCase().replace(/\s+/g, '') === normalizedSearchName);
            
            if (stack) {
                console.log(`Found stack ${stackName} with status: ${stack.Status}`);
            }
            
            return stack;
        } catch (error) {
            console.error('Failed to get stack:', error);
            return null;
        }
    }

    async getStackStatus(stackName) {
        try {
            const stack = await this.getStack(stackName);
            
            if (stack) {
                console.log(`Stack status check for ${stackName}:`, {
                    id: stack.Id,
                    status: stack.Status,
                    name: stack.Name,
                    endpointId: stack.EndpointId,
                    swarmId: stack.SwarmId,
                    creationDate: new Date(stack.CreationDate * 1000).toISOString()
                });
            } else {
                console.log(`Stack ${stackName} not found in Portainer`);
            }

            if (!stack) {
                return 'offline';
            }

            return stack.Status === 1 ? 'online' : 'offline';

        } catch (error) {
            console.error(`Error getting status for ${stackName}:`, error);
            return 'offline';
        }
    }

    async createStack(projectData) {
        try {
            const stackContent = await this.getStackConfig(projectData.templateId);
            if (!stackContent) {
                throw new Error('Template not found');
            }

            const stackName = projectData.name.replace(/[^a-zA-Z0-9]/g, '');

            const configuredStack = stackContent
                .replace(/CHANGEME01/g, stackName)  
                .replace(/CHANGEME02/g, `${stackName}-phpmyadmin`)
                .replace(/SUBDOMAIN01/g, `${projectData.domain}`)
                .replace(/SUBDOMAIN02/g, `db.${projectData.domain}`);

            console.log(`Creating stack: ${stackName}`);
            
            const response = await this.client.post(
                `${this.portainerUrl}/api/stacks/create/swarm/string?endpointId=5`,
                {
                    name: stackName,  
                    stackFileContent: configuredStack,
                    swarmID: "myst1l6mbp6kysq7rinrzzvda"
                },
                { headers: await this.getAuthHeaders() }
            );

            await new Promise(resolve => setTimeout(resolve, 20000));

            return { 
                success: true, 
                status: 'online',
                domains: {
                    wordpress: `${projectData.domain}.kubelab.dk`,
                    phpmyadmin: `db.${projectData.domain}.kubelab.dk`
                }
            };
        } catch (error) {
            console.error('Stack deployment failed:', error);
            return { success: false, message: error.message };
        }
    }

    async startStack(stackName) {
        try {
            const stack = await this.getStack(stackName);
            if (!stack) {
                return false;  
            }

            await this.client.post(
                `${this.portainerUrl}/api/stacks/${stack.Id}/start?endpointId=5`,
                {},
                { headers: await this.getAuthHeaders() }
            );

           
            await new Promise(resolve => setTimeout(resolve, 5000));
            return true;

        } catch (error) {
            console.error(`Error starting stack ${stackName}:`, error);
            return false;
        }
    }

    async stopStack(stackName) {
        try {
            const stack = await this.getStack(stackName);
            if (!stack) {
                return true;  
            }

            await this.client.post(
                `${this.portainerUrl}/api/stacks/${stack.Id}/stop?endpointId=5`,
                {},
                { headers: await this.getAuthHeaders() }
            );

          
            await new Promise(resolve => setTimeout(resolve, 5000));
            return true;

        } catch (error) {
            console.error(`Error stopping stack ${stackName}:`, error);
            return false;
        }
    }

    async deleteStack(stackName) {
        try {
            const stack = await this.getStack(stackName);
            
            if (!stack) {
                console.log(`Stack ${stackName} already deleted or not found`);
                return true;
            }
            await this.stopStack(stackName);
            await new Promise(resolve => setTimeout(resolve, 1000));  

            await this.client.delete(
                `${this.portainerUrl}/api/stacks/${stack.Id}?endpointId=5`,
                { headers: await this.getAuthHeaders() }
            );
           
            await new Promise(resolve => setTimeout(resolve, 1000));  
            return true;
            
        } catch (error) {
            console.error('Error deleting stack:', error);
            const stillExists = await this.getStack(stackName);
            if (!stillExists) {
                return true; 
            }
            throw error;
        }
    }

    async debugStack(stackName) {
        try {
            console.log(`\n=== Debug info for stack: ${stackName} ===`);
            
           
            const response = await this.client.get(
                `${this.portainerUrl}/api/stacks`,
                { headers: await this.getAuthHeaders() }
            );
            
            const stack = response.data.find(s => s.Name === stackName);
            
            if (stack) {
                console.log('Stack found:', {
                    id: stack.Id,
                    name: stack.Name,
                    status: stack.Status,
                    endpointId: stack.EndpointId,
                    swarmId: stack.SwarmId,
                    creationDate: new Date(stack.CreationDate * 1000).toISOString()
                });
                
        
                const status = await this.getStackStatus(stackName);
                console.log('Status from getStackStatus:', status);
                
            } else {
                console.log('Stack not found in Portainer');
            }
            
            console.log('===============================\n');
            
        } catch (error) {
            console.error('Debug error:', error);
        }
    }
}

module.exports = PortainerService; 