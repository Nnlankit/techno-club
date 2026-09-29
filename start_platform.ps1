# PowerShell Platform Launcher for Techno Club Management OS
# Designed to run directly inside VS Code's integrated PowerShell terminal
# without popping up any external CMD, PowerShell, or browser windows.
param(
    [switch]$OpenBrowser,
    [switch]$SeparateWindows
)

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $baseDir) { $baseDir = Get-Location }

# Option: Separate Windows (only if explicitly requested via -SeparateWindows)
if ($SeparateWindows) {
    $backendPs1 = Join-Path $baseDir "backend\run_backend.ps1"
    $frontendPs1 = Join-Path $baseDir "frontend\run_frontend.ps1"
    $psExe = if (Get-Command pwsh -ErrorAction SilentlyContinue) { "pwsh.exe" } else { "powershell.exe" }

    Write-Host "[1/2] Launching Backend in external window..." -ForegroundColor Yellow
    Start-Process $psExe -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$backendPs1`""

    Start-Sleep -Seconds 2

    Write-Host "[2/2] Launching Frontend in external window..." -ForegroundColor Yellow
    Start-Process $psExe -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$frontendPs1`""

    if ($OpenBrowser) {
        Start-Process "http://localhost:5173"
    }
    exit
}

# Default Mode: Run 100% inside the current VS Code terminal (No external windows!)
$venvPy = Join-Path $baseDir "backend\.venv\Scripts\python.exe"
$pyExe = if (Test-Path $venvPy) { $venvPy } else { "python" }
$startPy = Join-Path $baseDir "start.py"

$pyArgs = @($startPy)
if ($OpenBrowser) {
    $pyArgs += "--open-browser"
}

# Run directly within the active VS Code terminal
& $pyExe @pyArgs
