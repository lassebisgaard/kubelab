class TeamForm extends BaseStepForm {
    constructor() {
        super('team');
        this.type = 'team';
        this.formData = {
            name: '',
            expiration: '',
            description: '',
            members: []
        };
        this.initMemberModal();
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
            const response = await fetch('http://localhost:3000/api/users');
            const users = await response.json();
            
            const searchResults = document.querySelector('.search-results');
            searchResults.innerHTML = users.map(user => `
                <div class="user-option" data-id="${user.UserId}">
                    <div class="user-info">
                        <span class="user-name">${user.Name}</span>
                        <span class="user-email">${user.Mail}</span>
                    </div>
                    <input type="checkbox" ${this.formData.members.some(m => m.userId === user.UserId) ? 'checked' : ''}>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    updateSelectedMembers() {
        const selectedUsers = document.querySelectorAll('.user-option input:checked');
        this.formData.members = Array.from(selectedUsers).map(checkbox => {
            const userEl = checkbox.closest('.user-option');
            return {
                userId: userEl.dataset.id,
                name: userEl.querySelector('.user-name').textContent
            };
        });

        this.updateMemberDisplay();
    }

    updateMemberDisplay() {
        const container = document.querySelector('.services-selection');
        container.innerHTML = this.formData.members.map(member => `
            <div class="service-tag service-tag--removable" data-id="${member.userId}">
                <i class='bx bx-user'></i>
                <span>${member.name}</span>
                <button class="service-tag--remove" onclick="document.querySelector('.team-form').removeMember('${member.userId}')">
                    <i class='bx bx-x'></i>
                </button>
            </div>
        `).join('');

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
    }

    validateCurrentStep() {
        console.log('Validating team step:', this.currentStep);
        
        if (this.currentStep === 1) {
            const nameInput = document.getElementById('team-name-input');
            const expirationInput = document.getElementById('team-expiration-input');
            const descriptionInput = document.getElementById('team-description-input');

            if (!nameInput.value) {
                alert('Please enter a team name');
                return false;
            }

            if (!expirationInput.value) {
                alert('Please select an expiration date');
                return false;
            }

            const [day, month, year] = expirationInput.value.split('.');
            const formattedDate = `${year}-${month}-${day}`;

            this.formData.name = nameInput.value;
            this.formData.expiration = formattedDate;
            this.formData.description = descriptionInput.value;

            document.getElementById('team-name-confirm').textContent = this.formData.name;
            document.getElementById('team-expiration-confirm').textContent = expirationInput.value;
            document.getElementById('team-description-confirm').textContent = 
                this.formData.description || 'Not specified';
        }
        else if (this.currentStep === 2) {
            // Opdater medlemsvisning i confirmation step
            this.updateMemberDisplay();
        }

        return true;
    }

    async handleSubmission() {
        try {
            console.log('Submitting team data:', this.formData);
            document.querySelector('.loading-overlay').classList.add('show');

            const response = await fetch('http://localhost:3000/api/teams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.formData)
            });

            if (!response.ok) {
                throw new Error('Failed to create team');
            }

            document.querySelector('.loading-overlay').classList.remove('show');
            document.querySelector('.success-overlay').classList.add('show');

            setTimeout(() => {
                window.location.href = '/pages/teams.html';
            }, 2000);

        } catch (error) {
            console.error('Error creating team:', error);
            document.querySelector('.loading-overlay').classList.remove('show');
            alert('Failed to create team. Please try again.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof BaseStepForm === 'undefined') {
        console.error('BaseStepForm not loaded');
        return;
    }
    const form = new TeamForm();
    // Tilføj form til window så vi kan kalde removeMember fra HTML
    window.teamForm = form;
}); 