# Deploy workers FAD no Cloud Run (projeto Firebase/GCP studio-316805764-e4d13)
# Uso: .\scripts\deploy-fad-workers.ps1
# Requer: gcloud auth login, WORKER_SHARED_SECRET no ambiente ou .env.local
#
# -AllowPublicInvoker: Cloud Run acessivel (protegido por X-Worker-Secret). Omissao: $true

param(
  [switch]$AllowPublicInvoker = $true
)

$ErrorActionPreference = "Stop"
$Project = "studio-316805764-e4d13"
$Region = "southamerica-east1"
$Bucket = "studio-316805764-e4d13.firebasestorage.app"

function Invoke-CloudRunDeploy {
  param(
    [string]$ServiceName,
    [string[]]$ExtraArgs
  )
  $maxAttempts = 3
  for ($i = 1; $i -le $maxAttempts; $i++) {
    try {
      & gcloud run deploy $ServiceName @ExtraArgs 2>&1 | Write-Host
      if ($LASTEXITCODE -eq 0) { return }
    } catch {
      Write-Warning $_.Exception.Message
    }
    if ($i -lt $maxAttempts) {
      Write-Warning "Conflito ou falha transitória em $ServiceName - nova tentativa em 15s ($i/$maxAttempts)..."
      Start-Sleep -Seconds 15
    } else {
      throw "Deploy de $ServiceName falhou apos $maxAttempts tentativas."
    }
  }
}

$secret = $env:WORKER_SHARED_SECRET
if (-not $secret) {
  Write-Warning "WORKER_SHARED_SECRET nao definido - configure no Cloud Run apos o deploy."
  $envBlock = "FIREBASE_STORAGE_BUCKET=$Bucket"
} else {
  $envBlock = "FIREBASE_STORAGE_BUCKET=$Bucket,WORKER_SHARED_SECRET=$secret"
}

$authFlag = @()
if ($AllowPublicInvoker) {
  $authFlag = @("--allow-unauthenticated")
}

gcloud config set project $Project | Out-Null

Write-Host ">> Deploy ambientar-fiscal-satellite (GDAL)..."
Push-Location "$PSScriptRoot\..\infra\fiscal-satellite-worker"
Invoke-CloudRunDeploy -ServiceName "ambientar-fiscal-satellite" -ExtraArgs @(
  "--source", ".",
  "--region", $Region,
  "--platform", "managed",
  "--memory", "4Gi",
  "--timeout", "900",
  "--set-env-vars", "$envBlock,INPE_STAC_URL=https://data.inpe.br/bdc/stac/v1",
  "--quiet"
) + $authFlag
Pop-Location

Write-Host ">> Deploy ambientar-fiscal-intelligence..."
Push-Location "$PSScriptRoot\..\infra\fiscal-intelligence-worker"
Invoke-CloudRunDeploy -ServiceName "ambientar-fiscal-intelligence" -ExtraArgs @(
  "--source", ".",
  "--region", $Region,
  "--platform", "managed",
  "--memory", "2Gi",
  "--timeout", "300",
  "--set-env-vars", $envBlock,
  "--quiet"
) + $authFlag
Pop-Location

Write-Host ""
Write-Host "URLs (configure no App Hosting / .env):"
gcloud run services describe ambientar-fiscal-satellite --region $Region --format="value(status.url)"
gcloud run services describe ambientar-fiscal-intelligence --region $Region --format="value(status.url)"
Write-Host "FISCAL_SATELLITE_WORKER_URL e FISCAL_INTELLIGENCE_WORKER_URL"
