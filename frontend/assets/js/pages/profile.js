document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Hent bruger ID fra localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        
        if (!user || !token) {
            window.location.href = '/pages/login.html';
            return;
        }

        // Definer isAdmin én gang
        const isAdmin = user.isAdmin;

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