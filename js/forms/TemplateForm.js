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
        const modal = document.getElementById('createServiceModal');
        const createBtn = document.querySelector('.create-service-link');
        const closeBtn = modal?.querySelector('.close-modal');
        const cancelBtn = modal?.querySelector('#cancelCreateService');
        const saveBtn = modal?.querySelector('#saveCreateService');
        const iconOptions = modal?.querySelectorAll('.icon-option');

        console.log('Found create service button:', createBtn);
        createBtn?.addEventListener('click', () => {
            console.log('Create service button clicked');
            modal?.classList.add('show');
        });

        closeBtn?.addEventListener('click', () => modal?.classList.remove('show'));
        cancelBtn?.addEventListener('click', () => modal?.classList.remove('show'));
        saveBtn?.addEventListener('click', () => this.createNewService());

        iconOptions?.forEach(option => {
            option.addEventListener('click', () => {
                iconOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    }

    // Ny metode til at tilføje event listeners til services
    addServiceListeners() {
        const serviceTags = document.querySelectorAll('.services-selection .service-tag');
        console.log('Found service tags:', serviceTags.length);
        
        serviceTags.forEach(tag => {
            // Toggle active state
            tag.addEventListener('click', (e) => {
                console.log('Tag clicked');
                if (!e.target.classList.contains('remove-service')) {
                    tag.classList.toggle('active');
                }
            });

            // Handle remove functionality
            const removeBtn = tag.querySelector('.remove-service');
            if (removeBtn) {  // Tjek om remove-knappen findes
                removeBtn.addEventListener('click', (e) => {
                    console.log('Remove button clicked');
                    e.stopPropagation();
                    tag.remove();
                });
            }
        });
    }

    validateCurrentStep() {
        if (this.currentStep === 1) {
            const nameInput = document.querySelector('input[placeholder="My awesome template"]');
            const yamlFile = this.templateData.yamlFile;
            
            if (!nameInput?.value) {
                alert('Please enter a template name');
                return false;
            }
            
            this.templateData.name = nameInput.value;
            this.templateData.description = document.querySelector('textarea')?.value || '';
            
            // Gem aktive services
            this.templateData.services = Array.from(document.querySelectorAll('.services-selection .service-tag.active'))
                .map(tag => ({
                    icon: tag.querySelector('i').className,
                    name: tag.querySelector('span').textContent
                }));
                
            return true;
        }
        return true;
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

    createNewService() {
        const modal = document.getElementById('createServiceModal');
        const nameInput = modal?.querySelector('input[type="text"]');
        const selectedIcon = modal?.querySelector('.icon-option.selected');
        
        if (!nameInput?.value || !selectedIcon) {
            alert('Please fill in all fields');
            return;
        }

        const iconClass = selectedIcon.dataset.icon;
        const newService = document.createElement('button');
        newService.className = 'service-tag';
        newService.innerHTML = `
            <i class='bx ${iconClass}'></i>
            <span>${nameInput.value}</span>
            <i class='bx bx-x remove-service'></i>
        `;

        // Tilføj event listeners til den nye service
        newService.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-service')) {
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

        document.querySelector('.services-selection')?.appendChild(newService);
        
        // Reset modal
        nameInput.value = '';
        selectedIcon.classList.remove('selected');
        modal.classList.remove('show');
    }
} 