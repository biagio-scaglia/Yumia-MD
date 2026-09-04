@echo off
setlocal
title YumiaMD Live Dev Server

set SLIDE_FILE=%1
if "%SLIDE_FILE%"=="" set SLIDE_FILE=pitch.yumia.md
if not exist "%SLIDE_FILE%" (
    if exist "presentation.yumia.md" (
        set SLIDE_FILE=presentation.yumia.md
    )
)

echo ========================================================
echo    YumiaMD - Live Presentation Dev Server
echo ========================================================
echo.
echo  File in riproduzione: %SLIDE_FILE%
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
echo  Modifica '%SLIDE_FILE%' per vedere l'Hot-Reload in tempo reale!
echo  Premi Ctrl+C per fermare il server.
echo ========================================================
echo.

node packages\cli\dist\bin.js dev "%SLIDE_FILE%" --port 3000 --open

pause

