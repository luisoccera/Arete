@echo off
cd /d "%~dp0"
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop-test.ps1"
if errorlevel 1 (
  echo.
  echo No se pudo detener la version de pruebas. Revisa el mensaje anterior.
)
pause
