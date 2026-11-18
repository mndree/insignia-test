@echo off
title Crypto Wallet Smoke Test
cd /d "%~dp0"

echo ===================================================
echo     Running Automated Smoke Tests
echo ===================================================
echo.

call npm run test:smoke

echo.
pause
