[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$codeCommand = Get-Command code -ErrorAction SilentlyContinue

if ($codeCommand) {
  Start-Process -FilePath $codeCommand.Source -ArgumentList @("--new-window", $projectRoot)
  Write-Host "Proyecto abierto en Visual Studio Code."
  return
}

Write-Host "Visual Studio Code no está disponible en PATH."
Write-Host "Se abrirán la carpeta del proyecto y el archivo principal en el Bloc de notas."
Start-Process -FilePath "explorer.exe" -ArgumentList @($projectRoot)
Start-Process -FilePath "notepad.exe" -ArgumentList @((Join-Path $projectRoot "frontend\index.html"))
