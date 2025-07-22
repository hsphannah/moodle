// Adicionamos "espiões" para capturar QUALQUER erro que possa derrubar o servidor
process.on('unhandledRejection', (reason, promise) => {
    console.error('!!!!!!!!!! REJEIÇÃO DE PROMISE NÃO TRATADA !!!!!!!!!!');
    console.error('Motivo:', reason);
    // Considere registrar o erro em um serviço de log antes de sair
    process.exit(1); // Encerra o processo para o Render tentar reiniciar
});
process.on('uncaughtException', (err) => {
    console.error('!!!!!!!!!! EXCEÇÃO NÃO TRATADA !!!!!!!!!!');
    console.error(err);
    // Considere registrar o erro em um serviço de log antes de sair
    process.exit(1); // Encerra o processo
});

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');

// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Variáveis de ambiente
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_local_super_secreto_e_forte_e_longo'; // Use um segredo forte em produção!
const DATABASE_URL = process.env.DATABASE_URL;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10); // Hash salt rounds

// Validação crucial das variáveis de ambiente
if (!DATABASE_URL) {
    console.error("ERRO FATAL: A variável de ambiente DATABASE_URL não está definida.");
    process.exit(1);
}
if (!JWT_SECRET || JWT_SECRET.length < 32) { // Sugestão de tamanho mínimo
    console.warn("AVISO: JWT_SECRET não está definido ou é muito curto. Use uma string longa e complexa em produção!");
}

// Configuração do Pool de Conexões com o PostgreSQL
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Teste de conexão com o banco de dados
pool.on('connect', () => console.log('Cliente PostgreSQL conectado ao banco de dados.'));
pool.on('error', (err) => console.error('Erro inesperado no cliente PostgreSQL', err));


// Middlewares Essenciais
app.use(cors()); // Permite requisições de diferentes origens (para o frontend)
app.use(express.json()); // Habilita o Express a ler JSON no corpo das requisições
app.use(express.urlencoded({ extended: true })); // Para lidar com dados de formulário URL-encoded, se usar

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Assegura que o diretório 'uploads' exista. O Render pode precisar de persistência de volume.
        // Em um ambiente de produção robusto, você usaria um serviço de armazenamento de arquivos (S3, Cloudinary, etc.)
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Garante que o nome do arquivo seja único para evitar colisões
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware para autenticação de JWT (Bearer Token)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extrai o token do cabeçalho "Bearer TOKEN"

    if (token == null) {
        return res.status(401).json({ message: "Token de autenticação não fornecido." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Token inválido (expirado, modificado, etc.)
            return res.status(403).json({ message: "Token de autenticação inválido ou expirado." });
        }
        req.user = user; // Anexa as informações do usuário decodificadas à requisição
        next(); // Continua para a próxima função middleware/rota
    });
};

// Middleware para verificar se o usuário é admin (para rotas protegidas por admin)
const authorizeAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Acesso negado. Apenas administradores podem realizar esta ação." });
    }
};

// Middleware para verificar se o usuário é aluno (para rotas protegidas por aluno, se necessário)
const authorizeStudent = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        next();
    } else {
        res.status(403).json({ message: "Acesso negado. Apenas alunos podem realizar esta ação." });
    }
};


// ===========================================
// == ROTAS DE API ==
// ===========================================

// Rota de saúde para verificar se o servidor está rodando
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// ------------------- Rotas de Autenticação -------------------

// Registro de um novo administrador
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email e senha são obrigatórios." });
        }

        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const sql = 'INSERT INTO admins (email, password_hash) VALUES ($1, $2) RETURNING id';
        const result = await pool.query(sql, [email, hash]);

        res.status(201).json({ message: "Administrador registrado com sucesso!", userId: result.rows[0].id });
    } catch (err) {
        console.error('Erro no registro de administrador:', err);
        if (err.code === '23505') { // Código de erro para violação de UNIQUE constraint (email já existe)
            return res.status(409).json({ error: "Este email já está em uso." });
        }
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// Login de administrador
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email e senha são obrigatórios." });
        }

        const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
        const admin = result.rows[0];

        if (!admin) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        const match = await bcrypt.compare(password, admin.password_hash);

        if (match) {
            // Incluído 'role: admin' no payload do JWT
            const payload = { id: admin.id, email: admin.email, role: 'admin' };
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token válido por 1 hora
            res.json({ message: "Login de admin bem-sucedido!", token: token });
        } else {
            res.status(401).json({ error: "Credenciais inválidas." });
        }
    } catch (err) {
        console.error('Erro no login de admin:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// Login de aluno
app.post('/api/alunos/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email e senha são obrigatórios." });
        }

        const result = await pool.query('SELECT * FROM alunos WHERE email = $1', [email]);
        const aluno = result.rows[0];

        if (!aluno) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        const match = await bcrypt.compare(password, aluno.password_hash);

        if (match) {
            // Incluído 'role: student' no payload do JWT, e o nome do aluno
            const payload = { id: aluno.id, email: aluno.email, role: 'student', nome: aluno.name };
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token válido por 1 hora
            res.json({ message: "Login de aluno bem-sucedido!", token: token });
        } else {
            res.status(401).json({ error: "Credenciais inválidas." });
        }
    } catch (err) {
        console.error('Erro no login de aluno:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});


// ------------------- Rotas de Cursos -------------------

// Listar todos os cursos (com contagem de alunos e aulas para o admin)
app.get('/api/cursos', authenticateToken, async (req, res) => {
    try {
        const sql = `
            SELECT
                c.id,
                c.name,
                c.description,
                COUNT(DISTINCT i.aluno_id)::int AS num_students,
                COUNT(DISTINCT a.id)::int AS num_lessons
            FROM
                cursos c
            LEFT JOIN
                inscricoes i ON c.id = i.curso_id
            LEFT JOIN
                aulas a ON c.id = a.curso_id
            GROUP BY
                c.id, c.name, c.description
            ORDER BY
                c.name;
        `;
        const result = await pool.query(sql);
        res.json({ message: "success", data: result.rows });
    } catch (err) {
        console.error('Erro ao listar cursos:', err);
        res.status(500).json({ error: "Erro interno do servidor ao listar cursos." });
    }
});

// Obter detalhes de um curso específico
app.get('/api/cursos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM cursos WHERE id = $1", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Curso não encontrado." });
        }
        res.json({ message: "success", data: result.rows[0] });
    } catch (err) {
        console.error('Erro ao obter curso por ID:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// Criar um novo curso
app.post('/api/cursos', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !description) {
            return res.status(400).json({ error: "Nome e descrição são obrigatórios." });
        }
        const sql = 'INSERT INTO cursos (name, description) VALUES ($1, $2) RETURNING *';
        const result = await pool.query(sql, [name, description]);
        res.status(201).json({ message: "Curso criado com sucesso!", data: result.rows[0] });
    } catch (err) {
        console.error('Erro ao criar curso:', err);
        res.status(500).json({ error: "Erro interno do servidor ao criar curso." });
    }
});

// Atualizar um curso existente
app.put('/api/cursos/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        if (!name || !description) {
            return res.status(400).json({ error: "Nome e descrição são obrigatórios." });
        }
        const sql = 'UPDATE cursos SET name = $1, description = $2 WHERE id = $3 RETURNING *';
        const result = await pool.query(sql, [name, description, id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Curso não encontrado." });
        }
        res.json({ message: "Curso atualizado com sucesso!", data: result.rows[0] });
    } catch (err) {
        console.error('Erro ao atualizar curso:', err);
        res.status(500).json({ error: "Erro interno do servidor ao atualizar curso." });
    }
});

// Deletar um curso (com exclusão em cascata de aulas e inscrições)
app.delete('/api/cursos/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // As exclusões em cascata serão tratadas pelo ON DELETE CASCADE nas tabelas filhas (inscricoes, aulas)
        const result = await pool.query('DELETE FROM cursos WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Curso não encontrado." });
        }
        res.json({ message: "Curso e todos os seus dados associados foram excluídos com sucesso!" });
    } catch (err) {
        console.error('Erro ao excluir curso:', err);
        res.status(500).json({ error: "Erro interno do servidor ao excluir curso." });
    }
});

// Obter alunos inscritos em um curso específico
app.get('/api/cursos/:id/alunos', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT
                a.id,
                a.name,
                a.email
            FROM
                alunos a
            JOIN
                inscricoes i ON a.id = i.aluno_id
            WHERE
                i.curso_id = $1
            ORDER BY
                a.name;
        `;
        const result = await pool.query(sql, [id]);
        res.json({ message: "success", data: result.rows });
    } catch (err) {
        console.error('Erro ao listar alunos de um curso:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});


// ------------------- Rotas de Alunos -------------------

// Listar todos os alunos (com informações de curso principal, progresso e último acesso)
app.get('/api/alunos', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const sql = `
            SELECT
                al.id,
                al.name,
                al.email,
                (SELECT c.name FROM cursos c JOIN inscricoes i ON c.id = i.curso_id WHERE i.aluno_id = al.id ORDER BY i.id LIMIT 1) AS main_course_name,
                (
                    SELECT
                        CASE
                            WHEN COUNT(a.id) = 0 THEN 0
                            ELSE ROUND((COUNT(p.id)::numeric / COUNT(a.id)) * 100)
                        END
                    FROM
                        aulas a
                    LEFT JOIN
                        progresso p ON a.id = p.aula_id AND p.aluno_id = al.id
                    WHERE a.curso_id IN (SELECT curso_id FROM inscricoes WHERE aluno_id = al.id)
                )::int AS progress_percent,
                (SELECT MAX(created_at) FROM progresso WHERE aluno_id = al.id) AS last_access
            FROM
                alunos al
            ORDER BY
                al.name;
        `;
        const result = await pool.query(sql);
        res.json({ message: "success", data: result.rows });
    } catch (err) {
        console.error('Erro ao listar alunos:', err);
        res.status(500).json({ error: "Erro interno do servidor ao listar alunos." });
    }
});

// Obter detalhes de um aluno específico
app.get('/api/alunos/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT id, name, email FROM alunos WHERE id = $1", [id]); // Não retorna password_hash
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Aluno não encontrado." });
        }
        res.json({ message: "success", data: result.rows[0] });
    } catch(err) {
        console.error('Erro ao obter aluno por ID:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// Criar um novo aluno
app.post('/api/alunos', authenticateToken, authorizeAdmin, async (req, res) => {
    const { name, email, password, curso_id } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Nome, email e senha são obrigatórios para um novo aluno." });
    }

    const client = await pool.connect(); // Inicia uma transação
    try {
        await client.query('BEGIN'); // Começa a transação

        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const alunoSql = 'INSERT INTO alunos (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id';
        const alunoResult = await client.query(alunoSql, [name, email, hash]);
        const novoAlunoId = alunoResult.rows[0].id;

        // Se um curso_id for fornecido, inscreve o aluno no curso
        if (curso_id) {
            const inscricaoSql = 'INSERT INTO inscricoes (aluno_id, curso_id) VALUES ($1, $2)';
            await client.query(inscricaoSql, [novoAlunoId, curso_id]);
        }

        await client.query('COMMIT'); // Confirma a transação
        res.status(201).json({ message: "Aluno criado com sucesso!", data: { id: novoAlunoId, name, email, curso_id } });
    } catch (err) {
        await client.query('ROLLBACK'); // Desfaz a transação em caso de erro
        console.error('Erro ao criar aluno:', err);
        if (err.code === '23505') { // Conflito de email
            return res.status(409).json({ error: "Este email já está em uso." });
        }
        res.status(500).json({ error: "Erro interno do servidor." });
    } finally {
        client.release(); // Libera o cliente de volta para o pool
    }
});

// Atualizar um aluno existente (opcionalmente atualiza a senha)
app.put('/api/alunos/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body; // 'password' é opcional aqui

        if (!name || !email) {
            return res.status(400).json({ error: "Nome e email são obrigatórios." });
        }

        let sql = 'UPDATE alunos SET name = $1, email = $2 WHERE id = $3 RETURNING *';
        let params = [name, email, id];

        // Se uma nova senha for fornecida, faça o hash e inclua na atualização
        if (password) {
            const hash = await bcrypt.hash(password, SALT_ROUNDS);
            sql = 'UPDATE alunos SET name = $1, email = $2, password_hash = $4 WHERE id = $3 RETURNING *';
            params = [name, email, id, hash];
        }

        const result = await pool.query(sql, params);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Aluno não encontrado." });
        }
        res.json({ message: "Aluno atualizado com sucesso!", data: result.rows[0] });
    } catch (err) {
        console.error('Erro ao atualizar aluno:', err);
        if (err.code === '23505') { // Conflito de email
            return res.status(409).json({ error: "Este email já está em uso." });
        }
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// Deletar um aluno (com exclusão em cascata de inscrições e progresso)
app.delete('/api/alunos/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // As exclusões em cascata serão tratadas pelo ON DELETE CASCADE nas tabelas filhas
        const result = await pool.query('DELETE FROM alunos WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Aluno não encontrado." });
        }
        res.json({ message: "Aluno e todos os seus dados associados foram excluídos com sucesso!" });
    } catch (err) {
        console.error('Erro ao excluir aluno:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});


// ------------------- Rotas de Aulas/Conteúdo -------------------

// Listar aulas de um curso específico (para admin)
app.get('/api/cursos/:curso_id/aulas', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { curso_id } = req.params;
        const result = await pool.query("SELECT * FROM aulas WHERE curso_id = $1 ORDER BY id", [curso_id]);
        res.json({ message: "Aulas listadas com sucesso", data: result.rows });
    } catch (err) {
        console.error('Erro ao listar aulas por curso (admin):', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// Obter detalhes de uma aula específica
app.get('/api/aulas/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM aulas WHERE id = $1", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Aula não encontrada." });
        }
        res.json({ message: "Aula encontrada com sucesso", data: result.rows[0] });
    } catch (err) {
        console.error('Erro ao obter aula por ID:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// Criar uma nova aula (com ou sem upload de arquivo)
app.post('/api/aulas', authenticateToken, authorizeAdmin, upload.single('conteudo'), async (req, res) => {
    try {
        const { titulo, tipo, curso_id } = req.body;
        // O 'conteudo' pode vir do campo de arquivo (req.file) ou do corpo da requisição (req.body.conteudo)
        const conteudo = req.file ? `/uploads/${req.file.filename}` : req.body.conteudo;

        if (!titulo || !tipo || !conteudo || !curso_id) {
            return res.status(400).json({ error: "Título, tipo, conteúdo e ID do curso são obrigatórios." });
        }

        const sql = "INSERT INTO aulas (titulo, tipo, conteudo, curso_id) VALUES ($1, $2, $3, $4) RETURNING id";
        const result = await pool.query(sql, [titulo, tipo, conteudo, curso_id]);

        res.status(201).json({ message: "Aula criada com sucesso", data: { id: result.rows[0].id } });
    } catch (err) {
        console.error('Erro ao criar aula:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// Atualizar uma aula existente (com ou sem novo upload de arquivo)
app.put('/api/aulas/:id', authenticateToken, authorizeAdmin, upload.single('conteudo'), async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, tipo } = req.body;
        // Se um novo arquivo foi enviado, use-o; caso contrário, mantenha o conteúdo existente
        const conteudo = req.file ? `/uploads/${req.file.filename}` : req.body.conteudo;

        if (!titulo || !tipo || !conteudo) { // Verifica se pelo menos o título, tipo e algum conteúdo estão presentes
            return res.status(400).json({ error: "Título, tipo e conteúdo são obrigatórios." });
        }

        const sql = "UPDATE aulas SET titulo = $1, tipo = $2, conteudo = $3 WHERE id = $4";
        const result = await pool.query(sql, [titulo, tipo, conteudo, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Aula não encontrada." });
        }
        res.json({ message: "Aula atualizada com sucesso" });
    } catch (err) {
        console.error('Erro ao atualizar aula:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// Deletar uma aula
app.delete('/api/aulas/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM aulas WHERE id = $1", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Aula não encontrada." });
        }
        res.json({ message: "Aula excluída com sucesso" });
    } catch (err) {
        console.error('Erro ao excluir aula:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// ------------------- Rotas de Inscrições e Progresso -------------------

// Obter cursos de um aluno específico (para o portal do aluno)
app.get('/api/alunos/:id/cursos', authenticateToken, authorizeStudent, async (req, res) => {
    try {
        const { id } = req.params;
        // Garante que o aluno autenticado só possa ver seus próprios cursos
        if (req.user.id !== parseInt(id, 10)) {
            return res.status(403).json({ message: "Acesso negado. Você só pode ver seus próprios cursos." });
        }

        const sql = `
            SELECT
                c.id,
                c.name,
                c.description
            FROM
                cursos c
            JOIN
                inscricoes i ON c.id = i.curso_id
            WHERE
                i.aluno_id = $1
            ORDER BY
                c.name;
        `;
        const result = await pool.query(sql, [id]);
        res.json({ message: "success", data: result.rows });
    } catch (err) {
        console.error('Erro ao listar cursos do aluno:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// Obter aulas de um curso específico para um aluno (com status de conclusão)
app.get('/api/alunos/:aluno_id/cursos/:curso_id/aulas', authenticateToken, authorizeStudent, async (req, res) => {
    try {
        const { aluno_id, curso_id } = req.params;
        // Garante que o aluno autenticado só possa ver suas próprias aulas
        if (req.user.id !== parseInt(aluno_id, 10)) {
            return res.status(403).json({ message: "Acesso negado. Você só pode ver o progresso de suas próprias aulas." });
        }

        const sql = `
            SELECT
                a.id,
                a.titulo,
                a.tipo,
                a.conteudo,
                CASE WHEN p.id IS NOT NULL THEN true ELSE false END as concluida
            FROM
                aulas a
            LEFT JOIN
                progresso p ON a.id = p.aula_id AND p.aluno_id = $1
            WHERE
                a.curso_id = $2
            ORDER BY
                a.id;
        `;
        const result = await pool.query(sql, [aluno_id, curso_id]);
        res.json({ message: "Aulas do curso com progresso", data: result.rows });
    } catch (err) {
        console.error('Erro ao listar aulas do curso com progresso do aluno:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// Inscrever um aluno em um curso (por admin)
app.post('/api/inscricoes', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { aluno_id, curso_id } = req.body;
        if (!aluno_id || !curso_id) {
            return res.status(400).json({ error: "ID do aluno e do curso são obrigatórios." });
        }
        const sql = 'INSERT INTO inscricoes (aluno_id, curso_id) VALUES ($1, $2)';
        await pool.query(sql, [aluno_id, curso_id]);
        res.status(201).json({ message: "Inscrição realizada com sucesso!" });
    } catch (err) {
        if(err.code === '23505') { // Conflito de chave única (aluno já inscrito no curso)
            return res.status(409).json({ message: "O aluno já está inscrito neste curso." });
        }
        console.error('Erro ao criar inscrição:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// Remover a inscrição de um aluno em um curso (por admin)
app.delete('/api/inscricoes', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { aluno_id, curso_id } = req.body;
        if (!aluno_id || !curso_id) {
            return res.status(400).json({ error: "ID do aluno e do curso são obrigatórios." });
        }
        const sql = 'DELETE FROM inscricoes WHERE aluno_id = $1 AND curso_id = $2';
        const result = await pool.query(sql, [aluno_id, curso_id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Inscrição não encontrada." });
        }
        res.json({ message: 'Inscrição removida com sucesso!' });
    } catch (err) {
        console.error('Erro ao deletar inscrição:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// Marcar uma aula como concluída para um aluno
app.post('/api/progresso', authenticateToken, authorizeStudent, async (req, res) => {
    try {
        const { aluno_id, aula_id } = req.body;
        // Garante que o aluno autenticado só possa marcar seu próprio progresso
        if (req.user.id !== parseInt(aluno_id, 10)) {
            return res.status(403).json({ message: "Acesso negado. Você só pode marcar seu próprio progresso." });
        }
        if (!aluno_id || !aula_id) {
            return res.status(400).json({ error: "ID do aluno e da aula são obrigatórios." });
        }

        // Adicione created_at na tabela progresso se quiser a funcionalidade de last_access
        const sql = 'INSERT INTO progresso (aluno_id, aula_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (aluno_id, aula_id) DO NOTHING';
        await pool.query(sql, [aluno_id, aula_id]);

        res.status(201).json({ message: "Progresso salvo com sucesso!" });
    } catch (err) {
        console.error('Erro ao salvar progresso:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// Obter o progresso de um aluno por curso (para o portal do aluno)
app.get('/api/alunos/:id/progresso', authenticateToken, authorizeStudent, async (req, res) => {
    try {
        const { id } = req.params;
        // Garante que o aluno autenticado só possa ver seu próprio progresso
        if (req.user.id !== parseInt(id, 10)) {
            return res.status(403).json({ message: "Acesso negado. Você só pode ver seu próprio progresso." });
        }

        const sql = `
            SELECT
                c.id as curso_id,
                c.name as curso_nome,
                (SELECT COUNT(*) FROM aulas WHERE curso_id = c.id)::int as total_aulas,
                (SELECT COUNT(*) FROM progresso p JOIN aulas a ON p.aula_id = a.id WHERE p.aluno_id = $1 AND a.curso_id = c.id)::int as aulas_concluidas
            FROM
                cursos c
            JOIN
                inscricoes i ON c.id = i.curso_id
            WHERE
                i.aluno_id = $2
            ORDER BY
                c.name;
        `;
        const result = await pool.query(sql, [id, id]);
        res.json({ message: "Progresso do aluno", data: result.rows });
    } catch (err) {
        console.error('Erro ao obter progresso do aluno:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// ------------------- Rotas de Dashboard (NOVAS) -------------------

app.get('/api/dashboard/stats', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const totalAlunosResult = await pool.query('SELECT COUNT(*) AS total_alunos FROM alunos;');
        const cursosAtivosResult = await pool.query('SELECT COUNT(*) AS cursos_ativos FROM cursos;');
        const aulasPublicadasResult = await pool.query('SELECT COUNT(*) AS aulas_publicadas FROM aulas;');
        
        // Calcular taxa de conclusão global
        const taxaConclusaoResult = await pool.query(`
            SELECT
                CASE
                    WHEN COUNT(DISTINCT a.id) = 0 THEN 0
                    ELSE ROUND((COUNT(DISTINCT p.aula_id)::numeric / COUNT(DISTINCT a.id)) * 100)
                END AS taxa_conclusao
            FROM aulas a
            LEFT JOIN progresso p ON a.id = p.aula_id;
        `);

        res.json({
            message: "Estatísticas do Dashboard",
            data: {
                totalAlunos: parseInt(totalAlunosResult.rows[0].total_alunos, 10),
                cursosAtivos: parseInt(cursosAtivosResult.rows[0].cursos_ativos, 10),
                aulasPublicadas: parseInt(aulasPublicadasResult.rows[0].aulas_publicadas, 10),
                taxaConclusao: parseInt(taxaConclusaoResult.rows[0].taxa_conclusao, 10)
            }
        });
    } catch (err) {
        console.error('Erro ao buscar estatísticas do dashboard:', err);
        res.status(500).json({ error: "Erro interno do servidor ao carregar estatísticas." });
    }
});

app.get('/api/dashboard/course-progress', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const sql = `
            SELECT
                c.name AS course_name,
                (SELECT COUNT(a.id) FROM aulas a WHERE a.curso_id = c.id)::int AS total_lessons,
                (SELECT COUNT(DISTINCT p.aula_id) FROM progresso p JOIN aulas a ON p.aula_id = a.id WHERE a.curso_id = c.id)::int AS completed_lessons,
                CASE
                    WHEN (SELECT COUNT(a.id) FROM aulas a WHERE a.curso_id = c.id) = 0 THEN 0
                    ELSE ROUND((COUNT(DISTINCT p.aula_id)::numeric / (SELECT COUNT(a.id) FROM aulas a WHERE a.curso_id = c.id)) * 100)
                END AS percentage
            FROM
                cursos c
            ORDER BY c.name;
        `;
        const result = await pool.query(sql);
        res.json({ message: "Progresso dos cursos para dashboard", data: result.rows });
    } catch (err) {
        console.error('Erro ao buscar progresso dos cursos para dashboard:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.get('/api/dashboard/recent-students', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const sql = `
            SELECT
                al.name,
                al.email,
                MAX(p.created_at) AS last_access,
                (
                    SELECT
                        CASE
                            WHEN COUNT(a.id) = 0 THEN 0
                            ELSE ROUND((COUNT(p_sub.id)::numeric / COUNT(a.id)) * 100)
                        END
                    FROM
                        aulas a
                    LEFT JOIN
                        progresso p_sub ON a.id = p_sub.aula_id AND p_sub.aluno_id = al.id
                    WHERE a.curso_id IN (SELECT curso_id FROM inscricoes WHERE aluno_id = al.id)
                )::int AS last_progress_percent
            FROM
                alunos al
            LEFT JOIN
                progresso p ON al.id = p.aluno_id
            GROUP BY
                al.id, al.name, al.email
            ORDER BY
                last_access DESC NULLS LAST
            LIMIT 5; -- Retorna os 5 alunos com acesso mais recente
        `;
        const result = await pool.query(sql);
        res.json({ message: "Alunos recentes para dashboard", data: result.rows });
    } catch (err) {
        console.error('Erro ao buscar alunos recentes para dashboard:', err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// ------------------- Rotas de Financeiro (NOVAS) -------------------

// Mock de dados de pagamento (substitua por dados reais do BD)
// NOTE: Você precisará criar uma tabela de 'pagamentos' no seu banco de dados para que isso seja persistente
/*
Exemplo de tabela de pagamentos:
CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,
    aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    curso_id INTEGER REFERENCES cursos(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE, -- Data em que foi pago
    status TEXT NOT NULL CHECK (status IN ('Pago', 'Pendente', 'Atrasado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
*/

app.get('/api/financeiro/stats', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        // Exemplo de queries (ajuste para sua estrutura real de pagamentos)
        const receitaTotalResult = await pool.query("SELECT COALESCE(SUM(amount), 0)::numeric FROM pagamentos WHERE status = 'Pago';");
        const receitaMesResult = await pool.query("SELECT COALESCE(SUM(amount), 0)::numeric FROM pagamentos WHERE status = 'Pago' AND payment_date >= date_trunc('month', CURRENT_DATE);");
        const alunosAtivosResult = await pool.query("SELECT COUNT(DISTINCT aluno_id) FROM inscricoes;");
        const inadimplentesResult = await pool.query("SELECT COUNT(DISTINCT aluno_id) FROM pagamentos WHERE status = 'Atrasado';");

        res.json({
            message: "Estatísticas financeiras",
            data: {
                receitaTotal: parseFloat(receitaTotalResult.rows[0].coalesce),
                receitaMes: parseFloat(receitaMesResult.rows[0].coalesce),
                alunosAtivos: parseInt(alunosAtivosResult.rows[0].count, 10),
                inadimplentes: parseInt(inadimplentesResult.rows[0].count, 10)
            }
        });
    } catch (err) {
        console.error('Erro ao buscar estatísticas financeiras:', err);
        res.status(500).json({ error: "Erro interno do servidor ao carregar estatísticas financeiras." });
    }
});

app.get('/api/financeiro/pagamentos', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const sql = `
            SELECT
                p.id,
                al.name AS student_name,
                c.name AS course_name,
                p.amount,
                p.due_date,
                p.payment_date,
                p.status
            FROM
                pagamentos p
            JOIN
                alunos al ON p.aluno_id = al.id
            LEFT JOIN
                cursos c ON p.curso_id = c.id
            ORDER BY
                p.due_date DESC;
        `;
        const result = await pool.query(sql);
        res.json({ message: "Lista de pagamentos", data: result.rows });
    } catch (err) {
        console.error('Erro ao buscar lista de pagamentos:', err);
        res.status(500).json({ error: "Erro interno do servidor ao carregar pagamentos." });
    }
});

// Adicione rotas para registrar pagamento, enviar cobrança, etc., se desejar.

// ==============================================================
// == INICIALIZAÇÃO E SERVIÇO DE ARQUIVOS ESTÁTICOS ==
// ==============================================================

// Servir arquivos estáticos (CSS, JS do frontend, imagens, etc.)
// O diretório 'uploads' precisa ser acessível para os arquivos de aulas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir os arquivos estáticos da raiz do projeto (index.html, login.html, portal.html, pages/)
// A ordem é importante: arquivos específicos primeiro, depois o estático geral
app.use(express.static(path.join(__dirname)));

// Rotas para as páginas HTML principais, talvez com verificação de autenticação
app.get('/', (req, res) => {
    // Redireciona para login se for a raiz
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Rota protegida para o portal do aluno
app.get('/portal.html', authenticateToken, authorizeStudent, (req, res) => {
    res.sendFile(path.join(__dirname, 'portal.html'));
});

// Rota protegida para o painel do administrador
app.get('/index.html', authenticateToken, authorizeAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// Função para iniciar o servidor web
function startWebServer() {
    console.log("Banco de dados pronto. Iniciando o servidor web...");
    app.listen(port, () => {
        console.log(`Servidor web rodando com sucesso na porta ${port}`);
        console.log(`Acesse a aplicação em: http://localhost:${port}`);
    });
}

// Função para preparar o banco de dados (criar tabelas se não existirem)
const prepareDatabase = async () => {
    // Adicionado `ON DELETE CASCADE` para garantir integridade referencial em exclusões
    // Adicionado `created_at` em `progresso` para a funcionalidade de last_access
    const queries = [
        `CREATE TABLE IF NOT EXISTS cursos (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT
        );`,
        `CREATE TABLE IF NOT EXISTS alunos (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL
        );`,
        `CREATE TABLE IF NOT EXISTS admins (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL
        );`,
        `CREATE TABLE IF NOT EXISTS inscricoes (
            id SERIAL PRIMARY KEY,
            aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
            curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
            UNIQUE(aluno_id, curso_id)
        );`,
        `CREATE TABLE IF NOT EXISTS aulas (
            id SERIAL PRIMARY KEY,
            titulo TEXT NOT NULL,
            tipo TEXT NOT NULL,
            conteudo TEXT NOT NULL,
            curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE
        );`,
        `CREATE TABLE IF NOT EXISTS progresso (
            id SERIAL PRIMARY KEY,
            aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
            aula_id INTEGER NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(aluno_id, aula_id)
        );`,
        // NOVO: Tabela para pagamentos financeiros
        `CREATE TABLE IF NOT EXISTS pagamentos (
            id SERIAL PRIMARY KEY,
            aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
            curso_id INTEGER REFERENCES cursos(id) ON DELETE SET NULL, -- O curso pode ser null se for uma cobrança geral, por exemplo
            amount NUMERIC(10, 2) NOT NULL,
            due_date DATE NOT NULL,
            payment_date DATE, -- Data em que o pagamento foi efetivado
            status TEXT NOT NULL CHECK (status IN ('Pago', 'Pendente', 'Atrasado')),
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`
    ];
    const client = await pool.connect();
    console.log("Conexão com o banco de dados PostgreSQL estabelecida com sucesso.");
    try {
        for (const query of queries) {
            await client.query(query);
        }
        console.log("Tabelas verificadas/criadas com sucesso.");
    } finally {
        client.release();
    }
};

// Função principal que orquestra a inicialização da aplicação
async function start() {
    try {
        console.log("Iniciando verificação e configuração do banco de dados...");
        await prepareDatabase();
        startWebServer();
    } catch (err) {
        console.error("!!!!!!!!!! FALHA CRÍTICA NA INICIALIZAÇÃO DO SERVIDOR !!!!!!!!!!");
        console.error("Não foi possível conectar ao banco de dados ou criar/verificar as tabelas. Detalhes do erro:", err);
        process.exit(1); // Encerra o processo com erro
    }
}

// Inicia a aplicação
start();