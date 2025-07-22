document.addEventListener('DOMContentLoaded', () => {
    // ===============================================
    // SELETORES GLOBAIS E VARIÁVEIS DE ESTADO
    // ===============================================
    const mainContent = document.querySelector('.main-content');
    const navLinks = document.querySelectorAll('.nav-item');

    let editingCourseId = null;
    let editingAlunoId = null;
    let editingAulaId = null;
    let currentCourseIdForLessons = null; // Usado na seção de Conteúdo para gerenciar aulas de um curso específico

    const getToken = () => localStorage.getItem('adminToken');

    // ===============================================
    // FUNÇÕES DE UTILIDADE E AUTENTICAÇÃO
    // ===============================================

    // Função auxiliar para exibir toasts
    function showToast(message, type = 'error') {
        const backgroundColor = type === 'success' ? '#28a745' : type === 'info' ? '#17a2b8' : '#dc3545'; // Verde, Azul, Vermelho
        Toastify({
            text: message,
            duration: 3000, // 3 segundos
            close: true,
            gravity: "top", // `top` ou `bottom`
            position: "right", // `left`, `center` ou `right`
            stopOnFocus: true, // Para o tempo do toast se o usuário focar nele
            style: {
                background: backgroundColor,
                borderRadius: "5px",
                padding: "10px 20px"
            },
            onClick: function(){} // Callback depois de clicar
        }).showToast();
    }

    // Função centralizada para fazer requisições à API
    // Inclui tratamento de erro padronizado e token de autorização
    async function fetchData(url, options = {}) {
        const token = getToken();
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers: headers
            });

            // Tenta ler o JSON da resposta em todos os casos (sucesso ou erro)
            const result = await response.json().catch(() => ({})); // Captura erro se não for JSON válido

            if (!response.ok) {
                // Se a resposta não for OK, lança um erro com a mensagem do backend ou uma genérica
                throw new Error(result.error || result.message || `Erro na requisição para ${url}. Status: ${response.status}`);
            }
            return result; // Retorna o resultado em caso de sucesso
        } catch (error) {
            console.error(`Erro na requisição para ${url}:`, error);
            // Propaga o erro para o chamador lidar com a UI
            throw error;
        }
    }

    // Verifica se o admin está autenticado e redireciona se não estiver
    function checkAdminAuth() {
        const token = getToken();
        if (!token) {
            showToast('Sua sessão expirou ou você não está logado. Por favor, faça login novamente.', 'error');
            setTimeout(() => { window.location.href = 'login.html'; }, 500);
            return; // Garante que a função não continue
        }
    }

    // ===============================================
    // FUNÇÕES DE RENDERIZAÇÃO DE PÁGINAS DO ADMIN
    // ===============================================

    // NOVO: Renderiza o conteúdo dinâmico do Dashboard
    async function renderDashboard() {
        const statsContainer = mainContent.querySelector('.stat-cards-container');
        const courseProgressContainer = mainContent.querySelector('.content-cards-container .content-card:first-child');
        const recentStudentsContainer = mainContent.querySelector('.content-cards-container .content-card:last-child');

        // Limpa os conteúdos e mostra mensagens de carregamento
        if (statsContainer) statsContainer.innerHTML = '<p class="loading-message">Carregando estatísticas...</p>';
        if (courseProgressContainer) courseProgressContainer.innerHTML = '<h2>Progresso dos Cursos</h2><p class="loading-message">Carregando progresso...</p>';
        if (recentStudentsContainer) recentStudentsContainer.innerHTML = '<h2>Alunos Recentes</h2><p class="loading-message">Carregando alunos...</p>';

        try {
            const [statsResult, courseProgressResult, recentStudentsResult] = await Promise.all([
                fetchData('/api/dashboard/stats'),
                fetchData('/api/dashboard/course-progress'),
                fetchData('/api/dashboard/recent-students')
            ]);

            // Renderiza as estatísticas
            if (statsContainer) {
                const stats = statsResult.data;
                statsContainer.innerHTML = `
                    <div class="stat-card">
                        <span class="material-symbols-outlined icon">groups</span>
                        <div class="stat-info">
                            <p>Total de Alunos</p>
                            <strong>${stats.totalAlunos || 0}</strong>
                        </div>
                    </div>
                    <div class="stat-card">
                        <span class="material-symbols-outlined icon">library_books</span>
                        <div class="stat-info">
                            <p>Cursos Ativos</p>
                            <strong>${stats.cursosAtivos || 0}</strong>
                        </div>
                    </div>
                    <div class="stat-card">
                        <span class="material-symbols-outlined icon">article</span>
                        <div class="stat-info">
                            <p>Aulas Publicadas</p>
                            <strong>${stats.aulasPublicadas || 0}</strong>
                        </div>
                    </div>
                    <div class="stat-card">
                        <span class="material-symbols-outlined icon">trending_up</span>
                        <div class="stat-info">
                            <p>Taxa de Conclusão</p>
                            <strong>${stats.taxaConclusao || 0}%</strong>
                        </div>
                    </div>
                `;
            }

            // Renderiza o progresso dos cursos
            if (courseProgressContainer) {
                const courseProgress = courseProgressResult.data;
                let progressHtml = '<h2>Progresso dos Cursos</h2>';
                if (courseProgress.length === 0) {
                    progressHtml += '<p class="empty-message">Nenhum progresso de curso para exibir.</p>';
                } else {
                    courseProgress.forEach(course => {
                        progressHtml += `
                            <div class="course-progress-item">
                                <span>${course.course_name}</span>
                                <div class="progress-bar">
                                    <div class="progress-bar-fill" style="width: ${course.percentage || 0}%;"></div>
                                </div>
                                <span>${course.percentage || 0}%</span>
                            </div>
                        `;
                    });
                }
                courseProgressContainer.innerHTML = progressHtml;
            }

            // Renderiza os alunos recentes
            if (recentStudentsContainer) {
                const recentStudents = recentStudentsResult.data;
                let studentsHtml = '<h2>Alunos Recentes</h2>';
                if (recentStudents.length === 0) {
                    studentsHtml += '<p class="empty-message">Nenhum aluno recente para exibir.</p>';
                } else {
                    recentStudents.forEach(student => {
                        const lastAccess = student.last_access ? new Date(student.last_access).toLocaleDateString('pt-BR') : 'Nunca';
                        const lastProgress = student.last_progress_percent ? `${student.last_progress_percent}%` : '--';
                        studentsHtml += `
                            <div class="student-list-item">
                                <p><strong>${student.name}</strong></p>
                                <p>${lastProgress} ${lastAccess}</p>
                            </div>
                        `;
                    });
                }
                recentStudentsContainer.innerHTML = studentsHtml;
            }

        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
            showToast(`Erro ao carregar Dashboard: ${error.message}`, 'error');
            if (statsContainer) statsContainer.innerHTML = `<p class="error-message">Erro ao carregar estatísticas: ${error.message}</p>`;
            if (courseProgressContainer) courseProgressContainer.innerHTML = `<h2>Progresso dos Cursos</h2><p class="error-message">Erro ao carregar progresso: ${error.message}</p>`;
            if (recentStudentsContainer) recentStudentsContainer.innerHTML = `<h2>Alunos Recentes</h2><p class="error-message">Erro ao carregar alunos recentes: ${error.message}</p>`;
        }
    }


    // NOVO: Renderiza o conteúdo dinâmico da página Financeiro
    async function renderFinanceiro() {
        const statsContainer = mainContent.querySelector('.stat-cards-container');
        const paymentListContainer = mainContent.querySelector('.payment-list-container');
        const tabsContainer = mainContent.querySelector('.tabs-container'); // Para adicionar listener às abas

        // Limpa e mostra mensagens de carregamento para as estatísticas e lista de pagamentos
        if (statsContainer) statsContainer.innerHTML = '<p class="loading-message">Carregando dados financeiros...</p>';
        if (paymentListContainer) paymentListContainer.innerHTML = '<p class="loading-message">Carregando pagamentos...</p>';
        
        try {
            const [financeStatsResult, paymentsResult] = await Promise.all([
                fetchData('/api/financeiro/stats'),
                fetchData('/api/financeiro/pagamentos')
            ]);

            // Renderiza as estatísticas financeiras
            if (statsContainer) {
                const stats = financeStatsResult.data;
                statsContainer.innerHTML = `
                    <div class="stat-card"><div class="stat-info"><p>Receita Total</p><strong>R$ ${stats.receitaTotal ? stats.receitaTotal.toFixed(2).replace('.', ',') : '0,00'}</strong></div></div>
                    <div class="stat-card"><div class="stat-info"><p>Receita do Mês</p><strong>R$ ${stats.receitaMes ? stats.receitaMes.toFixed(2).replace('.', ',') : '0,00'}</strong></div></div>
                    <div class="stat-card"><div class="stat-info"><p>Alunos Ativos</p><strong>${stats.alunosAtivos || 0}</strong></div></div>
                    <div class="stat-card"><div class="stat-info"><p>Inadimplentes</p><strong>${stats.inadimplentes || 0}</strong></div></div>
                `;
            }

            // Renderiza a lista de pagamentos
            if (paymentListContainer) {
                const payments = paymentsResult.data;
                if (payments.length === 0) {
                    paymentListContainer.innerHTML = '<p class="empty-message">Nenhum pagamento registrado.</p>';
                } else {
                    paymentListContainer.innerHTML = payments.map(payment => {
                        const statusClass = payment.status.toLowerCase().replace(' ', '-'); // "Atrasado" -> "atrasado"
                        const dueDate = new Date(payment.due_date).toLocaleDateString('pt-BR');
                        const actionsHtml = `
                            <button class="btn btn-secondary" data-action="view-payment-details" data-payment-id="${payment.id}">Ver Detalhes</button>
                            ${statusClass === 'pendente' ? `<button class="btn btn-primary" data-action="register-payment" data-payment-id="${payment.id}">Registrar Pagamento</button>` : ''}
                            ${statusClass === 'atrasado' ? `<button class="btn btn-danger" data-action="send-reminder" data-payment-id="${payment.id}">Enviar Cobrança</button>` : ''}
                        `;
                        return `
                            <div class="payment-list-item">
                                <div class="payment-student-info">
                                    <strong>${payment.student_name}</strong>
                                    <span>${payment.course_name}</span>
                                </div>
                                <div class="payment-details">
                                    <span>R$ ${payment.amount ? payment.amount.toFixed(2).replace('.', ',') : '0,00'}</span>
                                    <span>Vencimento: ${dueDate}</span>
                                </div>
                                <div class="payment-status">
                                    <span class="status-badge ${statusClass}">${payment.status}</span>
                                </div>
                                <div class="payment-actions">${actionsHtml}</div>
                            </div>
                        `;
                    }).join('');
                }
            }
            
            // Adiciona o listener para as abas APENAS DEPOIS que o HTML da página financeira foi carregado
            // Verifica se o listener já foi adicionado para evitar duplicação (importante em SPAs)
            if (tabsContainer && !tabsContainer.dataset.listenerAdded) {
                tabsContainer.addEventListener('click', (event) => {
                    const tabItem = event.target.closest('.tab-item');
                    if (tabItem) {
                        event.preventDefault();
                        const tabName = tabItem.dataset.tab;
                        
                        // Remove 'active' de todas as abas e conteúdos
                        tabsContainer.querySelectorAll('.tab-item').forEach(item => item.classList.remove('active'));
                        mainContent.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                        
                        // Adiciona 'active' à aba clicada e ao conteúdo correspondente
                        tabItem.classList.add('active');
                        // Use querySelector no mainContent para garantir que pegue a aba correta
                        mainContent.querySelector(`[data-content="${tabName}"]`).classList.add('active');

                        // Opcional: Carregar conteúdo específico da aba (relatórios, config, gateway) aqui
                        // Ex: if (tabName === 'relatorios') renderRelatorios();
                        // if (tabName === 'relatorios') showToast('Carregando relatórios...', 'info'); // Exemplo de uso
                    }
                });
                tabsContainer.dataset.listenerAdded = 'true'; // Marca que o listener foi adicionado
            }

        } catch (error) {
            console.error("Erro ao carregar financeiro:", error);
            showToast(`Erro ao carregar Financeiro: ${error.message}`, 'error');
            if (statsContainer) statsContainer.innerHTML = `<p class="error-message">Erro ao carregar dados financeiros: ${error.message}</p>`;
            if (paymentListContainer) paymentListContainer.innerHTML = `<p class="error-message">Erro ao carregar pagamentos: ${error.message}</p>`;
        }
    }


    // ===============================================
    // FUNÇÕES DE CURSOS (CRUD)
    // ===============================================

    // Renderiza a lista de cursos na interface
    const renderCourses = async () => {
        const container = document.getElementById('course-cards-container');
        if (!container) {
            console.warn("Elemento #course-cards-container não encontrado.");
            return;
        }
        container.innerHTML = '<p class="loading-message">Carregando cursos...</p>'; // Feedback de carregamento

        try {
            const result = await fetchData('/api/cursos'); // Usa a função fetchData
            const courses = result.data; // Assumindo que o backend retorna { data: [...] }

            container.innerHTML = ''; // Limpa o conteúdo antes de renderizar
            if (courses.length === 0) {
                container.innerHTML = `<p class="empty-message">Nenhum curso cadastrado ainda. Clique em "Novo Curso" para começar!</p>`;
            } else {
                courses.forEach(course => {
                    // Nota: 'num_students' e 'num_lessons' devem vir do backend
                    const numStudents = course.num_students || 0;
                    const numLessons = course.num_lessons || 0;
                    container.innerHTML += `
                        <div class="course-card">
                            <div class="course-card-header">
                                <span class="status-badge">Ativo</span>
                                <button class="btn-icon" data-action="delete-course" data-course-id="${course.id}" title="Excluir Curso">
                                    <span class="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                            <div class="course-card-body">
                                <h2>${course.name}</h2>
                                <p>${course.description || 'Sem descrição.'}</p>
                            </div>
                            <div class="course-card-footer">
                                <div class="course-stats">
                                    <span>${numStudents} alunos</span>
                                    <span>${numLessons} aulas</span>
                                </div>
                                <div class="course-actions">
                                    <button class="btn btn-secondary" data-action="view-details-course" data-course-id="${course.id}">Ver Detalhes</button>
                                    <button class="btn btn-primary" data-action="edit-course" data-course-id="${course.id}">Editar</button>
                                </div>
                            </div>
                        </div>`;
                });
            }
        } catch (error) {
            console.error("Erro ao buscar cursos:", error);
            showToast(`Erro ao carregar cursos: ${error.message}`, 'error');
            container.innerHTML = `<p class="error-message">Erro ao carregar os cursos: ${error.message}</p>`;
        }
    };

    // Lida com o salvamento (criação ou atualização) de um curso
    const handleSaveCourse = async () => {
        const courseNameInput = document.getElementById('curso-nome');
        const courseDescInput = document.getElementById('curso-descricao');
        const courseData = { name: courseNameInput.value, description: courseDescInput.value };

        if (!courseData.name || !courseData.description) {
            showToast('Por favor, preencha todos os campos do curso.', 'error');
            return;
        }

        const url = editingCourseId ? `/api/cursos/${editingCourseId}` : '/api/cursos';
        const method = editingCourseId ? 'PUT' : 'POST';

        try {
            await fetchData(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseData)
            });
            showToast(`Curso ${editingCourseId ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
            renderCourses(); // Recarrega a lista de cursos
            closeCourseModal(); // Fecha e reseta o modal
        } catch (error) {
            console.error('Falha ao salvar o curso:', error);
            showToast(`Não foi possível salvar o curso: ${error.message}`, 'error');
        }
    };

    // Preenche o modal de curso para edição
    const handleEditCourse = async (courseId) => {
        try {
            const result = await fetchData(`/api/cursos/${courseId}`);
            const courseToEdit = result.data; // Assumindo { data: {...} }

            editingCourseId = courseId;
            document.getElementById('curso-nome').value = courseToEdit.name;
            document.getElementById('curso-descricao').value = courseToEdit.description;
            document.querySelector('#modal-novo-curso .modal-header h2').textContent = 'Editar Curso';
            document.getElementById('modal-novo-curso').classList.add('active');
        } catch (error) {
            console.error('Falha ao buscar dados para edição:', error);
            showToast(`Não foi possível carregar o curso para edição: ${error.message}`, 'error');
        }
    };

    // Lida com a exclusão de um curso
    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Tem certeza que deseja excluir este curso? Isso removerá também todas as aulas e inscrições relacionadas.')) {
            return;
        }
        try {
            await fetchData(`/api/cursos/${courseId}`, { method: 'DELETE' });
            showToast('Curso excluído com sucesso!', 'success');
            renderCourses(); // Recarrega a lista de cursos
        } catch (error) {
            console.error('Falha ao excluir o curso:', error);
            showToast(`Não foi possível excluir o curso: ${error.message}`, 'error');
        }
    };

    // Lida com a exibição de detalhes de um curso no modal
    const handleViewCourseDetails = async (courseId) => {
        const modal = document.getElementById('modal-detalhes-curso');
        const courseNameEl = document.getElementById('detalhes-curso-nome');
        const courseDescEl = document.getElementById('detalhes-curso-descricao');
        const studentListEl = document.getElementById('lista-alunos-inscritos');

        if (!modal) {
            console.warn("Elemento #modal-detalhes-curso não encontrado.");
            return;
        }

        modal.dataset.currentCourseId = courseId; // Armazena o ID do curso no modal para uso posterior
        courseNameEl.textContent = 'Carregando...';
        courseDescEl.textContent = '';
        studentListEl.innerHTML = '<p class="loading-message">Carregando alunos inscritos...</p>';
        modal.classList.add('active'); // Abre o modal

        try {
            // Busca detalhes do curso e alunos inscritos em paralelo
            const [courseResult, studentsResult] = await Promise.all([
                fetchData(`/api/cursos/${courseId}`),
                fetchData(`/api/cursos/${courseId}/alunos`)
            ]);
            
            const course = courseResult.data;
            const students = studentsResult.data;

            courseNameEl.textContent = course.name;
            courseDescEl.textContent = course.description;

            studentListEl.innerHTML = ''; // Limpa a lista antes de preencher
            if (students.length === 0) {
                studentListEl.innerHTML = '<p class="empty-message">Nenhum aluno inscrito neste curso.</p>';
            } else {
                const ul = document.createElement('ul');
                ul.className = 'enrolled-student-list';
                students.forEach(student => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${student.name} (${student.email})</span>
                        <button class="btn btn-danger btn-sm" data-action="cancel-enrollment" data-aluno-id="${student.id}" data-curso-id="${course.id}">Remover</button>
                    `;
                    ul.appendChild(li);
                });
                studentListEl.appendChild(ul);
            }
        } catch (error) {
            console.error('Falha ao buscar detalhes do curso:', error);
            showToast(`Não foi possível carregar os detalhes do curso: ${error.message}`, 'error');
            modal.classList.remove('active'); // Fecha o modal em caso de erro
        }
    };
    
    // Reseta e fecha o modal de "Novo Curso"
    const closeCourseModal = () => {
        const modal = document.getElementById('modal-novo-curso');
        if (!modal) return;
        modal.querySelector('#curso-nome').value = '';
        modal.querySelector('#curso-descricao').value = '';
        editingCourseId = null; // Reseta o ID de curso em edição
        modal.querySelector('.modal-header h2').textContent = 'Adicionar Novo Curso';
        modal.classList.remove('active');
    };

    // Lida com o cancelamento de inscrição de um aluno em um curso
    const handleCancelEnrollment = async (alunoId, cursoId) => {
        if (!window.confirm('Tem certeza que deseja remover a inscrição deste aluno neste curso?')) {
            return;
        }
        try {
            const result = await fetchData('/api/inscricoes', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aluno_id: alunoId, curso_id: cursoId })
            });
            showToast(result.message || 'Inscrição cancelada com sucesso!', 'success');
            // Recarrega os detalhes do curso para atualizar a lista de alunos inscritos
            handleViewCourseDetails(cursoId);
        } catch (error) {
            console.error('Erro ao cancelar inscrição:', error);
            showToast(`Erro ao cancelar inscrição: ${error.message}`, 'error');
        }
    };

    // ===============================================
    // FUNÇÕES DE ALUNOS (CRUD)
    // ===============================================

    // Renderiza a lista de alunos
    const renderAlunos = async () => {
        const container = document.getElementById('student-list-container');
        if (!container) {
            console.warn("Elemento #student-list-container não encontrado.");
            return;
        }
        container.innerHTML = '<p class="loading-message">Carregando alunos...</p>'; // Feedback de carregamento

        try {
            const result = await fetchData('/api/alunos'); // Usa a função fetchData
            const alunos = result.data; // Assumindo que o backend retorna { data: [...] }

            container.innerHTML = ''; // Limpa o conteúdo antes de renderizar
            if (alunos.length === 0) {
                container.innerHTML = `<p class="empty-message">Nenhum aluno cadastrado.</p>`;
            } else {
                alunos.forEach(aluno => {
                    // Nota: 'main_course_name', 'progress_percent', 'last_access' devem vir do backend
                    const mainCourse = aluno.main_course_name || '--';
                    const progress = aluno.progress_percent || 0;
                    const lastAccess = aluno.last_access ? new Date(aluno.last_access).toLocaleDateString('pt-BR') : 'Nunca';

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
                            <div class="student-course-info">
                                <span class="info-label">Curso Principal</span>
                                <strong>${mainCourse}</strong>
                            </div>
                            <div class="student-progress-info">
                                <span class="info-label">Progresso</span>
                                <strong>${progress}%</strong>
                            </div>
                            <div class="student-activity-info">
                                <span class="info-label">Último acesso</span>
                                <strong>${lastAccess}</strong>
                            </div>
                            <div class="student-actions">
                                <button class="btn btn-secondary" data-action="edit-aluno" data-aluno-id="${aluno.id}">Editar</button>
                            </div>
                        </div>`;
                });
            }
        } catch (error) {
            console.error("Erro ao buscar alunos:", error);
            showToast(`Erro ao carregar alunos: ${error.message}`, 'error');
            container.innerHTML = `<p class="error-message">Erro ao carregar os alunos: ${error.message}</p>`;
        }
    };

    // Lida com o salvamento (criação ou atualização) de um aluno
    const handleSaveAluno = async () => {
        const alunoNameInput = document.getElementById('aluno-nome');
        const alunoEmailInput = document.getElementById('aluno-email');
        const alunoCourseSelect = document.getElementById('aluno-curso');
        const alunoSenhaInput = document.getElementById('aluno-senha');

        const alunoData = {
            name: alunoNameInput.value,
            email: alunoEmailInput.value,
            // A senha só é enviada se não estiver editando ou se um valor for fornecido
            ...(editingAlunoId ? (alunoSenhaInput.value ? { password: alunoSenhaInput.value } : {}) : { password: alunoSenhaInput.value }), // Inclui senha para POST, e para PUT se preenchida
            curso_id: alunoCourseSelect.value ? parseInt(alunoCourseSelect.value, 10) : null
        };

        // Validação básica
        if (!alunoData.name || !alunoData.email || (!editingAlunoId && !alunoData.password)) {
            showToast('Por favor, preencha nome, email e senha (para novos alunos).', 'error');
            return;
        }

        const url = editingAlunoId ? `/api/alunos/${editingAlunoId}` : '/api/alunos';
        const method = editingAlunoId ? 'PUT' : 'POST';

        try {
            await fetchData(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alunoData)
            });
            showToast(`Aluno ${editingAlunoId ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
            renderAlunos(); // Recarrega a lista de alunos
            closeAlunoModal(); // Fecha e reseta o modal
        } catch (error) {
            console.error('Falha ao salvar aluno:', error);
            showToast(`Não foi possível salvar o aluno: ${error.message}`, 'error');
        }
    };

    // Preenche o modal de aluno para edição
    const handleEditAluno = async (alunoId) => {
        await populateCoursesDropdown(); // Garante que o dropdown de cursos esteja preenchido
        try {
            const result = await fetchData(`/api/alunos/${alunoId}`);
            const alunoToEdit = result.data; // Assumindo { data: {...} }

            editingAlunoId = alunoId;
            document.getElementById('aluno-nome').value = alunoToEdit.name;
            document.getElementById('aluno-email').value = alunoToEdit.email;
            document.getElementById('aluno-senha').value = ''; // Sempre limpa a senha por segurança
            document.querySelector('#modal-novo-aluno .modal-header h2').textContent = 'Editar Aluno';
            
            // Seleciona o curso atual do aluno no dropdown, se houver
            if (alunoToEdit.curso_id) {
                document.getElementById('aluno-curso').value = alunoToEdit.curso_id;
            } else {
                document.getElementById('aluno-curso').value = ''; // Nenhuma seleção
            }

            document.getElementById('modal-novo-aluno').classList.add('active');
        } catch (error) {
            console.error('Falha ao buscar dados do aluno:', error);
            showToast(`Não foi possível carregar o aluno para edição: ${error.message}`, 'error');
        }
    };

    // Lida com a exclusão de um aluno
    const handleDeleteAluno = async (alunoId) => {
        if (!window.confirm('Tem certeza que deseja excluir este aluno? Isso removerá suas inscrições e progresso.')) {
            return;
        }
        try {
            await fetchData(`/api/alunos/${alunoId}`, { method: 'DELETE' });
            showToast('Aluno excluído com sucesso!', 'success');
            renderAlunos(); // Recarrega a lista de alunos
        } catch (error) {
            console.error('Falha ao excluir aluno:', error);
            showToast(`Não foi possível excluir o aluno: ${error.message}`, 'error');
        }
    };

    // Reseta e fecha o modal de "Novo Aluno"
    const closeAlunoModal = () => {
        const modal = document.getElementById('modal-novo-aluno');
        if (!modal) return;
        modal.querySelector('#aluno-nome').value = '';
        modal.querySelector('#aluno-email').value = '';
        modal.querySelector('#aluno-senha').value = ''; // Garante que a senha seja limpa
        modal.querySelector('#aluno-curso').innerHTML = ''; // Limpa opções do dropdown
        editingAlunoId = null; // Reseta o ID de aluno em edição
        modal.querySelector('.modal-header h2').textContent = 'Adicionar Novo Aluno';
        modal.classList.remove('active');
    };

    // Popula o dropdown de cursos em modais (como o de adicionar/editar aluno)
    const populateCoursesDropdown = async () => {
        const select = document.getElementById('aluno-curso');
        if (!select) return;
        try {
            // Requisição com autorização
            const result = await fetchData('/api/cursos');
            const courses = result.data;

            select.innerHTML = '<option value="">Matricular no curso (Opcional)</option>'; // Opção inicial
            courses.forEach(course => {
                select.innerHTML += `<option value="${course.id}">${course.name}</option>`;
            });
        } catch (error) {
            console.error("Erro ao popular dropdown de cursos:", error);
            showToast(`Erro ao carregar cursos para o dropdown: ${error.message}`, 'error');
            select.innerHTML = '<option value="">Erro ao carregar cursos</option>';
        }
    };
    
    // ===============================================
    // FUNÇÕES DE AULAS/CONTEÚDO (CRUD)
    // ===============================================

    // Inicializa a página de gestão de conteúdo (dropdown de cursos e área de aulas)
    const initializeContentPage = async () => {
        const dropdown = document.getElementById('course-select-dropdown');
        const lessonsArea = document.getElementById('lessons-management-area');
        const addLessonButton = mainContent.querySelector('[data-open-modal="modal-nova-aula"]'); // Botão "Adicionar Nova Aula"

        if (!dropdown || !lessonsArea || !addLessonButton) {
            console.warn("Um ou mais elementos da página de conteúdo não foram encontrados.");
            return;
        }
        
        // Esconde a área de aulas e o botão "Nova Aula" por padrão
        lessonsArea.style.display = 'none'; 
        addLessonButton.style.display = 'none';

        // Listener para mudança no dropdown de cursos
        dropdown.addEventListener('change', () => {
            const selectedId = dropdown.value;
            if (selectedId) {
                currentCourseIdForLessons = parseInt(selectedId, 10);
                lessonsArea.style.display = 'block'; // Mostra a área de gestão de aulas
                addLessonButton.style.display = 'inline-flex'; // Mostra o botão de adicionar aula (usar inline-flex para btn)
                document.getElementById('lessons-list-header').textContent = `Aulas do Curso: ${dropdown.options[dropdown.selectedIndex].text}`;
                renderLessons(currentCourseIdForLessons); // Renderiza as aulas do curso selecionado
            } else {
                lessonsArea.style.display = 'none'; // Esconde a área se nenhum curso for selecionado
                addLessonButton.style.display = 'none'; // Esconde o botão de adicionar aula
                currentCourseIdForLessons = null;
            }
        });

        // Listener para mudança no tipo de aula no modal "Adicionar Nova Aula"
        const tipoAulaSelect = document.getElementById('aula-tipo');
        if (tipoAulaSelect) {
            tipoAulaSelect.addEventListener('change', () => {
                const tipo = tipoAulaSelect.value;
                const inputTexto = document.getElementById('aula-conteudo-texto');
                const inputArquivo = document.getElementById('aula-conteudo-arquivo');

                // Lógica para mostrar/esconder campos de texto ou upload de arquivo
                if (tipo.includes('(Upload)')) {
                    inputTexto.style.display = 'none';
                    inputArquivo.style.display = 'block';
                    inputTexto.required = false; // Não é obrigatório se for upload
                    inputArquivo.required = true; // Arquivo se torna obrigatório
                } else {
                    inputTexto.style.display = 'block';
                    inputArquivo.style.display = 'none';
                    inputTexto.required = true; // Texto se torna obrigatório
                    inputArquivo.required = false; // Arquivo não é obrigatório
                }
            });
        }

        // Popula o dropdown de cursos na página de Conteúdo
        try {
            const result = await fetchData('/api/cursos'); // Requisição com autorização
            const courses = result.data;
            dropdown.innerHTML = '<option value="">-- Selecione um curso --</option>';
            courses.forEach(course => {
                dropdown.innerHTML += `<option value="${course.id}">${course.name}</option>`;
            });
        } catch (error) {
            console.error("Erro ao popular dropdown de cursos na página de conteúdo:", error);
            showToast(`Erro ao carregar cursos para a gestão de conteúdo: ${error.message}`, 'error');
            dropdown.innerHTML = '<option value="">Não foi possível carregar</option>';
        }
    };
    
    // Renderiza as aulas de um curso específico na área de gestão de conteúdo
    const renderLessons = async (courseId) => {
        const container = document.getElementById('lessons-list-container');
        if (!container) {
            console.warn("Elemento #lessons-list-container não encontrado.");
            return;
        }
        container.innerHTML = '<p class="loading-message">Carregando aulas...</p>'; // Feedback de carregamento

        try {
            const result = await fetchData(`/api/cursos/${courseId}/aulas`); // Usa fetchData
            const aulas = result.data;

            container.innerHTML = ''; // Limpa o conteúdo
            if (aulas.length === 0) {
                container.innerHTML = '<p class="empty-message">Nenhuma aula cadastrada para este curso. Clique em "Adicionar Nova Aula" para começar!</p>';
            } else {
                aulas.forEach(aula => {
                    container.innerHTML += `
                        <div class="lesson-list-item">
                            <span><strong>${aula.titulo}</strong> (${aula.tipo})</span>
                            <div class="lesson-actions">
                                <button class="btn-icon" data-action="edit-aula" data-aula-id="${aula.id}" title="Editar Aula">
                                    <span class="material-symbols-outlined">edit</span>
                                </button>
                                <button class="btn-icon" data-action="delete-aula" data-aula-id="${aula.id}" title="Excluir Aula">
                                    <span class="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                        </div>`;
                });
            }
        } catch (error) {
            console.error("Erro ao renderizar aulas:", error);
            showToast(`Erro ao carregar aulas: ${error.message}`, 'error');
            container.innerHTML = `<p class="error-message">Erro ao carregar as aulas: ${error.message}</p>`;
        }
    };
    
    // Lida com o salvamento (criação ou atualização) de uma aula
    const handleSaveAula = async () => {
        const method = editingAulaId ? 'PUT' : 'POST';
        const formData = new FormData(); // FormData é usado para enviar arquivos (uploads) e outros dados de formulário
        
        const tituloInput = document.getElementById('aula-titulo');
        const tipoInput = document.getElementById('aula-tipo');
        const conteudoTextoInput = document.getElementById('aula-conteudo-texto');
        const conteudoArquivoInput = document.getElementById('aula-conteudo-arquivo');

        const titulo = tituloInput.value;
        const tipo = tipoInput.value;
        const conteudoTexto = conteudoTextoInput.value;
        const conteudoArquivo = conteudoArquivoInput.files[0]; // Pega o primeiro arquivo selecionado

        formData.append('titulo', titulo);
        formData.append('tipo', tipo);

        // A aula sempre pertence a um curso
        // Se estiver editando, o curso_id já está associado à aula no backend.
        // Se for uma nova aula (POST), precisamos do currentCourseIdForLessons
        if (method === 'POST') {
            if (!currentCourseIdForLessons) {
                showToast('Selecione um curso para adicionar a aula.', 'error');
                return;
            }
            formData.append('curso_id', currentCourseIdForLessons);
        }

        const isUpload = tipo.includes('(Upload)');

        // Anexa o conteúdo apropriado (arquivo ou texto) ao FormData
        if (isUpload) {
            if (conteudoArquivo) {
                formData.append('conteudo', conteudoArquivo);
            } else if (method === 'POST') { // Se for POST e upload, o arquivo é obrigatório
                showToast('Por favor, selecione um arquivo para upload.', 'error');
                return;
            }
            // Para PUT de upload, se o arquivo não for fornecido, assume-se que o conteúdo existente será mantido.
            // O backend deve lidar com isso.
        } else { // Conteúdo é texto ou link
            if (!conteudoTexto) {
                showToast('Por favor, preencha o conteúdo da aula.', 'error');
                return;
            }
            formData.append('conteudo', conteudoTexto);
        }

        if (!titulo || !tipo) {
            showToast('Por favor, preencha o título e o tipo da aula.', 'error');
            return;
        }
        
        const url = editingAulaId ? `/api/aulas/${editingAulaId}` : '/api/aulas';
        // Para requisições FormData, não defina 'Content-Type' manualmente, o navegador faz isso.
        try {
            await fetchData(url, {
                method,
                // headers: { 'Authorization': `Bearer ${getToken()}` }, // O fetchData já adiciona o token
                body: formData // FormData é enviado diretamente
            });
            showToast(`Aula ${editingAulaId ? 'atualizada' : 'adicionada'} com sucesso!`, 'success');
            // Se estiver editando, o courseId pode não ser o currentCourseIdForLessons
            // Uma opção é passar o courseId da aula editada ou recarregar o curso atual.
            renderLessons(currentCourseIdForLessons);
            closeAulaModal();
        } catch (error) {
            console.error('Falha ao salvar aula:', error);
            showToast(`Não foi possível salvar a aula: ${error.message}`, 'error');
        }
    };
    
    // Preenche o modal de aula para edição
    const handleEditAula = async (aulaId) => {
        try {
            const result = await fetchData(`/api/aulas/${aulaId}`);
            const aulaToEdit = result.data; // Assumindo { data: {...} }

            editingAulaId = aulaId;
            document.getElementById('aula-titulo').value = aulaToEdit.titulo;
            document.getElementById('aula-tipo').value = aulaToEdit.tipo;
            
            // Dispara o evento 'change' para que a lógica de mostrar/esconder inputs seja aplicada
            document.getElementById('aula-tipo').dispatchEvent(new Event('change'));

            // Preenche o campo de texto se não for um tipo de upload
            if (!aulaToEdit.tipo.includes('(Upload)')) {
                document.getElementById('aula-conteudo-texto').value = aulaToEdit.conteudo;
            } else {
                // Se for upload, o campo de arquivo não é preenchido por segurança/funcionalidade
                // O usuário teria que re-selecionar o arquivo se quisesse mudar
                document.getElementById('aula-conteudo-arquivo').value = ''; // Limpa para evitar confusão
                // Opcional: Mostrar uma prévia do arquivo existente, mas é mais complexo
            }

            document.querySelector('#modal-nova-aula .modal-header h2').textContent = 'Editar Aula';
            document.getElementById('modal-nova-aula').classList.add('active');
        } catch (error) {
            console.error("Falha ao carregar aula para edição:", error);
            showToast(`Não foi possível carregar a aula para edição: ${error.message}`, 'error');
        }
    };
    
    // Lida com a exclusão de uma aula
    const handleDeleteAula = async (aulaId) => {
        if (!window.confirm('Tem certeza que deseja excluir esta aula?')) return;
        try {
            await fetchData(`/api/aulas/${aulaId}`, { method: 'DELETE' });
            showToast('Aula excluída com sucesso!', 'success');
            // Recarrega as aulas do curso atualmente selecionado
            renderLessons(currentCourseIdForLessons);
        } catch (error) {
            console.error('Falha ao excluir aula:', error);
            showToast(`Não foi possível excluir a aula: ${error.message}`, 'error');
        }
    };

    // Reseta e fecha o modal de "Nova Aula"
    const closeAulaModal = () => {
        const modal = document.getElementById('modal-nova-aula');
        if (!modal) return;
        modal.querySelector('#aula-titulo').value = '';
        document.getElementById('aula-conteudo-texto').value = '';
        document.getElementById('aula-conteudo-arquivo').value = ''; // Limpa o input de arquivo
        document.getElementById('aula-tipo').value = 'Vídeo (Link)'; // Reseta o tipo para o padrão
        document.getElementById('aula-tipo').dispatchEvent(new Event('change')); // Garante que os campos visíveis sejam resetados
        editingAulaId = null; // Reseta o ID de aula em edição
        modal.querySelector('.modal-header h2').textContent = 'Adicionar Nova Aula';
        modal.classList.remove('active');
    };

    // ===============================================
    // GERENCIADOR DE CLIQUES E NAVEGAÇÃO GERAL
    // ===============================================

    // Gerencia os cliques no documento para delegar eventos
    document.addEventListener('click', async (event) => {
        const target = event.target;
        const openModalButton = target.closest('[data-open-modal]'); // Botões que abrem modais
        const actionButton = target.closest('[data-action]'); // Botões com ações CRUD ou outras

        // Lógica para abrir modais
        if (openModalButton) {
            const modalId = openModalButton.dataset.openModal;
            if (modalId === 'modal-novo-aluno') {
                closeAlunoModal(); // Garante que o modal de aluno esteja limpo
                await populateCoursesDropdown(); // Popula o dropdown de cursos para o aluno
            } else if (modalId === 'modal-nova-aula') {
                closeAulaModal(); // Garante que o modal de aula esteja limpo
                // Garante que o tipo de conteúdo correto seja exibido
                // O setTimeout é usado para permitir que o DOM seja atualizado antes de disparar o evento
                setTimeout(() => document.getElementById('aula-tipo').dispatchEvent(new Event('change')), 0);
            } else if (modalId === 'modal-novo-curso') {
                closeCourseModal(); // Garante que o modal de curso esteja limpo
            }
            document.getElementById(modalId)?.classList.add('active'); // Abre o modal
            return; // Impede que o clique seja processado por outras lógicas
        }
        
        // Lógica para fechar modais (botão 'X' ou 'Cancelar')
        const closeButton = target.closest('.close-button');
        if (closeButton || (actionButton && actionButton.dataset.action === 'cancel')) {
            const modalToClose = target.closest('.modal');
            if (modalToClose) {
                // Chama a função específica de fechamento para limpar e resetar
                if (modalToClose.id === 'modal-novo-curso') closeCourseModal();
                else if (modalToClose.id === 'modal-novo-aluno') closeAlunoModal();
                else if (modalToClose.id === 'modal-nova-aula') closeAulaModal();
                else modalToClose.classList.remove('active'); // Para outros modais genéricos
            }
            return; // Impede que o clique seja processado por outras lógicas
        }

        // Lógica para ações de botões (CRUD, etc.)
        if (actionButton) {
            const action = actionButton.dataset.action;
            // É importante usar parseInt(..., 10) para garantir que seja um número
            const courseId = parseInt(actionButton.dataset.courseId, 10);
            const alunoId = parseInt(actionButton.dataset.alunoId, 10);
            const aulaId = parseInt(actionButton.dataset.aulaId, 10);
            // Pegar o ID do curso do modal de detalhes (se estiver aberto)
            const currentCourseDetailsId = parseInt(document.getElementById('modal-detalhes-curso')?.dataset.currentCourseId, 10);
            // Pegar o ID do pagamento do botão de ação, se houver
            const paymentId = parseInt(actionButton.dataset.paymentId, 10);

            switch (action) {
                case 'save-course': await handleSaveCourse(); break;
                case 'edit-course': await handleEditCourse(courseId); break;
                case 'delete-course': await handleDeleteCourse(courseId); break;
                case 'view-details-course': await handleViewCourseDetails(courseId); break;
                case 'cancel-enrollment': await handleCancelEnrollment(alunoId, currentCourseDetailsId); break;
                case 'save-aluno': await handleSaveAluno(); break;
                case 'edit-aluno': await handleEditAluno(alunoId); break;
                case 'delete-aluno': await handleDeleteAluno(alunoId); break;
                case 'save-aula': await handleSaveAula(); break;
                case 'edit-aula': await handleEditAula(aulaId); break;
                case 'delete-aula': await handleDeleteAula(aulaId); break;
                // NOVO: Ações para pagamentos (placeholders)
                case 'view-payment-details': showToast('Funcionalidade de Ver Detalhes do Pagamento (ID: ' + paymentId + ') em desenvolvimento!', 'info'); break;
                case 'register-payment': showToast('Funcionalidade de Registrar Pagamento (ID: ' + paymentId + ') em desenvolvimento!', 'info'); break;
                case 'send-reminder': showToast('Funcionalidade de Enviar Cobrança (ID: ' + paymentId + ') em desenvolvimento!', 'info'); break;
                default: console.warn('Ação não reconhecida:', action);
            }
            return; // Impede que o clique seja processado por outras lógicas
        }
    });

    // ===============================================
    // LÓGICA DE NAVEGAÇÃO ENTRE PÁGINAS DO PAINEL
    // ===============================================

    // Carrega o conteúdo HTML de uma "página" (fragmento) e renderiza seu conteúdo específico
    async function loadPage(page) {
        mainContent.innerHTML = '<p class="loading-message">Carregando...</p>'; // Feedback de carregamento
        try {
            // Adiciona um timestamp para evitar cache do navegador durante o desenvolvimento
            const response = await fetch(`pages/${page}.html?t=${new Date().getTime()}`);
            if (!response.ok) {
                throw new Error(`Arquivo da página '${page}.html' não encontrado. Status: ${response.status}`);
            }
            mainContent.innerHTML = await response.text();

            // Após carregar o HTML, chama a função de renderização de dados específica para a página
            if (page === 'dashboard') {
                await renderDashboard(); // Chamar a nova função de renderização do dashboard
            } else if (page === 'cursos') {
                await renderCourses();
            } else if (page === 'alunos') {
                await renderAlunos();
            } else if (page === 'conteudo') {
                await initializeContentPage();
            } else if (page === 'financeiro') {
                await renderFinanceiro(); // Chamar a nova função de renderização do financeiro
            }
            // Adicione outras páginas conforme necessário
        } catch (error) {
            console.error(`Erro ao carregar página ${page}:`, error);
            showToast(`Erro ao carregar a página ${page}: ${error.message}`, 'error');
            mainContent.innerHTML = `<h1 class="error-message">Erro ao carregar a página.</h1><p class="error-message">${error.message}</p>`;
        }
    }

    // Adiciona listeners para os links da barra lateral (navegação entre páginas)
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const page = link.dataset.page;
            // Se o link for para logout, não impede o padrão e chama o logout (se houver no admin)
            if (page === 'logout') {
                event.preventDefault(); // Impede o comportamento padrão apenas para logout
                localStorage.removeItem('adminToken'); // Remove o token
                showToast('Sessão encerrada com sucesso!', 'success');
                setTimeout(() => { window.location.href = 'login.html'; }, 500);
                return;
            }
            
            event.preventDefault(); // Impede o comportamento padrão para as outras páginas
            
            // Remove a classe 'active' de todos e adiciona ao link clicado
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
            
            loadPage(page); // Carrega a nova página
        });
    });

    // ===============================================
    // INICIALIZAÇÃO DA APLICAÇÃO
    // ===============================================

    // Executa as verificações de autenticação e carrega a página inicial
    function init() {
        checkAdminAuth(); // Verifica a autenticação do admin
        
        // Simula o clique no link ativo inicial (Dashboard) para carregar a primeira página
        // Isso garante que a página Dashboard seja carregada ao iniciar
        const initialActiveLink = document.querySelector('.nav-item.active');
        if (initialActiveLink) {
            initialActiveLink.click();
        } else {
            // Fallback se não houver link ativo padrão, carregando o dashboard
            loadPage('dashboard');
        }

        // Adiciona um listener genérico para fechar modais ao clicar fora deles
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) { // Se o clique foi no fundo escuro do modal
                    // Chama a função específica de fechamento para limpar e resetar
                    if (modal.id === 'modal-novo-curso') closeCourseModal();
                    else if (modal.id === 'modal-novo-aluno') closeAlunoModal();
                    else if (modal.id === 'modal-nova-aula') closeAulaModal();
                    else modal.classList.remove('active'); // Para outros modais genéricos
                }
            });
        });
    }

    // Inicia a aplicação quando o DOM estiver completamente carregado
    init();
});