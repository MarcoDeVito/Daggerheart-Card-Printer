@echo off
cd /d "%~dp0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :6969 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1
py -m http.server 6989
pause
