# Abre o túnel Cloudflare para o AmbientaR na porta 9002 (celular não usa IP da LAN).
# Pré-requisito: em outro terminal, `npm run dev` ou `npm run dev:turbo` já a correr.
# Depois de abrir, copie do terminal a URL https://....trycloudflare.com para o telemóvel.

$ErrorActionPreference = "Stop"
$env:Path =
  [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
  [System.Environment]::GetEnvironmentVariable("Path", "User")

$cf = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cf) {
  Write-Host ""
  Write-Host "[ERRO] cloudflared não encontrado no PATH."
  Write-Host "Instale: winget install Cloudflare.cloudflared"
  Write-Host "Feche e reabra o terminal (ou o Cursor) e volte a executar este script."
  Write-Host ""
  exit 1
}

$listen = Get-NetTCPConnection -LocalPort 9002 -State Listen -ErrorAction SilentlyContinue
if (-not $listen) {
  Write-Warning "Nada a escutar na porta 9002. Inicie antes o servidor: npm run dev ou npm run dev:turbo"
}

$root = Split-Path $PSScriptRoot -Parent

Start-Process -FilePath $cf.Source -ArgumentList @("tunnel", "--url", "http://localhost:9002") -WorkingDirectory $root -WindowStyle Normal
Write-Host ""
Write-Host "Janela do túnel aberta. Quando aparecer https://....trycloudflare.com, abra essa URL no browser do celular."
Write-Host "Mantenha esta janela e a do npm run dev abertas enquanto testa."
Write-Host ""
