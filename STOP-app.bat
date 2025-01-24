@echo off
:: Arresta il server Node.js (backend)
echo Arresto del server Node.js...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do taskkill /PID %%a /F
echo Server Node.js arrestato.

:: Arresta il processo di Vite (frontend)
echo Arresto del processo Vite...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173"') do taskkill /PID %%a /F
echo Processo Vite arrestato.

:: Chiudi eventuali finestre del prompt dei comandi aperte dal primo batch
echo Chiusura delle finestre del prompt dei comandi...
for /f "tokens=2 delims==" %%a in ('wmic process where "name='cmd.exe'" get ProcessId /format:table ^| findstr "server.js"') do taskkill /PID %%a /F
for /f "tokens=2 delims==" %%a in ('wmic process where "name='cmd.exe'" get ProcessId /format:table ^| findstr "npm run dev"') do taskkill /PID %%a /F
echo Finestre del prompt chiuse.

pause
