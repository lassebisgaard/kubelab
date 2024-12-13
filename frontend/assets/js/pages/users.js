async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/users-page', {
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

        const users = await response.json();
        renderUsers(users);
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Failed to load users');
    }
}

async function deleteUser(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete user');
        
        // Reload users list
        loadUsers();
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Failed to delete user');
    }
} 