import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

export async function initDb() {
  db = await open({
    filename: path.join(__dirname, 'tass.db'),
    driver: sqlite3.Database
  });

  // Habilita chaves estrangeiras para exclusão em cascata automática
  await db.run('PRAGMA foreign_keys = ON;');

  // Criação estrutural das tabelas relacionais do sistema
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      recovery_code TEXT NOT NULL,
      google_id TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sprints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      end_date TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      position INTEGER NOT NULL,
      sprint_id INTEGER,
      color TEXT,
      column_id INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      total_time_spent INTEGER NOT NULL DEFAULT 0,
      total_worked INTEGER NOT NULL DEFAULT 0,
      is_running INTEGER NOT NULL DEFAULT 0,
      last_start_time INTEGER,
      gitlab_branch TEXT,
      gitlab_mr_id INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(sprint_id) REFERENCES sprints(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      user_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (user_id, key),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS radios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      stars INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Verifica se a coluna google_id existe (migração para bases existentes), se não, adiciona
  try {
    const tableInfo = await db.all("PRAGMA table_info(users);");
    const hasGoogleId = tableInfo.some(col => col.name === 'google_id');
    if (!hasGoogleId) {
      await db.run("ALTER TABLE users ADD COLUMN google_id TEXT;");
      console.log('[TASS] Coluna google_id adicionada com sucesso à tabela users.');
    }
  } catch (err) {
    console.error('[TASS] Erro ao verificar/adicionar coluna google_id:', err);
  }

  console.log('[TASS] Banco de dados SQLite (tass.db) pronto.');
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}
