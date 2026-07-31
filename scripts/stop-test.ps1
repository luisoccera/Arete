[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$runtimeDir = Join-Path $env:LOCALAPPDATA "Arete"
$pidFile = Join-Path $runtimeDir "arete-pruebas.pid"

if (-not (Test-Path -LiteralPath $pidFile)) {
  Write-Host "No hay una versión de pruebas registrada como activa."
  return
}

$processId = 0
if (-not [int]::TryParse((Get-Content -LiteralPath $pidFile -Raw).Trim(), [ref]$processId)) {
  throw "El identificador guardado del servidor no es válido."
}

$server = Get-Process -Id $processId -ErrorAction SilentlyContinue
if ($server) {
  if ($server.ProcessName -ne "node") {
    throw "El proceso guardado no corresponde a Arete; no se detuvo."
  }
  Stop-Process -Id $processId
  Write-Host "Versión de pruebas detenida."
} else {
  Write-Host "La versión de pruebas ya estaba detenida."
}

Remove-Item -LiteralPath $pidFile -Force
