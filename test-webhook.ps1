# Script para testar o endpoint webhook
$uri = "http://localhost:3002/webhook/workitem"
$body = @{
    eventType = "workitem.created"
    resource = @{
        id = 123
        workItemType = "User Story"
        fields = @{
            "System.Title" = "Test Work Item"
            "System.Description" = "This is a test work item"
        }
    }
} | ConvertTo-Json -Depth 3

Write-Host "Testing webhook endpoint..."
Write-Host "URL: $uri"
Write-Host "Body: $body"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}