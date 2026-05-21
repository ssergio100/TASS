import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs/promises';
import crypto from 'crypto';
import { exec } from 'child_process';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initDb, getDb } from './server-db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5176;
const JWT_SECRET = process.env.JWT_SECRET || 'tass-super-secure-key-123';

// Configuração de CORS Restrita a Origens de Desenvolvimento Local
const allowedOrigins = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/
];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origem (como ferramentas locais de backend ou carregamento direto)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(regex => regex.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[TASS] Requisição bloqueada por política CORS de origem não confiável: ${origin}`);
      callback(new Error('Bloqueado por política CORS do TASS (Origem não confiável)'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-TASS-Client']
}));

app.use(express.json());

// Middleware de Log Detalhado
app.use((req, res, next) => {
  console.log(`[TASS] ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    console.log('[TASS] Payload Body:', JSON.stringify(req.body).substring(0, 100) + '...');
  }
  next();
});

// Middleware de Autenticação JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autorização não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Formato de token inválido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Injeta { id, email } na requisição
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
}

// --- API DE AUTENTICAÇÃO ---

// Registro de Novo Usuário
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const db = getDb();
    
    // Verifica se já existe o e-mail
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    // Código de recuperação amigável: TASS-XXXX-XXXX
    const randPart = crypto.randomBytes(6).toString('hex').toUpperCase();
    const recoveryCode = `TASS-${randPart.substring(0, 4)}-${randPart.substring(4, 8)}`;

    const result = await db.run(
      'INSERT INTO users (email, password_hash, recovery_code, created_at) VALUES (?, ?, ?, ?)',
      [email, passwordHash, recoveryCode, Date.now()]
    );

    const token = jwt.sign({ id: result.lastID, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: result.lastID, email },
      recoveryCode
    });
  } catch (err) {
    console.error('Registration failed:', err);
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
});

// Login do Usuário
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const db = getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ error: 'Erro ao efetuar login.' });
  }
});

// Login/Cadastro com o Google (OAuth2)
app.post('/api/auth/google', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: 'Access token do Google é obrigatório.' });
  }

  try {
    // Valida o token com a API do Google
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!googleResponse.ok) {
      return res.status(400).json({ error: 'Token de acesso do Google inválido ou expirado.' });
    }

    const googleUser = await googleResponse.json();
    const { email, sub: googleId } = googleUser;

    if (!email) {
      return res.status(400).json({ error: 'Não foi possível obter o e-mail da conta Google.' });
    }

    const db = getDb();
    
    // Busca usuário pelo e-mail
    let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (user) {
      // Se o usuário existe mas não tinha google_id associado, atualiza
      if (!user.google_id) {
        await db.run('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
        user.google_id = googleId;
      }
    } else {
      // Cria novo usuário
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = bcrypt.hashSync(randomPassword, 10);
      
      const randPart = crypto.randomBytes(6).toString('hex').toUpperCase();
      const recoveryCode = `TASS-${randPart.substring(0, 4)}-${randPart.substring(4, 8)}`;

      const result = await db.run(
        'INSERT INTO users (email, password_hash, recovery_code, google_id, created_at) VALUES (?, ?, ?, ?, ?)',
        [email, passwordHash, recoveryCode, googleId, Date.now()]
      );

      user = {
        id: result.lastID,
        email: email,
        google_id: googleId
      };
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    console.error('Google Auth Login failed:', err);
    res.status(500).json({ error: 'Erro ao processar autenticação com o Google.' });
  }
});

// Recuperação de Senha (via Código)
app.post('/api/auth/recover', async (req, res) => {
  const { email, recoveryCode, newPassword } = req.body;
  if (!email || !recoveryCode || !newPassword) {
    return res.status(400).json({ error: 'E-mail, código de recuperação e nova senha são obrigatórios.' });
  }

  try {
    const db = getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    // Normalização básica do código de recuperação
    const inputCode = recoveryCode.trim().toUpperCase();
    const userCode = user?.recovery_code?.trim()?.toUpperCase();

    if (!user || userCode !== inputCode) {
      return res.status(400).json({ error: 'E-mail ou código de recuperação inválido.' });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);

    res.json({ status: 'success', message: 'Senha redefinida com sucesso!' });
  } catch (err) {
    console.error('Recovery failed:', err);
    res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
});

// Troca de Senha (Logado)
app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
  }

  try {
    const db = getDb();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Senha atual incorreta.' });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);

    res.json({ status: 'success', message: 'Senha alterada com sucesso!' });
  } catch (err) {
    console.error('Change password failed:', err);
    res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
});

// Obter código de recuperação (Logado)
app.get('/api/auth/recovery-code', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const user = await db.get('SELECT recovery_code FROM users WHERE id = ?', [req.user.id]);
    res.json({ recoveryCode: user.recovery_code });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar código de recuperação.' });
  }
});

// --- MIGRATION ENDPOINT ---
app.post('/api/migrate', authMiddleware, async (req, res) => {
  const { tasks, sprints, settings, notes, radios } = req.body;
  const db = getDb();

  try {
    await db.run('BEGIN TRANSACTION');

    // 1. Migrar Sprints
    const sprintMap = {}; // Local ID -> SQLite ID
    if (Array.isArray(sprints)) {
      for (const sprint of sprints) {
        const result = await db.run(
          'INSERT INTO sprints (user_id, end_date, created_at) VALUES (?, ?, ?)',
          [req.user.id, sprint.endDate, sprint.createdAt || Date.now()]
        );
        sprintMap[sprint.id] = result.lastID;
      }
    }

    // 2. Migrar Tarefas
    if (Array.isArray(tasks)) {
      for (const task of tasks) {
        const newSprintId = task.sprintId && sprintMap[task.sprintId] ? sprintMap[task.sprintId] : null;
        await db.run(
          `INSERT INTO tasks 
           (user_id, title, description, position, sprint_id, color, column_id, completed, total_time_spent, total_worked, is_running, last_start_time, gitlab_branch, gitlab_mr_id, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            task.title,
            task.description || '',
            task.position,
            newSprintId,
            task.color || '',
            task.columnId,
            task.completed ? 1 : 0,
            task.totalTimeSpent || 0,
            task.totalWorked || 0,
            task.isRunning ? 1 : 0,
            task.lastStartTime || null,
            task.gitlabBranch || null,
            task.gitlabMrId || null,
            task.createdAt || Date.now()
          ]
        );
      }
    }

    // 3. Migrar Configurações
    if (settings && typeof settings === 'object') {
      for (const key of Object.keys(settings)) {
        let val = settings[key];
        if (key === 'app-active-sprint') {
          if (val !== 'all' && val !== null && val !== undefined) {
            const newSprintId = sprintMap[val];
            val = newSprintId !== undefined ? newSprintId : 'all';
          }
        }
        await db.run(
          'INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, ?, ?)',
          [req.user.id, key, JSON.stringify(val)]
        );
      }
    }

    // 4. Migrar Notas Rápidas
    if (Array.isArray(notes)) {
      for (const noteItem of notes) {
        await db.run(
          'INSERT INTO notes (user_id, content, updated_at) VALUES (?, ?, ?)',
          [req.user.id, noteItem.content, noteItem.updatedAt || Date.now()]
        );
      }
    }

    // 5. Migrar Rádios
    if (Array.isArray(radios)) {
      for (const radio of radios) {
        await db.run(
          'INSERT INTO radios (user_id, name, url, stars) VALUES (?, ?, ?, ?)',
          [req.user.id, radio.name, radio.url, radio.stars || 0]
        );
      }
    }

    await db.run('COMMIT');
    res.json({ status: 'success', message: 'Migração concluída com sucesso!' });
  } catch (err) {
    await db.run('ROLLBACK');
    console.error('Migration failed:', err);
    res.status(500).json({ error: 'Erro ao migrar dados.' });
  }
});

// Reset de dados do usuário
app.post('/api/auth/reset', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    await db.run('BEGIN TRANSACTION');
    await db.run('DELETE FROM tasks WHERE user_id = ?', [req.user.id]);
    await db.run('DELETE FROM sprints WHERE user_id = ?', [req.user.id]);
    await db.run('DELETE FROM notes WHERE user_id = ?', [req.user.id]);
    // Também limpa configurações que não sejam as de fábrica se necessário, ou todas
    await db.run('DELETE FROM settings WHERE user_id = ?', [req.user.id]);
    await db.run('DELETE FROM radios WHERE user_id = ?', [req.user.id]);
    await db.run('COMMIT');
    res.json({ status: 'success', message: 'Sistema zerado com sucesso!' });
  } catch (err) {
    await db.run('ROLLBACK');
    console.error('Reset failed:', err);
    res.status(500).json({ error: 'Erro ao resetar dados do sistema.' });
  }
});


// --- CRUD DO USUÁRIO (PROTEGIDO) ---

// --- TASKS ---
app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const tasks = await db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY position ASC', [req.user.id]);
    
    // Normaliza booleanos e nulls para o client-side
    const mapped = tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description || '',
      position: t.position,
      sprintId: t.sprint_id,
      color: t.color || '',
      columnId: t.column_id,
      completed: t.completed === 1,
      totalTimeSpent: t.total_time_spent,
      totalWorked: t.total_worked,
      isRunning: t.is_running === 1,
      lastStartTime: t.last_start_time,
      gitlabBranch: t.gitlab_branch || null,
      gitlabMrId: t.gitlab_mr_id || null,
      createdAt: t.created_at
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter tarefas.' });
  }
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
  const t = req.body;
  try {
    const db = getDb();
    const result = await db.run(
      `INSERT INTO tasks 
       (user_id, title, description, position, sprint_id, color, column_id, completed, total_time_spent, total_worked, is_running, last_start_time, gitlab_branch, gitlab_mr_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        t.title,
        t.description || '',
        t.position,
        t.sprintId || null,
        t.color || '',
        t.columnId,
        t.completed ? 1 : 0,
        t.totalTimeSpent || 0,
        t.totalWorked || 0,
        t.isRunning ? 1 : 0,
        t.lastStartTime || null,
        t.gitlabBranch || null,
        t.gitlabMrId || null,
        t.createdAt || Date.now()
      ]
    );

    res.status(201).json({ ...t, id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar tarefa.' });
  }
});

app.put('/api/tasks/positions', authMiddleware, async (req, res) => {
  const { positions } = req.body; // Array de { id, position, columnId }
  if (!Array.isArray(positions)) {
    return res.status(400).json({ error: 'Array de posições não fornecido.' });
  }

  const db = getDb();
  try {
    await db.run('BEGIN TRANSACTION');
    for (const item of positions) {
      await db.run(
        'UPDATE tasks SET position = ?, column_id = ? WHERE id = ? AND user_id = ?',
        [item.position, item.columnId, item.id, req.user.id]
      );
    }
    await db.run('COMMIT');
    res.json({ status: 'success' });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: 'Erro ao atualizar posições das tarefas.' });
  }
});

app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const t = req.body;
  try {
    const db = getDb();
    
    // Constrói query dinâmica com base nas chaves do body
    const updates = [];
    const values = [];

    const fieldMap = {
      title: 'title',
      description: 'description',
      position: 'position',
      sprintId: 'sprint_id',
      color: 'color',
      columnId: 'column_id',
      completed: 'completed',
      totalTimeSpent: 'total_time_spent',
      totalWorked: 'total_worked',
      isRunning: 'is_running',
      lastStartTime: 'last_start_time',
      gitlabBranch: 'gitlab_branch',
      gitlabMrId: 'gitlab_mr_id'
    };

    for (const [key, value] of Object.entries(t)) {
      const dbField = fieldMap[key];
      if (dbField !== undefined) {
        updates.push(`${dbField} = ?`);
        // Normaliza booleanos para integer
        if (typeof value === 'boolean') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo fornecido para atualização.' });
    }

    values.push(id, req.user.id);
    const result = await db.run(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada ou não pertence ao usuário.' });
    }

    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
  }
});

app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    const result = await db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir tarefa.' });
  }
});

// --- SPRINTS ---
app.get('/api/sprints', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const sprints = await db.all('SELECT * FROM sprints WHERE user_id = ?', [req.user.id]);
    const mapped = sprints.map(s => ({
      id: s.id,
      endDate: s.end_date,
      createdAt: s.created_at
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter sprints.' });
  }
});

app.post('/api/sprints', authMiddleware, async (req, res) => {
  const { endDate } = req.body;
  if (!endDate) {
    return res.status(400).json({ error: 'Data de término necessária.' });
  }
  try {
    const db = getDb();
    const result = await db.run(
      'INSERT INTO sprints (user_id, end_date, created_at) VALUES (?, ?, ?)',
      [req.user.id, endDate, Date.now()]
    );
    res.status(201).json({ id: result.lastID, endDate, createdAt: Date.now() });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar sprint.' });
  }
});

app.delete('/api/sprints/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    const result = await db.run('DELETE FROM sprints WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Sprint não encontrada.' });
    }
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir sprint.' });
  }
});

// --- SETTINGS ---
app.get('/api/settings', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const settings = await db.all('SELECT * FROM settings WHERE user_id = ?', [req.user.id]);
    const settingsMap = {};
    for (const item of settings) {
      try {
        settingsMap[item.key] = JSON.parse(item.value);
      } catch {
        settingsMap[item.key] = item.value;
      }
    }
    res.json(settingsMap);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter configurações.' });
  }
});

app.post('/api/settings', authMiddleware, async (req, res) => {
  const settingsToSave = req.body; // Array de { key, value } ou objeto key-value
  const db = getDb();
  
  try {
    await db.run('BEGIN TRANSACTION');
    
    if (Array.isArray(settingsToSave)) {
      for (const item of settingsToSave) {
        await db.run(
          'INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, ?, ?)',
          [req.user.id, item.key, JSON.stringify(item.value)]
        );
      }
    } else if (settingsToSave && typeof settingsToSave === 'object') {
      for (const [key, value] of Object.entries(settingsToSave)) {
        await db.run(
          'INSERT OR REPLACE INTO settings (user_id, key, value) VALUES (?, ?, ?)',
          [req.user.id, key, JSON.stringify(value)]
        );
      }
    }

    await db.run('COMMIT');
    res.json({ status: 'success' });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: 'Erro ao salvar configurações.' });
  }
});

// --- NOTES ---
app.get('/api/notes', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const notes = await db.all('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [req.user.id]);
    res.json(notes.map(n => ({
      id: n.id,
      content: n.content,
      updatedAt: n.updated_at
    })));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar notas.' });
  }
});

app.post('/api/notes', authMiddleware, async (req, res) => {
  const { content, updatedAt } = req.body;
  const db = getDb();
  try {
    // Busca se existe alguma nota para o usuário para atualizar, caso contrário insere
    const lastNote = await db.get('SELECT id FROM notes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1', [req.user.id]);
    
    if (lastNote) {
      await db.run(
        'UPDATE notes SET content = ?, updated_at = ? WHERE id = ?',
        [content, updatedAt || Date.now(), lastNote.id]
      );
      res.json({ id: lastNote.id, content, updatedAt: updatedAt || Date.now() });
    } else {
      const result = await db.run(
        'INSERT INTO notes (user_id, content, updated_at) VALUES (?, ?, ?)',
        [req.user.id, content, updatedAt || Date.now()]
      );
      res.status(201).json({ id: result.lastID, content, updatedAt: updatedAt || Date.now() });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar nota.' });
  }
});

// --- RADIOS ---
app.get('/api/radios', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const radios = await db.all('SELECT * FROM radios WHERE user_id = ? ORDER BY stars DESC', [req.user.id]);
    res.json(radios.map(r => ({
      id: r.id,
      name: r.name,
      url: r.url,
      stars: r.stars
    })));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter rádios.' });
  }
});

app.post('/api/radios', authMiddleware, async (req, res) => {
  const { name, url, stars } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: 'Nome e URL da rádio são obrigatórios.' });
  }
  try {
    const db = getDb();
    const result = await db.run(
      'INSERT INTO radios (user_id, name, url, stars) VALUES (?, ?, ?, ?)',
      [req.user.id, name, url, stars || 0]
    );
    res.status(201).json({ id: result.lastID, name, url, stars: stars || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar rádio.' });
  }
});

app.put('/api/radios/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, url, stars } = req.body;
  const db = getDb();
  try {
    const updates = [];
    const values = [];
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (url !== undefined) { updates.push('url = ?'); values.push(url); }
    if (stars !== undefined) { updates.push('stars = ?'); values.push(stars); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo fornecido para atualização.' });
    }

    values.push(id, req.user.id);
    const result = await db.run(
      `UPDATE radios SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Rádio não encontrada.' });
    }

    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar rádio.' });
  }
});

app.delete('/api/radios/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    const result = await db.run('DELETE FROM radios WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Rádio não encontrada.' });
    }
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir rádio.' });
  }
});


// --- OUTROS ENDPOINTS EXISTENTES ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.1.0', port: PORT });
});

// Endpoint para executar comandos no terminal do sistema (PowerShell no Windows, Bash no Linux/macOS)
app.post('/api/terminal/execute', (req, res) => {
  if (req.headers['x-tass-client'] !== 'true') {
    console.warn(`[TASS] Requisição de terminal bloqueada: Cabeçalho 'X-TASS-Client' ausente ou inválido.`);
    return res.status(403).json({ error: 'Acesso negado. Cliente não autorizado.' });
  }

  const { command, cwd } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'Comando não fornecido.' });
  }

  const targetCwd = cwd || __dirname;
  const separator = '___PWD_SEPARATOR___';
  
  const isWin = process.platform === 'win32';
  
  // Embrulha o comando de acordo com o OS para coletar o novo diretório atualizado
  const wrappedCommand = isWin
    ? `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${command}\nWrite-Output "${separator}"\n(Get-Item .).FullName`
    : `${command}\necho "${separator}"\npwd`;

  const shellOption = isWin ? 'powershell.exe' : '/bin/bash';

  console.log(`[TASS] Executando no Terminal (${isWin ? 'Windows' : 'Linux/Unix'}): "${command}" em CWD: "${targetCwd}"`);

  exec(wrappedCommand, { cwd: targetCwd, shell: shellOption }, (error, stdout, stderr) => {
    let realStdout = stdout || '';
    let nextCwd = targetCwd;

    if (realStdout.includes(separator)) {
      const parts = realStdout.split(separator);
      realStdout = parts[0].trim();
      const pathPart = parts[1] ? parts[1].trim() : '';
      if (pathPart) {
        nextCwd = pathPart;
      }
    }

    res.json({
      stdout: realStdout,
      stderr: stderr || '',
      cwd: nextCwd,
      code: error ? error.code : 0,
      error: error ? error.message : null
    });
  });
});

// Endpoint para obter informações iniciais do terminal
app.get('/api/terminal/info', (req, res) => {
  if (req.headers['x-tass-client'] !== 'true') {
    console.warn(`[TASS] Requisição de informações do terminal bloqueada: Cabeçalho 'X-TASS-Client' ausente ou inválido.`);
    return res.status(403).json({ error: 'Acesso negado. Cliente não autorizado.' });
  }
  res.json({ cwd: __dirname });
});

// --- ESTÁTICOS ---
app.use('/wallpapers', express.static(path.join(__dirname, 'public', 'wallpapers')));
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) res.status(404).send('API TASS 5176');
  });
});

// Inicialização do banco de dados e start do servidor
initDb().then(() => {
  app.listen(PORT, () => {
    console.log('\x1b[35m%s\x1b[0m', `[TASS] VERSÃO 1.1.0 - BACKEND ATIVO EM: http://127.0.0.1:${PORT}`);
    console.log('[TASS] SQLite e Endpoints Relacionais prontos.');
  });
}).catch(err => {
  console.error('Falha crítica ao inicializar banco de dados:', err);
  process.exit(1);
});
