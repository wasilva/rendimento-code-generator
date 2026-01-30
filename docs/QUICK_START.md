# Quick Start - Redimento Code Generator

Guia rápido para executar o projeto em 5 minutos.

## ⚡ Setup Rápido

### 1. Pré-requisitos
```bash
# Verificar Node.js (>= 18.0.0)
node --version

# Verificar npm
npm --version
```

### 2. Instalação
```bash
# Clonar e instalar
git clone <repository-url>
cd redimento-code-generator
npm install
```

### 3. Configuração Mínima
```bash
# Copiar arquivo de ambiente
copy .env.example .env
```

**Editar `.env` com configurações mínimas:**
```env
PORT=3000
NODE_ENV=development
AZURE_DEVOPS_ORG_URL=https://dev.azure.com/sua-org
AZURE_DEVOPS_TOKEN=seu-token
AZURE_DEVOPS_PROJECT=seu-projeto
GEMINI_API_KEY=sua-chave-gemini
```

### 4. Executar
```bash
# Desenvolvimento
npm run dev

# Ou produção
npm run build && npm start
```

## 🚀 Comandos Essenciais

```bash
npm run dev         # Desenvolvimento com hot reload
npm test            # Executar testes
npm run build       # Build para produção
npm start           # Iniciar aplicação
npm run lint        # Verificar código
```

## ✅ Verificação Rápida

1. **Servidor rodando**: `http://localhost:3000`
2. **Health check**: `curl http://localhost:3000/health`
3. **Logs**: Verificar console ou `./logs/app.log`

## 🔧 Tokens Necessários

### Azure DevOps Token
1. Azure DevOps → User Settings → Personal Access Tokens
2. Permissões: Work Items, Code, Pull Requests (Read & Write)

### Gemini API Key
1. [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Criar novo projeto → Gerar API Key

## 🆘 Problemas Comuns

| Erro                  | Solução                       |
|-----------------------|-------------------------------|
| Porta em uso          | Alterar `PORT` no `.env`      |
| Token inválido        | Verificar permissões do token |
| Módulo não encontrado | `npm install`                 |
| Erro de build         | `npm run lint`                |

## 📚 Documentação Completa

- [Guia Completo de Execução](GUIA_EXECUCAO.md)
- [Configuração Azure DevOps](CONFIGURACAO_AZURE_DEVOPS.md)
- [README Principal](../README.md)

---

**Tempo estimado**: 5-10 minutos para setup completo