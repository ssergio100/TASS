# 📝 Plano de Melhoria: Autenticação Exclusiva com Google Login (TASS)

Este plano especifica as mudanças para simplificar a autenticação no **TASS (Task & Advanced Support System)**, eliminando o fluxo tradicional de e-mail/senha local e adotando o **Google Login como única e exclusiva porta de entrada**.

---

## 🎯 Objetivos
1. **Segurança Simplificada:** Eliminar o gerenciamento de senhas locais, hashing e fluxos de recuperação complexos de chaves.
2. **Experiência de Usuário Premium:** Reduzir a fricção no acesso ao sistema com login em um único clique.
3. **Pronto para Hospedagem:** Adequar a aplicação para ser hospedada publicamente com tranquilidade, sabendo que a autenticação e redefinição de credenciais são garantidas pelo ecossistema de segurança do Google.

---

## ⚙️ Mudanças Propostas

### 1. Simplificação do Frontend (`src/components/AuthOverlay.vue`)
- **Remover** os campos de formulário para cadastro manual, login tradicional e recuperação de senha.
- **Remover** os modos internos de tela (`login`, `register`, `show-recovery`, `recover`).
- **Exibir apenas** a logo da marca, a descrição do sistema e um botão grande e estilizado para **"Entrar com o Google"**.
- Manter o carregamento assíncrono do SDK Google GSI e o disparo do `tokenClient`.

### 2. Ajustes na Área Logada (`src/components/SettingsModal.vue`)
- Na aba **"Minha Conta"**, serão **removidos**:
  - O painel de *"Código de Recuperação"* (já que a recuperação de conta passa a ser pelo fluxo nativo do Google).
  - O formulário de *"Alterar Senha"* (já que o TASS não armazenará ou gerenciará senhas dos usuários).
- Será exibido apenas o e-mail logado e o botão de logout (*"Sair da Conta"*).

### 3. Backend e Banco de Dados (`server.js`)
- Não são necessárias alterações estruturais no banco de dados SQLite. 
- O backend continuará gerando valores internos seguros (senha randômica e código dummy) no primeiro login via Google para preencher as restrições obrigatórias (`NOT NULL`) da tabela `users`.
- As APIs de login/registro manuais podem permanecer inativas e sem rotas utilizáveis no frontend.

---

## 🧪 Validação
- Executar e validar toda a suíte de testes unitários:
  ```powershell
  npm run test
  ```
- Validar manualmente a compilação do bundle de produção:
  ```powershell
  npm run build
  ```
