const axios = require('axios');
const https = require('https');
const pool = require('../config/database');

class PortainerService {
    constructor() {
        this.baseUrl = 'https://portainer.kubelab.dk/api';
        this.username = 'Lasse2024';
        this.password = 'Gulelefant7';
        this.token = null;
        
        // Create axios instance with SSL verification disabled
        this.axios = axios.create({
            httpsAgent: new https.Agent({  
                rejectUnauthorized: false
            })
        });
    }

    async authenticate() {
        try {
            console.log('Attempting to authenticate with Portainer...');
            const response = await this.axios.post(`${this.baseUrl}/auth`, {
                username: this.username,
                password: this.password
            });
            
            console.log('Portainer authentication successful');
            this.token = response.data.jwt;
            return this.token;
        } catch (error) {
            console.error('Portainer authentication error:', error);
            throw error;
        }
    }

    async makeAuthenticatedRequest(method, url, data = null) {
        const config = {
            method,
            url: `${this.baseUrl}${url}`,
            headers: { 'Authorization': `Bearer ${this.token}` },
            data,
            httpsAgent: new https.Agent({  
                rejectUnauthorized: false
            })
        };

        try {
            if (!this.token) {
                await this.authenticate();
            }
            return (await this.axios(config)).data;
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('Token expired, re-authenticating...');
                await this.authenticate();
                return (await this.axios(config)).data;
            }
            console.error(`Failed to make ${method} request to ${url}:`, error);
            throw error;
        }
    }

    async getStackConfig(templateId) {
        const [rows] = await pool.execute(
            'SELECT YamlContent FROM Templates WHERE TemplateId = ?', 
            [templateId]
        );

        if (!rows?.[0]?.YamlContent) {
            throw new Error('No YAML found for template');
        }

        return rows[0].YamlContent;
    }

    async getStacks() {
        try {
            if (!this.token) {
                await this.authenticate();
            }
            const response = await axios.get(
                `${this.baseUrl}/stacks`,
                { headers: { 'Authorization': `Bearer ${this.token}` } }
            );
            return response.data;
        } catch (error) {
            console.error('Failed to get stacks:', error);
            throw error;
        }
    }

    async getStack(stackName) {
        const stacks = await this.getStacks();
        return stacks.find(s => s.Name === stackName);
    }

    async updateStack(stackName, newConfig) {
        try {
            if (!this.token) {
                await this.authenticate();
            }
            const stack = await this.getStack(stackName);
            if (!stack) return null;

            const response = await axios.put(
                `${this.baseUrl}/stacks/${stack.Id}`,
                newConfig,
                { headers: { 'Authorization': `Bearer ${this.token}` } }
            );
            return response.data;
        } catch (error) {
            console.error('Failed to update stack:', error);
            throw error;
        }
    }

    async createStack(projectData) {
        try {
            const token = await this.authenticate();
            if (!token) {
                return { 
                    success: false, 
                    message: 'Project created but deployment pending - Portainer not available'
                };
            }
            
            const stackContent = await this.getStackConfig(projectData.templateId);
            
            console.log('Project data received:', projectData);
            
            const configuredStack = stackContent
                .replace(/CHANGEME01/g, projectData.name)
                .replace(/CHANGEME02/g, `${projectData.name}-phpmyadmin`)
                .replace(/SUBDOMAIN01/g, `wp.${projectData.domain}`)
                .replace(/SUBDOMAIN02/g, `db.${projectData.domain}`)
                .replace(/CHANGEME/g, projectData.name)
                .replace(/SUBDOMAIN/g, projectData.domain);

            console.log('Configured stack after replacements:', configuredStack);

            const response = await this.axios.post(
                `${this.baseUrl}/stacks/create/swarm/string?endpointId=5`,
                {
                    name: projectData.name,
                    stackFileContent: configuredStack,
                    swarmID: "myst1l6mbp6kysq7rinrzzvda"
                },
                {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                }
            );

            return { success: true, data: response.data };
        } catch (error) {
            console.error('Stack deployment failed:', error);
            return { 
                success: false, 
                message: 'Project created but deployment failed - will retry later'
            };
        }
    }

    async deleteStack(stackName) {
        try {
            if (!this.token) {
                await this.authenticate();
            }
            const stack = await this.getStack(stackName);
            if (!stack) {
                console.log(`Stack ${stackName} not found in Portainer`);
                return;
            }
            const response = await axios.delete(
                `${this.baseUrl}/stacks/${stack.Id}?endpointId=5`,
                {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                }
            );
            console.log(`Stack ${stackName} deleted from Portainer`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 403) {
                console.log(`No permission to delete stack ${stackName} from Portainer - continuing with database deletion`);
                return;
            }
            console.error('Failed to delete stack from Portainer:', error.message);
            return;
        }
    }

    async getStackStatus(stackName) {
        try {
            const stack = await this.getStack(stackName);
            if (!stack) {
                return 'offline';
            }
            
            return stack.Status === 1 ? 'online' : 'offline';
        } catch (error) {
            console.error(`Failed to get status for stack ${stackName}:`, error.message);
            return 'offline';
        }
    }

    async startStack(stackName) {
        try {
            if (!this.token) {
                await this.authenticate();
            }
            const stack = await this.getStack(stackName);
            if (!stack) return false;

            if (stack.Status === 1) {
                console.log(`Stack ${stackName} is already running`);
                return true;
            }

            console.log('Making start request for stack', stack.Id);
            const response = await axios.post(
                `${this.baseUrl}/stacks/${stack.Id}/start?endpointId=5`,
                {},
                { headers: { 'Authorization': `Bearer ${this.token}` } }
            );
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return response.status === 200;
        } catch (error) {
            console.error(`Failed to start stack ${stackName}:`, error);
            return false;
        }
    }

    async stopStack(stackName) {
        try {
            if (!this.token) {
                await this.authenticate();
            }
            const stack = await this.getStack(stackName);
            if (!stack) return false;

            if (stack.Status === 2) {
                console.log(`Stack ${stackName} is already stopped`);
                return true;
            }

            console.log('Making stop request for stack', stack.Id);
            const response = await axios.post(
                `${this.baseUrl}/stacks/${stack.Id}/stop?endpointId=5`,
                {},
                { headers: { 'Authorization': `Bearer ${this.token}` } }
            );

            await new Promise(resolve => setTimeout(resolve, 1000));

            return response.status === 200;
        } catch (error) {
            console.error(`Failed to stop stack ${stackName}:`, error);
            return false;
        }
    }
}

module.exports = PortainerService; 