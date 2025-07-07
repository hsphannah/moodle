document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', (event) => {
        // 1. Impede o comportamento padrão do formulário (que é recarregar a página)
        event.preventDefault();

        // 2. Aqui, em um projeto real, você enviaria os dados para um servidor.
        // Como estamos apenas no front-end, vamos pular direto para o redirecionamento.
        console.log('Formulário enviado! Redirecionando...');

        // 3. Redireciona o usuário para a página principal do portal
        window.location.href = 'index.html';
    });
});