async function loadServices() {
    try {
        const services = await fetchServices();
        renderServices(services);
    } catch (error) {
        console.error('Failed to load services:', error);
    }
}

async function createService(serviceData) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/services', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(serviceData)
        });

        if (response.status === 401) {
            window.location.href = '/pages/login.html';
            return;
        }

        if (response.status === 403) {
            showErrorMessage('Access denied. Admin rights required.');
            return;
        }

        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Failed to create service');
    }
} 