@echo off
title Techno Club Backend (Port 8000)
cd /d "%~dp0"

echo ========================================================
echo   Starting Techno Club FastAPI Backend on Port 8000
echo ========================================================

if not exist ".\.venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found in backend\.venv
    echo Creating virtual environment...
    python -m venv .venv
    call .\.venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call .\.venv\Scripts\activate.bat
)

echo Initializing database...
python -m app.db.init_db

echo Starting Uvicorn ASGI Server on http://localhost:8000 ...
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

echo.
echo [NOTICE] Backend server stopped.
pause
