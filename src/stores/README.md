# TASS Stores (Pinia)

Este diretório contém todos os gerenciadores de estado globais da aplicação, utilizando o **Pinia**.
A arquitetura do TASS é "Store-Driven", o que significa que a maior parte da lógica de negócio, regras da jornada de trabalho e persistência no IndexedDB residem aqui, mantendo os componentes Vue (`.vue`) focados estritamente na interface e interação.

## Arquivos e Responsabilidades

### 1. `uiStore.js`
- **Papel:** Centralizador de estados visuais e modais globais.
- **Como funciona:** Controla a visibilidade (booleans) de todos os modais globais e menus de interface (como `SettingsModal`, `TaskModal`, `GitRebuilder`, etc.). Substitui o uso de "Prop Drilling" e `$emit` em cadeia, permitindo que qualquer componente no sistema possa abrir ou fechar um modal sem acoplar a lógica ao `App.vue`.

### 2. `taskStore.js`
- **Papel:** Core CRUD das Tarefas e gerenciamento do Quadro Kanban.
- **Como funciona:** Mantém o estado da lista de tarefas e orquestra a adição, edição, exclusão e movimentação geométrica das colunas. Comunica-se diretamente com o `db.js` (IndexedDB) para persistência. Ele também cuida da filtragem (`statusFilter`) e da alocação das tarefas no board.

### 3. `timerStore.js`
- **Papel:** Motor de Controle de Tempo e Jornada de Trabalho.
- **Como funciona:** Abstraído recentemente do `taskStore`, este arquivo isola toda a complexidade sensível de iniciar, parar e ajustar o tempo gasto nas tarefas. Ele aplica regras de negócio rígidas da "Jornada de Trabalho" (ex: impedir inicialização fora do expediente, pausar inatividade) e calcula métricas como o `totalWorked` com base no tempo da sessão.

### 4. `sprintStore.js`
- **Papel:** Gerenciamento do Ciclo de Sprints (Metodologia Ágil).
- **Como funciona:** Cuida da criação, atualização e exclusão de Sprints. Calcula métricas em tempo real, verifica o percentual de conclusão das tarefas de uma Sprint e realiza rotinas de limpeza ou deleção massiva no banco de dados.

### 5. `settingsStore.js`
- **Papel:** Configurações, Temas e Preferências Globais.
- **Como funciona:** Armazena e persiste preferências da aplicação como: tema visual (Dark/Light), ajustes finos de Glassmorphism (opacidade, raio de bordas, alvos de blur), integração com GitLab e GitHub, quantidade de colunas e horários da jornada de trabalho. Cada provedor possui uma coleção livre e ordenável de ambientes, formada por `id`, branch física e alias, além de uma referência explícita ao ambiente base. Os getters `activeEnvironments`, `activeBaseEnvironment` e `activeBaseBranch` expõem a configuração do provedor ativo sem deduzir papéis a partir do nome das branches. Configurações antigas com três slots são migradas automaticamente para esse formato.

### 6. `modalStore.js`
- **Papel:** Gerenciamento de diálogos sistêmicos assíncronos (Confirm/Prompt).
- **Como funciona:** Atua como um substituto robusto para os nativos `window.alert` e `window.confirm`. Permite acionar modais sofisticados do tipo "Sim/Não/Cancelar" ou campos de "Input" através de chamadas imperativas (`await prompt()`), resolvendo a Promise quando o usuário clica em um dos botões. Muito utilizado em sintonia com o `notificationService`.

### 7. `notificationStore.js`
- **Papel:** Fila de Notificações Rápidas (Toasts).
- **Como funciona:** Controla a fila, empilhamento e o ciclo de vida das mensagens de aviso rápido que aparecem no canto da tela (sucesso, erro, informação), garantindo que elas desapareçam corretamente após alguns segundos ou via interação do usuário.

### 8. `radioStore.js`
- **Papel:** Player Integrado de Lofi/Rádio.
- **Como funciona:** Gerencia as estações de rádio embutidas na ferramenta, armazenando o volume atual, controle de play/pause da música, e a inicialização segura do objeto em background.

### 9. `noteStore.js`
- **Papel:** Caderno de Notas Rápidas e Área CLI.
- **Como funciona:** Persiste as notas inseridas no painel rápido inferior. Ouve e sincroniza imediatamente as alterações com o IndexedDB.

### 10. `taskStyleStore.js`
- **Papel:** Motor de Estilos Dinâmicos e Customização.
- **Como funciona:** Permite aplicar regras visuais isoladas (em tempo de execução) para tarefas que contenham marcações/tags específicas, alterando paletas de cor, bordas, fontes ou fundos nas colunas, sem precisar tocar nas folhas de estilo em CSS base do projeto.

---

> **Diretrizes de Manutenção da Camada de Stores:**
> 1. Um Store nunca deve manipular o HTML interno (refs) de um componente local, nem realizar injeções globais irrestritas (exceto utilitários de tema bem delimitados).
> 2. Se uma lógica é necessária em múltiplos componentes e envolve estado de longo prazo, ela **deve** residir em um Store ou Composable, minimizando a repetição de código (`DRY`).
> 3. Nenhuma store deve ser fundida novamente se suas responsabilidades forem muito divergentes (exemplo: Timer/Jornada não deve ser devolvido ao TaskStore). A fragmentação semântica protege a manutenibilidade.
