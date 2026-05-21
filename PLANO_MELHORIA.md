# 📝 Plano de Melhoria: Migração para SQLite e Sistema Multiusuário (TASS)

Este documento apresenta o plano detalhado para migrar a persistência do **TASS (Task & Advanced Support System)** de um modelo *Offline-First* com IndexedDB (Dexie.js) no cliente para um banco de dados relacional centralizado (**SQLite**) no servidor. Além disso, descrevemos a implementação do sistema de autenticação de usuários, área de perfil logado, recuperação de senha e migração de dados.

---

## 🎯 Objetivos do Plano
1. **Migração Relacional:** Substituir a persistência local (IndexedDB via Dexie) por persistência no servidor utilizando **SQLite** como banco relacional.
2. **Sistema Multiusuário:** Vincular todas as entidades (tarefas, sprints, configurações, notas e rádios) a um usuário específico.
3. **Autenticação Segura:** Adicionar telas de Cadastro (Sign Up), Login (Sign In), Recuperação de Senha (Password Recovery) e área do usuário logado para alteração de credenciais.
4. **Migração Automatizada:** Permitir que usuários que já usavam a versão local migrem seus dados do IndexedDB para a nuvem de forma transparente ao criar uma conta.
5. **Pronto para Produção (Public-Ready):** Garantir segurança contra RCE, Path Traversal, vazamento de sessões e integridade de dados na API.

---

## ⚙️ 1. Arquitetura do Banco de Dados (SQLite)

O banco de dados SQLite será gerenciado no backend (`server.js`) utilizando a biblioteca `better-sqlite3` ou `sqlite3` + `sqlite` (promisified). A modelagem proposta abaixo garante integridade e exclusão em cascata.

### Schema Relacional (DDL)

```sql
-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  recovery_code TEXT NOT NULL, -- Código gerado no cadastro para recuperação segura
  created_at INTEGER NOT NULL
);

-- Tabela de Sprints
CREATE TABLE IF NOT EXISTS sprints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  end_date TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Tarefas
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

-- Tabela de Configurações do Usuário (Chave-Valor)
CREATE TABLE IF NOT EXISTS settings (
  user_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (user_id, key),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Notas Rápidas
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Estações de Rádio
CREATE TABLE IF NOT EXISTS radios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  stars INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔒 2. Fluxo de Autenticação e Segurança

Para tornar o TASS público e seguro, utilizaremos **JWT (JSON Web Tokens)** para controle de sessões e **bcryptjs** para hashing de senhas.

### Segurança do Sistema
1. **Hashing de Senha:** Hashing utilizando `bcryptjs` com salt de 10 rounds antes de persistir no SQLite.
2. **Tokens JWT:** Assinados no servidor com expiração de 7 dias. O token será retornado no login/cadastro e enviado pelo frontend no cabeçalho `Authorization: Bearer <TOKEN>`.
3. **Middleware de Autenticação (`authMiddleware`):** Interceptará rotas protegidas do backend, validará o JWT e injetará o `req.user = { id, email }`.
4. **Prevenção de Ataques:**
   - **XSS/CSRF:** Armazenamento do token de forma segura no localStorage e validação de tokens nas APIs.
   - **CORS Restrito:** CORS continuará configurado estritamente para as origens permitidas (não utilizando `*`).

---

## 🌐 3. Endpoints da API (Backend `server.js`)

Abaixo estão os endpoints que devem ser implementados no backend do TASS:

### 3.1. Rotas de Autenticação (Públicas)
*   `POST /api/auth/register`
    - **Payload:** `{ email, password }`
    - **Ação:** Cria o usuário, gera um hash da senha, cria um `recovery_code` randômico forte (ex: `TASS-XXXX-XXXX-XXXX`) e retorna `{ token, user, recoveryCode }`.
*   `POST /api/auth/login`
    - **Payload:** `{ email, password }`
    - **Ação:** Valida a senha contra o hash e retorna `{ token, user }`.
*   `POST /api/auth/recover`
    - **Payload:** `{ email, recoveryCode, newPassword }`
    - **Ação:** Valida o código de recuperação e atualiza a senha do usuário com o novo hash.

### 3.2. Rotas Protegidas (Exigem `Authorization: Bearer <TOKEN>`)
*   `POST /api/auth/change-password`
    - **Payload:** `{ currentPassword, newPassword }`
    - **Ação:** Valida a senha atual e altera para a nova.
*   `POST /api/migrate`
    - **Payload:** `{ tasks, sprints, settings, notes, radios }` (Extraídos do IndexedDB do cliente)
    - **Ação:** Executa uma transação no SQLite inserindo todos os dados com o `user_id` do usuário logado. Retorna confirmação de sucesso.

#### CRUDs Multiusuário (SQLite)
*   `GET /api/tasks` | `POST /api/tasks` | `PUT /api/tasks/:id` | `DELETE /api/tasks/:id`
*   `GET /api/sprints` | `POST /api/sprints` | `DELETE /api/sprints/:id`
*   `GET /api/settings` | `POST /api/settings` (Salva lote de configurações)
*   `GET /api/notes` | `POST /api/notes`
*   `GET /api/radios` | `POST /api/radios` | `PUT /api/radios/:id` | `DELETE /api/radios/:id`

---

## 📦 4. Mudanças no Frontend

O frontend migrará de operações IndexedDB diretas para chamadas assíncronas à API HTTP.

### 4.1. Novo `authStore.js`
Store central no Pinia para gerenciar o estado da sessão:
```javascript
// Contém propriedades como:
const user = ref(null);
const token = ref(localStorage.getItem('tass_token'));
const isAuthenticated = computed(() => !!token.value);
// Métodos: login(), register(), logout(), recoverPassword(), changePassword()
```

### 4.2. Refatoração das Stores Existentes
As operações em `taskStore.js`, `settingsStore.js`, `noteStore.js` e `radioStore.js` serão adaptadas para consumir o backend:
- Substituir as chamadas de `db.tasks.*` por chamadas `fetch` ou `axios` contendo o token JWT do usuário.
- Durante o carregamento inicial, se o usuário não estiver logado, redirecionar/bloquear a interface exibindo a Tela de Login.

### 4.3. Telas e Elementos Visuais Premium
1. **Overlay de Autenticação:** Uma tela de login e cadastro sofisticada, utilizando a engine de design do TASS (Glassmorphism, desfoques dinâmicos, micro-animações, inputs estilizados com `AppInput` e feedback em tempo real).
2. **Área do Usuário Logado:** Adicionada como uma nova aba nas configurações (`SettingsModal.vue`) chamada **"Minha Conta"**. Nela, o usuário poderá:
   - Visualizar seu e-mail e dados de cadastro.
   - Alterar sua senha (exigindo senha atual e nova).
   - Visualizar e salvar seu Código de Recuperação (`recovery_code`).
   - Sair (Logout) do sistema.
3. **Fluxo de Recuperação:** Tela de login incluirá o link "Esqueci minha senha" que guiará o usuário para reiniciar as credenciais usando o código gerado no cadastro.

---

## 🔄 5. Estratégia de Migração de Dados (IndexedDB -> SQLite)

Para evitar perdas de dados dos usuários que utilizavam a ferramenta de forma local:
1. **Detecção:** Ao fazer o primeiro login ou cadastro bem-sucedido, o frontend verifica se o IndexedDB `TaskManagerDB` possui registros em suas tabelas.
2. **Confirmação:** Um modal amigável e refinado (via `notificationService.confirm`) perguntará:
   > *"Detectamos tarefas e configurações salvas localmente neste navegador. Deseja importá-las para sua nova conta na nuvem?"*
3. **Envio:** Se aceito, o frontend envia os dados serializados para o endpoint `/api/migrate`.
4. **Processamento:** O backend insere os registros mapeando relacionamentos (como vincular as tarefas aos novos IDs das sprints correspondentes).
5. **Limpeza:** Após o retorno positivo do backend, o frontend limpa o IndexedDB local com `db.delete()` para evitar novas prompts de migração.

---

## 🧪 6. Plano de Validação e Testes

Para garantir que o TASS continue estável e resiliente:
1. **Testes Unitários no Backend:** Criar uma suíte simples de testes para validar os endpoints de login, cadastro, troca de senha e migração com banco SQLite em memória (`:memory:`).
2. **Preservação de Comportamento:** Garantir que o Kanban (`vuedraggable`), controle de tempo (sprint acumulada), wallpapers e rádio funcionem de forma idêntica à versão offline.
3. **Garantia de Builds:** Compilação com `npm run build` e execução local via `npm run dev` e `npm start`.

---

> [!IMPORTANT]
> **Preservação Visual:** A migração tecnológica não deve alterar a identidade visual premium do TASS. Os componentes devem aderir estritamente aos tokens de design declarados e ao layout de modal centralizado.
