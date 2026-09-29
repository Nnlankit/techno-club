# PowerShell Launcher for Techno Club React Vite Frontend
$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Techno Club Frontend (Port 5173)"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "========================================================" -ForegroundColor Magenta
Write-Host "   Starting Techno Club React Vite Frontend on Port 5173" -ForegroundColor Magenta
Write-Host "========================================================" -ForegroundColor Magenta

# Check for node_modules
$nodeModules = Join-Path $scriptDir "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Host "[INFO] node_modules not found. Running npm install..." -ForegroundColor Yellow
    npm install
}

Write-Host "Starting Vite Dev Server on http://localhost:5173 ..." -ForegroundColor Green
npm run dev

Write-Host ""
Write-Host "[NOTICE] Frontend server stopped." -ForegroundColor DarkYellow
Read-Host "Press Enter to exit..."
