param(
  [string]$ServiceAccountKeyPath = $env:SERVICE_ACCOUNT_KEY_PATH,
  [string]$FirebaseStorageBucket = $env:FIREBASE_STORAGE_BUCKET,
  [string]$McpHost = "localhost",
  [int]$Port = 9000
)

if ([string]::IsNullOrWhiteSpace($ServiceAccountKeyPath)) {
  Write-Host "ERRO: SERVICE_ACCOUNT_KEY_PATH nao definido." -ForegroundColor Red
  Write-Host "Defina a variavel de ambiente ou passe -ServiceAccountKeyPath."
  exit 1
}

if (-not (Test-Path $ServiceAccountKeyPath)) {
  Write-Host "ERRO: arquivo de credencial nao encontrado:" -ForegroundColor Red
  Write-Host "  $ServiceAccountKeyPath"
  exit 1
}

if ([string]::IsNullOrWhiteSpace($FirebaseStorageBucket)) {
  Write-Host "AVISO: FIREBASE_STORAGE_BUCKET nao definido. Sera usado o padrao do projeto." -ForegroundColor Yellow
}

$env:SERVICE_ACCOUNT_KEY_PATH = $ServiceAccountKeyPath
if (-not [string]::IsNullOrWhiteSpace($FirebaseStorageBucket)) {
  $env:FIREBASE_STORAGE_BUCKET = $FirebaseStorageBucket
}
$env:MCP_TRANSPORT = "http"
$env:MCP_HTTP_PORT = "$Port"
$env:MCP_HTTP_HOST = $McpHost
$env:MCP_HTTP_PATH = "/mcp"

Write-Host ""
Write-Host "Subindo Firebase MCP em http://$McpHost`:$Port/mcp" -ForegroundColor Cyan
Write-Host "SERVICE_ACCOUNT_KEY_PATH: $ServiceAccountKeyPath"
if (-not [string]::IsNullOrWhiteSpace($FirebaseStorageBucket)) {
  Write-Host "FIREBASE_STORAGE_BUCKET: $FirebaseStorageBucket"
}
Write-Host ""

npx -y @gannonh/firebase-mcp
