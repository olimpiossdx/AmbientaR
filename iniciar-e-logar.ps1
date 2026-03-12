# Script que inicia o servidor e grava TUDO no log para diagnostico
$logPath = "f:\servidor\onedrive\projects\ambientar\servidor-log.txt"
$projDir = "f:\servidor\onedrive\projects\ambientar"

"=== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" | Out-File $logPath -Encoding utf8
"Diretorio: $projDir" | Out-File $logPath -Append -Encoding utf8

# Procurar Node
$nodePaths = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\node\node.exe",
    "F:\Projects\nodejs\node.exe",
    "$env:APPDATA\nvm\*\node.exe"
)
$nodeDir = $null
foreach ($p in $nodePaths) {
    $resolved = [System.Environment]::ExpandEnvironmentVariables($p)
    if (Test-Path $resolved) {
        $nodeDir = Split-Path $resolved -Parent
        "Node encontrado: $resolved" | Out-File $logPath -Append -Encoding utf8
        break
    }
}
if (-not $nodeDir) {
    "ERRO: Node.js NAO encontrado em nenhum local." | Out-File $logPath -Append -Encoding utf8
    "PATH atual: $env:Path" | Out-File $logPath -Append -Encoding utf8
    exit 1
}

$env:Path = "$nodeDir;$env:Path"
"Node version: $(& "$nodeDir\node.exe" -v 2>&1)" | Out-File $logPath -Append -Encoding utf8
"npm version: $(& "$nodeDir\npm.cmd" -v 2>&1)" | Out-File $logPath -Append -Encoding utf8

Set-Location $projDir
"Executando: npm install" | Out-File $logPath -Append -Encoding utf8
& "$nodeDir\npm.cmd" install 2>&1 | Out-File $logPath -Append -Encoding utf8
"Exit code npm install: $LASTEXITCODE" | Out-File $logPath -Append -Encoding utf8

"Executando: npm run dev" | Out-File $logPath -Append -Encoding utf8
& "$nodeDir\npm.cmd" run dev 2>&1 | Tee-Object -FilePath $logPath -Append -Encoding utf8
