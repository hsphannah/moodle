// --- ARQUIVO: login.js ---

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    // Validação básica: verifica se os elementos essenciais existem
    if (!loginForm || !errorMessage) {
        console.error("Erro Crítico: Elementos do formulário de login (login-form ou error-message) não encontrados no HTML.");
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede o comportamento padrão de recarregar a página
        errorMessage.textContent = ''; // Limpa mensagens de erro anteriores

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Validação simples do lado do cliente
        if (!email || !password) {
            errorMessage.textContent = 'Por favor, preencha todos os campos.';
            return;
        }

        try {
            let userRole = null; // Para saber qual tipo de usuário logou
            let token = null;

            // 1. Tenta fazer login como ADMIN
            let response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const result = await response.json();
                token = result.token;
                userRole = 'admin';
            } else {
                // Se o login de admin falhou, tenta como ALUNO
                response = await fetch('/api/alunos/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                if (response.ok) {
                    const result = await response.json();
                    token = result.token;
                    userRole = 'student';
                }
            }

            // Se o login foi bem-sucedido (seja admin ou aluno)
            if (token && userRole) {
                // Limpa ambos os tokens para evitar sessões misturadas
                localStorage.removeItem('adminToken');
                localStorage.removeItem('studentToken');

                if (userRole === 'admin') {
                    localStorage.setItem('adminToken', token);
                    window.location.href = 'index.html'; // Redireciona para o painel do admin
                } else if (userRole === 'student') {
                    localStorage.setItem('studentToken', token);
                    window.location.href = 'portal.html'; // Redireciona para o portal do aluno
                }
            } else {
                // Se response.ok foi falso em ambas as tentativas, tenta extrair a mensagem de erro
                const errorResult = await response.json().catch(() => ({ message: 'Credenciais inválidas ou erro desconhecido.' }));
                throw new Error(errorResult.error || errorResult.message || 'Credenciais inválidas.');
            }

        } catch (error) {
            console.error('Falha no login:', error);
            errorMessage.textContent = error.message; // Exibe a mensagem de erro para o usuário
        }
    });
});