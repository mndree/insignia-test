@echo off
title Insignia Test Launcher
cd /d "%~dp0"

echo =====================================================================
echo           Launching Insignia Backend and Frontend Services
echo =====================================================================
echo.
echo  [1/2] Starting NestJS Backend API (Port 3000)...
start "Insignia Backend API (Port 3000)" cmd /k "cd /d "%~dp0insignia-backend" && npm run start:dev"

echo  [2/2] Starting React + Vite Frontend (Port 5173)...
start "Insignia Frontend Dashboard (Port 5173)" cmd /k "cd /d "%~dp0insignia-frontend" && npm run dev"

echo.
echo =====================================================================
echo  Services started in separate terminal windows!
echo.
echo  - Frontend Dashboard: http://localhost:5173
echo  - Backend API:        http://localhost:3000
echo  - Swagger API Docs:   http://localhost:3000/docs
echo =====================================================================
echo.
echo You can close this launcher window at any time.
pause
