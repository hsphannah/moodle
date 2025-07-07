// backend/server.js (VERSÃO FINAL E COMPLETA)

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./db.sqlite', (err) => {
    if (err) {
        return console.error("Erro ao abrir o banco de dados", err.message);
    }
    console.log("Conectado ao banco de dados SQLite.");

    db.serialize(() => {
        db.run('CREATE TABLE IF NOT EXISTS cursos (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT)', (err) => {
            if (err) { return console.error("Erro ao criar a tabela de cursos", err.message); }
            console.log("Tabela 'cursos' pronta.");
        });
        db.run('CREATE TABLE IF NOT EXISTS alunos (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, course TEXT NOT NULL)', (err) => {
            if (err) { return console.error("Erro ao criar a tabela de alunos", err.message); }
            console.log("Tabela 'alunos' pronta.");
        });
    });
});

// ===============================================
// API DE CURSOS (CRUD COMPLETO)
// ===============================================

// GET (TODOS)
app.get('/api/cursos', (req, res) => {
    const sql = "SELECT * FROM cursos ORDER BY name";
    db.all(sql, [], (err, rows) => {
        if (err) { res.status(500).json({ "error": err.message }); return; }
        res.json({ message: "success", data: rows });
    });
});

// GET (UM)
app.get('/api/cursos/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM cursos WHERE id = ?";
    db.get(sql, [id], (err, row) => {
        if (err) { res.status(500).json({ "error": err.message }); return; }
        if (!row) { return res.status(404).json({ message: "Curso não encontrado." }); }
        res.json({ message: "success", data: row });
    });
});

// POST
app.post('/api/cursos', (req, res) => {
    const { name, description } = req.body;
    if (!name || !description) { return res.status(400).json({ "error": "Nome e descrição são obrigatórios." }); }
    const sql = 'INSERT INTO cursos (name, description) VALUES (?, ?)';
    db.run(sql, [name, description], function(err) {
        if (err) { res.status(500).json({ "error": err.message }); return; }
        res.status(201).json({ message: "Curso criado com sucesso!", data: { id: this.lastID, name, description } });
    });
});

// PUT
app.put('/api/cursos/:id', (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name || !description) { return res.status(400).json({ "error": "Nome e descrição são obrigatórios." }); }
    const sql = 'UPDATE cursos SET name = ?, description = ? WHERE id = ?';
    db.run(sql, [name, description, id], function(err) {
        if (err) { res.status(500).json({ "error": err.message }); return; }
        if (this.changes === 0) { return res.status(404).json({ message: "Curso não encontrado." }); }
        res.json({ message: "Curso atualizado com sucesso!", data: { id: id, name, description } });
    });
});

// DELETE
app.delete('/api/cursos/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM cursos WHERE id = ?';
    db.run(sql, id, function(err) {
        if (err) { res.status(500).json({ "error": err.message }); return; }
        if (this.changes === 0) { return res.status(404).json({ message: "Curso não encontrado." }); }
        res.json({ message: "Curso excluído com sucesso!", changes: this.changes });
    });
});


// ===============================================
// API DE ALUNOS (CRUD COMPLETO)
// ===============================================

// GET (TODOS)
app.get('/api/alunos', (req, res) => {
    const sql = "SELECT * FROM alunos ORDER BY name";
    db.all(sql, [], (err, rows) => {
        if (err) { res.status(500).json({ "error": err.message }); return; }
        res.json({ message: "success", data: rows });
    });
});

// GET (UM)
app.get('/api/alunos/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM alunos WHERE id = ?";
    db.get(sql, [id], (err, row) => {
        if (err) { res.status(500).json({ "error": err.message }); return; }
        if (!row) { return res.status(404).json({ message: "Aluno não encontrado." }); }
        res.json({ message: "success", data: row });
    });
});

// POST
app.post('/api/alunos', (req, res) => {
    const { name, email, course } = req.body;
    if (!name || !email || !course) { return res.status(400).json({ "error": "Nome, email e curso são obrigatórios." }); }
    const sql = 'INSERT INTO alunos (name, email, course) VALUES (?, ?, ?)';
    db.run(sql, [name, email, course], function(err) {
        if (err) { res.status(500).json({ "error": err.message }); return; }
        res.status(201).json({ message: "Aluno criado com sucesso!", data: { id: this.lastID, name, email, course } });
    });
});

// PUT
app.put('/api/alunos/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, course } = req.body;
    if (!name || !email || !course) { return res.status(400).json({ "error": "Nome, email e curso são obrigatórios." }); }
    const sql = 'UPDATE alunos SET name = ?, email = ?, course = ? WHERE id = ?';
    db.run(sql, [name, email, course, id], function(err) {
        if (err) { res.status(500).json({ "error": err.message }); return; }
        if (this.changes === 0) { return res.status(404).json({ message: "Aluno não encontrado." }); }
        res.json({ message: "Aluno atualizado com sucesso!", data: { id: id, name, email, course } });
    });
});

// DELETE
app.delete('/api/alunos/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM alunos WHERE id = ?';
    db.run(sql, id, function(err) {
        if (err) { res.status(500).json({ "error": err.message }); return; }
        if (this.changes === 0) { return res.status(404).json({ message: "Aluno não encontrado." }); }
        res.json({ message: "Aluno excluído com sucesso!", changes: this.changes });
    });
});


// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});