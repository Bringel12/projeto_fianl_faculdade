const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const cors = require('cors');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3001;

// Middlewares
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Conexão com o banco de dados
async function openDb() {
    return open({
        filename: './database.db',
        driver: sqlite3.Database
    });
}

// Criação da tabela de usuários
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
    console.log("✅ Tabela 'users' verificada/criada com sucesso");
}

// Função para descobrir o IP local automaticamente
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Rotas
app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = await openDb();

        const existing = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (existing) {
            return res.status(400).json({ success: false, error: 'E-mail já registrado' });
        }

        const result = await db.run(
            'INSERT INTO users (email, password) VALUES (?, ?)',
            [email, password]
        );

        res.status(201).json({ success: true, userId: result.lastID });
    } catch (error) {
        console.error('❌ Erro ao registrar usuário:', error);
        res.status(500).json({ success: false, error: 'Erro interno ao registrar' });
    }
});

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
        console.error('❌ Erro ao fazer login:', error);
        res.status(500).json({ success: false, error: 'Erro interno ao fazer login' });
    }
});

// Inicialização do servidor
app.listen(PORT,'0.0.0.0', async () => {
    await createUsersTable();
    const ip = getLocalIP();
    console.log(`🚀 Servidor rodando em:`);
    console.log(`→ Local:   http://localhost:${PORT}`);
    console.log(`→ Externo: http://${ip}:${PORT} (apenas na mesma rede local)`);
});
