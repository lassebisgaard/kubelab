async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        const response = await fetch(`http://localhost:3000/api/users/${user.userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            window.location.href = '/pages/login.html';
            return;
        }

        const profileData = await response.json();
        renderProfile(profileData);
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Failed to load profile');
    }
}

async function updateProfile(profileData) {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        const response = await fetch(`http://localhost:3000/api/users/${user.userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });

        if (!response.ok) throw new Error('Failed to update profile');
        
        showSuccessMessage('Profile updated successfully');
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Failed to update profile');
    }
} 