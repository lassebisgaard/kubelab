class TeamForm extends BaseStepForm {
    constructor() {
        super('team');
        this.formData = {
            name: '',
            expiration: '',
            description: '',
            members: []
        };
        this.initMemberModal();
        this.initFormListeners();
    }

    initFormListeners() {
        const nameInput = document.getElementById('team-name-input');
        const expirationInput = document.getElementById('team-expiration-input');
        const descriptionInput = document.getElementById('team-description-input');

        const checkInputs = () => {
            if (this.nextButton) {
                const nameValue = nameInput?.value || '';
                const expirationValue = expirationInput?.value || '';
                this.nextButton.disabled = !nameValue || !expirationValue;
            }
        };

        // Lyt efter ændringer i input felter
        nameInput?.addEventListener('input', checkInputs);
        expirationInput?.addEventListener('change', checkInputs);
        descriptionInput?.addEventListener('input', () => {
            this.formData.description = descriptionInput.value;
        });
        
        // Kør initial check
        checkInputs();
    }

    initMemberModal() {
        const addMemberBtn = document.querySelector('.create-service-link');
        const modal = document.getElementById('addMemberModal');
        
        addMemberBtn?.addEventListener('click', () => {
            modal.classList.add('show');
            this.loadUsers();
        });

        modal.querySelector('.close-modal')?.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        modal.querySelector('#saveAddMember')?.addEventListener('click', () => {
            this.updateSelectedMembers();
            modal.classList.remove('show');
        });

        modal.querySelector('#cancelAddMember')?.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        // Tilføj søgefunktionalitet
        const searchInput = modal.querySelector('input[type="text"]');
        searchInput?.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const options = modal.querySelectorAll('.user-option');
            
            options.forEach(option => {
                const name = option.querySelector('.user-name').textContent.toLowerCase();
                const email = option.querySelector('.user-email').textContent.toLowerCase();
                const matches = name.includes(searchTerm) || email.includes(searchTerm);
                option.style.display = matches ? '' : 'none';
            });
        });
    }

    async loadUsers() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to load users');
            
            const users = await response.json();
            const userList = document.querySelector('.user-list');
            
            if (userList) {
                userList.innerHTML = users.map(user => `
                    <div class="user-option" data-id="${user.UserId}">
                        <label class="checkbox-wrapper">
                            <input type="checkbox" ${this.formData.members.some(m => m.userId === user.UserId.toString()) ? 'checked' : ''}>
                            <span class="checkmark"></span>
                        </label>
                        <div class="user-info">
                            <span class="user-name">${user.Name}</span>
                            <span class="user-email">${user.Mail}</span>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showErrorMessage('Failed to load users');
        }
    }

    populateUsersList(users) {
        const userList = document.querySelector('.user-list');
        if (!userList) return;

        userList.innerHTML = users.map(user => `
            <div class="user-option" data-id="${user.UserId}">
                <label class="checkbox-wrapper">
                    <input type="checkbox" ${this.formData.members.some(m => m.userId === user.UserId.toString()) ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <div class="user-info">
                    <span class="user-name">${user.Name}</span>
                    <span class="user-email">${user.Email}</span>
                </div>
            </div>
        `).join('');
    }

    updateSelectedMembers() {
        const selectedUsers = document.querySelectorAll('.user-option input:checked');
        this.formData.members = Array.from(selectedUsers).map(checkbox => {
            const userEl = checkbox.closest('.user-option');
            return {
                userId: userEl.dataset.id,
                name: userEl.querySelector('.user-name').textContent,
                email: userEl.querySelector('.user-email').textContent
            };
        });

        // Opdater visningen i step 2
        const container = document.querySelector('.services-selection');
        if (container) {
            container.innerHTML = this.formData.members.map(member => `
                <div class="service-tag service-tag--removable" data-id="${member.userId}">
                    <i class='bx bx-user'></i>
                    <span>${member.name}</span>
                    <button class="service-tag--remove">
                        <i class='bx bx-x'></i>
                    </button>
                </div>
            `).join('');

            // Tilføj event listeners til remove knapper
            container.querySelectorAll('.service-tag--remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tag = e.target.closest('.service-tag--removable');
                    const userId = tag.dataset.id;
                    this.removeMember(userId);
                });
            });
        }

        this.updateMemberDisplay();
    }

    updateMemberDisplay() {
        const container = document.querySelector('.services-selection');
        if (!container) return;
        
        container.innerHTML = this.formData.members.map(member => `
            <div class="service-tag service-tag--removable" data-id="${member.userId}">
                <i class='bx bx-user'></i>
                <span>${member.name}</span>
                <button class="service-tag--remove">
                    <i class='bx bx-x'></i>
                </button>
            </div>
        `).join('');

        // Tilføj event listeners til remove knapper
        container.querySelectorAll('.service-tag--remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tag = e.target.closest('.service-tag--removable');
                const userId = tag.dataset.id;
                this.removeMember(userId);
            });
        });

        // Opdater confirmation step
        const membersConfirm = document.getElementById('team-members-confirm');
        if (membersConfirm) {
            membersConfirm.innerHTML = this.formData.members.length > 0 
                ? this.formData.members.map(m => m.name).join(', ')
                : 'No members added';
        }
    }

    removeMember(userId) {
        this.formData.members = this.formData.members.filter(m => m.userId !== userId);
        this.updateMemberDisplay();
        
        // Fjern checkmark i modal hvis den er åben
        const checkbox = document.querySelector(`.user-option[data-id="${userId}"] input[type="checkbox"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
    }

    validateCurrentStep() {
        console.log('Validating team step:', this.currentStep);
        
        if (this.currentStep === 1) {
            const nameInput = document.getElementById('team-name-input');
            const expirationInput = document.getElementById('team-expiration-input');
            const descriptionInput = document.getElementById('team-description-input');

            if (!nameInput.value || !expirationInput.value) {
                this.showErrorMessage('Please fill in all required fields');
                return false;
            }

            const [day, month, year] = expirationInput.value.split('.');
            const formattedDate = `${year}-${month}-${day}`;

            this.formData.name = nameInput.value;
            this.formData.expiration = formattedDate;
            this.formData.description = descriptionInput.value;

            // Opdater confirmation step
            document.getElementById('team-name-confirm').textContent = this.formData.name;
            document.getElementById('team-expiration-confirm').textContent = expirationInput.value;
            document.getElementById('team-description-confirm').textContent = 
                this.formData.description || 'Not specified';

            return true;
        }
        else if (this.currentStep === 2) {
            // Opdater members display i confirmation step
            this.updateMemberDisplay();
            return true;
        }
        else if (this.currentStep === 3) {
            // På confirmation step skal vi bare returnere true for at tillade submission
            return true;
        }

        return false;
    }

    handleNext() {
        if (this.validateCurrentStep()) {
            if (this.currentStep === this.maxSteps) {
                this.handleSubmission();
            } else {
                this.currentStep++;
                this.updateSteps();
            }
        }
    }

    async handleSubmission() {
        try {
            document.querySelector('.loading-overlay').classList.add('show');

            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/pages/login.html';
                return;
            }

            const response = await fetch('http://localhost:3000/api/teams', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.formData)
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/pages/login.html';
                    return;
                }
                if (response.status === 403) {
                    throw new Error('Access denied. Admin rights required.');
                }
                throw new Error('Failed to create team');
            }

            // Skjul loading og vis success
            document.querySelector('.loading-overlay').classList.remove('show');
            document.querySelector('.success-overlay').classList.add('show');

            // Vent 2 sekunder og redirect
            setTimeout(() => {
                window.location.href = '/pages/teams.html';
            }, 2000);

        } catch (error) {
            console.error('Error creating team:', error);
            document.querySelector('.loading-overlay').classList.remove('show');
            this.showErrorMessage(error.message || 'Failed to create team');
        }
    }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.teamForm = new TeamForm();
}); 