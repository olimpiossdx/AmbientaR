@echo off
REM Inicia o Next na porta 9002 usando temp/cache em E: (evita falha quando C: esta cheio).
setlocal
cd /d "%~dp0.."
if not exist ".tmp" mkdir ".tmp"
if not exist ".npm-cache" mkdir ".npm-cache"
set "TEMP=%CD%\.tmp"
set "TMP=%CD%\.tmp"
set "NPM_CONFIG_CACHE=%CD%\.npm-cache"
echo TEMP=%TEMP%
echo Abrindo http://localhost:9002
npm run dev
