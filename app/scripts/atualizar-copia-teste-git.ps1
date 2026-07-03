#Requires -Version 5.1
<#
.SYNOPSIS
  Atualiza D:\Ambientar-testes com git pull (após push em D:\A).
#>
$ErrorActionPreference = 'Stop'
$Dest = 'D:\Ambientar-testes'
if (-not (Test-Path (Join-Path $Dest '.git'))) {
  throw "Pasta não encontrada ou não é repositório Git: $Dest"
}
$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
Push-Location $Dest
try {
  git fetch origin
  git pull origin main
  Write-Host "Pull concluído em $Dest" -ForegroundColor Green
}
finally {
  Pop-Location
}
