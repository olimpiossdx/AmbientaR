#Requires -Version 5.1
<#
.SYNOPSIS
  Copia o working tree de D:\A para D:\Ambientar-testes (cópia de testes), sem sobrescrever o .git da cópia.

.DESCRIPTION
  Útil para testar em D:\Ambientar-testes alterações que ainda não foram commitadas em D:\A.
  Exclui: .git, node_modules, .next, out, venv, caches e ficheiros .env / .env.local na raiz.
#>
$ErrorActionPreference = 'Stop'
$Source = 'D:\A'
$Dest = 'D:\Ambientar-testes'

if (-not (Test-Path $Source)) { throw "Origem não encontrada: $Source" }
if (-not (Test-Path (Join-Path $Dest '.git'))) {
  throw "Destino não é um clone Git. Crie com: git clone <url> $Dest"
}

$excludeDirs = @(
  '.git', 'node_modules', '.next', 'out', 'venv', '.turbo', '.cursor', '.idx', '.firebase'
)

$robArgs = @(
  $Source, $Dest, '/E', '/COPY:DAT', '/R:1', '/W:2', '/NFL', '/NDL', '/NJH', '/NJS',
  '/XF', '.env.local', '/XF', '.env'
)
foreach ($d in $excludeDirs) {
  $robArgs += '/XD'
  $robArgs += $d
}

Write-Host "Robocopy: $Source -> $Dest" -ForegroundColor Cyan
$code = & robocopy @robArgs
if ($code -ge 8) { throw "Robocopy falhou com código $code" }
Write-Host "Concluído (código robocopy: $code)." -ForegroundColor Green
