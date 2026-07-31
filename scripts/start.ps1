[CmdletBinding()]
param(
  [ValidateRange(1, 65535)]
  [int]$Port = 3001,
  [ValidateSet("local", "cloud")]
  [string]$DeploymentMode = "local",
  [string]$DataDir = "",
  [switch]$ExposeRecoveryCode,
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location -LiteralPath $projectRoot

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodePath = if ($nodeCommand) { $nodeCommand.Source } else { "" }
if ([string]::IsNullOrWhiteSpace($nodePath)) {
  $codexNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  if (Test-Path -LiteralPath $codexNode) {
    $nodePath = $codexNode
  }
}
if ([string]::IsNullOrWhiteSpace($nodePath)) {
  throw "Node.js no está disponible. Instala Node.js 20.19 o superior y ejecuta scripts\setup.ps1."
}

$nodeVersionText = (& $nodePath -p "process.versions.node").Trim()
$nodeVersion = [Version]$nodeVersionText
if ($nodeVersion -lt [Version]"20.19.0") {
  throw "La versión instalada de Node.js es $nodeVersionText. Arete requiere Node.js 20.19 o superior."
}

$requiredDependencies = @(
  (Join-Path $projectRoot "node_modules\pdf-lib\package.json"),
  (Join-Path $projectRoot "node_modules\pdfjs-dist\package.json")
)
if ($requiredDependencies | Where-Object { -not (Test-Path -LiteralPath $_) }) {
  Write-Host "Faltan dependencias; se ejecutará la preparación inicial."
  & (Join-Path $PSScriptRoot "setup.ps1")
}

$url = "http://localhost:$Port"
$browserJob = $null
$resolvedDataDir = ""

if ($DeploymentMode -eq "cloud") {
  if ([string]::IsNullOrWhiteSpace($DataDir)) {
    $resolvedDataDir = Join-Path $env:LOCALAPPDATA "Arete\estable"
  } else {
    $resolvedDataDir = [IO.Path]::GetFullPath($DataDir)
  }
  New-Item -ItemType Directory -Path $resolvedDataDir -Force | Out-Null
}

try {
  Write-Host ""
  Write-Host "Iniciando Arete en $url"
  if ($DeploymentMode -eq "cloud") {
    Write-Host "Modo estable con registro y cuentas."
    Write-Host "Datos persistentes: $resolvedDataDir"
  } else {
    Write-Host "Modo local sin cuenta. Los datos permanecen en este navegador."
  }
  Write-Host "Cierra esta ventana o presiona Ctrl+C para detenerlo."
  Write-Host ""

  if (-not $NoBrowser) {
    $browserJob = Start-Job -ScriptBlock {
      param($HealthUrl, $AppUrl)
      for ($attempt = 0; $attempt -lt 60; $attempt += 1) {
        try {
          $health = Invoke-RestMethod -Uri $HealthUrl -TimeoutSec 1
          if ($health.ok -eq $true) {
            Start-Process -FilePath $AppUrl
            return
          }
        } catch {
          Start-Sleep -Milliseconds 150
        }
      }
    } -ArgumentList "$url/api/health", $url
  }

  $env:PORT = [string]$Port
  $env:ARETE_DEPLOYMENT_MODE = $DeploymentMode
  if ($DeploymentMode -eq "cloud") {
    $env:ARETE_DATA_DIR = $resolvedDataDir
  } else {
    Remove-Item Env:ARETE_DATA_DIR -ErrorAction SilentlyContinue
  }
  $env:ARETE_EXPOSE_RECOVERY_CODE = if ($ExposeRecoveryCode) { "true" } else { "false" }
  & $nodePath (Join-Path $projectRoot "backend\src\index.js")
  $serverExitCode = $LASTEXITCODE
  if ($serverExitCode -notin @(0, -1, -1073741510)) {
    throw "El servidor terminó con código $serverExitCode."
  }
  if ($serverExitCode -ne 0) {
    Write-Host "Servidor detenido."
  }
} finally {
  if ($browserJob) {
    Stop-Job -Job $browserJob -ErrorAction SilentlyContinue
    Remove-Job -Job $browserJob -Force -ErrorAction SilentlyContinue
  }
}
