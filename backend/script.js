document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content');
    const navLinks = document.querySelectorAll('.nav-item');
    let editingCourseId = null;
    let editingAlunoId = null;
    let editingAulaId = null;
    let currentCourseIdForLessons = null;
    const getToken = () => localStorage.getItem('adminToken');

    // ===============================================
    // FUNÇÕES DE CURSOS
    // ===============================================
    const renderCourses = async () => {
        const container = document.getElementById('course-cards-container');
        if (!container) return;
        try {
            const response = await fetch('/api/cursos', { headers: { 'Authorization': `Bearer ${getToken()}` } });
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
            container.innerHTML = `<p class="empty-message">Erro ao carregar os cursos. Verifique o login ou se o servidor back-end está rodando.</p>`;
        }
    };

    const handleSaveCourse = async () => {
        const courseNameInput = document.getElementById('curso-nome');
        const courseDescInput = document.getElementById('curso-descricao');
        const courseData = { name: courseNameInput.value, description: courseDescInput.value };
        if (!courseData.name || !courseData.description) { alert('Por favor, preencha todos os campos.'); return; }
        // CORRIGIDO
        const url = editingCourseId ? `/api/cursos/${editingCourseId}` : '/api/cursos';
        const method = editingCourseId ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify(courseData) });
            if (!response.ok) { const errorResult = await response.json(); throw new Error(errorResult.error || 'Erro ao salvar o curso.'); }
            renderCourses();
            closeCourseModal();
        } catch (error) { console.error('Falha ao salvar o curso:', error); alert(`Não foi possível salvar o curso: ${error.message}`); }
    };

    const handleEditCourse = async (courseId) => {
        try {
            const response = await fetch(`/api/cursos/${courseId}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
            if (!response.ok) { const errorResult = await response.json(); throw new Error(errorResult.error || 'Curso não encontrado.'); }
            const result = await response.json(); const courseToEdit = result.data;
            editingCourseId = courseId;
            document.getElementById('curso-nome').value = courseToEdit.name;
            document.getElementById('curso-descricao').value = courseToEdit.description;
            document.querySelector('#modal-novo-curso .modal-header h2').textContent = 'Editar Curso';
            document.getElementById('modal-novo-curso').classList.add('active');
        } catch (error) { console.error('Falha ao buscar dados para edição:', error); alert(`Não foi possível carregar o curso para edição: ${error.message}`); }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Tem certeza que deseja excluir este curso?')) return;
        try {
            const response = await fetch(`/api/cursos/${courseId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
            if (!response.ok) { const errorResult = await response.json(); throw new Error(errorResult.error || 'Erro ao excluir o curso.'); }
            renderCourses();
        } catch (error) { console.error('Falha ao excluir o curso:', error); alert(`Não foi possível excluir o curso: ${error.message}`); }
    };

    const handleViewCourseDetails = async (courseId) => {
        const modal = document.getElementById('modal-detalhes-curso');
        const courseNameEl = document.getElementById('detalhes-curso-nome');
        const courseDescEl = document.getElementById('detalhes-curso-descricao');
        const studentListEl = document.getElementById('lista-alunos-inscritos');
        if (!modal) return;
        modal.dataset.currentCourseId = courseId;
        courseNameEl.textContent = 'Carregando...';
        courseDescEl.textContent = '';
        studentListEl.innerHTML = '<p>Carregando alunos...</p>';
        modal.classList.add('active');
        try {
            const [courseResponse, studentsResponse] = await Promise.all([
                fetch(`/api/cursos/${courseId}`, { headers: { 'Authorization': `Bearer ${getToken()}` } }),
                fetch(`/api/cursos/${courseId}/alunos`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
            ]);
            if (!courseResponse.ok || !studentsResponse.ok) { throw new Error('Falha ao carregar os dados.'); }
            const courseResult = await courseResponse.json();
            const studentsResult = await studentsResponse.json();
            const course = courseResult.data;
            const students = studentsResult.data;
            courseNameEl.textContent = course.name;
            courseDescEl.textContent = course.description;
            studentListEl.innerHTML = '';
            if (students.length === 0) {
                studentListEl.innerHTML = '<p>Nenhum aluno inscrito neste curso.</p>';
            } else {
                const ul = document.createElement('ul');
                ul.className = 'enrolled-student-list';
                students.forEach(student => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span>${student.name} (${student.email})</span><button class="btn btn-danger btn-sm" data-action="cancel-enrollment" data-aluno-id="${student.id}" data-curso-id="${course.id}">Remover</button>`;
                    ul.appendChild(li);
                });
                studentListEl.appendChild(ul);
            }
        } catch (error) {
            console.error('Falha ao buscar detalhes:', error);
            alert(`Não foi possível carregar os detalhes: ${error.message}`);
            modal.classList.remove('active');
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

    const handleCancelEnrollment = async (alunoId, cursoId) => {
        if (!window.confirm('Tem certeza que deseja remover a inscrição deste aluno?')) return;
        try {
            const response = await fetch('/api/inscricoes', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({ aluno_id: alunoId, curso_id: cursoId })
            });
            const result = await response.json();
            if (!response.ok) { throw new Error(result.message || 'Não foi possível cancelar a inscrição.'); }
            alert(result.message);
            handleViewCourseDetails(cursoId);
        } catch (error) {
            console.error('Erro ao cancelar inscrição:', error);
            alert(`Erro: ${error.message}`);
        }
    };

    // FUNÇÕES DE ALUNOS
    const renderAlunos = async () => {
        const container = document.getElementById('student-list-container');
        if (!container) return;
        try {
            const response = await fetch('/api/alunos', { headers: { 'Authorization': `Bearer ${getToken()}` } });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            const alunos = result.data;
            container.innerHTML = '';
            if (alunos.length === 0) {
                container.innerHTML = `<p class="empty-message">Nenhum aluno cadastrado.</p>`;
            } else {
                alunos.forEach(aluno => {
                    container.innerHTML += `<div class="student-list-item-card"><div class="student-info"><div class="student-name-header"><strong class="student-name">${aluno.name}</strong><button class="btn-icon" data-action="delete-aluno" data-aluno-id="${aluno.id}" title="Excluir Aluno"><span class="material-symbols-outlined">delete</span></button></div><span class="student-email">${aluno.email}</span></div><div class="student-course-info"><span class="info-label">Curso Principal</span><strong>--</strong></div><div class="student-progress-info"><span class="info-label">Progresso</span><strong>0%</strong></div><div class="student-activity-info"><span class="info-label">Último acesso</span><strong>Nunca</strong></div><div class="student-actions"><button class="btn btn-secondary" data-action="edit-aluno" data-aluno-id="${aluno.id}">Editar</button></div></div>`;
                });
            }
        } catch (error) {
            console.error("Erro ao buscar alunos:", error);
            container.innerHTML = `<p class="empty-message">Erro ao carregar os alunos.</p>`;
        }
    };

    const handleSaveAluno = async () => {
        const alunoNameInput = document.getElementById('aluno-nome');
        const alunoEmailInput = document.getElementById('aluno-email');
        const alunoCourseSelect = document.getElementById('aluno-curso');
        const alunoSenhaInput = document.getElementById('aluno-senha');
const alunoData = {
    name: alunoNameInput.value,
    email: alunoEmailInput.value,
    password: alunoSenhaInput.value, // Adicionamos a senha
    curso_id: alunoCourseSelect.value ? parseInt(alunoCourseSelect.value, 10) : null
};
        if (!alunoData.name || !alunoData.email) {
            alert('Preencha nome e email.');
            return;
        }
        // CORRIGIDO
        const url = editingAlunoId ? `/api/alunos/${editingAlunoId}` : '/api/alunos';
        const method = editingAlunoId ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify(alunoData)
            });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error);
            }
            renderAlunos();
            closeAlunoModal();
        } catch (error) {
            console.error('Falha ao salvar aluno:', error);
            alert(`Não foi possível salvar o aluno: ${error.message}`);
        }
    };

    const handleEditAluno = async (alunoId) => {
        await populateCoursesDropdown();
        try {
            const response = await fetch(`/api/alunos/${alunoId}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error);
            }
            const result = await response.json();
            const alunoToEdit = result.data;
            editingAlunoId = alunoId;
            document.getElementById('aluno-nome').value = alunoToEdit.name;
            document.getElementById('aluno-email').value = alunoToEdit.email;
            document.querySelector('#modal-novo-aluno .modal-header h2').textContent = 'Editar Aluno';
            document.getElementById('aluno-curso').value = "";
            document.getElementById('modal-novo-aluno').classList.add('active');
        } catch (error) {
            console.error('Falha ao buscar dados do aluno:', error);
            alert(`Não foi possível carregar o aluno para edição: ${error.message}`);
        }
    };

    const handleDeleteAluno = async (alunoId) => {
        if (!window.confirm('Tem certeza?')) return;
        try {
            const response = await fetch(`/api/alunos/${alunoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error);
            }
            renderAlunos();
        } catch (error) {
            console.error('Falha ao excluir aluno:', error);
            alert(`Não foi possível excluir o aluno: ${error.message}`);
        }
    };

    const closeAlunoModal = () => {
        const modal = document.getElementById('modal-novo-aluno');
        if (!modal) return;
        modal.querySelector('#aluno-nome').value = '';
        modal.querySelector('#aluno-email').value = '';
        modal.querySelector('#aluno-curso').innerHTML = '';
        editingAlunoId = null;
        modal.querySelector('.modal-header h2').textContent = 'Adicionar Novo Aluno';
        modal.classList.remove('active');
    };

    const populateCoursesDropdown = async () => {
        const select = document.getElementById('aluno-curso');
        if (!select) return;
        try {
            const response = await fetch('/api/cursos');
            const result = await response.json();
            if (!response.ok) throw new Error("Não foi possível carregar os cursos.");
            select.innerHTML = '<option value="">Inscrever em um curso (opcional)</option>';
            result.data.forEach(course => {
                select.innerHTML += `<option value="${course.id}">${course.name}</option>`;
            });
        } catch (error) {
            console.error("Erro ao popular cursos:", error);
            select.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    };
    
    // FUNÇÕES DE AULAS/CONTEÚDO
    const initializeContentPage = async () => {
        const dropdown = document.getElementById('course-select-dropdown');
        const lessonsArea = document.getElementById('lessons-management-area');
        if (!dropdown || !lessonsArea) return;
        dropdown.addEventListener('change', () => {
            const selectedId = dropdown.value;
            if (selectedId) {
                currentCourseIdForLessons = parseInt(selectedId, 10);
                lessonsArea.style.display = 'block';
                document.getElementById('lessons-list-header').textContent = `Aulas do Curso: ${dropdown.options[dropdown.selectedIndex].text}`;
                renderLessons(currentCourseIdForLessons);
            } else {
                lessonsArea.style.display = 'none';
                currentCourseIdForLessons = null;
            }
        });
        const tipoAulaSelect = document.getElementById('aula-tipo');
        if (tipoAulaSelect) {
            tipoAulaSelect.addEventListener('change', () => {
                const tipo = tipoAulaSelect.value;
                const inputTexto = document.getElementById('aula-conteudo-texto');
                const inputArquivo = document.getElementById('aula-conteudo-arquivo');
                if (tipo === 'PDF (Upload)' || tipo === 'Imagem (Upload)' || tipo === 'Vídeo (Upload)') {
                    inputTexto.style.display = 'none';
                    inputArquivo.style.display = 'block';
                } else {
                    inputTexto.style.display = 'block';
                    inputArquivo.style.display = 'none';
                }
            });
        }
        try {
            const response = await fetch('/api/cursos');
            const result = await response.json();
            if (!response.ok) throw new Error('Falha ao carregar cursos.');
            dropdown.innerHTML = '<option value="">-- Selecione um curso --</option>';
            result.data.forEach(course => {
                dropdown.innerHTML += `<option value="${course.id}">${course.name}</option>`;
            });
        } catch (error) {
            console.error("Erro ao popular cursos:", error);
            dropdown.innerHTML = '<option value="">Não foi possível carregar</option>';
        }
    };
    
    const renderLessons = async (courseId) => {
        const container = document.getElementById('lessons-list-container');
        if (!container) return;
        container.innerHTML = '<p>Carregando aulas...</p>';
        try {
            const response = await fetch(`/api/cursos/${courseId}/aulas`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
            if (!response.ok) throw new Error('Falha ao carregar as aulas.');
            const result = await response.json();
            const aulas = result.data;
            container.innerHTML = '';
            if (aulas.length === 0) {
                container.innerHTML = '<p class="empty-message">Nenhuma aula cadastrada para este curso.</p>';
            } else {
                aulas.forEach(aula => {
                    container.innerHTML += `<div class="lesson-list-item"><span><strong>${aula.titulo}</strong> (${aula.tipo})</span><div class="lesson-actions"><button class="btn-icon" data-action="edit-aula" data-aula-id="${aula.id}" title="Editar Aula"><span class="material-symbols-outlined">edit</span></button><button class="btn-icon" data-action="delete-aula" data-aula-id="${aula.id}" title="Excluir Aula"><span class="material-symbols-outlined">delete</span></button></div></div>`;
                });
            }
        } catch (error) {
            console.error("Erro ao renderizar aulas:", error);
            container.innerHTML = `<p class="empty-message">${error.message}</p>`;
        }
    };
    
    const handleSaveAula = async () => {
        const method = editingAulaId ? 'PUT' : 'POST';
        const formData = new FormData();
        const titulo = document.getElementById('aula-titulo').value;
        const tipo = document.getElementById('aula-tipo').value;
        const conteudoTexto = document.getElementById('aula-conteudo-texto').value;
        const conteudoArquivoInput = document.getElementById('aula-conteudo-arquivo');
        const conteudoArquivo = conteudoArquivoInput.files[0];
    
        formData.append('titulo', titulo);
        formData.append('tipo', tipo);
    
        if (method === 'POST') {
            formData.append('curso_id', currentCourseIdForLessons);
        }
    
        if (conteudoArquivo && (tipo.includes('(Upload)'))) {
            formData.append('conteudo', conteudoArquivo);
        } else {
            formData.append('conteudo', conteudoTexto);
        }
    
        if (!titulo || !tipo || (!currentCourseIdForLessons && !editingAulaId)) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        const isUpload = tipo.includes('(Upload)');
        if ((isUpload && !conteudoArquivo && method === 'POST') || (!isUpload && !conteudoTexto)) {
            alert('É necessário fornecer o conteúdo da aula (texto ou arquivo).');
            return;
        }
        // CORRIGIDO
        const url = editingAulaId ? `/api/aulas/${editingAulaId}` : '/api/aulas';
    
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${getToken()}` },
                body: formData
            });
    
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Erro desconhecido ao salvar aula');
            }
    
            renderLessons(currentCourseIdForLessons);
            closeAulaModal();
        } catch (error) {
            console.error('Falha ao salvar aula:', error);
            alert(`Não foi possível salvar a aula: ${error.message}`);
        }
    };
    
    const handleEditAula = async (aulaId) => {
        try {
            const response = await fetch(`/api/aulas/${aulaId}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
            if (!response.ok) { throw new Error('Aula não encontrada.'); }
            const result = await response.json();
            const aulaToEdit = result.data;
            editingAulaId = aulaId;
            document.getElementById('aula-titulo').value = aulaToEdit.titulo;
            document.getElementById('aula-tipo').value = aulaToEdit.tipo;
            document.getElementById('aula-tipo').dispatchEvent(new Event('change'));
            if (!aulaToEdit.tipo.includes('(Upload)')) {
                document.getElementById('aula-conteudo-texto').value = aulaToEdit.conteudo;
            }
            document.querySelector('#modal-nova-aula .modal-header h2').textContent = 'Editar Aula';
            document.getElementById('modal-nova-aula').classList.add('active');
        } catch (error) {
            console.error("Falha ao carregar aula para edição:", error);
            alert(error.message);
        }
    };
    
    const handleDeleteAula = async (aulaId) => {
        if (!window.confirm('Tem certeza que deseja excluir esta aula?')) return;
        try {
            const response = await fetch(`/api/aulas/${aulaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error);
            }
            renderLessons(currentCourseIdForLessons);
        } catch (error) {
            console.error('Falha ao excluir aula:', error);
            alert(`Não foi possível excluir a aula: ${error.message}`);
        }
    };

    const closeAulaModal = () => {
        const modal = document.getElementById('modal-nova-aula');
        if (!modal) return;
        modal.querySelector('#aula-titulo').value = '';
        modal.querySelector('#aula-conteudo-texto').value = '';
        modal.querySelector('#aula-conteudo-arquivo').value = '';
        editingAulaId = null;
        modal.querySelector('.modal-header h2').textContent = 'Adicionar Nova Aula';
        modal.classList.remove('active');
    };

    // ===============================================
    // GERENCIADOR DE CLIQUES E NAVEGAÇÃO
    // ===============================================
    document.addEventListener('click', (event) => {
        const target = event.target;
        const openModalButton = target.closest('[data-open-modal]');
        const actionButton = target.closest('[data-action]');
        
        if (openModalButton) {
            const modalId = openModalButton.dataset.openModal;
            if (modalId === 'modal-novo-aluno') {
                closeAlunoModal();
                populateCoursesDropdown();
            } else if (modalId === 'modal-nova-aula') {
                closeAulaModal();
                setTimeout(() => document.getElementById('aula-tipo').dispatchEvent(new Event('change')), 0);
            } else if (modalId === 'modal-novo-curso') {
                closeCourseModal();
            }
            document.getElementById(modalId)?.classList.add('active');
            return;
        }
        
        const closeButton = target.closest('.close-button');
        if (closeButton || (actionButton && actionButton.dataset.action === 'cancel')) {
            const modalToClose = target.closest('.modal');
            if (modalToClose) {
                if (modalToClose.id === 'modal-novo-curso') closeCourseModal();
                else if (modalToClose.id === 'modal-novo-aluno') closeAlunoModal();
                else if (modalToClose.id === 'modal-nova-aula') closeAulaModal();
                else modalToClose.classList.remove('active');
            }
            return;
        }

        if (actionButton) {
            const action = actionButton.dataset.action;
            const courseId = parseInt(actionButton.dataset.courseId, 10);
            const alunoId = parseInt(actionButton.dataset.alunoId, 10);
            const aulaId = parseInt(actionButton.dataset.aulaId, 10);

            if (action === 'save-course') handleSaveCourse();
            else if (action === 'edit-course') handleEditCourse(courseId);
            else if (action === 'delete-course') handleDeleteCourse(courseId);
            else if (action === 'view-details-course') handleViewCourseDetails(courseId);
            else if (action === 'cancel-enrollment') handleCancelEnrollment(alunoId, courseId);
            else if (action === 'save-aluno') handleSaveAluno();
            else if (action === 'edit-aluno') handleEditAluno(alunoId);
            else if (action === 'delete-aluno') handleDeleteAluno(alunoId);
            else if (action === 'save-aula') handleSaveAula();
            else if (action === 'edit-aula') handleEditAula(aulaId);
            else if (action === 'delete-aula') handleDeleteAula(aulaId);
        }
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                if (modal.id === 'modal-novo-curso') closeCourseModal();
                else if (modal.id === 'modal-novo-aluno') closeAlunoModal();
                else if (modal.id === 'modal-nova-aula') closeAulaModal();
                else modal.classList.remove('active');
            }
        });
    });
    
    async function loadPage(page) {
        mainContent.innerHTML = '<h1>Carregando...</h1>';
        try {
            const response = await fetch(`pages/${page}.html?t=${new Date().getTime()}`);
            if (!response.ok) throw new Error("Arquivo da página não encontrado.");
            mainContent.innerHTML = await response.text();
            if (page === 'cursos') renderCourses();
            else if (page === 'alunos') renderAlunos();
            else if (page === 'conteudo') initializeContentPage();
        } catch (error) {
            console.error("Erro ao carregar página:", error);
            mainContent.innerHTML = `<h1>Erro ao carregar.</h1><p>Verifique o console.</p>`;
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