# Script para testar o processamento completo do webhook
# Simula um webhook do Azure DevOps para verificar se o código está sendo processado

Write-Host "🧪 Testando Processamento Completo do Webhook..." -ForegroundColor Cyan
Write-Host ""

# Payload de exemplo simulando um work item criado no Azure DevOps
$webhookPayload = @{
    eventType = "workitem.created"
    publisherId = "tfs"
    resource = @{
        id = 123
        workItemType = "Task"
        url = "https://dev.azure.com/qacoders-madeinweb/Rendimento/_apis/wit/workItems/123"
        fields = @{
            "System.Title" = "Implementar autenticação de usuário"
            "System.Description" = "Criar sistema de autenticação com JWT para a aplicação"
            "System.WorkItemType" = "Task"
            "System.State" = "New"
            "System.AreaPath" = "Rendimento\Backend"
            "System.AssignedTo" = @{
                displayName = "Desenvolvedor"
            }
        }
    }
    resourceVersion = "1.0"
    resourceContainers = @{
        project = @{
            id = "b1234567-89ab-cdef-0123-456789abcdef"
            name = "Rendimento"
        }
    }
} | ConvertTo-Json -Depth 10

Write-Host "📋 Payload do Webhook:" -ForegroundColor Yellow
Write-Host $webhookPayload -ForegroundColor Gray
Write-Host ""

try {
    Write-Host "📡 Enviando webhook para o servidor..." -NoNewline
    
    $response = Invoke-WebRequest -Uri "http://localhost:3003/webhook/workitem" `
                                 -Method POST `
                                 -Body $webhookPayload `
                                 -ContentType "application/json" `
                                 -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅ SUCESSO" -ForegroundColor Green
        Write-Host ""
        Write-Host "📄 Resposta do Servidor:" -ForegroundColor Yellow
        $responseData = $response.Content | ConvertFrom-Json
        Write-Host "   Status: $($responseData.message)" -ForegroundColor Green
        Write-Host "   Work Item ID: $($responseData.workItemId)" -ForegroundColor Gray
        Write-Host "   Timestamp: $($responseData.timestamp)" -ForegroundColor Gray
        
        if ($responseData.branchName) {
            Write-Host "   Branch Criada: $($responseData.branchName)" -ForegroundColor Green
        }
        
        if ($responseData.pullRequestId) {
            Write-Host "   Pull Request ID: $($responseData.pullRequestId)" -ForegroundColor Green
        }
        
    } else {
        Write-Host " ❌ ERRO (Status: $($response.StatusCode))" -ForegroundColor Red
        Write-Host "Resposta: $($response.Content)" -ForegroundColor Red
    }
    
} catch {
    Write-Host " ❌ FALHOU" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorContent = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $errorContent" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔍 Verificando logs do servidor..." -ForegroundColor Cyan
Write-Host "   Verifique o terminal onde o servidor está rodando para ver os logs detalhados"
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Verifique se uma branch foi criada no repositório" -ForegroundColor White
Write-Host "   2. Verifique se um pull request foi criado" -ForegroundColor White
Write-Host "   3. Verifique se o código foi gerado corretamente" -ForegroundColor White