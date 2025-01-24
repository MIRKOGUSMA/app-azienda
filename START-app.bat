@echo off
:: Cambia directory al progetto
cd C:\Users\Operatore\app-azienda

:: Mostra un messaggio di avviso nella finestra CMD
title [ATTENZIONE: NON CHIUDERE QUESTA FINESTRA]
echo Questa finestra supporta i servizi in esecuzione in background. NON CHIUDERLA!

:: Avvia il server Node.js (backend) in background
start /min cmd /c "node server.js > server-log.txt 2>&1"

:: Aspetta qualche secondo per assicurarsi che il server sia attivo
timeout /t 3 >nul

:: Avvia Vite (frontend) in background
start /min cmd /c "npm run dev > vite-log.txt 2>&1"

:: Aspetta qualche secondo per assicurarsi che Vite sia attivo
timeout /t 3 >nul

:: Apri il browser sul localhost
start http://localhost:3000
