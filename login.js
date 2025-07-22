// --- ARQUIVO: login.js ---

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessageElement = document.getElementById('error-message'); // Renomeado para evitar conflito

    // Função auxiliar para exibir toasts
    function showToast(message, type = 'error') {
        const backgroundColor = type === 'success' ? '#28a745' : '#dc3545'; // Verde para sucesso, vermelho para erro
        Toastify({
            text: message,
            duration: 3000, // 3 segundos
            close: true,
            gravity: "top", // `top` ou `bottom`
            position: "right", // `left`, `center` ou `right`
            stopOnFocus: true, // Para o tempo do toast se o usuário focar nele
            style: {
                background: backgroundColor,
                borderRadius: "5px",
                padding: "10px 20px"
            },
            onClick: function(){} // Callback depois de clicar
        }).showToast();
    }

    // Validação básica: verifica se os elementos essenciais existem
    if (!loginForm || !errorMessageElement) {
        console.error("Erro Crítico: Elementos do formulário de login (login-form ou error-message) não encontrados no HTML.");
        // Se houver um erro crítico, exiba um alert fallback
        alert("Erro crítico na página de login. Por favor, tente novamente.");
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede o comportamento padrão de recarregar a página
        errorMessageElement.textContent = ''; // Limpa mensagens de erro anteriores do <p>

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Validação simples do lado do cliente
        if (!email || !password) {
            showToast('Por favor, preencha todos os campos.', 'error');
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
                    showToast('Login de administrador realizado com sucesso!', 'success');
                    // Pequeno atraso para o toast aparecer antes de redirecionar
                    setTimeout(() => { window.location.href = 'index.html'; }, 500); 
                } else if (userRole === 'student') {
                    localStorage.setItem('studentToken', token);
                    showToast('Login de aluno realizado com sucesso!', 'success');
                    // Pequeno atraso para o toast aparecer antes de redirecionar
                    setTimeout(() => { window.location.href = 'portal.html'; }, 500);
                }
            } else {
                // Se response.ok foi falso em ambas as tentativas, tenta extrair a mensagem de erro
                const errorResult = await response.json().catch(() => ({ message: 'Credenciais inválidas ou erro desconhecido.' }));
                // Exibe a mensagem de erro no toast e também no elemento de erro para redundância
                const errorMessageText = errorResult.error || errorResult.message || 'Credenciais inválidas. Por favor, tente novamente.';
                errorMessageElement.textContent = errorMessageText; // Mantém a mensagem no <p> também
                showToast(errorMessageText, 'error');
            }

        } catch (error) {
            console.error('Falha no login:', error);
            // Exibe o erro no toast (e no <p> se for erro de rede/JS)
            const displayMessage = error.message || 'Ocorreu um erro de rede. Verifique sua conexão.';
            errorMessageElement.textContent = displayMessage; // Mantém a mensagem no <p>
            showToast(displayMessage, 'error');
        }
    });
});