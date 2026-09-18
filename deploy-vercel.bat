@echo off
title WeatherWise - Deploy to Free Domain (Vercel)
echo ========================================================
echo   Launching WeatherWise Free Deployment
echo ========================================================
echo.
echo This will guide you to get your free *.vercel.app domain.
echo When asked, press ENTER to accept defaults.
echo.
cd /d "%~dp0"
npx --yes vercel
pause
