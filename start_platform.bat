@echo off
title Techno Club Management OS
echo =====================================================================
echo       Starting Techno Club Management & Operations Platform
echo =====================================================================
echo.

cd /d "%~dp0"

echo [1/3] Initializing Database & Seed Records...
cd backend
call .\.venv\Scripts\activate.bat
python -m app.db.init_db
if %errorlevel% neq 0 (
    echo [ERROR] Database initialization failed.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Starting FastAPI Backend on http://localhost:8000 ...
start "Techno Club Backend (Port 8000)" cmd /k "call .\.venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo.
echo [3/3] Starting React Vite Frontend on http://localhost:5173 ...
cd ..\frontend
start "Techno Club Frontend (Port 5173)" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo =====================================================================
echo  Platform is now running!
echo  - Frontend: http://localhost:5173
echo  - Backend API: http://localhost:8000
echo  - Interactive Swagger Docs: http://localhost:8000/docs
echo.
echo  Default Login:
echo    Email: president@technoclub.org
echo    Password: TechnoClub@2026
echo    Or click any 1-Click Evaluation Persona on the sign-in screen!
echo =====================================================================
echo.
start http://localhost:5173
