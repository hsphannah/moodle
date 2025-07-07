document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content');
    const navLinks = document.querySelectorAll('.nav-item');

    let editingCourseId = null;
    let editingAlunoId = null;

    // ===============================================
    // LÓGICA DE DADOS (localStorage)
    // ===============================================
    const getCourses = () => JSON.parse(localStorage.getItem('courses')) || [];
    const saveCourses = (courses) => localStorage.setItem('courses', JSON.stringify(courses));
    const getAlunos = () => JSON.parse(localStorage.getItem('alunos')) || [];
    const saveAlunos = (alunos) => localStorage.setItem('alunos', JSON.stringify(alunos));

    // ===============================================
    // FUNÇÕES DE CURSOS
    // ===============================================
    const renderCourses = () => {
        const container = document.getElementById('course-cards-container');
        if (!container) return;
        const courses = getCourses();
        container.innerHTML = '';
        if (courses.length === 0) {
            container.innerHTML = `<p class="empty-message">Nenhum curso cadastrado ainda. Clique em "Novo Curso" para começar!</p>`;
        } else {
            courses.forEach(course => {
                container.innerHTML += `
                    <div class="course-card">
                        <div class="course-card-header">
                            <span class="status-badge">Ativo</span>
                            <button class="btn-icon" data-action="delete-course" data-course-id="${course.id}" title="Excluir Curso">
                                <span class="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                        <div class="course-card-body"><h2>${course.name}</h2><p>${course.description}</p></div>
                        <div class="course-card-footer">
                            <div class="course-stats"><span>0 alunos</span><span>0 aulas</span></div>
                            <div class="course-actions">
                                <button class="btn btn-secondary" data-action="view-details-course" data-course-id="${course.id}">Ver Detalhes</button>
                                <button class="btn btn-danger" data-action="edit-course" data-course-id="${course.id}">Editar</button>
                            </div>
                        </div>
                    </div>`;
            });
        }
    };

    const handleViewCourseDetails = (courseId) => {
        const courses = getCourses();
        const course = courses.find(c => c.id === courseId);
        if (!course) return;
        document.getElementById('detalhes-curso-nome').textContent = course.name;
        document.getElementById('detalhes-curso-descricao').textContent = course.description;
        document.getElementById('detalhes-curso-alunos').textContent = '0';
        document.getElementById('detalhes-curso-aulas').textContent = '0';
        document.getElementById('modal-detalhes-curso').classList.add('active');
    };

    const handleSaveCourse = () => {
        const courseNameInput = document.getElementById('curso-nome');
        const courseDescInput = document.getElementById('curso-descricao');
        if (!courseNameInput || !courseDescInput) return;
        const courses = getCourses();
        if (editingCourseId) {
            const courseToUpdate = courses.find(course => course.id === editingCourseId);
            if (courseToUpdate) {
                courseToUpdate.name = courseNameInput.value;
                courseToUpdate.description = courseDescInput.value;
            }
        } else {
            const newCourse = { id: Date.now(), name: courseNameInput.value, description: courseDescInput.value };
            if (!newCourse.name || !newCourse.description) { alert('Por favor, preencha todos os campos.'); return; }
            courses.push(newCourse);
        }
        saveCourses(courses);
        renderCourses();
        closeCourseModal();
    };

    const handleEditCourse = (courseId) => {
        const courses = getCourses();
        const courseToEdit = courses.find(course => course.id === courseId);
        if (!courseToEdit) return;
        editingCourseId = courseId;
        document.getElementById('curso-nome').value = courseToEdit.name;
        document.getElementById('curso-descricao').value = courseToEdit.description;
        document.querySelector('#modal-novo-curso .modal-header h2').textContent = 'Editar Curso';
        document.getElementById('modal-novo-curso').classList.add('active');
    };

    const handleDeleteCourse = (courseId) => {
        if (!window.confirm('Tem certeza que deseja excluir este curso?')) return;
        let courses = getCourses();
        courses = courses.filter(course => course.id !== courseId);
        saveCourses(courses);
        renderCourses();
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
    // FUNÇÕES DE ALUNOS
    // ===============================================
    const renderAlunos = () => {
        const container = document.getElementById('student-list-container');
        if (!container) return;
        const alunos = getAlunos();
        container.innerHTML = '';
        if (alunos.length === 0) {
            container.innerHTML = `<p class="empty-message">Nenhum aluno cadastrado ainda. Clique em "Adicionar Aluno" para começar!</p>`;
        } else {
            alunos.forEach(aluno => {
                container.innerHTML += `
                    <div class="student-list-item-card">
                        <div class="student-info">
                            <div class="student-name-header">
                                <strong class="student-name">${aluno.name}</strong>
                                <button class="btn-icon" data-action="delete-aluno" data-aluno-id="${aluno.id}" title="Excluir Aluno">
                                    <span class="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                            <span class="student-email">${aluno.email}</span>
                        </div>
                        <div class="student-course-info"><span class="info-label">Curso</span><strong>${aluno.course}</strong></div>
                        <div class="student-progress-info"><span class="info-label">Progresso</span><strong>0%</strong></div>
                        <div class="student-activity-info"><span class="info-label">Último acesso</span><strong>Nunca</strong></div>
                        <div class="student-actions">
                            <button class="btn btn-secondary" data-action="edit-aluno" data-aluno-id="${aluno.id}">Editar</button>
                        </div>
                    </div>`;
            });
        }
    };
    
    const handleSaveAluno = () => {
        const alunoNameInput = document.getElementById('aluno-nome');
        const alunoEmailInput = document.getElementById('aluno-email');
        const alunoCourseSelect = document.getElementById('aluno-curso');
        if (!alunoNameInput || !alunoEmailInput || !alunoCourseSelect) return;
        const alunos = getAlunos();
        if (editingAlunoId) {
            const alunoToUpdate = alunos.find(aluno => aluno.id === editingAlunoId);
            if (alunoToUpdate) {
                alunoToUpdate.name = alunoNameInput.value;
                alunoToUpdate.email = alunoEmailInput.value;
                alunoToUpdate.course = alunoCourseSelect.value;
            }
        } else {
            const newAluno = { id: Date.now(), name: alunoNameInput.value, email: alunoEmailInput.value, course: alunoCourseSelect.value };
            if (!newAluno.name || !newAluno.email || !alunoCourseSelect.value) { alert('Por favor, preencha todos os campos.'); return; }
            alunos.push(newAluno);
        }
        saveAlunos(alunos);
        renderAlunos();
        closeAlunoModal();
    };
    
    const handleEditAluno = (alunoId) => {
        const alunos = getAlunos();
        const alunoToEdit = alunos.find(aluno => aluno.id === alunoId);
        if (!alunoToEdit) return;
        editingAlunoId = alunoId;
        document.getElementById('aluno-nome').value = alunoToEdit.name;
        document.getElementById('aluno-email').value = alunoToEdit.email;
        document.getElementById('aluno-curso').value = alunoToEdit.course;
        document.querySelector('#modal-novo-aluno .modal-header h2').textContent = 'Editar Aluno';
        document.getElementById('modal-novo-aluno').classList.add('active');
    };

    const handleDeleteAluno = (alunoId) => {
        if (!window.confirm('Tem certeza que deseja excluir este aluno?')) return;
        let alunos = getAlunos();
        alunos = alunos.filter(aluno => aluno.id !== alunoId);
        saveAlunos(alunos);
        renderAlunos();
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
    // GERENCIADOR DE CLIQUES CENTRAL
    // ===============================================
    document.addEventListener('click', (event) => {
        const target = event.target;
        const openModalButton = target.closest('[data-open-modal]');
        const actionButton = target.closest('[data-action]');
        
        if (openModalButton) {
            const modalId = openModalButton.dataset.openModal;
            document.getElementById(modalId)?.classList.add('active');
            return;
        }

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

    // ===============================================
    // NAVEGAÇÃO DE PÁGINAS
    // ===============================================
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

    // Carregamento inicial
    document.querySelector('.nav-item.active').click();
});