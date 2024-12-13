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
        const teamsContainer = document.querySelector('.teams-grid');
        if (!teamsContainer) return;

        teamsContainer.innerHTML = teams.map(team => `
            <div class="card team-card">
                <div class="card-content">
                    <h2>${team.TeamName}</h2>
                    <p>Users: ${team.UserCount || 0}</p>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Failed to load teams');
    }
} 