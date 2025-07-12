// --- ARQUIVO: portal.js (Versão focada no Aluno) ---

document.addEventListener('DOMContentLoaded', () => {

    const mainContent = document.querySelector('.main-content');
    const contentHeader = mainContent.querySelector('.content-header');
    const contentBody = mainContent.querySelector('.content-body');
    const navItems = document.querySelectorAll('.nav-item');

    let currentUser = null;
    let token = null;

    function decodeJwt(token) { try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; } }
    function handleLogout() { localStorage.removeItem('studentToken'); window.location.href = 'login.html'; }

    // --- Funções de Renderização ---

    function renderDashboard() {
        contentHeader.innerHTML = '<h1>Dashboard</h1>';
        contentBody.innerHTML = `<h2>Seja bem-vindo(a) de volta!</h2><p>Clique em "Meus Cursos" para começar a estudar.</p>`;
    }

    async function renderMyCourses() {
        contentHeader.innerHTML = '<h1>Meus Cursos</h1>';
        contentBody.innerHTML = `<p>Carregando seus cursos...</p>`;
        try {
            const response = await fetch(`/api/alunos/${currentUser.id}/cursos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Não foi possível carregar seus cursos.');
            const result = await response.json();
            
            if (result.data.length === 0) {
                contentBody.innerHTML = '<p>Você ainda não está inscrito em nenhum curso.</p>';
                return;
            }
            
            const coursesHtml = result.data.map(course => `
                <div class="course-card-student" data-course-id="${course.id}" data-course-name="${course.name}">
                    <h3>${course.name}</h3>
                    <p>${course.description}</p>
                </div>
            `).join('');
            contentBody.innerHTML = `<div class="course-grid">${coursesHtml}</div>`;

            // Adiciona evento de clique para cada card de curso
            document.querySelectorAll('.course-card-student').forEach(card => {
                card.addEventListener('click', () => {
                    const courseId = card.dataset.courseId;
                    const courseName = card.dataset.courseName;
                    renderCourseLessons(courseId, courseName);
                });
            });

        } catch (error) {
            contentBody.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }
    
    async function renderCourseLessons(courseId, courseName) {
        contentHeader.innerHTML = `<h1>${courseName}</h1>`;
        contentBody.innerHTML = `<p>Carregando aulas...</p>`;
        try {
            const response = await fetch(`/api/alunos/${currentUser.id}/cursos/${courseId}/aulas`, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Não foi possível carregar as aulas.');
            const result = await response.json();

            const lessonsHtml = result.data.map(lesson => `
                <li class="lesson-item ${lesson.concluida ? 'concluida' : ''}">
                    <span>${lesson.titulo}</span>
                    <a href="${lesson.conteudo}" target="_blank">Acessar Conteúdo</a>
                </li>
            `).join('');

            contentBody.innerHTML = `
                <div class="back-button" onclick="document.querySelector('[data-view=meus-cursos]').click()">&larr; Voltar para Meus Cursos</div>
                <ul class="lesson-list">${lessonsHtml}</ul>
            `;
        } catch(error) {
            contentBody.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }
    
    // --- Lógica de Navegação ---
    function handleNavClick(event) {
        event.preventDefault();
        const clickedItem = event.currentTarget;
        const view = clickedItem.dataset.view;

        if (view === 'logout') { handleLogout(); return; }

        navItems.forEach(item => item.classList.remove('active'));
        clickedItem.classList.add('active');
        
        switch (view) {
            case 'dashboard': renderDashboard(); break;
            case 'meus-cursos': renderMyCourses(); break;
            // Adicione os outros casos aqui
            default: 
                contentHeader.innerHTML = `<h1>${clickedItem.querySelector('span:last-child').textContent}</h1>`;
                contentBody.innerHTML = `<p>Seção em desenvolvimento.</p>`;
        }
    }

    // --- Função Principal de Inicialização ---
    function init() {
        token = localStorage.getItem('studentToken');
        if (!token) { handleLogout(); return; }
        currentUser = decodeJwt(token);
        if (!currentUser || currentUser.role !== 'student') { handleLogout(); return; }

        navItems.forEach(item => item.addEventListener('click', handleNavClick));
        renderDashboard(); // Começa na Dashboard
    }
    init();
});