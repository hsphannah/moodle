document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

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
            // 1. Tenta fazer login como ADMIN na rota de admin
            const adminResponse = await fetch('/api/admin/login', {
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

            // 2. Se o login de admin falhou, tenta como ALUNO na rota de aluno
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

            // 3. Se nenhum dos dois funcionou, mostra o erro.
            throw new Error('Credenciais inválidas.');

        } catch (error) {
            console.error('Falha no login:', error);
            errorMessage.textContent = error.message;
        }
    });
});