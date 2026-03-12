@echo off
chcp 65001 >nul
title AmbientaR - localhost:9002
cd /d "f:\servidor\onedrive\projects\ambientar"

REM Use o Node que esta em F:\Projects\nodejs
set "NODE=F:\Projects\nodejs"
if not exist "%NODE%\node.exe" (
    echo Node nao encontrado em F:\Projects\nodejs
    echo Use "iniciar-servidor.bat" para procurar em outros locais.
    pause
    exit /b 1
)

set "PATH=%NODE%;%PATH%"
echo Node: %NODE%\node.exe
node -v
echo.

echo Instalando dependencias...
call npm install
if errorlevel 1 (
    echo Erro no npm install.
    pause
    exit /b 1
)

echo.
echo Iniciando servidor em http://localhost:9002
echo Mantenha esta janela aberta. No navegador, abra: http://localhost:9002
echo.
call npm run dev

pause
