console.log('BaseStepForm.js loaded');

/**
 * BaseStepForm - Håndterer formular flow for både templates og projects
 * Styrer step navigation, validering og form submission
 */
class BaseStepForm {
    /**
     * Initialiserer en ny formular
     * @param {string} type - Enten 'template' eller 'project'
     */
    constructor(type) {
        // === DOM Elements ===
        this.type = type;
        this.steps = document.querySelectorAll('.step');
        this.stepContents = document.querySelectorAll('.step-content');
        this.stepDividers = document.querySelectorAll('.step-divider');
        this.backButton = document.querySelector('.back-button');
        this.nextButton = document.querySelector('.next-button');
        this.currentStep = 1;
        this.maxSteps = this.steps.length;
        
        // === Form Data Storage ===
        this.formData = {
            name: '',
            description: '',
            services: []
        };

        // Type-specifik data initialisering
        if (this.type === 'template') {
            this.formData.yamlFile = null;
            this.formData.previewImage = null;
        } else if (this.type === 'project') {
            this.formData.domain = '';
            this.formData.template = null;
        }

        this.init();
    }

    // === Core Initialization & Navigation ===
    
    /**
     * Initialiserer form funktionalitet baseret på type
     */
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

    /**
     * Håndterer navigation til forrige step
     */
    handleBack() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateSteps();
        }
    }

    /**
     * Håndterer navigation til næste step eller submission
     */
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

    // === UI Update Methods ===
    
    /**
     * Opdaterer UI elementer baseret på nuværende step
     */
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

    /**
     * Opdaterer next button tekst og styling
     */
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

    // === Template-Specific Methods ===
    
    /**
     * Initialiserer file upload funktionalitet for templates
     */
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

    /**
     * Håndterer service tilføjelse og redigering
     */
    initServiceFunctionality() {
        const servicesSelection = document.querySelector('.services-selection');
        if (!servicesSelection) return;

        // Render initial services
        servicesSelection.innerHTML = window.renderServiceTags(Object.keys(window.SERVICES), true);

        // Håndter service clicks (active state)
        servicesSelection.addEventListener('click', (e) => {
            const serviceTag = e.target.closest('.service-tag');
            if (serviceTag && !e.target.classList.contains('remove-service')) {
                serviceTag.classList.toggle('active');
                this.updateSelectedServices();
            }
        });

        // Håndter service removal
        servicesSelection.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-service');
            if (removeBtn) {
                const serviceTag = removeBtn.closest('.service-tag');
                if (serviceTag) {
                    // Vis confirmation dialog
                    this.showDeleteServiceConfirmation(serviceTag);
                }
            }
        });

        // Initialize create service modal
        this.initCreateServiceModal();
    }

    updateSelectedServices() {
        const activeServices = document.querySelectorAll('.services-selection .service-tag.active');
        this.formData.services = Array.from(activeServices).map(tag => ({
            id: tag.dataset.service,
            name: tag.querySelector('span').textContent,
            icon: tag.querySelector('i').className.split(' ')[1]
        }));
    }

    // === Project-Specific Methods ===
    
    /**
     * Initialiserer template selection funktionalitet
     */
    initTemplateSelection() {
        const templateCards = document.querySelectorAll('.project-template-card');
        if (!templateCards.length) return;
        
        templateCards.forEach(card => {
            card.addEventListener('click', () => {
                templateCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                this.formData.template = {
                    name: card.querySelector('h2')?.textContent || '',
                    description: card.querySelector('p')?.textContent || '',
                    services: Array.from(card.querySelectorAll('.service-tag')).map(tag => ({
                        id: tag.dataset.service,
                        name: tag.querySelector('span').textContent,
                        icon: tag.querySelector('i').className.split(' ')[1]
                    }))
                };
                
                // Opdater preview i confirmation step
                this.updateProjectConfirmation();
            });
        });
    }

    // === Validation Methods ===
    
    /**
     * Validerer det nuværende step baseret på form type
     */
    validateCurrentStep() {
        if (this.type === 'template') {
            return this.validateTemplateStep();
        } else {
            return this.validateProjectStep();
        }
    }

    /**
     * Validerer template-specifikke felter
     */
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
            
            // Opdater services data
            this.updateSelectedServices();

            // Opdater confirmation step
            this.updateTemplateConfirmation();
            return true;
        }
        return true;
    }

    /**
     * Validerer project-specifikke felter
     */
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

    // === Confirmation Step Methods ===
    
    /**
     * Opdaterer confirmation step for templates
     */
    updateTemplateConfirmation() {
        const nameConfirm = document.getElementById('template-name-confirm');
        const descriptionConfirm = document.getElementById('template-description-confirm');
        const servicesContainer = document.querySelector('#template-step2 .service-tags');
        
        if (nameConfirm) nameConfirm.textContent = this.formData.name;
        if (descriptionConfirm) descriptionConfirm.textContent = this.formData.description;
        
        if (servicesContainer) {
            servicesContainer.innerHTML = this.formData.services.length > 0
                ? this.formData.services.map(service => `
                    <span class="service-tag">
                        <i class='bx ${service.icon}'></i>
                        <span>${service.name}</span>
                    </span>
                `).join('')
                : '<div class="detail-value">No services selected</div>';
        }
    }

    /**
     * Opdaterer confirmation step for projects
     */
    updateProjectConfirmation() {
        const nameConfirm = document.getElementById('project-name-confirm');
        const domainConfirm = document.getElementById('project-domain-confirm');
        const descriptionConfirm = document.getElementById('project-description-confirm');

        if (nameConfirm) nameConfirm.textContent = this.formData.name;
        if (domainConfirm) domainConfirm.textContent = `${this.formData.domain}.kubelab.dk`;
        if (descriptionConfirm) descriptionConfirm.textContent = this.formData.description || 'Not specified';

        // Opdater template preview med services
        const templatePreview = document.querySelector('.selected-template-preview .template-info');
        if (templatePreview && this.formData.template) {
            templatePreview.innerHTML = `
                <div>
                    <h3>${this.formData.template.name}</h3>
                    <p>${this.formData.template.description}</p>
                    <div class="services">
                        ${window.renderServiceTags(
                            this.formData.template.services.map(service => service.id),
                            false
                        )}
                    </div>
                </div>
            `;
        }
    }

    // === Overlay Handling ===
    
    /**
     * Håndterer form submission og success/error states
     */
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

    /**
     * Viser loading overlay under submission
     */
    showLoadingOverlay() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        loadingOverlay?.classList.add('show');
    }

    /**
     * Viser success overlay efter vellykket submission
     */
    showSuccessOverlay() {
        const successOverlay = document.querySelector('.success-overlay');
        successOverlay?.classList.add('show');
    }

    /**
     * Skjuler loading overlay
     */
    hideLoadingOverlay() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        loadingOverlay?.classList.remove('show');
    }

    // === Create Service Modal Methods ===
    
    /**
     * Initialiserer create service modal funktionalitet
     */
    initCreateServiceModal() {
        const createServiceModal = document.getElementById('createServiceModal');
        if (!createServiceModal) return;

        const createBtn = document.querySelector('.create-service-link');
        const closeBtn = createServiceModal.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancelCreateService');
        const saveBtn = document.getElementById('saveCreateService');
        const iconOptions = createServiceModal.querySelectorAll('.icon-option');
        const nameInput = document.getElementById('service-name-input');

        // Show modal
        createBtn?.addEventListener('click', () => {
            createServiceModal.classList.add('show');
            nameInput.value = '';
            iconOptions.forEach(opt => opt.classList.remove('selected'));
        });

        // Hide modal
        [closeBtn, cancelBtn].forEach(btn => {
            btn?.addEventListener('click', () => {
                createServiceModal.classList.remove('show');
            });
        });

        // Icon selection
        iconOptions.forEach(option => {
            option.addEventListener('click', () => {
                iconOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });

        // Save new service
        saveBtn?.addEventListener('click', () => {
            const selectedIcon = createServiceModal.querySelector('.icon-option.selected');
            const nameValue = nameInput?.value?.trim();
            
            if (!nameValue || !selectedIcon) {
                alert('Please fill in all required fields');
                return;
            }

            // Opret nyt service objekt
            const newServiceId = nameValue.toLowerCase().replace(/\s+/g, '-');
            const newService = {
                id: newServiceId,
                name: nameValue,
                icon: selectedIcon.dataset.icon,
                description: `Custom service: ${nameValue}`
            };

            // Tilføj til globalt SERVICES objekt
            window.SERVICES[newServiceId] = newService;

            // Tilføj til UI
            const servicesSelection = document.querySelector('.services-selection');
            if (servicesSelection) {
                servicesSelection.insertAdjacentHTML('beforeend', 
                    window.renderServiceTags([newServiceId], true)
                );
            }

            // Reset og luk modal
            nameInput.value = '';
            selectedIcon.classList.remove('selected');
            createServiceModal.classList.remove('show');
        });
    }

    // === Delete Service Confirmation Methods ===
    
    /**
     * Viser confirmation dialog for service removal
     */
    showDeleteServiceConfirmation(serviceTag) {
        const dialog = document.createElement('div');
        dialog.className = 'modal delete-service-dialog show';
        dialog.innerHTML = `
            <div class="modal-content small">
                <div class="modal-header">
                    <h3>Delete Service</h3>
                    <button class="close-modal">
                        <i class='bx bx-x'></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="service-preview">
                        ${serviceTag.outerHTML}
                    </div>
                    <p>Are you sure you want to delete this service?</p>
                    <p class="warning-text">
                        <i class='bx bx-error'></i>
                        This will remove the service from all projects and templates that use it.
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="button secondary" id="cancelDelete">Cancel</button>
                    <button class="button delete" id="confirmDelete">Delete</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const closeDialog = () => {
            dialog.classList.remove('show');
            setTimeout(() => dialog.remove(), 300);
        };

        dialog.querySelector('.close-modal')?.addEventListener('click', closeDialog);
        dialog.querySelector('#cancelDelete')?.addEventListener('click', closeDialog);
        dialog.querySelector('#confirmDelete')?.addEventListener('click', () => {
            serviceTag.remove();
            this.updateSelectedServices();
            closeDialog();
        });
    }
}


