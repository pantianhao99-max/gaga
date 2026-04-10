@echo off
setlocal

set PORT=8110

powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','%~dp0serve-static.ps1','-Port','%PORT%'"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 2"
start "" "http://localhost:%PORT%/"
echo Preview launching at http://localhost:%PORT%/
exit /b 0
