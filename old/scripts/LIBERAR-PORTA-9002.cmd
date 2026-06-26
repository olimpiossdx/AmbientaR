@echo off
REM Duplo clique neste arquivo: abre o PowerShell como Administrador e libera a porta 9002.
cd /d "%~dp0"
powershell -NoProfile -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File ""%~dp0liberar-porta-9002-firewall.ps1""'"
echo.
echo Se apareceu o UAC, clique em Sim. A janela do PowerShell mostrara se deu certo.
pause
