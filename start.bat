@echo off
echo Starting Flame Monitoring System...

echo.
echo [1/3] Starting Backend Server...
cd /d "%~dp0"
start "Backend Server" cmd /k "npm start"

echo.
echo [2/3] Waiting for server to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Starting Frontend...
cd client
start "Frontend" cmd /k "npm start"

echo.
echo System starting up...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul
