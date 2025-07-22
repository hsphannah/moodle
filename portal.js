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

    // Decodifica um JWT para extrair os dados do payload
    function decodeJwt(token) {
        try {
            // JWT tem 3 partes: header.payload.signature
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            console.error("Erro ao decodificar JWT:", e);
            showToast('Erro ao decodificar informações da sessão. Por favor, faça login novamente.', 'error');
            return null;
        }
    }

    // Lida com a saída do usuário, limpando o token e redirecionando para o login
    function handleLogout() {
        localStorage.removeItem('studentToken');
        showToast('Sessão encerrada com sucesso!', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 500);
    }

    // ===============================================
    // LÓGICA DO MODAL DE CONTEÚDO
    // ===============================================

    // Exibe o conteúdo de uma aula em um modal, adaptando-se ao tipo de conteúdo
    function showContentInModal(tipo, conteudo, titulo) {
        if (!contentModal || !modalTitle || !modalBody) {
            console.error("Um ou mais elementos do modal não foram encontrados.");
            showToast("Erro ao abrir conteúdo. Elementos do modal ausentes.", 'error');
            return;
        }

        modalTitle.textContent = titulo;
        let contentHtml = '';
        const tipoLower = tipo.toLowerCase();

        if (tipoLower.includes('texto')) {
            // Substitui quebras de linha por <br> para formatação HTML
            contentHtml = `<p>${conteudo.replace(/\n/g, '<br>')}</p>`;
        } else if (tipoLower.includes('imagem')) {
            contentHtml = `<img src="${conteudo}" alt="${titulo}">`;
        } else if (tipoLower.includes('pdf')) {
            contentHtml = `<iframe src="${conteudo}" title="${titulo}" width="100%" height="500px"></iframe>`;
        } else if (tipoLower.includes('vídeo (upload)')) {
            contentHtml = `<video controls autoplay width="100%"><source src="${conteudo}" type="video/mp4"></video>`;
        } else if (tipoLower.includes('vídeo (link)')) {
            let videoId = null;
            try {
                const url = new URL(conteudo);
                // Tenta extrair ID do YouTube de URLs como "watch?v=ID" ou "/ID"
                videoId = url.searchParams.get('v') || url.pathname.split('/').pop();
            } catch(e) {
                console.warn("URL de vídeo inválida ou sem ID de YouTube detectável:", conteudo, e);
            }

            if (videoId) {
                // Incorpora vídeo do YouTube
                contentHtml = `<div class="video-container"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="${titulo}"></iframe></div>`;
            } else {
                contentHtml = `<p>Link de vídeo inválido ou não suportado. Por favor, verifique a URL.</p>`;
                showToast('Link de vídeo inválido ou não suportado.', 'error');
            }
        } else {
            contentHtml = `<p>Tipo de conteúdo não suportado: ${tipo}.</p>`;
            showToast(`Tipo de conteúdo "${tipo}" não suportado para visualização.`, 'error');
        }
        
        modalBody.innerHTML = contentHtml;
        contentModal.classList.add('active'); // Exibe o modal
    }

    // Listener para o botão de fechar o modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            contentModal.classList.remove('active');
            modalBody.innerHTML = ''; // Limpa o conteúdo do modal ao fechar
        });
    }

    // Listener para fechar o modal ao clicar fora dele
    if (contentModal) {
        contentModal.addEventListener('click', (e) => {
            if (e.target === contentModal) { // Verifica se o clique foi no fundo escuro do modal
                contentModal.classList.remove('active');
                modalBody.innerHTML = ''; // Limpa o conteúdo do modal ao fechar
            }
        });
    }

    // ===============================================
    // FUNÇÕES DE RENDERIZAÇÃO DE PÁGINA
    // ===============================================

    // Renderiza o dashboard inicial do aluno
    function renderDashboard() {
        contentHeader.innerHTML = '<h1>Dashboard</h1>';
        contentBody.innerHTML = `<h2>Seja bem-vindo(a) de volta, ${currentUser.nome || currentUser.email}!</h2><p>Clique em "Meus Cursos" no menu para começar a estudar.</p>`;
    }

    // Renderiza a lista de cursos em que o aluno está inscrito
    async function renderMyCourses() {
        contentHeader.innerHTML = '<h1>Meus Cursos</h1>';
        contentBody.innerHTML = `<p class="loading-message">Carregando seus cursos...</p>`; // Feedback de carregamento
        try {
            const response = await fetch(`/api/alunos/${currentUser.id}/cursos`, { headers: { 'Authorization': `Bearer ${token}` } });

            if (!response.ok) {
                // Tenta ler a mensagem de erro do servidor
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao carregar cursos.' }));
                throw new Error(errorData.message || 'Não foi possível carregar seus cursos.');
            }

            const result = await response.json();
            const courses = result.data; // Assumindo que o backend retorna { data: [...] }

            if (!courses || courses.length === 0) {
                contentBody.innerHTML = '<h3 class="empty-message">Você ainda não está inscrito em nenhum curso.</h3><p>Explore as opções ou entre em contato com a administração.</p>';
                return;
            }

            const coursesHtml = courses.map(course => `
                <div class="course-card-student" data-course-id="${course.id}" data-course-name="${course.name}">
                    <h3>${course.name}</h3>
                    <p>${course.description || 'Nenhuma descrição disponível.'}</p>
                </div>
            `).join('');
            contentBody.innerHTML = `<div class="course-grid">${coursesHtml}</div>`;

        } catch (error) {
            console.error('Falha ao carregar cursos:', error);
            showToast(`Erro ao carregar cursos: ${error.message}`, 'error');
            contentBody.innerHTML = `<p class="error-message">Erro ao carregar seus cursos: ${error.message}</p>`;
        }
    }
    
    // Renderiza as aulas de um curso específico
    async function renderCourseLessons(courseId, courseName) {
        contentHeader.innerHTML = `<h1>${courseName}</h1>`;
        contentBody.innerHTML = `<p class="loading-message">Carregando aulas...</p>`;
        try {
            const response = await fetch(`/api/alunos/${currentUser.id}/cursos/${courseId}/aulas`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao carregar aulas.' }));
                throw new Error(errorData.message || 'Não foi possível carregar as aulas.');
            }
            const result = await response.json();
            const lessons = result.data; // Assumindo { data: [...] }

            if (!lessons || lessons.length === 0) {
                contentBody.innerHTML = `
                    <div class="back-button" data-view="meus-cursos">← Voltar para Meus Cursos</div>
                    <p class="empty-message">Este curso ainda não possui aulas cadastradas.</p>
                `;
                return;
            }

            const lessonsHtml = lessons.map(lesson => `
                <li class="lesson-item ${lesson.concluida ? 'concluida' : ''}" data-lesson-id="${lesson.id}">
                    <div class="lesson-item-header">
                        <span>${lesson.titulo}</span>
                        <div class="lesson-item-actions">
                            <button class="view-content-btn" data-tipo="${lesson.tipo}" data-conteudo="${lesson.conteudo}" data-titulo="${lesson.titulo}">Acessar Conteúdo</button>
                            <button class="complete-btn" data-aula-id="${lesson.id}" ${lesson.concluida ? 'disabled' : ''}>
                                ${lesson.concluida ? 'Concluída' : 'Marcar como Concluída'}
                            </button>
                        </div>
                    </div>
                    </li>
            `).join('');

            contentBody.innerHTML = `
                <div class="back-button" data-view="meus-cursos">← Voltar para Meus Cursos</div>
                <ul class="lesson-list">${lessonsHtml}</ul>
            `;
        } catch(error) {
            console.error('Falha ao carregar aulas:', error);
            showToast(`Erro ao carregar aulas: ${error.message}`, 'error');
            contentBody.innerHTML = `<p class="error-message">Erro ao carregar as aulas: ${error.message}</p>`;
        }
    }

    // Renderiza o progresso do aluno em todos os cursos
    async function renderMyProgress() {
        contentHeader.innerHTML = '<h1>Meu Progresso</h1>';
        contentBody.innerHTML = `<p class="loading-message">Calculando seu progresso...</p>`;
        try {
            const response = await fetch(`/api/alunos/${currentUser.id}/progresso`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao carregar progresso.' }));
                throw new Error(errorData.message || 'Não foi possível carregar seu progresso.');
            }
            const result = await response.json();
            const progressData = result.data; // Assumindo { data: [...] }

            if (!progressData || progressData.length === 0) {
                contentBody.innerHTML = '<h3 class="empty-message">Você não tem progresso para exibir pois não está inscrito em cursos.</h3>';
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
                        <div class="progress-bar-wrapper">
                            <div class="progress-bar" style="width: ${percentage}%;"></div>
                        </div>
                    </div>
                `;
            }).join('');
            contentBody.innerHTML = `<div class="progress-container">${progressCardsHtml}</div>`;
        } catch (error) {
            console.error('Falha ao carregar progresso:', error);
            showToast(`Erro ao carregar progresso: ${error.message}`, 'error');
            contentBody.innerHTML = `<p class="error-message">Erro ao carregar seu progresso: ${error.message}</p>`;
        }
    }

    // Renderiza a página de perfil do aluno (placeholder por enquanto)
    function renderMyProfile() {
        contentHeader.innerHTML = '<h1>Meu Perfil</h1>';
        contentBody.innerHTML = `
            <div class="content-card">
                <p><strong>Nome:</strong> ${currentUser.nome || 'Não informado'}</p>
                <p><strong>Email:</strong> ${currentUser.email}</p>
                <p><strong>Tipo de Usuário:</strong> Aluno</p>
                <p>Esta seção está em desenvolvimento. Em breve você poderá editar suas informações aqui!</p>
            </div>
        `;
    }

    // ===============================================
    // LÓGICA DE AÇÕES DO ALUNO (MARCAR AULA)
    // ===============================================

    // Envia uma requisição para marcar uma aula como concluída
    async function handleMarkLessonComplete(aulaId, buttonElement) {
        buttonElement.disabled = true; // Desabilita o botão para evitar cliques múltiplos
        buttonElement.textContent = 'Salvando...';
        try {
            const response = await fetch('/api/progresso', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ aluno_id: currentUser.id, aula_id: aulaId })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao salvar progresso.' }));
                throw new Error(errorData.message || 'Não foi possível salvar o progresso.');
            }

            showToast('Aula marcada como concluída!', 'success');
            buttonElement.textContent = 'Concluída';
            const lessonItem = buttonElement.closest('.lesson-item');
            if (lessonItem) {
                lessonItem.classList.add('concluida'); // Adiciona estilo de aula concluída
            }
            // Opcional: Recarregar a página de progresso ou atualizar o card de progresso relevante
            // renderMyProgress(); 
        } catch (error) {
            console.error("Erro ao marcar aula como concluída:", error);
            showToast(`Erro ao marcar aula como concluída: ${error.message}`, 'error');
            buttonElement.disabled = false; // Habilita o botão novamente em caso de falha
            buttonElement.textContent = 'Marcar como Concluída';
        }
    }

    // ===============================================
    // LÓGICA DE NAVEGAÇÃO E EVENTOS GERAIS
    // ===============================================

    // Gerencia o clique nos itens da barra lateral
    function handleNavClick(event) {
        event.preventDefault(); // Impede o comportamento padrão do link
        const clickedItem = event.currentTarget; // O <a> clicado
        const view = clickedItem.dataset.view; // Pega o valor do atributo data-view

        if (view === 'logout') {
            handleLogout();
            return;
        }

        // Remove a classe 'active' de todos os itens e adiciona ao clicado
        navItems.forEach(item => item.classList.remove('active'));
        clickedItem.classList.add('active');

        // Renderiza a view correspondente
        switch (view) {
            case 'dashboard':
                renderDashboard();
                break;
            case 'meus-cursos':
                renderMyCourses();
                break;
            case 'meu-progresso':
                renderMyProgress();
                break;
            case 'meu-perfil':
                renderMyProfile(); // Chama a função para renderizar o perfil
                break;
            default:
                // Caso alguma view não tenha uma função específica ainda
                contentHeader.innerHTML = `<h1>${clickedItem.querySelector('span:last-child').textContent}</h1>`;
                contentBody.innerHTML = `<p class="empty-message">Seção em desenvolvimento: ${clickedItem.querySelector('span:last-child').textContent}.</p>`;
        }
    }

    // Listener de eventos para cliques dentro do conteúdo principal
    mainContent.addEventListener('click', (event) => {
        const target = event.target;

        // Clique no botão "Acessar Conteúdo"
        if (target.classList.contains('view-content-btn')) {
            showContentInModal(target.dataset.tipo, target.dataset.conteudo, target.dataset.titulo);
        }
        // Clique no botão "Marcar como Concluída"
        else if (target.classList.contains('complete-btn')) {
            // Confirma se o botão não está desabilitado antes de chamar a função
            if (!target.disabled) {
                handleMarkLessonComplete(target.dataset.aulaId, target);
            }
        }
        // Clique no botão "Voltar para Meus Cursos" (usando data-view)
        else if (target.classList.contains('back-button') && target.dataset.view === 'meus-cursos') {
            // Simula um clique no item "Meus Cursos" da navegação para renderizar a página
            document.querySelector('[data-view="meus-cursos"]').click();
        }
        // Clique em um card de curso para ver as aulas
        else {
            const courseCard = target.closest('.course-card-student');
            if (courseCard) {
                renderCourseLessons(courseCard.dataset.courseId, courseCard.dataset.courseName);
            }
        }
    });

    // ===============================================
    // FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO
    // ===============================================

    function init() {
        token = localStorage.getItem('studentToken');

        // Redireciona para o login se não houver token
        if (!token) {
            handleLogout();
            return;
        }

        currentUser = decodeJwt(token);

        // Redireciona se o token for inválido ou o role não for 'student'
        if (!currentUser || currentUser.role !== 'student') {
            console.warn("Token inválido ou role incorreto. Redirecionando para login.");
            handleLogout();
            return;
        }
        
        // Adiciona listeners aos itens de navegação
        navItems.forEach(item => item.addEventListener('click', handleNavClick));

        // Renderiza o dashboard como página inicial
        renderDashboard();

        // O estilo do .view-content-btn foi movido para portal.css
    }

    // Inicia a aplicação quando o DOM estiver completamente carregado
    init();
});