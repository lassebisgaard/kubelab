async function submitTemplate(formData) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/templates', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.status === 401) {
            window.location.href = '/pages/login.html';
            return;
        }

        if (response.status === 403) {
            showErrorMessage('Access denied. Admin rights required.');
            return;
        }

        // ... resten af din eksisterende kode
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Failed to create template');
    }
} 