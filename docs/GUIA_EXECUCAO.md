# Guia de Execução - Redimento Code Generator

Este documento fornece instruções detalhadas sobre como configurar, executar e usar o Redimento Code Generator.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação](#instalação)
3. [Configuração](#configuração)
4. [Execução](#execução)
5. [Comandos Disponíveis](#comandos-disponíveis)
6. [Verificação](#verificação)
7. [Troubleshooting](#troubleshooting)

## 🔧 Pré-requisitos

### Software Necessário

- **Node.js**: Versão 18.0.0 ou superior
  - Verificar versão: `node --version`
  - Download: [nodejs.org](https://nodejs.org/)

- **npm**: Geralmente instalado com Node.js
  - Verificar versão: `npm --version`

- **Git**: Para controle de versão
  - Verificar versão: `git --version`
  - Download: [git-scm.com](https://git-scm.com/)

### Contas e Tokens Necessários

1. **Azure DevOps**
   - Organização ativa no Azure DevOps
   - Personal Access Token com permissões adequadas

2. **Google Cloud Platform**
   - Conta no Google Cloud
   - API Key do Gemini AI habilitada

## 🚀 Instalação

### 1. Clonar o Repositório

```bash
git clone <repository-url>
cd redimento-code-generator
```

### 2. Instalar Dependências

```bash
npm install
```

Este comando instalará todas as dependências listadas no `package.json`:

**Dependências de Produção:**
- `express` - Framework web
- `@google/generative-ai` - Cliente Gemini AI
- `azure-devops-node-api` - Cliente Azure DevOps
- `simple-git` - Operações Git
- `dotenv` - Gerenciamento de variáveis de ambiente
- `cors` - CORS middleware
- `helmet` - Segurança HTTP
- `winston` - Sistema de logs

**Dependências de Desenvolvimento:**
- `typescript` - Compilador TypeScript
- `jest` - Framework de testes
- `fast-check` - Property-based testing
- `eslint` - Linter
- `prettier` - Formatador de código

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Copie o arquivo de exemplo e configure suas variáveis:

```bash
copy .env.example .env
```

### 2. Configurar o Arquivo .env

Edite o arquivo `.env` com suas configurações:

```env
# Configuração do Servidor
PORT=3000
NODE_ENV=development

# Configuração Azure DevOps
AZURE_DEVOPS_ORG_URL=https://dev.azure.com/sua-organizacao
AZURE_DEVOPS_TOKEN=seu-token-pessoal
AZURE_DEVOPS_PROJECT=nome-do-projeto

# Configuração Webhook
WEBHOOK_SECRET=sua-chave-secreta-webhook

# Configuração Google Gemini AI
GEMINI_API_KEY=sua-chave-api-gemini
GEMINI_MODEL=gemini-pro

# Configuração Git
GIT_USER_NAME=Redimento Code Generator
GIT_USER_EMAIL=redimento@suaempresa.com
GIT_DEFAULT_BRANCH=main

# Configuração de Repositórios
REPOS_BASE_PATH=./repos
DEFAULT_REVIEWERS=revisor1@empresa.com,revisor2@empresa.com

# Configuração de Logs
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Configuração de Retry
MAX_RETRY_ATTEMPTS=3
RETRY_BASE_DELAY=1000
RETRY_MAX_DELAY=10000

# Configuração Health Check
HEALTH_CHECK_TIMEOUT=5000

# Configuração de Segurança
API_KEY=sua-chave-api-endpoints-internos
```

### 3. Obter Tokens Necessários

#### Azure DevOps Personal Access Token

1. Acesse sua organização Azure DevOps
2. Vá em **User Settings** > **Personal Access Tokens**
3. Clique em **New Token**
4. Configure as permissões:
   - **Work Items**: Read & Write
   - **Code**: Read & Write
   - **Pull Requests**: Read & Write
   - **Project and Team**: Read
5. Copie o token gerado

#### Google Gemini API Key

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie um novo projeto ou selecione um existente
3. Gere uma nova API Key
4. Copie a chave gerada

## 🏃‍♂️ Execução

### Desenvolvimento

Para executar em modo de desenvolvimento com hot reload:

```bash
npm run dev
```

Este comando:
- Inicia o servidor TypeScript com `ts-node-dev`
- Monitora mudanças nos arquivos
- Reinicia automaticamente quando há alterações
- Transpila apenas (sem verificação de tipos para velocidade)

### Produção

Para executar em modo de produção:

```bash
# 1. Fazer build do projeto
npm run build

# 2. Iniciar a aplicação
npm start
```

O build:
- Compila TypeScript para JavaScript
- Gera arquivos na pasta `dist/`
- Verifica tipos e erros de compilação

## 📝 Comandos Disponíveis

### Comandos de Desenvolvimento

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento (hot reload)
npm run dev

# Build para produção
npm run build

# Iniciar aplicação compilada
npm start
```

### Comandos de Teste

```bash
# Executar todos os testes
npm test

# Testes em modo watch (re-executa ao salvar)
npm run test:watch

# Testes com relatório de cobertura
npm run test:coverage
```

### Comandos de Qualidade de Código

```bash
# Verificar problemas de linting
npm run lint

# Corrigir problemas de linting automaticamente
npm run lint:fix

# Formatar código com Prettier
npm run format
```

## ✅ Verificação

### 1. Verificar se o Servidor Iniciou

Após executar `npm run dev`, você deve ver:

```
[INFO] Server starting...
[INFO] Environment: development
[INFO] Server running on port 3000
[INFO] Azure DevOps integration initialized
[INFO] Gemini AI service initialized
```

### 2. Testar Endpoints

#### Health Check

```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2024-01-30T10:00:00.000Z",
  "services": {
    "azureDevOps": "connected",
    "geminiAI": "connected"
  }
}
```

#### Webhook Endpoint

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: sua-chave-secreta" \
  -d '{"eventType": "workitem.created", "resource": {"id": 123}}'
```

### 3. Verificar Logs

Os logs são salvos em:
- Console (desenvolvimento)
- Arquivo `./logs/app.log` (produção)

Exemplo de log:
```
2024-01-30 10:00:00 [INFO] Server started successfully
2024-01-30 10:00:01 [INFO] Webhook received: workitem.created
2024-01-30 10:00:02 [INFO] Processing work item: 123
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Porta em Uso

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solução:**
- Altere a porta no arquivo `.env`: `PORT=3001`
- Ou mate o processo usando a porta: `npx kill-port 3000`

#### 2. Erro de Token Azure DevOps

```
Error: Unauthorized (401) - Invalid token
```

**Solução:**
- Verifique se o token está correto no `.env`
- Confirme se o token tem as permissões necessárias
- Verifique se o token não expirou

#### 3. Erro de API Key Gemini

```
Error: API key not valid
```

**Solução:**
- Verifique se a API key está correta no `.env`
- Confirme se a API do Gemini está habilitada no projeto
- Verifique se há cotas disponíveis

#### 4. Erro de Dependências

```
Error: Cannot find module 'typescript'
```

**Solução:**
```bash
# Limpar cache e reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 5. Erro de Compilação TypeScript

```
Error: Cannot find name 'Express'
```

**Solução:**
- Verifique se os tipos estão instalados: `npm install @types/express`
- Execute: `npm run build` para ver erros detalhados

### Logs de Debug

Para habilitar logs detalhados:

```bash
# No arquivo .env
LOG_LEVEL=debug

# Ou via variável de ambiente
LOG_LEVEL=debug npm run dev
```

### Verificar Configuração

Execute este comando para verificar se tudo está configurado:

```bash
npm run lint && npm test && npm run build
```

Se todos passarem, sua configuração está correta!

## 📞 Suporte

Se você encontrar problemas não cobertos neste guia:

1. Verifique os logs em `./logs/app.log`
2. Execute os testes: `npm test`
3. Verifique a configuração: `npm run lint`
4. Consulte a documentação do Azure DevOps e Gemini AI

## 🔄 Próximos Passos

Após executar com sucesso:

1. Configure o webhook no Azure DevOps
2. Teste com um work item real
3. Monitore os logs para verificar o funcionamento
4. Configure o ambiente de produção

---

**Nota**: Este guia assume um ambiente de desenvolvimento local. Para produção, consulte o guia de deployment específico.