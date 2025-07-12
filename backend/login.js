// login.js - Versão Final e Corrigida

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    if (!loginForm) {
        console.error("Erro Crítico: O formulário de login não foi encontrado.");
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.textContent = '';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Fazemos UMA ÚNICA chamada para a nossa rota de login inteligente
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Credenciais inválidas.');
            }

            const result = await response.json();

            // AGORA, VERIFICAMOS O TIPO DE USUÁRIO E REDIRECIONAMOS CORRETAMENTE
            if (result.userType === 'admin') {
                localStorage.setItem('adminToken', result.token);
                localStorage.removeItem('studentToken'); // Limpa token de aluno, se houver
                window.location.href = 'index.html'; // Redireciona para o painel do admin

            } else if (result.userType === 'student') {
                localStorage.setItem('studentToken', result.token);
                localStorage.removeItem('adminToken'); // Limpa token de admin, se houver
                window.location.href = 'portal.html'; // Redireciona para o portal do aluno
                
            } else {
                // Caso de segurança, se a resposta não tiver o userType
                throw new Error('Tipo de usuário desconhecido na resposta do servidor.');
            }

        } catch (error) {
            console.error('Falha no login:', error);
            errorMessage.textContent = error.message;
        }
    });
});