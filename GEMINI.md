# 🤖 Diretrizes de Atuação da IA (TASS)

Este arquivo define o comportamento esperado da inteligência artificial ao interagir com este repositório.

## 1. Postura Crítica e Consultiva
- **Validação de Práticas:** A IA não deve ser apenas uma executora. Se uma solicitação do usuário violar boas práticas de desenvolvimento (Clean Code, SOLID, DRY), padrões de arquitetura do projeto ou introduzir débitos técnicos desnecessários, a IA **DEVE** alertar o usuário, explicar o motivo e sugerir uma abordagem superior antes de realizar qualquer alteração.
- **Carregamento de Scripts de Terceiros:** É terminantemente **PROIBIDO** o carregamento estático de scripts externos (SDKs, APIs de terceiros como Google, GitLab, etc.) via tag `<script>` no `index.html`. Toda biblioteca externa que não seja instalada via NPM deve ser carregada de forma dinâmica (Lazy Loading) pelo serviço que a utiliza, garantindo performance (TTI) e isolamento de dependências.
- **Praticidade e Eficiência:** Caso uma solução proposta seja excessivamente complexa ou pouco prática para o contexto do projeto, a IA deve propor uma alternativa mais simples e mantível.

## 2. Gestão de Dependências e Ecossistema
- **Sugestão de Pacotes:** Sempre que uma melhoria ou funcionalidade nova puder ser implementada de forma mais robusta, segura ou eficiente através da instalação de um pacote externo (NPM), a IA **DEVE** recomendar o uso desse pacote em vez de uma implementação manual "do zero".
- **Avaliação de Custo/Benefício:** Ao sugerir um pacote, a IA deve justificar brevemente por que aquela dependência é preferível à implementação interna (ex: manutenção, segurança, edge cases tratados).

## 3. Padrões Técnicos e Visuais (Sintetizado do .cursorrules)
- **Política "Zero Hardcoded":** Proibido o uso de valores visuais fixos. Use sempre tokens semânticos (`text-app-*`, `bg-app-*`, `border-app-*`).
- **Componentes Base Obrigatórios:** 
  - Usar `BaseModal.vue` para todos os modais (nunca remover a classe `!p-0`).
  - **Layout de Modais Complexos (Duas Colunas com Abas):** Para modais que requerem navegação lateral e seções de conteúdo (como `TaskModal`, `SettingsModal` e `InterfaceMenu`), é obrigatório o uso do layout unificado do `BaseModal` configurado com `layout="sidebar"`.
    - **Slots Disponíveis:**
      - `#sidebar`: Onde deve ser colocada a navegação por abas (`<nav>`) e elementos estáticos de ajuda.
      - `#default` (slot principal): Onde o conteúdo correspondente a cada aba deve ser renderizado. O `BaseModal` já envolve este slot com a área rolável `.tass-layout-content`.
      - `#footer`: Onde devem ser inseridos os botões de ação final do modal (Cancelar, Salvar, Fechar).
      - `#header-actions`: Slot opcional no header para botões auxiliares (ex: botão "Voltar" do Google Drive).
  - Usar `AppInput.vue` e `AppTextarea.vue` para formulários.
  - Usar `AppTimePicker.vue` para qualquer seleção ou ajuste de horas/minutos.
- **Geometria (Radius Harmony):** Use `var(--app-card-radius)` para containers e `var(--app-input-radius)` para elements internos.
- **Glassmorphism:** Utilize a classe `.glass-panel` e as variáveis de opacidade/blur (`--app-card-opacity`, `--app-glass-blur`).
- **UX Premium:** Priorizar micro-interações, feedbacks visuais via `notificationService` (evitar `alert`/`confirm` nativos) e alinhamento óptico.
- **Uso Seguro do @apply:** 
  - Usar `@apply` apenas para tokens e classes padrão (`@apply text-app-main p-4`).
  - **PROIBIDO** usar `@apply` com valores arbitrários complexos entre colchetes `[...]` que contenham espaços ou funções (ex: `shadow-[0_4px_rgba(0,0,0,0.1)]`).
  - **Motivo:** Formatadores de código (Prettier) inserem espaços que quebram a compilação do PostCSS/Tailwind. Nesses casos, use CSS puro ou configure um utilitário no `tailwind.config.js`.

## 4. Inicialização e Contextualização
- **Leitura de Contexto:** Ao iniciar uma nova sessão ou tarefa complexa, a IA deve realizar uma leitura exploratória dos arquivos do projeto (além dos arquivos de regras) para compreender a estrutura atual, as dependências instaladas e a lógica de negócio implementada. Isso garante que as sugestões sejam tecnicamente precisas e contextualizadas.

## 5. Engenharia e Qualidade
- **Ciclo de Vida e Montagem Condicional:** É obrigatório o uso de `v-if` em vez de `v-show` para componentes pesados, modais secundários ou componentes que utilizem diretivas customizadas/SDKs externos. Isso garante que o Vue processe o componente e suas dependências apenas quando necessário, evitando erros de resolução prematura ("Montagem Fantasma") e instabilidades de layout durante re-renderizações globais do `App.vue`.
- **Documentação de Serviços (Mandatório):** Ao criar ou alterar a lógica de qualquer serviço (`src/services/`) ou endpoint da API (`server.js`), é obrigatório atualizar o arquivo `README.md` do diretório correspondente com riqueza de detalhes (assinaturas de métodos, endpoints, payloads e comportamento esperado).
- **Cultura de Testes (Mandatório):** Nenhuma funcionalidade nova ou refatoração de lógica (Stores, Services, Utils) é considerada completa sem a atualização ou criação dos testes unitários correspondentes em `*.test.js`.
- **Integridade de Cronômetros:** Ao implementar ajustes manuais de tempo, garantir que a alteração no tempo da sessão (`totalTimeSpent`) seja refletida proporcionalmente no acumulador histórico (`totalWorked`).
- **Validação de Build:** Antes de concluir qualquer tarefa, é obrigatório garantir que a suite de testes (`npm run test`) passe integralmente e que o projeto compile sem erros via `npm run build`.
- **Bug Fixes:** Para correções de bugs, deve-se primeiro criar um teste que reproduza a falha e, após a correção, garantir que o teste passe (Red-Green-Refactor).

## 6. Comunicação e Workflow
- **Idioma:** Todo o raciocínio e comunicação devem ser realizados em **Português**.
- **Fluxo de Eventos:** Seguir o padrão de "Props down, Events up". Modais de ação devem ser disparados pelo `App.vue` através de eventos emitidos pelos componentes filhos (`TaskCard` -> `TaskBoard` -> `App`).
- **Proibição de Operações Git:** A IA está terminantemente **PROIBIDA** de executar comandos de Git (`add`, `commit`, `push`, `branch`, etc.) diretamente no terminal. Toda e qualquer alteração deve ser limitada ao escopo dos arquivos locais. O controle de versão é responsabilidade exclusiva do usuário.
- **Sugestão de Commits:** A IA deve apenas **SUGERIR** a mensagem de commit seguindo o padrão **Conventional Commits** formatada em uma única linha de comando (sem quebras de linha literais que quebrem no terminal Windows CMD/PowerShell, preferencialmente usando múltiplos parâmetros `-m` caso queira estruturar tópicos), facilitando a cópia e execução direta pelo usuário.

## 7. Recomendações de Segurança (Backend e Comunicação Local)
- **Zero CORS Permissivo (`*`):** Em servidores locais de desenvolvimento que expõem APIs (como o `server.js` na porta 5176), nunca configure `origin: '*'`. O CORS deve ser restrito exclusivamente a origens locais confiáveis (`localhost` e `127.0.0.1` em qualquer porta).
- **Proteção contra RCE (Remote Code Execution):** Rotas sensíveis que executam comandos no sistema de arquivos ou no terminal do sistema operacional devem exigir cabeçalhos customizados adicionais (ex: `X-TASS-Client: true`) para prevenir ataques Cross-Origin de scripts automáticos rodando em outras abas do navegador.
- **Defesa contra Path Traversal:** Em rotas de backend que manipulem caminhos, leiam, escrevam ou excluam arquivos físicos baseados em parâmetros do cliente, sempre utilize `path.resolve` para normalizar o caminho e valide se o caminho final absoluto inicia estritamente dentro da pasta de destino pretendida (`filePath.startsWith(rootDirectory)`).
- **Validação e Sanitização de Entrada:** Toda entrada recebida pelo backend deve passar por validações estritas antes de ser usada em funções de sistema operacional ou de manipulação direta de dados.

## 8. Prevenção de Regressões e Verificação de Funcionalidades
- **Prevenção de Perdas Visuais:** Ao alterar qualquer menu, modal ou seção de interface (ex: `InterfaceMenu.vue`, `SettingsModal.vue`), a IA **DEVE** garantir que todos os controles, campos e abas previamente existentes sejam preservados, a menos que sua exclusão seja explicitamente solicitada pelo usuário.
- **Checklist de Verificação Obrigatória:** A cada alteração efetuada no código, a IA deve revisar mentalmente e validar visualmente (ou através de testes) se as seguintes funcionalidades permanecem intactas e operacionais:
  1. **Quadro Kanban:** Sincronização, arraste de colunas e tarefas (`vuedraggable`), transições de status e atualização no IndexedDB.
  2. **Cronômetros e Jornada:** Início/pausa de tarefas, integridade do acumulador `totalWorked` ao ajustar `totalTimeSpent`, e funcionamento da pausa automática fora do expediente.
  3. **Ajustes Visuais (Interface):**
     - Seleção e alteração do papel de parede (Apenas via Links Externos/URLs).
     - Modificadores de estrutura do quadro (Quantidade e nomes das colunas).
     - Estilo das tarefas (Espessura do padding, tamanho do título/número da tarefa, tamanho da descrição).
     - Tipografia global (Modificação de fontes).
     - Efeitos de transparência e blur aplicados dinamicamente nos alvos configurados.
  4. **Integração GitLab:** Exibição do menu de contexto, criação de branch com link mágico/API, e merges automáticos com análise de conflitos.
  5. **Notas Rápidas:** Abertura e fechamento do painel CLI, alteração de cores, e persistência de notas no banco de dados.
  6. **Dados e Backups:** Importação/Exportação do sistema e de tarefas em JSON, e login/backup automático com o Google Drive.
  7. **Consistência de Modais com `layout="sidebar"`**: Funcionamento, transição de abas e botões de ação final dos modais complexos (`TaskModal.vue`, `SettingsModal.vue` e `InterfaceMenu.vue`).
- **Expansão da Checklist:** Sempre que um novo elemento, controle ou funcionalidade for adicionado ao sistema, a IA **DEVE** atualizar esta seção no `GEMINI.md`, incluindo o novo item à lista de verificação obrigatória.

