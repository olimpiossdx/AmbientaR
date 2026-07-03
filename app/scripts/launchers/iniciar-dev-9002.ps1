# Liberta a porta 9002 e inicia npm run dev.
# Uso: .\scripts\launchers\iniciar-dev-9002.ps1

$port = 9002
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $root

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

npm run dev
