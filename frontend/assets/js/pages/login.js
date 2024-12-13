document.addEventListener('DOMContentLoaded', async () => {
    const currentPath = window.location.pathname;
    const publicPages = ['/', '/index.html', '/pages/login.html', '/pages/account_creation.html'];
    
    // Hvis vi er på en offentlig side, skal vi ikke tjekke auth
    if (publicPages.some(page => currentPath.endsWith(page))) {
        return;
    }

    // Check if already logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/pages/login.html';
            return;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/pages/login.html';
    }
});

function showErrorMessage(message) {
    const errorElement = document.querySelector('.error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}