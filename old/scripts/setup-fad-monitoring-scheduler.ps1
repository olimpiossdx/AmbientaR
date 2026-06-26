# Cria ou actualiza job Cloud Scheduler para monitoramento FAD.
# Uso:
#   $env:FAD_MONITORING_CRON_SECRET = "seu-segredo"
#   .\scripts\setup-fad-monitoring-scheduler.ps1 -AppUrl "https://sua-app.web.app"
#
# Requer: gcloud auth login, projeto studio-316805764-e4d13

param(
  [Parameter(Mandatory = $true)]
  [string]$AppUrl,
  [string]$Schedule = "0 6 * * *",
  [string]$JobName = "fad-monitoring-daily",
  [string]$Region = "southamerica-east1",
  [string]$Project = "studio-316805764-e4d13"
)

$ErrorActionPreference = "Stop"

$secret = $env:FAD_MONITORING_CRON_SECRET
if (-not $secret) {
  throw "Defina FAD_MONITORING_CRON_SECRET no ambiente antes de executar."
}

$uri = "$($AppUrl.TrimEnd('/'))/api/fiscal-ambiental/monitoring/scheduler/run"

gcloud config set project $Project | Out-Null

$existing = gcloud scheduler jobs describe $JobName --location $Region 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host ">> Actualizar job existente $JobName..."
  gcloud scheduler jobs update http $JobName `
    --location $Region `
    --schedule $Schedule `
    --uri $uri `
    --http-method POST `
    --update-headers "x-fad-cron-secret=$secret" `
    --attempt-deadline 300s
} else {
  Write-Host ">> Criar job $JobName..."
  gcloud scheduler jobs create http $JobName `
    --location $Region `
    --schedule $Schedule `
    --uri $uri `
    --http-method POST `
    --headers "x-fad-cron-secret=$secret" `
    --attempt-deadline 300s
}

Write-Host ""
Write-Host "Job configurado:"
Write-Host "  URI:      $uri"
Write-Host "  Schedule: $Schedule"
Write-Host "Teste manual:"
Write-Host "  gcloud scheduler jobs run $JobName --location $Region"
