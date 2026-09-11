# 🚀 TASS - Task & Advanced Support System
*Elite Productivity for High-Performance Developers*

O **TASS** é um ecossistema de suporte avançado projetado para desenvolvedores que buscam o máximo em produtividade e organização. Combinando uma estética refinada com engenharia de precisão, o TASS transforma a gestão de tarefas em uma experiência fluida, segura e visualmente impactante.

---

## 📸 Galeria (Preview)

Aqui estão algumas capturas de tela mostrando a interface premium do TASS em ação:

<details>
  <summary>🖼️ <b>Clique para expandir e ver as capturas de tela</b></summary>
  <br>
  <div align="center">
    <a href="./public/prints/Screenshot1.png" target="_blank">
      <img src="./public/prints/Screenshot1.png" width="800" alt="TASS - Tela Principal" style="border-radius: 10px; margin-bottom: 20px;" />
    </a>
    <br>
    <a href="./public/prints/Screenshot2.png" target="_blank">
      <img src="./public/prints/Screenshot2.png" width="800" alt="TASS - Tema e Transparência" style="border-radius: 10px; margin-bottom: 20px;" />
    </a>
    <br>
    <a href="./public/prints/Screenshot3.png" target="_blank">
      <img src="./public/prints/Screenshot3.png" width="800" alt="TASS - Customização Glassmorphism" style="border-radius: 10px; margin-bottom: 20px;" />
    </a>
    <br>
    <a href="./public/prints/Screenshot4.png" target="_blank">
      <img src="./public/prints/Screenshot4.png" width="800" alt="TASS - Kanban e Tarefas" style="border-radius: 10px; margin-bottom: 20px;" />
    </a>
    <br>
    <a href="./public/prints/Screenshot5.png" target="_blank">
      <img src="./public/prints/Screenshot5.png" width="800" alt="TASS - Design System e Modais" style="border-radius: 10px; margin-bottom: 20px;" />
    </a>
    <br>
    <a href="./public/prints/Screenshot6.png" target="_blank">
      <img src="./public/prints/Screenshot6.png" width="800" alt="TASS - Extras" style="border-radius: 10px; margin-bottom: 20px;" />
    </a>
  </div>
</details>

---

## ✨ Diferenciais Premium

### 🎨 Design Engine: O Workspace é Seu
O TASS não é apenas uma ferramenta; é um **Ambiente de Trabalho Imersivo** que se molda à sua identidade. Através de uma engine de design dinâmica e poderosa, você tem controle total sobre a estética do seu espaço produtivo com **Live Preview** instantâneo.

| Recurso | Detalhes da Experiência |
| :--- | :--- |
| **Radius Harmony** | Geometria inteligente com ajuste unificado de arredondamento de cantos. Mantém a harmonia matemática entre cards, inputs e modais em tempo real. |
| **Opacidade Granular** | Controle absoluto da transparência. Ajuste níveis de opacidade de forma independente para Cards, Menus, Barra Superior e Dock Inferior. |
| **Task Styles Profiles** | Construção avançada de **Perfis de Tarefas**. Customize o padding, dimensões, fontes, contornos e cores das tarefas. Aplique os perfis individualmente a cada card ou force-os em colunas inteiras do seu Kanban. |
| **Galeria Premium** | Slots curados para wallpapers de alta definição, permitindo transformar o clima do seu ambiente com um único clique. |
| **Ajuste Dinâmico** | Altere o brilho, contraste e desfoque do workspace para se adaptar ao seu momento, seja para foco total ou inspiração criativa. |

*O conceito de **Glassmorphism Aprimorado** do TASS entrega efeitos de desfoque e camadas que mantêm a profundidade e a clareza, proporcionando uma interface "viva" e sofisticada.*

### ⚡ Agilidade Adaptável (Kanban & Sprints)
O TASS redefine a agilidade com um sistema que se molda ao seu ritmo, e não o contrário. Uma abordagem fluida para quem precisa de ordem sem a rigidez dos sistemas tradicionais.

| Recurso | A Experiência TASS |
| :--- | :--- |
| **Quadro Mutável** | O sistema se adapta ao "tamanho do seu dia". Alterne instantaneamente entre **1 e 4 colunas** para simplificar ou expandir seu fluxo de trabalho conforme a carga cognitiva do momento. |
| **Sprints de Foco** | Sprints no TASS não são obrigações burocráticas, mas **ciclos de clareza**. Organize tarefas por prazos ou use-as como "pastas" dinâmicas para organizar o ciclo de vida dos seus projetos. |
| **Foco no Agora** | Elimine o ruído visual com precisão cirúrgica. Escolha focar em uma Sprint específica para máxima concentração ou visualize o panorama completo com a visão global. |
| **Nomenclatura Livre** | Liberdade total para definir seu método. Personalize o nome das colunas (**Backlog, Fazendo, Revisando**, etc.) para refletir exatamente sua metodologia ou preferência pessoal. |

### ☁️ Backups no Google Drive e Nextcloud
Seus dados podem ser protegidos tanto no ecossistema Google quanto em uma nuvem Nextcloud de sua escolha.
- **Google Drive:** Autenticação Google, backups completos e restauração de versões na pasta privada do TASS.
- **Nextcloud Livre:** Integração WebDAV com qualquer instância compatível, sem cadastro centralizado de aplicativo.
- **Credencial Protegida:** A senha de aplicativo da Nextcloud permanece apenas na sessão da aba e é removida ao desconectar ou fechar o navegador.
- **Restauração de Versões:** Lista, restaura e exclui snapshots completos diretamente pela área de Dados e Segurança.

Para a Nextcloud, use HTTPS e gere uma senha exclusiva em **Configurações pessoais → Segurança → Dispositivos e sessões**. Quando TASS e Nextcloud estiverem em origens diferentes, o servidor ou proxy da Nextcloud deverá permitir CORS para a origem do TASS e para os métodos WebDAV utilizados pela aplicação.

Para instalações atrás de Cloudflare Tunnel e Nextcloud Apache, consulte o tutorial [Integração TASS + Nextcloud atrás do Cloudflare Tunnel](docs/NEXTCLOUD_CORS_CLOUDFLARE.md).

### 🌿 Workflow Git Remoto de Alta Performance
Integração com GitLab e GitHub projetada para quem vive no ciclo de desenvolvimento moderno.
- **Ambientes Livres:** Cadastre quantas branches e aliases forem necessários e escolha explicitamente qual ambiente será a base global, sem convenções obrigatórias de nome.
- **Merge Rápido:** Selecione qualquer ambiente cadastrado como destino, com análise prévia de conflitos em Merge Requests ou Pull Requests.
- **Breeze Seguro:** Branches de ambiente ficam fora da limpeza comum. Um ambiente não-base pode ser recriado a partir da base somente depois de um backup obrigatório e de confirmação manual.

### 📻 Sistema de Rádio Evoluído
Mantenha o estado de *flow* com a trilha sonora ideal sem sair do ambiente de trabalho.
- **Player Online Estável:** Streaming de rádio integrado com baixo consumo de memória.
- **Gestão de Favoritos:** Sistema de estrelas para favoritar suas estações preferidas e acessá-las rapidamente pelo Global Dock.

### 🌿 Bem-estar (Wellness Whispers)
Produtividade sustentável através de inteligência de suporte.
- **Sussurros de Bem-estar:** Lembretes inteligentes e sutis de postura e hidratação, garantindo que sua saúde acompanhe seu desempenho técnico.

### 📝 Notes Panel (Painel de Notas Rápidas)
Um painel lateral minimalista e focado, projetado para capturar insights e anotações ricas sem distrações.
- **Rich Text Inteligente:** Área livre e limpa para registro de notas rápidas contendo quebras de linha nativas.
- **Persistência Total:** Gravação automática em tempo real via **Dexie.js**, garantindo que suas notas estejam seguras mesmo após fechar o navegador.
- **Versatilidade Adaptativa:** Painel flutuante de vidro que pode ser fixado à esquerda ou direita, com suporte a redimensionamento dinâmico.
- **Acesso Ultra-rápido:** Projetado para o teclado — utilize o atalho de mouse ou clique simples para abrir/fechar instantaneamente.

### 🛡️ Integridade de Dados & Merge Seguro
Segurança de dados de nível empresarial, de ponta a ponta.
- **Merge Seguro:** Algoritmo avançado de importação que preserva dados locais recentes, limpa referências órfãs e garante a integridade estrutural do banco de dados (Dexie migrations nativas).
- **Offline-First:** Funcionamento resiliente via **Dexie.js (IndexedDB)**, garantindo que o sistema funcione perfeitamente sem nenhuma conexão de internet.

---

## ⚙️ Arquitetura Técnica (100% Serverless)

O TASS foi construído com foco em precisão, leveza e performance extremas. **A aplicação não necessita de banco de dados SQL ou servidor backend ativo (Node.js/Express) para funcionar**. Todo o motor roda do lado do cliente (Frontend-only):

- **Arquitetura Client-Side:** Baixo consumo de memória e total isolamento (sandbox) local. Não há polling de rede invisível consumindo sua bateria.
- **Web Workers (Virtual Hardware Precision):** O cronômetro das tarefas opera em uma thread isolada via Web Worker nativo, garantindo que a contagem de tempo seja imune a restrições de economia de bateria aplicadas pelo navegador em abas de segundo plano.
- **Modularidade Avançada:** Arquitetura baseada em serviços desacoplados (`src/services/`) e stores reativas do Pinia (`src/stores/`) para máxima escalabilidade.
- **Garantia de Qualidade (ESLint & Vitest):**
  - **ESLint:** Configuração baseada na especificação Flat Config moderna (v9+) integrada com analisadores de Vue 3. Varre o repositório em busca de variáveis órfãs, imports mortos ou sintaxes inválidas, mantendo a base de código limpa e otimizada.
  - **Vitest:** Suite de testes moderna, integrada nativamente ao Vite, que valida a integridade de stores, composables e utilitários em tempo recorde, prevenindo regressões de lógica.
- **Estilização Semântica:** Uso rigoroso de Tailwind CSS e variáveis de CSS puro, garantindo zero hardcoding em estilos e permitindo customização infinita.

---

## 🛠️ Tecnologias de Ponta

- **[Vue 3](https://vuejs.org/)**: Reatividade e componentes com Composition API.
- **[Pinia](https://pinia.vuejs.org/)**: Gestão de estado global de alta performance.
- **[Tailwind CSS](https://tailwindcss.com/)**: Design atômico e responsivo.
- **[Lucide Vue Next](https://lucide.dev/)**: Iconografia premium e consistente.
- **[Vitest](https://vitest.dev/)**: Suite de testes unitários ultra-rápida.
- **[ESLint](https://eslint.org/)**: Análise estática do código para qualidade e consistência.
- **[Dexie.js](https://dexie.org/)**: Persistência robusta no cliente.

---

## 🚀 Desenvolvimento

### Pré-requisitos
- [Node.js](https://nodejs.org/) (Versão recomendada: >= 18)

### Setup e Execução
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor local de desenvolvimento do Vite:
   ```bash
   npm run dev
   ```
   Acesse: `http://localhost:5175`

### Qualidade e CI
```bash
# Executar testes unitários
npm test

# Executar a varredura do linter para controle de código órfão
npm run lint

# Gerar build final de produção (SPA)
npm run build
```

### Publicação em servidor estático

O script `scripts/publish-tass.sh` gera o build de produção, valida o acesso SSH e envia o conteúdo de `dist/` para `/srv/sites/tass` no host informado:

```bash
./scripts/publish-tass.sh --target USUARIO@HOST
```

O destino pode ser alterado com `--directory`. Também é possível definir `TASS_DEPLOY_TARGET` e `TASS_DEPLOY_DIRECTORY` em `scripts/.env`; esse arquivo privado não deve ser versionado.

---

## 📄 Licença

Desenvolvido para transformar a produtividade em uma forma de arte. Uso livre para entusiastas de tecnologia e eficiência.
