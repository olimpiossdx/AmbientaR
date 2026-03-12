@echo off
title AmbientaR - Servidor local
set NODE_DIR=%~dp0node-v22.22.1-win-x64
set PATH=%NODE_DIR%;%PATH%
cd /d "%~dp0"
echo Iniciando Next.js na porta 9002...
echo Acesse: http://localhost:9002
echo.
"%NODE_DIR%\node.exe" "%~dp0node_modules\next\dist\bin\next" dev --turbo -p 9002 -H 0.0.0.0
pause
