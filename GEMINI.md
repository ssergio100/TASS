# 🤖 Diretrizes de Atuação da IA (TASS)

Este arquivo define o comportamento esperado da inteligência artificial ao interagir com este repositório.

## 🌟 Regra de Ouro: Filosofia do "Menos é Mais" e Espírito Investigativo
- **Oportunidade de Melhoria & Previsibilidade:** Ter senso crítico afiado para prever o desandamento do projeto antes que ele ocorra. 
- **Zero Decisões por Empolgação:** Evitar complexidade desnecessária. Toda decisão técnica deve passar pelo filtro da real necessidade e do impacto a longo prazo.
- **Foco no Essencial:** Direcionar o esforço na detecção e adição de valor exclusivo por meio da praticidade, simplicidade, usabilidade e beleza. A melhor solução é sempre a mais simples que resolve o problema com máxima elegância.
- **Espírito Investigativo & Suspeita Contínua:** Nunca deduzir que algo está funcionando perfeitamente apenas porque "parece" estar funcionando (ou porque não gerou erros aparentes). Todo código, lógica de negócio, e fluxo de dados (como backups ou reatividade) deve ser examinado com profunda suspeita técnica e validado de forma conclusiva. A ausência de erros visíveis não garante a ausência de regressões silenciosas.
- **Proatividade & Coragem Técnica:** Não esperar o "momento perfeito" ou uma ordem explícita do usuário para investigar a fundo os detalhes do sistema. É inaceitável evitar analisar um código ou fluxo por "medo" de encontrar problemas maiores. O enfrentamento imediato de inconsistências é sempre preferível à ignorância confortável.

## 1. Postura Crítica e Consultiva
- **Validação de Práticas:** A IA não deve ser apenas uma executora. Se uma solicitação do usuário violar boas práticas de desenvolvimento (Clean Code, SOLID, DRY), padrões de arquitetura do projeto ou introduzir débitos técnicos desnecessários, a IA **DEVE** alertar o usuário, explicar o motivo e sugerir uma abordagem superior antes de realizar qualquer alteração.
- **Evitar a "Síndrome do Gênio Solitário":** Ao escrever ou refatorar código, prefira lógicas simples e explícitas em vez de construções densas e obscuras. A "economia de linhas" nunca deve sacrificar a legibilidade por juniores. Em trechos complexos, use comentários fofos, como se estivesse pegando na mão do próximo desenvolvedor.
  - **Ternários Aninhados Proibidos:** Evite ternários aninhados e lógicas densas misturadas no template HTML/Vue (ex: `:class="isTrue ? (cond2 ? 'A' : 'B') : 'C'"`). Extraia-os sempre para `computed properties` descritivas.
  - **Código Didático ("Pega na Mão"):** Em trechos inevitavelmente complexos (como drag-and-drop, merge de dados ou sincronizações de estado), use comentários didáticos em Português explicando o raciocínio.
  - **Variáveis Explicativas:** Não hesite em criar constantes intermediárias apenas para nomear condições lógicas complexas.
  - **Limite de Tamanho de Funções:** Se uma função de lógica complexa ultrapassar 20 linhas, divida-a em subfunções menores e autoexplicativas.
- **Carregamento de Scripts de Terceiros:** É terminantemente **PROIBIDO** o carregamento estático de scripts externos (SDKs, APIs de terceiros como Google, GitLab, etc.) via tag `<script>` no `index.html`. Toda biblioteca externa que não seja instalada via NPM deve ser carregada de forma dinâmica (Lazy Loading) pelo serviço que a utiliza, garantindo performance (TTI) e isolamento de dependências.
- **Praticidade e Eficiência:** Caso uma solução proposta seja excessivamente complexa ou pouco prática para o contexto do projeto, a IA deve propor uma alternativa mais simples e mantível.

## 2. Gestão de Dependências e Ecossistema
- **Sugestão de Pacotes:** Sempre que uma melhoria ou funcionalidade nova puder ser implementada de forma mais robusta, segura ou eficiente através da instalação de um pacote externo (NPM), a IA **DEVE** recomendar o uso desse pacote em vez de uma implementação manual "do zero".
- **Avaliação de Custo/Benefício:** Ao sugerir um pacote, a IA deve justificar brevemente por que aquela dependência é preferível à implementação interna (ex: manutenção, segurança, edge cases tratados).
- **Documentação de Novas Ferramentas (MANDATÓRIO):** Sempre que qualquer nova ferramenta relevante (linters, compiladores, bibliotecas de teste, utilitários globais, etc.) for instalada ou integrada ao repositório, a IA **DEVE** atualizar o `README.md` detalhando seu propósito técnico e comandos no setup do projeto, bem como atualizar este arquivo (`GEMINI.md`) introduzindo quaisquer diretrizes ou regras de conduta associadas ao seu uso.

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
- **Arquitetura de Transparência (MANDATÓRIO):** O sistema TASS possui um motor inteligente próprio para o efeito de vidro. É ESTRITAMENTE PROIBIDO o uso de classes fixas do Tailwind para blur (como `backdrop-blur-xl`) ou injeção de CSS em templates sem o uso das variáveis corretas, pois isso destrói a reatividade da Chave Mestra controlada pelo usuário. **Para implementar qualquer transparência, você DEVE ler antes e seguir o padrão documentado em `GLASSMORPHISM.md`.**

## 4. Inicialização e Contextualização
- **Leitura de Contexto:** Ao iniciar uma nova sessão ou tarefa complexa, a IA deve realizar uma leitura exploratória dos arquivos do projeto (além dos arquivos de regras) para compreender a estrutura atual, as dependências instaladas e a lógica de negócio implementada. Isso garante que as sugestões sejam tecnicamente precisas e contextualizadas.
- **Documentação Interna (MANDATÓRIO):** É **OBRIGATÓRIA** a leitura prévia e atenta dos arquivos `README.md` presentes nas pastas `src/stores/` e `src/services/` antes de propor ou executar qualquer modificação na lógica de negócio destas camadas. Eles contêm as definições arquiteturais, responsabilidades estritas de cada arquivo e regras de limites de escopo que não devem ser violadas.

## 5. Engenharia e Qualidade
- **Limpeza Contínua (Linter Mental):** Ao transitar pelo código ou refatorar componentes, a IA **DEVE** manter atenção redobrada e verificar proativamente se existem importações, variáveis, funções ou componentes órfãos (que não estão mais sendo utilizados) e removê-los imediatamente para manter a base de código limpa e otimizada.
- **Utilitários Globais e Centralização:** Nunca recrie lógicas complexas localmente em componentes. Sempre que lidar com conversões de cores hexadecimais ou opacidade (relacionada ao Glassmorphism), é OBRIGATÓRIO utilizar o arquivo utilitário `src/utils/colors.js` (ex: `hexToRgba`). A matemática de opacidade deve sempre consumir o getter centralizado `normalizedCardOpacity` do `settingsStore.js` para garantir coerência global no sistema.
- **Evitar Acoplamentos e Duplicações de Lógica (Auditoria Arquitetural):**
  - **Desacoplamento de Componentes (Evitar Componente "Deus"):** Mantenha `App.vue` enxuto. Timers, intervalos de monitoramento e regras complexas de jornadas devem residir em composables dedicados ou services, nunca na raiz de visualização do componente de forma desorganizada.
  - **Centralização de Formatação:** Lógicas de formatação repetitivas (como conversão de tempo, milissegundos para `HH:mm:ss` ou formatação de datas) devem ser centralizadas em arquivos utilitários globais dentro de `src/utils/` em vez de serem duplicadas em componentes ou stores.
- **Comportamento e Responsividade Mobile:** É OBRIGATÓRIO utilizar o composable centralizado `src/composables/useDeviceBehavior.js` para gerenciar qualquer lógica condicional de UI baseada no tamanho da tela (detecção de celular/desktop) ou estado de visibilidade de modais. Nunca recrie listeners de `resize` nativos do DOM individualmente nos componentes. Qualquer regra de layout responsivo baseada em scripts (ex: esconder a dock quando houver modais) deve ser mantida ou expandida estritamente dentro deste composable.
- **Documentação de Diretivas (Mandatório):** Diretivas (`src/directives/`) devem ser minimalistas e usadas apenas quando estritamente necessário. Qualquer alteração ou nova diretiva DEVE ser documentada detalhando sua arquitetura e funcionamento no arquivo `src/directives/README.md`.
- **Documentação de Serviços (Mandatório):** Ao criar ou alterar a lógica de qualquer serviço (`src/services/`) ou endpoint da API (`server.js`), é obrigatório atualizar o arquivo `README.md` do diretório correspondente com riqueza de detalhes (assinaturas de métodos, endpoints, payloads e comportamento esperado).
- **Ciclo de Vida e Montagem Condicional:** É obrigatório o uso de `v-if` em vez de `v-show` para componentes pesados, modais secundários ou componentes que utilizem diretivas customizadas/SDKs externos. Isso garante que o Vue processe o componente e suas dependências apenas quando necessário, evitando erros de resolução prematura ("Montagem Fantasma") e instabilidades de layout durante re-renderizações globais do `App.vue`.
- **Cultura de Testes (Mandatório):** Nenhuma funcionalidade nova ou refatoração de lógica (Stores, Services, Utils) é considerada completa sem a atualização ou criação dos testes unitários correspondentes em `*.test.js`.
- **Integridade de Cronômetros:** Ao implementar ajustes manuais de tempo, garantir que a alteração no tempo da sessão (`totalTimeSpent`) seja refletida proporcionalmente no acumulador histórico (`totalWorked`).
- **Validação de Build:** Antes de concluir qualquer tarefa, é obrigatório garantir que a suite de testes (`npm run test`) passe integralmente e que o projeto compile sem erros via `npm run build`.
- **Bug Fixes:** Para correções de bugs, deve-se primeiro criar um teste que reproduza a falha e, após a correção, garantir que o teste passe (Red-Green-Refactor).
- **Tratamento de Erros e Logs (MANDATÓRIO):** Toda e qualquer operação de persistência, leitura ou escrita no banco de dados local (IndexedDB) ou requisição síncrona crítica disparada diretamente por ações do usuário **DEVE** exibir uma mensagem de erro na tela (via `notificationService.toast` ou modal de erro) em formato compreensível para o usuário final, em vez de apenas logar silenciosamente no console com `console.error`. Erros técnicos silenciosos e recuperáveis de forma automática que não afetam a jornada do usuário (ex: escrita de cache de clima, formatação de fallbacks) devem ser contornados sem interromper a interface do usuário nem poluir desnecessariamente o terminal de testes.
- **Desacoplamento e Clean Code de Visibilidade (MANDATÓRIO):** Componentes visuais globais (como a Dock, Sidebar, etc.) **NÃO** devem possuir acoplamento interno com rotas (`vue-router`), stores de exibição ou regras de montagem específicas do layout principal no seu setup. A responsabilidade de decidir a visibilidade global é do layout pai (ex: `App.vue`), repassando-a para o filho através de propriedades reativas (`props` como `visible`). Isso preserva a capacidade do componente gerenciar suas próprias transições de entrada e saída (`leave` / `enter`) sem que o pai precise desmontá-lo abruptamente do DOM com `v-if`, além de manter a suíte de testes unitários isolada, limpa e livre de mocks de rotas e roteamento.
- **Declaração Formal de Eventos Customizados (MANDATÓRIO):** Todo evento personalizado emitido por um componente filho via `emit('nome-do-evento')` e ouvido pelo componente pai **DEVE** ser formalmente listado no bloco `defineEmits` do componente Vue (seguindo a convenção kebab-case). Isso é crítico para evitar que o console do navegador seja poluído com avisos de `Extraneous non-emits event listeners`, especialmente em componentes que resolvem para múltiplos nós raiz (Fragment ou layouts baseados no `BaseModal` de duas colunas) onde a herança automática do Vue 3 é desativada.

## 6. Comunicação e Workflow
- **Idioma:** Todo o raciocínio e comunicação devem ser realizados em **Português**.
- **Fluxo de Eventos:** Seguir o padrão de "Props down, Events up". Modais de ação devem ser disparados pelo `App.vue` através de eventos emitidos pelos componentes filhos (`TaskCard` -> `TaskBoard` -> `App`).
- **Proibição de Operações Git:** A IA está terminantemente **PROIBIDA** de executar comandos de Git (`add`, `commit`, `push`, `branch`, etc.) diretamente no terminal. Toda e qualquer alteração deve ser limitada ao escopo dos arquivos locais. O controle de versão é responsabilidade exclusiva do usuário.
- **Sugestão de Commits:** A IA deve apenas **SUGERIR** a mensagem de commit seguindo o padrão **Conventional Commits** em uma única linha de comando detalhada, para que o usuário possa revisar e executar manualmente se desejar.

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
  4. **Integração Git Remota e Breeze:** Exibição do menu de contexto, criação de branch com link mágico/API e operação equivalente entre GitLab e GitHub. Validar a coleção livre de ambientes e aliases, a seleção explícita da branch base, merges para qualquer ambiente cadastrado, proteção de todos os ambientes contra a limpeza comum e recriação somente de ambientes não-base após backup e confirmação manual.
  5. **Notas Rápidas:** Abertura e fechamento do painel CLI, alteração de cores, e persistência de notas no banco de dados.
  6. **Dados e Backups:** Importação/Exportação do sistema e de tarefas em JSON; login, envio e restauração pelo Google Drive; conexão WebDAV, envio, listagem, restauração e exclusão de backups na Nextcloud.
  7. **Consistência de Modais com `layout="sidebar"`**: Funcionamento, transição de abas e botões de ação final dos modais complexos (`TaskModal.vue`, `SettingsModal.vue` e `InterfaceMenu.vue`).
- **Expansão da Checklist:** Sempre que um novo elemento, controle ou funcionalidade for adicionado ao sistema, a IA **DEVE** atualizar esta seção no `GEMINI.md`, incluindo o novo item à lista de verificação obrigatória.
