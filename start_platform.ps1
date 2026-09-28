# PowerShell Platform Launcher for Techno Club Management OS
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "      Starting Techno Club Management & Operations Platform          " -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Initialize Database
Write-Host "[1/3] Initializing Database & Seed Records..." -ForegroundColor Yellow
$backendPython = Join-Path $baseDir "backend\.venv\Scripts\python.exe"
$initScript = "import app.db.init_db; print('Database initialized successfully.')"
& $backendPython -m app.db.init_db

# 2. Launch Backend in new window
Write-Host "[2/3] Launching FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Yellow
$backendDir = Join-Path $baseDir "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

Start-Sleep -Seconds 2

# 3. Launch Frontend in new window
Write-Host "[3/3] Launching Vite Frontend on http://localhost:5173 ..." -ForegroundColor Yellow
$frontendDir = Join-Path $baseDir "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendDir'; npm run dev"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  Platform is running successfully!" -ForegroundColor Green
Write-Host "  - Frontend Portal: http://localhost:5173" -ForegroundColor Green
Write-Host "  - Backend REST API: http://localhost:8000" -ForegroundColor Green
Write-Host "  - Swagger Documentation: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "  Default Credentials:" -ForegroundColor White
Write-Host "    President: president@technoclub.org / TechnoClub@2026" -ForegroundColor White
Write-Host "    Vice President: vp@technoclub.org / TechnoClub@2026" -ForegroundColor White
Write-Host "    AI/ML Head: aiml.head@technoclub.org / TechnoClub@2026" -ForegroundColor White
Write-Host "    Treasurer: treasurer@technoclub.org / TechnoClub@2026" -ForegroundColor White
Write-Host "    Member: member1@technoclub.org / TechnoClub@2026" -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Green

Start-Process "http://localhost:5173"
