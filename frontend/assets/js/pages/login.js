document.addEventListener('DOMContentLoaded', async () => {
    const currentPath = window.location.pathname;
    
    // Kun tjek auth hvis vi er på login siden
    if (!currentPath.includes('login.html')) {
        return;
    }

    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch('http://localhost:3000/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                window.location.href = '/pages/projects.html';
                return;
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
        
        // Token er invalid, fjern det
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    const form = document.querySelector('form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/pages/projects.html';
            } else {
                showErrorMessage(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showErrorMessage('An error occurred during login');
        }
    });
});

function showErrorMessage(message) {
    const errorElement = document.querySelector('.error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('email').value;
    
    if (!email) {
        showErrorMessage('Please enter your email');
        return;
    }
    
    showErrorMessage('Password reset function is not implemented in the prototype');
}