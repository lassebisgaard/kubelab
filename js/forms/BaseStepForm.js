document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    const templateConfigGrid = document.querySelector('.template-config-grid');
    const configGrid = document.querySelector('.config-grid');
    console.log('Found template-config-grid:', templateConfigGrid);
    console.log('Found config-grid:', configGrid);
    
    if (templateConfigGrid || configGrid) {
        console.log('Initializing TemplateForm');
        const form = new TemplateForm();
        window.templateForm = form; // Gem i window for debugging
        console.log('TemplateForm initialized:', form);
    }
});


console.log('BaseStepForm.js loaded');
class BaseStepForm {
    constructor() {
        this.steps = document.querySelectorAll('.step');
        this.stepContents = document.querySelectorAll('.step-content');
        this.stepDividers = document.querySelectorAll('.step-divider');
        this.backButton = document.querySelector('.back-button');
        this.nextButton = document.querySelector('.next-button');
        this.currentStep = 1;
        this.maxSteps = this.steps.length;
        this.init();
    }

    init() {
        this.backButton?.addEventListener('click', () => this.handleBack());
        this.nextButton?.addEventListener('click', () => this.handleNext());
        this.updateSteps();
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

    validateCurrentStep() {
        return true;
    }

    handleSubmission() {
        throw new Error('handleSubmission must be implemented by child class');
    }

    updateNextButton() {
        throw new Error('updateNextButton must be implemented by child class');
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


