@echo off
REM --- Caminho para a pasta do projeto ---
cd /d "%~dp0"

REM --- Roda npm run start em um terminal minimizado ---
start "" /min cmd /c "npm run start"

REM --- Aguarda alguns segundos para o servidor subir ---
timeout /t 5 /nobreak

REM --- Abre o Chrome ou Edge em modo popup na porta 3000 ---
REM --- Ajuste chrome.exe para o caminho correto se necessário ---
start "" "chrome.exe" --app=http://localhost:3000 --window-size=800,600 --window-position=100,100
