param(
  [int]$Port = 3001
)

& (Join-Path $PSScriptRoot "start.ps1") -Port $Port -NoBrowser
