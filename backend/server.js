// server.js - Versão 100% Completa e Final com PostgreSQL

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg'); // Importa o conector do PostgreSQL

// Carrega variáveis de ambiente do arquivo .env (ótimo para desenvolvimento local e obrigatório no Render)
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000; // Usa a porta definida pelo Render, ou 3000 localmente
const saltRounds = 10;

// Usa as variáveis de ambiente.
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_local_super_secreto';
const DATABASE_URL = process.env.DATABASE_URL;

// Configuração da Conexão com o Banco de Dados PostgreSQL
const pool = new Pool({
    connectionString: DATABASE_URL,
    // No ambiente de produção do Render, a conexão SSL é necessária
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ROTA ESPECÍFICA PARA A "PORTA DE ENTRADA" (/) VEM PRIMEIRO
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// O MIDDLEWARE GERAL DE ARQUIVOS ESTÁTICOS VEM DEPOIS
app.use(express.static(__dirname)); 


// Configuração do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage });

// Função para criar as tabelas se não existirem
const createTables = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS cursos (id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT);
    CREATE TABLE IF NOT EXISTS alunos (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS admins (id SERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS inscricoes (id SERIAL PRIMARY KEY, aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE, curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE, UNIQUE(aluno_id, curso_id));
    CREATE TABLE IF NOT EXISTS aulas (id SERIAL PRIMARY KEY, titulo TEXT NOT NULL, tipo TEXT NOT NULL, conteudo TEXT NOT NULL, curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS progresso (id SERIAL PRIMARY KEY, aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE, aula_id INTEGER NOT NULL REFERENCES aulas(id) ON DELETE CASCADE, UNIQUE(aluno_id, aula_id));
    `;
    try {
        await pool.query(queryText);
        console.log("Tabelas verificadas/criadas com sucesso no PostgreSQL.");
    } catch (err) {
        console.error("Erro ao criar as tabelas:", err);
    }
};

// Middleware de Autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => { if (err) return res.sendStatus(403); req.user = user; next(); });
};


// --- ROTAS DE API ---

// == AUTENTICAÇÃO E ADMIN ==
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email e senha são obrigatórios." });
        const hash = await bcrypt.hash(password, saltRounds);
        const sql = 'INSERT INTO admins (email, password_hash) VALUES ($1, $2) RETURNING id';
        const result = await pool.query(sql, [email, hash]);
        res.status(201).json({ message: "Administrador registrado com sucesso!", userId: result.rows[0].id });
    } catch (err) {
        console.error(err);
        if (err.code === '23505') return res.status(409).json({ error: "Este email já está em uso." });
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email e senha são obrigatórios." });
        const sql = 'SELECT * FROM admins WHERE email = $1';
        const result = await pool.query(sql, [email]);
        const admin = result.rows[0];
        if (!admin) return res.status(401).json({ error: "Credenciais inválidas." });
        const match = await bcrypt.compare(password, admin.password_hash);
        if (match) {
            const payload = { id: admin.id, email: admin.email };
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
            res.json({ message: "Login bem-sucedido!", token: token });
        } else {
            res.status(401).json({ error: "Credenciais inválidas." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});


// == CURSOS ==
app.get('/api/cursos', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM cursos ORDER BY name");
        res.json({ message: "success", data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.get('/api/cursos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM cursos WHERE id = $1", [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Curso não encontrado." });
        res.json({ message: "success", data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.get('/api/cursos/:id/alunos', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `SELECT a.id, a.name, a.email FROM alunos a JOIN inscricoes i ON a.id = i.aluno_id WHERE i.curso_id = $1`;
        const result = await pool.query(sql, [id]);
        res.json({ message: "success", data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.post('/api/cursos', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !description) return res.status(400).json({ error: "Nome e descrição são obrigatórios." });
        const sql = 'INSERT INTO cursos (name, description) VALUES ($1, $2) RETURNING *';
        const result = await pool.query(sql, [name, description]);
        res.status(201).json({ message: "Curso criado com sucesso!", data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.put('/api/cursos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        if (!name || !description) return res.status(400).json({ error: "Nome e descrição são obrigatórios." });
        const sql = 'UPDATE cursos SET name = $1, description = $2 WHERE id = $3 RETURNING *';
        const result = await pool.query(sql, [name, description, id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Curso não encontrado." });
        res.json({ message: "Curso atualizado com sucesso!", data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.delete('/api/cursos/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM cursos WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Curso não encontrado." });
        res.json({ message: "Curso e todos os seus dados associados foram excluídos com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});


// == ALUNOS ==
app.post('/api/alunos', authenticateToken, async (req, res) => {
    // Agora recebemos a senha do front-end
    const { name, email, password, curso_id } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: "Nome, email e senha são obrigatórios." });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Criptografa a senha antes de salvar
        const hash = await bcrypt.hash(password, saltRounds);

        const alunoSql = 'INSERT INTO alunos (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id';
        const alunoResult = await client.query(alunoSql, [name, email, hash]);
        const novoAlunoId = alunoResult.rows[0].id;

        if (curso_id) {
            const inscricaoSql = 'INSERT INTO inscricoes (aluno_id, curso_id) VALUES ($1, $2)';
            await client.query(inscricaoSql, [novoAlunoId, curso_id]);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: "Aluno criado com sucesso!", data: { id: novoAlunoId, name, email } });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        if (err.code === '23505') return res.status(409).json({ error: "Este email já está em uso." });
        res.status(500).json({ error: "Erro interno do servidor." });
    } finally {
        client.release();
    }
});


// == AULAS ==
app.get('/api/cursos/:curso_id/aulas', authenticateToken, async (req, res) => {
    try {
        const { curso_id } = req.params;
        const sql = "SELECT * FROM aulas WHERE curso_id = $1 ORDER BY id";
        const result = await pool.query(sql, [curso_id]);
        res.json({ message: "Aulas listadas com sucesso", data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.get('/api/aulas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM aulas WHERE id = $1", [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Aula não encontrada." });
        res.json({ message: "Aula encontrada com sucesso", data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.post('/api/aulas', authenticateToken, upload.single('conteudo'), async (req, res) => {
    try {
        const { titulo, tipo, curso_id } = req.body;
        const conteudo = req.file ? `/uploads/${req.file.filename}` : req.body.conteudo;
        if (!titulo || !tipo || !conteudo || !curso_id) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios." });
        }
        const sql = "INSERT INTO aulas (titulo, tipo, conteudo, curso_id) VALUES ($1, $2, $3, $4) RETURNING id";
        const result = await pool.query(sql, [titulo, tipo, conteudo, curso_id]);
        res.status(201).json({ message: "Aula criada com sucesso", data: { id: result.rows[0].id } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.put('/api/aulas/:id', authenticateToken, upload.single('conteudo'), async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, tipo } = req.body;
        const conteudo = req.file ? `/uploads/${req.file.filename}` : req.body.conteudo;
        
        if (!titulo || !tipo || !conteudo) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios." });
        }
        const sql = "UPDATE aulas SET titulo = $1, tipo = $2, conteudo = $3 WHERE id = $4";
        const result = await pool.query(sql, [titulo, tipo, conteudo, id]);

        if (result.rowCount === 0) return res.status(404).json({ message: "Aula não encontrada." });
        res.json({ message: "Aula atualizada com sucesso" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.delete('/api/aulas/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM aulas WHERE id = $1", [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Aula não encontrada." });
        res.json({ message: "Aula excluída com sucesso" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});


// == INSCRIÇÕES E PROGRESSO ==
app.post('/api/inscricoes', authenticateToken, async (req, res) => {
    try {
        const { aluno_id, curso_id } = req.body;
        if (!aluno_id || !curso_id) return res.status(400).json({ error: "ID do aluno e do curso são obrigatórios." });
        const sql = 'INSERT INTO inscricoes (aluno_id, curso_id) VALUES ($1, $2)';
        await pool.query(sql, [aluno_id, curso_id]);
        res.status(201).json({ message: "Inscrição realizada com sucesso!" });
    } catch (err) {
        if(err.code === '23505') return res.status(409).json({ message: "O aluno já está inscrito neste curso." });
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.delete('/api/inscricoes', authenticateToken, async (req, res) => {
    try {
        const { aluno_id, curso_id } = req.body;
        if (!aluno_id || !curso_id) return res.status(400).json({ error: "ID do aluno e do curso são obrigatórios." });
        const sql = 'DELETE FROM inscricoes WHERE aluno_id = $1 AND curso_id = $2';
        const result = await pool.query(sql, [aluno_id, curso_id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Inscrição não encontrada." });
        res.json({ message: 'Inscrição removida com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.get('/api/alunos/:id/cursos', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `SELECT c.id, c.name, c.description FROM cursos c JOIN inscricoes i ON c.id = i.curso_id WHERE i.aluno_id = $1`;
        const result = await pool.query(sql, [id]);
        res.json({ message: "success", data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.get('/api/alunos/:aluno_id/cursos/:curso_id/aulas', authenticateToken, async (req, res) => {
    try {
        const { aluno_id, curso_id } = req.params;
        const sql = ` SELECT a.id, a.titulo, a.tipo, a.conteudo, CASE WHEN p.id IS NOT NULL THEN true ELSE false END as concluida FROM aulas a LEFT JOIN progresso p ON a.id = p.aula_id AND p.aluno_id = $1 WHERE a.curso_id = $2 ORDER BY a.id`;
        const result = await pool.query(sql, [aluno_id, curso_id]);
        res.json({ message: "Aulas do curso com progresso", data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.post('/api/progresso', authenticateToken, async (req, res) => {
    try {
        const { aluno_id, aula_id } = req.body;
        if (!aluno_id || !aula_id) return res.status(400).json({ error: "ID do aluno e da aula são obrigatórios." });
        const sql = 'INSERT INTO progresso (aluno_id, aula_id) ON CONFLICT (aluno_id, aula_id) DO NOTHING';
        await pool.query(sql, [aluno_id, aula_id]);
        res.status(201).json({ message: "Progresso salvo com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

app.get('/api/alunos/:id/progresso', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT 
                c.id as curso_id, 
                c.name as curso_nome, 
                (SELECT COUNT(*) FROM aulas WHERE curso_id = c.id) as total_aulas,
                (SELECT COUNT(*) FROM progresso p JOIN aulas a ON p.aula_id = a.id WHERE p.aluno_id = $1 AND a.curso_id = c.id) as aulas_concluidas
            FROM cursos c 
            JOIN inscricoes i ON c.id = i.curso_id 
            WHERE i.aluno_id = $2
        `;
        const result = await pool.query(sql, [id, id]);
        res.json({ message: "Progresso do aluno", data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});
app.post('/api/alunos/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email e senha são obrigatórios." });
        }

        const sql = 'SELECT * FROM alunos WHERE email = $1';
        const result = await pool.query(sql, [email]);
        const aluno = result.rows[0];

        if (!aluno) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        const match = await bcrypt.compare(password, aluno.password_hash);
        if (match) {
            // Criamos um token específico para o aluno
            const payload = { id: aluno.id, email: aluno.email, role: 'student' };
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
            res.json({ message: "Login bem-sucedido!", token: token, userType: 'student' });
        } else {
            res.status(401).json({ error: "Credenciais inválidas." });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// --- INICIA O SERVIDOR ---
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
    // A criação das tabelas é chamada para garantir que o schema exista.
    createTables();
});