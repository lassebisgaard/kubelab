class ProjectForm extends BaseStepForm {
    constructor() {
        super();
        this.selectedTemplate = null;
        this.projectData = {
            name: '',
            domain: '',
            description: '',
            template: null
        };
        this.initTemplateSelection();
    }

    initTemplateSelection() {
        const templateCards = document.querySelectorAll('.project-template-card');
        templateCards.forEach(card => {
            card.addEventListener('click', () => {
                templateCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedTemplate = card;
                this.projectData.template = {
                    name: card.querySelector('h2').textContent,
                    description: card.querySelector('p').textContent,
                    services: Array.from(card.querySelectorAll('.service-tag')).map(tag => ({
                        icon: tag.querySelector('i').className,
                        name: tag.querySelector('span').textContent
                    }))
                };
            });
        });
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.validateTemplateSelection();
            case 2:
                return this.validateProjectInfo();
            case 3:
                return true;
            default:
                return true;
        }
    }

    validateTemplateSelection() {
        if (!this.selectedTemplate) {
            alert('Please select a template');
            return false;
        }
        return true;
    }

    validateProjectInfo() {
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

        this.projectData.name = nameInput.value;
        this.projectData.domain = domainInput.value;
        this.projectData.description = descriptionInput?.value || '';

        this.updateConfirmationStep();
        return true;
    }

    updateConfirmationStep() {
        // Update project details
        const nameConfirm = document.getElementById('project-name-confirm');
        const domainConfirm = document.getElementById('project-domain-confirm');
        const descriptionConfirm = document.getElementById('project-description-confirm');

        if (nameConfirm) nameConfirm.textContent = this.projectData.name;
        if (domainConfirm) domainConfirm.textContent = `${this.projectData.domain}.kubelab.dk`;
        if (descriptionConfirm) descriptionConfirm.textContent = this.projectData.description || 'Not specified';

        // Update selected template preview
        const templatePreview = document.querySelector('.selected-template-preview .template-info');
        if (templatePreview && this.projectData.template) {
            templatePreview.innerHTML = `
                <div>
                    <h3>${this.projectData.template.name}</h3>
                    <p>${this.projectData.template.description}</p>
                    <div class="services">
                        ${this.projectData.template.services.map(service => `
                            <span class="service-tag">
                                <i class='${service.icon}'></i>
                                ${service.name}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
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
        this.showLoadingOverlay();
        
        setTimeout(() => {
            this.hideLoadingOverlay();
            this.showSuccessOverlay();
            
            setTimeout(() => {
                window.location.href = 'projects.html';
            }, 2000);
        }, 1500);
    }
}

// Initialize the form when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.project-step')) {
        new ProjectForm();
    }
}); 