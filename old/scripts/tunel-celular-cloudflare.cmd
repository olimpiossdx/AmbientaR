@echo off
REM Túnel Cloudflare para acessar o AmbientaR no celular (sem senha, mais estável que LocalTunnel).
REM Terminal 1: npm run dev
REM Terminal 2: execute ESTE arquivo (ou: npm run dev:tunnel:cf depois de instalar o cloudflared)

where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo [ERRO] cloudflared nao encontrado.
  echo.
  echo Instale com UM dos metodos:
  echo   1. winget install Cloudflare.cloudflared
  echo   2. Baixe: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
  echo.
  echo Depois abra um NOVO terminal e rode de novo:
  echo   scripts\tunel-celular-cloudflare.cmd
  echo   OU na pasta do projeto: npm run dev:tunnel:cf
  echo.
  pause
  exit /b 1
)

echo.
echo Iniciando tunel para http://localhost:9002
echo Quando aparecer "trycloudflare.com", abra essa URL no celular (sem senha).
echo.
cloudflared tunnel --url http://localhost:9002
pause
