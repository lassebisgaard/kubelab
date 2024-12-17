async function loadTeams() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/teams', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            window.location.href = '/pages/login.html';
            return;
        }

        if (response.status === 403) {
            showErrorMessage('Access denied. Admin rights required.');
            return;
        }

        const teams = await response.json();
        displayTeams(teams);
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Failed to load teams');
    }
}

function displayTeams(teams) {
    if (!Array.isArray(teams)) {
        throw new Error('Modtaget data er ikke et array');
    }
    
    const accordionContainer = document.getElementById('teamsAccordion');
    if (!accordionContainer) {
        throw new Error('Kunne ikke finde accordion container');
    }
    
    accordionContainer.innerHTML = ''; // Ryd eksisterende indhold
    
    if (teams.length === 0) {
        accordionContainer.innerHTML = '<p class="no-data">Ingen teams fundet</p>';
        return;
    }
    
    teams.forEach(team => {
        const accordionItem = `
            <div class="accordion-item">
                <div class="accordion-header">
                    <div class="team-info">
                        <i class='bx bx-group'></i>
                        <span>${team.TeamName || 'N/A'}</span>
                    </div>
                    <div class="edit">
                        <span>${new Date(team.Expiration).toLocaleDateString()}</span>
                    </div>
                    <div class="members">
                        <span>${team.MemberCount || 0}</span>
                        <button class="toggle-button">
                            <i class="bx bx-chevron-down"></i>
                        </button>
                    </div>
                </div>
                <div class="accordion-content">
                    <!-- Medlemmer sektion -->
                    <div class="members-section">
                        <div class="content-row header">
                            <span class="name">Member Name</span>
                            <span class="email">Projects</span>
                        </div>
                        ${team.Members && team.Members.length > 0 ? 
                            team.Members.map(member => `
                                <div class="member-row">
                                    <span class="member-name">${member.Name}</span>
                                    <span class="project-count">${member.ProjectCount}</span>
                                </div>
                            `).join('')
                            : '<p class="no-members">No members</p>'
                        }
                    </div>
                </div>
            </div>
        `;
        accordionContainer.innerHTML += accordionItem;
    });

    // Genaktiver accordion funktionalitet
    setupAccordion();
}

function setupAccordion() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isVisible = content?.style.display === 'block';

            document.querySelectorAll('.accordion-content').forEach(c => c.style.display = 'none');
            document.querySelectorAll('.toggle-button i').forEach(icon => {
                icon.classList.remove('bx-chevron-up');
                icon.classList.add('bx-chevron-down');
            });

            if (!isVisible && content) {
                content.style.display = 'block';
                header.querySelector('.toggle-button i').classList.replace('bx-chevron-down', 'bx-chevron-up');
            }
        });
    });
}

// Tilføj søgefunktionalitet
document.addEventListener('DOMContentLoaded', () => {
    loadTeams();
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll('.accordion-item').forEach(item => {
                const teamName = item.querySelector('.team-info span').textContent.toLowerCase();
                const hasMatch = teamName.includes(searchTerm);
                item.style.display = hasMatch ? '' : 'none';
            });
        });
    }
}); 