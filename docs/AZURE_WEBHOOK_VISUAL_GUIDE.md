# 🎯 Guia Visual: Configuração do Webhook Azure DevOps

## ✅ Status Atual
- **Servidor**: ✅ Rodando em http://localhost:3003
- **Endpoints**: ✅ Funcionando corretamente
- **Azure DevOps**: ✅ Conectado ao projeto "Rendimento"

## 📋 Passo a Passo com Screenshots

### Passo 1: Acessar Azure DevOps
1. Abra seu navegador
2. Vá para: **https://dev.azure.com/qacoders-madeinweb/Rendimento**
3. Faça login se necessário

### Passo 2: Acessar Project Settings
1. No canto **inferior esquerdo** da tela, procure pelo ícone de **⚙️ engrenagem**
2. Clique em **"Project settings"**

### Passo 3: Encontrar Service Hooks
1. No menu lateral **esquerdo**, role para baixo até a seção **"General"**
2. Clique em **"Service hooks"**

### Passo 4: Criar Nova Subscription
1. Clique no botão azul **"+ Create subscription"** (canto superior direito)

### Passo 5: Selecionar Web Hooks
1. Na lista de serviços, procure por **"Web Hooks"**
2. Clique no card **"Web Hooks"**
3. Clique em **"Next"** (canto inferior direito)

### Passo 6: Configurar o Evento
**Configurações obrigatórias:**
- **Event type**: Selecione **"Work item created"**

**Filtros (recomendado):**
- **Work item type**: Deixe em branco OU selecione "Task, Bug, User Story"
- **Area path**: Deixe em branco
- **Changed by**: Deixe em branco

Clique em **"Next"**

### Passo 7: Configurar a URL do Webhook
**Configurações obrigatórias:**
- **URL**: `http://localhost:3003/webhook/workitem`

**Configurações opcionais:**
- **HTTP headers**: Deixe em branco
- **Resource details to send**: **All**
- **Messages to send**: **All**  
- **Detailed messages to send**: **All**

### Passo 8: Testar Antes de Salvar
1. **IMPORTANTE**: Clique em **"Test"** antes de finalizar
2. Você deve ver uma mensagem de sucesso
3. Verifique os logs do seu servidor (terminal onde rodou `npm run dev`)

### Passo 9: Finalizar
1. Se o teste foi bem-sucedido, clique em **"Finish"**
2. Você verá a subscription criada na lista

## 🧪 Teste Completo

### Teste 1: Verificar Endpoints
Execute no PowerShell:
```powershell
# Testar health do sistema
Invoke-WebRequest -Uri "http://localhost:3003/health" -Method GET -UseBasicParsing

# Testar health do webhook
Invoke-WebRequest -Uri "http://localhost:3003/webhook/health" -Method GET -UseBasicParsing
```

**Resultado esperado**: Status 200 e JSON com informações do sistema

### Teste 2: Criar Work Item de Teste
1. No Azure DevOps, vá para **"Boards" → "Work items"**
2. Clique em **"+ New Work Item"**
3. Selecione **"Task"**
4. Preencha:
   - **Title**: "Teste Webhook - Geração Automática"
   - **Description**: "Este work item testa se o webhook está funcionando corretamente"
5. Clique em **"Save & Close"**

### Teste 3: Verificar Logs
No terminal onde o servidor está rodando, você deve ver:
```
info: 📨 Webhook received from Azure DevOps
info: 🎯 Processing work item: Teste Webhook - Geração Automática
info: ✅ Work item processed successfully
```

## 🚨 Resolução de Problemas

### Problema: "Connection refused" no teste
**Solução:**
```bash
# Verificar se o servidor está rodando
npm run dev

# Verificar a porta correta
netstat -an | findstr :3003
```

### Problema: Webhook não recebe dados
**Verificações:**
1. ✅ URL correta: `http://localhost:3003/webhook/workitem`
2. ✅ Servidor rodando na porta 3003
3. ✅ Firewall não está bloqueando
4. ✅ Service hook ativo no Azure DevOps

### Problema: Erro 404 no webhook
**Solução:**
- Verificar se a rota `/webhook/workitem` existe no código
- Testar endpoint de health: `/webhook/health`

### Problema: Erro 500 no webhook
**Solução:**
- Verificar logs detalhados no terminal
- Testar conexão Azure DevOps: `node test-connection.js`
- Verificar variáveis de ambiente no `.env`

## 📊 Monitoramento

### Logs Importantes
Fique atento a estas mensagens nos logs:

**✅ Sucesso:**
```
info: 🚀 Redimento Code Generator started successfully
info: 📨 Webhook received from Azure DevOps
info: ✅ Work item processed successfully
```

**⚠️ Avisos:**
```
warn: ⚠️ Work item missing required fields
warn: 🔄 Retrying operation (attempt 2/3)
```

**❌ Erros:**
```
error: ❌ Failed to process webhook
error: 🚫 Azure DevOps API error
error: 💥 Unexpected error occurred
```

## 🎯 Próximos Passos

Após configurar com sucesso:

1. **✅ Webhook Configurado** → Teste criando work items
2. **✅ Teste Funcionando** → Configure para produção (opcional)
3. **✅ Produção** → Monitore logs e performance

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do servidor
2. Teste os endpoints de health
3. Verifique a configuração do service hook
4. Consulte a documentação técnica em `docs/`

---

**Status**: ✅ **PRONTO PARA CONFIGURAÇÃO**
**Tempo estimado**: 5-10 minutos
**Dificuldade**: Fácil 🟢