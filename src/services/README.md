# 🛠️ TASS Services

Este diretório contém os serviços de lógica de negócio do frontend e orquestração de integrações. A arquitetura do TASS isola a lógica de integração, regras do negócio e comunicação assíncrona dentro destes arquivos para manter os componentes visuais (`.vue`) enxutos e focados na renderização.

Com a remoção do backend legado (Node.js/Terminal), o TASS agora é uma aplicação **100% Client-Side** (Frontend-only), garantindo maior segurança, leveza e menor consumo de bateria (sem polling contínuo).

---

## 🧩 Serviços de Frontend (`src/services/`)

A pasta `services` abstrai toda a lógica de integrações de API, Web Workers e IndexedDB. Abaixo estão detalhados os serviços ativos no projeto:

### ☁️ `googleDriveService.js`
Gerencia a integração autenticada com o Google Identity Services (GIS) e a API do Drive v3.
- **Pasta Central:** Opera exclusivamente num diretório fixo chamado `TASS` no Google Drive do usuário (case-insensitive).
- **Escopos Restritos:** Utiliza apenas o escopo `drive.file` (leitura/escrita dos backups gerados pelo app) e `userinfo.profile` (para avatar e saudação).
- **Fluxos Principais:** Autenticação (Login/Logout), envio silencioso de backups à nuvem e restauração de snapshots (banco de dados inteiro).

### ☁️ `nextcloudService.js`
Integra o TASS a instâncias Nextcloud por meio do protocolo WebDAV nativo, sem SDK externo ou cadastro de cliente OAuth.
- **Conexão:** `connect({ serverUrl, username, appPassword })` valida as credenciais com `PROPFIND`, exige HTTPS fora de ambientes locais e cria a pasta `TASS` com `MKCOL` quando necessário.
- **Sessão:** `getConnection()` e `isAuthenticated()` expõem apenas o estado necessário à interface. A URL, o usuário e a senha de aplicativo ficam em `sessionStorage`, nunca no backup ou no armazenamento persistente; `disconnect()` remove a sessão.
- **Backups:** `uploadBackup(data)` envia JSON via `PUT`; `listBackups()` consulta a pasta com `PROPFIND` e ordena os arquivos pela última modificação; `downloadBackup(filename)` e `deleteBackup(filename)` usam `GET` e `DELETE`.
- **Segurança:** Todos os segmentos de caminho são codificados, conexões remotas sem HTTPS são recusadas e a interface orienta o uso de senha de aplicativo exclusiva.
- **CORS:** Em instalações de outra origem, o servidor ou proxy reverso da Nextcloud deve autorizar a origem do TASS, os cabeçalhos `Authorization`, `Content-Type` e `Depth`, e os métodos `GET`, `PUT`, `DELETE`, `PROPFIND` e `MKCOL`, incluindo a requisição de preflight `OPTIONS`.

### 💾 `backupService.js`
Orquestra o ciclo de vida da persistência em formato JSON.
- Faz a ponte entre o estado local e local storage (`taskStore`, `settingsStore`, IndexedDB) e os serviços de nuvem (`googleDriveService.js` e `nextcloudService.js`).
- Serializa e gera blobs JSON (`tass_export_tarefas.json`, `tass_export_sistema.json`) que podem ser salvos localmente pelo usuário (download) ou enviados para o Drive.

### 📢 `notificationService.js`
Sistema unificado de feedback visual da aplicação, integrando-se nativamente com a `notificationStore` e a `modalStore`.
- **Alertas:** Modais centrais para informações críticas (ex: aviso de conflito de branches).
- **Confirmações:** Diálogos binários de decisão (ex: "Deseja realmente excluir a branch?").
- **Prompts:** Entradas de dados limpas para inputs rápidos de texto ou multiline.
- **Toasts:** Notificações flutuantes não-intrusivas (sucesso, erro, info).
- **Nativo (Desktop):** Gerenciamento e requisição de permissões para exibir notificações via API nativa do sistema operacional.

### 🧪 `gitlab.js` e `github.js` (Provider Facade)
Integração profunda e especializada com as APIs REST do GitLab e GitHub para otimizar a esteira de desenvolvimento. Ambos respondem à interface uniforme do `gitProvider.js`.
- **Gestão de Branches:** Automação para verificar, criar ou deletar branches (utilizando como origem primária o `activeBaseBranch` selecionado pelo usuário nas configurações do TASS).
- **Merge Requests/Pull Requests:** O fluxo `analyzeAndMerge` recebe explicitamente qualquer ambiente cadastrado como destino, compara a branch de trabalho, detecta arquivos alterados e analisa conflitos antes de aplicar ou sugerir um merge conclusivo pela interface.
- **Proteção e recriação:** Toda branch cadastrada como ambiente é excluída da limpeza de branches de trabalho. A branch base nunca pode ser destruída; um ambiente não-base só é recriado pelo Breeze depois da criação obrigatória de um backup e da confirmação manual da exclusão.
- **Agnosticismo de UI:** Os componentes visuais (como o `GitRebuilder` ou `ActionPanel`) não se importam com qual serviço está ativo. O roteador (`gitProvider.js`) decide se chama a integração do GitHub ou GitLab mantendo um contrato universal de entrada e saída.

### 🚀 `taskActionService.js`
Encapsula fluxos rápidos e rotineiros que alteram dados específicos das tarefas (Quick Actions).
- Facilita a captura e injeção ágil de URLs (garantindo validação de protocolos HTTP/HTTPS) usando o módulo dinâmico do `notificationService.promptQuickUpdate`.

### ⏱️ `timerWorker.js`
Web Worker essencial responsável por assegurar a exatidão do `Global Pulse` e cronômetros de tempo de trabalho.
- Trabalha em thread secundária para que a contagem dos cronômetros do sistema não congele ou atrase caso o navegador do usuário imponha restrições de energia à aba (Background Throttling).

---

## 🛡️ Padrões de Segurança e Performance

- **Arquitetura Serverless:** Como não há backend próprio ou necessidade de processamento Node.js local, a superfície de ataque é drasticamente reduzida. Não há mais APIs abertas localmente.
- **Otimização (Lazy Load):** SDKs estáticos externos (como o `<script>` da Google API) não são colocados no `index.html`. Em vez disso, são injetados assincronamente pelo serviço apenas no momento em que o usuário demonstra intenção de logar ou utilizar a funcionalidade.
