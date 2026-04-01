# Libera a porta 9002 no Firewall do Windows para acessar o servidor de desenvolvimento
# na rede local (ex.: abrir o app no celular).
# Execute como Administrador: clique direito neste arquivo -> "Executar com PowerShell como administrador".

$port = 9002
$ruleName = "AmbientaR Dev Server (porta $port)"

$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Regra '$ruleName' já existe. Removendo para recriar..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName $ruleName
}

New-NetFirewallRule -DisplayName $ruleName `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $port `
    -Action Allow `
    -Profile Any

if ($?) {
    Write-Host "Porta $port liberada. No celular, use: http://SEU_IP_PC:$port" -ForegroundColor Green
    Write-Host "Para ver o IP do PC: ipconfig (procure por 'IPv4' na sua rede Wi-Fi)." -ForegroundColor Cyan
} else {
    Write-Host "Erro ao criar regra. Execute este script como Administrador." -ForegroundColor Red
}
