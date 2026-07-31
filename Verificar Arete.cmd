@echo off
cd /d "%~dp0"
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\verify.ps1"
if errorlevel 1 (
  echo.
  echo La verificacion encontro errores.
  pause
) else (
  echo.
  echo Todo esta correcto.
  pause
)
