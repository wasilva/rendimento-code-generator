# Script de Teste dos Endpoints do Webhook
# Execute este script para verificar se todos os endpoints estão funcionando

Write-Host "🧪 Testando Endpoints do Redimento Code Generator..." -ForegroundColor Cyan
Write-Host ""

# Função para testar endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Name,
        [string]$Method = "GET"
    )
    
    try {
        Write-Host "🔍 Testando $Name..." -NoNewline
        $response = Invoke-WebRequest -Uri $Url -Method $Method -UseBasicParsing -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅ OK" -ForegroundColor Green
            $content = $response.Content | ConvertFrom-Json
            Write-Host "   Status: $($content.status)" -ForegroundColor Gray
            return $true
        } else {
            Write-Host " ❌ ERRO (Status: $($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host " ❌ FALHOU" -ForegroundColor Red
        Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Testar endpoints
$baseUrl = "http://localhost:3003"
$allPassed = $true

Write-Host "🏥 Testando Health Endpoints:" -ForegroundColor Yellow
$allPassed = (Test-Endpoint "$baseUrl/health" "Sistema Principal") -and $allPassed
$allPassed = (Test-Endpoint "$baseUrl/webhook/health" "Webhook Service") -and $allPassed

Write-Host ""
Write-Host "📡 Informações dos Endpoints:" -ForegroundColor Yellow

try {
    $healthResponse = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing
    $healthData = $healthResponse.Content | ConvertFrom-Json
    Write-Host "   Versão: $($healthData.version)" -ForegroundColor Gray
    Write-Host "   Ambiente: $($healthData.environment)" -ForegroundColor Gray
    Write-Host "   Timestamp: $($healthData.timestamp)" -ForegroundColor Gray
}
catch {
    Write-Host "   ❌ Não foi possível obter informações detalhadas" -ForegroundColor Red
}

try {
    $webhookResponse = Invoke-WebRequest -Uri "$baseUrl/webhook/health" -UseBasicParsing
    $webhookData = $webhookResponse.Content | ConvertFrom-Json
    Write-Host "   Webhook Endpoint: $($webhookData.endpoints.webhook)" -ForegroundColor Gray
}
catch {
    Write-Host "   ❌ Não foi possível obter informações do webhook" -ForegroundColor Red
}

Write-Host ""

if ($allPassed) {
    Write-Host "🎉 TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Configure o webhook no Azure DevOps" -ForegroundColor White
    Write-Host "   2. Use a URL: $baseUrl/webhook/workitem" -ForegroundColor Yellow
    Write-Host "   3. Siga o guia: docs/AZURE_WEBHOOK_VISUAL_GUIDE.md" -ForegroundColor White
} else {
    Write-Host "❌ ALGUNS TESTES FALHARAM!" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Verificações necessárias:" -ForegroundColor Yellow
    Write-Host "   1. O servidor está rodando? Execute: npm run dev" -ForegroundColor White
    Write-Host "   2. A porta 3003 está disponível?" -ForegroundColor White
    Write-Host "   3. Há algum firewall bloqueando?" -ForegroundColor White
}

Write-Host ""
Write-Host "📋 Para mais informações, consulte:" -ForegroundColor Cyan
Write-Host "   - docs/WEBHOOK_SETUP.md" -ForegroundColor White
Write-Host "   - docs/AZURE_WEBHOOK_VISUAL_GUIDE.md" -ForegroundColor White