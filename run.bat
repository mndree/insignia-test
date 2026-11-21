@echo off
title Insignia Test Launcher
cd /d "%~dp0"

echo =====================================================================
echo       Launching Insignia Backend and Frontend Services
echo =====================================================================
echo.

REM Automatically free port 3001 if occupied by any stale or orphaned process
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo  [!] Freeing port 3001 - terminating PID %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo  [1/2] Starting Node.js Backend API (Port 3001)...
start "Insignia Node.js Backend API (Port 3001)" /D "%~dp0insignia-backend" cmd /k "set PORT=3001 && npm run start:dev"

echo  [2/2] Starting React + Vite Frontend (Port 5173)...
start "Insignia Frontend Dashboard (Port 5173)" /D "%~dp0insignia-frontend" cmd /k "npm run dev"

echo.
echo =====================================================================
echo  Services started in separate terminal windows!
echo.
echo  - Frontend Dashboard: http://localhost:5173
echo  - Backend API:        http://localhost:3001
echo  - Swagger API Docs:   http://localhost:3001/docs
echo =====================================================================
echo.
echo You can close this launcher window at any time.
pause
