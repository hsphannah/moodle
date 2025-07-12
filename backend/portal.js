// --- ARQUIVO: portal.js ---

document.addEventListener('DOMContentLoaded', () => {

    const mainContent = document.querySelector('.main-content');
    const contentHeader = mainContent.querySelector('.content-header');
    const contentBody = mainContent.querySelector('.content-body');
    const navItems = document.querySelectorAll('.nav-item');

    let currentUser = null;
    let token = null;

    // Decodifica o JWT para pegar as informações do usuário
    function decodeJwt(token) {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    }

    // Função de Logout
    function handleLogout() {
        localStorage.removeItem('studentToken');
        window.location.href = 'login.html';
    }

    // --- Funções para renderizar o conteúdo de cada página ---

    function renderDashboard() {
        contentBody.innerHTML = `<h2>Seja bem-vindo(a) de volta!</h2><p>Este é o seu painel de acompanhamento.</p>`;
    }

    async function renderMyCourses() {
        contentBody.innerHTML = `<p>Carregando seus cursos...</p>`;
        try {
            const response = await fetch(`/api/alunos/${currentUser.id}/cursos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Não foi possível carregar seus cursos.');
            const result = await response.json();
            
            // Aqui você pode adicionar a lógica para mostrar os cursos em cards
            contentBody.innerHTML = `<h3>Cursos em que você está inscrito:</h3><pre>${JSON.stringify(result.data, null, 2)}</pre>`;
        } catch (error) {
            contentBody.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }
    
    async function renderMyProgress() {
        contentBody.innerHTML = `<p>Carregando seu progresso...</p>`;
         try {
            const response = await fetch(`/api/alunos/${currentUser.id}/progresso`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Não foi possível carregar seu progresso.');
            const result = await response.json();

            // Lógica para mostrar as barras de progresso
            contentBody.innerHTML = `<h3>Seu progresso:</h3><pre>${JSON.stringify(result.data, null, 2)}</pre>`;
        } catch (error) {
            contentBody.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }
    
    // --- Lógica de Navegação ---
    
    function handleNavClick(event) {
        event.preventDefault();
        const clickedItem = event.currentTarget;
        const view = clickedItem.dataset.view;

        if (view === 'logout') {
            handleLogout();
            return;
        }

        navItems.forEach(item => item.classList.remove('active'));
        clickedItem.classList.add('active');
        
        contentHeader.querySelector('h1').textContent = clickedItem.querySelector('span:last-child').textContent;

        switch (view) {
            case 'dashboard': renderDashboard(); break;
            case 'meus-cursos': renderMyCourses(); break;
            case 'meu-progresso': renderMyProgress(); break;
            // Adicione os outros casos aqui
            default: contentBody.innerHTML = `<p>Seção em desenvolvimento.</p>`;
        }
    }

    // --- Função Principal de Inicialização ---

    function init() {
        token = localStorage.getItem('studentToken');
        if (!token) {
            handleLogout(); // Se não há token de aluno, volta para o login
            return;
        }

        currentUser = decodeJwt(token);
        // Se o token for inválido ou não for de um aluno, volta para o login
        if (!currentUser || currentUser.role !== 'student') {
            handleLogout();
            return;
        }

        // Insere o título H1 inicial na página
        contentHeader.innerHTML = '<h1>Dashboard</h1>';

        // Adiciona os eventos de clique na navegação
        navItems.forEach(item => item.addEventListener('click', handleNavClick));

        // Renderiza a view inicial do dashboard
        renderDashboard();
    }

    init();
});