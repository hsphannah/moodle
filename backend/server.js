// backend/server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose(); // Importa o sqlite3
const cors = require('cors'); // Importa o cors

const app = express();
const port = 3000;

// Middlewares: são "funções de apoio" que rodam em toda requisição
app.use(cors()); // Permite que o front-end acesse este back-end
app.use(express.json()); // Permite que o servidor entenda requisições com corpo em JSON

// 1. Conecta ao banco de dados (ou cria o arquivo se ele não existir)
const db = new sqlite3.Database('./db.sqlite', (err) => {
    if (err) {
        console.error("Erro ao abrir o banco de dados", err.message);
    } else {
        console.log("Conectado ao banco de dados SQLite.");
        // 2. Cria a tabela de cursos se ela não existir
        db.run('CREATE TABLE IF NOT EXISTS cursos (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT)', (err) => {
            if (err) {
                console.error("Erro ao criar a tabela", err.message);
            } else {
                console.log("Tabela 'cursos' garantida.");
            }
        });
    }
});

// ===============================================
// ROTA PRINCIPAL DA API DE CURSOS
// ===============================================

// ROTA GET: Para buscar todos os cursos
app.get('/api/cursos', (req, res) => {
    const sql = "SELECT * FROM cursos";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        // Se tudo der certo, envia os cursos como resposta em JSON
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});