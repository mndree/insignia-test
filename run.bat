@echo off
title Insignia Test Launcher
cd /d "%~dp0"

echo =====================================================================
echo           Launching Insignia Backend and Frontend Services
echo =====================================================================
echo.
echo  [1/2] Starting NestJS Backend API (Port 3001)...
start "Insignia Backend API (Port 3001)" cmd /k "cd /d "%~dp0insignia-backend" && set PORT=3001 && npm run start:dev"

echo  [2/2] Starting React + Vite Frontend (Port 5173)...
start "Insignia Frontend Dashboard (Port 5173)" cmd /k "cd /d "%~dp0insignia-frontend" && npm run dev"

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
