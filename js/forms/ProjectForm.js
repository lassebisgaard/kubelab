class ProjectForm extends BaseStepForm {
    constructor() {
        super();
        this.maxSteps = 3;
        this.templateData = {
            selectedTemplate: null,
            projectName: '',
            projectDomain: '',
            description: ''
        };
    }

    validateCurrentStep() {
        switch(this.currentStep) {
            case 1:
                const selectedCard = document.querySelector('.project-template-card.selected');
                if (!selectedCard) {
                    alert('Please select a template');
                    return false;
                }
                this.templateData.selectedTemplate = {
                    name: selectedCard.querySelector('h2').textContent,
                    description: selectedCard.querySelector('p').textContent,
                    services: Array.from(selectedCard.querySelectorAll('.service-tag'))
                        .map(tag => ({
                            icon: tag.querySelector('i').className,
                            name: tag.querySelector('span').textContent.trim()
                        }))
                };
                return true;
            case 2:
                const nameInput = document.querySelector('#step2 .form-card input[placeholder="My awesome project"]');
                const domainInput = document.querySelector('#step2 .domain-input input');
                const description = document.querySelector('#step2 textarea');
                
                if (!nameInput?.value || !domainInput?.value) {
                    alert('Please fill in all required fields');
                    return false;
                }
                
                this.templateData.projectName = nameInput.value;
                this.templateData.projectDomain = domainInput.value;
                this.templateData.description = description?.value || '';
                return true;
            default:
                return true;
        }
    }

    updateSteps() {
        super.updateSteps();
        
        if (this.currentStep === 3) {
            this.updateConfirmationStep();
        }
    }

    updateConfirmationStep() {
        const projectSummary = document.querySelector('#step3 .project-summary');
        if (projectSummary) {
            const detailGroups = projectSummary.querySelectorAll('.detail-group');
            detailGroups[0].querySelector('.detail-value').textContent = this.templateData.projectName;
            detailGroups[1].querySelector('.detail-value').textContent = `${this.templateData.projectDomain}.kubelab.dk`;
            detailGroups[2].querySelector('.detail-value').textContent = this.templateData.description;
        }

        const selectedTemplate = document.querySelector('#step3 .selected-template-preview');
        if (selectedTemplate) {
            selectedTemplate.querySelector('h3').textContent = this.templateData.selectedTemplate.name;
            selectedTemplate.querySelector('p').textContent = this.templateData.selectedTemplate.description;
            
            const servicesContainer = selectedTemplate.querySelector('.services');
            servicesContainer.innerHTML = this.templateData.selectedTemplate.services
                .map(service => `
                    <span class="service-tag">
                        <i class="${service.icon}"></i>
                        ${service.name}
                    </span>
                `).join('');
        }
    }

    updateNextButton() {
        if (this.currentStep === this.maxSteps) {
            this.nextButton.innerHTML = 'Create project <i class="bx bx-check"></i>';
            this.nextButton.classList.add('create-project-button');
        } else {
            this.nextButton.innerHTML = 'Next <i class="bx bxs-right-arrow-alt"></i>';
            this.nextButton.classList.remove('create-project-button');
        }
    }

    handleSubmission() {
        // Find overlays
        const loadingOverlay = document.querySelector('.loading-overlay');
        const successOverlay = document.querySelector('.success-overlay');
        
        // Vis loading overlay
        loadingOverlay.classList.add('show');
        
        // Simuler API kald
        setTimeout(() => {
            // Skjul loading og vis success
            loadingOverlay.classList.remove('show');
            successOverlay.classList.add('show');
            
            // Redirect efter success animation
            setTimeout(() => {
                window.location.href = 'projects.html';
            }, 2000);
        }, 1500);
    }

    init() {
        super.init();
        this.initTemplateSelection();
    }

    initTemplateSelection() {
        const templateCards = document.querySelectorAll('.project-template-card');
        const selectedPreview = document.querySelector('.selected-template-preview');
        
        templateCards.forEach(card => {
            card.addEventListener('click', () => {
                templateCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                if (selectedPreview) {
                    selectedPreview.querySelector('h3').textContent = card.querySelector('h2').textContent;
                    selectedPreview.querySelector('p').textContent = card.querySelector('p').textContent;
                    selectedPreview.querySelector('.services').innerHTML = card.querySelector('.services').innerHTML;
                    selectedPreview.classList.add('show');
                }
            });
        });
    }
} 