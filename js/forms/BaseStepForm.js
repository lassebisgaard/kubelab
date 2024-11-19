console.log('BaseStepForm.js loaded');
class BaseStepForm {
    constructor(type) {
        this.type = type; // 'template' eller 'project'
        this.steps = document.querySelectorAll('.step');
        this.stepContents = document.querySelectorAll('.step-content');
        this.stepDividers = document.querySelectorAll('.step-divider');
        this.backButton = document.querySelector('.back-button');
        this.nextButton = document.querySelector('.next-button');
        this.currentStep = 1;
        this.maxSteps = this.steps.length;
        
        // Form data
        this.formData = {
            name: '',
            description: '',
            services: []
        };

        if (this.type === 'template') {
            this.formData.yamlFile = null;
            this.formData.previewImage = null;
        } else if (this.type === 'project') {
            this.formData.domain = '';
            this.formData.template = null;
        }

        this.init();
    }

    init() {
        this.backButton?.addEventListener('click', () => this.handleBack());
        this.nextButton?.addEventListener('click', () => this.handleNext());
        
        if (this.type === 'template') {
            this.initFileUploads();
            this.initServiceFunctionality();
        } else if (this.type === 'project') {
            this.initTemplateSelection();
        }
        
        this.updateSteps();
    }

    // Fælles form funktionalitet
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

    // Template-specifikke metoder
    initFileUploads() {
        // YAML Upload
        const yamlInput = document.querySelector('#yaml-file');
        const yamlUpload = document.querySelector('.yaml-upload');
        
        yamlInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.formData.yamlFile = file;
                yamlUpload.innerHTML = `
                    <div class="yaml-file-display">
                        <i class='bx bx-file'></i>
                        <span class="filename">${file.name}</span>
                        <button class="remove-file">
                            <i class='bx bx-x'></i>
                        </button>
                    </div>
                `;

                const removeBtn = yamlUpload.querySelector('.remove-file');
                removeBtn?.addEventListener('click', () => {
                    this.formData.yamlFile = null;
                    yamlUpload.innerHTML = `
                        <input type="file" id="yaml-file" hidden accept=".yaml,.yml">
                        <label for="yaml-file" class="upload-area">
                            <i class='bx bx-file'></i>
                            <span>Drop your YAML file here or click to browse</span>
                        </label>
                    `;
                    this.initFileUploads();
                });
            }
        });

        // Preview Image Upload
        const previewInput = document.querySelector('#preview-image');
        const previewUpload = document.querySelector('.preview-upload');
        
        previewInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.formData.previewImage = e.target.result;
                    previewUpload.innerHTML = `
                        <div class="preview-container">
                            <img src="${e.target.result}" alt="Preview">
                            <button class="remove-file">
                                <i class='bx bx-x'></i>
                            </button>
                        </div>
                    `;

                    const removeBtn = previewUpload.querySelector('.remove-file');
                    removeBtn?.addEventListener('click', () => {
                        this.formData.previewImage = null;
                        previewUpload.innerHTML = `
                            <input type="file" id="preview-image" hidden accept="image/*">
                            <label for="preview-image" class="upload-area">
                                <i class='bx bx-image-add'></i>
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

    initServiceFunctionality() {
        // Tilføj event listeners til eksisterende services
        const existingServices = document.querySelectorAll('.services-selection .service-tag');
        existingServices.forEach(service => {
            // Click event for at toggle active state
            service.addEventListener('click', (e) => {
                if (!e.target.classList.contains('remove-service') && 
                    !e.target.parentElement.classList.contains('remove-service')) {
                    service.classList.toggle('active');
                }
            });

            // Remove button event
            const removeBtn = service.querySelector('.remove-service');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    service.remove();
                });
            }
        });

        // Modal functionality
        const createServiceModal = document.getElementById('createServiceModal');
        const createBtn = document.querySelector('.create-service-link');
        const closeBtn = createServiceModal?.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancelCreateService');
        const saveBtn = document.getElementById('saveCreateService');
        const iconOptions = createServiceModal?.querySelectorAll('.icon-option');
        const nameInput = document.getElementById('service-name-input');

        createBtn?.addEventListener('click', () => {
            createServiceModal?.classList.add('show');
            // Reset form
            if (nameInput) nameInput.value = '';
            iconOptions?.forEach(opt => opt.classList.remove('selected'));
        });

        closeBtn?.addEventListener('click', () => createServiceModal?.classList.remove('show'));
        cancelBtn?.addEventListener('click', () => createServiceModal?.classList.remove('show'));
        
        // Icon selection
        iconOptions?.forEach(option => {
            option.addEventListener('click', () => {
                iconOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });

        // Save new service
        saveBtn?.addEventListener('click', () => {
            const selectedIcon = createServiceModal.querySelector('.icon-option.selected');
            const nameValue = nameInput?.value?.trim();
            
            let hasError = false;
            
            if (!nameValue) {
                console.log('Name missing');
                hasError = true;
            }
            
            if (!selectedIcon) {
                console.log('Icon missing');
                hasError = true;
            }
            
            if (hasError) {
                alert('Please fill in all required fields');
                return;
            }

            this.createNewService(nameValue, selectedIcon.dataset.icon);
            createServiceModal.classList.remove('show');
        });
    }

    createNewService(name, iconClass) {
        const servicesContainer = document.querySelector('.services-selection');
        const newService = document.createElement('button');
        newService.className = 'service-tag';
        newService.innerHTML = `
            <i class='bx ${iconClass}'></i>
            <span>${name}</span>
            <i class='bx bx-x remove-service'></i>
        `;

        newService.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-service') && 
                !e.target.parentElement.classList.contains('remove-service')) {
                newService.classList.toggle('active');
            }
        });

        const removeBtn = newService.querySelector('.remove-service');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                newService.remove();
            });
        }

        servicesContainer?.appendChild(newService);
    }

    // Project-specifikke metoder
    initTemplateSelection() {
        console.log('Initializing template selection');
        const templateCards = document.querySelectorAll('.project-template-grid .project-template-card');
        console.log('Found template cards:', templateCards.length);
        
        if (templateCards.length === 0) {
            console.warn('No template cards found on the page');
            return;
        }
        
        templateCards.forEach(card => {
            card.addEventListener('click', () => {
                console.log('Template card clicked');
                templateCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                try {
                    const services = Array.from(card.querySelectorAll('.service-tag')).map(tag => ({
                        icon: tag.querySelector('i').className,
                        name: tag.querySelector('span').textContent.trim()
                    }));
                    
                    this.formData.template = {
                        name: card.querySelector('h2')?.textContent || '',
                        description: card.querySelector('p')?.textContent || '',
                        services: services
                    };
                    console.log('Selected template with services:', this.formData.template);
                } catch (error) {
                    console.error('Error selecting template:', error);
                }
            });
        });
    }

    validateCurrentStep() {
        if (this.type === 'template') {
            return this.validateTemplateStep();
        } else {
            return this.validateProjectStep();
        }
    }

    validateTemplateStep() {
        if (this.currentStep === 1) {
            const nameInput = document.getElementById('template-name-input');
            const descriptionInput = document.getElementById('template-description-input');
            
            if (!nameInput?.value) {
                alert('Please enter a template name');
                return false;
            }
            
            this.formData.name = nameInput.value;
            this.formData.description = descriptionInput?.value || '';
            
            const activeServices = document.querySelectorAll('.services-selection .service-tag.active');
            this.formData.services = Array.from(activeServices).map(tag => ({
                icon: tag.querySelector('i:not(.remove-service)').className,
                name: tag.querySelector('span').textContent.trim()
            }));

            this.updateTemplateConfirmation();
            return true;
        }
        return true;
    }

    validateProjectStep() {
        console.log('Validating project step:', this.currentStep);
        console.log('Current form data:', this.formData);
        
        switch (this.currentStep) {
            case 1:
                const selectedTemplate = document.querySelector('.project-template-card.selected');
                console.log('Selected template element:', selectedTemplate);
                
                if (!selectedTemplate) {
                    alert('Please select a template');
                    return false;
                }
                return true;
                
            case 2:
                const nameInput = document.getElementById('project-name-input');
                const domainInput = document.getElementById('project-domain-input');
                const descriptionInput = document.getElementById('project-description-input');

                if (!nameInput?.value) {
                    alert('Please enter a project name');
                    return false;
                }

                if (!domainInput?.value) {
                    alert('Please enter a domain');
                    return false;
                }

                this.formData.name = nameInput.value;
                this.formData.domain = domainInput.value;
                this.formData.description = descriptionInput?.value || '';

                this.updateProjectConfirmation();
                return true;
                
            default:
                return true;
        }
    }

    updateTemplateConfirmation() {
        const nameConfirm = document.getElementById('template-name-confirm');
        const descriptionConfirm = document.getElementById('template-description-confirm');
        
        if (nameConfirm) nameConfirm.textContent = this.formData.name;
        if (descriptionConfirm) descriptionConfirm.textContent = this.formData.description || 'Not specified';

        const servicesContainer = document.querySelector('#template-step2 .detail-group .service-tags');
        if (servicesContainer) {
            if (this.formData.services && this.formData.services.length > 0) {
                servicesContainer.innerHTML = this.formData.services.map(service => `
                    <span class="service-tag">
                        <i class='${service.icon}'></i>
                        <span>${service.name}</span>
                    </span>
                `).join('');
            } else {
                servicesContainer.innerHTML = '<div class="detail-value">No services selected</div>';
            }
        }

        const yamlDisplay = document.querySelector('#template-step2 .yaml-file-display');
        if (yamlDisplay) {
            yamlDisplay.innerHTML = this.formData.yamlFile 
                ? `<i class='bx bx-file'></i><span class="filename">${this.formData.yamlFile.name}</span>`
                : `<i class='bx bx-file'></i><span class="filename">No file uploaded</span>`;
        }

        const previewContainer = document.querySelector('#template-step2 .preview-container');
        if (previewContainer) {
            previewContainer.innerHTML = this.formData.previewImage
                ? `<img src="${this.formData.previewImage}" alt="Preview">`
                : `<div class="no-preview">No preview image uploaded</div>`;
        }
    }

    updateProjectConfirmation() {
        const nameConfirm = document.getElementById('project-name-confirm');
        const domainConfirm = document.getElementById('project-domain-confirm');
        const descriptionConfirm = document.getElementById('project-description-confirm');

        if (nameConfirm) nameConfirm.textContent = this.formData.name;
        if (domainConfirm) domainConfirm.textContent = `${this.formData.domain}.kubelab.dk`;
        if (descriptionConfirm) descriptionConfirm.textContent = this.formData.description || 'Not specified';

        const templatePreview = document.querySelector('.selected-template-preview .template-info');
        if (templatePreview && this.formData.template) {
            console.log('Template services:', this.formData.template.services); // Debug log
            templatePreview.innerHTML = `
                <div>
                    <h3>${this.formData.template.name}</h3>
                    <p>${this.formData.template.description}</p>
                    <div class="services">
                        ${this.formData.template.services.map(service => `
                            <span class="service-tag">
                                <i class='${service.icon}'></i>
                                <span>${service.name}</span>
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    handleSubmission() {
        this.showLoadingOverlay();
        
        setTimeout(() => {
            this.hideLoadingOverlay();
            this.showSuccessOverlay();
            
            setTimeout(() => {
                window.location.href = `${this.type}s.html`;
            }, 2000);
        }, 1500);
    }

    showLoadingOverlay() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        loadingOverlay?.classList.add('show');
    }

    showSuccessOverlay() {
        const successOverlay = document.querySelector('.success-overlay');
        successOverlay?.classList.add('show');
    }

    hideLoadingOverlay() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        loadingOverlay?.classList.remove('show');
    }
}


