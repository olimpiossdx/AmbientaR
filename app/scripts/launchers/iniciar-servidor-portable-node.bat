@echo off
title AmbientaR - Servidor local (Node portátil na raiz)
cd /d "%~dp0..\.."
set NODE_DIR=%~dp0..\..\node-v22.22.1-win-x64
set PATH=%NODE_DIR%;%PATH%
echo Iniciando Next.js na porta 9002...
echo Acesse: http://localhost:9002
echo.
if not exist "%NODE_DIR%\node.exe" (
  echo Node portatil nao encontrado em %NODE_DIR%
  echo Use start-dev.bat ou npm run dev com Node instalado no sistema.
  pause
  exit /b 1
)
"%NODE_DIR%\node.exe" "%~dp0..\..\node_modules\next\dist\bin\next" dev --turbo -p 9002 -H 0.0.0.0
pause
