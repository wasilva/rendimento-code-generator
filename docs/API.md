# Documentação da API - Redimento Code Generator

Esta documentação descreve todos os endpoints da API REST do Redimento Code Generator.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Webhook](#webhook)
  - [Administração](#administração)
- [Modelos de Dados](#modelos-de-dados)
- [Códigos de Erro](#códigos-de-erro)
- [Exemplos de Uso](#exemplos-de-uso)

## 🌐 Visão Geral

### Base URL
```
http://localhost:3000
```

### Formato de Resposta
Todas as respostas são em formato JSON:

```json
{
  "success": true,
  "data": {},
  "message": "Operação realizada com sucesso",
  "timestamp": "2024-01-30T10:00:00.000Z"
}
```

### Headers Padrão
```http
Content-Type: application/json
Accept: application/json
```

## 🔐 Autenticação

### Webhook Authentication
Os webhooks do Azure DevOps são autenticados via HMAC-SHA256:

```http
X-Hub-Signature-256: sha256=<hash>
```

### API Key Authentication
Endpoints administrativos requerem API Key:

```http
Authorization: Bearer <API_KEY>
```

## 🛠️ Endpoints

### Health Check

#### GET /health
Verifica o status do sistema e suas dependências.

**Parâmetros:** Nenhum

**Resposta de Sucesso (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-30T10:00:00.000Z",
  "uptime": 3600,
  "services": {
    "azureDevOps": "connected",
    "geminiAI": "connected",
    "git": "ready",
    "database": "connected"
  },
  "version": "1.0.0",
  "environment": "production"
}
```

**Resposta de Erro (503):**
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-30T10:00:00.000Z",
  "services": {
    "azureDevOps": "error",
    "geminiAI": "connected",
    "git": "ready"
  },
  "errors": [
    {
      "service": "azureDevOps",
      "error": "Connection timeout",
      "details": "Unable to connect to Azure DevOps API"
    }
  ]
}
```

#### GET /health/detailed
Informações detalhadas de saúde do sistema.

**Autenticação:** API Key obrigatória

**Resposta (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-30T10:00:00.000Z",
  "system": {
    "nodeVersion": "18.17.0",
    "platform": "linux",
    "memory": {
      "used": "45.2 MB",
      "total": "512 MB",
      "percentage": 8.8
    },
    "cpu": {
      "usage": "12.5%",
      "loadAverage": [0.1, 0.2, 0.15]
    }
  },
  "services": {
    "azureDevOps": {
      "status": "connected",
      "responseTime": "120ms",
      "lastCheck": "2024-01-30T09:59:45.000Z"
    },
    "geminiAI": {
      "status": "connected",
      "responseTime": "250ms",
      "quotaUsed": "15%",
      "lastCheck": "2024-01-30T09:59:50.000Z"
    }
  },
  "metrics": {
    "webhooksReceived": 1250,
    "workItemsProcessed": 1180,
    "branchesCreated": 1150,
    "pullRequestsCreated": 1120,
    "errorsLast24h": 5
  }
}
```

### Webhook

#### POST /webhook/workitem
Recebe webhooks do Azure DevOps para processamento de work items.

**Autenticação:** HMAC-SHA256 signature

**Headers Obrigatórios:**
```http
Content-Type: application/json
X-Hub-Signature-256: sha256=<signature>
User-Agent: Azure DevOps Services
```

**Corpo da Requisição:**
```json
{
  "eventType": "workitem.updated",
  "publisherId": "tfs",
  "scope": "all",
  "message": {
    "text": "Work item #1234 updated",
    "html": "<p>Work item #1234 updated</p>",
    "markdown": "Work item #1234 updated"
  },
  "detailedMessage": {
    "text": "User Story #1234 'Implement user login' was updated by John Doe",
    "html": "<p>User Story #1234 'Implement user login' was updated by John Doe</p>",
    "markdown": "User Story #1234 'Implement user login' was updated by John Doe"
  },
  "resource": {
    "id": 1234,
    "workItemType": "User Story",
    "url": "https://dev.azure.com/org/project/_apis/wit/workItems/1234",
    "fields": {
      "System.Id": 1234,
      "System.Title": "Implement user login",
      "System.State": "Active",
      "System.AssignedTo": "john.doe@company.com",
      "System.AreaPath": "Project\\Frontend",
      "System.Description": "As a user, I want to login to access the system",
      "Microsoft.VSTS.Common.AcceptanceCriteria": "Given valid credentials, when user logs in, then access is granted"
    }
  },
  "resourceVersion": "1.0",
  "resourceContainers": {
    "collection": {
      "id": "12345678-1234-1234-1234-123456789012",
      "baseUrl": "https://dev.azure.com/organization/"
    },
    "account": {
      "id": "87654321-4321-4321-4321-210987654321",
      "baseUrl": "https://dev.azure.com/organization/"
    },
    "project": {
      "id": "abcdef12-3456-7890-abcd-ef1234567890",
      "name": "MyProject",
      "baseUrl": "https://dev.azure.com/organization/"
    }
  },
  "createdDate": "2024-01-30T10:00:00.000Z"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Webhook processado com sucesso",
  "data": {
    "workItemId": 1234,
    "processingId": "proc_abc123def456",
    "status": "queued",
    "estimatedProcessingTime": "2-5 minutes"
  },
  "timestamp": "2024-01-30T10:00:00.000Z"
}
```

**Resposta de Erro (400):**
```json
{
  "success": false,
  "error": "INVALID_PAYLOAD",
  "message": "Payload do webhook inválido",
  "details": {
    "missingFields": ["resource.id", "eventType"],
    "invalidFields": ["resource.fields"]
  },
  "timestamp": "2024-01-30T10:00:00.000Z"
}
```

**Resposta de Erro (401):**
```json
{
  "success": false,
  "error": "INVALID_SIGNATURE",
  "message": "Assinatura do webhook inválida",
  "timestamp": "2024-01-30T10:00:00.000Z"
}
```

### Administração

#### GET /admin/status
Status detalhado do sistema para administradores.

**Autenticação:** API Key obrigatória

**Resposta (200):**
```json
{
  "system": {
    "status": "running",
    "uptime": "2d 14h 32m",
    "version": "1.0.0",
    "environment": "production",
    "lastRestart": "2024-01-28T20:00:00.000Z"
  },
  "processing": {
    "queueSize": 3,
    "activeJobs": 2,
    "completedToday": 45,
    "failedToday": 2,
    "averageProcessingTime": "3.2 minutes"
  },
  "resources": {
    "memoryUsage": "45.2 MB / 512 MB",
    "cpuUsage": "12.5%",
    "diskUsage": "2.1 GB / 10 GB"
  }
}
```

#### POST /admin/retry/{processingId}
Reprocessa um work item que falhou.

**Autenticação:** API Key obrigatória

**Parâmetros de URL:**
- `processingId` (string): ID do processamento que falhou

**Resposta (200):**
```json
{
  "success": true,
  "message": "Reprocessamento iniciado",
  "data": {
    "processingId": "proc_abc123def456",
    "originalWorkItemId": 1234,
    "retryAttempt": 2,
    "status": "queued"
  }
}
```

#### GET /admin/logs
Recupera logs recentes do sistema.

**Autenticação:** API Key obrigatória

**Parâmetros de Query:**
- `level` (string, opcional): Nível do log (error, warn, info, debug)
- `limit` (number, opcional): Número máximo de logs (padrão: 100)
- `since` (string, opcional): Data/hora ISO para filtrar logs

**Exemplo:**
```
GET /admin/logs?level=error&limit=50&since=2024-01-30T00:00:00.000Z
```

**Resposta (200):**
```json
{
  "logs": [
    {
      "timestamp": "2024-01-30T10:00:00.000Z",
      "level": "error",
      "message": "Failed to process work item 1234",
      "metadata": {
        "workItemId": 1234,
        "error": "Azure DevOps API timeout",
        "processingId": "proc_abc123def456"
      }
    },
    {
      "timestamp": "2024-01-30T09:55:00.000Z",
      "level": "info",
      "message": "Work item 1233 processed successfully",
      "metadata": {
        "workItemId": 1233,
        "branchCreated": "feat/1233_user-profile-page",
        "processingTime": "2.1 minutes"
      }
    }
  ],
  "total": 2,
  "hasMore": false
}
```

## 📊 Modelos de Dados

### Work Item
```typescript
interface WorkItem {
  id: number;
  type: 'User Story' | 'Task' | 'Bug' | 'Feature' | 'Epic';
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  reproductionSteps?: string;
  assignedTo?: string;
  areaPath: string;
  iterationPath: string;
  state: string;
  priority: number;
  tags: string[];
  customFields: Record<string, any>;
}
```

### Processing Result
```typescript
interface ProcessingResult {
  processingId: string;
  workItemId: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  branchName?: string;
  pullRequestId?: number;
  generatedFiles: string[];
  errors?: ProcessingError[];
}
```

### Processing Error
```typescript
interface ProcessingError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  retryable: boolean;
}
```

## ❌ Códigos de Erro

### Códigos HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 403 | Proibido |
| 404 | Não encontrado |
| 429 | Muitas requisições |
| 500 | Erro interno do servidor |
| 503 | Serviço indisponível |

### Códigos de Erro Específicos

| Código | Descrição | Retryable |
|--------|-----------|-----------|
| `INVALID_PAYLOAD` | Payload do webhook inválido | Não |
| `INVALID_SIGNATURE` | Assinatura HMAC inválida | Não |
| `WORK_ITEM_NOT_FOUND` | Work item não encontrado | Não |
| `AZURE_DEVOPS_API_ERROR` | Erro na API do Azure DevOps | Sim |
| `GEMINI_API_ERROR` | Erro na API do Gemini | Sim |
| `GIT_OPERATION_ERROR` | Erro em operação Git | Sim |
| `INSUFFICIENT_DATA` | Dados insuficientes no work item | Não |
| `QUOTA_EXCEEDED` | Cota da API excedida | Sim |
| `RATE_LIMIT_EXCEEDED` | Limite de taxa excedido | Sim |

## 🔧 Exemplos de Uso

### Configurar Webhook no Azure DevOps

1. **Acesse Project Settings** → **Service Hooks**
2. **Crie nova subscription:**
   - Service: Web Hooks
   - Event: Work item updated
   - URL: `https://seu-servidor.com/webhook/workitem`
   - Secret: Sua chave secreta configurada

### Testar Webhook Localmente

```bash
# Usando curl
curl -X POST http://localhost:3000/webhook/workitem \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$(echo -n '{"test":"data"}' | openssl dgst -sha256 -hmac 'seu-webhook-secret' -binary | base64)" \
  -d '{"eventType":"workitem.updated","resource":{"id":1234}}'
```

### Monitorar Status do Sistema

```bash
# Health check básico
curl http://localhost:3000/health

# Status detalhado (requer API key)
curl -H "Authorization: Bearer sua-api-key" \
  http://localhost:3000/health/detailed
```

### Verificar Logs de Erro

```bash
# Logs de erro das últimas 24 horas
curl -H "Authorization: Bearer sua-api-key" \
  "http://localhost:3000/admin/logs?level=error&since=$(date -d '24 hours ago' -Iseconds)"
```

### Reprocessar Work Item Falhado

```bash
# Reprocessar um work item específico
curl -X POST \
  -H "Authorization: Bearer sua-api-key" \
  http://localhost:3000/admin/retry/proc_abc123def456
```

## 📝 Notas Importantes

### Rate Limiting
- Webhooks: 100 requisições por minuto por IP
- Admin endpoints: 60 requisições por minuto por API key

### Timeouts
- Webhook processing: 30 segundos
- Admin endpoints: 10 segundos
- Health checks: 5 segundos

### Retenção de Dados
- Logs: 30 dias
- Processing results: 90 dias
- Métricas: 1 ano

### Segurança
- Todos os endpoints usam HTTPS em produção
- Webhooks validados via HMAC-SHA256
- API keys com rotação automática recomendada
- Rate limiting por IP e API key

---

*Última atualização: Janeiro 2024*
*Versão da API: 1.0*