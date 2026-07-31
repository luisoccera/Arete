[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location -LiteralPath $projectRoot

$npmCommand = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCommand) {
  throw "npm no está disponible. Ejecuta primero scripts\setup.ps1."
}

& $npmCommand.Source run verify
if ($LASTEXITCODE -ne 0) {
  throw "La verificación terminó con código $LASTEXITCODE."
}
