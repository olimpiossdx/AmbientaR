# Inicia o AmbientaR na porta 9002.
# Uso: clique duplo ou no PowerShell: .\iniciar-dev-9002.ps1

$port = 9002
$projectPath = $PSScriptRoot

# Encerra qualquer processo usando a porta 9002
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($connections) {
    $connections | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique | ForEach-Object {
        Write-Host "Encerrando processo PID $_ que usa a porta $port..." -ForegroundColor Yellow
        taskkill /PID $_ /F 2>$null
    }
    Start-Sleep -Seconds 2
}

Write-Host "Iniciando Next.js na porta $port..." -ForegroundColor Cyan
Write-Host "Aguarde 'Ready' e abra: http://localhost:$port" -ForegroundColor Green
Write-Host ""

Set-Location $projectPath
npm run dev
