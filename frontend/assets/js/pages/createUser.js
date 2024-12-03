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

        // Add submit handler
        const createButton = document.querySelector('.create-user-button');
        createButton?.addEventListener('click', () => this.handleSubmit());
    }

    async loadTeams() {
        try {
            const response = await fetch('http://localhost:3000/api/teams');
            const teams = await response.json();
            
            const teamSelect = document.querySelector('.custom-select[data-type="team"]');
            if (!teamSelect) {
                console.error('Team select element not found');
                return;
            }

            const options = teamSelect.querySelector('.select-options');
            if (!options) {
                console.error('Options container not found in team select');
                return;
            }
            
            options.innerHTML = teams.map(team => `
                <div class="option" data-value="${team.TeamId}">${team.TeamName}</div>
            `).join('');

            // Add click handlers for options
            options.querySelectorAll('.option').forEach(option => {
                option.addEventListener('click', () => {
                    const selectedText = teamSelect.querySelector('.selected-option');
                    if (selectedText) {
                        selectedText.textContent = option.textContent;
                        teamSelect.dataset.value = option.dataset.value;
                        teamSelect.classList.remove('open');
                    }
                });
            });

        } catch (error) {
            console.error('Error loading teams:', error);
        }
    }

    initCustomSelects() {
        document.querySelectorAll('.custom-select').forEach(select => {
            const header = select.querySelector('.select-header');
            const options = select.querySelector('.select-options');
            const selectedText = header?.querySelector('.selected-option');

            if (!header || !options || !selectedText) {
                console.error('Missing required elements in custom select');
                return;
            }

            // Toggle dropdown
            header.addEventListener('click', () => {
                // Close all other dropdowns
                document.querySelectorAll('.custom-select').forEach(s => {
                    if (s !== select) s.classList.remove('open');
                });
                select.classList.toggle('open');
            });

            // Handle option selection
            options.querySelectorAll('.option').forEach(option => {
                option.addEventListener('click', () => {
                    selectedText.textContent = option.textContent;
                    select.dataset.value = option.dataset.value;
                    select.classList.remove('open');
                });
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-select')) {
                document.querySelectorAll('.custom-select').forEach(select => 
                    select.classList.remove('open')
                );
            }
        });
    }

    validateForm() {
        const nameInput = document.getElementById('user-name-input');
        const emailInput = document.getElementById('user-email-input');
        const teamSelect = document.querySelector('.custom-select[data-type="team"]');
        const roleSelect = document.querySelector('.custom-select[data-type="role"]');
        const expirationInput = document.getElementById('user-expiration-input');

        // Check if all elements exist
        if (!nameInput || !emailInput || !teamSelect || !roleSelect || !expirationInput) {
            console.error('Missing form elements:', {
                nameInput: !!nameInput,
                emailInput: !!emailInput,
                teamSelect: !!teamSelect,
                roleSelect: !!roleSelect,
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

        if (!teamSelect.dataset.value) {
            alert('Please select a team');
            return false;
        }

        if (!roleSelect.dataset.value) {
            alert('Please select a role');
            return false;
        }

        if (!expirationInput.value) {
            alert('Please select an expiration date');
            return false;
        }

        this.formData = {
            name: nameInput.value,
            email: emailInput.value,
            teamId: teamSelect.dataset.value,
            role: roleSelect.dataset.value,
            expiration: expirationInput.value
        };

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
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.formData)
            });

            if (!response.ok) {
                throw new Error('Failed to create user');
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