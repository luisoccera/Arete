[CmdletBinding()]
param(
  [switch]$SkipVerification
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location -LiteralPath $projectRoot

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$npmCommand = Get-Command npm -ErrorAction SilentlyContinue

if (-not $nodeCommand -or -not $npmCommand) {
  throw "Node.js no está instalado o no está en PATH. Instala Node.js 20.19 o superior desde https://nodejs.org/ y vuelve a ejecutar este archivo."
}

$nodeVersionText = (& $nodeCommand.Source -p "process.versions.node").Trim()
$nodeVersion = [Version]$nodeVersionText
if ($nodeVersion -lt [Version]"20.19.0") {
  throw "La versión instalada de Node.js es $nodeVersionText. Arete requiere Node.js 20.19 o superior."
}

Write-Host "Node.js $nodeVersionText detectado."
Write-Host "Instalando dependencias exactas desde package-lock.json..."
& $npmCommand.Source ci
if ($LASTEXITCODE -ne 0) {
  throw "npm ci terminó con código $LASTEXITCODE."
}

if (-not $SkipVerification) {
  Write-Host "Ejecutando verificación completa..."
  & $npmCommand.Source run verify
  if ($LASTEXITCODE -ne 0) {
    throw "La verificación terminó con código $LASTEXITCODE."
  }
}

Write-Host "Arete quedó preparado correctamente."
