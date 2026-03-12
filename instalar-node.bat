@echo off
:: Instala o Node.js LTS já baixado (execute como Administrador se der erro)
echo.
echo Instalador Node.js LTS encontrado. Iniciando...
echo Se pedir permissao de administrador, aceite.
echo.
start /wait msiexec.exe /i "%TEMP%\nodejs-lts-install.msi"
echo.
echo Concluido. Feche e reabra o Cursor (ou abra um novo terminal) para usar npm.
echo.
pause
