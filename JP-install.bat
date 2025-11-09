@echo off
echo =====================================
echo   🚀 Configurando ambiente do projeto
echo =====================================
echo.

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
echo 🖇️ Criando atalho na área de trabalho...
set "SCRIPT_PATH=%~dp0"
set "TARGET=%SCRIPT_PATH%balance-jp.bat"
set "ICON=%SCRIPT_PATH%public\logo.ico"
set "SHORTCUT_NAME=Balance JP"

set "VBS_FILE=%TEMP%\create_shortcut.vbs"

(
echo Set oWS = WScript.CreateObject("WScript.Shell")
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\%SHORTCUT_NAME%.lnk"
echo Set oLink = oWS.CreateShortcut(sLinkFile)
echo oLink.TargetPath = "%TARGET%"
echo oLink.WorkingDirectory = "%SCRIPT_PATH%"
echo oLink.IconLocation = "%ICON%"
echo oLink.Save
) > "%VBS_FILE%"

cscript //nologo "%VBS_FILE%"
del "%VBS_FILE%"
echo ✅ Atalho criado na área de trabalho com sucesso!
echo.

echo =====================================
echo   🎉 Projeto configurado com sucesso!
echo =====================================
pause
