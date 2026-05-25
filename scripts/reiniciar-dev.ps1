# Reinicia o Next.js dev na porta 9002 (limpa cache e liberta a porta).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Get-NetTCPConnection -LocalPort 9002 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 2
if (Test-Path ".next") {
  Remove-Item -Recurse -Force ".next"
}

Write-Host "A iniciar em http://127.0.0.1:9002 (aguarde Ready, depois abra no browser)..."
npm run dev:turbo
