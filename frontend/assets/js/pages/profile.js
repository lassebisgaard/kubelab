let currentUser;
let authToken;

const avatarStyles = [
    { seed: 'happy1', mood: 'happy', color: 'b6e3f4' },
    { seed: 'happy2', mood: 'happy', color: 'c0aede' },
    { seed: 'happy3', mood: 'happy', color: 'ffd5dc' },
    { seed: 'happy4', mood: 'happy', color: 'ffdfbf' },
    { seed: 'cool1', mood: 'cool', color: 'ff9ff3' },
    { seed: 'cool2', mood: 'cool', color: 'feca57' },
    { seed: 'cool3', mood: 'cool', color: '48dbfb' },
    { seed: 'cool4', mood: 'cool', color: '1dd1a1' },
    { seed: 'cute1', mood: 'cute', color: 'ff6b6b' },
    { seed: 'cute2', mood: 'cute', color: '4ecdc4' },
    { seed: 'cute3', mood: 'cute', color: '45b7d1' },
    { seed: 'cute4', mood: 'cute', color: '96ceb4' }
];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Sæt knapperne til inaktiv tilstand ved indlæsning
        updateButtonStates(false);

        // Hent bruger ID fra localStorage
        currentUser = JSON.parse(localStorage.getItem('user'));
        authToken = localStorage.getItem('token');
        
        if (!currentUser || !authToken) {
            window.location.href = '/pages/login.html';
            return;
        }

        // Definer isAdmin én gang
        const isAdmin = currentUser.isAdmin;

        // Hent options (roller og teams) fra API
        const optionsResponse = await fetch('http://localhost:3000/api/users/options', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!optionsResponse.ok) {
            throw new Error('Kunne ikke hente valgmuligheder');
        }

        const options = await optionsResponse.json();
        
        // Hent brugerdata fra API
        const response = await fetch(`http://localhost:3000/api/users/${currentUser.UserId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Kunne ikke hente brugerdata');
        }

        const userData = await response.json();

        // Opdater DOM elementer med brugerdata
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
            
            if (id === 'userName') {
                const profileName = document.querySelector('.profile-container h2');
                if (profileName) profileName.textContent = value;
                
                const sidebarName = document.querySelector('.profile-link span');
                if (sidebarName) sidebarName.textContent = value;
            }
        };

        // Opdater navn og email
        updateElement('userName', userData.name);
        updateElement('userEmail', userData.email);

        // Opdater team og role felter baseret på admin status
        const teamDiv = document.querySelector('[for="userTeam"] div');
        const roleDiv = document.querySelector('[for="userRole"] div');

        if (isAdmin) {
            // For admin brugere - opret custom select struktur
            teamDiv.outerHTML = `
                <div class="custom-select2">
                    <div class="select-header" tabindex="0">
                        <span class="selected-option">${userData.team}</span>
                        <i class="bx bx-chevron-down"></i>
                    </div>
                    <ul class="select-options">
                        ${options.teams.map(team => `<li class="option" data-value="${team}">${team}</li>`).join('')}
                    </ul>
                </div>
            `;

            roleDiv.outerHTML = `
                <div class="custom-select2">
                    <div class="select-header" tabindex="0">
                        <span class="selected-option">${userData.role}</span>
                        <i class="bx bx-chevron-down"></i>
                    </div>
                    <ul class="select-options">
                        ${options.roles.map(role => `<li class="option" data-value="${role}">${role}</li>`).join('')}
                    </ul>
                </div>
            `;

            // Tilføj event listeners til custom selects
            document.querySelectorAll('.custom-select2 .select-header').forEach(header => {
                header.addEventListener('click', () => {
                    header.closest('.custom-select2').classList.toggle('open');
                    updateButtonStates(true);
                });
            });

            document.querySelectorAll('.custom-select2 .option').forEach(option => {
                option.addEventListener('click', () => {
                    const select = option.closest('.custom-select2');
                    const header = select.querySelector('.selected-option');
                    header.textContent = option.textContent;
                    select.classList.remove('open');
                    updateButtonStates(true);
                });
            });
        } else {
            // For almindelige brugere - vis bare spans
            teamDiv.innerHTML = `<span id="userTeam">${userData.team}</span>`;
            roleDiv.innerHTML = `<span id="userRole">${userData.role}</span>`;
            
            // Tilføj not-allowed cursor
            teamDiv.style.cursor = 'not-allowed';
            roleDiv.style.cursor = 'not-allowed';
        }

        // Håndter ikke-admin brugere
        if (!isAdmin) {
            // Tilføj not-allowed cursor kun til team og role felter
            const teamDiv = document.querySelector('[for="userTeam"] div');
            const roleDiv = document.querySelector('[for="userRole"] div');
            
            if (teamDiv) teamDiv.style.cursor = 'not-allowed';
            if (roleDiv) roleDiv.style.cursor = 'not-allowed';
        }

        // Tilføj click handlers til edit ikoner
        const editIcons = document.querySelectorAll('.edit-icon');
        editIcons.forEach(icon => {
            icon.addEventListener('click', function() {
                const detailDiv = this.closest('.detail');
                const fieldType = detailDiv.getAttribute('for');
                
                // Skip KUN hvis det er team eller role felt og brugeren ikke er admin
                if (!isAdmin && (fieldType === 'userTeam' || fieldType === 'userRole')) {
                    return;
                }

                const span = detailDiv.querySelector('span');
                if (!span) return;
                
                const currentValue = span.textContent;
                
                if (detailDiv.getAttribute('for') === 'userRole') {
                    const select = document.createElement('select');
                    select.className = 'edit-input';
                    
                    // Brug roller fra API'en
                    options.roles.forEach(role => {
                        const option = document.createElement('option');
                        option.value = role;
                        option.textContent = role;
                        if (role === currentValue) {
                            option.selected = true;
                        }
                        select.appendChild(option);
                    });
                    
                    span.replaceWith(select);
                    select.focus();
                } else if (detailDiv.getAttribute('for') === 'userTeam') {
                    const select = document.createElement('select');
                    select.className = 'edit-input';
                    
                    // Brug teams fra API'en
                    options.teams.forEach(team => {
                        const option = document.createElement('option');
                        option.value = team;
                        option.textContent = team;
                        if (team === currentValue) {
                            option.selected = true;
                        }
                        select.appendChild(option);
                    });
                    
                    span.replaceWith(select);
                    select.focus();
                } else {
                    const input = document.createElement('input');
                    input.value = currentValue;
                    input.className = 'edit-input';
                    
                    span.replaceWith(input);
                    input.focus();
                }
                
                updateButtonStates(true);
            });
        });

        // Håndter Cancel button
        const cancelBtn = document.querySelector('.btn.cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', resetInputs);
        }

        // Håndter Confirm changes button
        const confirmBtn = document.querySelector('.btn.confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                try {
                    const getValue = (selector) => {

                        if ((selector === 'userTeam' || selector === 'userRole') && !isAdmin) {
                            return userData[selector.replace('user', '').toLowerCase()];
                        }
                        
                        const input = document.querySelector(`[for="${selector}"] input`);
                        if (input) {
                            return input.value;
                        }

                        const span = document.getElementById(selector);
                        if (span) {
                            return span.textContent;
                        }

                        switch(selector) {
                            case 'userName':
                                return userData.name;
                            case 'userEmail':
                                return userData.email;
                            case 'userTeam':
                                return userData.team;
                            case 'userRole':
                                return userData.role;
                            default:
                                return '';
                        }
                    };

                    const updatedData = {
                        name: getValue('userName'),
                        email: getValue('userEmail'),
                        team: getValue('userTeam'),
                        role: getValue('userRole')
                    };

                    const response = await fetch(`http://localhost:3000/api/users/${currentUser.UserId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify(updatedData)
                    });

                    if (!response.ok) throw new Error('Kunne ikke opdatere profil');

                    const result = await response.json();
                    
                    // Opdater UI med nye værdier
                    Object.entries(updatedData).forEach(([key, value]) => {
                        if (value) { 
                            updateElement(`user${key.charAt(0).toUpperCase() + key.slice(1)}`, value);
                        }
                    });

                    // Opdater localStorage med det nye navn hvis det blev ændret
                    if (updatedData.name) {
                        const updatedUser = JSON.parse(localStorage.getItem('user'));
                        if (updatedUser) {
                            updatedUser.Name = updatedData.name;
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                        }
                    }

                    resetInputs();
                    
                } catch (error) {
                    console.error('Fejl ved opdatering:', error);
                    alert('Der skete en fejl ved opdatering af profilen');
                }
            });
        }

        function resetInputs() {
            document.querySelectorAll('.edit-input').forEach(input => {
                const span = document.createElement('span');
                span.id = input.id;
                span.textContent = input.value;
                input.replaceWith(span);
            });
            
            updateButtonStates(false);
        }

        // Sæt den korrekte avatar med det samme
        if (userData.avatarSeed) {
            const style = avatarStyles.find(s => s.seed === userData.avatarSeed);
            if (style) {
                const avatarUrl = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${userData.avatarSeed}&backgroundColor=${style.color}`;
                
                const profileAvatar = document.getElementById('profileAvatar');
                const sidebarAvatar = document.querySelector('.profile-link img');
                
                if (profileAvatar) profileAvatar.src = avatarUrl;
                if (sidebarAvatar) sidebarAvatar.src = avatarUrl;
            }
        }

    } catch (error) {
        console.error('Fejl ved indlæsning af profil:', error);
    }

    const logoutButton = document.querySelector('.logout button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/pages/login.html';
        });
    }

    const deleteButton = document.querySelector('.button.delete');
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            if (confirm('Er du sikker på at du vil slette din profil? Dette kan ikke fortrydes.')) {
                try {
                    const response = await fetch(`http://localhost:3000/api/users/${currentUser.UserId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Kunne ikke slette bruger');
                    }

                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/pages/login.html';
                } catch (error) {
                    console.error('Fejl ved sletning af profil:', error);
                    alert('Der opstod en fejl ved sletning af profilen');
                }
            }
        });
    }



    const changeAvatarBtn = document.getElementById('changeAvatar');
    const avatarModal = document.getElementById('avatarModal');
    const avatarGrid = document.querySelector('.avatar-grid');

    if (changeAvatarBtn && avatarModal && avatarGrid) {

        avatarGrid.innerHTML = avatarStyles.map(style => `
            <div class="avatar-option" data-seed="${style.seed}">
                <img src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${style.seed}&backgroundColor=${style.color}" 
                     alt="Bot avatar">
            </div>
        `).join('');


        changeAvatarBtn.addEventListener('click', () => {

            const modalContent = avatarModal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.classList.add('modal-content-large');
            }
            avatarModal.style.display = 'flex';
        });

        avatarModal.addEventListener('click', (e) => {
            if (e.target === avatarModal) {
                avatarModal.style.display = 'none';
            }
        });


        const closeModalBtn = document.querySelector('.close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                avatarModal.style.display = 'none';
            });
        }

        // Opdater avatar valg handler
        avatarGrid.addEventListener('click', async (e) => {
            const option = e.target.closest('.avatar-option');
            if (!option) return;

            document.querySelectorAll('.avatar-option.selected').forEach(el => 
                el.classList.remove('selected')
            );
            
            option.classList.add('selected');

            const seed = option.dataset.seed;
            const style = avatarStyles.find(s => s.seed === seed);
            const newAvatarUrl = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}&backgroundColor=${style.color}`;

            document.getElementById('profileAvatar').src = newAvatarUrl;
            const sidebarAvatar = document.querySelector('.profile-link img');
            if (sidebarAvatar) {
                sidebarAvatar.src = newAvatarUrl;
            }

            try {
                const response = await fetch(`http://localhost:3000/api/users/${currentUser.UserId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        avatarSeed: seed
                    })
                });

                if (!response.ok) throw new Error('Kunne ikke opdatere avatar');
                
                const updatedUser = JSON.parse(localStorage.getItem('user'));
                if (updatedUser) {
                    updatedUser.avatarSeed = seed;
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }

                avatarModal.style.display = 'none';
                
                updateButtonStates(false);
            } catch (error) {
                console.error('Fejl ved opdatering af avatar:', error);
                alert('Der skete en fejl ved opdatering af avatar');
            }
        });
    }
});

function updateButtonStates(isEditing = false) {
    const confirmBtn = document.querySelector('.btn.confirm');
    const cancelBtn = document.querySelector('.btn.cancel');
    
    if (confirmBtn) {
        confirmBtn.disabled = !isEditing;
    }
    if (cancelBtn) {
        cancelBtn.classList.toggle('visible', isEditing);
    }
}