// portal.js - Versão Final e Corrigida

document.addEventListener('DOMContentLoaded', () => {
    
    const contentArea = document.querySelector('.student-content');
    const navItems = document.querySelectorAll('.student-sidebar .nav-item');
    const studentSelector = document.getElementById('student-selector');
    
    let currentAlunoId = null;

    const getToken = () => localStorage.getItem('adminToken');

      // ========================
    // FUNÇÕES DE AÇÃO DO ALUNO 
    // ==========================

    const handleEnrollment = async (courseId) => {
        try {
            const response = await fetch('/api/inscricoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
                // O backend usará o ID do token, mas enviamos o ID do aluno por segurança
                body: JSON.stringify({ aluno_id: studentId, curso_id: courseId })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Não foi possível realizar a inscrição.');
            alert(result.message);
            document.querySelector('[data-view="meus-cursos"]')?.click();
        } catch (error) {
            console.error("Erro na inscrição:", error);
            alert(`Erro: ${error.message}`);
        }
    };
    
    const handleMarkLessonComplete = async (aulaId, cursoId, cursoNome) => {
        try {
            await fetch('/api/progresso', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
                body: JSON.stringify({ aluno_id: studentId, aula_id: aulaId })
            });
            renderCourseLessons(cursoId, cursoNome);
        } catch (error) {
            console.error("Erro ao marcar aula como concluída:", error);
            alert(`Erro: ${error.message}`);
        }
    };

    // ===============================================
    // FUNÇÕES DE RENDERIZAÇÃO DE CONTEÚDO
    // ===============================================
    const renderDashboard = () => { /* ... sem alterações ... */ };
    const renderPlaceholder = (pageTitle) => { /* ... sem alterações ... */ };

    const renderAllCourses = async () => {
        if (!contentArea) return;
        contentArea.querySelector('.content-header h1').textContent = 'Todos os Cursos';
        const contentBody = contentArea.querySelector('.content-body');
        contentBody.innerHTML = `<p>Carregando cursos...</p>`;
        try {
            const response = await fetch(`/api/cursos`); // CORRIGIDO
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Não foi possível buscar os cursos.');
            // ... resto da função igual ...
        } catch (error) { /* ... */ }
    };

    const renderMyCourses = async () => {
        if (!contentArea) return;
        contentArea.querySelector('.content-header h1').textContent = 'Meus Cursos';
        const contentBody = contentArea.querySelector('.content-body');
        if (!currentAlunoId) { /* ... */ return; }
        contentBody.innerHTML = `<p>Carregando seus cursos...</p>`;
        const token = getToken();
        if (!token) { /* ... */ return; }

        try {
            const response = await fetch(`/api/alunos/${currentAlunoId}/cursos`, { headers: { 'Authorization': `Bearer ${token}` } }); // CORRIGIDO
            if (!response.ok) { 
                if (response.status === 401 || response.status === 403) throw new Error('Sessão inválida ou expirada.');
                const result = await response.json();
                throw new Error(result.error || 'Não foi possível buscar os cursos.');
            }
            // ... resto da função igual ...
        } catch (error) { /* ... */ }
    };
    
    const createLessonContent = (lesson) => {
        const contentDiv = document.createElement('div');
        const tipo = lesson.tipo.toLowerCase();

        if (tipo.includes('vídeo')) {
            if (lesson.conteudo && lesson.conteudo.startsWith('/uploads/')) {
                contentDiv.innerHTML = `
                    <div class="video-container">
                        <video controls width="100%">
                            <source src="${lesson.conteudo}" type="video/mp4">
                        </video>
                    </div>`; // CORRIGIDO: removido localhost
            } else {
                let videoId = null;
                try {
                    const url = new URL(lesson.conteudo);
                    if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
                        videoId = url.searchParams.get('v');
                    } else if (url.hostname === 'youtu.be') {
                        videoId = url.pathname.slice(1);
                    }
                } catch (e) { console.error("URL de vídeo inválida:", lesson.conteudo); }

                if (videoId) {
                    contentDiv.innerHTML = `
                        <div class="video-container">
                            <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                        </div>`; // CORRIGIDO
                } else { /* ... */ }
            }
        } else if (tipo.includes('pdf') || tipo.includes('imagem')) {
            contentDiv.innerHTML = `<a href="${lesson.conteudo}" target="_blank" class="btn btn-primary">Ver ${lesson.tipo}</a>`; // CORRIGIDO
        } else if (tipo.includes('texto')) { /* ... */ } 
        else { /* ... */ }
        return contentDiv;
    };

    const renderCourseLessons = async (courseId, courseName) => {
        if (!contentArea) return;
        contentArea.querySelector('.content-header h1').textContent = courseName || 'Aulas do Curso';
        const contentBody = contentArea.querySelector('.content-body');
        if (!currentAlunoId) { /* ... */ return; }
        contentBody.innerHTML = `<p>Carregando aulas...</p>`;
        const token = getToken();
        if (!token) { /* ... */ return; }
        
        try {
            const response = await fetch(`/api/alunos/${currentAlunoId}/cursos/${courseId}/aulas`, { headers: { 'Authorization': `Bearer ${token}` } }); // CORRIGIDO
            if (!response.ok) throw new Error('Não foi possível carregar as aulas.');
            // ... resto da função igual ...
        } catch (error) { /* ... */ }
    };

    const renderMyProgress = async () => {
        if (!contentArea) return;
        contentArea.querySelector('.content-header h1').textContent = 'Meu Progresso';
        const contentBody = contentArea.querySelector('.content-body');
        if (!currentAlunoId) { /* ... */ return; }
        contentBody.innerHTML = `<p>Carregando seu progresso...</p>`;
        const token = getToken();
        if (!token) { /* ... */ return; }
        
        try {
            const response = await fetch(`/api/alunos/${currentAlunoId}/progresso`, { headers: { 'Authorization': `Bearer ${token}` } }); // CORRIGIDO
            if (!response.ok) throw new Error('Não foi possível carregar seu progresso.');
            // ... resto da função igual ...
        } catch (error) { /* ... */ }
    };

    // ===============================================
    // GERENCIADORES DE EVENTOS E INICIALIZAÇÃO
    // ===============================================
    const populateStudentSelector = async () => {
        const token = getToken();
        if (!token || !studentSelector) return;
        try {
            const response = await fetch('/api/alunos', { headers: { 'Authorization': `Bearer ${token}` } }); // CORRIGIDO
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
    
});