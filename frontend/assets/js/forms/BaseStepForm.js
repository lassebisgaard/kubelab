window.BaseStepForm = class BaseStepForm {
    constructor(type) {
        // Basis setup
        this.type = type;
        this.steps = document.querySelectorAll('.step');
        this.stepContents = document.querySelectorAll('.step-content');
        this.stepDividers = document.querySelectorAll('.step-divider');
        this.backButton = document.querySelector('.back-button');
        this.nextButton = document.querySelector('.next-button');
        this.currentStep = 1;
        
        // Update maxSteps logic
        this.maxSteps = this.getMaxSteps();
        
        // edit mode check...
        const urlParams = new URLSearchParams(window.location.search);
        this.editMode = urlParams.has('edit');
        this.editId = urlParams.get('edit');
        
        // Update formData initialization
        this.formData = this.getInitialFormData();

        // Disable next button for types that need selection
        if (['project', 'user', 'team'].includes(this.type)) {
            this.nextButton.disabled = true;
        }

        // Init
        this.init();
    }

    getMaxSteps() {
        const stepMap = {
            'template': 2,
            'project': 3,
            'team': 2,
            'user': 2
        };
        return stepMap[this.type] || 2;
    }

    getInitialFormData() {
        const initialData = {
            'template': {
                name: '',
                description: '',
                services: [],
                yamlFile: null,
                previewImage: null
            },
            'project': {
                name: '',
                description: '',
                template: null,
                domain: ''
            },
            'team': {
                name: '',
                expiration: '',
                description: '',
                members: []
            },
            'user': {
                name: '',
                email: '',
                teamId: null,
                role: 'studerende',
                expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
        };
        return initialData[this.type] || {};
    }

    init() {
        // Navigation handlers
        this.backButton?.addEventListener('click', () => this.handleBack());
        this.nextButton?.addEventListener('click', () => this.handleNext());
        
        // Update type-specific initialization
        switch (this.type) {
            case 'template':
                this.loadServices();
                this.initFileUploads();
                this.initServiceCreation();
                break;
            case 'project':
                this.loadTemplates();
                this.loadServices();
                this.initServiceFilters();
                break;
            case 'team':
                this.initMemberModal();
                break;
            case 'user':
                this.loadTeams();
                break;
        }
        
        this.updateSteps();
    }

    validateCurrentStep() {
        const validators = {
            'template': {
                1: () => this.validateTemplateStep(),
                2: () => true
            },
            'project': {
                1: () => this.validateProjectTemplateStep(),
                2: () => this.validateProjectInfoStep()
            },
            'team': {
                1: () => this.validateTeamInfoStep(),
                2: () => this.validateTeamMembersStep()
            },
            'user': {
                1: () => this.validateUserInfoStep(),
                2: () => this.validateUserTeamStep()
            }
        };

        return validators[this.type]?.[this.currentStep]?.() ?? true;
    }

    // Add new validation methods
    validateTeamInfoStep() {
        const nameInput = document.getElementById('team-name-input');
        const expirationInput = document.getElementById('team-expiration-input');
        
        if (!nameInput?.value || !expirationInput?.value) {
            this.showErrorMessage('Please fill in all required fields');
            return false;
        }
        
        this.formData.name = nameInput.value;
        this.formData.expiration = expirationInput.value;
        this.formData.description = document.getElementById('team-description-input')?.value || '';
        return true;
    }

    validateTeamMembersStep() {
        if (!this.formData.members?.length) {
            this.showErrorMessage('Please add at least one team member');
            return false;
        }
        return true;
    }

    validateUserInfoStep() {
        const nameInput = document.getElementById('user-name-input');
        const emailInput = document.getElementById('user-email-input');
        const roleSelect = document.getElementById('user-role-select');
        const expirationInput = document.getElementById('user-expiration-input');
        
        if (!nameInput?.value || !emailInput?.value || !roleSelect?.value || !expirationInput?.value) {
            this.showErrorMessage('Please fill in all required fields');
            return false;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            this.showErrorMessage('Please enter a valid email address');
            return false;
        }
        
        this.formData.name = nameInput.value;
        this.formData.email = emailInput.value;
        this.formData.role = roleSelect.value;
        this.formData.expiration = expirationInput.value;
        return true;
    }

    validateUserTeamStep() {
        if (!this.formData.teamId) {
            this.showErrorMessage('Please select a team');
            return false;
        }
        return true;
    }

    // Add new initialization methods
    initMemberModal() {
        const addMemberBtn = document.querySelector('.create-service-link');
        const modal = document.getElementById('addMemberModal');
        
        addMemberBtn?.addEventListener('click', () => {
            modal.classList.add('show');
            this.loadUsers();
        });

        modal.querySelector('.close-modal')?.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        // Add other modal event listeners...
    }

    async loadUsers() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.status === 401) {
                window.location.href = '/pages/login.html';
                return;
            }

            const users = await response.json();
            const userList = document.querySelector('.user-list');
            
            if (userList) {
                userList.innerHTML = users.map(user => `
                    <div class="user-option" data-user-id="${user.UserId}">
                        <div class="user-info">
                            <span class="user-name">${user.Name}</span>
                            <span class="user-email">${user.Mail}</span>
                        </div>
                        <input type="checkbox" class="user-select">
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showErrorMessage('Failed to load users');
        }
    }

    async loadTeams() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/teams', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.status === 401) {
                window.location.href = '/pages/login.html';
                return;
            }

            const teams = await response.json();
            const teamSelect = document.querySelector('.team-selection');
            
            if (teamSelect) {
                teamSelect.innerHTML = teams.map(team => `
                    <div class="team-option" data-team-id="${team.TeamId}">
                        <span class="team-name">${team.TeamName}</span>
                        <span class="member-count">${team.MemberCount || 0} members</span>
                    </div>
                `).join('');

                // Add click handlers
                teamSelect.querySelectorAll('.team-option').forEach(option => {
                    option.addEventListener('click', () => {
                        teamSelect.querySelectorAll('.team-option').forEach(opt => 
                            opt.classList.remove('selected'));
                        option.classList.add('selected');
                        this.formData.teamId = option.dataset.teamId;
                        this.nextButton.disabled = false;
                    });
                });
            }
        } catch (error) {
            console.error('Error loading teams:', error);
            this.showErrorMessage('Failed to load teams');
        }
    }

    updateSelectedMembers() {
        const selectedUsers = Array.from(
            document.querySelectorAll('.user-option input:checked')
        ).map(checkbox => {
            const userOption = checkbox.closest('.user-option');
            return {
                userId: userOption.dataset.userId,
                name: userOption.querySelector('.user-name').textContent,
                email: userOption.querySelector('.user-email').textContent
            };
        });

        this.formData.members = selectedUsers;
        
        // Update members display
        const membersContainer = document.querySelector('.selected-members');
        if (membersContainer) {
            membersContainer.innerHTML = selectedUsers.map(user => `
                <div class="member-tag">
                    <span class="member-name">${user.name}</span>
                    <button class="remove-member" data-user-id="${user.userId}">
                        <i class='bx bx-x'></i>
                    </button>
                </div>
            `).join('');

            // Enable next button if we have members
            if (this.nextButton) {
                this.nextButton.disabled = !selectedUsers.length;
            }
        }
    }

    async handleSubmission() {
        try {
            document.querySelector('.loading-overlay').classList.add('show');

            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/pages/login.html';
                return;
            }

            let response;
            switch (this.type) {
                case 'template':
                    response = await this.submitTemplate(token);
                    break;
                case 'project':
                    response = await this.submitProject(token);
                    break;
                case 'team':
                    response = await this.submitTeam(token);
                    break;
                case 'user':
                    response = await this.submitUser(token);
                    break;
            }

            if (!response.ok) throw new Error(`Failed to create ${this.type}`);

            // Show success and redirect
            document.querySelector('.loading-overlay').classList.remove('show');
            document.querySelector('.success-overlay').classList.add('show');

            setTimeout(() => {
                window.location.href = `/pages/${this.type}s.html`;
            }, 2000);

        } catch (error) {
            console.error('Error:', error);
            document.querySelector('.loading-overlay').classList.remove('show');
            this.showErrorMessage(`Failed to create ${this.type}`);
        }
    }

    async submitTeam(token) {
        return await fetch('http://localhost:3000/api/teams', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: this.formData.name,
                expiration: this.formData.expiration,
                description: this.formData.description,
                members: this.formData.members
            })
        });
    }

    async submitUser(token) {
        return await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: this.formData.name,
                email: this.formData.email,
                teamId: this.formData.teamId,
                role: this.formData.role,
                expiration: this.formData.expiration
            })
        });
    }

    handleBack() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateSteps();
        }
    }

    handleNext() {
        if (this.validateCurrentStep()) {
            if (this.currentStep === this.maxSteps) {
                this.handleSubmit();
            } else {
                this.currentStep++;
                this.updateSteps();
                if (this.type === 'project' && this.currentStep === 3) {
                    this.updateConfirmationStep();
                }
            }
        }
    }

    updateSteps() {
        this.steps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
                step.querySelector('.step-number').innerHTML = '<i class="bx bx-check"></i>';
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
                step.querySelector('.step-number').textContent = stepNumber;
            } else {
                step.querySelector('.step-number').textContent = stepNumber;
            }
        });

        this.stepDividers.forEach((divider, index) => {
            divider.classList.toggle('completed', index + 1 < this.currentStep);
        });

        this.stepContents.forEach((content, index) => {
            content.classList.toggle('active', index + 1 === this.currentStep);
        });

        this.backButton.style.display = this.currentStep === 1 ? 'none' : 'flex';
        this.updateNextButton();
    }

    updateNextButton() {
        if (this.currentStep === this.maxSteps) {
            const text = this.type === 'template' ? 'Create template' : 'Create project';
            this.nextButton.innerHTML = `${text} <i class="bx bx-check"></i>`;
            this.nextButton.classList.add(`create-${this.type}-button`);
        } else {
            this.nextButton.innerHTML = 'Next <i class="bx bxs-right-arrow-alt"></i>';
            this.nextButton.classList.remove(`create-${this.type}-button`);
        }
    }

    initFileUploads() {
        // YAML fil upload
        const yamlInput = document.getElementById('yaml-file');
        const yamlArea = document.querySelector('[data-upload-area]');
        
        if (yamlInput && yamlArea) {
            yamlArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                yamlArea.classList.add('dragover');
            });

            yamlArea.addEventListener('dragleave', () => {
                yamlArea.classList.remove('dragover');
            });

            yamlArea.addEventListener('drop', (e) => {
                e.preventDefault();
                yamlArea.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file && (file.name.endsWith('.yaml') || file.name.endsWith('.yml'))) {
                    this.handleYamlFile(file);
                }
            });

            yamlInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleYamlFile(file);
                }
            });
        }

        // Preview billede upload
        const previewInput = document.getElementById('preview-image');
        const previewArea = document.querySelector('.preview-container--upload');
        
        if (previewInput && previewArea) {
            previewInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handlePreviewImage(file);
                }
            });
        }
    }

    handleYamlFile(file) {
        this.formData.yamlFile = file;
        const yamlArea = document.querySelector('[data-upload-area]');
        if (yamlArea) {
            yamlArea.innerHTML = `
                <div class="file-preview">
                    <i class='bx bx-file'></i>
                    <span class="filename">${file.name}</span>
                </div>
            `;
        }
    }

    handlePreviewImage(file) {
        this.formData.previewImage = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewArea = document.querySelector('.preview-container--upload');
            if (previewArea) {
                previewArea.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            }
        };
        reader.readAsDataURL(file);
    }

    showErrorMessage(message) {
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'error-overlay';
        errorOverlay.innerHTML = `
            <div class="error-content">
                <div class="error-icon">
                    <i class='bx bx-x'></i>
                </div>
                <h2>Error</h2>
                <p>${message}</p>
            </div>
        `;
        
        document.body.appendChild(errorOverlay);
        
        setTimeout(() => errorOverlay.classList.add('active'), 10);
        
        setTimeout(() => {
            errorOverlay.classList.remove('active');
            setTimeout(() => errorOverlay.remove(), 300);
        }, 3000);
    }

    async submitTemplate(token) {
        const formData = new FormData();
        formData.append('name', this.formData.name);
        formData.append('description', this.formData.description);
        formData.append('services', JSON.stringify(this.formData.services || []));
        
        // Add user ID from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        formData.append('userId', user.UserId);
        
        if (this.formData.yamlFile) {
            formData.append('yaml', this.formData.yamlFile);
            // Also append the YAML content as text
            const yamlContent = await this.formData.yamlFile.text();
            formData.append('yamlContent', yamlContent);
        }
        
        if (this.formData.previewImage) {
            // If previewImage is a base64 string, convert to blob
            if (typeof this.formData.previewImage === 'string' && this.formData.previewImage.startsWith('data:')) {
                const response = await fetch(this.formData.previewImage);
                const blob = await response.blob();
                formData.append('preview', blob, 'preview.png');
            } else {
                formData.append('preview', this.formData.previewImage);
            }
        }

        const method = this.editMode ? 'PUT' : 'POST';
        const url = this.editMode 
            ? `http://localhost:3000/api/templates/${this.editId}`
            : 'http://localhost:3000/api/templates';

        return await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
    }

    async submitProject(token) {
        return await fetch('http://localhost:3000/api/projects', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: this.formData.name,
                description: this.formData.description,
                templateId: this.formData.template.id,
                domain: this.formData.domain
            })
        });
    }

    async loadServices() {
        try {
            const services = await window.initializeServices();
            const servicesContainer = document.querySelector('.services-selection');
            if (!servicesContainer) return;

            // Fjern loading indicator
            servicesContainer.querySelector('.loading-indicator')?.remove();

            // Brug samme HTML struktur som i templates.js
            servicesContainer.innerHTML = services.map(service => `
                <div class="service-tag service-tag--selectable" 
                     data-service="${service.ServiceId}"
                     role="button"
                     tabindex="0">
                    <i class='bx ${service.Icon}'></i>
                    <span>${service.ServiceName}</span>
                    ${this.type === 'template' ? `
                        <button class="service-tag--remove" title="Remove service">
                            <i class='bx bx-x'></i>
                        </button>
                    ` : ''}
                </div>
            `).join('');

            // Tilføj click handlers som i templates.js
            servicesContainer.querySelectorAll('.service-tag--selectable').forEach(tag => {
                // Handle service selection
                tag.addEventListener('click', (e) => {
                    if (!e.target.closest('.service-tag--remove')) {
                        tag.classList.toggle('active');
                        this.updateSelectedServices();
                    }
                });

                // Handle remove button hvis det er en template
                if (this.type === 'template') {
                    const removeBtn = tag.querySelector('.service-tag--remove');
                    removeBtn?.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (window.showDeleteConfirmation) {
                            window.showDeleteConfirmation(
                                'Delete Service',
                                'Are you sure you want to delete this service?',
                                async () => {
                                    try {
                                        const token = localStorage.getItem('token');
                                        const response = await fetch(`http://localhost:3000/api/services/${tag.dataset.service}`, {
                                            method: 'DELETE',
                                            headers: {
                                                'Authorization': `Bearer ${token}`
                                            }
                                        });
                                        
                                        if (response.status === 409) {
                                            this.showErrorMessage('Cannot delete service as it is being used by one or more templates');
                                            return;
                                        }
                                        
                                        if (!response.ok) throw new Error('Failed to delete service');
                                        
                                        tag.remove();
                                        this.updateSelectedServices();
                                    } catch (error) {
                                        console.error('Error deleting service:', error);
                                        this.showErrorMessage('Failed to delete service');
                                    }
                                }
                            );
                        }
                    });
                }
            });

        } catch (error) {
            console.error('Error loading services:', error);
            this.showErrorMessage('Failed to load services');
        }
    }

    async loadTemplates() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/templates', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.status === 401) {
                window.location.href = '/pages/login.html';
                return;
            }

            const templates = await response.json();
            const templateContainer = document.querySelector('.template-grid');
            
            if (templateContainer) {
                templateContainer.innerHTML = templates.map(template => `
                    <div class="template-card" data-template-id="${template.TemplateId}">
                        <div class="template-preview">
                            <img src="${template.PreviewImage || '/assets/images/default-preview.png'}" 
                                 alt="${template.Name}">
                        </div>
                        <div class="template-info">
                            <h3>${template.Name}</h3>
                            <p>${template.Description || 'No description available'}</p>
                        </div>
                        <div class="template-services">
                            ${(template.Services || []).map(service => `
                                <span class="service-tag">
                                    <i class='bx ${service.icon || 'bx-cube'}'></i>
                                    ${service.name}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                `).join('');

                // Add click handlers
                templateContainer.querySelectorAll('.template-card').forEach(card => {
                    card.addEventListener('click', () => {
                        templateContainer.querySelectorAll('.template-card').forEach(c => 
                            c.classList.remove('selected'));
                        card.classList.add('selected');
                        this.formData.template = {
                            id: card.dataset.templateId,
                            name: card.querySelector('h3').textContent
                        };
                        this.nextButton.disabled = false;
                        
                        // Update preview
                        const previewContainer = document.querySelector('.template-display');
                        if (previewContainer) {
                            previewContainer.innerHTML = `
                                <div class="template-preview">
                                    <img src="${card.querySelector('img').src}" alt="Selected template">
                                </div>
                                <div class="template-info">
                                    <h3>${card.querySelector('h3').textContent}</h3>
                                    <p>${card.querySelector('.template-info p').textContent}</p>
                                </div>
                            `;
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Error loading templates:', error);
            this.showErrorMessage('Failed to load templates');
        }
    }

    initServiceFilters() {
        const filterContainer = document.querySelector('.service-filters');
        if (!filterContainer) return;

        this.loadServices().then(() => {
            const services = Array.from(
                document.querySelectorAll('.service-tag--selectable')
            ).map(tag => ({
                name: tag.dataset.service,
                icon: tag.querySelector('i').className
            }));

            filterContainer.innerHTML = services.map(service => `
                <div class="service-filter" data-service="${service.name}">
                    <i class='${service.icon}'></i>
                    <span>${service.name}</span>
                </div>
            `).join('');

            // Add click handlers
            filterContainer.querySelectorAll('.service-filter').forEach(filter => {
                filter.addEventListener('click', () => {
                    filter.classList.toggle('active');
                    this.filterTemplates();
                });
            });
        });
    }

    filterTemplates() {
        const activeFilters = Array.from(
            document.querySelectorAll('.service-filter.active')
        ).map(filter => filter.dataset.service);

        document.querySelectorAll('.template-card').forEach(card => {
            const cardServices = Array.from(
                card.querySelectorAll('.service-tag')
            ).map(tag => tag.textContent.trim());

            if (activeFilters.length === 0 || 
                activeFilters.every(filter => cardServices.includes(filter))) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    validateTemplateStep() {
        const nameInput = document.getElementById('template-name-input');
        const yamlFile = this.formData.yamlFile;
        
        if (!nameInput?.value || !yamlFile) {
            this.showErrorMessage('Please fill in all required fields and upload a YAML file');
            return false;
        }
        
        this.formData.name = nameInput.value;
        this.formData.description = document.getElementById('template-description-input')?.value || '';
        
        // Opdater preview før vi går videre
        this.updateTemplatePreview();
        return true;
    }

    updateTemplatePreview() {
        // Opdater template navn og beskrivelse i step 2
        document.getElementById('template-name-confirm').textContent = this.formData.name;
        document.getElementById('template-description-confirm').textContent = 
            this.formData.description || 'No description';

        // Opdater YAML fil visning
        const yamlDisplay = document.querySelector('#template-step2 .yaml-file-display');
        if (yamlDisplay && this.formData.yamlFile) {
            yamlDisplay.innerHTML = `
                <div class="file-preview">
                    <i class='bx bx-file'></i>
                    <span class="filename">${this.formData.yamlFile.name}</span>
                </div>
            `;
        }

        // Opdater preview billede
        const previewContainer = document.querySelector('#template-step2 .preview-container--detail');
        if (previewContainer && this.formData.previewImage) {
            previewContainer.innerHTML = `<img src="${this.formData.previewImage}" alt="Preview">`;
        }

        // Opdater services
        const serviceTagsContainer = document.querySelector('#template-step2 .service-tags');
        if (serviceTagsContainer && this.formData.services?.length) {
            serviceTagsContainer.innerHTML = this.formData.services.map(serviceId => {
                const service = window.SERVICES[serviceId];
                return service ? `
                    <div class="service-tag service-tag--static">
                        <i class='bx ${service.icon}'></i>
                        <span>${service.name}</span>
                    </div>
                ` : '';
            }).join('');
        } else if (serviceTagsContainer) {
            serviceTagsContainer.innerHTML = '<p class="text-secondary">No services selected</p>';
        }
    }

    validateProjectTemplateStep() {
        if (!this.formData.template) {
            this.showErrorMessage('Please select a template');
            return false;
        }
        return true;
    }

    validateProjectInfoStep() {
        const nameInput = document.getElementById('project-name-input');
        const domainInput = document.getElementById('project-domain-input');
        
        if (!nameInput?.value || !domainInput?.value) {
            this.showErrorMessage('Please fill in all required fields');
            return false;
        }
        
        this.formData.name = nameInput.value;
        this.formData.description = document.getElementById('project-description-input')?.value || '';
        this.formData.domain = domainInput.value;
        return true;
    }

    async loadEditData() {
        if (!this.editMode || !this.editId) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/${this.type}s/${this.editId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error(`Failed to load ${this.type}`);

            const data = await response.json();
            this.formData = {
                ...this.formData,
                ...data
            };

            this.populateEditFields();
        } catch (error) {
            console.error('Error:', error);
            this.showErrorMessage(`Failed to load ${this.type} data`);
        }
    }

    populateEditFields() {
        switch (this.type) {
            case 'template':
                this.populateTemplateFields();
                break;
            case 'project':
                this.populateProjectFields();
                break;
            case 'team':
                this.populateTeamFields();
                break;
            case 'user':
                this.populateUserFields();
                break;
        }
    }

    updateSelectedServices() {
        const selectedServices = Array.from(
            document.querySelectorAll('.service-tag--selectable.active')
        ).map(tag => tag.dataset.service);
        
        this.formData.services = selectedServices;
        
        // Hvis vi er på template siden, opdater preview
        if (this.type === 'template') {
            this.updateTemplatePreview();
        }
    }

    initServiceCreation() {
        if (this.type === 'template') {
            const createServiceBtn = document.querySelector('.create-service-link');
            const createServiceModal = document.getElementById('createServiceModal');
            const cancelBtn = document.getElementById('cancelCreateService');
            const saveBtn = document.getElementById('saveCreateService');
            const closeBtn = createServiceModal?.querySelector('.close-modal');
            
            createServiceBtn?.addEventListener('click', () => {
                createServiceModal?.classList.add('show');
            });

            const closeModal = () => {
                createServiceModal?.classList.remove('show');
                // Reset form
                document.getElementById('service-name-input').value = '';
                document.querySelectorAll('.icon-option').forEach(opt => 
                    opt.classList.remove('selected'));
            };

            closeBtn?.addEventListener('click', closeModal);
            cancelBtn?.addEventListener('click', closeModal);

            // Handle icon selection
            document.querySelectorAll('.icon-option').forEach(option => {
                option.addEventListener('click', () => {
                    document.querySelectorAll('.icon-option').forEach(opt => 
                        opt.classList.remove('selected'));
                    option.classList.add('selected');
                });
            });

            // Handle service creation
            saveBtn?.addEventListener('click', async () => {
                const nameInput = document.getElementById('service-name-input');
                const selectedIcon = document.querySelector('.icon-option.selected');
                
                if (!nameInput?.value) {
                    this.showErrorMessage('Please enter a service name');
                    return;
                }
                if (!selectedIcon) {
                    this.showErrorMessage('Please select an icon');
                    return;
                }

                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch('http://localhost:3000/api/services', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            name: nameInput.value,
                            icon: selectedIcon.dataset.icon
                        })
                    });

                    if (!response.ok) throw new Error('Failed to create service');

                    const newService = await response.json();
                    
                    // Add to services selection
                    const servicesSelection = document.querySelector('.services-selection');
                    if (servicesSelection) {
                        const serviceTag = document.createElement('div');
                        serviceTag.className = 'service-tag service-tag--selectable';
                        serviceTag.dataset.service = newService.ServiceId;
                        serviceTag.innerHTML = `
                            <i class='bx ${newService.Icon}'></i>
                            <span>${newService.ServiceName}</span>
                            <button class="service-tag--remove" title="Remove service">
                                <i class='bx bx-x'></i>
                            </button>
                        `;

                        // Add click handlers
                        serviceTag.addEventListener('click', (e) => {
                            if (!e.target.closest('.service-tag--remove')) {
                                serviceTag.classList.toggle('active');
                                this.updateSelectedServices();
                            }
                        });

                        // Add remove button handler
                        const removeBtn = serviceTag.querySelector('.service-tag--remove');
                        removeBtn?.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            if (window.showDeleteConfirmation) {
                                window.showDeleteConfirmation(
                                    'Delete Service',
                                    `Are you sure you want to delete the service "${newService.ServiceName}"?`,
                                    async () => {
                                        try {
                                            const token = localStorage.getItem('token');
                                            const response = await fetch(`http://localhost:3000/api/services/${newService.ServiceId}`, {
                                                method: 'DELETE',
                                                headers: {
                                                    'Authorization': `Bearer ${token}`
                                                }
                                            });
                                            
                                            if (response.status === 409) {
                                                this.showErrorMessage('Cannot delete service as it is being used by one or more templates');
                                                return;
                                            }
                                            
                                            if (!response.ok) throw new Error('Failed to delete service');
                                            
                                            serviceTag.remove();
                                            this.updateSelectedServices();
                                        } catch (error) {
                                            console.error('Error deleting service:', error);
                                            this.showErrorMessage('Failed to delete service');
                                        }
                                    }
                                );
                            }
                        });

                        servicesSelection.appendChild(serviceTag);
                    }

                    // Add to window.SERVICES
                    window.SERVICES[newService.ServiceId] = {
                        id: newService.ServiceId,
                        name: newService.ServiceName,
                        icon: newService.Icon
                    };

                    closeModal();
                } catch (error) {
                    console.error('Error creating service:', error);
                    this.showErrorMessage('Failed to create service');
                }
            });
        }
    }

    updateConfirmationStep() {
        // Update confirmation step with current form data
        document.getElementById('project-name-confirm').textContent = this.formData.name || 'Not specified';
        document.getElementById('project-domain-confirm').textContent = 
            this.formData.domain ? `${this.formData.domain}.kubelab.dk` : 'Not specified';
        document.getElementById('project-description-confirm').textContent = 
            this.formData.description || 'No description provided';

        // Update template preview
        const templateDisplay = document.querySelector('.template-display');
        if (templateDisplay && this.formData.template) {
            templateDisplay.innerHTML = `
                <div class="template-info">
                    <h3>${this.formData.template.name}</h3>
                    <p class="text-secondary">${this.formData.template.description}</p>
                </div>
            `;
        }
    }

    async handleSubmit() {
        try {
            const loadingOverlay = document.querySelector('.loading-overlay');
            const successOverlay = document.querySelector('.success-overlay');
            
            loadingOverlay?.classList.add('show');
            
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));
            
            if (!user?.UserId) {
                throw new Error('No user ID found - please log in again');
            }

            // Check admin rights for admin-only operations
            if (['template', 'team'].includes(this.type) && !user.isAdmin) {
                throw new Error('Access denied. Admin rights required.');
            }

            let response;
            
            if (this.type === 'template') {
                // Handle template submission
                if (!user.isAdmin) {
                    throw new Error('Only administrators can create templates');
                }
                response = await this.submitTemplate(token);
            } else if (this.type === 'project') {
                response = await this.submitProject(token);
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to create ${this.type}`);
            }

            loadingOverlay?.classList.remove('show');
            successOverlay?.classList.add('show');

            setTimeout(() => {
                window.location.href = `${this.type}s.html`;
            }, 2000);

        } catch (error) {
            console.error('Error:', error);
            this.showErrorMessage(error.message);
            document.querySelector('.loading-overlay')?.classList.remove('show');
            
            // Redirect to login if unauthorized
            if (error.message.includes('Access denied') || error.message.includes('please log in')) {
                setTimeout(() => {
                    window.location.href = '/pages/login.html';
                }, 2000);
            }
        }
    }
}

