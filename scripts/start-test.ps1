[CmdletBinding()]
param(
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$runtimeDir = Join-Path $env:LOCALAPPDATA "Arete"
$pidFile = Join-Path $runtimeDir "arete-pruebas.pid"
$port = 3002
$url = "http://localhost:$port"
$appUrl = "$url/?version=pruebas-local-v1"

New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null

try {
  $health = Invoke-RestMethod -Uri "$url/api/health" -TimeoutSec 1
  if ($health.ok -eq $true -and $health.deploymentMode -eq "local") {
    if (-not $NoBrowser) {
      Start-Process -FilePath $appUrl
    }
    Write-Host "Arete de pruebas locales ya estaba activo."
    return
  }
} catch {
  # No hay un servidor de pruebas activo; se iniciará uno.
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodePath = if ($nodeCommand) { $nodeCommand.Source } else { "" }
if ([string]::IsNullOrWhiteSpace($nodePath)) {
  $codexNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  if (Test-Path -LiteralPath $codexNode) {
    $nodePath = $codexNode
  }
}
if ([string]::IsNullOrWhiteSpace($nodePath)) {
  throw "Node.js no está disponible. Instala Node.js 20.19 o superior y vuelve a ejecutar este archivo."
}

$requiredDependencies = @(
  (Join-Path $projectRoot "node_modules\pdf-lib\package.json"),
  (Join-Path $projectRoot "node_modules\pdfjs-dist\package.json")
)
if ($requiredDependencies | Where-Object { -not (Test-Path -LiteralPath $_) }) {
  & (Join-Path $PSScriptRoot "setup.ps1")
}

$env:PORT = [string]$port
$env:ARETE_DEPLOYMENT_MODE = "local"
Remove-Item Env:ARETE_DATA_DIR -ErrorAction SilentlyContinue
$env:ARETE_EXPOSE_RECOVERY_CODE = "false"

$server = Start-Process `
  -FilePath $nodePath `
  -ArgumentList @((Join-Path $projectRoot "backend\src\index.js")) `
  -WorkingDirectory $projectRoot `
  -PassThru `
  -WindowStyle Hidden

Set-Content -LiteralPath $pidFile -Value ([string]$server.Id) -Encoding ascii

$health = $null
for ($attempt = 0; $attempt -lt 50 -and $null -eq $health; $attempt += 1) {
  Start-Sleep -Milliseconds 200
  if ($server.HasExited) {
    throw "El servidor de cuentas terminó antes de iniciar."
  }
  try {
    $candidate = Invoke-RestMethod -Uri "$url/api/health" -TimeoutSec 1
    if ($candidate.ok -eq $true -and $candidate.deploymentMode -eq "local") {
      $health = $candidate
    }
  } catch {
    # Continúa esperando durante el periodo de arranque.
  }
}

if ($null -eq $health) {
  if (-not $server.HasExited) {
    Stop-Process -Id $server.Id
  }
  throw "Arete no respondió en el puerto $port."
}

if (-not $NoBrowser) {
  Start-Process -FilePath $appUrl
}
Write-Host "Arete de pruebas locales quedó activo en $url"
Write-Host "Los datos de prueba permanecen solamente en este navegador."
Write-Host "Puedes cerrar esta ventana; el servidor seguirá funcionando."
Write-Host "Para detenerlo usa: Detener Arete - Pruebas.cmd"
