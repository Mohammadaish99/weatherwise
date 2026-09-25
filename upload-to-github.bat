@echo off
title Upload WeatherWise to GitHub
cls
echo ================================================================
echo         Upload WeatherWise to GitHub (Free Domain Setup)
echo ================================================================
echo.

cd /d "%~dp0"

for /f "tokens=*" %%i in ('git remote get-url origin 2^>nul') do set CURRENT_ORIGIN=%%i

if not "%CURRENT_ORIGIN%"=="" (
    echo Existing GitHub Remote detected:
    echo %CURRENT_ORIGIN%
    echo.
    set /p USE_EXISTING="Upload to this repository? (Y/n): "
    if /i "%USE_EXISTING%"=="n" (
        set /p REPO_URL="Paste your new GitHub repository URL: "
    ) else (
        set REPO_URL=%CURRENT_ORIGIN%
    )
) else (
    echo 1. Make sure you have created a repository on https://github.com/new
    echo    (e.g., https://github.com/YourUsername/weatherwise.git)
    echo.
    set /p REPO_URL="Paste your GitHub repository URL here and press Enter: "
)

if "%REPO_URL%"=="" (
    echo.
    echo Error: No repository URL provided. Exiting.
    pause
    exit /b
)

echo.
echo Setting up remote origin...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main

echo.
echo Staging and committing all project files...
git add -A
git commit -m "update: WeatherWise 3D website and telemetry files" 2>nul

echo.
echo Pushing files to GitHub main branch...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ================================================================
    echo SUCCESS! Your code is updated and live on GitHub!
    echo ================================================================
    echo.
    echo Your GitHub Pages domain will update automatically within 1-2 minutes:
    echo Check repository Settings -> Pages if enabling for the first time.
    echo.
) else (
    echo.
    echo Push failed. Trying pull and push...
    git pull origin main --rebase
    git push -u origin main
)

pause
