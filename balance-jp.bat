@echo off
setlocal ENABLEDELAYEDEXPANSION
title 🚀 Configuração e Inicialização do Projeto

echo =====================================
echo   🚀 Configurando ambiente do projeto
echo =====================================
echo.

REM --- Caminho do projeto ---
cd /d "%~dp0"

REM --- Criar o arquivo .env ---
echo DATABASE_URL="file:./dev.db" > .env
echo NEXTAUTH_SECRET="dfVCPnHrEBBmY5uuOrL55tGpcQuaT2PLA8U/IAFaMEdy9U=" >> .env
echo NEXTAUTH_URL="http://localhost:3000" >> .env
echo ✅ Arquivo .env criado com sucesso!
echo.

REM --- Instalar dependências ---
if exist package-lock.json (
    echo 📦 Instalando dependências com npm...
    npm install
) else if exist yarn.lock (
    echo 📦 Instalando dependências com yarn...
    yarn install
) else (
    echo ⚠️ Nenhum lockfile encontrado. Executando npm install por padrão...
    npm install
)
echo.

REM --- Configurar o Prisma ---
echo 🔧 Rodando migrations e gerando cliente Prisma...
npx prisma migrate dev --name init
npx prisma generate
echo ✅ Prisma configurado com sucesso!
echo.

REM --- Build do projeto ---
echo 🏗️ Rodando build do projeto Next.js...
npm run build
echo ✅ Build concluído!
echo.

REM --- Criar atalho na área de trabalho ---
echo 🧩 Criando atalho "balance-jp.bat" na área de trabalho...
set "DESKTOP_PATH=%USERPROFILE%\Desktop"
set "PROJECT_PATH=%~dp0"
set "SCRIPT_PATH=%PROJECT_PATH%balance-jp.bat"
set "ICON_PATH=%PROJECT_PATH%public\logo.ico"

if exist "%SCRIPT_PATH%" (
    powershell -Command ^
    "$WshShell = New-Object -ComObject WScript.Shell; ^
    $Shortcut = $WshShell.CreateShortcut('%DESKTOP_PATH%\Balance JP.lnk'); ^
    $Shortcut.TargetPath = '%SCRIPT_PATH%'; ^
    $Shortcut.IconLocation = '%ICON_PATH%'; ^
    $Shortcut.WorkingDirectory = '%PROJECT_PATH%'; ^
    $Shortcut.Save()"
    echo ✅ Atalho criado na área de trabalho!
) else (
    echo ⚠️ O arquivo balance-jp.bat não foi encontrado na pasta raiz.
)
echo.

REM --- Iniciar o servidor local ---
echo 🚀 Iniciando o servidor local (npm run start)...
start "" /min cmd /c "npm run start"

REM --- Esperar o servidor subir ---
echo ⏳ Aguardando servidor iniciar...
timeout /t 5 /nobreak >nul

REM --- Iniciar ngrok em nova janela ---
echo 🌍 Iniciando ngrok (porta 3000)...
start "" /min cmd /c "ngrok http 3000"

REM --- Esperar o ngrok gerar o link público ---
echo ⏳ Aguardando link público do ngrok...
timeout /t 7 /nobreak >nul

REM --- Capturar URL pública do ngrok (requer ngrok authtoken configurado) ---
for /f "tokens=2 delims=:" %%A in ('curl -s http://127.0.0.1:4040/api/tunnels ^| findstr /i "public_url"') do (
    set "NGROK_URL=%%A"
)
set "NGROK_URL=%NGROK_URL:~2,-2%"

if defined NGROK_URL (
    echo 🌐 Link público detectado: %NGROK_URL%
    echo Abrindo navegador no link do ngrok...
    start "" "chrome.exe" --app=%NGROK_URL% --window-size=900,700 --window-position=100,100
) else (
    echo ⚠️ Não foi possível capturar o link público do ngrok automaticamente.
    echo Abra manualmente o terminal do ngrok para ver o link.
    start "" "chrome.exe" --app=http://localhost:3000 --window-size=900,700 --window-position=100,100
)

echo.
echo =====================================
echo   🎉 Tudo pronto! Servidor em execução.
echo =====================================
pause
