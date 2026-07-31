@echo off
cd /d "%~dp0"
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start.ps1" -Port 3001 -DeploymentMode cloud -DataDir "%LOCALAPPDATA%\Arete\estable"
if errorlevel 1 (
  echo.
  echo No se pudo iniciar Arete estable con registro. Revisa el mensaje anterior.
  pause
)
