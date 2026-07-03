# Login Codex CLI com conta ChatGPT (Plus / Pro / Business).
# Executar num PowerShell normal (fora do agente): .\scripts\codex-login.ps1

Set-Location (Split-Path $PSScriptRoot -Parent)
if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
  Write-Host "Codex CLI nao encontrado. Instale: npm install -g @openai/codex" -ForegroundColor Red
  exit 1
}

Write-Host "Codex CLI: $(codex --version)" -ForegroundColor Cyan
Write-Host ""
Write-Host "A seguir abre o fluxo de login (browser ou codigo de dispositivo)." -ForegroundColor Yellow
Write-Host "Use o Gmail da sua conta ChatGPT Business." -ForegroundColor Yellow
Write-Host ""

codex login --device-auth

if ($LASTEXITCODE -eq 0) {
  codex login status
  codex doctor
} else {
  Write-Host "Login nao concluido. Tente de novo ou: codex login (sem --device-auth)" -ForegroundColor Red
}
