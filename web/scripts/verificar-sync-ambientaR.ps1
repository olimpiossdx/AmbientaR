param([int]$Minutos=5)

$targets=@(
  'C:\Users\Andrew\OneDrive\Projects\AmbientaR\src\app\(app)\monitoring\telemetric\page.tsx',
  'C:\Users\Andrew\OneDrive\Projects\AmbientaR\src\app\(app)\monitoring\manual\page.tsx',
  'C:\Users\Andrew\OneDrive\Projects\AmbientaR\src\app\(app)\outorgas\outorga-form.tsx',
  'C:\Users\Andrew\OneDrive\Projects\AmbientaR\src\lib\google-maps.ts',
  'C:\Users\Andrew\OneDrive\Projects\AmbientaR\src\lib\types.ts',
  'C:\Users\Andrew\OneDrive\Projects\AmbientaR\src\lib\navigation-config.ts'
)

Write-Host ("AmbientaR sync check (ultimos {0} minutos)" -f $Minutos) -ForegroundColor Cyan
Write-Host ("Agora: {0}" -f (Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))
Write-Host ""

$now = Get-Date

foreach($f in $targets){
  if(Test-Path $f){
    $i = Get-Item $f
    $ageMin = [math]::Round((($now - $i.LastWriteTime).TotalMinutes),2)
    $flag = if($ageMin -le $Minutos){ 'ATUALIZADO' } else { 'OK' }

    Write-Host ("{0} | {1} | {2} min atras" -f $i.Name, $flag, $ageMin)
    Write-Host ("  LastWriteTime: {0}" -f $i.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))
  } else {
    Write-Host ("NAO_ENCONTADO: {0}" -f $f) -ForegroundColor Yellow
  }
}

