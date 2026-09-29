# PowerShell Launcher for Techno Club FastAPI Backend
$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Techno Club Backend (Port 8000)"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Starting Techno Club FastAPI Backend on Port 8000    " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Check for Python Virtual Environment
$venvPath = Join-Path $scriptDir ".venv"
$venvPython = Join-Path $venvPath "Scripts\python.exe"
$venvActivate = Join-Path $venvPath "Scripts\Activate.ps1"

if (-not (Test-Path $venvPython)) {
    Write-Host "[INFO] Virtual environment not found in backend\.venv" -ForegroundColor Yellow
    Write-Host "[INFO] Creating virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
    
    if (Test-Path $venvActivate) {
        & $venvActivate
    }
    Write-Host "[INFO] Installing requirements..." -ForegroundColor Yellow
    pip install -r requirements.txt
} else {
    if (Test-Path $venvActivate) {
        & $venvActivate
    }
}

Write-Host "Initializing database..." -ForegroundColor Green
python -m app.db.init_db

Write-Host "Starting Uvicorn ASGI Server on http://localhost:8000 ..." -ForegroundColor Green
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

Write-Host ""
Write-Host "[NOTICE] Backend server stopped." -ForegroundColor DarkYellow
Read-Host "Press Enter to exit..."
