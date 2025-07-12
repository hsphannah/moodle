// --- ARQUIVO: server.js (Nova Tentativa de Correção) ---

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt =require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;

const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_local_super_secreto_e_forte';
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middlewares Essenciais
app.use(cors());
app.use(express.json());

// --- MUDANÇA IMPORTANTE: A linha de 'uploads' foi REMOVIDA daqui ---

// Configuração do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// Função para criar as tabelas
const createTables = async () => {
    // ... (nenhuma mudança aqui, seu código de tabelas está perfeito)
    const queries = [
        `CREATE TABLE IF NOT EXISTS cursos (id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT);`,
        `CREATE TABLE IF NOT EXISTS alunos (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL);`,
        `CREATE TABLE IF NOT EXISTS admins (id SERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL);`,
        `CREATE TABLE IF NOT EXISTS inscricoes (id SERIAL PRIMARY KEY, aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE, curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE, UNIQUE(aluno_id, curso_id));`,
        `CREATE TABLE IF NOT EXISTS aulas (id SERIAL PRIMARY KEY, titulo TEXT NOT NULL, tipo TEXT NOT NULL, conteudo TEXT NOT NULL, curso_id INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE);`,
        `CREATE TABLE IF NOT EXISTS progresso (id SERIAL PRIMARY KEY, aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE, aula_id INTEGER NOT NULL REFERENCES aulas(id) ON DELETE CASCADE, UNIQUE(aluno_id, aula_id));`
    ];
    try {
        for (const query of queries) {
            await pool.query(query);
        }
        console.log("Tabelas verificadas/criadas com sucesso no PostgreSQL.");
    } catch (err) {
        console.error("Erro fatal ao criar as tabelas:", err);
    }
};

// Middleware de Autenticação
const authenticateToken = (req, res, next) => {
    // ... (nenhuma mudança aqui)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => { if (err) return res.sendStatus(403); req.user = user; next(); });
};

// ===========================================
// == ROTAS DE API (NENHUMA MUDANÇA AQUI) ==
// ===========================================

// ... (todas as suas rotas /api/... continuam exatamente as mesmas)
app.get('/health', (req, res) => { res.status(200).json({ status: 'ok' }); });
app.post('/api/register', async (req, res) => { /* ... seu código ... */ });
app.post('/api/admin/login', async (req, res) => { /* ... seu código ... */ });
app.post('/api/alunos/login', async (req, res) => { /* ... seu código ... */ });
app.get('/api/cursos', async (req, res) => { /* ... seu código ... */ });
app.get('/api/cursos/:id', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.post('/api/cursos', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.put('/api/cursos/:id', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.delete('/api/cursos/:id', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.get('/api/cursos/:id/alunos', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.get('/api/alunos', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.get('/api/alunos/:id', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.post('/api/alunos', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.put('/api/alunos/:id', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.delete('/api/alunos/:id', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.get('/api/cursos/:curso_id/aulas', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.get('/api/aulas/:id', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.post('/api/aulas', authenticateToken, upload.single('conteudo'), async (req, res) => { /* ... seu código ... */ });
app.put('/api/aulas/:id', authenticateToken, upload.single('conteudo'), async (req, res) => { /* ... seu código ... */ });
app.delete('/api/aulas/:id', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.get('/api/alunos/:id/cursos', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.get('/api/alunos/:aluno_id/cursos/:curso_id/aulas', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.post('/api/inscricoes', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.delete('/api/inscricoes', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.post('/api/progresso', authenticateToken, async (req, res) => { /* ... seu código ... */ });
app.get('/api/alunos/:id/progresso', authenticateToken, async (req, res) => { /* ... seu código ... */ });


// ==============================================================
// == ROTAS DE ARQUIVOS ESTÁTICOS (SEÇÃO ATUALIZADA) ==
// ==============================================================

// **CORREÇÃO AQUI**: Servimos a pasta /uploads primeiro
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Depois, servimos os outros arquivos estáticos da raiz (index.html, portal.html, css, etc)
app.use(express.static(path.join(__dirname)));

// A rota da página inicial (login) vem depois dos arquivos estáticos
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Rota final "catch-all" para lidar com qualquer outra requisição,
// talvez redirecionando para a página de login.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});


// --- INICIA O SERVIDOR ---
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
    createTables();
});