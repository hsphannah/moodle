document.addEventListener('DOMContentLoaded', () => {
    
    const contentArea = document.querySelector('.student-content');
    const navItems = document.querySelectorAll('.student-sidebar .nav-item');
    const studentSelector = document.getElementById('student-selector');
    
    let currentAlunoId = null;

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
        const tokenDeTeste = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBhY2FkZW1pYS5jb20iLCJpYXQiOjE3NTIwOTY0OTQsImV4cCI6MTc1MjEwMDA5NH0.lC-s4e_r6Rs2CUDBM9WFrtByQH1PS0UXM90zgQIFDaA'; 
        if (tokenDeTeste === 'COLE_SEU_TOKEN_AQUI') {
            console.warn("Atenção: Token de teste não foi configurado no portal.js.");
        }
        saveToken(tokenDeTeste);
    };

    // ===============================================
    // FUNÇÕES DE AÇÃO DO ALUNO
    // ===============================================
    const handleEnrollment = async (courseId) => {
        if (!currentAlunoId) { alert("Por favor, selecione um aluno no menu superior."); return; }
        const token = getToken();
        if (!token || token === 'COLE_SEU_TOKEN_AQUI') { alert('Token de teste não configurado.'); return; }

        const enrollmentData = { aluno_id: currentAlunoId, curso_id: courseId };
        try {
            const response = await fetch('http://localhost:3000/api/inscricoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(enrollmentData)
            });
            const result = await response.json();
            if (!response.ok) { throw new Error(result.message || 'Não foi possível realizar a inscrição.'); }
            alert(result.message);
            const meusCursosLink = document.querySelector('[data-view="meus-cursos"]');
            if(meusCursosLink) meusCursosLink.parentElement.click();
        } catch (error) {
            console.error("Erro na inscrição:", error);
            alert(`Erro: ${error.message}`);
        }
    };
    
    const handleMarkLessonComplete = async (aulaId, cursoId, cursoNome) => {
        if (!currentAlunoId) { alert("Por favor, selecione um aluno no menu superior."); return; }
        const token = getToken();
        if (!token || token === 'COLE_SEU_TOKEN_AQUI') { alert('Token de teste não configurado.'); return; }
        try {
            const response = await fetch('http://localhost:3000/api/progresso', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ aluno_id: currentAlunoId, aula_id: aulaId })
            });
            if (!response.ok) throw new Error('Falha ao salvar progresso.');
            
            renderCourseLessons(cursoId, cursoNome);
        } catch (error) {
            console.error("Erro ao marcar aula como concluída:", error);
            alert(`Erro: ${error.message}`);
        }
    };

    // ===============================================
    // FUNÇÕES DE RENDERIZAÇÃO DE CONTEÚDO
    // ===============================================
    const renderDashboard = () => {
        contentArea.querySelector('.content-header h1').textContent = 'Dashboard';
        const contentBody = contentArea.querySelector('.content-body');
        if(currentAlunoId) {
            contentBody.innerHTML = `<p>Bem-vindo ao seu portal! Aqui ficará um resumo das suas atividades.</p>`;
        } else {
            contentBody.innerHTML = `<p class="empty-message">Por favor, selecione um aluno no menu superior para começar a simulação.</p>`;
        }
    };

    const renderPlaceholder = (pageTitle) => {
        contentArea.querySelector('.content-header h1').textContent = pageTitle;
        contentArea.querySelector('.content-body').innerHTML = `<p>Conteúdo da página "${pageTitle}" em construção.</p>`;
    };

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
        if (!currentAlunoId) { contentBody.innerHTML = `<p class="empty-message">Selecione um aluno no menu superior para ver seus cursos.</p>`; return; }
        contentBody.innerHTML = `<p>Carregando seus cursos...</p>`;
        const token = getToken();
        if (!token || token === 'COLE_SEU_TOKEN_AQUI') { contentBody.innerHTML = `<p class="empty-message">Autenticação necessária.</p>`; return; }
        try {
            const response = await fetch(`http://localhost:3000/api/alunos/${currentAlunoId}/cursos`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) { if (response.status === 401 || response.status === 403) throw new Error('Sessão inválida ou expirada.'); const result = await response.json(); throw new Error(result.error || 'Não foi possível buscar os cursos.'); }
            const result = await response.json();
            const courses = result.data;
            contentBody.innerHTML = ''; 
            const container = document.createElement('div');
            container.className = 'course-cards-container';
            if (courses.length === 0) {
                container.innerHTML = `<p class="empty-message">Você ainda não está inscrito em nenhum curso.</p>`;
            } else {
                courses.forEach(course => {
                    container.innerHTML += `<div class="course-card"><div class="course-card-body"><h2>${course.name}</h2><p>${course.description}</p></div><div class="course-card-footer"><button class="btn btn-primary" style="width:100%;" data-action="view-lessons" data-course-id="${course.id}" data-course-name="${course.name}">Acessar Curso</button></div></div>`;
                });
            }
            contentBody.appendChild(container);
        } catch (error) {
            console.error("Erro ao buscar cursos do aluno:", error);
            contentBody.innerHTML = `<p class="empty-message">${error.message}</p>`;
        }
    };

    const createLessonContent = (lesson) => {
        const contentDiv = document.createElement('div');
        switch (lesson.tipo) {
            case 'Vídeo':
                let videoId = '';
                try {
                    const url = new URL(lesson.conteudo);
                    if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
                        videoId = url.searchParams.get('v');
                    } else if (url.hostname === 'youtu.be') {
                        videoId = url.pathname.slice(1);
                    }
                } catch (e) { console.error("URL de vídeo inválida:", lesson.conteudo); }
                if (videoId) {
                    contentDiv.innerHTML = `<div class="video-container"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
                } else {
                    contentDiv.innerHTML = `<p>Link do vídeo inválido. Verifique o conteúdo no painel de admin.</p>`;
                }
                break;
            case 'PDF':
            case 'Imagem':
                contentDiv.innerHTML = `<a href="http://localhost:3000${lesson.conteudo}" target="_blank" class="btn btn-primary">Ver ${lesson.tipo}</a>`;
                break;
            case 'Texto':
                contentDiv.innerHTML = `<p>${lesson.conteudo.replace(/\n/g, '<br>')}</p>`;
                break;
            default:
                contentDiv.innerHTML = `<p>Tipo de conteúdo não suportado.</p>`;
        }
        return contentDiv;
    };

    const renderCourseLessons = async (courseId, courseName) => {
        contentArea.querySelector('.content-header h1').textContent = courseName || 'Aulas do Curso';
        const contentBody = contentArea.querySelector('.content-body');
        if (!currentAlunoId) { contentBody.innerHTML = `<p class="empty-message">Selecione um aluno.</p>`; return; }
        contentBody.innerHTML = `<p>Carregando aulas...</p>`;
        const token = getToken();
        if (!token || token === 'COLE_SEU_TOKEN_AQUI') { contentBody.innerHTML = `<p>Autenticação necessária.</p>`; return; }
        try {
            const response = await fetch(`http://localhost:3000/api/alunos/${currentAlunoId}/cursos/${courseId}/aulas`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Não foi possível carregar as aulas.');
            const result = await response.json();
            const lessons = result.data;
            contentBody.innerHTML = '';
            if (lessons.length === 0) {
                contentBody.innerHTML = `<p class="empty-message">Nenhuma aula encontrada para este curso.</p>`;
            } else {
                lessons.forEach(lesson => {
                    const lessonElement = document.createElement('div');
                    lessonElement.className = 'lesson-list-item';
                    lessonElement.innerHTML = `
                        <div class="lesson-item-header" data-action="toggle-lesson-content">
                            <div class="lesson-info">
                                <span class="material-symbols-outlined">${lesson.tipo === 'Vídeo' ? 'videocam' : 'description'}</span>
                                <strong>${lesson.titulo}</strong>
                            </div>
                            <div class="lesson-actions">
                                ${lesson.concluida ? '<span class="status-badge paid">Concluído</span>' : `<button class="btn btn-secondary btn-sm" data-action="mark-complete" data-aula-id="${lesson.id}" data-curso-id="${courseId}" data-curso-name="${courseName}">Marcar como Concluída</button>`}
                            </div>
                        </div>
                        <div class="lesson-item-content" style="display: none;"></div>
                    `;
                    const contentContainer = lessonElement.querySelector('.lesson-item-content');
                    contentContainer.appendChild(createLessonContent(lesson));
                    contentBody.appendChild(lessonElement);
                });
            }
        } catch (error) {
            console.error("Erro ao renderizar aulas do curso:", error);
            contentBody.innerHTML = `<p class="empty-message">${error.message}</p>`;
        }
    };

    const renderMyProgress = async () => {
        contentArea.querySelector('.content-header h1').textContent = 'Meu Progresso';
        const contentBody = contentArea.querySelector('.content-body');
        if (!currentAlunoId) { contentBody.innerHTML = `<p class="empty-message">Selecione um aluno no menu superior para ver o progresso.</p>`; return; }
        contentBody.innerHTML = `<p>Carregando seu progresso...</p>`;
        const token = getToken();
        if (!token || token === 'COLE_SEU_TOKEN_AQUI') { contentBody.innerHTML = `<p class="empty-message">Autenticação necessária.</p>`; return; }
        try {
            const response = await fetch(`http://localhost:3000/api/alunos/${currentAlunoId}/progresso`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Não foi possível carregar seu progresso.');
            const result = await response.json();
            const progressData = result.data;
            contentBody.innerHTML = '';
            if (progressData.length === 0) {
                contentBody.innerHTML = `<p class="empty-message">Você não tem nenhum progresso para ser exibido.</p>`;
            } else {
                const container = document.createElement('div');
                container.className = 'progress-container';
                progressData.forEach(item => {
                    const percentage = item.total_aulas > 0 ? (item.aulas_concluidas / item.total_aulas) * 100 : 0;
                    container.innerHTML += `<div class="progress-card"><h3>${item.curso_nome}</h3><div class="progress-bar-wrapper"><div class="progress-bar" style="width: ${percentage.toFixed(0)}%;"></div></div><div class="progress-details"><span>${percentage.toFixed(0)}% concluído</span><span>${item.aulas_concluidas} de ${item.total_aulas} aulas</span></div></div>`;
                });
                contentBody.appendChild(container);
            }
        } catch (error) { console.error("Erro ao renderizar progresso:", error); contentBody.innerHTML = `<p class="empty-message">${error.message}</p>`; }
    };

    // GERENCIADORES DE EVENTOS E INICIALIZAÇÃO
    const populateStudentSelector = async () => {
        const token = getToken();
        if (!token || token === 'COLE_SEU_TOKEN_AQUI' || !studentSelector) return;
        try {
            const response = await fetch('http://localhost:3000/api/alunos', { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (!response.ok) throw new Error('Falha ao buscar alunos');
            studentSelector.innerHTML = '<option value="">-- Selecione um aluno para simular --</option>';
            result.data.forEach(aluno => {
                studentSelector.innerHTML += `<option value="${aluno.id}">${aluno.name}</option>`;
            });
        } catch (error) {
            console.error(error);
            studentSelector.innerHTML = '<option value="">Erro ao carregar alunos</option>';
        }
    };

    studentSelector.addEventListener('change', () => {
        currentAlunoId = studentSelector.value ? parseInt(studentSelector.value, 10) : null;
        const activeNavItem = document.querySelector('.student-sidebar .nav-item.active a');
        if (activeNavItem && activeNavItem.dataset.view) {
            activeNavItem.parentElement.click();
        } else {
            renderDashboard();
        }
    });

    contentArea.addEventListener('click', (event) => {
        const actionTarget = event.target.closest('[data-action]');
        if (!actionTarget) return;
        
        const action = actionTarget.dataset.action;
        if (action === 'enroll') { handleEnrollment(parseInt(actionTarget.dataset.courseId)); }
        if (action === 'view-lessons') { renderCourseLessons(parseInt(actionTarget.dataset.courseId), actionTarget.dataset.courseName); }
        if (action === 'mark-complete') { handleMarkLessonComplete(parseInt(actionTarget.dataset.aulaId), parseInt(actionTarget.dataset.cursoId), actionTarget.dataset.cursoName); }
        if (action === 'toggle-lesson-content') {
            const contentDiv = actionTarget.parentElement.querySelector('.lesson-item-content');
            if (contentDiv) {
                const isVisible = contentDiv.style.display === 'block';
                contentDiv.style.display = isVisible ? 'none' : 'block';
            }
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
                case 'meu-progresso': renderMyProgress(); break;
                default: renderPlaceholder(link.querySelector('span:not(.material-symbols-outlined)').textContent);
            }
        });
    });

    simularLoginParaTeste();
    populateStudentSelector();
    renderDashboard();
});