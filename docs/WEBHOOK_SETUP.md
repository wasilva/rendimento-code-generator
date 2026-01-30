# Guia de Configuração do Webhook Azure DevOps

## 📡 Configurando Webhook no Azure DevOps

### Pré-requisitos
- ✅ Conexão com Azure DevOps funcionando (verificado)
- ✅ Servidor da aplicação rodando (http://localhost:3003)
- ✅ Projeto "Rendimento" identificado no Azure DevOps

### Passo a Passo Detalhado

#### 1. Acesse o Azure DevOps
1. Vá para: https://dev.azure.com/qacoders-madeinweb/Rendimento
2. Faça login com suas credenciais

#### 2. Navegue para Service Hooks
1. No projeto "Rendimento", clique no ícone de **⚙️ Project Settings** (canto inferior esquerdo)
2. No menu lateral esquerdo, procure por **"Service hooks"** na seção "General"
3. Clique em **"Service hooks"**

#### 3. Criar Nova Subscription
1. Clique no botão **"+ Create subscription"**
2. Você verá uma lista de serviços disponíveis

#### 4. Configurar o Webhook

**Passo 1 - Selecionar Serviço:**
- Na lista de serviços, selecione **"Web Hooks"**
- Clique em **"Next"**

**Passo 2 - Configurar Evento:**
- **Event type**: Selecione **"Work item created"**
- **Filters** (opcional, mas recomendado):
  - **Work item type**: Deixe em branco para todos os tipos OU selecione "Task", "Bug", "User Story"
  - **Area path**: Deixe em branco para todas as áreas
  - **Changed by**: Deixe em branco
- Clique em **"Next"**

**Passo 3 - Configurar Ação:**
- **URL**: `http://localhost:3003/webhook/workitem`
  - ⚠️ **IMPORTANTE**: Para desenvolvimento local, use localhost na porta 3003
  - 🌐 **Para produção**: Substitua por sua URL pública (ex: `https://seu-dominio.com/webhook/workitem`)
- **HTTP headers**: Deixe em branco (por enquanto)
- **Resource details to send**: Selecione **"All"**
- **Messages to send**: Selecione **"All"**
- **Detailed messages to send**: Selecione **"All"**

#### 5. Testar a Configuração
1. **ANTES de finalizar**, clique em **"Test"** para enviar um webhook de teste
2. Verifique os logs do seu servidor local - você deve ver algo como:
   ```
   📨 Webhook received from Azure DevOps
   Method: POST /webhook/workitem
   ```
3. Se o teste for bem-sucedido, clique em **"Finish"**

### 🧪 Verificando se Funcionou

#### Método 1: Verificar Logs do Servidor
1. Certifique-se que o servidor está rodando:
   ```bash
   npm run dev
   ```
2. Observe os logs no terminal

#### Método 2: Criar Work Item de Teste
1. No Azure DevOps, vá para **"Boards" > "Work items"**
2. Clique em **"+ New Work Item"**
3. Selecione **"Task"** ou **"User Story"**
4. Preencha:
   - **Title**: "Teste de Webhook - Geração de Código"
   - **Description**: "Este é um teste para verificar se o webhook está funcionando"
5. Clique em **"Save"**
6. Verifique os logs do servidor para confirmar recebimento

### 🔧 Configurações Avançadas (Opcional)

#### Filtros Recomendados para Produção
Para evitar spam de webhooks, configure filtros mais específicos:

- **Work item type**: Apenas "Task", "Bug", "User Story"
- **State**: Apenas "New", "Active" (evita webhooks de itens fechados)
- **Area path**: Específico do seu projeto se necessário

#### Headers de Segurança (Para Produção)
Para produção, adicione headers de autenticação:
```
Authorization: Bearer seu-token-secreto
X-Webhook-Source: AzureDevOps
```

### 🚨 Troubleshooting

#### Problema: Webhook não está sendo recebido
**Soluções:**
1. **Verifique a URL**: Certifique-se que `http://localhost:3003/webhook/workitem` está acessível
2. **Teste o endpoint**: 
   ```bash
   Invoke-WebRequest -Uri "http://localhost:3003/webhook/health" -Method GET -UseBasicParsing
   ```
3. **Verifique se o servidor está rodando**: 
   ```bash
   npm run dev
   ```
4. **Firewall**: Certifique-se que a porta 3000 não está bloqueada

#### Problema: Erro 404 no webhook
**Soluções:**
- Verifique se o endpoint `/webhook` existe no código
- Teste com: `http://localhost:3003/webhook/health`
- Confirme que o servidor está rodando na porta correta (3003)

#### Problema: Erro 500 no webhook
**Soluções:**
- Verifique os logs da aplicação para detalhes do erro
- Teste a conexão com Azure DevOps: `node test-connection.js`
- Verifique as variáveis de ambiente no arquivo `.env`

### 📋 Checklist de Configuração

- [ ] Servidor da aplicação rodando em http://localhost:3003
- [ ] Endpoint `/webhook/health` respondendo corretamente
- [ ] Service hook criado no Azure DevOps
- [ ] URL do webhook configurada: `http://localhost:3003/webhook/workitem`
- [ ] Teste de webhook realizado com sucesso
- [ ] Work item de teste criado
- [ ] Logs confirmando recebimento do webhook
- [ ] Filtros configurados (opcional)

### 🎯 Próximos Passos

Após configurar o webhook com sucesso:

1. **Teste o Fluxo Completo**:
   - Crie um work item no Azure DevOps
   - Verifique se o código é gerado automaticamente
   - Confirme se a branch é criada
   - Verifique se o pull request é criado

2. **Para Produção**:
   - Deploy da aplicação em um servidor público
   - Configurar HTTPS
   - Atualizar URL do webhook no Azure DevOps
   - Configurar headers de segurança

### 🔗 Links Úteis

- [Azure DevOps Service Hooks Documentation](https://docs.microsoft.com/en-us/azure/devops/service-hooks/)
- [Webhook Events Reference](https://docs.microsoft.com/en-us/azure/devops/service-hooks/events)
- [Testing Webhooks](https://docs.microsoft.com/en-us/azure/devops/service-hooks/test)

---

**Status**: ✅ PRONTO PARA CONFIGURAÇÃO
**Próximo passo**: Siga este guia para configurar o webhook e depois teste criando um work item!