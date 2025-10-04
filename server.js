/* server.js */
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Define os caminhos para os arquivos de dados
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

// Middlewares
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições
app.use(express.static(path.join(__dirname, 'public'))); // Serve os arquivos estáticos

// Função para garantir que o diretório /data e os arquivos JSON existam
async function initializeDataPersistence() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.access(USERS_FILE);
    } catch (error) {
        await fs.writeFile(USERS_FILE, JSON.stringify([])); // Cria o arquivo se não existir
    }

    try {
        await fs.access(EVENTS_FILE);
    } catch (error) {
        await fs.writeFile(EVENTS_FILE, JSON.stringify([])); // Cria o arquivo se não existir
    }
}

// --- ROTAS DA API ---

// POST /register - Registrar um novo usuário
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' });
        }

        const usersData = await fs.readFile(USERS_FILE, 'utf-8');
        const users = JSON.parse(usersData);

        if (users.find(user => user.username === username)) {
            return res.status(409).json({ message: 'Este nome de usuário já está em uso.' });
        }

        users.push({ id: Date.now().toString(), username, password }); // Simples, sem hash para este exemplo
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// POST /login - Autenticar um usuário
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const usersData = await fs.readFile(USERS_FILE, 'utf-8');
        const users = JSON.parse(usersData);

        const user = users.find(u => u.username === username && u.password === password);
        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        res.status(200).json({ message: 'Login bem-sucedido!', user: { username: user.username } });
    } catch (error) {
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// GET /events - Obter todos os eventos
app.get('/events', async (req, res) => {
    try {
        const eventsData = await fs.readFile(EVENTS_FILE, 'utf-8');
        res.status(200).json(JSON.parse(eventsData));
    } catch (error) {
        res.status(500).json({ message: 'Não foi possível buscar os eventos.' });
    }
});

// POST /events - Adicionar um novo evento
app.post('/events', async (req, res) => {
    try {
        const newEvent = { id: Date.now().toString(), ...req.body };
        const eventsData = await fs.readFile(EVENTS_FILE, 'utf-8');
        const events = JSON.parse(eventsData);
        
        events.push(newEvent);
        await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2));
        
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ message: 'Não foi possível salvar o evento.' });
    }
});

// DELETE /events/:id - Excluir um evento
app.delete('/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const eventsData = await fs.readFile(EVENTS_FILE, 'utf-8');
        let events = JSON.parse(eventsData);
        
        const updatedEvents = events.filter(event => event.id !== id);
        if (events.length === updatedEvents.length) {
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        await fs.writeFile(EVENTS_FILE, JSON.stringify(updatedEvents, null, 2));
        res.status(200).json({ message: 'Evento excluído com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Não foi possível excluir o evento.' });
    }
});

// Inicia o servidor
app.listen(PORT, async () => {
    await initializeDataPersistence();
    console.log(`Servidor SystemBSI Calendar rodando em http://localhost:${PORT}`);
});