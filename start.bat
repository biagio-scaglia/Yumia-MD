@echo off
chcp 65001 > nul
title YumiaMD Live Dev Server

echo ========================================================
echo    🚀 YumiaMD — Live Presentation Dev Server
echo ========================================================
echo.
echo  Starting dev server with instant Hot-Reload...
echo.
echo  Controlli Disponibili:
echo   - Frecce / Spazio : Navigazione slide
echo   - [ S ]           : Apri Speaker View sincronizzata in 2a finestra
echo   - [ ESC ] o [ O ] : Panoramica a griglia di tutte le slide
echo   - [ F ]           : Modalita a schermo intero (Fullscreen)
echo   - [ N ]           : Mostra / Nascondi cassetto note
echo.
echo  Server URL: http://localhost:3000
echo.
echo  Modifica 'presentation.yumia.md' per vedere l'aggiornamento in tempo reale!
echo  Premi Ctrl+C per arrestare il server.
echo ========================================================
echo.

node packages/cli/dist/bin.js dev presentation.yumia.md --port 3000 --open

pause
