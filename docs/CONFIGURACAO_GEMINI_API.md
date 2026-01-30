# Configuração da API do Google Gemini

Este documento explica como obter e configurar a chave da API do Google Gemini para o Redimento Code Generator.

## Índice

- [O que é a Gemini API](#o-que-é-a-gemini-api)
- [Pré-requisitos](#pré-requisitos)
- [Passo a passo para obter a API Key](#passo-a-passo-para-obter-a-api-key)
- [Configuração no sistema](#configuração-no-sistema)
- [Modelos disponíveis](#modelos-disponíveis)
- [Limites e cotas](#limites-e-cotas)
- [Teste da configuração](#teste-da-configuração)
- [Troubleshooting](#troubleshooting)
- [Custos e faturamento](#custos-e-faturamento)

## O que é a Gemini API

A **Gemini API** é o serviço de inteligência artificial do Google que permite integrar modelos de linguagem avançados em aplicações. No Redimento Code Generator, ela é usada para:

- 🤖 **Gerar código** baseado nos requisitos dos work items
- 📝 **Criar documentação** automática para o código gerado
- 🔍 **Analisar e validar** código existente
- 🛠️ **Sugerir melhorias** e correções de código
- 📋 **Gerar testes** unitários e de integração

## Pré-requisitos

Antes de começar, você precisa:

- ✅ **Conta Google** ativa
- ✅ **Projeto no Google Cloud** (pode ser criado gratuitamente)
- ✅ **Cartão de crédito** (para verificação, mesmo no plano gratuito)
- ✅ **Acesso à internet** para configuração

## Passo a passo para obter a API Key

### 1. Acesse o Google AI Studio

Navegue para o Google AI Studio:
```
https://aistudio.google.com/
```

### 2. Faça login com sua conta Google

- Clique em **"Sign in"**
- Use sua conta Google pessoal ou corporativa
- Aceite os termos de uso se solicitado

### 3. Crie ou selecione um projeto

#### Opção A: Criar novo projeto
1. Clique em **"Create new project"**
2. Digite um nome: `Redimento Code Generator`
3. Selecione sua organização (se aplicável)
4. Clique em **"Create"**

#### Opção B: Usar projeto existente
1. Clique no seletor de projetos (canto superior)
2. Selecione um projeto existente do Google Cloud
3. Confirme a seleção

### 4. Ativar a Gemini API

1. No painel do AI Studio, clique em **"Get API key"**
2. Se for a primeira vez, clique em **"Enable Gemini API"**
3. Aguarde alguns segundos para ativação

### 5. Gerar a API Key

1. Clique em **"Create API key"**
2. Selecione o projeto onde deseja criar a chave
3. Clique em **"Create API key in new project"** ou use projeto existente
4. **Copie a chave gerada** (será exibida apenas uma vez)

```
Exemplo de API Key:
AIzaSyDaGmWKa4JsXGK5D3_HFbIabc123def456ghi789jkl
```

### 6. Configurar restrições (Recomendado)

Para maior segurança:

1. Clique em **"Restrict key"** (opcional mas recomendado)
2. **Application restrictions**:
   - Selecione **"IP addresses"**
   - Adicione o IP do seu servidor
3. **API restrictions**:
   - Selecione **"Restrict key"**
   - Escolha **"Generative Language API"**
4. Clique em **"Save"**

## Configuração no sistema

### Arquivo .env

Adicione a chave no seu arquivo `.env`:

```bash
# ===========================================
# CONFIGURAÇÃO DO GOOGLE GEMINI
# ===========================================

# API Key obtida no Google AI Studio
GEMINI_API_KEY=AIzaSyDaGmWKa4JsXGK5D3_HFbIabc123def456ghi789jkl

# Modelo a ser usado (recomendado: gemini-pro)
GEMINI_MODEL=gemini-pro

# Configurações opcionais de geração
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=2048
GEMINI_TOP_P=0.8
GEMINI_TOP_K=40
```

### Variáveis de configuração

| Variável | Descrição | Valor Padrão | Obrigatória |
|----------|-----------|--------------|-------------|
| `GEMINI_API_KEY` | Chave da API do Gemini | - | ✅ Sim |
| `GEMINI_MODEL` | Modelo a ser usado | `gemini-pro` | ❌ Não |
| `GEMINI_TEMPERATURE` | Criatividade (0.0-1.0) | `0.7` | ❌ Não |
| `GEMINI_MAX_TOKENS` | Máximo de tokens por resposta | `2048` | ❌ Não |
| `GEMINI_TOP_P` | Diversidade de resposta | `0.8` | ❌ Não |
| `GEMINI_TOP_K` | Número de tokens candidatos | `40` | ❌ Não |

## Modelos disponíveis

### Gemini Pro (Recomendado)

```bash
GEMINI_MODEL=gemini-pro
```

**Características:**
- ✅ **Melhor para código** - Otimizado para tarefas de programação
- ✅ **Contexto grande** - Suporta até 30.720 tokens de entrada
- ✅ **Multilíngue** - Suporte a múltiplas linguagens de programação
- ✅ **Rápido** - Baixa latência para geração
- ✅ **Custo-benefício** - Preço competitivo

**Casos de uso:**
- Geração de código TypeScript/JavaScript
- Criação de testes unitários
- Documentação de APIs
- Refatoração de código

### Gemini Pro Vision (Para futuras funcionalidades)

```bash
GEMINI_MODEL=gemini-pro-vision
```

**Características:**
- 🖼️ **Análise de imagens** - Pode processar diagramas e mockups
- 📊 **Interpretação visual** - Entende fluxogramas e wireframes
- 🎨 **Geração baseada em UI** - Código a partir de designs

## Limites e cotas

### Plano gratuito

| Recurso | Limite Gratuito |
|---------|-----------------|
| **Requisições por minuto** | 60 RPM |
| **Tokens por minuto** | 32.000 TPM |
| **Requisições por dia** | 1.500 RPD |
| **Custo** | $0 (gratuito) |

### Plano pago

| Recurso | Limite Pago |
|---------|-------------|
| **Requisições por minuto** | Configurável |
| **Tokens por minuto** | Configurável |
| **Requisições por dia** | Ilimitado |
| **Custo** | $0.50 / 1M tokens de entrada<br/>$1.50 / 1M tokens de saída |

### Monitoramento de uso

Acompanhe o uso em:
```
https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
```

## Teste da configuração

### 1. Teste básico via curl

```bash
curl -H "Content-Type: application/json" \
     -d '{
       "contents": [{
         "parts": [{
           "text": "Escreva uma função JavaScript que soma dois números"
         }]
       }]
     }' \
     -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=SUA_API_KEY"
```

### 2. Teste no sistema

Inicie o sistema e verifique os logs:

```bash
npm start
```

Logs esperados:
```
[INFO] Gemini API connection validated successfully
[INFO] Using model: gemini-pro
[INFO] API key configured and working
```

### 3. Teste de geração de código

Crie um work item no Azure DevOps e verifique se o código é gerado corretamente.

## Troubleshooting

### Problemas comuns

#### 1. API Key inválida
```
Error: 400 API_KEY_INVALID
```

**Soluções:**
- Verifique se copiou a chave completa
- Confirme se a API está ativada no projeto
- Regenere a chave se necessário

#### 2. Cota excedida
```
Error: 429 QUOTA_EXCEEDED
```

**Soluções:**
- Aguarde o reset da cota (geralmente 1 minuto)
- Implemente rate limiting no código
- Considere upgrade para plano pago

#### 3. Modelo não encontrado
```
Error: 404 MODEL_NOT_FOUND
```

**Soluções:**
- Verifique se o nome do modelo está correto
- Use `gemini-pro` como padrão
- Confirme se o modelo está disponível na sua região

#### 4. Região não suportada
```
Error: 403 LOCATION_NOT_SUPPORTED
```

**Soluções:**
- Use VPN para região suportada (temporário)
- Aguarde disponibilidade na sua região
- Configure proxy se necessário

### Comandos de diagnóstico

```bash
# Testar conectividade básica
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"

# Verificar modelos disponíveis
curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro?key=$GEMINI_API_KEY"

# Testar geração simples
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$GEMINI_API_KEY"
```

## Custos e faturamento

### Estimativa de custos

Para um projeto típico com 100 work items por mês:

| Cenário | Tokens/Work Item | Custo Mensal Estimado |
|---------|------------------|----------------------|
| **Pequeno** | ~1.000 tokens | $0.20 |
| **Médio** | ~5.000 tokens | $1.00 |
| **Grande** | ~10.000 tokens | $2.00 |

### Otimização de custos

1. **Use prompts eficientes** - Seja específico e conciso
2. **Cache resultados** - Evite regenerar código similar
3. **Monitore uso** - Acompanhe métricas regularmente
4. **Configure limites** - Defina cotas máximas de segurança

### Configuração de alertas

No Google Cloud Console:

1. Acesse **Billing** → **Budgets & alerts**
2. Crie um orçamento mensal (ex: $10)
3. Configure alertas em 50%, 80% e 100%
4. Adicione e-mails para notificações

## Alternativas e fallbacks

### Caso a Gemini API não esteja disponível

1. **OpenAI GPT-4** - Alternativa premium
2. **Anthropic Claude** - Boa para código
3. **Cohere** - Opção empresarial
4. **Templates estáticos** - Fallback sem IA

### Configuração de fallback

```bash
# Configuração com fallback
GEMINI_API_KEY=sua-chave-gemini
OPENAI_API_KEY=sua-chave-openai-fallback
ENABLE_AI_FALLBACK=true
```

---

## Segurança e boas práticas

### 🔒 Segurança da API Key

1. **Nunca commite** a chave no código
2. **Use variáveis de ambiente** sempre
3. **Restrinja por IP** quando possível
4. **Monitore uso** para detectar abusos
5. **Regenere periodicamente** (a cada 6 meses)

### 📋 Checklist de configuração

- [ ] Conta Google criada/configurada
- [ ] Projeto no Google Cloud criado
- [ ] Gemini API ativada
- [ ] API Key gerada e copiada
- [ ] Restrições de segurança configuradas
- [ ] Variável GEMINI_API_KEY definida no .env
- [ ] Teste de conectividade realizado
- [ ] Monitoramento de cotas configurado
- [ ] Alertas de faturamento ativados

---

*Última atualização: Janeiro 2024*
*Versão do documento: 1.0*