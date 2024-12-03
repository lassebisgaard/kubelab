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
        this.maxSteps = this.steps.length;
        
        // Check if we're editing
        const urlParams = new URLSearchParams(window.location.search);
        this.isEditing = urlParams.has('edit');
        
        // Form data
        this.formData = {
            name: '',
            description: '',
            services: []
        };

        // Disable next button initially for project type
        if (this.type === 'project') {
            this.nextButton.disabled = true;
        }

        // Init
        this.init();
    }

    init() {
        // Navigation handlers
        this.backButton?.addEventListener('click', () => this.handleBack());
        this.nextButton?.addEventListener('click', () => this.handleNext());
        
        // Load edit data if editing
        if (this.isEditing) {
            this.loadEditData();
        }
        
        // Fetch initial data
        if (this.type === 'template') {
            this.loadServices();
        } else if (this.type === 'project') {
            this.loadTemplates();
            this.loadServices();
            this.initServiceFilters();
        }
        
        this.updateSteps();
        this.initFileUploads();

        // Add service creation handlers
        this.initServiceCreation();
    }

    loadEditData() {
        const editData = JSON.parse(sessionStorage.getItem('editTemplate'));
        if (editData) {
            // Update form data
            this.formData = {
                ...this.formData,
                ...editData
            };

            // Update form fields
            const nameInput = document.getElementById('template-name-input');
            const descriptionInput = document.getElementById('template-description-input');
            if (nameInput) nameInput.value = editData.name;
            if (descriptionInput) descriptionInput.value = editData.description;

            // Update preview image if exists
            if (editData.previewImage) {
                const previewContainer = document.querySelector('.preview-container--upload');
                if (previewContainer) {
                    previewContainer.innerHTML = `
                        <img src="${editData.previewImage}" alt="Preview">
                        <button class="remove-file">
                            <i class='bx bx-x'></i>
                        </button>
                    `;

                    // Add remove button handler
                    const removeBtn = previewContainer.querySelector('.remove-file');
                    removeBtn?.addEventListener('click', () => {
                        this.formData.previewImage = null;
                        previewContainer.innerHTML = `
                            <input type="file" id="preview-image" hidden accept="image/*">
                            <label for="preview-image" class="upload-area">
                                <i class='bx bx-image'></i>
                                <span>Click to upload preview image</span>
                            </label>
                        `;
                        this.initFileUploads();
                    });
                }
            }

            // Update page title and button text
            const pageTitle = document.querySelector('.page-title');
            if (pageTitle) pageTitle.textContent = 'Edit template';

            // Clear session storage
            sessionStorage.removeItem('editTemplate');
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
                    alert('Please enter a service name');
                    return;
                }
                if (!selectedIcon) {
                    alert('Please select an icon');
                    return;
                }

                try {
                    const response = await fetch('http://localhost:3000/api/services', {
                        method: 'POST',
                        headers: {
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
                        serviceTag.dataset.service = newService.id;
                        serviceTag.innerHTML = `
                            <i class='bx ${newService.icon}'></i>
                            <span>${newService.name}</span>
                            <button class="service-tag--remove" title="Remove service">
                                <i class='bx bx-x'></i>
                            </button>
                        `;

                        servicesSelection.appendChild(serviceTag);
                        
                        // Add click handlers
                        serviceTag.addEventListener('click', async (e) => {
                            if (e.target.closest('.service-tag--remove')) {
                                try {
                                    const response = await fetch(`http://localhost:3000/api/services/${newService.id}`, {
                                        method: 'DELETE'
                                    });
                                    
                                    if (!response.ok) throw new Error('Failed to delete service');
                                    
                                    serviceTag.remove();
                                    this.updateSelectedServices();
                                } catch (error) {
                                    console.error('Error deleting service:', error);
                                    alert('Failed to delete service');
                                }
                                return;
                            }
                            
                            serviceTag.classList.toggle('active');
                            this.updateSelectedServices();
                        });
                    }

                    closeModal();
                } catch (error) {
                    console.error('Error creating service:', error);
                    alert('Failed to create service');
                }
            });
        }
    }

    async fetchTemplates() {
        try {
            const response = await fetch('http://localhost:3000/api/templates');
            const templates = await response.json();
            
            const templateGrid = document.querySelector('.project-template-grid');
            if (templateGrid) {
                templateGrid.innerHTML = templates.map(template => `
                    <div class="project-template-card" 
                         data-id="${template.TemplateId}"
                         data-services="${template.service_ids || ''}"
                         role="button"
                         tabindex="0">
                        <h2>${template.TemplateName}</h2>
                        <p class="text-secondary">${template.Description || 'No description'}</p>
                        <div class="preview-container preview-container--template">
                            <img src="${template.Image || '../assets/images/placeholder.webp'}" 
                                 alt="Template preview">
                        </div>
                        <div class="included-services text-secondary">Included services:</div>
                        <div class="services">
                            ${template.service_ids ? window.renderServiceTags(template.service_ids.split(','), { isStatic: true }) : ''}
                        </div>
                    </div>
                `).join('');

                // Add click handlers
                this.initTemplateSelection();
            }

        } catch (error) {
            console.error('Error fetching templates:', error);
            const templateGrid = document.querySelector('.project-template-grid');
            if (templateGrid) {
                templateGrid.innerHTML = `
                    <div class="error-message">
                        <i class='bx bx-error'></i>
                        <p>Failed to load templates</p>
                        <button class="button secondary" onclick="this.fetchTemplates()">Try Again</button>
                    </div>
                `;
            }
        }
    }

    initTemplateSelection() {
        console.log('Initializing template selection');
        const templateCards = document.querySelectorAll('.project-template-card');
        
        templateCards.forEach(card => {
            card.addEventListener('click', () => {
                console.log('Card clicked');
                templateCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                this.formData.template = {
                    id: card.dataset.id,
                    name: card.querySelector('h2').textContent,
                    description: card.querySelector('p').textContent,
                    services: card.dataset.services.split(','),
                    author: card.querySelector('.author').textContent.replace('By ', '')
                };

                console.log('Selected template:', this.formData.template); // Debug log

                // Enable next button
                if (this.nextButton) {
                    this.nextButton.disabled = false;
                }
            });
        });
    }

    initServiceFilters() {
        const filterContainer = document.querySelector('.services-filter');
        const templateGrid = document.querySelector('.project-template-grid');
        
        if (filterContainer && templateGrid) {
            // Add service filter tags
            filterContainer.innerHTML = Object.keys(window.SERVICES).map(id => {
                const service = window.SERVICES[id];
                return `
                    <div class="service-tag service-tag--selectable" data-service="${service.id}">
                        <i class='bx ${service.icon}'></i>
                        <span>${service.name}</span>
                    </div>
                `;
            }).join('');

            // Add click handlers to filter tags
            const filterTags = filterContainer.querySelectorAll('.service-tag');
            filterTags.forEach(tag => {
                tag.addEventListener('click', () => {
                    tag.classList.toggle('active');
                    
                    const activeFilters = Array.from(filterTags)
                        .filter(t => t.classList.contains('active'))
                        .map(t => t.dataset.service);

                    templateGrid.querySelectorAll('.project-template-card').forEach(card => {
                        const cardServices = card.dataset.services.split(',');
                        
                        if (activeFilters.length === 0 || 
                            activeFilters.some(filter => cardServices.includes(filter))) {
                            card.style.display = '';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                });
            });
        }
    }

    handleBack() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateSteps();
        }
    }

    handleNext() {
        if (this.currentStep < this.maxSteps) {
            if (this.validateCurrentStep()) {
                this.currentStep++;
                this.updateSteps();
            }
        } else {
            this.handleSubmission();
        }
    }

    validateCurrentStep() {
        // Template validation
        if (this.type === 'template' && this.currentStep === 1) {
            return this.validateTemplateStep();
        }
        
        // Project validation
        if (this.type === 'project') {
            if (this.currentStep === 1) {
                return this.validateProjectTemplateStep();
            }
            if (this.currentStep === 2) {
                return this.validateProjectInfoStep();
            }
        }
        
        return true;
    }

    validateTemplateStep() {
        const nameInput = document.getElementById('template-name-input');
        
        if (!nameInput?.value) {
            alert('Please enter a template name');
            return false;
        }
        
        if (!this.formData.yamlFile) {
            alert('Please upload a YAML file');
            return false;
        }

        // Gem form data
        this.formData.name = nameInput.value;
        this.formData.description = document.getElementById('template-description-input')?.value || '';

        // Opdater confirmation step
        this.updateTemplateConfirmation();
        
        return true;
    }

    validateProjectTemplateStep() {
        if (!this.formData.template) {
            alert('Please select a template');
            return false;
        }
        return true;
    }

    validateProjectInfoStep() {
        const nameInput = document.getElementById('project-name-input');
        const domainInput = document.getElementById('project-domain-input');
        
        if (!nameInput?.value || !domainInput?.value) {
            alert('Please fill in required fields');
            return false;
        }

        // Gem form data
        this.formData.name = nameInput.value;
        this.formData.domain = domainInput.value;
        this.formData.description = document.getElementById('project-description-input')?.value || '';

        // Opdater confirmation step
        this.updateProjectConfirmation();
        
        return true;
    }

    updateTemplateConfirmation() {
        document.getElementById('template-name-confirm').textContent = this.formData.name;
        document.getElementById('template-description-confirm').textContent = this.formData.description;

        // Vis YAML fil
        const yamlDisplay = document.querySelector('#template-step2 .yaml-file-display');
        if (yamlDisplay && this.formData.yamlFile) {
            yamlDisplay.innerHTML = `
                <div class="file-preview">
                    <i class='bx bx-file'></i>
                    <span class="filename">${this.formData.yamlFile.name}</span>
                </div>
            `;
        }

        // Vis preview billede
        const previewContainer = document.querySelector('#template-step2 .preview-container--detail');
        if (previewContainer && this.formData.previewImage) {
            previewContainer.innerHTML = `<img src="${this.formData.previewImage}" alt="Preview">`;
        }

        // Vis services
        const serviceTagsContainer = document.querySelector('#template-step2 .service-tags');
        if (serviceTagsContainer) {
            serviceTagsContainer.innerHTML = this.formData.services.map(id => {
                const service = window.SERVICES[id];
                return `
                    <div class="service-tag service-tag--static">
                        <i class='bx ${service.icon}'></i>
                        <span>${service.name}</span>
                    </div>
                `;
            }).join('');
        }
    }

    updateProjectConfirmation() {
        // Opdater projekt info
        document.getElementById('project-name-confirm').textContent = this.formData.name;
        document.getElementById('project-domain-confirm').textContent = `${this.formData.domain}.kubelab.dk`;
        document.getElementById('project-description-confirm').textContent = this.formData.description || 'Not specified';

        // Opdater template visning
        const templateDisplay = document.querySelector('.template-display');
        if (templateDisplay && this.formData.template) {
            templateDisplay.innerHTML = `
                <i class='bx bx-code-block'></i>
                <div class="template-info">
                    <h3>${this.formData.template.name}</h3>
                    <p>${this.formData.template.description}</p>
                    <div class="services">
                        ${window.renderServiceTags(this.formData.template.services, { isStatic: true })}
                    </div>
                </div>
            `;
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

    async handleSubmission() {
        try {
            const endpoint = this.type === 'template' ? '/api/templates' : '/api/projects';
            
            this.showLoadingOverlay();
            
            let submitData = {};
            
            if (this.type === 'template') {
                submitData = {
                    name: this.formData.name,
                    description: this.formData.description,
                    services: this.formData.services || []
                };
            } else if (this.type === 'project') {
                submitData = {
                    name: this.formData.name,
                    domain: this.formData.domain,
                    description: this.formData.description,
                    templateId: this.formData.template?.id,
                    userId: 1
                };
            }
            
            const response = await fetch(`http://localhost:3000${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submitData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `Failed to create ${this.type}`);
            }

            const result = await response.json();
            
            this.hideLoadingOverlay();
            this.showSuccessOverlay();
            
            setTimeout(() => {
                window.location.href = this.type === 'template' 
                    ? '/pages/templates.html' 
                    : '/pages/projects.html';
            }, 2000);
        } catch (error) {
            this.hideLoadingOverlay();
            this.showErrorMessage(error.message);
        }
    }

    showLoadingOverlay() {
        document.querySelector('.loading-overlay')?.classList.add('show');
    }

    hideLoadingOverlay() {
        document.querySelector('.loading-overlay')?.classList.remove('show');
    }

    showSuccessOverlay() {
        document.querySelector('.success-overlay')?.classList.add('show');
    }

    initFileUploads() {
        if (this.type === 'template') {
            // YAML upload
            const yamlInput = document.getElementById('yaml-file');
            const yamlUpload = document.querySelector('.yaml-upload');
            
            yamlInput?.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.formData.yamlFile = file;
                    yamlUpload.innerHTML = `
                        <div class="yaml-file-display">
                            <i class='bx bx-file'></i>
                            <span class="filename">${file.name}</span>
                            <button class="remove-file" type="button">
                                <i class='bx bx-x'></i>
                            </button>
                        </div>
                    `;

                    // Add remove button handler
                    const removeBtn = yamlUpload.querySelector('.remove-file');
                    removeBtn?.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.formData.yamlFile = null;
                        yamlUpload.innerHTML = `
                            <input type="file" 
                                   id="yaml-file" 
                                   hidden 
                                   accept=".yaml,.yml"
                                   required>
                            <label for="yaml-file" class="upload-area">
                                <i class='bx bx-file'></i>
                                <span>Drop your YAML file here or click to browse</span>
                            </label>
                        `;
                        // Reinitialize file input
                        this.initFileUploads();
                    });
                }
            });

            // Preview image upload
            const imageInput = document.getElementById('preview-image');
            const previewUpload = document.querySelector('.preview-container--upload');
            
            imageInput?.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.formData.previewImage = e.target.result;
                        previewUpload.innerHTML = `
                            <img src="${e.target.result}" alt="Preview">
                            <button class="remove-file">
                                <i class='bx bx-x'></i>
                            </button>
                        `;

                        const removeBtn = previewUpload.querySelector('.remove-file');
                        removeBtn?.addEventListener('click', () => {
                            this.formData.previewImage = null;
                            previewUpload.innerHTML = `
                                <input type="file" id="preview-image" hidden accept="image/*">
                                <label for="preview-image" class="upload-area">
                                    <i class='bx bx-image'></i>
                                    <span>Click to upload preview image</span>
                                </label>
                            `;
                            this.initFileUploads();
                        });
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    async loadServices() {
        try {
            await window.loadServices();
            
            const servicesSelection = document.querySelector('.services-selection');
            if (!servicesSelection) return;
            
            servicesSelection.querySelector('.loading-indicator')?.remove();
            
            servicesSelection.innerHTML = Object.values(window.SERVICES).map(service => `
                <div class="service-tag service-tag--selectable" data-service="${service.id}">
                    <i class='bx ${service.icon}'></i>
                    <span>${service.name}</span>
                    <button class="service-tag--remove" title="Remove service">
                        <i class='bx bx-x'></i>
                    </button>
                </div>
            `).join('');

            servicesSelection.querySelectorAll('.service-tag--selectable').forEach(tag => {
                tag.addEventListener('click', async (e) => {
                    if (e.target.closest('.service-tag--remove')) {
                        const serviceId = tag.dataset.service;
                        const serviceName = tag.querySelector('span').textContent;
                        
                        // Brug window.showDeleteConfirmation fra script.js
                        window.showDeleteConfirmation(
                            'Delete Service',
                            `Are you sure you want to delete the service "${serviceName}"?`,
                            async () => {
                                try {
                                    const response = await fetch(`http://localhost:3000/api/services/${serviceId}`, {
                                        method: 'DELETE'
                                    });
                                    
                                    if (!response.ok) throw new Error('Failed to delete service');
                                    
                                    tag.remove();
                                    this.updateSelectedServices();
                                } catch (error) {
                                    console.error('Error deleting service:', error);
                                    alert('Failed to delete service');
                                }
                            }
                        );
                        return;
                    }
                    
                    tag.classList.toggle('active');
                    this.updateSelectedServices();
                });
            });
        } catch (error) {
            console.error('Error loading services:', error);
        }
    }

    updateSelectedServices() {
        const selectedServices = Array.from(
            document.querySelectorAll('.service-tag--selectable.active')
        ).map(tag => tag.dataset.service);
        
        this.formData.services = selectedServices;
        console.log('Updated selected services:', this.formData.services);
    }

    async loadTemplates() {
        const templateGrid = document.querySelector('.project-template-grid');
        if (!templateGrid) return;

        try {
            const response = await fetch('http://localhost:3000/api/templates');
            const templates = await response.json();
            
            templateGrid.innerHTML = templates.map(t => `
                <div class="project-template-card" 
                     data-id="${t.TemplateId}"
                     data-services="${t.service_ids || ''}"
                     role="button"
                     tabindex="0">
                    <div class="template-header">
                        <h3>${t.TemplateName}</h3>
                    </div>
                    <p class="text-secondary">${t.Description || 'No description'}</p>
                    <div class="preview-container preview-container--template">
                        <img src="${t.Image || '../assets/images/placeholder.webp'}" alt="Template preview">
                    </div>
                    <div class="author text-secondary">By: ${t.Owner || 'Unknown'}</div>
                    <div class="included-services text-secondary">Included services:</div>
                    <div class="service-tags-container">
                        ${t.service_ids ? window.renderServiceTags(t.service_ids.split(','), { isStatic: true }) : 
                        '<span class="text-secondary">No services added</span>'}
                    </div>
                    <div class="template-meta text-secondary">
                        <span>Created: ${new Date(t.DateCreated).toLocaleDateString()}</span>
                    </div>
                </div>
            `).join('');

            // Tilføj click på templates
            templateGrid.querySelectorAll('.project-template-card').forEach(card => {
                card.addEventListener('click', () => {
                    templateGrid.querySelectorAll('.project-template-card')
                        .forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    
                    this.formData.template = {
                        id: card.dataset.id,
                        name: card.querySelector('h3').textContent,
                        description: card.querySelector('p').textContent,
                        services: card.dataset.services?.split(',') || []
                    };
                    
                    this.nextButton.disabled = false;
                });
            });

        } catch (error) {
            templateGrid.innerHTML = `
                <div class="error-message">
                    <i class='bx bx-error'></i>
                    <p>Failed to load templates</p>
                </div>
            `;
        }
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class='bx bx-error'></i>
            <p>${message}</p>
        `;

        // Find det aktive step content og indsæt fejlmeddelelsen
        const activeStep = document.querySelector('.step-content.active');
        if (activeStep) {
            // Fjern eksisterende fejlmeddelelser
            activeStep.querySelectorAll('.error-message').forEach(el => el.remove());
            activeStep.insertBefore(errorDiv, activeStep.firstChild);
        }
    }
}


