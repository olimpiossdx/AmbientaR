# Inicia o servidor AmbientaR — uso: .\scripts\launchers\start-dev.ps1
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $root

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$env:Path = "$userPath;$machinePath;$env:Path"

$nodePaths = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:LOCALAPPDATA\Programs\node"
)
foreach ($p in $nodePaths) {
    if (Test-Path "$p\node.exe") { $env:Path = "$p;$env:Path"; break }
}

try { $null = Get-Command npm -ErrorAction Stop }
catch {
    Write-Host "`n[ERRO] npm nao encontrado. Instale Node.js em https://nodejs.org e reinicie o Cursor.`n" -ForegroundColor Red
    exit 1
}

Write-Host "`nIniciando AmbientaR (porta 9002)... Ctrl+C para parar.`n" -ForegroundColor Green
npm run dev
