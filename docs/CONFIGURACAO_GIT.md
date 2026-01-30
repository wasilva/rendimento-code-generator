# Configuração do Git - Redimento Code Generator

Este documento explica como configurar as credenciais Git necessárias para o Redimento Code Generator fazer commits automáticos.

## 📋 Índice

- [O que são as variáveis Git](#o-que-são-as-variáveis-git)
- [Como obter suas configurações Git](#como-obter-suas-configurações-git)
- [Configuração no sistema](#configuração-no-sistema)
- [Opções de configuração](#opções-de-configuração)
- [Boas práticas](#boas-práticas)
- [Troubleshooting](#troubleshooting)

## 🔧 O que são as variáveis Git

O Redimento Code Generator precisa de credenciais Git para fazer commits automáticos quando gera código. As variáveis principais são:

### **GIT_USER_NAME**
- **O que é**: Nome que aparecerá como autor dos commits
- **Exemplo**: `"João Silva"` ou `"Redimento Code Generator"`
- **Uso**: Identificar quem fez o commit nos logs do Git

### **GIT_USER_EMAIL**
- **O que é**: Email que aparecerá como autor dos commits
- **Exemplo**: `"joao.silva@empresa.com"` ou `"redimento@empresa.com"`
- **Uso**: Identificar o email do autor nos logs do Git

### **GIT_DEFAULT_BRANCH**
- **O que é**: Branch principal do repositório
- **Exemplo**: `"main"` ou `"master"`
- **Uso**: Branch base para criar novas feature branches

## 📝 Como obter suas configurações Git

### 1. Verificar configuração atual do Git

Abra o terminal e execute os comandos:

```bash
# Verificar nome configurado
git config --global user.name

# Verificar email configurado  
git config --global user.email

# Verificar branch padrão
git config --global init.defaultBranch
```

**Exemplo de saída:**
```bash
$ git config --global user.name
João Silva

$ git config --global user.email
joao.silva@empresa.com

$ git config --global init.defaultBranch
main
```

### 2. Se não houver configuração

Se os comandos acima não retornarem nada, você precisa configurar o Git:

```bash
# Configurar nome
git config --global user.name "Seu Nome Completo"

# Configurar email
git config --global user.email "seu.email@empresa.com"

# Configurar branch padrão (opcional)
git config --global init.defaultBranch main
```

### 3. Verificar configuração completa

Para ver todas as configurações do Git:

```bash
# Ver todas as configurações
git config --list

# Ver apenas configurações de usuário
git config --list | grep user
```

## ⚙️ Configuração no sistema

### Opção 1: Usar suas credenciais pessoais

Use suas próprias credenciais Git:

```bash
# No arquivo .env
GIT_USER_NAME=João Silva
GIT_USER_EMAIL=joao.silva@empresa.com
GIT_DEFAULT_BRANCH=main
```

### Opção 2: Criar identidade específica para o bot

Crie uma identidade específica para o sistema:

```bash
# No arquivo .env
GIT_USER_NAME=Redimento Code Generator
GIT_USER_EMAIL=redimento@suaempresa.com
GIT_DEFAULT_BRANCH=main
```

### Opção 3: Usar conta de serviço

Use uma conta de serviço dedicada:

```bash
# No arquivo .env
GIT_USER_NAME=DevOps Bot
GIT_USER_EMAIL=devops-bot@suaempresa.com
GIT_DEFAULT_BRANCH=main
```

## 🎯 Opções de configuração

### Configurações básicas

```bash
# Configuração mínima necessária
GIT_USER_NAME=Nome do Autor
GIT_USER_EMAIL=email@empresa.com
GIT_DEFAULT_BRANCH=main
```

### Configurações avançadas (opcionais)

```bash
# Configurações básicas
GIT_USER_NAME=Redimento Code Generator
GIT_USER_EMAIL=redimento@empresa.com
GIT_DEFAULT_BRANCH=main

# Configurações avançadas (opcionais)
GIT_COMMIT_MESSAGE_PREFIX=[AUTO]
GIT_BRANCH_PREFIX=feat/
GIT_REMOTE_NAME=origin
GIT_SIGNING_KEY=
GIT_GPG_SIGN=false

# Configurações de repositório
REPOS_BASE_PATH=./repos
DEFAULT_REVIEWERS=dev1@empresa.com,dev2@empresa.com
```

### Explicação das configurações avançadas

| Variável | Descrição | Valor Padrão | Exemplo |
|----------|-----------|--------------|---------|
| `GIT_COMMIT_MESSAGE_PREFIX` | Prefixo para mensagens de commit | `[AUTO]` | `[BOT]`, `[GENERATED]` |
| `GIT_BRANCH_PREFIX` | Prefixo para branches criadas | `feat/` | `auto/`, `generated/` |
| `GIT_REMOTE_NAME` | Nome do remote Git | `origin` | `upstream`, `github` |
| `GIT_SIGNING_KEY` | Chave GPG para assinar commits | (vazio) | `ABC123DEF456` |
| `GIT_GPG_SIGN` | Assinar commits com GPG | `false` | `true` |

## 💡 Boas práticas

### 1. Identidade clara

Use uma identidade que deixe claro que é um commit automático:

```bash
# ✅ Bom - Deixa claro que é automático
GIT_USER_NAME=Redimento Code Generator
GIT_USER_EMAIL=redimento-bot@empresa.com

# ❌ Evitar - Pode confundir com desenvolvedor real
GIT_USER_NAME=João Silva
GIT_USER_EMAIL=joao.silva@empresa.com
```

### 2. Email corporativo

Use sempre email corporativo válido:

```bash
# ✅ Bom - Email corporativo válido
GIT_USER_EMAIL=devops@suaempresa.com

# ❌ Evitar - Email pessoal ou inválido
GIT_USER_EMAIL=noreply@example.com
```

### 3. Mensagens de commit descritivas

O sistema gerará mensagens como:

```
[AUTO] feat: implement user authentication (Work Item #1234)

- Generated login component
- Added authentication service  
- Created user model and interfaces
- Included unit tests

Work Item: https://dev.azure.com/org/project/_workitems/edit/1234
```

### 4. Configuração por ambiente

Use configurações diferentes por ambiente:

```bash
# .env.development
GIT_USER_NAME=Redimento Dev Bot
GIT_USER_EMAIL=redimento-dev@empresa.com

# .env.production  
GIT_USER_NAME=Redimento Code Generator
GIT_USER_EMAIL=redimento@empresa.com
```

## 🔍 Como verificar se está funcionando

### 1. Teste local

Execute um teste para verificar se as configurações estão corretas:

```bash
# Iniciar o sistema
npm run dev

# Em outro terminal, simular um webhook
curl -X POST http://localhost:3000/webhook/workitem \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=test" \
  -d '{"eventType":"workitem.updated","resource":{"id":1234}}'
```

### 2. Verificar logs

Procure nos logs por mensagens como:

```
[INFO] Git commit created successfully
[INFO] Commit author: Redimento Code Generator <redimento@empresa.com>
[INFO] Commit hash: abc123def456
[INFO] Branch: feat/1234_implement-user-login
```

### 3. Verificar no repositório

No repositório Git, verifique se os commits aparecem com a identidade correta:

```bash
# Ver últimos commits
git log --oneline -5

# Ver detalhes do commit incluindo autor
git log --format=fuller -1
```

**Exemplo de saída esperada:**
```
commit abc123def456789
Author:     Redimento Code Generator <redimento@empresa.com>
AuthorDate: Wed Jan 30 10:00:00 2024 -0300
Commit:     Redimento Code Generator <redimento@empresa.com>
CommitDate: Wed Jan 30 10:00:00 2024 -0300

    [AUTO] feat: implement user authentication (Work Item #1234)
```

## 🔧 Troubleshooting

### Problema 1: Commits não aparecem

**Sintoma:**
```
Error: Git commit failed - please tell me who you are
```

**Solução:**
```bash
# Verificar se as variáveis estão definidas
echo $GIT_USER_NAME
echo $GIT_USER_EMAIL

# Se estiverem vazias, configurar no .env
GIT_USER_NAME=Seu Nome
GIT_USER_EMAIL=seu.email@empresa.com
```

### Problema 2: Email inválido

**Sintoma:**
```
Error: Invalid email format
```

**Solução:**
```bash
# Verificar formato do email
# ✅ Correto
GIT_USER_EMAIL=usuario@empresa.com

# ❌ Incorreto
GIT_USER_EMAIL=usuario@
GIT_USER_EMAIL=@empresa.com
GIT_USER_EMAIL=usuario empresa.com
```

### Problema 3: Permissões de repositório

**Sintoma:**
```
Error: Permission denied (publickey)
```

**Solução:**
1. Verificar se o sistema tem acesso ao repositório
2. Configurar chaves SSH ou tokens de acesso
3. Verificar permissões de escrita no repositório

### Problema 4: Branch padrão não existe

**Sintoma:**
```
Error: Branch 'main' does not exist
```

**Solução:**
```bash
# Verificar qual é a branch padrão do repositório
git branch -r

# Ajustar configuração
GIT_DEFAULT_BRANCH=master  # ou a branch correta
```

## 📋 Checklist de configuração

- [ ] `GIT_USER_NAME` definido no .env
- [ ] `GIT_USER_EMAIL` definido no .env com email válido
- [ ] `GIT_DEFAULT_BRANCH` definido (geralmente `main` ou `master`)
- [ ] Teste local executado com sucesso
- [ ] Commits aparecem no repositório com identidade correta
- [ ] Logs do sistema mostram commits bem-sucedidos
- [ ] Permissões de escrita no repositório verificadas

## 🎯 Exemplo completo de configuração

### Arquivo .env final

```bash
# ===========================================
# CONFIGURAÇÃO GIT
# ===========================================

# Identidade para commits automáticos
GIT_USER_NAME=Redimento Code Generator
GIT_USER_EMAIL=redimento@suaempresa.com

# Branch padrão do repositório
GIT_DEFAULT_BRANCH=main

# Configurações opcionais
GIT_COMMIT_MESSAGE_PREFIX=[AUTO]
GIT_BRANCH_PREFIX=feat/
GIT_REMOTE_NAME=origin

# ===========================================
# CONFIGURAÇÃO DE REPOSITÓRIOS
# ===========================================

# Diretório base para clones
REPOS_BASE_PATH=./repos

# Revisores padrão para PRs
DEFAULT_REVIEWERS=dev-lead@empresa.com,arquiteto@empresa.com
```

### Teste de validação

```bash
# 1. Verificar variáveis
npm run dev

# 2. Verificar logs
tail -f logs/app.log | grep -i git

# 3. Simular processamento
# (criar work item no Azure DevOps ou usar webhook de teste)

# 4. Verificar resultado no repositório
git log --oneline -5
```

---

**Resumo**: As variáveis `GIT_USER_NAME` e `GIT_USER_EMAIL` são simplesmente o nome e email que você quer que apareçam como autor dos commits automáticos. Você pode usar suas próprias credenciais ou criar uma identidade específica para o bot.

*Última atualização: Janeiro 2024*
*Versão do documento: 1.0*