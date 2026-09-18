@echo off
title Upload WeatherWise to GitHub
cls
echo ================================================================
echo         Upload WeatherWise to GitHub (Free Domain Setup)
echo ================================================================
echo.
echo 1. Make sure you created a NEW repository on https://github.com/new
echo    (Name: WeatherWise, Public, leave all checkboxes unchecked)
echo.
set /p REPO_URL="Paste your GitHub repository URL here and press Enter: "

if "%REPO_URL%"=="" (
    echo.
    echo Error: No URL provided. Exiting.
    pause
    exit /b
)

echo.
echo Setting up remote origin to %REPO_URL%...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main

echo.
echo Pushing your files to GitHub...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ================================================================
    echo SUCCESS! Your code is now uploaded to GitHub!
    echo ================================================================
    echo.
    echo Next Step to get your free domain:
    echo 1. Go to your GitHub repository in your browser.
    echo 2. Click 'Settings' -^> 'Pages' on the left menu.
    echo 3. Under 'Branch', select 'main' and click 'Save'.
    echo 4. In 1 minute, your site will be live for everyone!
    echo.
) else (
    echo.
    echo Push failed. If it asks you to sign in, complete the browser login.
    echo.
)

pause
