// login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.textContent = '';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Ocorreu um erro.');
            }
            
            if (result.token) {
                localStorage.setItem('adminToken', result.token);
                window.location.href = 'index.html';
            }

        } catch (error) {
            console.error('Falha no login:', error);
            errorMessage.textContent = error.message;
        }
    });
});