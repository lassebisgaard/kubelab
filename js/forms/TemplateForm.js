console.log('TemplateForm.js loaded');
class TemplateForm extends BaseStepForm {
    constructor() {
        super();
        this.maxSteps = 2;
        this.templateData = {
            name: '',
            description: '',
            previewImage: null,
            yamlFile: null,
            services: []
        };
    }

    init() {
        super.init();
        this.initFileUploads();
        this.initServiceFunctionality();
    }

    initFileUploads() {
        // YAML Upload
        const yamlInput = document.querySelector('#yaml-file');
        const yamlUpload = document.querySelector('.yaml-upload');
        
        yamlInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.templateData.yamlFile = file;
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
                    this.templateData.yamlFile = null;
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
                    this.templateData.previewImage = e.target.result;
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
                        this.templateData.previewImage = null;
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
        console.log('Initializing service functionality');
        
        // Tilføj event listeners til eksisterende tags
        this.addServiceListeners();

        // Initialize create service button and modal
        const createServiceModal = document.getElementById('createServiceModal');
        const createBtn = document.querySelector('.create-service-link');
        const closeBtn = createServiceModal?.querySelector('.close-modal');
        const cancelBtn = createServiceModal?.querySelector('#cancelCreateService');
        const saveBtn = createServiceModal?.querySelector('#saveCreateService');
        const iconOptions = createServiceModal?.querySelectorAll('.icon-option');

        createBtn?.addEventListener('click', () => {
            createServiceModal?.classList.add('show');
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
            const nameInput = createServiceModal.querySelector('input[type="text"]');
            const selectedIcon = createServiceModal.querySelector('.icon-option.selected');
            
            if (!nameInput?.value.trim()) {
                alert('Please enter a service name');
                return;
            }
            
            if (!selectedIcon) {
                alert('Please select an icon');
                return;
            }

            this.createNewService(nameInput.value.trim(), selectedIcon.dataset.icon);
            createServiceModal.classList.remove('show');
            
            // Reset form
            nameInput.value = '';
            document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
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

        this.addServiceTagListeners(newService);
        servicesContainer?.appendChild(newService);
    }

    addServiceTagListeners(tag) {
        // Fjern eksisterende event listeners hvis de findes
        const newTag = tag.cloneNode(true);
        tag.parentNode?.replaceChild(newTag, tag);
        
        // Toggle active state
        newTag.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-service')) {
                newTag.classList.toggle('active');
            }
        });

        // Handle remove functionality
        const removeBtn = newTag.querySelector('.remove-service');
        removeBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            newTag.remove();
        });
    }

    addServiceListeners() {
        const serviceTags = document.querySelectorAll('.services-selection .service-tag');
        serviceTags.forEach(tag => this.addServiceTagListeners(tag));
    }

    validateCurrentStep() {
        if (this.currentStep === 1) {
            const nameInput = document.getElementById('template-name-input');
            const descriptionInput = document.getElementById('template-description-input');
            
            if (!nameInput?.value) {
                alert('Please enter a template name');
                return false;
            }
            
            this.templateData.name = nameInput.value;
            this.templateData.description = descriptionInput?.value || '';
            
            // Gem aktive services
            this.templateData.services = Array.from(document.querySelectorAll('.services-selection .service-tag.active'))
                .map(tag => ({
                    icon: tag.querySelector('i').className,
                    name: tag.querySelector('span').textContent
                }));

            // Opdater step 2 med de indtastede værdier
            this.updateConfirmationStep();
                
            return true;
        }
        return true;
    }

    updateConfirmationStep() {
        // Opdater template navn og beskrivelse
        const nameConfirm = document.getElementById('template-name-confirm');
        const descriptionConfirm = document.getElementById('template-description-confirm');
        
        if (nameConfirm) nameConfirm.textContent = this.templateData.name;
        if (descriptionConfirm) descriptionConfirm.textContent = this.templateData.description || 'Not specified';

        // Opdater services
        const servicesContainer = document.querySelector('#template-step2 .service-tags');
        if (servicesContainer) {
            if (this.templateData.services.length > 0) {
                servicesContainer.innerHTML = this.templateData.services.map(service => `
                    <span class="service-tag">
                        <i class='${service.icon}'></i>
                        <span>${service.name}</span>
                    </span>
                `).join('');
            } else {
                servicesContainer.innerHTML = '<div class="detail-value">No services selected</div>';
            }
        }

        // Opdater YAML fil visning
        const yamlDisplay = document.querySelector('#template-step2 .yaml-file-display');
        if (yamlDisplay) {
            if (this.templateData.yamlFile) {
                yamlDisplay.innerHTML = `
                    <i class='bx bx-file'></i>
                    <span class="filename">${this.templateData.yamlFile.name}</span>
                `;
            } else {
                yamlDisplay.innerHTML = `
                    <i class='bx bx-file'></i>
                    <span class="filename">No file uploaded</span>
                `;
            }
        }

        // Opdater preview image
        const previewContainer = document.querySelector('#template-step2 .preview-container');
        if (previewContainer) {
            if (this.templateData.previewImage) {
                previewContainer.innerHTML = `<img src="${this.templateData.previewImage}" alt="Preview">`;
            } else {
                previewContainer.innerHTML = `<div class="no-preview">No preview image uploaded</div>`;
            }
        }
    }

    updateNextButton() {
        if (this.currentStep === this.maxSteps) {
            this.nextButton.innerHTML = 'Create template <i class="bx bx-check"></i>';
            this.nextButton.classList.add('create-template-button');
        } else {
            this.nextButton.innerHTML = 'Next <i class="bx bxs-right-arrow-alt"></i>';
            this.nextButton.classList.remove('create-template-button');
        }
    }

    handleSubmission() {
        this.showLoadingOverlay();
        
        setTimeout(() => {
            this.hideLoadingOverlay();
            this.showSuccessOverlay();
            
            setTimeout(() => {
                window.location.href = 'templates.html';
            }, 2000);
        }, 1500);
    }
} 