@echo off
chcp 65001 >nul
cd /d "%~dp0..\.."

REM Tenta carregar PATH do sistema e do usuário
call :RefreshPath

REM Tenta locais comuns do Node.js (um por vez para evitar parenteses no FOR)
if exist "C:\Program Files\nodejs\node.exe" (
  set "PATH=C:\Program Files\nodejs;%PATH%"
  goto :RunDev
)
if exist "C:\Program Files (x86)\nodejs\node.exe" (
  set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
  goto :RunDev
)
if exist "%LOCALAPPDATA%\Programs\node\node.exe" (
  set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
  goto :RunDev
)
REM NVM for Windows: usa versao padrao
if exist "%APPDATA%\nvm\alias\default" (
  set /p NVM_VER=<"%APPDATA%\nvm\alias\default"
  if exist "%APPDATA%\nvm\%NVM_VER%\node.exe" (
    set "PATH=%APPDATA%\nvm\%NVM_VER%;%PATH%"
    goto :RunDev
  )
)
REM Qualquer versao do NVM
for /d %%D in ("%APPDATA%\nvm\v*") do (
  if exist "%%D\node.exe" (
    set "PATH=%%~D;%PATH%"
    goto :RunDev
  )
)

where npm >nul 2>&1
if %ERRORLEVEL% EQU 0 goto :RunDev

echo.
echo [ERRO] Node.js nao encontrado no PATH.
echo.
echo 1. Instale Node.js em https://nodejs.org (LTS)
echo 2. Reinicie o Cursor e abra um NOVO terminal (Ctrl+Shift+')
echo 3. Neste projeto, rode: npm run dev
echo.
echo Ou execute start-dev.bat na raiz do projeto (duplo-clique).
echo.
pause
exit /b 1

:RunDev
echo Iniciando servidor AmbientaR (porta 9002)...
echo Para parar: Ctrl+C
echo.
npm run dev

:RefreshPath
for /f "tokens=2* delims==" %%a in ('wmic environment where "name='Path' and username='<system>'" get value 2^>nul') do set "SysPath=%%b"
for /f "tokens=2* delims==" %%a in ('wmic environment where "name='Path' and username='%USERNAME%'" get value 2^>nul') do set "UserPath=%%b"
if defined SysPath set "PATH=%SysPath%"
if defined UserPath set "PATH=%UserPath%;%PATH%"
exit /b 0
