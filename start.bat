@echo off
setlocal
title YumiaMD Live Dev Server

echo ========================================================
echo    YumiaMD - Live Presentation Dev Server
echo ========================================================
echo.
echo  Controlli da tastiera:
echo   - Frecce / Spazio : Navigazione slide
echo   - [ S ]           : Apri Speaker View sincronizzata in 2a finestra
echo   - [ ESC ] / [ O ] : Panoramica a griglia di tutte le slide
echo   - [ F ]           : Modalita Schermo Intero (Fullscreen)
echo   - [ N ]           : Mostra / Nascondi cassetto note
echo.
echo  Server URL: http://localhost:3000
echo.
echo  Modifica 'presentation.yumia.md' per vedere l'Hot-Reload in tempo reale!
echo  Premi Ctrl+C per fermare il server.
echo ========================================================
echo.

node packages\cli\dist\bin.js dev presentation.yumia.md --port 3000 --open

pause
