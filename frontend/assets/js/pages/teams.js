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
        // ... resten af din eksisterende kode
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Failed to load teams');
    }
} 