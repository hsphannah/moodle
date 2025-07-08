// portal.js

document.addEventListener('DOMContentLoaded', () => {
    
    const contentArea = document.querySelector('.student-content');
    const navItems = document.querySelectorAll('.student-sidebar .nav-item');
    
    const loggedInAlunoId = 1;

    // ===============================================
    // LÓGICA DE AUTENTICAÇÃO (SIMULADA)
    // ===============================================
    const getToken = () => {
        return localStorage.getItem('adminToken');
    };

    const saveToken = (token) => {
        localStorage.setItem('adminToken', token);
    };

    const simularLoginParaTeste = () => {
        const tokenDeTeste = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBhY2FkZW1pYS5jb20iLCJpYXQiOjE3NTE5OTg1NzUsImV4cCI6MTc1MjAwMjE3NX0.qpyR9_ivHhOB4VOz1DONT9F2dXRL4d-vXIoiacKO-H0'; 
        
        // CORREÇÃO: Comparar com o placeholder original
        if (tokenDeTeste === 'COLE_SEU_TOKEN_AQUI') {
            console.warn("Atenção: Token de teste não foi configurado no portal.js. As requisições para rotas protegidas vão falhar.");
        }
        saveToken(tokenDeTeste);
    };

    // ===============================================
    // FUNÇÃO DE AÇÃO (INSCRIÇÃO)
    // ===============================================
    const handleEnrollment = async (courseId) => {
        const token = getToken();
        
        // CORREÇÃO: Comparar com o placeholder original
        if (!token || token === 'COLE_SEU_TOKEN_AQUI') {
            alert('Você não está autenticado para realizar esta ação. Por favor, configure o token de teste no arquivo portal.js.');
            return;
        }

        const enrollmentData = {
            aluno_id: loggedInAlunoId,
            curso_id: courseId
        };

        try {
            const response = await fetch('http://localhost:3000/api/inscricoes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(enrollmentData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Não foi possível realizar a inscrição.');
            }

            alert(result.message);
            const meusCursosLink = document.querySelector('[data-view="meus-cursos"]');
            if (meusCursosLink) {
                 // Simula um clique no elemento <li> pai do link <a>
                meusCursosLink.parentElement.click();
            }

        } catch (error) {
            console.error("Erro na inscrição:", error);
            alert(`Erro: ${error.message}`);
        }
    };


    // ===============================================
    // FUNÇÕES DE RENDERIZAÇÃO DE CONTEÚDO
    // ===============================================
    
    const renderAllCourses = async () => {
        contentArea.querySelector('.content-header h1').textContent = 'Todos os Cursos';
        const contentBody = contentArea.querySelector('.content-body');
        contentBody.innerHTML = `<p>Carregando cursos...</p>`;
        try {
            const response = await fetch(`http://localhost:3000/api/cursos`);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Não foi possível buscar os cursos.');
            const courses = result.data;
            contentBody.innerHTML = '';
            const container = document.createElement('div');
            container.className = 'course-cards-container';
            if (courses.length === 0) {
                container.innerHTML = `<p class="empty-message">Nenhum curso disponível no momento.</p>`;
            } else {
                courses.forEach(course => {
                    container.innerHTML += `<div class="course-card"><div class="course-card-body"><h2>${course.name}</h2><p>${course.description}</p></div><div class="course-card-footer"><button class="btn btn-primary" style="width:100%;" data-action="enroll" data-course-id="${course.id}">Inscreva-se</button></div></div>`;
                });
            }
            contentBody.appendChild(container);
        } catch (error) {
            console.error("Erro ao buscar todos os cursos:", error);
            contentBody.innerHTML = `<p class="empty-message">Ocorreu um erro ao carregar os cursos.</p>`;
        }
    };

    const renderMyCourses = async () => {
        contentArea.querySelector('.content-header h1').textContent = 'Meus Cursos';
        const contentBody = contentArea.querySelector('.content-body');
        contentBody.innerHTML = `<p>Carregando seus cursos...</p>`;
        const token = getToken();
        if (!token || token === 'COLE_SEU_TOKEN_AQUI') {
            contentBody.innerHTML = `<p class="empty-message">Você não está autenticado. Configure o token de teste ou faça login.</p>`;
            return;
        }
        try {
            const response = await fetch(`http://localhost:3000/api/alunos/${loggedInAlunoId}/cursos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) throw new Error('Sessão inválida ou expirada.');
                const result = await response.json();
                throw new Error(result.error || 'Não foi possível buscar os cursos.');
            }
            const result = await response.json();
            const courses = result.data;
            contentBody.innerHTML = ''; 
            const container = document.createElement('div');
            container.className = 'course-cards-container';
            if (courses.length === 0) {
                container.innerHTML = `<p class="empty-message">Você ainda não está inscrito em nenhum curso.</p>`;
            } else {
                courses.forEach(course => {
                    container.innerHTML += `<div class="course-card"><div class="course-card-body"><h2>${course.name}</h2><p>${course.description}</p></div><div class="course-card-footer"><button class="btn btn-primary" style="width:100%;">Acessar Curso</button></div></div>`;
                });
            }
            contentBody.appendChild(container);
        } catch (error) {
            console.error("Erro ao buscar cursos do aluno:", error);
            contentBody.innerHTML = `<p class="empty-message">${error.message}</p>`;
        }
    };
    
    const renderDashboard = () => {
        contentArea.querySelector('.content-header h1').textContent = 'Dashboard';
        contentArea.querySelector('.content-body').innerHTML = '<p>Bem-vindo ao seu portal! Aqui ficará um resumo das suas atividades.</p>';
    };

    const renderPlaceholder = (pageTitle) => {
        contentArea.querySelector('.content-header h1').textContent = pageTitle;
        contentArea.querySelector('.content-body').innerHTML = `<p>Conteúdo da página "${pageTitle}" em construção.</p>`;
    };

    // ===============================================
    // GERENCIADORES DE EVENTOS
    // ===============================================

    contentArea.addEventListener('click', (event) => {
        const actionButton = event.target.closest('[data-action="enroll"]');
        if (actionButton) {
            const courseId = parseInt(actionButton.dataset.courseId, 10);
            handleEnrollment(courseId);
        }
    });

    navItems.forEach(item => {
        item.addEventListener('click', (event) => {
            const link = item.querySelector('a');
            const view = link.dataset.view;
            if (!view) return;
            event.preventDefault();
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            switch (view) {
                case 'dashboard': renderDashboard(); break;
                case 'meus-cursos': renderMyCourses(); break;
                case 'todos-os-cursos': renderAllCourses(); break;
                default: renderPlaceholder(link.querySelector('span:not(.material-symbols-outlined)').textContent);
            }
        });
    });

    // Inicia o processo
    simularLoginParaTeste();
    renderDashboard();
});