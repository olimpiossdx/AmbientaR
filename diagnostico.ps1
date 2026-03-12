# Diagnostico: por que o AmbientaR nao abre em localhost:9002
# Execute: clique direito neste arquivo -> "Executar com PowerShell"
# Ou no PowerShell: .\diagnostico.ps1

$logPath = Join-Path $PSScriptRoot "diagnostico-resultado.txt"
$projDir = $PSScriptRoot

"" | Out-File $logPath -Encoding utf8
"=== Diagnostico AmbientaR $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" | Out-File $logPath -Append -Encoding utf8
"" | Out-File $logPath -Append -Encoding utf8

# 1. Procurar Node
$nodePaths = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\node\node.exe",
    "F:\Projects\nodejs\node.exe"
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
    "   Instale em: https://nodejs.org (versao LTS)" | Out-File $logPath -Append -Encoding utf8
    "   Marque 'Add to PATH' e reinicie o PC ou o Cursor." | Out-File $logPath -Append -Encoding utf8
    Get-Content $logPath
    Read-Host "Pressione Enter para fechar"
    exit 1
}

# 2. Versoes
$env:Path = "$nodeDir;$env:Path"
$nv = & "$nodeDir\node.exe" -v 2>&1
$npmv = & "$nodeDir\npm.cmd" -v 2>&1
"2. Node: $nv | npm: $npmv" | Out-File $logPath -Append -Encoding utf8

# 3. npm install
Set-Location $projDir
"3. Executando npm install..." | Out-File $logPath -Append -Encoding utf8
& "$nodeDir\npm.cmd" install 2>&1 | Out-File $logPath -Append -Encoding utf8
"   Exit: $LASTEXITCODE" | Out-File $logPath -Append -Encoding utf8

# 4. Iniciar servidor (em background por 8 segundos para ver se sobe)
"4. Iniciando servidor (aguarde 8 segundos)..." | Out-File $logPath -Append -Encoding utf8
$job = Start-Job -ScriptBlock {
    Set-Location $using:projDir
    $env:Path = "$using:nodeDir;$env:Path"
    & "$using:nodeDir\npm.cmd" run dev 2>&1
}
Start-Sleep -Seconds 8
$out = Receive-Job $job
Stop-Job $job
Remove-Job $job
$out | Out-File $logPath -Append -Encoding utf8
if ($out -match "Ready|started|9002") {
    "5. SUCESSO: servidor parece ter iniciado. Acesse http://localhost:9002" | Out-File $logPath -Append -Encoding utf8
} else {
    "5. Verifique as mensagens acima. Se nao aparecer 'Ready' ou '9002', o servidor nao subiu." | Out-File $logPath -Append -Encoding utf8
}

"" | Out-File $logPath -Append -Encoding utf8
"Fim do diagnostico. Log salvo em: $logPath" | Out-File $logPath -Append -Encoding utf8
Get-Content $logPath
Read-Host "Pressione Enter para fechar"
