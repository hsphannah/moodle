// --- ARQUIVO: portal.js (Versão Completa e Final para o Aluno) ---

document.addEventListener('DOMContentLoaded', () => {

    // ===============================================
    // SELETORES GLOBAIS E VARIÁVEIS
    // ===============================================
    const mainContent = document.querySelector('.main-content');
    const contentHeader = mainContent.querySelector('.content-header');
    const contentBody = mainContent.querySelector('.content-body');
    const navItems = document.querySelectorAll('.nav-item');

    const contentModal = document.getElementById('content-viewer-modal');
    const modalTitle = document.getElementById('modal-content-title');
    const modalBody = document.getElementById('modal-content-body');
    const closeModalBtn = document.getElementById('modal-close-btn');

    let currentUser = null;
    let token = null;

    // ===============================================
    // FUNÇÕES DE UTILIDADE E AUTENTICAÇÃO
    // ===============================================
    function decodeJwt(token) { try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; } }
    function handleLogout() { localStorage.removeItem('studentToken'); window.location.href = 'login.html'; }

    // ===============================================
    // LÓGICA DO MODAL DE CONTEÚDO
    // ===============================================
    function showContentInModal(tipo, conteudo, titulo) {
        if (!contentModal || !modalTitle || !modalBody) return;
        modalTitle.textContent = titulo;
        let contentHtml = '';
        const tipoLower = tipo.toLowerCase();
        if (tipoLower.includes('texto')) { contentHtml = `<p>${conteudo.replace(/\n/g, '<br>')}</p>`; }
        else if (tipoLower.includes('imagem')) { contentHtml = `<img src="${conteudo}" alt="${titulo}">`; }
        else if (tipoLower.includes('pdf')) { contentHtml = `<iframe src="${conteudo}" width="100%" height="500px"></iframe>`; }
        else if (tipoLower.includes('vídeo (upload)')) { contentHtml = `<video controls autoplay width="100%"><source src="${conteudo}" type="video/mp4"></video>`; }
        else if (tipoLower.includes('vídeo (link)')) {
            let videoId = null;
            try { const url = new URL(conteudo); videoId = url.searchParams.get('v') || url.pathname.split('/').pop(); } catch(e) {}
            if (videoId) { contentHtml = `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`; }
            else { contentHtml = `<p>Link de vídeo inválido.</p>`; }
        } else { contentHtml = `<p>Conteúdo não suportado.</p>`; }
        modalBody.innerHTML = contentHtml;
        contentModal.classList.add('active');
    }
    if (closeModalBtn) { closeModalBtn.addEventListener('click', () => contentModal.classList.remove('active')); }
    if (contentModal) { contentModal.addEventListener('click', (e) => { if (e.target === contentModal) { contentModal.classList.remove('active'); } }); }

    // ===============================================
    // FUNÇÕES DE RENDERIZAÇÃO DE PÁGINA
    // ===============================================
    function renderDashboard() {
        contentHeader.innerHTML = '<h1>Dashboard</h1>';
        contentBody.innerHTML = `<h2>Seja bem-vindo(a) de volta, ${currentUser.email}!</h2><p>Clique em "Meus Cursos" no menu para começar a estudar.</p>`;
    }

    async function renderMyCourses() {
        contentHeader.innerHTML = '<h1>Meus Cursos</h1>';
        contentBody.innerHTML = `<p>Carregando seus cursos...</p>`;
        try {
            const response = await fetch(`/api/alunos/${currentUser.id}/cursos`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Não foi possível carregar seus cursos.');
            const result = await response.json();
            if (result.data.length === 0) { contentBody.innerHTML = '<h3>Você ainda não está inscrito em nenhum curso.</h3>'; return; }
            const coursesHtml = result.data.map(course => `
                <div class="course-card-student" data-course-id="${course.id}" data-course-name="${course.name}">
                    <h3>${course.name}</h3><p>${course.description || 'Sem descrição.'}</p>
                </div>`).join('');
            contentBody.innerHTML = `<div class="course-grid">${coursesHtml}</div>`;
        } catch (error) { contentBody.innerHTML = `<p style="color: red;">${error.message}</p>`; }
    }
    
    async function renderCourseLessons(courseId, courseName) {
        contentHeader.innerHTML = `<h1>${courseName}</h1>`;
        contentBody.innerHTML = `<p>Carregando aulas...</p>`;
        try {
            const response = await fetch(`/api/alunos/${currentUser.id}/cursos/${courseId}/aulas`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Não foi possível carregar as aulas.');
            const result = await response.json();
            const lessonsHtml = result.data.map(lesson => `
                <li class="lesson-item ${lesson.concluida ? 'concluida' : ''}" data-lesson-id="${lesson.id}">
                    <span>${lesson.titulo}</span>
                    <div class="lesson-item-actions">
                        <button class="view-content-btn" data-tipo="${lesson.tipo}" data-conteudo="${lesson.conteudo}" data-titulo="${lesson.titulo}">Acessar Conteúdo</button>
                        <button class="complete-btn" data-aula-id="${lesson.id}" ${lesson.concluida ? 'disabled' : ''}>
                            ${lesson.concluida ? 'Concluída' : 'Marcar como Concluída'}
                        </button>
                    </div>
                </li>
            `).join('');
            contentBody.innerHTML = `
                <div class="back-button" data-view="meus-cursos">← Voltar para Meus Cursos</div>
                <ul class="lesson-list">${lessonsHtml}</ul>`;
        } catch(error) { contentBody.innerHTML = `<p style="color: red;">${error.message}</p>`; }
    }

    async function renderMyProgress() {
        contentHeader.innerHTML = '<h1>Meu Progresso</h1>';
        contentBody.innerHTML = `<p>Calculando seu progresso...</p>`;
        try {
            const response = await fetch(`/api/alunos/${currentUser.id}/progresso`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Não foi possível carregar seu progresso.');
            const result = await response.json();
            const progressData = result.data;
            if (progressData.length === 0) {
                contentBody.innerHTML = '<h3>Você não tem progresso para exibir pois não está inscrito em cursos.</h3>';
                return;
            }
            const progressCardsHtml = progressData.map(course => {
                const percentage = course.total_aulas > 0 ? Math.round((course.aulas_concluidas / course.total_aulas) * 100) : 0;
                return `
                    <div class="progress-card">
                        <h3>${course.curso_nome}</h3>
                        <div class="progress-details">
                            <span>Completou ${course.aulas_concluidas} de ${course.total_aulas} aulas</span>
                            <span>${percentage}%</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${percentage}%;"></div>
                        </div>
                    </div>
                `;
            }).join('');
            contentBody.innerHTML = `<div class="progress-container">${progressCardsHtml}</div>`;
        } catch (error) {
            contentBody.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }
    
    // ===============================================
    // LÓGICA DE AÇÕES DO ALUNO
    // ===============================================
    async function handleMarkLessonComplete(aulaId, buttonElement) {
        buttonElement.disabled = true;
        buttonElement.textContent = 'Salvando...';
        try {
            const response = await fetch('/api/progresso', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ aluno_id: currentUser.id, aula_id: aulaId })
            });
            if (!response.ok) throw new Error('Não foi possível salvar o progresso.');
            buttonElement.textContent = 'Concluída';
            const lessonItem = buttonElement.closest('.lesson-item');
            if (lessonItem) { lessonItem.classList.add('concluida'); }
        } catch (error) {
            console.error("Erro ao marcar aula como concluída:", error);
            alert(error.message);
            buttonElement.disabled = false;
            buttonElement.textContent = 'Marcar como Concluída';
        }
    }

    // ===============================================
    // LÓGICA DE NAVEGAÇÃO E EVENTOS
    // ===============================================
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
            case 'meu-progresso': renderMyProgress(); break;
            default: 
                contentHeader.innerHTML = `<h1>${clickedItem.querySelector('span:last-child').textContent}</h1>`;
                contentBody.innerHTML = `<p>Seção em desenvolvimento.</p>`;
        }
    }

    mainContent.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('view-content-btn')) {
            showContentInModal(target.dataset.tipo, target.dataset.conteudo, target.dataset.titulo);
        } else if (target.classList.contains('complete-btn')) {
            handleMarkLessonComplete(target.dataset.aulaId, target);
        } else if (target.dataset.view === 'meus-cursos') {
            document.querySelector('[data-view=meus-cursos]').click();
        } else {
            const courseCard = target.closest('.course-card-student');
            if(courseCard){ renderCourseLessons(courseCard.dataset.courseId, courseCard.dataset.courseName); }
        }
    });

    // ===============================================
    // FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO
    // ===============================================
    function init() {
        token = localStorage.getItem('studentToken');
        if (!token) { handleLogout(); return; }
        currentUser = decodeJwt(token);
        if (!currentUser || currentUser.role !== 'student') { handleLogout(); return; }
        navItems.forEach(item => item.addEventListener('click', handleNavClick));
        renderDashboard();
        const style = document.createElement('style');
        style.innerHTML = `.view-content-btn { background: none; border: none; color: var(--cor-primaria); font-weight: 600; cursor: pointer; font-size: 1em; font-family: 'Inter', sans-serif; padding: 0; }`;
        document.head.appendChild(style);
    }
    init();
});