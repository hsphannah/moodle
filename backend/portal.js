// portal.js - Versão Final e Corrigida

document.addEventListener('DOMContentLoaded', () => {
    
    // ===============================================
    // SELETORES E VARIÁVEIS GLOBAIS
    // ===============================================
    const contentArea = document.querySelector('.main-content');
    const navItems = document.querySelectorAll('.nav-item');
    const studentSelector = document.getElementById('student-selector');
    
    let currentAlunoId = null; 

    const getToken = () => localStorage.getItem('adminToken'); // Simula pegar um token de admin

    // ========================================================
    // LÓGICA DE NAVEGAÇÃO PRINCIPAL 
    // ========================================================
    const handleNavClick = (event) => {
        event.preventDefault(); 

        const clickedItem = event.currentTarget;
        const view = clickedItem.dataset.view;

        if (!view) return;

        navItems.forEach(item => item.classList.remove('active'));
        clickedItem.classList.add('active');

        switch (view) {
            case 'dashboard':
                renderDashboard();
                break;
            case 'meus-cursos':
                renderMyCourses();
                break;
            case 'todos-os-cursos':
                renderAllCourses();
                break;
            case 'meu-progresso':
                renderMyProgress();
                break;
            case 'aulas-ao-vivo':
            case 'mensalidades':
            case 'mensagens':
            case 'meu-perfil':
                renderPlaceholder(clickedItem.querySelector('span:last-child').textContent);
                break;
            default:
                renderDashboard();
        }
    };
    
    navItems.forEach(item => {
        if (!item.href.includes('login.html')) {
            item.addEventListener('click', handleNavClick);
        }
    });

    // ========================
    // FUNÇÕES DE AÇÃO (Exemplos)
    // ========================
    const handleEnrollment = async (courseId) => {
        if (!currentAlunoId) {
            alert('Por favor, selecione um aluno para realizar a inscrição.');
            return;
        }
        try {
            // Lógica para chamar a API de inscrição...
            console.log(`Inscrito aluno ${currentAlunoId} no curso ${courseId}`);
            alert(`Inscrição no curso ${courseId} realizada com sucesso para o aluno!`);
            document.querySelector('[data-view="meus-cursos"]')?.click(); 
        } catch (error) {
            console.error("Erro na inscrição:", error);
        }
    };
    
    // ===============================================
    // FUNÇÕES DE RENDERIZAÇÃO DE CONTEÚDO (Exemplos)
    // ===============================================
    const renderDashboard = () => {
        if (!contentArea) return;
        contentArea.querySelector('.content-header h1').textContent = 'Dashboard';
        contentArea.querySelector('.content-body').innerHTML = `
            <h2>Bem-vindo ao Portal!</h2>
            <p>Use o menu à esquerda para navegar pelas seções.</p>
            <p>Selecione um aluno no menu acima para simular a visão dele.</p>
        `;
    };

    const renderPlaceholder = (pageTitle) => {
        if (!contentArea) return;
        contentArea.querySelector('.content-header h1').textContent = pageTitle;
        contentArea.querySelector('.content-body').innerHTML = `<p>Conteúdo para <strong>${pageTitle}</strong> ainda não implementado.</p>`;
    };

    // As funções abaixo são exemplos que simulam uma chamada de API.
    // Substitua o conteúdo delas pela sua lógica real de fetch.

    const renderAllCourses = async () => {
        if (!contentArea) return;
        contentArea.querySelector('.content-header h1').textContent = 'Todos os Cursos';
        const contentBody = contentArea.querySelector('.content-body');
        contentBody.innerHTML = `<p>Carregando todos os cursos disponíveis...</p>`;
        // ... aqui viria sua chamada fetch para /api/cursos
    };

    const renderMyCourses = async () => {
        if (!contentArea) return;
        contentArea.querySelector('.content-header h1').textContent = 'Meus Cursos';
        const contentBody = contentArea.querySelector('.content-body');
        if (!currentAlunoId) {
            contentBody.innerHTML = `<p>Por favor, selecione um aluno para ver seus cursos.</p>`;
            return;
        }
        contentBody.innerHTML = `<p>Carregando cursos do aluno ${currentAlunoId}...</p>`;
        // ... aqui viria sua chamada fetch para /api/alunos/${currentAlunoId}/cursos
    };
    
    const renderMyProgress = async () => {
        if (!contentArea) return;
        contentArea.querySelector('.content-header h1').textContent = 'Meu Progresso';
        const contentBody = contentArea.querySelector('.content-body');
        if (!currentAlunoId) {
            contentBody.innerHTML = `<p>Por favor, selecione um aluno para ver o progresso.</p>`;
            return;
        }
        contentBody.innerHTML = `<p>Carregando progresso do aluno ${currentAlunoId}...</p>`;
        // ... aqui viria sua chamada fetch para /api/alunos/${currentAlunoId}/progresso
    };

    // ===============================================
    // INICIALIZAÇÃO
    // ===============================================
    const populateStudentSelector = async () => {
        if (!studentSelector) return;
        // Simulação de chamada API para buscar alunos
        try {
            const fakeStudents = [
                { id: 1, name: 'João da Silva' },
                { id: 2, name: 'Maria Oliveira' },
                { id: 3, name: 'Pedro Souza' }
            ];
            studentSelector.innerHTML = '<option value="">-- Selecione um aluno --</option>';
            fakeStudents.forEach(aluno => {
                studentSelector.innerHTML += `<option value="${aluno.id}">${aluno.name}</option>`;
            });
        } catch (error) {
            console.error(error);
            studentSelector.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    };
    
    if (studentSelector) {
        populateStudentSelector();
        studentSelector.addEventListener('change', (e) => {
            currentAlunoId = e.target.value;
            // Após mudar de aluno, atualiza a view atual (ex: se estiver em 'Meus Cursos', recarrega para o novo aluno)
            const activeView = document.querySelector('.nav-item.active');
            if(activeView) activeView.click();
        });
    }

    // Carrega a visão inicial (Dashboard)
    renderDashboard();
});