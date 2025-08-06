const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public')); // <-- Serve os arquivos HTML/CSS/JS

// Banco de dados
async function openDb() {
    return open({
        filename: './database.db',
        driver: sqlite3.Database
    });
}

// Criar tabela
async function createUsersTable() {
    const db = await openDb();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log("Tabela 'users' criada com sucesso");
}

// Rota de registro
app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = await openDb();

        const result = await db.run(
            'INSERT INTO users (email, password) VALUES (?, ?)',
            [email, password]
        );

        res.status(201).json({ success: true, userId: result.lastID });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rota de login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = await openDb();

        const user = await db.get(
            'SELECT * FROM users WHERE email = ? AND password = ?',
            [email, password]
        );

        if (user) {
            res.status(200).json({ success: true, userId: user.id });
        } else {
            res.status(401).json({ success: false, error: "E-mail ou senha incorretos" });
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Iniciar o servidor
const PORT = 3001;
app.listen(PORT, async () => {
    await createUsersTable();
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
