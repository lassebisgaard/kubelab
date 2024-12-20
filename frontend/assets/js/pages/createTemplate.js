class TemplateForm extends BaseStepForm {
    constructor() {
        super('template');
        this.initServiceModal();
    }

    initServiceModal() {
        const createServiceBtn = document.querySelector('.create-service-link');
        const modal = document.getElementById('createServiceModal');
        
        createServiceBtn?.addEventListener('click', () => {
            modal.classList.add('show');
        });

        modal.querySelector('.close-modal')?.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        modal.querySelector('#saveCreateService')?.addEventListener('click', () => {
            
            modal.classList.remove('show');
        });

        modal.querySelector('#cancelCreateService')?.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        // Tilføj icon selection
        const iconOptions = modal.querySelectorAll('.icon-option');
        iconOptions.forEach(option => {
            option.addEventListener('click', () => {
                iconOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    }
} 