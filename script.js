document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content');
    const navLinks = document.querySelectorAll('.nav-item');

    let editingCourseId = null;
    let editingAlunoId = null;

    // ===============================================
    // FUNÇÕES DE CURSOS (100% CONECTADAS À API)
    // ===============================================
    const renderCourses = async () => {
        const container = document.getElementById('course-cards-container');
        if (!container) return;
        try {
            const response = await fetch('http://localhost:3000/api/cursos');
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erro ao buscar cursos.');
            const courses = result.data;
            container.innerHTML = '';
            if (courses.length === 0) {
                container.innerHTML = `<p class="empty-message">Nenhum curso cadastrado ainda. Clique em "Novo Curso" para começar!</p>`;
            } else {
                courses.forEach(course => {
                    container.innerHTML += `<div class="course-card"><div class="course-card-header"><span class="status-badge">Ativo</span><button class="btn-icon" data-action="delete-course" data-course-id="${course.id}" title="Excluir Curso"><span class="material-symbols-outlined">delete</span></button></div><div class="course-card-body"><h2>${course.name}</h2><p>${course.description}</p></div><div class="course-card-footer"><div class="course-stats"><span>0 alunos</span><span>0 aulas</span></div><div class="course-actions"><button class="btn btn-secondary" data-action="view-details-course" data-course-id="${course.id}">Ver Detalhes</button><button class="btn btn-danger" data-action="edit-course" data-course-id="${course.id}">Editar</button></div></div></div>`;
                });
            }
        } catch (error) {
            console.error("Erro ao buscar cursos:", error);
            container.innerHTML = `<p class="empty-message">Erro ao carregar os cursos. Verifique se o servidor back-end está rodando.</p>`;
        }
    };

    const handleSaveCourse = async () => {
        const courseNameInput = document.getElementById('curso-nome');
        const courseDescInput = document.getElementById('curso-descricao');
        const courseData = { name: courseNameInput.value, description: courseDescInput.value };
        if (!courseData.name || !courseData.description) { alert('Por favor, preencha todos os campos.'); return; }
        
        const url = editingCourseId 
            ? `http://localhost:3000/api/cursos/${editingCourseId}`
            : 'http://localhost:3000/api/cursos';
        const method = editingCourseId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(courseData) });
            if (!response.ok) { const errorResult = await response.json(); throw new Error(errorResult.error || 'Erro ao salvar o curso.'); }
            renderCourses();
            closeCourseModal();
        } catch (error) {
            console.error('Falha ao salvar o curso:', error);
            alert(`Não foi possível salvar o curso: ${error.message}`);
        }
    };

    const handleEditCourse = async (courseId) => {
        try {
            const response = await fetch(`http://localhost:3000/api/cursos/${courseId}`);
            if (!response.ok) { const errorResult = await response.json(); throw new Error(errorResult.error || 'Curso não encontrado.'); }
            const result = await response.json();
            const courseToEdit = result.data;
            editingCourseId = courseId;
            document.getElementById('curso-nome').value = courseToEdit.name;
            document.getElementById('curso-descricao').value = courseToEdit.description;
            document.querySelector('#modal-novo-curso .modal-header h2').textContent = 'Editar Curso';
            document.getElementById('modal-novo-curso').classList.add('active');
        } catch (error) {
            console.error('Falha ao buscar dados para edição:', error);
            alert(`Não foi possível carregar o curso para edição: ${error.message}`);
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Tem certeza que deseja excluir este curso?')) return;
        try {
            const response = await fetch(`http://localhost:3000/api/cursos/${courseId}`, { method: 'DELETE' });
            if (!response.ok) { const errorResult = await response.json(); throw new Error(errorResult.error || 'Erro ao excluir o curso.'); }
            renderCourses();
        } catch (error) {
            console.error('Falha ao excluir o curso:', error);
            alert(`Não foi possível excluir o curso: ${error.message}`);
        }
    };
    
    const handleViewCourseDetails = async (courseId) => {
        try {
            const response = await fetch(`http://localhost:3000/api/cursos/${courseId}`);
            if (!response.ok) { const errorResult = await response.json(); throw new Error(errorResult.error || 'Curso não encontrado.'); }
            const result = await response.json();
            const course = result.data;
            document.getElementById('detalhes-curso-nome').textContent = course.name;
            document.getElementById('detalhes-curso-descricao').textContent = course.description;
            document.getElementById('modal-detalhes-curso').classList.add('active');
        } catch (error) {
            console.error('Falha ao buscar detalhes do curso:', error);
            alert(`Não foi possível ver os detalhes do curso: ${error.message}`);
        }
    };
    
    const closeCourseModal = () => {
        const modal = document.getElementById('modal-novo-curso');
        if (!modal) return;
        modal.querySelector('#curso-nome').value = '';
        modal.querySelector('#curso-descricao').value = '';
        editingCourseId = null;
        modal.querySelector('.modal-header h2').textContent = 'Adicionar Novo Curso';
        modal.classList.remove('active');
    };

    // ===============================================
    // FUNÇÕES DE ALUNOS (100% CONECTADAS À API)
    // ===============================================
    const renderAlunos = async () => {
        const container = document.getElementById('student-list-container');
        if (!container) return;
        try {
            const response = await fetch('http://localhost:3000/api/alunos');
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Erro ao buscar alunos.');
            const alunos = result.data;
            container.innerHTML = '';
            if (alunos.length === 0) {
                container.innerHTML = `<p class="empty-message">Nenhum aluno cadastrado ainda. Clique em "Adicionar Aluno" para começar!</p>`;
            } else {
                alunos.forEach(aluno => {
                    container.innerHTML += `<div class="student-list-item-card"><div class="student-info"><div class="student-name-header"><strong class="student-name">${aluno.name}</strong><button class="btn-icon" data-action="delete-aluno" data-aluno-id="${aluno.id}" title="Excluir Aluno"><span class="material-symbols-outlined">delete</span></button></div><span class="student-email">${aluno.email}</span></div><div class="student-course-info"><span class="info-label">Curso</span><strong>${aluno.course}</strong></div><div class="student-progress-info"><span class="info-label">Progresso</span><strong>0%</strong></div><div class="student-activity-info"><span class="info-label">Último acesso</span><strong>Nunca</strong></div><div class="student-actions"><button class="btn btn-secondary" data-action="edit-aluno" data-aluno-id="${aluno.id}">Editar</button></div></div>`;
                });
            }
        } catch (error) {
            console.error("Erro ao buscar alunos:", error);
            container.innerHTML = `<p class="empty-message">Erro ao carregar os alunos. Verifique se o servidor back-end está rodando.</p>`;
        }
    };
    
    const handleSaveAluno = async () => {
        const alunoNameInput = document.getElementById('aluno-nome');
        const alunoEmailInput = document.getElementById('aluno-email');
        const alunoCourseSelect = document.getElementById('aluno-curso');
        const alunoData = { name: alunoNameInput.value, email: alunoEmailInput.value, course: alunoCourseSelect.value };
        if (!alunoData.name || !alunoData.email || !alunoData.course) { alert('Por favor, preencha todos os campos.'); return; }
        
        const url = editingAlunoId ? `http://localhost:3000/api/alunos/${editingAlunoId}` : 'http://localhost:3000/api/alunos';
        const method = editingAlunoId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(alunoData) });
            if (!response.ok) { const errorResult = await response.json(); throw new Error(errorResult.error || 'Erro ao salvar o aluno.'); }
            renderAlunos();
            closeAlunoModal();
        } catch (error) {
            console.error('Falha ao salvar o aluno:', error);
            alert(`Não foi possível salvar o aluno: ${error.message}`);
        }
    };
    
    const handleEditAluno = async (alunoId) => {
        try {
            const response = await fetch(`http://localhost:3000/api/alunos/${alunoId}`);
            if (!response.ok) { const errorResult = await response.json(); throw new Error(errorResult.error || 'Aluno não encontrado.'); }
            const result = await response.json();
            const alunoToEdit = result.data;
            editingAlunoId = alunoId;
            document.getElementById('aluno-nome').value = alunoToEdit.name;
            document.getElementById('aluno-email').value = alunoToEdit.email;
            document.getElementById('aluno-curso').value = alunoToEdit.course;
            document.querySelector('#modal-novo-aluno .modal-header h2').textContent = 'Editar Aluno';
            document.getElementById('modal-novo-aluno').classList.add('active');
        } catch (error) {
            console.error('Falha ao buscar dados do aluno para edição:', error);
            alert(`Não foi possível carregar o aluno para edição: ${error.message}`);
        }
    };

    const handleDeleteAluno = async (alunoId) => {
        if (!window.confirm('Tem certeza que deseja excluir este aluno?')) return;
        try {
            const response = await fetch(`http://localhost:3000/api/alunos/${alunoId}`, { method: 'DELETE' });
            if (!response.ok) { const errorResult = await response.json(); throw new Error(errorResult.error || 'Erro ao excluir o aluno.'); }
            renderAlunos();
        } catch (error) {
            console.error('Falha ao excluir o aluno:', error);
            alert(`Não foi possível excluir o aluno: ${error.message}`);
        }
    };

    const closeAlunoModal = () => {
        const modal = document.getElementById('modal-novo-aluno');
        if (!modal) return;
        modal.querySelector('#aluno-nome').value = '';
        modal.querySelector('#aluno-email').value = '';
        modal.querySelector('#aluno-curso').value = '';
        editingAlunoId = null;
        modal.querySelector('.modal-header h2').textContent = 'Adicionar Novo Aluno';
        modal.classList.remove('active');
    };

    // ===============================================
    // GERENCIADOR DE CLIQUES E NAVEGAÇÃO
    // ===============================================
    document.addEventListener('click', (event) => {
        const target = event.target;
        const openModalButton = target.closest('[data-open-modal]');
        const actionButton = target.closest('[data-action]');
        if (openModalButton) { const modalId = openModalButton.dataset.openModal; document.getElementById(modalId)?.classList.add('active'); return; }
        const closeButton = target.closest('.close-button');
        if (closeButton || (actionButton && actionButton.dataset.action === 'cancel')) {
            const modalToClose = target.closest('.modal');
            if (modalToClose && modalToClose.id === 'modal-novo-curso') closeCourseModal();
            else if (modalToClose && modalToClose.id === 'modal-novo-aluno') closeAlunoModal();
            else if (modalToClose) modalToClose.classList.remove('active');
            return;
        }
        if (actionButton) {
            const action = actionButton.dataset.action;
            const courseId = parseInt(actionButton.dataset.courseId, 10);
            const alunoId = parseInt(actionButton.dataset.alunoId, 10);
            if (action === 'view-details-course') handleViewCourseDetails(courseId);
            if (action === 'save-course') handleSaveCourse();
            if (action === 'save-aluno') handleSaveAluno();
            if (action === 'edit-course') handleEditCourse(courseId);
            if (action === 'edit-aluno') handleEditAluno(alunoId);
            if (action === 'delete-course') handleDeleteCourse(courseId);
            if (action === 'delete-aluno') handleDeleteAluno(alunoId);
        }
    });
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                if (modal.id === 'modal-novo-curso') closeCourseModal();
                else if (modal.id === 'modal-novo-aluno') closeAlunoModal();
                else modal.classList.remove('active');
            }
        });
    });
    async function loadPage(page) {
        mainContent.innerHTML = '<h1>Carregando...</h1>';
        try {
            const response = await fetch(`pages/${page}.html?t=${new Date().getTime()}`);
            if (!response.ok) throw new Error();
            mainContent.innerHTML = await response.text();
            if (page === 'cursos') renderCourses();
            if (page === 'alunos') renderAlunos();
        } catch (error) {
            mainContent.innerHTML = `<h1>Erro ao carregar a página.</h1><p>Verifique se o arquivo <strong>pages/${page}.html</strong> existe.</p>`;
        }
    }
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const page = link.dataset.page;
            if (!page) return;
            event.preventDefault();
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
            loadPage(page);
        });
    });
    document.querySelector('.nav-item.active').click();
});