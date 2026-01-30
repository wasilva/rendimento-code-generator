# Configuração de Segurança - Redimento Code Generator

Este documento explica como configurar todas as chaves de segurança e autenticação necessárias para o Redimento Code Generator, incluindo API keys, tokens e secrets.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [API_KEY (Endpoints Administrativos)](#api_key-endpoints-administrativos)
- [Chaves de Segurança](#chaves-de-segurança)
- [Configuração por Ambiente](#configuração-por-ambiente)
- [Boas Práticas](#boas-práticas)
- [Rotação de Chaves](#rotação-de-chaves)
- [Monitoramento de Segurança](#monitoramento-de-segurança)
- [Troubleshooting](#troubleshooting)

## 🔐 Visão Geral

O Redimento Code Generator utiliza múltiplas camadas de segurança para proteger diferentes aspectos do sistema:

### Tipos de credenciais

| Credencial | Propósito | Onde obter | Exemplo |
|------------|-----------|------------|---------|
| **API_KEY** | Endpoints administrativos | Você cria | `abc123def456...` |
| **WEBHOOK_SECRET** | Validação de webhooks | Você cria | `webhook-secret-123` |
| **AZURE_DEVOPS_TOKEN** | API do Azure DevOps | Azure DevOps | `pat_abc123def456...` |
| **GEMINI_API_KEY** | API do Google Gemini | Google AI Studio | `AIzaSyD...` |

### Arquitetura de segurança

```mermaid
graph TB
    subgraph "External Services"
        AzDO[Azure DevOps]
        Gemini[Google Gemini API]
    end
    
    subgraph "Redimento Code Generator"
        WH[Webhook Handler]
        Admin[Admin Endpoints]
        Core[Core Services]
    end
    
    subgraph "Security Layers"
        HMAC[HMAC Validation]
        JWT[API Key Auth]
        TLS[TLS/HTTPS]
    end
    
    AzDO -->|WEBHOOK_SECRET| HMAC
    HMAC --> WH
    
    Admin -->|API_KEY| JWT
    
    Core -->|AZURE_DEVOPS_TOKEN| AzDO
    Core -->|GEMINI_API_KEY| Gemini
    
    TLS --> WH
    TLS --> Admin
```

## 🔑 API_KEY (Endpoints Administrativos)

### O que é

O **API_KEY** é uma chave secreta que **você cria** para proteger o acesso aos endpoints administrativos do sistema.

```bash
# Configuração básica
API_KEY=sua-chave-administrativa-super-secreta-2024
```

### Endpoints protegidos

| Endpoint | Descrição | Método |
|----------|-----------|--------|
| `/admin/status` | Status detalhado do sistema | GET |
| `/admin/logs` | Visualizar logs da aplicação | GET |
| `/admin/retry/{id}` | Reprocessar work item falhado | POST |
| `/admin/repositories/metrics` | Métricas de repositórios | GET |
| `/admin/repositories/cleanup` | Limpeza de repositórios | POST |
| `/admin/config` | Configurações do sistema | GET/PUT |

### Como gerar uma API_KEY

#### Método 1: Crypto (Node.js)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**Resultado:** `f4e5d6c7b8a9102938475665748392019283746556473829abc123def456ghi789`

#### Método 2: OpenSSL
```bash
openssl rand -hex 32
```
**Resultado:** `a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456`

#### Método 3: PowerShell (Windows)
```powershell
[System.Web.Security.Membership]::GeneratePassword(64, 10)
```
**Resultado:** `Kj8#mN2$pQ9@rT5%vW3&xZ7!aB4^cD6*eF1+gH0-iL9=jM8`

#### Método 4: UUID
```bash
# Linux/Mac
uuidgen

# Online
# Visite: https://www.uuidgenerator.net/
```
**Resultado:** `550e8400-e29b-41d4-a716-446655440000`

### Como usar

#### Configuração no .env
```bash
# ===========================================
# CONFIGURAÇÃO DE SEGURANÇA
# ===========================================

# Chave para endpoints administrativos (VOCÊ CRIA)
API_KEY=redimento-admin-2024-f4e5d6c7b8a9102938475665748392019283746556473829
```

#### Fazendo requisições
```bash
# Verificar status do sistema
curl -H "Authorization: Bearer redimento-admin-2024-f4e5d6c7b8a9102938475665748392019283746556473829" \
  http://localhost:3000/admin/status

# Ver logs recentes
curl -H "Authorization: Bearer sua-api-key" \
  "http://localhost:3000/admin/logs?level=error&limit=50"

# Métricas de repositórios
curl -H "Authorization: Bearer sua-api-key" \
  http://localhost:3000/admin/repositories/metrics

# Reprocessar work item
curl -X POST \
  -H "Authorization: Bearer sua-api-key" \
  http://localhost:3000/admin/retry/proc_abc123def456
```

#### Resposta de sucesso
```json
{
  "success": true,
  "data": {
    "system": {
      "status": "running",
      "uptime": "2d 14h 32m",
      "version": "1.0.0",
      "environment": "production"
    },
    "services": {
      "azureDevOps": "connected",
      "geminiAI": "connected",
      "git": "ready"
    }
  },
  "timestamp": "2024-01-30T10:00:00.000Z"
}
```

#### Resposta de erro (sem API_KEY)
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "API key required for admin endpoints",
  "timestamp": "2024-01-30T10:00:00.000Z"
}
```

## 🔐 Chaves de Segurança

### Resumo de todas as chaves

```bash
# ===========================================
# CONFIGURAÇÃO COMPLETA DE SEGURANÇA
# ===========================================

# 1. API Key para endpoints administrativos (VOCÊ CRIA)
API_KEY=redimento-admin-2024-abc123def456ghi789jkl012mno345pqr678stu901vwx234

# 2. Webhook Secret para validação HMAC (VOCÊ CRIA)
WEBHOOK_SECRET=webhook-redimento-2024-xyz789abc123def456ghi789jkl012mno345pqr678

# 3. Azure DevOps Personal Access Token (OBTER NO AZURE DEVOPS)
AZURE_DEVOPS_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

# 4. Google Gemini API Key (OBTER NO GOOGLE AI STUDIO)
GEMINI_API_KEY=AIzaSyDaGmWKa4JsXGK5D3_HFbIabc123def456ghi789jkl

# 5. Configurações opcionais de segurança
JWT_SECRET=jwt-secret-redimento-2024-mnopqr789stu012vwx345yz678abc123def456
ENCRYPTION_KEY=encryption-key-2024-ghijkl345mno678pqr901stu234vwx567yz890
```

### Detalhamento de cada chave

#### 1. API_KEY
- **Propósito**: Proteger endpoints administrativos
- **Quem cria**: Você (administrador)
- **Como gerar**: Métodos mostrados acima
- **Onde usar**: Headers `Authorization: Bearer {API_KEY}`

#### 2. WEBHOOK_SECRET
- **Propósito**: Validar assinatura HMAC dos webhooks
- **Quem cria**: Você (mesmo valor no Azure DevOps)
- **Como gerar**: Mesmos métodos da API_KEY
- **Onde usar**: Configuração do Service Hook no Azure DevOps

#### 3. AZURE_DEVOPS_TOKEN
- **Propósito**: Autenticar com API do Azure DevOps
- **Quem cria**: Azure DevOps (Personal Access Token)
- **Como obter**: Ver [CONFIGURACAO_AZURE_DEVOPS.md](CONFIGURACAO_AZURE_DEVOPS.md)
- **Onde usar**: Headers de requisições para Azure DevOps API

#### 4. GEMINI_API_KEY
- **Propósito**: Autenticar com API do Google Gemini
- **Quem cria**: Google AI Studio
- **Como obter**: Ver [CONFIGURACAO_GEMINI_API.md](CONFIGURACAO_GEMINI_API.md)
- **Onde usar**: Requisições para Gemini API

## ⚙️ Configuração por Ambiente

### Desenvolvimento
```bash
# .env.development
API_KEY=dev-api-key-2024-abc123
WEBHOOK_SECRET=dev-webhook-secret-2024-xyz789
AZURE_DEVOPS_TOKEN=dev-azure-token-aaabbbccc
GEMINI_API_KEY=dev-gemini-key-AIzaSyD123
```

### Teste
```bash
# .env.test
API_KEY=test-api-key-2024-def456
WEBHOOK_SECRET=test-webhook-secret-2024-uvw012
AZURE_DEVOPS_TOKEN=test-azure-token-dddeeefff
GEMINI_API_KEY=test-gemini-key-AIzaSyD456
```

### Produção
```bash
# .env.production
API_KEY=prod-redimento-admin-2024-f4e5d6c7b8a9102938475665748392019283746556473829
WEBHOOK_SECRET=prod-webhook-redimento-2024-a1b2c3d4e5f6789012345678901234567890abcdef
AZURE_DEVOPS_TOKEN=prod-azure-token-muito-longo-e-seguro-aaabbbcccdddeeefff
GEMINI_API_KEY=prod-gemini-AIzaSyDaGmWKa4JsXGK5D3_HFbIabc123def456ghi789jkl
```

### Docker/Container
```bash
# docker-compose.yml
version: '3.8'
services:
  app:
    image: redimento-code-generator
    environment:
      - API_KEY=${API_KEY}
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
      - AZURE_DEVOPS_TOKEN=${AZURE_DEVOPS_TOKEN}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    env_file:
      - .env.production
```

### Kubernetes
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: redimento-secrets
type: Opaque
data:
  API_KEY: <base64-encoded-api-key>
  WEBHOOK_SECRET: <base64-encoded-webhook-secret>
  AZURE_DEVOPS_TOKEN: <base64-encoded-azure-token>
  GEMINI_API_KEY: <base64-encoded-gemini-key>
```

## 🛡️ Boas Práticas

### 1. Força das chaves

#### ✅ Chaves fortes
```bash
# Longas e aleatórias (32+ caracteres)
API_KEY=f4e5d6c7b8a9102938475665748392019283746556473829abc123def456ghi789

# Com caracteres especiais
API_KEY=Kj8#mN2$pQ9@rT5%vW3&xZ7!aB4^cD6*eF1+gH0-iL9=jM8

# UUIDs
API_KEY=550e8400-e29b-41d4-a716-446655440000
```

#### ❌ Chaves fracas (evitar)
```bash
# Muito simples
API_KEY=123456
API_KEY=admin
API_KEY=password

# Previsíveis
API_KEY=redimento123
API_KEY=empresa2024
```

### 2. Armazenamento seguro

#### ✅ Correto
```bash
# Em variáveis de ambiente
export API_KEY="sua-chave-secreta"

# Em arquivo .env (não commitado)
echo "API_KEY=sua-chave" >> .env

# Em cofres de segurança (produção)
# Azure Key Vault, AWS Secrets Manager, etc.
```

#### ❌ Incorreto (nunca fazer)
```javascript
// Hardcoded no código
const API_KEY = "minha-chave-secreta"; // NUNCA!

// Em arquivos commitados
// config.json com chaves // NUNCA!

// Em logs ou console
console.log("API_KEY:", process.env.API_KEY); // NUNCA!
```

### 3. Diferentes chaves por ambiente

```bash
# Desenvolvimento
API_KEY=dev-key-abc123

# Teste
API_KEY=test-key-def456

# Homologação
API_KEY=staging-key-ghi789

# Produção
API_KEY=prod-key-jkl012-super-secreta-2024
```

### 4. Princípio do menor privilégio

```bash
# Chaves específicas para cada função
ADMIN_API_KEY=chave-para-admin-endpoints
MONITORING_API_KEY=chave-para-metricas-apenas
READONLY_API_KEY=chave-para-leitura-apenas
```

## 🔄 Rotação de Chaves

### Cronograma recomendado

| Tipo de chave | Frequência | Motivo |
|---------------|------------|--------|
| **API_KEY** | 6 meses | Segurança preventiva |
| **WEBHOOK_SECRET** | 1 ano | Baixo risco de exposição |
| **AZURE_DEVOPS_TOKEN** | 90 dias | Política da empresa |
| **GEMINI_API_KEY** | 1 ano | Política do Google |

### Processo de rotação

#### 1. Preparação
```bash
# Gerar nova chave
NEW_API_KEY=$(openssl rand -hex 32)

# Documentar mudança
echo "$(date): Rotacionando API_KEY" >> security-log.txt
```

#### 2. Implementação gradual
```bash
# Suportar ambas as chaves temporariamente
OLD_API_KEY=chave-antiga
NEW_API_KEY=chave-nova

# Atualizar sistemas gradualmente
# Monitorar uso da chave antiga
```

#### 3. Finalização
```bash
# Remover chave antiga após período de transição
unset OLD_API_KEY

# Confirmar que apenas nova chave está em uso
grep -r "chave-antiga" /var/log/app/
```

### Script de rotação automática

```bash
#!/bin/bash
# rotate-keys.sh

LOG_FILE="/var/log/redimento/key-rotation.log"
BACKUP_DIR="/var/backups/redimento/keys"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" | tee -a "$LOG_FILE"
}

rotate_api_key() {
    log "Starting API_KEY rotation"
    
    # Backup da chave atual
    mkdir -p "$BACKUP_DIR"
    echo "OLD_API_KEY=$API_KEY" > "$BACKUP_DIR/api-key-$(date +%Y%m%d).backup"
    
    # Gerar nova chave
    NEW_API_KEY=$(openssl rand -hex 32)
    
    # Atualizar arquivo .env
    sed -i "s/API_KEY=.*/API_KEY=$NEW_API_KEY/" .env.production
    
    # Reiniciar serviço
    systemctl restart redimento-code-generator
    
    # Verificar se serviço subiu
    sleep 10
    if systemctl is-active --quiet redimento-code-generator; then
        log "API_KEY rotation completed successfully"
        log "New API_KEY: ${NEW_API_KEY:0:8}..."
    else
        log "ERROR: Service failed to start after key rotation"
        # Rollback
        sed -i "s/API_KEY=.*/API_KEY=$API_KEY/" .env.production
        systemctl restart redimento-code-generator
        log "Rolled back to previous API_KEY"
    fi
}

# Executar rotação
rotate_api_key
```

## 📊 Monitoramento de Segurança

### Métricas de segurança

```typescript
export class SecurityMetrics {
  private readonly unauthorizedAttempts = new promClient.Counter({
    name: 'security_unauthorized_attempts_total',
    help: 'Total number of unauthorized access attempts',
    labelNames: ['endpoint', 'ip', 'user_agent']
  });
  
  private readonly apiKeyUsage = new promClient.Counter({
    name: 'security_api_key_usage_total',
    help: 'Total number of API key usages',
    labelNames: ['key_type', 'endpoint']
  });
  
  recordUnauthorizedAttempt(endpoint: string, ip: string, userAgent: string): void {
    this.unauthorizedAttempts.inc({ endpoint, ip, user_agent: userAgent });
    
    // Log detalhado
    this.logger.warn('Unauthorized access attempt', {
      endpoint,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  }
  
  recordApiKeyUsage(keyType: string, endpoint: string): void {
    this.apiKeyUsage.inc({ key_type: keyType, endpoint });
  }
}
```

### Alertas de segurança

```typescript
export class SecurityAlerts {
  async checkSecurityThreats(): Promise<void> {
    // Verificar tentativas de acesso não autorizado
    const unauthorizedAttempts = await this.getUnauthorizedAttempts(
      Date.now() - 3600000 // última hora
    );
    
    if (unauthorizedAttempts > 10) {
      await this.sendSecurityAlert('HIGH_UNAUTHORIZED_ATTEMPTS', {
        count: unauthorizedAttempts,
        timeframe: '1 hour',
        action: 'Consider blocking suspicious IPs'
      });
    }
    
    // Verificar uso anômalo de API keys
    const apiKeyUsage = await this.getApiKeyUsage();
    const anomalies = this.detectUsageAnomalies(apiKeyUsage);
    
    if (anomalies.length > 0) {
      await this.sendSecurityAlert('API_KEY_ANOMALY', {
        anomalies,
        action: 'Review API key usage patterns'
      });
    }
  }
}
```

### Dashboard de segurança

```bash
# Endpoint para métricas de segurança
GET /admin/security/metrics

# Resposta
{
  "timestamp": "2024-01-30T10:00:00.000Z",
  "security": {
    "unauthorizedAttempts": {
      "lastHour": 2,
      "lastDay": 15,
      "lastWeek": 89
    },
    "apiKeyUsage": {
      "admin": 45,
      "monitoring": 234,
      "readonly": 12
    },
    "keyRotation": {
      "lastRotation": "2024-01-15T10:00:00.000Z",
      "nextScheduled": "2024-07-15T10:00:00.000Z"
    },
    "threats": {
      "blockedIPs": ["192.168.1.100", "10.0.0.50"],
      "suspiciousActivity": false
    }
  }
}
```

## 🔍 Troubleshooting

### Problemas comuns

#### 1. API_KEY não funciona

**Sintoma:**
```
Error: 401 Unauthorized - API key required
```

**Diagnóstico:**
```bash
# Verificar se API_KEY está definida
echo "API_KEY: $API_KEY"

# Verificar se não há espaços ou caracteres especiais
echo "$API_KEY" | wc -c

# Testar com curl
curl -v -H "Authorization: Bearer $API_KEY" http://localhost:3000/admin/status
```

**Soluções:**
```bash
# 1. Verificar se variável está definida no .env
grep "API_KEY" .env

# 2. Verificar se não há espaços extras
API_KEY=chave-sem-espacos-extras

# 3. Regenerar chave se necessário
API_KEY=$(openssl rand -hex 32)

# 4. Reiniciar aplicação
npm restart
```

#### 2. Chave muito fraca

**Sintoma:**
```
Warning: API key appears to be weak
```

**Soluções:**
```bash
# Gerar chave forte
API_KEY=$(openssl rand -hex 32)

# Ou com caracteres especiais
API_KEY=$(openssl rand -base64 32)

# Verificar força da chave
echo "$API_KEY" | wc -c  # Deve ter 32+ caracteres
```

#### 3. Chave exposta em logs

**Sintoma:**
```
API key found in application logs
```

**Ações imediatas:**
```bash
# 1. Rotacionar chave imediatamente
NEW_API_KEY=$(openssl rand -hex 32)

# 2. Limpar logs
> /var/log/redimento/app.log

# 3. Verificar código para vazamentos
grep -r "API_KEY" src/ --exclude-dir=node_modules

# 4. Atualizar .gitignore
echo ".env*" >> .gitignore
echo "*.log" >> .gitignore
```

### Comandos de diagnóstico

```bash
# Verificar todas as variáveis de segurança
env | grep -E "(API_KEY|WEBHOOK_SECRET|AZURE_DEVOPS_TOKEN|GEMINI_API_KEY)"

# Testar endpoints administrativos
curl -H "Authorization: Bearer $API_KEY" http://localhost:3000/admin/status

# Verificar logs de segurança
grep -i "unauthorized\|security\|auth" logs/app.log | tail -20

# Verificar tentativas de acesso não autorizado
grep "401\|403" logs/access.log | tail -10

# Testar força das chaves
echo "$API_KEY" | wc -c
echo "$WEBHOOK_SECRET" | wc -c
```

### Script de validação de segurança

```bash
#!/bin/bash
# security-check.sh

echo "=== Validação de Configuração de Segurança ==="

# Verificar API_KEY
if [ -z "$API_KEY" ]; then
    echo "❌ API_KEY não está definida"
    exit 1
else
    KEY_LENGTH=${#API_KEY}
    if [ $KEY_LENGTH -lt 32 ]; then
        echo "⚠️  API_KEY muito curta ($KEY_LENGTH chars) - recomendado 32+"
    else
        echo "✅ API_KEY definida e forte ($KEY_LENGTH chars)"
    fi
fi

# Verificar WEBHOOK_SECRET
if [ -z "$WEBHOOK_SECRET" ]; then
    echo "❌ WEBHOOK_SECRET não está definida"
    exit 1
else
    echo "✅ WEBHOOK_SECRET definida"
fi

# Verificar AZURE_DEVOPS_TOKEN
if [ -z "$AZURE_DEVOPS_TOKEN" ]; then
    echo "❌ AZURE_DEVOPS_TOKEN não está definida"
    exit 1
else
    echo "✅ AZURE_DEVOPS_TOKEN definida"
fi

# Verificar GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ GEMINI_API_KEY não está definida"
    exit 1
else
    echo "✅ GEMINI_API_KEY definida"
fi

# Verificar se .env não está commitado
if git ls-files | grep -q "\.env$"; then
    echo "⚠️  Arquivo .env está sendo rastreado pelo Git - adicione ao .gitignore"
else
    echo "✅ Arquivo .env não está sendo rastreado pelo Git"
fi

# Testar endpoint administrativo
if curl -s -H "Authorization: Bearer $API_KEY" http://localhost:3000/admin/status > /dev/null; then
    echo "✅ Endpoint administrativo acessível com API_KEY"
else
    echo "❌ Falha ao acessar endpoint administrativo"
fi

echo "✅ Validação de segurança concluída!"
```

## 📋 Checklist de segurança

### Configuração inicial
- [ ] `API_KEY` gerada e definida (32+ caracteres)
- [ ] `WEBHOOK_SECRET` gerada e definida
- [ ] `AZURE_DEVOPS_TOKEN` obtida e configurada
- [ ] `GEMINI_API_KEY` obtida e configurada
- [ ] Arquivo `.env` não está sendo rastreado pelo Git
- [ ] Diferentes chaves para cada ambiente

### Testes de segurança
- [ ] Endpoints administrativos acessíveis com API_KEY
- [ ] Endpoints administrativos bloqueados sem API_KEY
- [ ] Webhooks validados com WEBHOOK_SECRET
- [ ] Integração com Azure DevOps funcionando
- [ ] Integração com Gemini API funcionando

### Monitoramento
- [ ] Logs de segurança configurados
- [ ] Alertas de tentativas não autorizadas
- [ ] Métricas de uso de API keys
- [ ] Dashboard de segurança ativo

### Manutenção
- [ ] Cronograma de rotação de chaves definido
- [ ] Processo de rotação documentado
- [ ] Backup das chaves antigas
- [ ] Plano de resposta a incidentes

---

*Última atualização: Janeiro 2024*
*Versão do documento: 1.0*