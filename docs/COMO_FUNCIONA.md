# 🔄 Como o Projeto Funciona

## Visão Geral do Fluxo

O Redimento Code Generator automatiza todo o ciclo de desenvolvimento desde a criação de um work item no Azure DevOps até a criação do Pull Request com código gerado por IA.

## Fluxo Principal (Passo a Passo)

### 1. Recebimento do Webhook
**Azure DevOps → Webhook → Aplicação**

- Quando um work item é criado/atualizado no Azure DevOps
- Azure DevOps envia um webhook para a aplicação
- Aplicação responde imediatamente (< 200ms) e processa assincronamente

### 2. Processamento Assíncrono
**Webhook → Fila → Processamento em Background**

- Work item é colocado em fila para processamento
- Evita timeout do webhook (Azure DevOps tem limite de 30s)
- Permite processar múltiplos work items simultaneamente

### 3. Enriquecimento de Dados
**ID do Work Item → Azure DevOps API → Dados Completos**

- Busca detalhes completos do work item (título, descrição, critérios de aceite)
- Determina o repositório de destino baseado no projeto
- Coleta contexto técnico necessário

### 4. Geração de Código com IA
**Work Item + Contexto → Gemini AI → Código Gerado**

Constrói prompt estruturado com:
- Detalhes do work item
- Padrões de código do projeto
- Templates disponíveis
- Critérios de aceite

Gemini AI gera:
- Código TypeScript/JavaScript
- Testes unitários
- Documentação

### 5. Operações Git Automáticas
**Código Gerado → Git → Branch + Commit**

- Cria branch seguindo padrão: `feat/{id}_{nome}`
- Aplica mudanças nos arquivos
- Faz commit com mensagem padronizada
- Push para repositório remoto

### 6. Criação do Pull Request
**Branch → Azure DevOps → Pull Request**

- Cria PR automaticamente
- Adiciona descrição baseada no work item
- Define reviewers padrão
- Vincula ao work item original

## Arquitetura Técnica

### Componentes Principais

| Componente | Responsabilidade |
|------------|------------------|
| **WebhookController** | Recebe webhooks do Azure DevOps |
| **WorkItemService** | Orquestra todo o processo |
| **GeminiService** | Integração com IA para geração de código |
| **GitService** | Operações Git (branch, commit, push) |
| **AzureDevOpsService** | Integração com Azure DevOps API |

### Tecnologias

- **Backend**: Node.js + TypeScript + Express.js
- **IA**: Google Gemini API
- **Git**: simple-git library
- **Cache**: Redis (para otimização)
- **Testes**: Jest + Property-Based Testing

## Exemplo Prático

### Cenário: Desenvolvedor cria work item "Implementar login de usuário"

1. **Azure DevOps** → Envia webhook para aplicação
2. **Aplicação** → Processa work item assincronamente
3. **Gemini AI** → Gera:
   - Componente React de login
   - Serviço de autenticação
   - Testes unitários
   - Documentação
4. **Git** → Cria branch `feat/123_implementar-login-usuario`
5. **Azure DevOps** → Cria PR automaticamente

## Benefícios

- ⚡ **Velocidade**: Reduz tempo de desenvolvimento inicial
- 🤖 **Automação**: Elimina tarefas manuais repetitivas
- 📋 **Padronização**: Código segue padrões estabelecidos
- 🔄 **Integração**: Fluxo completo integrado com Azure DevOps
- ✅ **Qualidade**: Inclui testes e documentação automaticamente

## Configuração Necessária

Para funcionar, precisa de:

- ✅ Token do Azure DevOps (com permissões de work items, código e PRs)
- ✅ Chave da API do Gemini
- ✅ Configuração de webhooks no Azure DevOps
- ✅ Repositórios Git configurados

## Monitoramento e Observabilidade

O projeto está projetado para ser:
- **Escalável**: Suporta múltiplos work items simultâneos
- **Seguro**: Validação de tokens e sanitização de dados
- **Monitorável**: Métricas detalhadas e logs estruturados
- **Robusto**: Tratamento de erros e retry automático

---

*Esta documentação descreve o funcionamento completo do Redimento Code Generator, desde o recebimento do webhook até a criação do Pull Request automatizado.*