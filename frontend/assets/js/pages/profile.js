document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Hent bruger ID fra localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        
        if (!user || !token) {
            window.location.href = '/pages/login.html';
            return;
        }

        // Hent options (roller og teams) fra API
        const optionsResponse = await fetch('http://localhost:3000/api/users/options', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!optionsResponse.ok) {
            throw new Error('Kunne ikke hente valgmuligheder');
        }

        const options = await optionsResponse.json();
        
        // Hent brugerdata fra API
        const response = await fetch(`http://localhost:3000/api/users/${user.UserId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
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

        // Opdater text fields
        updateElement('userName', userData.name);
        updateElement('userEmail', userData.email);

        // Initialiser custom selects
        const initCustomSelect = (selector, options, currentValue) => {
            const header = document.querySelector(`[for="${selector}"] .select-header`);
            const selectedOption = document.querySelector(`[for="${selector}"] .selected-option`);
            const optionsList = document.querySelector(`[for="${selector}"] .select-options`);

            // Sæt den nuværende værdi
            if (selectedOption) {
                selectedOption.textContent = currentValue;
            }

            // Tilføj options til listen
            if (optionsList) {
                optionsList.innerHTML = options.map(option => 
                    `<li class="option" data-value="${option}">${option}</li>`
                ).join('');
            }

            // Toggle dropdown
            if (header) {
                header.addEventListener('click', (e) => {
                    const select = header.closest('.custom-select2');
                    select.classList.toggle('open');
                    updateButtonStates(true);
                });
            }

            // Håndter option valg
            if (optionsList) {
                optionsList.addEventListener('click', (e) => {
                    const option = e.target.closest('.option');
                    if (!option) return;

                    if (selectedOption) {
                        selectedOption.textContent = option.textContent;
                    }
                    header.closest('.custom-select2').classList.remove('open');
                    updateButtonStates(true);
                });
            }
        };

        // Initialiser selects
        initCustomSelect('userTeam', options.teams, userData.team);
        initCustomSelect('userRole', options.roles, userData.role);

        // Check om brugeren er admin
        const isAdmin = user.isAdmin; // Dette kommer fra localStorage

        // Disable team og role selects for ikke-admin brugere
        if (!isAdmin) {
            const teamSelect = document.querySelector('[for="userTeam"] .custom-select2');
            const roleSelect = document.querySelector('[for="userRole"] .custom-select2');
            
            if (teamSelect) {
                teamSelect.classList.add('disabled');
            }
            if (roleSelect) {
                roleSelect.classList.add('disabled');
            }
        }

        // Tilføj click handlers til edit ikoner
        const editIcons = document.querySelectorAll('.edit-icon');
        editIcons.forEach(icon => {
            icon.addEventListener('click', function() {
                const detailDiv = this.closest('.detail');
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
                        // Hvis det er team eller role og brugeren ikke er admin, returner den oprindelige værdi
                        if ((selector === 'userTeam' || selector === 'userRole') && !isAdmin) {
                            return userData[selector.replace('user', '').toLowerCase()];
                        }
                        
                        // For almindelige input felter
                        const input = document.querySelector(`[for="${selector}"] input`);
                        if (input) {
                            return input.value;
                        }

                        // Hvis ikke der er et input, brug den eksisterende værdi fra span
                        const span = document.getElementById(selector);
                        if (span) {
                            return span.textContent;
                        }

                        // Hvis vi ikke kan finde værdien, brug den oprindelige værdi fra userData
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

                    const response = await fetch(`http://localhost:3000/api/users/${user.UserId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(updatedData)
                    });

                    if (!response.ok) throw new Error('Kunne ikke opdatere profil');

                    const result = await response.json();
                    
                    // Opdater UI med nye værdier
                    Object.entries(updatedData).forEach(([key, value]) => {
                        if (value) { // Kun opdater hvis vi har en værdi
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

    } catch (error) {
        console.error('Fejl ved indlæsning af profil:', error);
    }

    // Håndter logout knap
    const logoutButton = document.querySelector('.logout button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/pages/login.html';
        });
    }

    // Tilføj dette i DOMContentLoaded event listener
    const deleteButton = document.querySelector('.button.delete');
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            // Vis bekræftelses dialog
            if (confirm('Er du sikker på at du vil slette din profil? Dette kan ikke fortrydes.')) {
                try {
                    const response = await fetch(`http://localhost:3000/api/users/${user.UserId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Kunne ikke slette bruger');
                    }

                    // Log ud og redirect til login siden
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