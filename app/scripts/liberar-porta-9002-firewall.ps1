# Execute este script COMO ADMINISTRADOR (clique direito > Executar com PowerShell como administrador)
# Libera a porta TCP 9002 para acessar o AmbientaR (npm run dev) pelo celular na mesma rede Wi-Fi.

$ruleName = "AmbientaR dev 9002"

$existing = netsh advfirewall firewall show rule name="$ruleName" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Regra '$ruleName' ja existe. Removendo para recriar..."
    netsh advfirewall firewall delete rule name="$ruleName"
}

netsh advfirewall firewall add rule name="$ruleName" dir=in action=allow protocol=TCP localport=9002
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "OK: Porta 9002 liberada no Firewall do Windows."
    Write-Host "No celular use: http://SEU_IP:9002 (veja o IPv4 do Wi-Fi com ipconfig)"
} else {
    Write-Host "ERRO: Execute este arquivo como Administrador (botao direito no PowerShell > Executar como administrador)."
    exit 1
}
