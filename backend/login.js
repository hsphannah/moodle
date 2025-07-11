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
            // Usamos um nome diferente para o token do aluno para não haver conflito
            localStorage.setItem('studentToken', result.token); 
            window.location.href = 'portal.html'; // Redireciona para o portal do aluno
            return;
        }

        // Se nenhum dos dois funcionou, mostra erro
        const errorResult = await adminResponse.json(); // Pega a mensagem de erro do primeiro try
        throw new Error(errorResult.error || 'Credenciais inválidas.');

    } catch (error) {
        console.error('Falha no login:', error);
        errorMessage.textContent = error.message;
    }
});