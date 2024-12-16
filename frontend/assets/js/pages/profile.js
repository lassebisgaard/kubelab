document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Hent bruger ID fra localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        
        if (!user || !token) {
            window.location.href = '/pages/login.html';
            return;
        }

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
        document.getElementById('userName').textContent = userData.name;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userTeam').textContent = userData.team;
        document.getElementById('userRole').textContent = userData.role;

        // Opdater også profilbilledets navn
        const profileName = document.querySelector('.profile-container h2');
        if (profileName) {
            profileName.textContent = userData.name;
        }

    } catch (error) {
        console.error('Fejl ved indlæsning af profil:', error);
        // Vis eventuelt en fejlmeddelelse til brugeren
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
}); 