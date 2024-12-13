class UserForm {
    constructor() {
        this.formData = {
            name: '',
            email: '',
            teamId: null,
            role: '',
            expiration: ''
        };
        this.initForm();
    }

    async initForm() {
        // Load teams for dropdown
        await this.loadTeams();
        
        // Initialize custom selects
        this.initCustomSelects();
        
        // Initialize role select
        this.initRoleSelect();

        // Add submit handler
        const createButton = document.querySelector('.create-user-button');
        createButton?.addEventListener('click', () => this.handleSubmit());
    }

    async loadTeams() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/teams', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load teams');
            
            const teams = await response.json();
            populateTeamDropdown(teams);
        } catch (error) {
            console.error('Error:', error);
            showErrorMessage('Failed to load teams');
        }
    }

    initCustomSelects() {
        document.querySelectorAll('.custom-select').forEach(select => {
            const header = select.querySelector('.select-header');
            
            // Toggle dropdown on header click
            header?.addEventListener('click', () => {
                // Close all other dropdowns
                document.querySelectorAll('.custom-select').forEach(s => {
                    if (s !== select) s.classList.remove('open');
                });
                select.classList.toggle('open');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!select.contains(e.target)) {
                    select.classList.remove('open');
                }
            });
        });
    }

    initRoleSelect() {
        const roleSelect = document.querySelector('.custom-select[data-type="role"]');
        if (!roleSelect) return;

        const options = roleSelect.querySelectorAll('.option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                const selectedText = roleSelect.querySelector('.selected-option');
                if (selectedText) {
                    selectedText.textContent = option.textContent;
                    this.formData.role = option.dataset.value;
                    roleSelect.classList.remove('open');
                }
            });
        });
    }

    validateForm() {
        const nameInput = document.getElementById('user-name-input');
        const emailInput = document.getElementById('user-email-input');
        const expirationInput = document.getElementById('user-expiration-input');

        // Check if all elements exist
        if (!nameInput || !emailInput || !expirationInput) {
            console.error('Missing form elements:', {
                nameInput: !!nameInput,
                emailInput: !!emailInput,
                expirationInput: !!expirationInput
            });
            alert('Form initialization error. Please refresh the page.');
            return false;
        }

        if (!nameInput.value) {
            alert('Please enter a name');
            return false;
        }

        if (!emailInput.value) {
            alert('Please enter an email');
            return false;
        }

        if (!this.formData.teamId) {
            alert('Please select a team');
            return false;
        }

        if (!this.formData.role) {
            alert('Please select a role');
            return false;
        }

        if (!expirationInput.value) {
            alert('Please select an expiration date');
            return false;
        }

        // Opdater formData med de sidste værdier
        this.formData.name = nameInput.value;
        this.formData.email = emailInput.value;
        this.formData.expiration = expirationInput.value;

        return true;
    }

    async handleSubmit() {
        try {
            if (!this.validateForm()) {
                return;
            }

            document.querySelector('.loading-overlay').classList.add('show');

            const response = await fetch('http://localhost:3000/api/users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.formData)
            });

            if (response.status === 401) {
                window.location.href = '/pages/login.html';
                return;
            }

            if (response.status === 403) {
                showErrorMessage('Access denied. Admin rights required.');
                return;
            }

            document.querySelector('.loading-overlay').classList.remove('show');
            document.querySelector('.success-overlay').classList.add('show');

            setTimeout(() => {
                window.location.href = '/pages/users.html';
            }, 2000);

        } catch (error) {
            console.error('Error creating user:', error);
            document.querySelector('.loading-overlay').classList.remove('show');
            alert('Failed to create user. Please try again.');
        }
    }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UserForm();
}); 