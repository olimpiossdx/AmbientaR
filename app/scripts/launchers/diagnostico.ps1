# Diagnóstico: por que o AmbientaR não abre em localhost:9002
# Uso: .\scripts\launchers\diagnostico.ps1

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$logPath = Join-Path $root "diagnostico-resultado.txt"
Set-Location $root

"" | Out-File $logPath -Encoding utf8
"=== Diagnostico AmbientaR $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" | Out-File $logPath -Append -Encoding utf8
"Projeto: $root" | Out-File $logPath -Append -Encoding utf8
"" | Out-File $logPath -Append -Encoding utf8

$nodePaths = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\node\node.exe"
)
$nodeDir = $null
foreach ($p in $nodePaths) {
    if (Test-Path $p) {
        $nodeDir = Split-Path $p -Parent
        "1. Node encontrado: $p" | Out-File $logPath -Append -Encoding utf8
        break
    }
}
if (-not $nodeDir) {
    "1. ERRO: Node.js NAO encontrado." | Out-File $logPath -Append -Encoding utf8
    Get-Content $logPath
    Read-Host "Pressione Enter para fechar"
    exit 1
}

$env:Path = "$nodeDir;$env:Path"
"2. Node: $(& "$nodeDir\node.exe" -v 2>&1) | npm: $(& "$nodeDir\npm.cmd" -v 2>&1)" | Out-File $logPath -Append -Encoding utf8

if (-not (Test-Path "package.json")) {
    "ERRO: package.json nao encontrado em $root" | Out-File $logPath -Append -Encoding utf8
    Get-Content $logPath
    Read-Host "Pressione Enter para fechar"
    exit 1
}

$port = 9002
$conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($conn) {
    "3. Porta $port em uso (PID $($conn.OwningProcess -join ', '))" | Out-File $logPath -Append -Encoding utf8
} else {
    "3. Porta $port livre" | Out-File $logPath -Append -Encoding utf8
}

"" | Out-File $logPath -Append -Encoding utf8
"Concluido. Ver $logPath" | Out-File $logPath -Append -Encoding utf8
Get-Content $logPath
Read-Host "Pressione Enter para fechar"
