@echo off
title Techno Club Frontend (Port 5173)
cd /d "%~dp0"

echo ========================================================
echo   Starting Techno Club React Vite Frontend on Port 5173
echo ========================================================

if not exist ".\node_modules" (
    echo [INFO] node_modules not found. Running npm install...
    call npm install
)

echo Starting Vite Dev Server on http://localhost:5173 ...
call npm run dev

echo.
echo [NOTICE] Frontend server stopped.
pause
