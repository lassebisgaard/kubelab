const axios = require('axios');
const https = require('https');
const pool = require('../config/database');

class PortainerService {
    constructor() {
        this.portainerUrl = 'https://portainer.kubelab.dk';
        this.portainerUsername = 'Lasse2024';
        this.portainerPassword = 'Gulelefant7';
        this.portainerToken = null;
        
        // Create axios instance that accepts self-signed certificates
        this.client = axios.create({
            httpsAgent: new https.Agent({  
                rejectUnauthorized: false
            })
        });
    }

    async login() {
        try {
            const response = await this.client.post(`${this.portainerUrl}/api/auth`, {
                username: this.portainerUsername,
                password: this.portainerPassword
            });
            
            this.portainerToken = response.data.jwt;
            return this.portainerToken;
        } catch (error) {
            console.error('Portainer login failed:', error);
            throw error;
        }
    }

    async getAuthHeaders() {
        if (!this.portainerToken) {
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
            console.error('Stack deployment failed:', error);
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
        const stacks = await this.getStacks();
        return stacks.find(s => s.Name === stackName);
    }

    async updateStack(stackName, newConfig) {
        try {
            const stack = await this.getStack(stackName);
            if (!stack) return null;

            const response = await this.client.put(
                `${this.portainerUrl}/api/stacks/${stack.Id}`,
                newConfig,
                { headers: await this.getAuthHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Failed to update stack:', error);
            throw error;
        }
    }

    async createStack(projectData) {
        try {
            const stackContent = await this.getStackConfig(projectData.templateId);
            if (!stackContent) {
                throw new Error('Failed to get stack configuration');
            }

            const configuredStack = stackContent
                .replace(/CHANGEME01/g, projectData.name)
                .replace(/CHANGEME02/g, `${projectData.name}-phpmyadmin`)
                .replace(/SUBDOMAIN01/g, `wp.${projectData.domain}`)
                .replace(/SUBDOMAIN02/g, `db.${projectData.domain}`)
                .replace(/CHANGEME/g, projectData.name)
                .replace(/SUBDOMAIN/g, projectData.domain);

            const response = await this.client.post(
                `${this.portainerUrl}/api/stacks/create/swarm/string?endpointId=5`,
                {
                    name: projectData.name,
                    stackFileContent: configuredStack,
                    swarmID: "myst1l6mbp6kysq7rinrzzvda"
                },
                {
                    headers: await this.getAuthHeaders()
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
            const stack = await this.getStack(stackName);
            if (!stack) {
                return;
            }
            const response = await this.client.delete(
                `${this.portainerUrl}/stacks/${stack.Id}?endpointId=5`,
                {
                    headers: await this.getAuthHeaders()
                }
            );
            return response.data;
        } catch (error) {
            if (error.response?.status === 403) {
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

            const statusMap = {
                1: 'online',     // Active
                2: 'offline',    // Inactive
                'active': 'online',
                'inactive': 'offline'
            };

            const status = statusMap[stack.Status] || 'unknown';
            return status;

        } catch (error) {
            return 'unknown';
        }
    }

    async startStack(stackName) {
        try {
            const stack = await this.getStack(stackName);
            if (!stack) return false;

            if (stack.Status === 1) {
                return true;
            }

            const response = await this.client.post(
                `${this.portainerUrl}/api/stacks/${stack.Id}/start?endpointId=5`,
                {},
                { headers: await this.getAuthHeaders() }
            );
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    async stopStack(stackName) {
        try {
            const stack = await this.getStack(stackName);
            if (!stack) return false;

            if (stack.Status === 2) {
                return true;
            }

            const response = await this.client.post(
                `${this.portainerUrl}/api/stacks/${stack.Id}/stop?endpointId=5`,
                {},
                { headers: await this.getAuthHeaders() }
            );

            await new Promise(resolve => setTimeout(resolve, 1000));

            return response.status === 200;
        } catch (error) {
            return false;
        }
    }
}

module.exports = PortainerService; 