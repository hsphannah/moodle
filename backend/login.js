// login.js - Versão Completa e Corrigida

document.addEventListener('DOMContentLoaded', () => {
    // Esta linha busca o formulário no seu login.html
    const loginForm = document.getElementById('login-form');
    // Esta linha busca o parágrafo de erro
    const errorMessage = document.getElementById('error-message');

    // Se, por algum motivo, o formulário não for encontrado no HTML, o script para com um aviso.
    if (!loginForm) {
        console.error("Erro Crítico: O elemento do formulário com id 'login-form' não foi encontrado no HTML.");
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.textContent = '';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Tenta fazer login como ADMIN primeiro
            const adminResponse = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (adminResponse.ok) {
                const result = await adminResponse.json();
                localStorage.setItem('adminToken', result.token);
                localStorage.removeItem('studentToken'); // Limpa token de aluno, se houver
                window.location.href = 'index.html'; // Redireciona para o painel do admin
                return;
            }

            // Se o login de admin falhou, tenta como ALUNO
            const studentResponse = await fetch('/api/alunos/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (studentResponse.ok) {
                const result = await studentResponse.json();
                localStorage.setItem('studentToken', result.token);
                localStorage.removeItem('adminToken'); // Limpa token de admin, se houver
                window.location.href = 'portal.html'; // Redireciona para o portal do aluno
                return;
            }

            // Se nenhum dos dois funcionou, mostra erro
            throw new Error('Credenciais inválidas para admin e aluno.');

        } catch (error) {
            console.error('Falha no login:', error);
            errorMessage.textContent = error.message;
        }
    });
});